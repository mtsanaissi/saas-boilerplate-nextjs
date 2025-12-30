import { requirePlanAccess } from "@/lib/auth/guards";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

interface AnalyticsPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  await requirePlanAccess(locale, "/dashboard/analytics", "starter");
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{t("analyticsTitle")}</h1>
          <p className="text-sm text-base-content/70">{t("analyticsBody")}</p>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <p className="text-sm text-base-content/70">
              {t("analyticsPlaceholder")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
