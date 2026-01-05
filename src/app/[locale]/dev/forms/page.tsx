import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

interface DevFormsPageProps {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStringParam(value: string | string[] | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function DevFormsPage({
  params,
  searchParams,
}: DevFormsPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const t = await getTranslations({ locale, namespace: "dev.forms" });

  const invalid = getStringParam(resolvedSearchParams.invalid) ?? "none";
  const showAlert = getStringParam(resolvedSearchParams.alert) ?? "none";

  const emailInvalid = invalid === "email";
  const passwordInvalid = invalid === "password";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="opacity-80">
          {t.rich("description", {
            code: (chunks) => (
              <code className="px-1 rounded bg-base-300">{chunks}</code>
            ),
          })}
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="opacity-70">{t("quickToggles")}</span>
        <Link href="/dev/forms?invalid=email" locale={locale} className="link">
          {t("toggles.invalidEmail")}
        </Link>
        <Link
          href="/dev/forms?invalid=password"
          locale={locale}
          className="link"
        >
          {t("toggles.invalidPassword")}
        </Link>
        <Link href="/dev/forms?alert=error" locale={locale} className="link">
          {t("toggles.errorAlert")}
        </Link>
        <Link href="/dev/forms?alert=success" locale={locale} className="link">
          {t("toggles.successAlert")}
        </Link>
        <Link href="/dev/forms" locale={locale} className="link">
          {t("toggles.reset")}
        </Link>
      </div>

      {showAlert === "error" ? (
        <div className="alert alert-error" role="alert">
          <span>{t("alertError")}</span>
        </div>
      ) : null}

      {showAlert === "success" ? (
        <div className="alert alert-success" role="status" aria-live="polite">
          <span>{t("alertSuccess")}</span>
        </div>
      ) : null}

      <form className="card bg-base-100 border border-base-300">
        <div className="card-body space-y-4">
          <h2 className="card-title">{t("formTitle")}</h2>

          <div className="form-control">
            <label className="label" htmlFor="email">
              <span className="label-text">{t("emailLabel")}</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input input-bordered"
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "email-error" : "email-help"}
              placeholder={t("emailPlaceholder")}
            />
            {emailInvalid ? (
              <p id="email-error" className="mt-2 text-sm text-error">
                {t("emailError")}
              </p>
            ) : (
              <p id="email-help" className="mt-2 text-sm opacity-70">
                {t("emailHelp")}
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">{t("passwordLabel")}</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input input-bordered"
              aria-invalid={passwordInvalid}
              aria-describedby={
                passwordInvalid ? "password-error" : "password-help"
              }
              placeholder={t("passwordPlaceholder")}
            />
            {passwordInvalid ? (
              <p id="password-error" className="mt-2 text-sm text-error">
                {t("passwordError")}
              </p>
            ) : (
              <p id="password-help" className="mt-2 text-sm opacity-70">
                {t("passwordHelp")}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-primary">
              {t("submitPlaceholder")}
            </button>
            <button type="button" className="btn btn-ghost">
              {t("secondaryAction")}
            </button>
            <a href="#top" className="link">
              {t("linkAction")}
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
