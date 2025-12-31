import { requireProfile } from "@/lib/auth/guards";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import type { UsageBalance, UsageEvent } from "@/types/usage";
import type { PlanId, PlanStatus } from "@/types/billing";
import { getCreditsTotalForPlanStatus } from "@/lib/usage/limits";
import { getCurrentPeriodRange } from "@/lib/usage/period";

interface UsagePageProps {
  params: Promise<{ locale: AppLocale }>;
}

export default async function UsagePage({ params }: UsagePageProps) {
  const { locale } = await params;
  const { supabase, userId, profile } = await requireProfile(locale, "/usage");
  const t = await getTranslations({ locale, namespace: "usage" });

  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const { periodStart, periodEnd } = getCurrentPeriodRange();

  const [{ data: usageBalance }, { data: usageEvents }] = await Promise.all([
    supabase
      .from("usage_balances")
      .select("credits_total, credits_used, period_start, period_end")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .maybeSingle<UsageBalance>(),
    supabase
      .from("usage_events")
      .select("id, feature, amount, created_at, period_start")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<UsageEvent[]>(),
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
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const formattedReset = dateFormatter.format(
    new Date(`${resetDate}T00:00:00Z`),
  );
  const formattedPeriodStart = dateFormatter.format(
    new Date(`${periodStart}T00:00:00Z`),
  );
  const formattedPeriodEnd = dateFormatter.format(
    new Date(`${periodEnd}T00:00:00Z`),
  );

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-base-content/70">{t("subtitle")}</p>
          <p className="text-xs text-base-content/60">
            {t("periodLabel", {
              start: formattedPeriodStart,
              end: formattedPeriodEnd,
            })}
          </p>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            {creditsTotal > 0 ? (
              <div className="space-y-1 text-sm text-base-content/80">
                <p>
                  {t("creditsRemaining")}:{" "}
                  <span className="font-semibold">{creditsRemaining}</span>
                </p>
                <p>
                  {t("creditsUsed")}:{" "}
                  <span className="font-semibold">{creditsUsed}</span>
                </p>
                <p className="text-xs text-base-content/60">
                  {t("resetOn", { date: formattedReset })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-base-content/70">{t("noCredits")}</p>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base">{t("eventsTitle")}</h2>
            {usageEvents && usageEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t("featureLabel")}</th>
                      <th>{t("creditsLabel")}</th>
                      <th>{t("whenLabel")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageEvents.map((event) => (
                      <tr key={event.id}>
                        <td>{event.feature}</td>
                        <td>{event.amount}</td>
                        <td>
                          {dateTimeFormatter.format(new Date(event.created_at))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-base-content/70">{t("emptyEvents")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
