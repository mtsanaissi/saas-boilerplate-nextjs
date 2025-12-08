import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SaaS Boilerplate",
  description: "Next.js, Supabase, Stripe, Tailwind v4 & DaisyUI",
};

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const [supabase, tNav] = await Promise.all([
    createClient(),
    getTranslations({ locale, namespace: "nav" }),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-base-200 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="navbar bg-base-100 border-b border-base-300 px-4">
            <div className="flex-1">
              <Link
                href={{ pathname: "/", locale }}
                className="btn btn-ghost normal-case text-xl"
              >
                SaaS Boilerplate
              </Link>
            </div>
            <div className="flex-none gap-2">
              <Link
                href={{ pathname: "/plans", locale }}
                className="btn btn-ghost btn-sm"
              >
                {tNav("plans")}
              </Link>
              {user ? (
                <>
                  <Link
                    href={{ pathname: "/dashboard", locale }}
                    className="btn btn-ghost btn-sm"
                  >
                    {tNav("dashboard")}
                  </Link>
                  <form action={signOut}>
                    <button type="submit" className="btn btn-outline btn-sm">
                      {tNav("signOut")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href={{ pathname: "/auth/login", locale }}
                    className="btn btn-ghost btn-sm"
                  >
                    {tNav("signIn")}
                  </Link>
                  <Link
                    href={{ pathname: "/auth/register", locale }}
                    className="btn btn-primary btn-sm"
                  >
                    {tNav("getStarted")}
                  </Link>
                </>
              )}
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
