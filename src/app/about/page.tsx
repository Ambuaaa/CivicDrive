import Link from "next/link";
import { Card } from "@/components/ui";

export const metadata = {
  title: "What is mocked — CivicDrive",
};

const mocked = [
  ["Payments", "No real money moves. A simulated gateway generates a fake transaction ID."],
  ["Documents", "Uploads are stored inside this demo database only. Nothing is sent to any government system."],
  ["Aadhaar / ID verification", "Not connected to UIDAI or any KYC provider. Any demo document is accepted."],
  ["RTO slots", "Synthetic slots generated for demo RTOs. No real appointment system is contacted."],
  ["Admin approvals", "Approvals are done by a reviewer in this prototype's own admin panel."],
  ["Notifications", "In-app notifications only — no SMS/email gateway is wired up."],
];

const real = [
  ["Complete journey state machine", "Every application lives in a database with full status history — submitted → verified → paid → booked → approved."],
  ["Real validation, twice", "Friendly field-level checks in the browser, re-enforced on the server before anything is saved."],
  ["Double-booking prevention", "Appointments are guarded by a database-level uniqueness constraint, so two people cannot grab one slot."],
  ["Role-based access", "Citizens see only their own applications; admins get a separate review workspace."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <header>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          What works today — and what is mocked
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          CivicDrive is an unofficial hackathon prototype that rethinks how driving licence services
          could feel. It never touches parivahan.gov.in, SARATHI, UIDAI or any payment network.
          Here is the honest breakdown.
        </p>
      </header>

      <Card>
        <h2 className="font-bold text-slate-900">Fully working in this prototype</h2>
        <ul className="mt-3 space-y-3">
          {real.map(([t, d]) => (
            <li key={t} className="flex gap-2 text-sm leading-relaxed">
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <p><strong className="text-slate-900">{t}.</strong> {d}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-bold text-slate-900">Mocked (by design)</h2>
        <ul className="mt-3 space-y-3">
          {mocked.map(([t, d]) => (
            <li key={t} className="flex gap-2 text-sm leading-relaxed">
              <span aria-hidden className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <p><strong className="text-slate-900">{t}.</strong> {d}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="font-bold text-slate-900">How this could work safely at scale</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          <li><strong>Identity:</strong> Aadhaar-based e-KYC via DigiLocker/consent APIs instead of manual uploads.</li>
          <li><strong>Documents:</strong> Pull directly from DigiLocker issuer APIs — no forged uploads possible.</li>
          <li><strong>Payments:</strong> A RBI-approved gateway (UPI rails) with server-side reconciliation.</li>
          <li><strong>Slots:</strong> Synced with the actual SARATHI/RTO test calendar through official integrations.</li>
          <li><strong>Scale:</strong> Managed Postgres, queue-driven notifications (SMS via approved aggregators) and audit logs for every officer action.</li>
        </ol>
      </Card>

      <p className="text-sm text-slate-500">
        Questions while reviewing? Start with the{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:underline">demo accounts</Link>{" "}
        and complete the full citizen journey.
      </p>
    </div>
  );
}
