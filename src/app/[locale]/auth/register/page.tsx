import { AuthCard } from "@/components/features/auth/AuthCard";
import { signUpWithEmail } from "@/app/auth/actions";
import { safeDecodeURIComponent } from "@/lib/url";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

interface RegisterPageProps {
  searchParams?: Promise<{ error?: string }>;
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({
  searchParams,
  params,
}: RegisterPageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({}),
  ]);

  const t = await getTranslations({ locale, namespace: "auth.register" });

  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);

  let errorMessage: string | null = null;

  if (errorCode === "invalid_credentials") {
    errorMessage = t("invalidCredentials");
  } else if (errorCode === "signup_failed") {
    errorMessage = t("signupFailed");
  }

  return (
    <AuthCard title={t("title")} subtitle={t("subtitle")}>
      {errorMessage ? (
        <div className="alert alert-error text-sm">
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form action={signUpWithEmail} className="space-y-4">
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
            minLength={8}
            className="input input-bordered w-full"
            autoComplete="new-password"
          />
          <label className="label">
            <span className="label-text-alt text-xs text-base-content/70">
              {t("passwordHelp")}
            </span>
          </label>
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
          href={{ pathname: "/auth/login", locale }}
          className="link link-primary font-medium"
        >
          {t("signIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
