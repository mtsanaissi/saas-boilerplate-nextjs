import { AuthCard } from "@/components/features/auth/AuthCard";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface GoodbyePageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function GoodbyePage({ params }: GoodbyePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "accountDeleted" });

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <p className="text-sm text-base-content/70">{t("body")}</p>
      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/" locale={locale} className="link link-hover">
          {t("backToHome")}
        </Link>
        <Link
          href="/auth/register"
          locale={locale}
          className="btn btn-sm btn-outline"
        >
          {t("createAccount")}
        </Link>
      </div>
    </AuthCard>
  );
}
