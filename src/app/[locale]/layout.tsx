import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/features/navigation/Navbar";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { assertServerEnv, getFeatureFlags } from "@/lib/env/server";

assertServerEnv();

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
  const { devPages: devPagesEnabled } = getFeatureFlags();

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

        <header className="fixed top-0 inset-x-0 z-50 border-b border-base-300 bg-base-100 px-4">
          <Navbar
            appLocale={appLocale}
            appName={tCommon("appName")}
            labels={{
              primaryNavLabel: tNav("primaryNavLabel"),
              menuToggleLabel: tNav("menuToggleLabel"),
              plans: tNav("plans"),
              dev: tNav("dev"),
              dashboard: tNav("dashboard"),
              settings: tNav("settings"),
              signIn: tNav("signIn"),
              signOut: tNav("signOut"),
              getStarted: tNav("getStarted"),
            }}
            showDevLinks={showDevLinks}
            isAuthenticated={Boolean(user)}
          />
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 pt-16">
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
