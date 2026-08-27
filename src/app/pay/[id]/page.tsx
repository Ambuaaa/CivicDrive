import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { feeFor } from "@/lib/constants";
import { PayForm } from "@/components/pay-form";

export const metadata = { title: "Pay fee — CivicDrive" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      applicationNumber: true,
      fullName: true,
      payment: true,
    },
  });
  if (!app || app.userId !== user.id) notFound();
  if (app.payment) redirect(`/application/${app.id}`);

  const fees = feeFor(app.type);

  return (
    <PayForm
      applicationId={app.id}
      applicationNumber={app.applicationNumber}
      applicantName={app.fullName}
      status={app.status}
      baseFee={fees.base}
      convenienceFee={fees.convenience}
    />
  );
}
