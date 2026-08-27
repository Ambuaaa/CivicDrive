"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgeCheck, FileCheck2, ShieldAlert, Wrench, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  approveApplication,
  rejectApplication,
  requestCorrection,
  verifyDocuments,
} from "@/app/actions/admin";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { Button, Card, Label, Textarea } from "@/components/ui";
import { DOC_REQUIREMENTS } from "@/lib/constants";
import { formatDate, formatDateTime, formatINR, formatTime } from "@/lib/utils";

type AdminApp = {
  id: string;
  applicationNumber: string;
  type: string;
  status: string;
  fullName: string;
  fatherName: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  phone: string | null;
  address: string;
  correctionNote: string | null;
  licenceNumber: string | null;
  createdAt: string;
  rtoName: string;
  rtoCode: string;
  payment: { txnId: string; amount: number } | null;
  slotDate: string | null;
  slotTime: string | null;
  documents: { id: string; type: string; fileName: string; mimeType: string; status: string }[];
  history: { id: string; status: string; message: string | null; actor: string; createdAt: string }[];
};

export function AdminReviewPanel({ adminName, app }: { adminName: string; app: AdminApp }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(successMsg);
        router.refresh();
        router.push("/admin?filter=" + nextFilter(app.status));
      } else {
        toast.error(res.error ?? "Action failed.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-extrabold text-slate-900">{app.applicationNumber}</h1>
          <p className="text-sm text-slate-500">
            {app.type} · submitted {formatDate(app.createdAt.slice(0, 10))} · reviewing as {adminName}
          </p>
        </div>
        <StatusBadge status={app.status} className="text-sm" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Applicant details */}
        <Card>
          <h2 className="mb-3 text-base font-bold text-slate-900">Applicant details</h2>
          <dl className="space-y-1.5 text-sm">
            <Row k="Name" v={`${app.fullName} (${app.gender})`} />
            <Row k="Father's name" v={app.fatherName} />
            <Row k="Date of birth" v={app.dob} />
            {app.bloodGroup && <Row k="Blood group" v={app.bloodGroup} />}
            {app.phone && <Row k="Phone" v={app.phone} />}
            <Row k="Address" v={app.address} />
            <Row k="RTO" v={`${app.rtoName} (${app.rtoCode})`} />
            {app.payment && <Row k="Payment" v={`${formatINR(app.payment.amount)} · ${app.payment.txnId}`} />}
            {app.slotDate && (
              <Row k="Test slot" v={`${formatDate(app.slotDate)}, ${formatTime(app.slotTime!)}`} />
            )}
          </dl>

          <h3 className="mt-5 mb-2 text-sm font-bold text-slate-900">Progress</h3>
          <Timeline status={app.status} note={app.correctionNote} />
        </Card>

        {/* Documents */}
        <Card>
          <h2 className="mb-3 text-base font-bold text-slate-900">Documents</h2>
          <ul className="space-y-3">
            {DOC_REQUIREMENTS.map((req) => {
              const doc = app.documents.find((d) => d.type === req.type);
              return (
                <li key={req.type} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{req.label}</span>
                    <span
                      className={
                        doc
                          ? doc.status === "VERIFIED"
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700"
                            : "rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700"
                          : "rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600"
                      }
                    >
                      {doc ? doc.status : "MISSING"}
                    </span>
                  </div>
                  {doc ? (
                    <a
                      href={`/api/documents/${doc.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block truncate text-xs font-medium text-blue-600 hover:underline"
                    >
                      Open {doc.fileName} ↗
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-rose-500">Not uploaded</p>
                  )}
                  {doc?.mimeType.startsWith("image/") && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/documents/${doc.id}`}
                      alt={`${req.label} preview`}
                      loading="lazy"
                      className="mt-2 max-h-40 w-full rounded-lg border border-slate-100 object-contain"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Action panel */}
      <Card className="border-2">
        <h2 className="text-base font-bold text-slate-900">Officer actions</h2>
        {(app.status === "SUBMITTED" || app.status === "CORRECTION_REQUIRED") && (
          <>
            <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr]">
              <Button
                variant="success"
                disabled={pending}
                onClick={() => run(() => verifyDocuments(app.id), "Documents verified — applicant notified.")}
              >
                <FileCheck2 className="h-4 w-4" /> Verify documents
              </Button>
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => run(() => requestCorrection(app.id, note), "Correction requested — applicant notified.")}
              >
                <Wrench className="h-4 w-4" /> Request correction
              </Button>
              <Button
                variant="danger"
                disabled={pending}
                onClick={() => run(() => rejectApplication(app.id, note), "Application rejected — applicant notified.")}
              >
                <XCircle className="h-4 w-4" /> Reject application
              </Button>
            </div>
            <div className="mt-3">
              <Label htmlFor="note">
                Note to applicant (required for correction / rejection)
              </Label>
              <Textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='e.g. "Address proof is older than 3 months — please re-upload a recent bill."'
              />
            </div>
          </>
        )}

        {app.status !== "SUBMITTED" && app.status !== "CORRECTION_REQUIRED" && (
          <>
            {app.status === "APPOINTMENT_BOOKED" ? (
              <Button
                variant="success"
                size="lg"
                className="mt-3"
                disabled={pending}
                onClick={() => run(() => approveApplication(app.id), "Licence issued! 🎉")}
              >
                <BadgeCheck className="h-5 w-5" /> Test passed — issue licence
              </Button>
            ) : (
              <p className="mt-2 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400" />
                No action available at this stage (status: {app.status}). The citizen drives the next step.
              </p>
            )}
          </>
        )}

        <details className="mt-4 border-t border-slate-100 pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">
            Full activity history ({app.history.length})
          </summary>
          <ol className="mt-2 space-y-2 text-sm">
            {[...app.history].reverse().map((h) => (
              <li key={h.id}>
                <p className="font-medium text-slate-800">{h.message ?? h.status}</p>
                <p className="text-xs text-slate-400">
                  {formatDateTime(h.createdAt)} · {h.actor}
                </p>
              </li>
            ))}
          </ol>
        </details>
      </Card>
    </div>
  );
}

function nextFilter(current: string) {
  if (current === "SUBMITTED") return "SUBMITTED";
  return current;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-400">{k}</dt>
      <dd className="text-right font-medium text-slate-800">{v}</dd>
    </div>
  );
}
