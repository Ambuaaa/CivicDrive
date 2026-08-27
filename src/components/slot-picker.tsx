"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { bookAppointment } from "@/app/actions/applications";
import { Button, Card } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { cn, formatDate, formatTime, todayISO } from "@/lib/utils";

type Slot = { id: string; date: string; time: string };

export function SlotPicker({
  applicationId,
  status,
  applicationNumber,
  rto,
  slots,
}: {
  applicationId: string;
  status: string;
  applicationNumber?: string;
  rto: { code: string; name: string; city: string };
  slots: Slot[];
}) {
  const { t } = useLang();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(slots[0]?.date ?? todayISO());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [pending, start] = useTransition();

  const dates = useMemo(() => [...new Set(slots.map((s) => s.date))].slice(0, 7), [slots]);
  const daySlots = useMemo(() => slots.filter((s) => s.date === selectedDate), [slots, selectedDate]);

  if (status !== "FEE_PAID") {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card className="text-center text-sm text-slate-600">
          Slot booking opens after your fee payment for this application.
          <Link href="/dashboard" className="mt-3 block font-semibold text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </Card>
      </div>
    );
  }

  function confirm() {
    if (!selectedSlot) {
      toast.error("Pick a time slot first.");
      return;
    }
    start(async () => {
      const res = await bookAppointment({ applicationId, slotId: selectedSlot.id });
      if (res.ok) {
        toast.success("Appointment confirmed!");
        router.push(`/application/${applicationId}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not book that slot.");
        // remove the taken slot from view so the UI stays truthful
        setSelectedSlot(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href={`/application/${applicationId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to application
      </Link>

      <Card>
        <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <CalendarDays className="h-5 w-5 text-indigo-600" /> {t("appt.title")}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-4 w-4" /> {rto.name} ({rto.code}) · {rto.city}
          {applicationNumber && <span className="font-mono"> · {applicationNumber}</span>}
        </p>

        {/* Date tabs */}
        {dates.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{t("appt.none")}</p>
        ) : (
          <>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choose day">
              {dates.map((d) => {
                const count = slots.filter((s) => s.date === d).length;
                const active = d === selectedDate;
                return (
                  <button
                    key={d}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot(null);
                    }}
                    className={cn(
                      "flex-none rounded-xl border px-4 py-2.5 text-center transition-all",
                      active ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span className={cn("block text-sm font-bold", active ? "text-indigo-700" : "text-slate-700")}>
                      {formatDate(d).replace(", 2026", "")}
                    </span>
                    <span className="block text-[11px] text-slate-400">{count} free</span>
                  </button>
                );
              })}
            </div>

            {/* Time grid */}
            <h2 className="mt-5 mb-2 text-sm font-semibold text-slate-700">{t("appt.slot")}</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {daySlots.map((s) => {
                const active = selectedSlot?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSlot(s)}
                    aria-pressed={active}
                    className={cn(
                      "min-h-11 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all",
                      active ? "border-indigo-600 bg-indigo-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40",
                    )}
                  >
                    {formatTime(s.time)}
                  </button>
                );
              })}
              {daySlots.length === 0 && (
                <p className="col-span-full rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{t("appt.none")}</p>
              )}
            </div>

            <Button size="lg" className="mt-6" onClick={confirm} disabled={pending || !selectedSlot}>
              <CheckCircle2 className="h-5 w-5" />
              {pending ? t("common.loading") : `${t("common.confirm")} ${selectedSlot ? formatTime(selectedSlot.time) : ""}`}
            </Button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              One applicant per slot — bookings are protected against clashes at the database level.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
