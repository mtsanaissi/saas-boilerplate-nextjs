import { AuthCard } from "@/components/features/auth/AuthCard";
import { updateProfile } from "@/app/settings/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";
import type { UserProfile } from "@/types/profile";
import { requireProfile } from "@/lib/auth/guards";
import type { UsageBalance } from "@/types/usage";
import type { PlanId, PlanStatus } from "@/types/billing";
import { getCreditsTotalForPlanStatus } from "@/lib/usage/limits";
import { getCurrentPeriodRange } from "@/lib/usage/period";

type SettingsSearchParams = {
  error?: string;
  success?: string;
};

interface SettingsPageProps {
  searchParams?: Promise<SettingsSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function SettingsPage({
  searchParams,
  params,
}: SettingsPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<SettingsSearchParams>({}),
  ]);

  const { supabase, userId, profile } = await requireProfile(
    locale,
    "/settings",
  );

  const [t, tErrors, tUsage] = await Promise.all([
    getTranslations({ locale, namespace: "settings" }),
    getTranslations({ locale, namespace: "errors" }),
    getTranslations({ locale, namespace: "usage" }),
  ]);

  const { data: freshProfile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  const hasSuccess = resolvedSearchParams.success === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const formErrorId = errorMessage ? "settings-error" : undefined;

  const resolvedProfile = freshProfile ?? profile;
  const displayName = resolvedProfile?.display_name ?? "";
  const avatarUrl = resolvedProfile?.avatar_url ?? "";
  const preferredLocale =
    resolvedProfile?.locale &&
    routing.locales.includes(resolvedProfile.locale as AppLocale)
      ? (resolvedProfile.locale as AppLocale)
      : locale;

  const planId = (resolvedProfile?.plan_id as PlanId) ?? "free";
  const planStatus = (resolvedProfile?.plan_status as PlanStatus) ?? "free";
  const { periodStart, periodEnd } = getCurrentPeriodRange();
  const { data: usageBalance } = await supabase
    .from("usage_balances")
    .select("credits_total, credits_used, period_start, period_end")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle<UsageBalance>();

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

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {hasSuccess ? (
        <div
          className="alert alert-success text-sm"
          role="status"
          aria-live="polite"
        >
          <span>{t("success")}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          id={formErrorId}
          className="alert alert-error text-sm"
          role="alert"
          aria-live="assertive"
        >
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form action={updateProfile} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div className="form-control">
          <label className="label" htmlFor="displayName">
            <span className="label-text">{t("displayNameLabel")}</span>
          </label>
          <input
            id="displayName"
            type="text"
            name="displayName"
            className="input input-bordered w-full"
            maxLength={80}
            defaultValue={displayName}
            aria-describedby={"display-name-help"}
          />
          <p
            id="display-name-help"
            className="mt-2 text-xs text-base-content/70"
          >
            {t("displayNameHelp")}
          </p>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="avatarUrl">
            <span className="label-text">{t("avatarUrlLabel")}</span>
          </label>
          <input
            id="avatarUrl"
            type="url"
            name="avatarUrl"
            className="input input-bordered w-full"
            placeholder="https://"
            defaultValue={avatarUrl}
            aria-describedby={"avatar-url-help"}
          />
          <p id="avatar-url-help" className="mt-2 text-xs text-base-content/70">
            {t("avatarUrlHelp")}
          </p>
        </div>

        <div className="form-control">
          <label className="label" htmlFor="localePreference">
            <span className="label-text">{t("localeLabel")}</span>
          </label>
          <select
            id="localePreference"
            name="localePreference"
            className="select select-bordered w-full"
            defaultValue={preferredLocale}
          >
            {routing.locales.map((localeOption) => (
              <option key={localeOption} value={localeOption}>
                {localeOption.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {t("save")}
          </button>
        </div>
      </form>

      <div className="divider text-xs uppercase">{tUsage("title")}</div>

      <div className="space-y-2 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">{tUsage("subtitle")}</p>
        {creditsTotal > 0 ? (
          <>
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
          </>
        ) : (
          <p className="text-sm text-base-content/70">{tUsage("noCredits")}</p>
        )}
        <Link href="/usage" locale={locale} className="link link-primary">
          {tUsage("viewDetails")}
        </Link>
      </div>

      <p className="text-sm text-center text-base-content/70">
        <Link href="/dashboard" locale={locale} className="link link-primary">
          {t("backToDashboard")}
        </Link>
      </p>
    </AuthCard>
  );
}
