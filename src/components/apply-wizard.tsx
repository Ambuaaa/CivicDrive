"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CarFront,
  Check,
  CopyPlus,
  FileText,
  Image as ImageIcon,
  RefreshCcw,
  ShieldCheck,
  Truck,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { submitApplication } from "@/app/actions/applications";
import { Button, Card, FieldError, Hint, Input, Label, Select } from "@/components/ui";
import { useLang, type TKey } from "@/lib/i18n";
import {
  BLOOD_GROUPS,
  GENDERS,
  MAX_UPLOAD_BYTES,
  VEHICLE_CLASS_LABEL,
  feeFor,
  type AppType,
  type DocType,
  type VehicleClass,
} from "@/lib/constants";
import { addressSchema, personalSchema } from "@/lib/validation";
import { cn, formatINR } from "@/lib/utils";
import { mockDigiLockerProvider } from "@/lib/digilocker";

type RtoOption = { id: string; code: string; name: string; city: string };
type Doc = { type: DocType; fileName: string; mimeType: string; dataUrl: string };

const STEP_KEYS: TKey[] = ["step.type", "step.personal", "step.address", "step.documents", "step.review"];

const TYPE_META: Record<AppType, { icon: typeof CarFront; label: string; desc: string }> = {
  NEW_DL: { icon: CarFront, label: "New Driving Licence", desc: "Apply for your first licence" },
  RENEWAL: { icon: RefreshCcw, label: "Renew Licence", desc: "Expiring or expired licence" },
  DUPLICATE: { icon: CopyPlus, label: "Duplicate Licence", desc: "Lost or damaged licence" },
  LL_NEW: { icon: FileText, label: "Learner's Licence", desc: "First step: theory test" },
  LL_TO_DL: { icon: ShieldCheck, label: "LL to DL", desc: "Upgrade learner to permanent" },
};

const VEHICLE_META: Record<VehicleClass, { icon: typeof CarFront; label: string }> = {
  MCWG: { icon: Bike, label: VEHICLE_CLASS_LABEL.MCWG },
  LMV: { icon: CarFront, label: VEHICLE_CLASS_LABEL.LMV },
  MCWG_LMV: { icon: Bike, label: VEHICLE_CLASS_LABEL.MCWG_LMV },
  TRANSPORT: { icon: Truck, label: VEHICLE_CLASS_LABEL.TRANSPORT },
};

const DOC_LIST: { type: DocType; label: string; hint: string }[] = [
  { type: "ID_PROOF", label: "Identity proof", hint: "Aadhaar / Voter ID / Passport (JPG, PNG or PDF)" },
  { type: "ADDRESS_PROOF", label: "Address proof", hint: "Electricity bill / bank passbook (JPG, PNG or PDF)" },
  { type: "PHOTO", label: "Passport photo", hint: "Recent photo with plain background (JPG or PNG)" },
];

/** Applicants must be 18+ — computed once at module load */
const MAX_DOB = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const DRAFT_KEY = "civicdrive_draft_v2";

export function ApplyWizard({ rtos, defaultType }: { rtos: RtoOption[]; defaultType: AppType }) {
  const { t } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [type, setType] = useState<AppType>(defaultType);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("LMV");
  const [rtoId, setRtoId] = useState("");
  const [kycProvider, setKycProvider] = useState<"MOCK" | "DIGILOCKER">("MOCK");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [digiLoading, setDigiLoading] = useState(false);
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
  const [isOffline, setIsOffline] = useState(() =>
    typeof window !== "undefined" ? !window.navigator.onLine : false,
  );

  // Auto-save draft to localStorage (PWA offline queue)
  useEffect(() => {
    let restored = false;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Record<string, unknown>;
        // Defer state sync — effect subscribes to localStorage, not a render cascade
        setTimeout(() => {
          if (d.type) setType(d.type as AppType);
          if (d.vehicleClass) setVehicleClass(d.vehicleClass as VehicleClass);
          if (d.rtoId) setRtoId(d.rtoId as string);
          if (d.personal) setPersonal(d.personal as typeof personal);
          if (d.address) setAddress(d.address as typeof address);
          if ((d.docs as Doc[])?.length) setDocs(d.docs as Doc[]);
        }, 0);
        restored = true;
      }
    } catch {}
    if (restored) setTimeout(() => toast("Draft restored", { description: "Your previous progress was restored." }), 300);
    const on = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ type, vehicleClass, rtoId, personal, address, docs: docs.slice(0, 3) }),
      );
    } catch {}
  }, [type, vehicleClass, rtoId, personal, address, docs]);

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
      toast.error("That file is over 1 MB. Please upload a smaller version — a clear photo works fine.");
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
    setKycProvider("MOCK");
    toast.success(`${DOC_LIST.find((d) => d.type === docType)?.label} uploaded`);
  }

  async function handleDigiPull() {
    if (!/^\d{4}$/.test(aadhaarLast4)) {
      toast.error("Enter last 4 digits of Aadhaar (e.g. 1234)");
      return;
    }
    setDigiLoading(true);
    try {
      const pulled = await mockDigiLockerProvider.pullDocuments(aadhaarLast4);
      setDocs(pulled.map((d) => ({ type: d.type, fileName: d.fileName, mimeType: d.mimeType, dataUrl: d.dataUrl })));
      setKycProvider("DIGILOCKER");
      toast.success("Documents pulled from DigiLocker (mock) — verified");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "DigiLocker pull failed");
    } finally {
      setDigiLoading(false);
    }
  }

  /* ---------------- final submit ---------------- */

  function handleSubmit() {
    if (isOffline) {
      toast.error("You are offline — draft saved, will submit when back online.");
      return;
    }
    startTransition(async () => {
      const res = await submitApplication({
        type,
        vehicleClass,
        rtoId,
        kycProvider,
        digilockerId: kycProvider === "DIGILOCKER" ? `DL-MOCK-${aadhaarLast4}` : undefined,
        personal: { ...personal, bloodGroup: personal.bloodGroup || undefined },
        address,
        documents: docs,
      });
      if (res.ok) {
        localStorage.removeItem(DRAFT_KEY);
        toast.success(`Application ${res.data.applicationNumber} submitted!`);
        router.push(`/application/${res.data.applicationId}?submitted=1`);
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error ?? "Something went wrong.");
      }
    });
  }

  const selectedRto = rtos.find((r) => r.id === rtoId);
  const fees = feeFor(type, vehicleClass);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {isOffline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          <WifiOff className="h-4 w-4" /> You are offline — draft is auto-saved. Submit will resume when online.
        </div>
      )}
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
        {/* STEP 0 — service + vehicle class + RTO */}
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.type")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(Object.keys(TYPE_META) as AppType[]).map((k) => {
                const meta = TYPE_META[k as AppType];
                if (!meta) return null;
                const active = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k as AppType)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <meta.icon className={cn("h-5 w-5", active ? "text-blue-600" : "text-slate-400")} />
                    <p className="mt-2 text-sm font-bold text-slate-900">{meta.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{meta.desc}</p>
                  </button>
                );
              })}
            </div>

            <h3 className="mt-5 text-sm font-bold text-slate-900">Vehicle class</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              {(Object.keys(VEHICLE_META) as VehicleClass[]).map((vc) => {
                const m = VEHICLE_META[vc];
                const active = vehicleClass === vc;
                return (
                  <button
                    key={vc}
                    type="button"
                    onClick={() => setVehicleClass(vc)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl border p-2.5 text-center transition-all",
                      active ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <m.icon className={cn("mx-auto h-5 w-5", active ? "text-blue-600" : "text-slate-400")} />
                    <span className="mt-1 block text-xs font-bold text-slate-900">{m.label}</span>
                    <span className="block text-[11px] text-slate-500">{vc}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              Fee: <strong>{formatINR(fees.total)}</strong> ({formatINR(fees.base)} + {formatINR(fees.convenience)} processing)
              {vehicleClass !== "LMV" && vehicleClass !== "MCWG" && (
                <span className="text-slate-500"> incl. {formatINR(fees.base - (feeFor(type, "LMV").base))} class surcharge</span>
              )}
            </div>

            <div className="mt-5">
              <Label htmlFor="rto">RTO office</Label>
              <Select id="rto" value={rtoId} onChange={(e) => setRtoId(e.target.value)}>
                <option value="">Choose your RTO…</option>
                {rtos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) — {r.city}
                  </option>
                ))}
              </Select>
              <Hint>Your driving test happens at this office.</Hint>
              <FieldError message={errors.rtoId} />
            </div>
          </>
        )}

        {/* STEP 1 — personal */}
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
                  <option value="">Select…</option>
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
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 — address */}
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

        {/* STEP 3 — documents with DigiLocker */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.documents")}</h2>
            <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="flex items-center gap-2 text-sm font-bold text-blue-900">
                <ShieldCheck className="h-4 w-4" /> Pull from DigiLocker (recommended)
              </p>
              <p className="mt-1 text-xs text-blue-700">Verified docs skip manual review — faster approval. Mock provider for demo.</p>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Last 4 of Aadhaar (e.g. 1234)"
                  inputMode="numeric"
                  maxLength={4}
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="max-w-[160px]"
                />
                <Button size="sm" variant="secondary" onClick={handleDigiPull} disabled={digiLoading}>
                  {digiLoading ? "Pulling…" : "Pull docs"}
                </Button>
              </div>
              {kycProvider === "DIGILOCKER" && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> DigiLocker verified — 3 docs loaded
                </p>
              )}
            </div>

            <div className="my-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              <span className="h-px flex-1 bg-slate-200" /> or upload manually <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Hint>Max 1 MB each. Files stay inside this demo — nothing is sent anywhere.</Hint>
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

        {/* STEP 4 — review */}
        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-slate-900">{t("step.review")}</h2>
            <div className="mt-3 space-y-4 text-sm">
              <ReviewBlock title={t("step.type")} onEdit={() => setStep(0)}>
                {TYPE_META[type]?.label ?? type} · {VEHICLE_CLASS_LABEL[vehicleClass]} · {selectedRto?.name} ({selectedRto?.code})
                {kycProvider === "DIGILOCKER" && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">DigiLocker</span>}
              </ReviewBlock>
              <ReviewBlock title={t("step.personal")} onEdit={() => setStep(1)}>
                {personal.fullName}, {personal.dob} · {personal.gender}
                <br />
                Father&apos;s name: {personal.fatherName}
                {personal.bloodGroup ? ` · Blood: ${personal.bloodGroup}` : ""}
              </ReviewBlock>
              <ReviewBlock title={t("step.address")} onEdit={() => setStep(2)}>
                {address.houseNo}, {address.street}, {address.city}, {address.state} — {address.pincode}
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
                <strong className="text-slate-900">{formatINR(fees.total)}</strong> ({formatINR(fees.base)} application +{" "}
                {formatINR(fees.convenience)} processing)
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
        Demo prototype — all details you enter are mock data stored locally.{" "}
        <button onClick={() => { localStorage.removeItem(DRAFT_KEY); toast("Draft cleared"); }} className="underline">
          Clear draft
        </button>
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


