export const ROLES = {
  CITIZEN: "CITIZEN",
  ADMIN: "ADMIN",
  RTO_OFFICER: "RTO_OFFICER",
} as const;

export const APP_TYPE = {
  NEW_DL: "NEW_DL",
  RENEWAL: "RENEWAL",
  DUPLICATE: "DUPLICATE",
  LL_NEW: "LL_NEW",
  LL_TO_DL: "LL_TO_DL",
} as const;
export type AppType = keyof typeof APP_TYPE;

export const VEHICLE_CLASS = {
  MCWG: "MCWG",
  LMV: "LMV",
  MCWG_LMV: "MCWG_LMV",
  TRANSPORT: "TRANSPORT",
} as const;
export type VehicleClass = keyof typeof VEHICLE_CLASS;

export const VEHICLE_CLASS_LABEL: Record<VehicleClass, string> = {
  MCWG: "Motorcycle (gear)",
  LMV: "Car (LMV)",
  MCWG_LMV: "Bike + Car",
  TRANSPORT: "Transport",
};

export const STATUS = {
  SUBMITTED: "SUBMITTED",
  DOCS_VERIFIED: "DOCS_VERIFIED",
  FEE_PAID: "FEE_PAID",
  APPOINTMENT_BOOKED: "APPOINTMENT_BOOKED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CORRECTION_REQUIRED: "CORRECTION_REQUIRED",
} as const;
export type AppStatus = keyof typeof STATUS;

/** Milestone order shown on every timeline */
export const TIMELINE: AppStatus[] = [
  STATUS.SUBMITTED,
  STATUS.DOCS_VERIFIED,
  STATUS.FEE_PAID,
  STATUS.APPOINTMENT_BOOKED,
  STATUS.APPROVED,
];

export const FEES: Record<AppType, { base: number; convenience: number }> = {
  NEW_DL: { base: 350, convenience: 50 },
  RENEWAL: { base: 250, convenience: 50 },
  DUPLICATE: { base: 200, convenience: 50 },
  LL_NEW: { base: 200, convenience: 50 },
  LL_TO_DL: { base: 300, convenience: 50 },
};

// Vehicle class surcharge (on top of base)
export const VEHICLE_SURCHARGE: Record<VehicleClass, number> = {
  MCWG: 0,
  LMV: 0,
  MCWG_LMV: 150,
  TRANSPORT: 300,
};

export const DOC_REQUIREMENTS = [
  { type: "ID_PROOF", label: "Identity Proof", hint: "Aadhaar / Voter ID / Passport (mock)" },
  { type: "ADDRESS_PROOF", label: "Address Proof", hint: "Electricity bill / Passbook (mock)" },
  { type: "PHOTO", label: "Passport Photo", hint: "Recent photo, plain background" },
] as const;
export type DocType = (typeof DOC_REQUIREMENTS)[number]["type"];

export const GENDERS = ["Male", "Female", "Other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const MAX_UPLOAD_BYTES = 1024 * 1024; // 1 MB per file (demo limit)

export function feeFor(type: string, vehicleClass: string = "LMV") {
  const base = FEES[type as AppType] ?? FEES.NEW_DL;
  const surcharge = VEHICLE_SURCHARGE[vehicleClass as VehicleClass] ?? 0;
  return { base: base.base + surcharge, convenience: base.convenience, total: base.base + surcharge + base.convenience };
}

export const KYC_PROVIDERS = ["MOCK", "DIGILOCKER"] as const;
