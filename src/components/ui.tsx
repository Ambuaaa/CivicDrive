import Link from "next/link";
import { cn } from "@/lib/utils";

/* ---------- Buttons ---------- */

export function buttonClasses(variant = "primary", size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "px-3 py-1.5 text-sm",
    size === "md" && "px-4 py-2.5 text-sm sm:text-base min-h-11",
    size === "lg" && "px-6 py-3 text-base sm:text-lg min-h-12 w-full",
    variant === "primary" && "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
    variant === "secondary" &&
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800",
    variant === "success" && "bg-emerald-600 text-white hover:bg-emerald-700",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return <button className={buttonClasses(variant, size, className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ---------- Form fields ---------- */

export const inputClasses =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClasses, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClasses, "appearance-none pr-9 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[right_0.75rem_center] bg-no-repeat", props.className)} />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClasses, props.className)} />;
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1 text-sm font-medium text-rose-600">
      <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
        <path
          fillRule="evenodd"
          d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1Zm0 8a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 10 14Z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{children}</p>;
}

/* ---------- Surfaces ---------- */

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{children}</h2>
      {sub ? <p className="mt-1 text-sm text-slate-500">{sub}</p> : null}
    </div>
  );
}
