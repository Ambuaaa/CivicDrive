"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, PlayCircle, Route, Info, ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DEMO_URL = "https://drive.google.com/file/d/1vM9d_4UqMIiaHqofNpi2a79qFPC6SVCH/view?usp=sharing";

type HeaderUser = { name: string; role: string } | null;

export function SiteHeader({ user, onLogout }: { user: HeaderUser; onLogout?: () => Promise<void> }) {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("nav.home"), icon: Route },
    { href: "/track", label: t("nav.track"), icon: LayoutDashboard },
    { href: "/about", label: t("nav.about"), icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      {/* Top demo banner — always visible */}
      <a
        href={DEMO_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
      >
        <PlayCircle className="h-4 w-4" /> Watch Demo Video — 2 min walkthrough
        <span className="hidden sm:inline opacity-90">↗</span>
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo size={34} />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Civic<span className="text-blue-600">Drive</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === l.href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          ))}
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            <PlayCircle className="h-4 w-4" /> Demo Video
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex overflow-hidden rounded-lg border border-slate-300" role="group" aria-label="Language">
            {(["en", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-bold transition-colors",
                  lang === l ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100",
                )}
              >
                {l === "en" ? "EN" : "हिं"}
              </button>
            ))}
          </div>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  <ShieldCheck className="h-4 w-4" /> Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                {user.name.split(" ")[0]}
              </Link>
              {onLogout && (
                <form action={onLogout}>
                  <button
                    type="submit"
                    aria-label={t("nav.logout")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 md:block"
            >
              {t("nav.login")}
            </Link>
          )}

          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <a
              href={DEMO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-base font-bold text-white"
            >
              <PlayCircle className="h-5 w-5" /> Watch Demo Video
            </a>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium",
                  pathname === l.href ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <ShieldCheck className="h-4 w-4" /> Admin panel
                  </Link>
                )}
                {onLogout && (
                  <form action={onLogout}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-base font-medium text-slate-600 hover:bg-slate-100"
                    >
                      <LogOut className="h-4 w-4" /> {t("nav.logout")}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white"
              >
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
