"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useLang();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md space-y-2">
            <p className="font-semibold text-slate-700">CivicDrive</p>
            <p className="leading-relaxed">
              Unofficial student prototype built for a hackathon. Not affiliated with, endorsed by,
              or connected to the Ministry of Road Transport &amp; Highways or parivahan.gov.in.
              All data is mock/demo data.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-700">Links</p>
            <ul className="space-y-1">
              <li><Link className="hover:text-blue-600" href="/track">{t("nav.track")}</Link></li>
              <li><Link className="hover:text-blue-600" href="/about">{t("nav.about")}</Link></li>
              <li><Link className="hover:text-blue-600" href="/login">{t("nav.login")}</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
