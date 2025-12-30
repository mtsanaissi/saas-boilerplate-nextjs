import { AuthCard } from "@/components/features/auth/AuthCard";
import { requestPasswordReset } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";

type ForgotSearchParams = {
  error?: string;
  success?: string;
};

interface ForgotPageProps {
  searchParams?: Promise<ForgotSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function ForgotPage({
  searchParams,
  params,
}: ForgotPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<ForgotSearchParams>({}),
  ]);

  const [t, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "auth.forgot" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  const hasSuccess = resolvedSearchParams.success === "1";
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const formErrorId = errorMessage ? "auth-forgot-error" : undefined;

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

      <form action={requestPasswordReset} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="form-control">
          <label className="label" htmlFor="email">
            <span className="label-text">{t("emailLabel")}</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            className="input input-bordered w-full"
            autoComplete="email"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={formErrorId}
          />
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {t("submit")}
          </button>
        </div>
      </form>

      <p className="text-sm text-center text-base-content/70">
        <Link href="/auth/login" locale={locale} className="link link-primary">
          {t("backToSignIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
