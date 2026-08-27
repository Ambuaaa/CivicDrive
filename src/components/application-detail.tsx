"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  CreditCard,
  FileText,
  Image as ImageIcon,
  MapPin,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { resubmitDocuments } from "@/app/actions/applications";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { Button, Card, LinkButton } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { DOC_REQUIREMENTS, MAX_UPLOAD_BYTES, type DocType } from "@/lib/constants";
import { cn, formatDate, formatDateTime, formatINR, formatTime } from "@/lib/utils";

export type ApplicationDetailData = {
  id: string;
  applicationNumber: string;
  type: string;
  status: string;
  fullName: string;
  fatherName: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  address: string;
  correctionNote: string | null;
  licenceNumber: string | null;
  createdAt: string;
  rtoName: string;
  rtoCode: string;
  rtoAddress: string;
  payment: {
    txnId: string;
    amount: number;
    baseFee: number;
    convenienceFee: number;
    method: string;
  } | null;
  slotDate: string | null;
  slotTime: string | null;
  documents: { id: string; type: string; fileName: string; mimeType: string; status: string }[];
  history: { id: string; status: string; message: string | null; actor: string; createdAt: string }[];
};

const TYPE_LABELS: Record<string, string> = {
  NEW_DL: "New driving licence",
  RENEWAL: "Licence renewal",
  DUPLICATE: "Duplicate licence",
};

export function ApplicationDetail({
  app,
  canManage,
}: {
  app: ApplicationDetailData;
  canManage: boolean;
}) {
  const { t } = useLang();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> {t("nav.dashboard")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-extrabold text-slate-900">{app.applicationNumber}</h1>
          <p className="text-sm text-slate-500">
            {TYPE_LABELS[app.type] ?? app.type} · submitted {formatDate(app.createdAt.slice(0, 10))}
          </p>
        </div>
        <StatusBadge status={app.status} className="text-sm" />
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_320px]">
        {/* Left: timeline + documents + receipt */}
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 text-base font-bold text-slate-900">Application status</h2>
            <Timeline
              status={app.status}
              note={app.correctionNote}
              appointmentDate={
                app.slotDate && app.slotTime ? { date: app.slotDate, time: formatTime(app.slotTime) } : null
              }
            />
            {canManage && app.status === "CORRECTION_REQUIRED" && (
              <div className="mt-2 border-t border-slate-100 pt-4">
                <ReuploadDocs applicationId={app.id} />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-bold text-slate-900">Documents</h2>
            <ul className="space-y-2.5">
              {DOC_REQUIREMENTS.map((req) => {
                const doc = app.documents.find((d) => d.type === req.type);
                return (
                  <li key={req.type} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      {doc?.mimeType.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                      )}
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900">{req.label}</span>
                        {doc && <span className="block truncate text-xs text-slate-400">{doc.fileName}</span>}
                      </span>
                    </span>
                    {doc ? (
                      <a
                        href={`/api/documents/${doc.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Missing</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

          {app.payment && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900">
                <CreditCard className="h-4 w-4 text-emerald-600" /> Payment receipt
              </h2>
              <dl className="space-y-1.5 text-sm">
                <Row k={t("fees.base")} v={formatINR(app.payment.baseFee)} />
                <Row k={t("fees.convenience")} v={formatINR(app.payment.convenienceFee)} />
                <Row k={t("fees.total")} v={formatINR(app.payment.amount)} strong />
                <Row k="Method" v={app.payment.method.toUpperCase()} />
                <Row k="Transaction ID" v={<span className="font-mono">{app.payment.txnId}</span>} />
                <Row k="Status" v={<span className="font-semibold text-emerald-600">SUCCESS ✓ (mock)</span>} />
              </dl>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-base font-bold text-slate-900">Activity history</h2>
            <ol className="space-y-3">
              {[...app.history].reverse().map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-800">{h.message ?? h.status}</p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(h.createdAt)} · {h.actor}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Right: contextual next step / licence */}
        <div className="space-y-5">
          {app.status === "SUBMITTED" && (
            <Card className="bg-blue-50/60">
              <p className="text-sm leading-relaxed text-blue-900">
                Your documents are with the RTO officer. You will get a notification the moment they
                are verified — then you can pay the fee and book your test.
              </p>
            </Card>
          )}

          {canManage && app.status === "DOCS_VERIFIED" && (
            <Card className="border-emerald-200 bg-emerald-50/60">
              <h3 className="font-bold text-emerald-900">Fee payment due</h3>
              <p className="mt-1 mb-3 text-sm text-emerald-800">
                Documents verified. Pay to unlock slot booking.
              </p>
              <LinkButton href={`/pay/${app.id}`} variant="success" size="lg">
                {t("common.pay")}
              </LinkButton>
            </Card>
          )}

          {canManage && app.status === "FEE_PAID" && (
            <Card className="border-violet-200 bg-violet-50/60">
              <h3 className="font-bold text-violet-900">Book your driving test</h3>
              <p className="mt-1 mb-3 text-sm text-violet-800">
                Choose a day and time at {app.rtoName}. Takes under a minute.
              </p>
              <LinkButton href={`/book/${app.id}`} size="lg">
                Pick a slot
              </LinkButton>
            </Card>
          )}

          {app.slotDate && (
            <Card>
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <CalendarDays className="h-4 w-4 text-indigo-600" /> Appointment
              </h3>
              <p className="mt-2 text-2xl font-extrabold text-indigo-700">
                {formatDate(app.slotDate)}
              </p>
              <p className="text-lg font-semibold text-indigo-600">{formatTime(app.slotTime!)}</p>
              <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {app.rtoName} ({app.rtoCode})
                <br />
              </p>
              <p className="mt-0.5 pl-6 text-xs text-slate-400">{app.rtoAddress}</p>
            </Card>
          )}

          {app.status === "APPROVED" && <LicenceCard app={app} />}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className={cn("text-right", strong ? "font-bold text-slate-900" : "text-slate-700")}>{v}</dd>
    </div>
  );
}

function LicenceCard({ app }: { app: ApplicationDetailData }) {
  const initials = app.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const issued = new Date();
  const validTill = new Date(issued.getFullYear() + 20, issued.getMonth(), issued.getDate());

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 p-1 shadow-lg">
      <div className="rounded-[14px] bg-white/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
          <span className="text-xs font-bold tracking-widest text-blue-700 uppercase">Digital Driving Licence</span>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
            Demo
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-900 uppercase">{app.fullName}</p>
            <p className="text-xs text-slate-500">s/o {app.fatherName}</p>
            <p className="text-xs text-slate-500">DOB {app.dob}</p>
          </div>
        </div>
        <dl className="mt-3 space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-slate-400">Licence no.</dt>
            <dd className="font-mono font-bold tracking-wider text-slate-900">
              {(app.licenceNumber ?? "").replace(/(.{4})/g, "$1 ").trim()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Issued by</dt>
            <dd className="font-medium text-slate-700">
              {app.rtoName} ({app.rtoCode})
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Valid till</dt>
            <dd className="font-medium text-slate-700">{formatDate(validTill.toISOString().slice(0, 10))}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ---------------- re-upload after correction ---------------- */

function ReuploadDocs({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<{ type: DocType; fileName: string; dataUrl: string; mimeType: string }[]>([]);
  const [pending, start] = useTransition();

  async function handleFile(docType: DocType, file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG or PDF.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File over 1 MB — please upload a smaller file.");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setDocs((prev) => [...prev.filter((d) => d.type !== docType), { type: docType, fileName: file.name, mimeType: file.type, dataUrl }]);
  }

  function submit() {
    if (docs.length !== 3) {
      toast.error("Please re-upload all 3 documents.");
      return;
    }
    start(async () => {
      const res = await resubmitDocuments({ applicationId, documents: docs });
      if (res.ok) {
        toast.success("Corrected documents sent for review!");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-bold text-orange-700">
        <UploadCloud className="h-4 w-4" /> Fix &amp; re-upload documents
      </h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {DOC_REQUIREMENTS.map((req) => {
          const uploaded = docs.find((d) => d.type === req.type);
          return (
            <label
              key={req.type}
              className={cn(
                "cursor-pointer rounded-xl border border-dashed p-3 text-center text-xs transition-colors",
                uploaded ? "border-emerald-400 bg-emerald-50 font-semibold text-emerald-700" : "border-orange-300 text-orange-700 hover:bg-orange-50",
              )}
            >
              <UploadCloud className="mx-auto mb-1 h-4 w-4" />
              {uploaded ? `✓ ${uploaded.fileName}` : req.label}
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => handleFile(req.type, e.target.files?.[0])} />
            </label>
          );
        })}
      </div>
      <Button size="sm" className="mt-3" onClick={submit} disabled={pending}>
        {pending ? "Uploading…" : "Submit corrections"}
      </Button>
    </div>
  );
}
