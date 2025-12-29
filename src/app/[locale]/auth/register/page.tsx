import { AuthCard } from "@/components/features/auth/AuthCard";
import { signUpWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";

type RegisterSearchParams = {
  error?: string;
};

interface RegisterPageProps {
  searchParams?: Promise<RegisterSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function RegisterPage({
  searchParams,
  params,
}: RegisterPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<RegisterSearchParams>({}),
  ]);

  const [t, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "auth.register" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const hasFieldErrors = errorCode === "invalid_credentials";
  const formErrorId = errorMessage ? "auth-register-error" : undefined;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
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

      <form action={signUpWithEmail} className="space-y-4">
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
            aria-invalid={hasFieldErrors}
            aria-describedby={formErrorId}
          />
        </div>
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
            aria-invalid={hasFieldErrors}
            aria-describedby={[formErrorId, "password-help"]
              .filter(Boolean)
              .join(" ")}
          />
          <p id="password-help" className="mt-2 text-xs text-base-content/70">
            {t("passwordHelp")}
          </p>
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {t("submit")}
          </button>
        </div>
      </form>

      <p className="text-sm text-center text-base-content/70">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/auth/login"
          locale={locale}
          className="link link-primary font-medium"
        >
          {t("signIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
