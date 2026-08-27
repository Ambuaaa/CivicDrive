"use client";

import { CheckCircle2, Circle, AlertTriangle, XCircle } from "lucide-react";
import { STATUS, TIMELINE } from "@/lib/constants";
import { useLang, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Live progress checklist. Converts the backend `status` field into
 * a clear "done / current / pending" view so users always know the next step.
 */
export function Timeline({
  status,
  note,
  appointmentDate,
}: {
  status: string;
  note?: string | null;
  appointmentDate?: { date: string; time: string } | null;
}) {
  const { t } = useLang();

  const currentIndex = TIMELINE.indexOf(status as (typeof TIMELINE)[number]);
  const blocked = status === STATUS.REJECTED || status === STATUS.CORRECTION_REQUIRED;

  const extras: Record<string, string> = {
    [STATUS.APPOINTMENT_BOOKED]: appointmentDate
      ? `${formatSlot(appointmentDate.date)}, ${appointmentDate.time}`
      : "",
  };

  return (
    <div>
      {blocked && (
        <div
          className={cn(
            "mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm",
            status === STATUS.REJECTED
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-orange-200 bg-orange-50 text-orange-800",
          )}
        >
          {status === STATUS.REJECTED ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">{t(`status.${status}` as TKey)}</p>
            {note && <p className="mt-0.5 leading-relaxed opacity-90">{note}</p>}
          </div>
        </div>
      )}

      <ol className="relative space-y-1">
        {TIMELINE.map((step, i) => {
          const done = !blocked && currentIndex > i;
          const current = !blocked && currentIndex === i;
          const reached = done || current || (blocked && currentIndex >= i);
          const extra = extras[step];
          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                {reached ? (
                  <CheckCircle2
                    className={cn(
                      "h-6 w-6",
                      current && !done
                        ? "text-blue-600"
                        : step === STATUS.APPROVED
                          ? "text-emerald-600"
                          : "text-emerald-500",
                    )}
                  />
                ) : (
                  <Circle className="h-6 w-6 text-slate-300" />
                )}
                {i < TIMELINE.length - 1 && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1 rounded-full",
                      currentIndex > i && !blocked ? "bg-emerald-400" : "bg-slate-200",
                    )}
                  />
                )}
              </div>
              <div className={cn("pb-5", !current && "opacity-80")}>
                <p className={cn("font-semibold", current ? "text-blue-700" : "text-slate-900")}>
                  {t(`status.${step}` as TKey)}
                  {current && (
                    <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                      Current
                    </span>
                  )}
                </p>
                {extra && <p className="mt-0.5 text-sm text-slate-600">{extra}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatSlot(dateISO: string) {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
