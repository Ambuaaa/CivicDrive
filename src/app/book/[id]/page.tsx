import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SlotPicker } from "@/components/slot-picker";

export const metadata = { title: "Book appointment — CivicDrive" };

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      applicationNumber: true,
      rto: { select: { code: true, name: true, city: true, id: true } },
      appointment: { select: { id: true } },
    },
  });

  if (!app) notFound();
  if (app.userId !== user.id) notFound();
  if (app.appointment) redirect(`/application/${app.id}`);

  const todayISO = new Date().toISOString().slice(0, 10);
  const slots = await db.slot.findMany({
    where: { rtoId: app.rto.id, date: { gte: todayISO }, appointment: null },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    select: { id: true, date: true, time: true },
  });

  return (
    <SlotPicker
      applicationId={app.id}
      status={app.status}
      applicationNumber={app.applicationNumber}
      rto={{ code: app.rto.code, name: app.rto.name, city: app.rto.city }}
      slots={slots}
    />
  );
}
