"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { STATUS, feeFor } from "@/lib/constants";
import {
  bookSlotSchema,
  paySchema,
  submitApplicationSchema,
} from "@/lib/validation";
import { mockPaymentProvider } from "@/lib/payments";

type Result<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function flatten(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

async function nextApplicationNumber(): Promise<string> {
  // Atomic enough for SQLite: timestamp + random suffix, uniqueness enforced by DB unique constraint
  const year = new Date().getFullYear();
  const suffix = `${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
  return `CD-${year}-${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Step 1 of the journey: submit the guided application                */
/* ------------------------------------------------------------------ */

export async function submitApplication(
  input: unknown,
): Promise<Result<{ applicationId: string; applicationNumber: string }>> {
  const user = await requireUser();
  const parsed = submitApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: flatten(parsed.error) };
  }

  const rto = await db.rto.findUnique({ where: { id: parsed.data.rtoId } });
  if (!rto) return { ok: false, error: "Please choose a valid RTO office.", fieldErrors: { rtoId: "Select your RTO" } };

  const d = parsed.data;
  const applicationNumber = await nextApplicationNumber();

  const application = await db.application.create({
    data: {
      applicationNumber,
      userId: user.id,
      type: d.type,
      vehicleClass: d.vehicleClass,
      status: STATUS.SUBMITTED,
      kycProvider: d.kycProvider,
      digilockerId: d.digilockerId ?? null,
      fullName: d.personal.fullName,
      dob: d.personal.dob,
      gender: d.personal.gender,
      fatherName: d.personal.fatherName,
      bloodGroup: d.personal.bloodGroup ?? null,
      houseNo: d.address.houseNo,
      street: d.address.street,
      city: d.address.city,
      state: d.address.state,
      pincode: d.address.pincode,
      rtoId: d.rtoId,
      documents: {
        create: d.documents.map((doc) => ({
          type: doc.type,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          data: doc.dataUrl,
          status: d.kycProvider === "DIGILOCKER" ? "VERIFIED" : "PENDING",
          verificationId: d.kycProvider === "DIGILOCKER" ? d.digilockerId ?? null : null,
        })),
      },
      history: {
        create: {
          status: STATUS.SUBMITTED,
          message:
            d.kycProvider === "DIGILOCKER"
              ? "Application submitted via DigiLocker — docs pre-verified."
              : "Application submitted with all documents.",
          actor: "CITIZEN",
        },
      },
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      title: "Application submitted",
      body: `${applicationNumber} was received. An RTO officer will verify your documents next.`,
      link: `/application/${application.id}`,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true, data: { applicationId: application.id, applicationNumber } };
}

/* ------------------------------------------------------------------ */
/* Mock payment                                                        */
/* ------------------------------------------------------------------ */

export async function payFee(
  input: unknown,
): Promise<Result<{ txnId: string }>> {
  const user = await requireUser();
  const parsed = paySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a payment method to continue." };

  const app = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { payment: true },
  });
  if (!app || app.userId !== user.id) return { ok: false, error: "Application not found." };
  if (app.payment) return { ok: false, error: "This application is already paid." };

  if (app.status !== STATUS.DOCS_VERIFIED) {
    return {
      ok: false,
      error: "An officer needs to verify your documents first — we will notify you when payment is due.",
    };
  }

  const fees = feeFor(app.type, app.vehicleClass);
  const result = await mockPaymentProvider.createPayment({
    amount: fees.total,
    applicationNumber: app.applicationNumber,
    method: parsed.data.method,
  });
  if (result.status !== "SUCCESS") {
    return { ok: false, error: "Payment failed at gateway — please try again." };
  }

  await db.payment.create({
    data: {
      applicationId: app.id,
      txnId: result.txnId,
      amount: fees.total,
      baseFee: fees.base,
      convenienceFee: fees.convenience,
      method: parsed.data.method,
      status: result.status,
      gatewayRef: result.gatewayRef,
      receiptUrl: result.receiptUrl,
    },
  });
  const txnId = result.txnId;

  const newStatus = STATUS.FEE_PAID;

  await db.application.update({
    where: { id: app.id },
    data: { status: newStatus },
  });

  await db.statusHistory.create({
    data: {
      applicationId: app.id,
      status: newStatus,
      message: `Payment successful. Transaction ID ${txnId}.`,
      actor: "PAYMENT_GATEWAY",
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      title: "Payment successful",
      body: `We received ₹${fees.total} for ${app.applicationNumber}. Txn ID: ${txnId}. Next: book your RTO slot.`,
      link: `/application/${app.id}`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/application/${app.id}`);
  return { ok: true, data: { txnId } };
}

/* ------------------------------------------------------------------ */
/* Appointment booking — double-booking impossible by DB constraint    */
/* ------------------------------------------------------------------ */

export async function bookAppointment(
  input: unknown,
): Promise<Result<{ date: string; time: string }>> {
  const user = await requireUser();
  const parsed = bookSlotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick an available slot first." };

  const app = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { appointment: true, rto: true },
  });
  if (!app || app.userId !== user.id) return { ok: false, error: "Application not found." };
  if (app.appointment) return { ok: false, error: "You already have an appointment booked." };
  if (app.status !== STATUS.FEE_PAID && app.status !== STATUS.DOCS_VERIFIED) {
    return { ok: false, error: "Complete the previous steps before booking." };
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: parsed.data.slotId } });
      if (!slot) throw new Error("SLOT_GONE");

      await tx.appointment.create({
        data: { applicationId: app.id, slotId: slot.id },
      });

      const newStatus = STATUS.APPOINTMENT_BOOKED;
      await tx.application.update({
        where: { id: app.id },
        data: { status: newStatus },
      });

      await tx.statusHistory.create({
        data: {
          applicationId: app.id,
          status: newStatus,
          message: `Slot booked: ${slot.date} at ${slot.time}.`,
          actor: "CITIZEN",
        },
      });

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "Appointment confirmed",
          body: `${slot.date} at ${slot.time}, ${app.rto.name} (${app.rto.code}). Carry your originals for verification.`,
          link: `/application/${app.id}`,
        },
      });

      return slot;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/application/${app.id}`);
    return { ok: true, data: { date: created.date, time: created.time } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SLOT_GONE") return { ok: false, error: "That slot was just taken — please pick another." };
    // Unique violation => someone booked this slot milliseconds earlier
    return { ok: false, error: "Sorry, that slot was just booked by someone else. Pick another slot." };
  }
}

/* ------------------------------------------------------------------ */
/* Re-upload documents after a correction request                      */
/* ------------------------------------------------------------------ */

export async function resubmitDocuments(
  input: { applicationId: string; documents: { type: string; fileName: string; mimeType: string; dataUrl: string }[] },
): Promise<Result<{ applicationId: string }>> {
  const user = await requireUser();
  const app = await db.application.findUnique({ where: { id: input.applicationId } });
  if (!app || app.userId !== user.id) return { ok: false, error: "Application not found." };
  if (input.documents.length !== 3) return { ok: false, error: "Please upload all 3 documents." };

  await db.$transaction([
    db.document.deleteMany({ where: { applicationId: app.id } }),
    db.document.createMany({
      data: input.documents.map((d) => ({
        applicationId: app.id,
        type: d.type,
        fileName: d.fileName,
        mimeType: d.mimeType,
        data: d.dataUrl,
        status: "PENDING",
      })),
    }),
    db.application.update({
      where: { id: app.id },
      data: { status: STATUS.SUBMITTED, correctionNote: null },
    }),
    db.statusHistory.create({
      data: {
        applicationId: app.id,
        status: STATUS.SUBMITTED,
        message: "Corrected documents re-uploaded by applicant.",
        actor: "CITIZEN",
      },
    }),
    db.notification.create({
      data: {
        userId: user.id,
        title: "Documents re-uploaded",
        body: `Your corrected documents for ${app.applicationNumber} are queued for review again.`,
        link: `/application/${app.id}`,
      },
    }),
  ]);

  revalidatePath(`/application/${app.id}`);
  return { ok: true, data: { applicationId: app.id } };
}
