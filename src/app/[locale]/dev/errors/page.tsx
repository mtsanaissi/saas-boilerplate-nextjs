import { safeDecodeURIComponent } from "@/lib/url";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getErrorMessageKey } from "@/lib/errors";

interface DevErrorsPageProps {
  searchParams: Promise<{ error?: string }>;
  params: Promise<{ locale: AppLocale }>;
}

export default async function DevErrorsPage({
  searchParams,
  params,
}: DevErrorsPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const errorCode = safeDecodeURIComponent(resolvedSearchParams.error);
  const tErrors = await getTranslations({ locale, namespace: "errors" });
  const errorKey = getErrorMessageKey(errorCode);
  const errorMessage = errorKey ? tErrors(errorKey) : null;

  const knownCodes = [
    "invalid_credentials",
    "signup_failed",
    "invalid_plan",
    "plan_not_available",
    "checkout_unavailable",
    "some_unknown_error",
  ] as const;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Error states surface</h1>
        <p className="opacity-80">
          Use query params to simulate error codes and validate user-facing
          error messaging.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Current error code</h2>
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <p className="text-sm opacity-70">
              Resolved <code>error</code> query param:
            </p>
            <pre className="bg-base-200 p-3 rounded-box overflow-x-auto">
              {errorCode ?? "(none)"}
            </pre>
            {errorMessage ? (
              <div
                className="alert alert-error text-sm"
                role="alert"
                aria-live="assertive"
              >
                <span>{errorMessage}</span>
              </div>
            ) : (
              <p className="text-sm opacity-70">No error code provided.</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Try a code</h2>
        <div className="flex flex-wrap gap-2">
          {knownCodes.map((code) => (
            <a
              key={code}
              className="btn btn-sm btn-outline"
              href={`?error=${code}`}
            >
              {code}
            </a>
          ))}
          <a className="btn btn-sm btn-ghost" href=".">
            clear
          </a>
        </div>
      </section>
    </div>
  );
}
