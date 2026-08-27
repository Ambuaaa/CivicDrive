import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardContent, type DashboardApplication } from "@/components/dashboard-content";

export const metadata = { title: "My dashboard — CivicDrive" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [applications, notifications] = await Promise.all([
    db.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        applicationNumber: true,
        type: true,
        status: true,
        correctionNote: true,
        licenceNumber: true,
        createdAt: true,
        rto: { select: { code: true, name: true } },
        appointment: { select: { slot: { select: { date: true, time: true } } } },
        payment: { select: { amount: true } },
      },
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const serialized: DashboardApplication[] = applications.map((a) => ({
    id: a.id,
    applicationNumber: a.applicationNumber,
    type: a.type,
    status: a.status,
    correctionNote: a.correctionNote,
    licenceNumber: a.licenceNumber,
    createdAt: a.createdAt.toISOString(),
    rtoName: a.rto.name,
    rtoCode: a.rto.code,
    slotDate: a.appointment?.slot.date ?? null,
    slotTime: a.appointment?.slot.time ?? null,
    paidAmount: a.payment?.amount ?? null,
  }));

  return (
    <DashboardContent
      firstName={user.name.split(" ")[0]}
      applications={serialized}
      notifications={notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        link: n.link,
        unread: n.readAt === null,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
