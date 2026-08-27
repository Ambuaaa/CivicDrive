import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { AdminReviewPanel } from "@/components/admin-review-panel";

export const metadata = { title: "Review application — CivicDrive Admin" };

export default async function AdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== ROLES.ADMIN) redirect("/dashboard");

  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    include: {
      rto: true,
      payment: true,
      user: { select: { phone: true } },
      appointment: { include: { slot: true } },
      documents: {
        select: { id: true, type: true, fileName: true, mimeType: true, status: true },
      },
      history: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!app) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to queue
      </Link>

      <AdminReviewPanel
        adminName={user.name}
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
          phone: app.user.phone ?? null,
          address: `${app.houseNo}, ${app.street}, ${app.city}, ${app.state} — ${app.pincode}`,
          correctionNote: app.correctionNote,
          licenceNumber: app.licenceNumber,
          createdAt: app.createdAt.toISOString(),
          rtoName: app.rto.name,
          rtoCode: app.rto.code,
          payment: app.payment
            ? { txnId: app.payment.txnId, amount: app.payment.amount }
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
    </div>
  );
}
