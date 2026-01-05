import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface PrivacyPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
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
        <h1 className="text-3xl font-semibold">{t("privacyTitle")}</h1>
        <p className="text-sm text-base-content/60">
          {t("updatedAt", { date: updatedAt })}
        </p>
        <div className="space-y-3 text-sm text-base-content/80">
          <p>{t("privacyParagraphOne")}</p>
          <p>{t("privacyParagraphTwo")}</p>
          <p>{t("privacyParagraphThree")}</p>
        </div>
      </div>
    </div>
  );
}
