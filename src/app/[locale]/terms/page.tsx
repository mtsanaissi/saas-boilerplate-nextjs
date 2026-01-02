import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface TermsPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const updatedAt = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date("2025-12-31T00:00:00Z"));

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
        <h1 className="text-3xl font-semibold">{t("termsTitle")}</h1>
        <p className="text-sm text-base-content/60">
          {t("updatedAt", { date: updatedAt })}
        </p>
        <div className="space-y-3 text-sm text-base-content/80">
          <p>
            These terms govern your use of the service. By creating an account or
            using the product, you agree to these terms.
          </p>
          <p>
            You are responsible for maintaining the security of your account and
            for any activity that occurs under your account.
          </p>
          <p>
            Subscriptions renew automatically unless canceled. Refunds are handled
            according to the billing provider policy.
          </p>
        </div>
      </div>
    </div>
  );
}
