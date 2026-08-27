"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CreditCard,
  Copy,
  Landmark,
  Lock,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { payFee } from "@/app/actions/applications";
import { Button, Card } from "@/components/ui";
import { useLang } from "@/lib/i18n";
import { cn, formatINR } from "@/lib/utils";

const METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone, hint: "GPay · PhonePe · Paytm" },
  { id: "card", label: "Card", icon: CreditCard, hint: "Credit / debit" },
  { id: "netbanking", label: "Net banking", icon: Landmark, hint: "All major banks" },
] as const;

export function PayForm({
  applicationId,
  applicationNumber,
  applicantName,
  status,
  baseFee,
  convenienceFee,
}: {
  applicationId: string;
  applicationNumber: string;
  applicantName: string;
  status: string;
  baseFee: number;
  convenienceFee: number;
}) {
  const { t } = useLang();
  const router = useRouter();
  const [method, setMethod] = useState<string>("upi");
  const [pending, start] = useTransition();
  const [success, setSuccess] = useState<{ txnId: string } | null>(null);
  const total = baseFee + convenienceFee;

  function pay() {
    start(async () => {
      // Simulated gateway latency so the UX feels real
      await new Promise((r) => setTimeout(r, 900));
      const res = await payFee({ applicationId, method });
      if (res.ok) {
        setSuccess(res.data);
        toast.success("Payment successful!");
        router.refresh();
      } else {
        toast.error(res.error ?? "Payment failed.");
      }
    });
  }

  if (status !== "DOCS_VERIFIED") {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <Card>
          <p className="text-sm text-slate-600">
            Payment opens after an officer verifies your documents for{" "}
            <strong className="font-mono">{applicationNumber}</strong>. We&apos;ll notify you — nothing to
            do right now.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md space-y-5 py-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <BadgeCheck className="h-11 w-11 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Payment successful</h1>
        <Card className="text-left">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Amount paid</dt>
              <dd className="font-bold text-slate-900">{formatINR(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Transaction ID</dt>
              <dd className="flex items-center gap-1 font-mono font-semibold text-slate-900">
                {success.txnId}
                <button
                  aria-label="Copy transaction ID"
                  onClick={() => {
                    navigator.clipboard.writeText(success.txnId);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-blue-600" />
                </button>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Application</dt>
              <dd className="font-mono">{applicationNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold text-emerald-600">SUCCESS (simulated)</dd>
            </div>
          </dl>
        </Card>
        <Button size="lg" onClick={() => router.push(`/book/${applicationId}`)}>
          Next: book your test slot
        </Button>
        <p className="text-xs text-slate-400">No real money was charged — this is a demo gateway.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href={`/application/${applicationId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to application
      </Link>

      <Card>
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">CivicPay Secure Gateway</span>
          <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">Mock</span>
        </div>

        <dl className="space-y-1.5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Application</dt>
            <dd className="font-mono text-slate-800">{applicationNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Applicant</dt>
            <dd className="text-slate-800">{applicantName}</dd>
          </div>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("fees.base")}</dt>
            <dd>{formatINR(baseFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("fees.convenience")}</dt>
            <dd>{formatINR(convenienceFee)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base">
            <dt className="font-bold text-slate-900">{t("fees.total")}</dt>
            <dd className="font-extrabold text-blue-700">{formatINR(total)}</dd>
          </div>
        </dl>

        <fieldset className="mt-2">
          <legend className="mb-2 text-sm font-semibold text-slate-800">Choose payment method</legend>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                aria-pressed={method === m.id}
                className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  method === m.id ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <m.icon className={cn("mx-auto h-5 w-5", method === m.id ? "text-blue-600" : "text-slate-400")} />
                <span className="mt-1 block text-xs font-bold text-slate-900">{m.label}</span>
                <span className="block text-[10px] leading-tight text-slate-400">{m.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Visual-only mock inputs */}
        <div className="mt-4 space-y-3 opacity-90">
          {method === "upi" && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">UPI ID</span>
              <input placeholder="name@okbank" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none" />
            </label>
          )}
          {method === "card" && (
            <>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Card number</span>
                <input placeholder="4111 1111 1111 1111" inputMode="numeric" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="MM/YY" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none" />
                <input placeholder="CVV" type="password" maxLength={4} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none" />
              </div>
            </>
          )}
          {method === "netbanking" && (
            <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none">
              <option>State Bank of India</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
            </select>
          )}
        </div>

        <Button size="lg" className="mt-5 w-full" onClick={pay} disabled={pending}>
          <Lock className="h-4 w-4" />
          {pending ? t("common.loading") : `${t("common.pay")} ${formatINR(total)}`}
        </Button>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
          Demo prototype — no real money moves, no card details are stored or transmitted anywhere.
        </p>
      </Card>
    </div>
  );
}
