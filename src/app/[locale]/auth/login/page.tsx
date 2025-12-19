import { AuthCard } from "@/components/features/auth/AuthCard";
import { signInWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";

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

  const t = await getTranslations({ locale, namespace: "auth.login" });

  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const redirectTo = resolvedSearchParams.redirect;

  const errorMessage =
    errorCode === "invalid_credentials" ? t("invalidCredentials") : null;

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {errorMessage ? (
        <div className="alert alert-error text-sm">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form action={signInWithEmail} className="space-y-4">
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("emailLabel")}</span>
          </label>
          <input
            type="email"
            name="email"
            required
            className="input input-bordered w-full"
            autoComplete="email"
          />
        </div>
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t("passwordLabel")}</span>
          </label>
          <input
            type="password"
            name="password"
            required
            className="input input-bordered w-full"
            autoComplete="current-password"
          />
        </div>

        <div className="form-control mt-6">
          <button type="submit" className="btn btn-primary w-full">
            {t("submit")}
          </button>
        </div>
      </form>

      <div className="divider text-xs uppercase">Or</div>

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
