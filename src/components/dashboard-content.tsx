"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BellOff,
  CalendarDays,
  CarFront,
  CircleCheckBig,
  CreditCard,
  FileWarning,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { markNotificationsRead } from "@/app/actions/notifications";
import { StatusBadge } from "@/components/status-badge";
import { Card, LinkButton } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { cn, formatDate, formatDateTime, formatINR, formatTime } from "@/lib/utils";

export type DashboardApplication = {
  id: string;
  applicationNumber: string;
  type: string;
  status: string;
  correctionNote: string | null;
  licenceNumber: string | null;
  createdAt: string;
  rtoName: string;
  rtoCode: string;
  slotDate: string | null;
  slotTime: string | null;
  paidAmount: number | null;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  unread: boolean;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  NEW_DL: "New driving licence",
  RENEWAL: "Licence renewal",
  DUPLICATE: "Duplicate licence",
};

export function DashboardContent({
  firstName,
  applications,
  notifications,
}: {
  firstName: string;
  applications: DashboardApplication[];
  notifications: NotificationItem[];
}) {
  const { t } = useLang();
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Namaste, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">{t("dash.applications")}</p>
        </div>
        <LinkButton href="/apply" size="sm">
          <CarFront className="h-4 w-4" /> {t("dash.start")}
        </LinkButton>
      </div>

      {/* Applications */}
      <section className="space-y-4">
        {applications.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-12 text-center">
            <CarFront className="h-10 w-10 text-slate-300" />
            <h3 className="font-bold text-slate-900">{t("dash.empty.title")}</h3>
            <p className="max-w-sm text-sm text-slate-500">{t("dash.empty.desc")}</p>
            <LinkButton href="/apply">{t("dash.start")}</LinkButton>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-slate-900">{app.applicationNumber}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {TYPE_LABELS[app.type] ?? app.type} · {app.rtoCode} ·{" "}
                    {formatDate(app.createdAt.slice(0, 10))}
                  </p>
                  {app.slotDate && app.slotTime && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-indigo-700">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(app.slotDate)}, {formatTime(app.slotTime)}
                    </p>
                  )}
                </div>
                <StatusBadge status={app.status} />
              </div>

              {/* Contextual next-step CTA — users never wonder what to do */}
              <NextStep app={app} />
            </Card>
          ))
        )}
      </section>

      {/* Notifications */}
      <section aria-label={t("notif.title")}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Bell className="h-5 w-5 text-blue-600" /> {t("notif.title")}
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={async () => {
                await markNotificationsRead();
                toast.success("All caught up!");
              }}
              className="text-sm font-semibold text-blue-600 hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <Card className="flex items-center gap-3 py-6 text-sm text-slate-400">
            <BellOff className="h-5 w-5" /> Nothing yet — updates about your applications will appear here.
          </Card>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href={n.link ?? "/dashboard"}>
                  <Card
                    className={cn(
                      "flex items-start gap-3 py-4 transition-colors hover:border-blue-300",
                      n.unread && "border-l-4 border-l-blue-600",
                    )}
                  >
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.unread ? "bg-blue-600" : "bg-slate-200")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{n.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NextStep({ app }: { app: DashboardApplication }) {
  const { t } = useLang();

  switch (app.status) {
    case "SUBMITTED":
      return (
        <Note icon={<CircleCheckBig className="h-4 w-4 text-blue-500" />} tone="blue">
          Documents under verification by the RTO office. We will notify you — usually within a day.
        </Note>
      );
    case "DOCS_VERIFIED":
      return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            <CreditCard className="h-4 w-4" />
            Documents verified! Fee payment is due ({formatINR(app.paidAmount ?? 400)}).
          </p>
          <LinkButton href={`/pay/${app.id}`} size="sm">
            {t("common.pay")} <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      );
    case "FEE_PAID":
      return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-violet-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-violet-900">
            <CalendarDays className="h-4 w-4" /> Payment received. Last step: book your test slot.
          </p>
          <LinkButton href={`/book/${app.id}`} size="sm">
            Book slot <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      );
    case "APPOINTMENT_BOOKED":
      return (
        <Note icon={<CalendarDays className="h-4 w-4 text-indigo-500" />} tone="indigo">
          Test booked for {app.slotDate ? formatDate(app.slotDate) : ""} at{" "}
          {app.slotTime ? formatTime(app.slotTime) : ""}. Carry original documents.
        </Note>
      );
    case "APPROVED":
      return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            🎉 Licence approved — your digital licence is ready.
          </p>
          <LinkButton href={`/application/${app.id}`} variant="success" size="sm">
            View licence <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      );
    case "CORRECTION_REQUIRED":
      return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-orange-50 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-orange-900">
            <FileWarning className="h-4 w-4 shrink-0" />
            {app.correctionNote ?? "The officer requested corrections."}
          </p>
          <LinkButton href={`/application/${app.id}`} size="sm">
            <Wrench className="h-4 w-4" /> Fix now
          </LinkButton>
        </div>
      );
    case "REJECTED":
      return (
        <Note icon={<FileWarning className="h-4 w-4 text-rose-500" />} tone="rose">
          {app.correctionNote ?? "This application was rejected."}
        </Note>
      );
    default:
      return null;
  }
}

function Note({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: "blue" | "indigo" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-900",
    indigo: "bg-indigo-50 text-indigo-900",
    rose: "bg-rose-50 text-rose-900",
  };
  return (
    <div className={cn("mt-4 rounded-xl p-3", tones[tone])}>
      <p className="flex items-start gap-2 text-sm font-medium">
        {icon}
        {children}
      </p>
    </div>
  );
}
