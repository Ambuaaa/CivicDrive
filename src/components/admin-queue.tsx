"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, FileCheck2, CalendarCheck2, CircleCheckBig, Wrench, ShieldAlert } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui";
import { cn, formatDate } from "@/lib/utils";

type AppRow = {
  id: string;
  applicationNumber: string;
  fullName: string;
  type: string;
  status: string;
  createdAt: string;
  rtoCode: string;
};

const FILTERS: { key: string; label: string; icon: React.ElementType; tone: string }[] = [
  { key: "SUBMITTED", label: "Pending verification", icon: ClipboardList, tone: "text-blue-600" },
  { key: "DOCS_VERIFIED", label: "Awaiting payment", icon: FileCheck2, tone: "text-teal-600" },
  { key: "FEE_PAID", label: "Awaiting slot booking", icon: CalendarCheck2, tone: "text-violet-600" },
  { key: "APPOINTMENT_BOOKED", label: "Test booked — can issue licence", icon: CircleCheckBig, tone: "text-indigo-600" },
  { key: "CORRECTION_REQUIRED", label: "Corrections requested", icon: Wrench, tone: "text-orange-600" },
  { key: "REJECTED", label: "Rejected", icon: ShieldAlert, tone: "text-rose-600" },
  { key: "APPROVED", label: "Approved", icon: CircleCheckBig, tone: "text-emerald-600" },
];

export function AdminQueue({
  adminName,
  counts,
  filter,
  applications,
}: {
  adminName: string;
  counts: Record<string, number>;
  filter: string;
  applications: AppRow[];
}) {
  const router = useRouter();
  const active = FILTERS.find((f) => f.key === filter) ?? FILTERS[0];
  const rows = applications.filter((a) => a.status === active.key);
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">RTO review workspace</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Officer: {adminName} · {total} total applications
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const isActive = f.key === active.key;
          const count = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              onClick={() => router.push(`/admin?filter=${f.key}`)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-none items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all",
                isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
              )}
            >
              <f.icon className={cn("h-4 w-4", isActive ? "text-white" : f.tone)} />
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-bold",
                  isActive ? "bg-white/20 text-white" : count > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue list */}
      {rows.length === 0 ? (
        <Card className="py-10 text-center text-sm text-slate-400">
          Nothing in “{active.label}” right now. 🎉
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/applications/${a.id}`} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-2 py-4 transition-colors hover:border-blue-300">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-slate-900">{a.applicationNumber}</p>
                    <p className="truncate text-sm text-slate-500">
                      {a.fullName} · {a.rtoCode} · {formatDate(a.createdAt.slice(0, 10))}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
