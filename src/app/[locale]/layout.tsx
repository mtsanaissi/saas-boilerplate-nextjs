import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as (typeof routing.locales)[number];

  if (!routing.locales.includes(appLocale)) {
    return {};
  }

  const tCommon = await getTranslations({
    locale: appLocale,
    namespace: "common",
  });

  return {
    title: tCommon("appName"),
    description: tCommon("appDescription"),
  };
}

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
  const devPagesEnabled = process.env.DEV_PAGES_ENABLED === "true";

  if (!routing.locales.includes(appLocale)) {
    notFound();
  }

  const [supabase, tNav, tCommon] = await Promise.all([
    createClient(),
    getTranslations({ locale: appLocale, namespace: "nav" }),
    getTranslations({ locale: appLocale, namespace: "common" }),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showDevLinks =
    devPagesEnabled && (process.env.NODE_ENV !== "production" || Boolean(user));

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
          <nav className="navbar" aria-label={tNav("primaryNavLabel")}>
            <div className="flex-1">
              <Link
                href="/"
                locale={appLocale}
                className="btn btn-ghost normal-case text-xl"
              >
                {tCommon("appName")}
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
                  <Link
                    href="/settings"
                    locale={appLocale}
                    className="btn btn-ghost btn-sm"
                  >
                    {tNav("settings")}
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
          <div className="max-w-5xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {tCommon("footerCopyright", {
                year: String(new Date().getFullYear()),
              })}
            </span>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                locale={appLocale}
                className="link link-hover"
              >
                {tNav("privacy")}
              </Link>
              <Link
                href="/terms"
                locale={appLocale}
                className="link link-hover"
              >
                {tNav("terms")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
