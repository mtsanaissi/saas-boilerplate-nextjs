import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { hasPlanAccess, requireProfile } from "@/lib/auth/guards";
import type { PlanId, PlanStatus } from "@/types/billing";
import type { UsageBalance } from "@/types/usage";
import type { BillingSubscription } from "@/types/billing";
import { getCreditsTotalForPlanStatus } from "@/lib/usage/limits";
import { getCurrentPeriodRange } from "@/lib/usage/period";
import { DevUsageEventButton } from "@/components/features/dev/DevUsageEventButton";

interface DashboardPageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const { profile, email, supabase, userId } = await requireProfile(
    locale,
    "/dashboard",
  );
  const [t, tUsage] = await Promise.all([
    getTranslations({ locale, namespace: "dashboard" }),
    getTranslations({ locale, namespace: "usage" }),
  ]);

  const displayName = profile?.display_name ?? email ?? "";
  const preferredLocale = profile?.locale ?? locale;
  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const hasActivePlan = planStatus === "trialing" || planStatus === "active";
  const canAccessAnalytics = hasPlanAccess(planId, "starter") && hasActivePlan;

  const { periodStart, periodEnd } = getCurrentPeriodRange();
  const [{ data: usageBalance }, { data: subscription }] = await Promise.all([
    supabase
      .from("usage_balances")
      .select("credits_total, credits_used, period_start, period_end")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .maybeSingle<UsageBalance>(),
    supabase
      .from("billing_subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle<BillingSubscription>(),
  ]);

  const creditsTotal =
    usageBalance?.credits_total ??
    getCreditsTotalForPlanStatus(planId, planStatus);
  const creditsUsed = usageBalance?.credits_used ?? 0;
  const creditsRemaining = Math.max(creditsTotal - creditsUsed, 0);
  const resetDate = usageBalance?.period_end ?? periodEnd;
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedReset = dateFormatter.format(
    new Date(`${resetDate}T00:00:00Z`),
  );

  const planName = t(`planNames.${planId}`);
  const planStatusLabel = t(`planStatuses.${planStatus}`);
  const renewalDate = subscription?.current_period_end
    ? dateFormatter.format(new Date(subscription.current_period_end))
    : null;
  const showDevButton = process.env.NODE_ENV !== "production";

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
                {t("currentPlanBody", { plan: planName })}
              </p>
              <p className="text-xs text-base-content/60">
                {t("planStatusLabel", { status: planStatusLabel })}
              </p>
              {subscription?.cancel_at_period_end && renewalDate ? (
                <p className="text-xs text-base-content/60">
                  {t("cancelAtPeriodEndLabel", { date: renewalDate })}
                </p>
              ) : renewalDate ? (
                <p className="text-xs text-base-content/60">
                  {t("renewalLabel", { date: renewalDate })}
                </p>
              ) : null}
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

          <div className="card bg-base-100 shadow-md border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-base">{tUsage("title")}</h2>
              <p className="text-sm text-base-content/70">
                {tUsage("subtitle")}
              </p>
              {creditsTotal > 0 ? (
                <div className="mt-2 space-y-1 text-sm text-base-content/80">
                  <p>
                    {tUsage("creditsRemaining")}:{" "}
                    <span className="font-semibold">{creditsRemaining}</span>
                  </p>
                  <p>
                    {tUsage("creditsUsed")}:{" "}
                    <span className="font-semibold">{creditsUsed}</span>
                  </p>
                  <p className="text-xs text-base-content/60">
                    {tUsage("resetOn", { date: formattedReset })}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-base-content/70">
                  {tUsage("noCredits")}
                </p>
              )}
              <div className="card-actions mt-4">
                <Link
                  href="/usage"
                  locale={locale}
                  className="btn btn-ghost btn-sm"
                >
                  {tUsage("viewDetails")}
                </Link>
                {showDevButton ? (
                  <DevUsageEventButton label={tUsage("devGenerate")} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
