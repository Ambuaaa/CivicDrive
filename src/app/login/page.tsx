"use client";

import { useActionState, useState } from "react";
import { LogIn, UserPlus, Wand2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { Button, FieldError, Hint, Input, Label } from "@/components/ui";
import { useLang } from "@/lib/i18n";

const DEMO_CITIZEN = { email: "demo@civicdrive.in", password: "demo1234", label: "Citizen (Rahul)" };
const DEMO_ADMIN = { email: "admin@civicdrive.in", password: "admin1234", label: "Admin" };

export default function LoginPage() {
  const { t } = useLang();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginState, loginSubmit, loginPending] = useActionState<AuthState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const [regState, regSubmit, regPending] = useActionState<AuthState | undefined, FormData>(
    registerAction,
    undefined,
  );

  // pre-fill helper for judges
  const [creds, setCreds] = useState({ email: "", password: "" });
  const fill = (c: { email: string; password: string }) => setCreds(c);

  return (
    <div className="mx-auto max-w-md space-y-5 py-4">
      {/* Demo credentials — reviewers should never get stuck */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
        <p className="flex items-center gap-1.5 font-bold text-emerald-900">
          <Wand2 className="h-4 w-4" /> {t("auth.demo.title")}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => fill(DEMO_CITIZEN)}
            className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-left font-medium hover:bg-emerald-100"
          >
            {DEMO_CITIZEN.label}
          </button>
          <button
            onClick={() => fill(DEMO_ADMIN)}
            className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-left font-medium hover:bg-emerald-100"
          >
            {DEMO_ADMIN.label}
          </button>
        </div>
        <Hint>
          demo@civicdrive.in / demo1234 &nbsp;·&nbsp; admin@civicdrive.in / admin1234.
          Tap a card to auto-fill the login form.
        </Hint>
      </div>

      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              mode === m ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {m === "login" ? t("auth.login.title") : t("auth.register.title")}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {mode === "login" ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">{t("auth.login.title")}</h1>
            <p className="mt-0.5 mb-4 text-sm text-slate-500">{t("auth.login.sub")}</p>
            <form action={loginSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={creds.email}
                  onChange={(e) => setCreds((c) => ({ ...c, email: e.target.value }))}
                  required
                />
                <FieldError message={loginState?.fieldErrors?.email} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={creds.password}
                  onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))}
                  required
                />
                <FieldError message={loginState?.fieldErrors?.password} />
              </div>
              {loginState?.error && <FieldError message={loginState.error} />}
              <Button type="submit" size="lg" disabled={loginPending}>
                <LogIn className="h-5 w-5" />
                {loginPending ? t("common.loading") : t("auth.login.title")}
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              {t("auth.noAccount")}{" "}
              <button onClick={() => setMode("register")} className="font-semibold text-blue-600 hover:underline">
                {t("auth.register.title").toLowerCase()}
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-900">{t("auth.register.title")}</h1>
            <p className="mt-0.5 mb-4 text-sm text-slate-500">{t("auth.register.sub")}</p>
            <form action={regSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="e.g. Rahul Sharma" required />
                <FieldError message={regState?.fieldErrors?.name} />
              </div>
              <div>
                <Label htmlFor="remail">Email</Label>
                <Input id="remail" name="email" type="email" placeholder="you@example.com" required />
                <FieldError message={regState?.fieldErrors?.email} />
              </div>
              <div>
                <Label htmlFor="phone">Mobile number</Label>
                <Input id="phone" name="phone" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" required />
                <Hint>Used only for demo notifications. Never shared.</Hint>
                <FieldError message={regState?.fieldErrors?.phone} />
              </div>
              <div>
                <Label htmlFor="rpassword">Password</Label>
                <Input id="rpassword" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
                <FieldError message={regState?.fieldErrors?.password} />
              </div>
              {regState?.error && <FieldError message={regState.error} />}
              <Button type="submit" size="lg" disabled={regPending}>
                <UserPlus className="h-5 w-5" />
                {regPending ? t("common.loading") : t("auth.register.title")}
              </Button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              {t("auth.hasAccount")}{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-blue-600 hover:underline">
                {t("auth.login.title").toLowerCase()}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
