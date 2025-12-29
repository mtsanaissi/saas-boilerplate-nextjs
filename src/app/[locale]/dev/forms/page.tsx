import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

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

  const invalid = getStringParam(resolvedSearchParams.invalid) ?? "none";
  const showAlert = getStringParam(resolvedSearchParams.alert) ?? "none";

  const emailInvalid = invalid === "email";
  const passwordInvalid = invalid === "password";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Forms + alerts surface</h1>
        <p className="opacity-80">
          Placeholder validation states for `aria-invalid`, `aria-describedby`,
          and alert semantics.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="opacity-70">Quick toggles:</span>
        <Link href="/dev/forms?invalid=email" locale={locale} className="link">
          invalid email
        </Link>
        <Link
          href="/dev/forms?invalid=password"
          locale={locale}
          className="link"
        >
          invalid password
        </Link>
        <Link href="/dev/forms?alert=error" locale={locale} className="link">
          error alert
        </Link>
        <Link href="/dev/forms?alert=success" locale={locale} className="link">
          success alert
        </Link>
        <Link href="/dev/forms" locale={locale} className="link">
          reset
        </Link>
      </div>

      {showAlert === "error" ? (
        <div className="alert alert-error" role="alert">
          <span>Placeholder error alert (role=&quot;alert&quot;).</span>
        </div>
      ) : null}

      {showAlert === "success" ? (
        <div className="alert alert-success" role="status" aria-live="polite">
          <span>Placeholder success message (role=&quot;status&quot;).</span>
        </div>
      ) : null}

      <form className="card bg-base-100 border border-base-300">
        <div className="card-body space-y-4">
          <h2 className="card-title">Example form</h2>

          <div className="form-control">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input input-bordered"
              aria-invalid={emailInvalid}
              aria-describedby={emailInvalid ? "email-error" : "email-help"}
              placeholder="name@example.com"
            />
            {emailInvalid ? (
              <p id="email-error" className="mt-2 text-sm text-error">
                Placeholder email error text (described by input).
              </p>
            ) : (
              <p id="email-help" className="mt-2 text-sm opacity-70">
                Placeholder helper text.
              </p>
            )}
          </div>

          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">Password</span>
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
              placeholder="••••••••"
            />
            {passwordInvalid ? (
              <p id="password-error" className="mt-2 text-sm text-error">
                Placeholder password error text (described by input).
              </p>
            ) : (
              <p id="password-help" className="mt-2 text-sm opacity-70">
                Placeholder helper text.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-primary">
              Submit (placeholder)
            </button>
            <button type="button" className="btn btn-ghost">
              Secondary action
            </button>
            <a href="#top" className="link">
              Link-style action
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
