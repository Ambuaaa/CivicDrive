"use client";

import { useLang, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
  DOCS_VERIFIED: "bg-teal-50 text-teal-700 border-teal-200",
  FEE_PAID: "bg-violet-50 text-violet-700 border-violet-200",
  APPOINTMENT_BOOKED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  CORRECTION_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useLang();
  const label = t(`status.${status}` as TKey);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        COLORS[status] ?? "bg-slate-100 text-slate-700 border-slate-200",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
