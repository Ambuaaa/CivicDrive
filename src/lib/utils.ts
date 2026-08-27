import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** yyyy-mm-dd -> 28 Aug 2026 */
export function formatDate(iso: string) {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "14:30" -> "2:30 PM" */
export function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function generateApplicationNumber(seq: number) {
  const year = new Date().getFullYear();
  return `CD-${year}-${(seq % 900000 + 100000).toString()}${String(seq).slice(-1)}`;
}

export function randomTxnId() {
  return `TXN-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
}

export function generateLicenceNumber(rtoCode: string) {
  const digits = rtoCode.replace(/\D/g, "").padStart(2, "0");
  const rand = Math.floor(Math.random() * 90000000 + 10000000);
  return `${digits}${new Date().getFullYear()}${rand}`.slice(0, 15);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
