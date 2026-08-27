"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { ROLES } from "@/lib/constants";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function loginAction(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: flatten(parsed.error) };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createSession(user.id);
  redirect(user.role === ROLES.ADMIN ? "/admin" : "/dashboard");
}

export async function registerAction(_prev: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: flatten(parsed.error) };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists. Try logging in." } };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
      role: ROLES.CITIZEN,
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

function flatten(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
