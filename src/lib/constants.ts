export const ROLES = {
  CITIZEN: "CITIZEN",
  ADMIN: "ADMIN",
} as const;

export const APP_TYPE = {
  NEW_DL: "NEW_DL",
  RENEWAL: "RENEWAL",
  DUPLICATE: "DUPLICATE",
} as const;
export type AppType = keyof typeof APP_TYPE;

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

export function feeFor(type: string) {
  return FEES[type as AppType] ?? FEES.NEW_DL;
}
