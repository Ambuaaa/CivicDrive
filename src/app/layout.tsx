import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicDrive — Driving licence services made simple",
  description:
    "A cleaner, friendlier way to apply for, renew and track driving licence services. Hackathon prototype with mock data.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          <SiteHeader
            user={user ? { name: user.name, role: user.role } : null}
            onLogout={logoutAction}
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{children}</main>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </LanguageProvider>
      </body>
    </html>
  );
}
