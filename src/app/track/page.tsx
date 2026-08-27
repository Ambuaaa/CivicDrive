import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Track application — CivicDrive" };

function maskName(name: string) {
  return name
    .split(" ")
    .map((w) => (w.length > 0 ? `${w[0]}${"•".repeat(Math.max(w.length - 1, 1))}` : w))
    .join(" ");
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toUpperCase();

  const app = q
    ? await db.application.findUnique({
        where: { applicationNumber: q },
        select: {
          fullName: true,
          type: true,
          status: true,
          correctionNote: true,
          createdAt: true,
          rto: { select: { code: true, name: true } },
          appointment: { select: { slot: { select: { date: true, time: true } } } },
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-xl space-y-5 py-2">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Track your application</h1>
        <p className="mt-1 text-sm text-slate-500">
          No login needed. Just the application number (e.g. CD-2026-100001).
        </p>
      </div>

      <Card>
        <form method="GET" action="/track" className="flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            placeholder="CD-2026-XXXXXX"
            aria-label="Application number"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-base uppercase placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
          />
          <button
            type="submit"
            className="min-h-12 flex-none rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700"
          >
            Track
          </button>
        </form>
      </Card>

      {q && !app && (
        <Card className="border-amber-200 bg-amber-50 text-sm text-amber-900">
          No application found for <span className="font-mono font-semibold">{q}</span>. Check the
          number and try again — the format is CD-YEAR-6digits.
        </Card>
      )}

      {app && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <p className="font-bold text-slate-900">{maskName(app.fullName)}</p>
              <p className="text-sm text-slate-500">
                {app.type === "NEW_DL" ? "New driving licence" : app.type} ·{" "}
                {formatDate(app.createdAt.toISOString().slice(0, 10))} · {app.rto.name} ({app.rto.code})
              </p>
            </div>
            <StatusBadge status={app.status} />
          </div>
          <Timeline
            status={app.status}
            note={app.correctionNote}
            appointmentDate={
              app.appointment
                ? { date: app.appointment.slot.date, time: app.appointment.slot.time }
                : null
            }
          />
          <p className="mt-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
            For privacy, personal details are masked on public tracking.
          </p>
        </Card>
      )}
    </div>
  );
}
