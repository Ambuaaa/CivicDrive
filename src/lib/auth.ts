import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";

const COOKIE_NAME = "cd_session";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

/* ---------------- passwords ---------------- */

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/* ---------------- signed cookie session ---------------- */

function sign(value: string) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

function makeToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId?: string };
    return parsed.userId ?? null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Returns the logged-in user or null. Safe to call anywhere on the server. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const userId = readToken(store.get(COOKIE_NAME)?.value);
    if (!userId) return null;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return null;
    return user as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN) throw new Error("FORBIDDEN");
  return user;
}
