import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { APP_TYPE, type AppType } from "@/lib/constants";
import { ApplyWizard } from "@/components/apply-wizard";

export const metadata = { title: "New application — CivicDrive" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const raw = typeof sp.type === "string" ? sp.type.toUpperCase() : "";
  const defaultType: AppType =
    raw === APP_TYPE.RENEWAL || raw === APP_TYPE.DUPLICATE ? (raw as AppType) : APP_TYPE.NEW_DL;

  const rtos = await db.rto.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, city: true },
  });

  return <ApplyWizard rtos={rtos} defaultType={defaultType} />;
}
