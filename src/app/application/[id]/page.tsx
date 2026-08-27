import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { ApplicationDetail } from "@/components/application-detail";

export const metadata = { title: "Application — CivicDrive" };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    include: {
      rto: true,
      payment: true,
      appointment: { include: { slot: true } },
      documents: {
        select: { id: true, type: true, fileName: true, mimeType: true, status: true, uploadedAt: true },
      },
      history: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!app) notFound();
  if (app.userId !== user.id && user.role !== ROLES.ADMIN) notFound();

  return (
    <ApplicationDetail
      canManage={app.userId === user.id}
      app={{
        id: app.id,
        applicationNumber: app.applicationNumber,
        type: app.type,
        status: app.status,
        fullName: app.fullName,
        fatherName: app.fatherName,
        dob: app.dob,
        gender: app.gender,
        bloodGroup: app.bloodGroup,
        address: `${app.houseNo}, ${app.street}, ${app.city}, ${app.state} — ${app.pincode}`,
        correctionNote: app.correctionNote,
        licenceNumber: app.licenceNumber,
        createdAt: app.createdAt.toISOString(),
        rtoName: app.rto.name,
        rtoCode: app.rto.code,
        rtoAddress: app.rto.address,
        payment: app.payment
          ? {
              txnId: app.payment.txnId,
              amount: app.payment.amount,
              baseFee: app.payment.baseFee,
              convenienceFee: app.payment.convenienceFee,
              method: app.payment.method,
            }
          : null,
        slotDate: app.appointment?.slot.date ?? null,
        slotTime: app.appointment?.slot.time ?? null,
        documents: app.documents.map((d) => ({
          id: d.id,
          type: d.type,
          fileName: d.fileName,
          mimeType: d.mimeType,
          status: d.status,
        })),
        history: app.history.map((h) => ({
          id: h.id,
          status: h.status,
          message: h.message,
          actor: h.actor,
          createdAt: h.createdAt.toISOString(),
        })),
      }}
    />
  );
}
