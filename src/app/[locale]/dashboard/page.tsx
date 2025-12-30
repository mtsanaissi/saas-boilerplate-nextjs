import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { hasPlanAccess, requireProfile } from "@/lib/auth/guards";
import type { PlanId, PlanStatus } from "@/types/billing";

interface DashboardPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const { profile, email } = await requireProfile(locale, "/dashboard");
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const displayName = profile?.display_name ?? email ?? "";
  const preferredLocale = profile?.locale ?? locale;
  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const hasActivePlan = planStatus === "trialing" || planStatus === "active";
  const canAccessAnalytics = hasPlanAccess(planId, "starter") && hasActivePlan;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-base-content/70">
            {t("signedInAs", { name: displayName })}
          </p>
          <p className="text-xs text-base-content/60">
            {t("localeLabel", { locale: preferredLocale })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">{t("currentPlanTitle")}</h2>
              <p className="text-sm text-base-content/70">
                {t("currentPlanBody", { plan: "Free" })}
              </p>
              <div className="card-actions mt-4">
                <Link
                  href="/plans"
                  locale={locale}
                  className="btn btn-primary btn-sm"
                >
                  {t("viewPlans")}
                </Link>
                <Link
                  href="/settings"
                  locale={locale}
                  className="btn btn-ghost btn-sm"
                >
                  {t("viewSettings")}
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">{t("analyticsTitle")}</h2>
              <p className="text-sm text-base-content/70">
                {t("analyticsBody")}
              </p>
              <div className="card-actions mt-4">
                {canAccessAnalytics ? (
                  <Link
                    href="/dashboard/analytics"
                    locale={locale}
                    className="btn btn-ghost btn-sm"
                  >
                    {t("viewAnalytics")}
                  </Link>
                ) : (
                  <Link
                    href="/plans"
                    locale={locale}
                    className="btn btn-primary btn-sm"
                  >
                    {t("upgradePlan")}
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">
                {t("gettingStartedTitle")}
              </h2>
              <ul className="list-disc list-inside text-sm space-y-1 text-base-content/80">
                <li>{t("gettingStartedItems.exploreApi")}</li>
                <li>{t("gettingStartedItems.configureStripe")}</li>
                <li>{t("gettingStartedItems.deploy")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
