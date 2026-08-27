"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  CopyPlus,
  FileText,
  Image as ImageIcon,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import { submitApplication } from "@/app/actions/applications";
import { Button, Card, FieldError, Hint, Input, Label, Select } from "@/components/ui";
import { useLang, type TKey } from "@/lib/i18n";
import { BLOOD_GROUPS, GENDERS, MAX_UPLOAD_BYTES, feeFor, type AppType, type DocType } from "@/lib/constants";
import { addressSchema, personalSchema } from "@/lib/validation";
import { cn, formatINR } from "@/lib/utils";

type RtoOption = { id: string; code: string; name: string; city: string };
type Doc = { type: DocType; fileName: string; mimeType: string; dataUrl: string };

const STEP_KEYS: TKey[] = ["step.type", "step.personal", "step.address", "step.documents", "step.review"];

const TYPE_META: Record<AppType, { icon: typeof CarFront; label: string; desc: string }> = {
  NEW_DL: { icon: CarFront, label: "New Driving Licence", desc: "Apply for your first licence" },
  RENEWAL: { icon: RefreshCcw, label: "Renew Licence", desc: "Expiring or expired licence" },
  DUPLICATE: { icon: CopyPlus, label: "Duplicate Licence", desc: "Lost or damaged licence" },
};

const DOC_LIST: { type: DocType; label: string; hint: string }[] = [
  { type: "ID_PROOF", label: "Identity proof", hint: "Aadhaar / Voter ID / Passport (JPG, PNG or PDF)" },
  { type: "ADDRESS_PROOF", label: "Address proof", hint: "Electricity bill / bank passbook (JPG, PNG or PDF)" },
  { type: "PHOTO", label: "Passport photo", hint: "Recent photo with plain background (JPG or PNG)" },
];

/** Applicants must be 18+ â€” computed once at module load */
const MAX_DOB = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10);

export function ApplyWizard({ rtos, defaultType }: { rtos: RtoOption[]; defaultType: AppType }) {
  const { t } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [type, setType] = useState<AppType>(defaultType);
  const [rtoId, setRtoId] = useState("");
  const [personal, setPersonal] = useState({
    fullName: "",
    fatherName: "",
    dob: "",
    gender: "",
    bloodGroup: "",
  });
  const [address, setAddress] = useState({
    houseNo: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [docs, setDocs] = useState<Doc[]>([]);

  /* ---------------- validation per step ---------------- */

  function validateStep(i: number): boolean {
    let ok = true;
    const next: Record<string, string> = {};

    if (i === 0 && !rtoId) {
      next.rtoId = "Please choose the RTO where you want to apply.";
      ok = false;
    }
    if (i === 1) {
      const parsed = personalSchema.safeParse({ ...personal, bloodGroup: personal.bloodGroup || undefined });
      if (!parsed.success) {
        ok = false;
        for (const issue of parsed.error.issues) next[issue.path.join(".")] = issue.message;
      }
    }
    if (i === 2) {
      const parsed = addressSchema.safeParse(address);
      if (!parsed.success) {
        ok = false;
        for (const issue of parsed.error.issues) next[issue.path.join(".")] = issue.message;
      }
    }
    if (i === 3) {
      const missing = DOC_LIST.filter((d) => !docs.some((x) => x.type === d.type));
      if (missing.length > 0) {
        ok = false;
        next.documents = `Please upload: ${missing.map((m) => m.label).join(", ")}.`;
      }
    }

    setErrors(next);
    if (!ok && Object.keys(next).length > 0) {
      toast.error(Object.values(next)[0]);
    }
    return ok;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------------- file handling ---------------- */

  async function handleFile(docType: DocType, file: File | undefined) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPG, PNG or PDF file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is over 1 MB. Please upload a smaller version â€” a clear photo works fine.");
      return;
    }
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setDocs((prev) => [
      ...prev.filter((d) => d.type !== docType),
      { type: docType, fileName: file.name, mimeType: file.type, dataUrl },
    ]);
    toast.success(`${DOC_LIST.find((d) => d.type === docType)?.label} uploaded`);
  }

  /* ---------------- final submit ---------------- */

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitApplication({
        type,
        rtoId,
        personal: { ...personal, bloodGroup: personal.bloodGroup || undefined },
        address,
        documents: docs,
      });
      if (res.ok) {
        toast.success(`Application ${res.data.applicationNumber} submitted!`);
        router.push(`/application/${res.data.applicationId}?submitted=1`);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  }

  const selectedRto = rtos.find((r) => r.id === rtoId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress checklist */}
      <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Application progress">
        {STEP_KEYS.map((key, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={key} className="flex flex-none items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-emerald-500 text-white",
                  current && "bg-blue-600 text-white ring-4 ring-blue-100",
                  !done && !current && "border border-slate-300 bg-white text-slate-400",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "mr-1 hidden whitespace-nowrap text-xs font-semibold sm:inline",
                  current ? "text-blue-700" : done ? "text-slate-500" : "text-slate-400",
                )}
              >
                {t(key)}
              </span>
              {i < STEP_KEYS.length - 1 && <span className="h-px w-4 bg-slate-300 sm:w-6" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <Card>
        {/* STEP 0 â€” service + RTO */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.type")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(Object.keys(TYPE_META) as AppType[]).map((k) => {
                const meta = TYPE_META[k];
                const active = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <meta.icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-400")} />
                    <p className="mt-2 text-sm font-bold text-slate-900">{meta.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{meta.desc}</p>
                    <p className="mt-2 text-sm font-bold text-slate-900">
                      {formatINR(feeFor(k).base)}{" "}
                      <span className="text-xs font-normal text-slate-500">+ {formatINR(feeFor(k).convenience)} fee</span>
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Label htmlFor="rto">RTO office</Label>
              <Select id="rto" value={rtoId} onChange={(e) => setRtoId(e.target.value)}>
                <option value="">Choose your RTOâ€¦</option>
                {rtos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) â€” {r.city}
                  </option>
                ))}
              </Select>
              <Hint>Your driving test happens at this office.</Hint>
              <FieldError message={errors.rtoId} />
            </div>
          </>
        )}

        {/* STEP 1 â€” personal */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.personal")}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Full name (as on ID proof)</Label>
                <Input
                  id="fullName"
                  value={personal.fullName}
                  onChange={(e) => setPersonal((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="name"
                />
                <FieldError message={errors.fullName} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="fatherName">Father&apos;s name</Label>
                <Input
                  id="fatherName"
                  value={personal.fatherName}
                  onChange={(e) => setPersonal((p) => ({ ...p, fatherName: e.target.value }))}
                  placeholder="e.g. Suresh Sharma"
                />
                <FieldError message={errors.fatherName} />
              </div>
              <div>
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  max={MAX_DOB}
                  value={personal.dob}
                  onChange={(e) => setPersonal((p) => ({ ...p, dob: e.target.value }))}
                />
                <FieldError message={errors.dob} />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select
                  id="gender"
                  value={personal.gender}
                  onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Selectâ€¦</option>
                  {GENDERS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
                <FieldError message={errors.gender} />
              </div>
              <div>
                <Label htmlFor="bloodGroup">
                  Blood group <span className="font-normal text-slate-400">({t("common.optional")})</span>
                </Label>
                <Select
                  id="bloodGroup"
                  value={personal.bloodGroup}
                  onChange={(e) => setPersonal((p) => ({ ...p, bloodGroup: e.target.value }))}
                >
                  <option value="">Selectâ€¦</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 â€” address */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.address")}</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="houseNo">House / flat no.</Label>
                <Input
                  id="houseNo"
                  value={address.houseNo}
                  onChange={(e) => setAddress((a) => ({ ...a, houseNo: e.target.value }))}
                  placeholder="e.g. B-204"
                />
                <FieldError message={errors.houseNo} />
              </div>
              <div>
                <Label htmlFor="street">Street / locality</Label>
                <Input
                  id="street"
                  value={address.street}
                  onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                  placeholder="e.g. MG Road, Sector 14"
                />
                <FieldError message={errors.street} />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="e.g. New Delhi"
                />
                <FieldError message={errors.city} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  placeholder="e.g. Delhi"
                />
                <FieldError message={errors.state} />
              </div>
              <div>
                <Label htmlFor="pincode">PIN code</Label>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))
                  }
                  placeholder="6 digits"
                />
                <FieldError message={errors.pincode} />
              </div>
            </div>
          </>
        )}

        {/* STEP 3 â€” documents */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.documents")}</h2>
            <Hint>Max 1 MB each. Files stay inside this demo â€” nothing is sent anywhere.</Hint>
            <div className="mt-4 space-y-3">
              {DOC_LIST.map((d) => {
                const uploaded = docs.find((x) => x.type === d.type);
                return (
                  <div
                    key={d.type}
                    className={cn(
                      "rounded-xl border p-3 transition-colors",
                      uploaded ? "border-emerald-300 bg-emerald-50/60" : "border-dashed border-slate-300",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          {uploaded?.mimeType.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FileText className={cn("h-4 w-4", uploaded ? "text-emerald-600" : "text-slate-400")} />
                          )}
                          {d.label}
                          {uploaded && <Check className="h-4 w-4 text-emerald-600" />}
                        </p>
                        <p className="truncate text-xs text-slate-500">{uploaded ? uploaded.fileName : d.hint}</p>
                      </div>
                      <label className="shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                        {uploaded ? "Replace" : "Upload"}
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => handleFile(d.type, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
            <FieldError message={errors.documents} />
          </>
        )}

        {/* STEP 4 â€” review */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.review")}</h2>
            <div className="mt-3 space-y-4 text-sm">
              <ReviewBlock title={t("step.type")} onEdit={() => setStep(0)}>
                {TYPE_META[type].label} Â· {selectedRto?.name} ({selectedRto?.code})
              </ReviewBlock>
              <ReviewBlock title={t("step.personal")} onEdit={() => setStep(1)}>
                {personal.fullName}, {personal.dob} Â· {personal.gender}
                <br />
                Father&apos;s name: {personal.fatherName}
                {personal.bloodGroup ? ` Â· Blood: ${personal.bloodGroup}` : ""}
              </ReviewBlock>
              <ReviewBlock title={t("step.address")} onEdit={() => setStep(2)}>
                {address.houseNo}, {address.street}, {address.city}, {address.state} â€” {address.pincode}
              </ReviewBlock>
              <ReviewBlock title={t("step.documents")} onEdit={() => setStep(3)}>
                <ul className="space-y-1">
                  {DOC_LIST.map((d) => {
                    const doc = docs.find((x) => x.type === d.type);
                    return (
                      <li key={d.type} className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-600" /> {d.label}:{" "}
                        <span className="truncate text-slate-500">{doc?.fileName}</span>
                      </li>
                    );
                  })}
                </ul>
              </ReviewBlock>
              <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
                Fee payable after document verification:{" "}
                <strong className="text-slate-900">
                  {formatINR(feeFor(type).base + feeFor(type).convenience)}
                </strong>{" "}
                ({formatINR(feeFor(type).base)} application + {formatINR(feeFor(type).convenience)} processing)
              </div>
            </div>
          </>
        )}

        {/* Nav buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={goBack} type="button">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Button>
          ) : (
            <span />
          )}
          {step < STEP_KEYS.length - 1 ? (
            <Button onClick={goNext} type="button">
              {t("common.next")} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={pending} size="md">
              {pending ? t("common.loading") : t("common.submit")}
            </Button>
          )}
        </div>
      </Card>

      <p className="text-center text-xs text-slate-400">
        Demo prototype â€” all details you enter are mock data stored locally.
      </p>
    </div>
  );
}

function ReviewBlock({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-wide text-slate-400 uppercase">{title}</h3>
        <button onClick={onEdit} className="text-xs font-semibold text-blue-600 hover:underline">
          Edit
        </button>
      </div>
      <div className="leading-relaxed text-slate-800">{children}</div>
    </div>
  );
}


