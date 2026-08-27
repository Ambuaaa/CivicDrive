"use client";

import Link from "next/link";
import {
  ArrowRight,
  CarFront,
  CopyPlus,
  FileCheck2,
  MapPin,
  MessageSquareWarning,
  RefreshCcw,
  Search,
  ListChecks,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Card } from "@/components/ui";

export default function HomePage() {
  const { t } = useLang();

  const tasks = [
    { href: "/apply?type=NEW_DL", icon: CarFront, title: t("task.get.title"), desc: t("task.get.desc") },
    { href: "/apply?type=RENEWAL", icon: RefreshCcw, title: t("task.renew.title"), desc: t("task.renew.desc") },
    { href: "/apply?type=DUPLICATE", icon: CopyPlus, title: t("task.dup.title"), desc: t("task.dup.desc") },
    { href: "/track", icon: Search, title: t("task.track.title"), desc: t("task.track.desc") },
  ];

  const why = [
    { icon: ListChecks, t: t("why.1.t"), d: t("why.1.d") },
    { icon: MessageSquareWarning, t: t("why.2.t"), d: t("why.2.d") },
    { icon: FileCheck2, t: t("why.3.t"), d: t("why.3.d") },
  ];

  return (
    <div className="space-y-10">
      {/* Prototype banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        <strong className="font-semibold">Hackathon prototype.</strong> Every account, payment,
        document and RTO here is mock data.{" "}
        <Link href="/about" className="font-semibold underline underline-offset-2">
          See what is mocked
        </Link>{" "}
        · Demo logins are shown on the login page.
      </div>

      {/* Hero */}
      <section className="text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <MapPin className="h-3.5 w-3.5" /> {t("hero.badge")}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:mx-0 sm:text-lg">
          {t("hero.sub")}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/apply"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            {t("hero.cta.apply")} <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/track"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-slate-100"
          >
            {t("hero.cta.track")}
          </Link>
        </div>
      </section>

      {/* Task cards — one task per screen */}
      <section aria-label={t("dash.applications")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tasks.map((task) => (
            <Link key={task.href} href={task.href} className="group">
              <Card className="flex h-full flex-col gap-3 transition-all group-hover:-translate-y-0.5 group-hover:border-blue-300 group-hover:shadow-md">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <task.icon className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{task.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                  {t("common.next")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Why easier */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{t("why.title")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {why.map((w) => (
            <Card key={w.t}>
              <w.icon className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-3 font-bold text-slate-900">{w.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{w.d}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
