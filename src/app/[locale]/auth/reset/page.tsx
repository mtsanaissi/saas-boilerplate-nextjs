import { AuthCard } from "@/components/features/auth/AuthCard";
import { updatePassword } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type ResetSearchParams = {
  error?: string;
  success?: string;
};

interface ResetPageProps {
  searchParams?: Promise<ResetSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function ResetPage({
  searchParams,
  params,
}: ResetPageProps) {
  const [{ locale }, resolvedSearchParams, supabase] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<ResetSearchParams>({}),
    createClient(),
  ]);

  const [t, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "auth.reset" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasSuccess = resolvedSearchParams.success === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const sessionMissing = !user && !hasSuccess;
  const formErrorId = errorMessage ? "auth-reset-error" : undefined;

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

      {sessionMissing ? (
        <div
          className="alert alert-warning text-sm"
          role="status"
          aria-live="polite"
        >
          <span>{tErrors("invalidSession")}</span>
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

      {!hasSuccess ? (
        <form action={updatePassword} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">{t("passwordLabel")}</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={8}
              className="input input-bordered w-full"
              autoComplete="new-password"
              aria-invalid={Boolean(errorMessage)}
              aria-describedby={[formErrorId, "password-help"]
                .filter(Boolean)
                .join(" ")}
            />
            <p id="password-help" className="mt-2 text-xs text-base-content/70">
              {t("passwordHelp")}
            </p>
          </div>

          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={sessionMissing}
            >
              {t("submit")}
            </button>
          </div>
        </form>
      ) : null}

      <p className="text-sm text-center text-base-content/70">
        <Link href="/auth/login" locale={locale} className="link link-primary">
          {t("backToSignIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
