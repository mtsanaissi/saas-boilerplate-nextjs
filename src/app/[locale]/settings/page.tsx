import { AuthCard } from "@/components/features/auth/AuthCard";
import { updateProfile } from "@/app/settings/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import NextLink from "next/link";
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
import {
  confirmAccountDeletion,
  requestAccountDeletion,
} from "@/app/settings/account-actions";
import { requestEmailChange } from "@/app/settings/email-actions";
import { getSessionIdFromAccessToken } from "@/lib/auth/session";
import { upsertUserSession } from "@/lib/auth/session-tracking";
import { headers } from "next/headers";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import type {
  AccountDeletionRequest,
  UserConsent,
  UserSession,
} from "@/types/security";
import type { AuditLogEntry } from "@/types/security";

type SettingsSearchParams = {
  error?: string;
  success?: string;
  accountDeletionRequested?: string;
  emailChangeRequested?: string;
  emailChange?: string;
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

  const { supabase, userId, profile, email } = await requireProfile(
    locale,
    "/settings",
  );

  const [t, tErrors, tUsage, tDashboard] = await Promise.all([
    getTranslations({ locale, namespace: "settings" }),
    getTranslations({ locale, namespace: "errors" }),
    getTranslations({ locale, namespace: "usage" }),
    getTranslations({ locale, namespace: "dashboard" }),
  ]);
  const deletionConfirmPhrase = t("deletionConfirmPhrase");

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
  const hasDeletionRequested =
    resolvedSearchParams.accountDeletionRequested === "1";
  const hasEmailChangeRequested =
    resolvedSearchParams.emailChangeRequested === "1";
  const hasEmailChangeConfirmed = resolvedSearchParams.emailChange === "1";
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
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const ipAddress = await getClientIpFromHeaders();

  await upsertUserSession({
    supabase,
    accessToken,
    userId,
    ipAddress,
    userAgent,
  });

  const sessionId = getSessionIdFromAccessToken(accessToken);

  const sessionRetentionDays = 90;
  const staleCutoffDate = new Date();
  staleCutoffDate.setDate(staleCutoffDate.getDate() - sessionRetentionDays);
  const staleCutoff = staleCutoffDate.toISOString();
  await supabase
    .from("user_sessions")
    .delete()
    .eq("user_id", userId)
    .lt("last_seen_at", staleCutoff);

  const [
    { data: consents },
    { data: sessions },
    { data: auditLogs },
    { data: deletionRequest },
  ] = await Promise.all([
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
    supabase
      .from("account_deletion_requests")
      .select("user_id, token, requested_at, expires_at, confirmed_at")
      .eq("user_id", userId)
      .maybeSingle<AccountDeletionRequest>(),
  ]);

  const now = new Date().getTime();
  const deletionRequestActive =
    deletionRequest !== null &&
    new Date(deletionRequest.expires_at).getTime() > now;
  const deletionRequestExpired =
    deletionRequest !== null && !deletionRequestActive;
  const formattedDeletionExpires =
    deletionRequestActive && deletionRequest
      ? dateFormatter.format(new Date(deletionRequest.expires_at))
      : null;
  const deletionRequestToken = deletionRequest?.token ?? "";

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
            placeholder={t("avatarUrlPlaceholder")}
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

      <div className="divider text-xs uppercase" id="email">
        {t("emailTitle")}
      </div>
      <div className="space-y-3 text-sm text-base-content/80">
        <p className="text-sm text-base-content/70">{t("emailSubtitle")}</p>
        <p>
          {t("currentEmailLabel")}:{" "}
          <span className="font-semibold">{email ?? t("unknownValue")}</span>
        </p>
        {hasEmailChangeRequested ? (
          <div
            className="alert alert-success text-sm"
            role="status"
            aria-live="polite"
          >
            <span>{t("emailChangeRequested")}</span>
          </div>
        ) : null}
        {hasEmailChangeConfirmed ? (
          <div
            className="alert alert-success text-sm"
            role="status"
            aria-live="polite"
          >
            <span>{t("emailChangeConfirmed")}</span>
          </div>
        ) : null}
        <form action={requestEmailChange} className="space-y-2">
          <input type="hidden" name="locale" value={locale} />
          <label className="form-control">
            <span className="label-text text-sm">{t("newEmailLabel")}</span>
            <input
              id="newEmail"
              type="email"
              name="newEmail"
              className="input input-bordered w-full"
              placeholder={t("newEmailPlaceholder")}
              autoComplete="email"
              aria-describedby="email-change-help"
            />
          </label>
          <p id="email-change-help" className="text-xs text-base-content/60">
            {t("emailChangeHelp")}
          </p>
          <button type="submit" className="btn btn-outline btn-sm">
            {t("emailChangeCta")}
          </button>
        </form>
      </div>

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
        <p className="text-sm text-base-content/70">{t("sessionsSubtitle")}</p>
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((sessionItem) => {
              const isCurrent = sessionId === sessionItem.session_id;
              const label = isCurrent
                ? t("currentSession")
                : t("otherSessions");
              const unknownValue = t("unknownValue");
              return (
                <li
                  key={sessionItem.session_id}
                  className="rounded border border-base-300 p-3 text-xs text-base-content/70"
                >
                  <div className="font-semibold text-base-content">{label}</div>
                  <div>
                    {t("ipLabel", {
                      value: sessionItem.ip_address ?? unknownValue,
                    })}
                  </div>
                  <div>
                    {t("userAgentLabel", {
                      value: sessionItem.user_agent ?? unknownValue,
                    })}
                  </div>
                  <div>
                    {t("lastSeenLabel", {
                      date: dateFormatter.format(
                        new Date(sessionItem.last_seen_at),
                      ),
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-base-content/70">{t("sessionsEmpty")}</p>
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
        <p className="text-sm text-base-content/70">{t("consentsSubtitle")}</p>
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
        <p className="text-sm text-base-content/70">{t("auditLogsSubtitle")}</p>
        {auditLogs && auditLogs.length > 0 ? (
          <ul className="space-y-2 text-xs text-base-content/70">
            {auditLogs.map((entry) => (
              <li key={entry.id} className="rounded border border-base-300 p-3">
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
          <p className="text-sm text-base-content/70">{t("auditLogsEmpty")}</p>
        )}
      </div>

      <div className="divider text-xs uppercase" id="account">
        {t("dataTitle")}
      </div>
      <div className="space-y-4 text-sm text-base-content/80">
        <div className="space-y-2">
          <div className="font-semibold text-base-content">
            {t("dataExportTitle")}
          </div>
          <p className="text-sm text-base-content/70">
            {t("dataExportSubtitle")}
          </p>
          <NextLink
            href="/api/account/export"
            className="btn btn-outline btn-sm"
            prefetch={false}
          >
            {t("dataExportCta")}
          </NextLink>
        </div>
        <div className="rounded border border-error/30 bg-error/5 p-4 text-sm text-base-content/80">
          <div className="font-semibold text-error">{t("deletionTitle")}</div>
          <p className="mt-1 text-sm text-base-content/70">
            {t("deletionSubtitle")}
          </p>
          {hasDeletionRequested ? (
            <div
              className="alert alert-success mt-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <span>{t("deletionRequested")}</span>
            </div>
          ) : null}
          {deletionRequestActive ? (
            <div className="mt-3 space-y-2">
              {formattedDeletionExpires ? (
                <p className="text-xs text-base-content/70">
                  {t("deletionExpires", { date: formattedDeletionExpires })}
                </p>
              ) : null}
              <form action={confirmAccountDeletion} className="space-y-2">
                <input type="hidden" name="locale" value={locale} />
                <input
                  type="hidden"
                  name="token"
                  value={deletionRequestToken}
                />
                <label className="form-control">
                  <span className="label-text text-sm">
                    {t("deletionConfirmLabel", {
                      phrase: deletionConfirmPhrase,
                    })}
                  </span>
                  <input
                    type="text"
                    name="confirmation"
                    className="input input-bordered input-sm mt-2"
                    placeholder={deletionConfirmPhrase}
                    aria-describedby="deletion-confirm-help"
                  />
                </label>
                <p
                  id="deletion-confirm-help"
                  className="text-xs text-base-content/60"
                >
                  {t("deletionConfirmHelp")}
                </p>
                <button type="submit" className="btn btn-error btn-sm">
                  {t("deletionConfirmCta")}
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {deletionRequestExpired ? (
                <p className="text-xs text-base-content/70">
                  {t("deletionExpired")}
                </p>
              ) : null}
              <form action={requestAccountDeletion}>
                <input type="hidden" name="locale" value={locale} />
                <button type="submit" className="btn btn-error btn-sm">
                  {t("deletionRequestCta")}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-center text-base-content/70">
        <Link href="/dashboard" locale={locale} className="link link-primary">
          {t("backToDashboard")}
        </Link>
      </p>
    </AuthCard>
  );
}
