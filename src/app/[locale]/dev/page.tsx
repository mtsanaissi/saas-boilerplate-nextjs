import { DevLinkCard } from "@/components/features/dev/DevLinkCard";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

interface DevIndexPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function DevIndexPage({ params }: DevIndexPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dev.index" });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="opacity-80">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DevLinkCard
          locale={locale}
          href="/dev/a11y"
          title={t("links.a11yTitle")}
          description={t("links.a11yDescription")}
        />
        <DevLinkCard
          locale={locale}
          href="/dev/forms"
          title={t("links.formsTitle")}
          description={t("links.formsDescription")}
        />
        <DevLinkCard
          locale={locale}
          href="/dev/errors"
          title={t("links.errorsTitle")}
          description={t("links.errorsDescription")}
        />
      </div>
    </div>
  );
}
