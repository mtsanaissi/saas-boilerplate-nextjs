import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import type { AppLocale } from "@/i18n/routing";

interface DevLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DevLayout({ children, params }: DevLayoutProps) {
  const { locale } = await params;
  const devPagesEnabled = process.env.DEV_PAGES_ENABLED === "true";

  if (!devPagesEnabled) {
    notFound();
  }

  if (process.env.NODE_ENV === "production") {
    await requireUser(locale as AppLocale, `/${locale}/dev`);
  }

  return children;
}
