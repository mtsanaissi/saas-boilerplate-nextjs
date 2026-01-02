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
import type { BillingSubscription } from "@/types/billing";
import { createBillingPortalSession } from "@/app/billing/actions";
import {
  signOutAllSessions,
  signOutOtherSessions,
  updateConsents,
} from "@/app/settings/security-actions";
import { getSessionIdFromAccessToken } from "@/lib/auth/session";
import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import type { UserConsent, UserSession } from "@/types/security";
import type { AuditLogEntry } from "@/types/security";

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

  const [t, tErrors, tUsage, tDashboard] = await Promise.all([
    getTranslations({ locale, namespace: "settings" }),
    getTranslations({ locale, namespace: "errors" }),
    getTranslations({ locale, namespace: "usage" }),
    getTranslations({ locale, namespace: "dashboard" }),
  ]);

  const [{ data: freshProfile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, locale")
      .eq("id", userId)
      .maybeSingle<UserProfile>(),
    supabase
      .from("billing_subscriptions")
      .select("status, current_period_end, cancel_at_period_end")
      .eq("user_id", userId)
      .maybeSingle<BillingSubscription>(),
  ]);

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

  const planName = tDashboard(`planNames.${planId}`);
  const planStatusLabel = tDashboard(`planStatuses.${planStatus}`);
  const renewalDate = subscription?.current_period_end
    ? dateFormatter.format(new Date(subscription.current_period_end))
    : null;

  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token ?? null;
  const sessionId = getSessionIdFromAccessToken(accessToken);
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const ipAddress = await getClientIpFromHeaders();

  if (sessionId) {
    await supabase
      .from("user_sessions")
      .upsert({
        session_id: sessionId,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
  }

  const [{ data: consents }, { data: sessions }, { data: auditLogs }] =
    await Promise.all([
    supabase
      .from("user_consents")
      .select(
        "user_id, analytics_enabled, marketing_enabled, terms_accepted_at, privacy_accepted_at",
      )
      .eq("user_id", userId)
      .maybeSingle<UserConsent>(),
    supabase
      .from("user_sessions")
      .select(
        "session_id, user_id, ip_address, user_agent, created_at, last_seen_at",
      )
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .returns<UserSession[]>(),
    supabase
      .from("audit_logs")
      .select("id, action, created_at, ip_address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<AuditLogEntry[]>(),
  ]);

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

      <div className="divider text-xs uppercase">{t("billingTitle")}</div>
      <div className="space-y-2 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">{t("billingSubtitle")}</p>
        {subscription ? (
          <>
            <p>
              {t("billingPlanLabel")}:{" "}
              <span className="font-semibold">{planName}</span>
            </p>
            <p>
              {t("billingStatusLabel")}:{" "}
              <span className="font-semibold">{planStatusLabel}</span>
            </p>
            {subscription.cancel_at_period_end && renewalDate ? (
              <p className="text-xs text-base-content/60">
                {t("billingCancelLabel")}: {renewalDate}
              </p>
            ) : renewalDate ? (
              <p className="text-xs text-base-content/60">
                {t("billingRenewalLabel")}: {renewalDate}
              </p>
            ) : null}
            <form action={createBillingPortalSession}>
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="btn btn-outline btn-sm mt-2">
                {t("manageBilling")}
              </button>
            </form>
          </>
        ) : (
          <p className="text-sm text-base-content/70">{t("noBilling")}</p>
        )}
      </div>

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

      <div className="divider text-xs uppercase" id="sessions">
        {t("sessionsTitle")}
      </div>
      <div className="space-y-2 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">
          {t("sessionsSubtitle")}
        </p>
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((sessionItem) => {
              const isCurrent = sessionId === sessionItem.session_id;
              const label = isCurrent
                ? t("currentSession")
                : t("otherSessions");
              return (
                <li
                  key={sessionItem.session_id}
                  className="rounded border border-base-300 p-3 text-xs text-base-content/70"
                >
                  <div className="font-semibold text-base-content">
                    {label}
                  </div>
                  <div>IP: {sessionItem.ip_address ?? "unknown"}</div>
                  <div>User agent: {sessionItem.user_agent ?? "unknown"}</div>
                  <div>
                    Last seen:{" "}
                    {dateFormatter.format(new Date(sessionItem.last_seen_at))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-base-content/70">
            {t("sessionsEmpty")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <form action={signOutOtherSessions}>
            <input type="hidden" name="locale" value={locale} />
            {sessionId ? (
              <input type="hidden" name="currentSessionId" value={sessionId} />
            ) : null}
            <button type="submit" className="btn btn-outline btn-sm">
              {t("signOutOthers")}
            </button>
          </form>
          <form action={signOutAllSessions}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="btn btn-outline btn-sm">
              {t("signOutAll")}
            </button>
          </form>
        </div>
      </div>

      <div className="divider text-xs uppercase" id="consents">
        {t("consentsTitle")}
      </div>
      <div className="space-y-2 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">
          {t("consentsSubtitle")}
        </p>
        <form action={updateConsents} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="analyticsEnabled"
              className="checkbox checkbox-sm"
              defaultChecked={consents?.analytics_enabled ?? true}
            />
            <span>{t("analyticsConsent")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="marketingEnabled"
              className="checkbox checkbox-sm"
              defaultChecked={consents?.marketing_enabled ?? false}
            />
            <span>{t("marketingConsent")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="termsAccepted"
              className="checkbox checkbox-sm"
              defaultChecked={Boolean(consents?.terms_accepted_at)}
            />
            <span>{t("termsConsent")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="privacyAccepted"
              className="checkbox checkbox-sm"
              defaultChecked={Boolean(consents?.privacy_accepted_at)}
            />
            <span>{t("privacyConsent")}</span>
          </label>
          <button type="submit" className="btn btn-primary btn-sm">
            {t("saveConsents")}
          </button>
        </form>
      </div>

      <div className="divider text-xs uppercase" id="audit-logs">
        {t("auditLogsTitle")}
      </div>
      <div className="space-y-2 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">
          {t("auditLogsSubtitle")}
        </p>
        {auditLogs && auditLogs.length > 0 ? (
          <ul className="space-y-2 text-xs text-base-content/70">
            {auditLogs.map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-base-300 p-3"
              >
                <div className="font-semibold text-base-content">
                  {entry.action}
                </div>
                <div>
                  {dateFormatter.format(new Date(entry.created_at))} •{" "}
                  {entry.ip_address ?? "unknown"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-base-content/70">
            {t("auditLogsEmpty")}
          </p>
        )}
      </div>

      <p className="text-sm text-center text-base-content/70">
        <Link href="/dashboard" locale={locale} className="link link-primary">
          {t("backToDashboard")}
        </Link>
      </p>
    </AuthCard>
  );
}
