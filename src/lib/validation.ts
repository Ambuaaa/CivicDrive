import { z } from "zod";

/* Friendly, specific messages — users should never see just "Invalid input". */

const nameField = (label: string) =>
  z
    .string()
    .trim()
    .min(3, `${label} must be at least 3 letters`)
    .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, `${label} can only contain letters and spaces`);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export const registerSchema = z.object({
  name: nameField("Full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Mobile number must be 10 digits starting with 6-9"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const personalSchema = z.object({
  fullName: nameField("Full name"),
  fatherName: nameField("Father's name"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be a valid date")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime());
    }, "Date of birth must be a valid date")
    .refine((v) => {
      const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age >= 18;
    }, "You must be at least 18 years old to apply")
    .refine((v) => {
      const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);
      return age < 120;
    }, "Please enter a realistic date of birth"),
  gender: z.enum(["Male", "Female", "Other"], { message: "Please select a gender" }),
  bloodGroup: z.string().optional(),
});

export const addressSchema = z.object({
  houseNo: z.string().trim().min(1, "House / flat number is required").max(60),
  street: z.string().trim().min(3, "Street / locality must be at least 3 characters").max(120),
  city: z.string().trim().min(2, "City is required").max(60),
  state: z.string().trim().min(2, "State is required").max(60),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "PIN code must contain exactly 6 digits (e.g. 110001)"),
});

const docDataSchema = z.object({
  type: z.enum(["ID_PROOF", "ADDRESS_PROOF", "PHOTO"]),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  dataUrl: z
    .string()
    .startsWith("data:", "File could not be read")
    .max(1_600_000, "Each file must be under 1 MB — please upload a smaller file"),
});

export const submitApplicationSchema = z.object({
  type: z.enum(["NEW_DL", "RENEWAL", "DUPLICATE"]),
  rtoId: z.string().min(1, "Please choose your RTO"),
  personal: personalSchema,
  address: addressSchema,
  documents: z
    .array(docDataSchema)
    .length(3, "Please upload all 3 documents before submitting"),
});

export const paySchema = z.object({
  applicationId: z.string().min(1),
  method: z.enum(["upi", "card", "netbanking"], { message: "Choose a payment method" }),
});

export const bookSlotSchema = z.object({
  applicationId: z.string().min(1),
  slotId: z.string().min(1, "Please pick an available slot"),
});
