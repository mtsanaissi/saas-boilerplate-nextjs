import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

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
  const appLocale = locale as (typeof routing.locales)[number];
  const showDevLinks = process.env.NODE_ENV !== "production";

  if (!routing.locales.includes(appLocale)) {
    notFound();
  }

  const [supabase, tNav] = await Promise.all([
    createClient(),
    getTranslations({ locale: appLocale, namespace: "nav" }),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <NextIntlClientProvider locale={appLocale}>
      <div className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-base-100 focus:px-3 focus:py-2 focus:shadow"
        >
          {tNav("skipToContent")}
        </a>

        <header className="border-b border-base-300 bg-base-100 px-4">
          <nav className="navbar" aria-label="Primary">
            <div className="flex-1">
              <Link
                href="/"
                locale={appLocale}
                className="btn btn-ghost normal-case text-xl"
              >
                SaaS Boilerplate
              </Link>
            </div>
            <div className="flex-none gap-2">
              <Link
                href="/plans"
                locale={appLocale}
                className="btn btn-ghost btn-sm"
              >
                {tNav("plans")}
              </Link>
              {showDevLinks ? (
                <Link
                  href="/dev"
                  locale={appLocale}
                  className="btn btn-ghost btn-sm"
                >
                  {tNav("dev")}
                </Link>
              ) : null}
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    locale={appLocale}
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
                    href="/auth/login"
                    locale={appLocale}
                    className="btn btn-ghost btn-sm"
                  >
                    {tNav("signIn")}
                  </Link>
                  <Link
                    href="/auth/register"
                    locale={appLocale}
                    className="btn btn-primary btn-sm"
                  >
                    {tNav("getStarted")}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>

        <footer className="border-t border-base-300 bg-base-100 px-4 py-3 text-xs text-base-content/60">
          <div className="max-w-5xl mx-auto">
            © {new Date().getFullYear()} SaaS Boilerplate
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
