"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { STATUS } from "@/lib/constants";
import { generateLicenceNumber } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

async function notify(userId: string, title: string, body: string, link: string) {
  await db.notification.create({
    data: { userId, title, body, link },
  });
}

export async function verifyDocuments(applicationId: string): Promise<Result> {
  const admin = await requireAdmin();

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.status !== STATUS.SUBMITTED && app.status !== STATUS.CORRECTION_REQUIRED) {
    return { ok: false, error: "Only submitted applications can be verified." };
  }

  await db.$transaction([
    db.document.updateMany({ where: { applicationId }, data: { status: "VERIFIED" } }),
    db.application.update({
      where: { id: applicationId },
      data: { status: STATUS.DOCS_VERIFIED, correctionNote: null },
    }),
    db.statusHistory.create({
      data: {
        applicationId,
        status: STATUS.DOCS_VERIFIED,
        message: "Documents verified by reviewing officer.",
        actor: `ADMIN (${admin.name})`,
      },
    }),
  ]);

  await notify(
    app.userId,
    "Documents verified ✓",
    `${app.applicationNumber}: your documents are verified. Fee payment (₹${400}) is now due.`,
    `/application/${applicationId}`,
  );

  revalidatePath("/admin");
  revalidatePath(`/application/${applicationId}`);
  return { ok: true };
}

export async function requestCorrection(applicationId: string, note: string): Promise<Result> {
  const admin = await requireAdmin();
  if (note.trim().length < 10) return { ok: false, error: "Please tell the applicant what to fix (at least 10 characters)." };

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.status !== STATUS.SUBMITTED && app.status !== STATUS.CORRECTION_REQUIRED) {
    return { ok: false, error: "Corrections can only be requested for submitted applications." };
  }

  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status: STATUS.CORRECTION_REQUIRED, correctionNote: note.trim() },
    }),
    db.statusHistory.create({
      data: {
        applicationId,
        status: STATUS.CORRECTION_REQUIRED,
        message: note.trim(),
        actor: `ADMIN (${admin.name})`,
      },
    }),
  ]);

  await notify(
    app.userId,
    "Correction requested",
    `${app.applicationNumber}: ${note.trim()}`,
    `/application/${applicationId}`,
  );

  revalidatePath("/admin");
  revalidatePath(`/application/${applicationId}`);
  return { ok: true };
}

export async function rejectApplication(applicationId: string, reason: string): Promise<Result> {
  const admin = await requireAdmin();
  if (reason.trim().length < 10) return { ok: false, error: "Please provide a rejection reason (at least 10 characters)." };

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, error: "Application not found." };
  if ([STATUS.APPROVED, STATUS.REJECTED].includes(app.status as never)) {
    return { ok: false, error: "This application is already closed." };
  }

  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status: STATUS.REJECTED, correctionNote: reason.trim() },
    }),
    db.statusHistory.create({
      data: {
        applicationId,
        status: STATUS.REJECTED,
        message: reason.trim(),
        actor: `ADMIN (${admin.name})`,
      },
    }),
  ]);

  await notify(
    app.userId,
    "Application rejected",
    `${app.applicationNumber}: ${reason.trim()}`,
    `/application/${applicationId}`,
  );

  revalidatePath("/admin");
  revalidatePath(`/application/${applicationId}`);
  return { ok: true };
}

export async function approveApplication(applicationId: string): Promise<Result> {
  const admin = await requireAdmin();

  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return { ok: false, error: "Application not found." };
  if (app.status !== STATUS.APPOINTMENT_BOOKED) {
    return { ok: false, error: "A licence can be issued only after the test appointment stage." };
  }
  if (app.licenceNumber) return { ok: false, error: "This licence is already issued." };

  const licenceNumber = generateLicenceNumber(app.applicationNumber);

  await db.$transaction([
    db.application.update({
      where: { id: applicationId },
      data: { status: STATUS.APPROVED, licenceNumber },
    }),
    db.statusHistory.create({
      data: {
        applicationId,
        status: STATUS.APPROVED,
        message: `Driving test cleared. Licence ${licenceNumber} issued.`,
        actor: `ADMIN (${admin.name})`,
      },
    }),
  ]);

  await notify(
    app.userId,
    "🎉 Licence approved!",
    `${app.applicationNumber} is approved. Licence no. ${licenceNumber}. Your digital licence is ready to view.`,
    `/application/${applicationId}`,
  );

  revalidatePath("/admin");
  revalidatePath(`/application/${applicationId}`);
  return { ok: true };
}
