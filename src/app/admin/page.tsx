import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { AdminQueue } from "@/components/admin-queue";

export const metadata = { title: "Admin — CivicDrive" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== ROLES.ADMIN) redirect("/dashboard");

  const sp = await searchParams;

  const [counts, applications] = await Promise.all([
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.application.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        applicationNumber: true,
        fullName: true,
        type: true,
        status: true,
        createdAt: true,
        rto: { select: { code: true } },
      },
    }),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;

  return (
    <AdminQueue
      adminName={user.name}
      counts={countMap}
      filter={sp.filter ?? "SUBMITTED"}
      applications={applications.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
        rtoCode: a.rto.code,
      }))}
    />
  );
}
