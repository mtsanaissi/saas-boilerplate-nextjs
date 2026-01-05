import { AuthCard } from "@/components/features/auth/AuthCard";
import { signInWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";

type LoginSearchParams = {
  error?: string;
  redirect?: string;
};

interface LoginPageProps {
  searchParams?: Promise<LoginSearchParams>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function LoginPage({
  searchParams,
  params,
}: LoginPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<LoginSearchParams>({}),
  ]);

  const [t, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "auth.login" }),
    getTranslations({ locale, namespace: "errors" }),
  ]);

  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const redirectTo = resolvedSearchParams.redirect;

  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;
  const hasFieldErrors = errorCode === "invalid_credentials";
  const formErrorId = errorMessage ? "auth-login-error" : undefined;

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

      <form action={signInWithEmail} className="space-y-4">
        <input type="hidden" name="locale" value={locale} />
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
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
            className="input input-bordered w-full"
            autoComplete="current-password"
            aria-invalid={hasFieldErrors}
            aria-describedby={formErrorId}
          />
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {t("submit")}
          </button>
        </div>
      </form>

      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/auth/forgot" locale={locale} className="link link-primary">
          {t("forgotPassword")}
        </Link>
        <Link href="/auth/magic" locale={locale} className="link link-hover">
          {t("magicLink")}
        </Link>
      </div>

      <div className="divider text-xs uppercase">{t("dividerOr")}</div>

      <p className="text-sm text-center text-base-content/70">
        {t("newHere")}{" "}
        <Link
          href="/auth/register"
          locale={locale}
          className="link link-primary font-medium"
        >
          {t("createAccount")}
        </Link>
      </p>
    </AuthCard>
  );
}
