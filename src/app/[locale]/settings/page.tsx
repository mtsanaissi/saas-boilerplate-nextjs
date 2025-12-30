import { AuthCard } from "@/components/features/auth/AuthCard";
import { updateProfile } from "@/app/settings/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { createClient } from "@/lib/supabase/server";
import { Link, redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";
import type { UserProfile } from "@/types/profile";

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
  const [{ locale }, resolvedSearchParams, supabase] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<SettingsSearchParams>({}),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({
      href: { pathname: "/auth/login", query: { redirect: "/settings" } },
      locale,
    });
  }
  if (!user) {
    return null;
  }

  const [t, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "settings" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale")
    .eq("id", user.id)
    .maybeSingle<UserProfile>();

  const hasSuccess = resolvedSearchParams.success === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const formErrorId = errorMessage ? "settings-error" : undefined;

  const displayName = profile?.display_name ?? "";
  const avatarUrl = profile?.avatar_url ?? "";
  const preferredLocale =
    profile?.locale && routing.locales.includes(profile.locale as AppLocale)
      ? (profile.locale as AppLocale)
      : locale;

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

      <p className="text-sm text-center text-base-content/70">
        <Link href="/dashboard" locale={locale} className="link link-primary">
          {t("backToDashboard")}
        </Link>
      </p>
    </AuthCard>
  );
}
