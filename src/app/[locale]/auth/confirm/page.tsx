import { AuthCard } from "@/components/features/auth/AuthCard";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface ConfirmPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function ConfirmPage({ params }: ConfirmPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.confirm" });

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      <p className="text-sm text-base-content/70">{t("body")}</p>
      <div className="mt-6 flex justify-between items-center text-sm">
        <Link href="/" locale={locale} className="link link-hover">
          {t("backToHome")}
        </Link>
        <Link
          href="/auth/login"
          locale={locale}
          className="btn btn-sm btn-outline"
        >
          {t("goToSignIn")}
        </Link>
      </div>
    </AuthCard>
  );
}
