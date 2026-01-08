"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import messages from "@/messages/en";
import { routing } from "@/i18n/routing";
import { logError } from "@/lib/observability/logger";

const locale = routing.defaultLocale;

type ErrorWithDigest = Error & { digest?: string; cause?: unknown };

type RequestIdCause = { requestId?: string };

function getRequestIdFromCause(cause: unknown): string | undefined {
  if (!cause || typeof cause !== "object") return undefined;
  if (
    "requestId" in cause &&
    typeof (cause as RequestIdCause).requestId === "string"
  ) {
    return (cause as RequestIdCause).requestId;
  }
  return undefined;
}

function ErrorFallback({
  error,
  reset,
}: {
  error: ErrorWithDigest;
  reset: () => void;
}) {
  const t = useTranslations("system.errorBoundary");
  const requestId = getRequestIdFromCause(error.cause);

  useEffect(() => {
    logError("app_error_boundary", {
      requestId,
      message: error.message,
      digest: error.digest,
    });
  }, [error, requestId]);

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="card bg-base-100 w-full max-w-lg shadow-2xl border border-base-300">
        <div className="card-body gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-base-content/70">{t("subtitle")}</p>
          </div>

          {error.digest ? (
            <div className="rounded border border-base-300 bg-base-200 px-3 py-2 text-xs font-mono text-base-content/70">
              <span className="font-semibold">{t("digestLabel")}:</span>{" "}
              {error.digest}
            </div>
          ) : null}

          <p className="text-xs text-base-content/60">{t("supportHint")}</p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => reset()}
            >
              {t("tryAgain")}
            </button>
            <Link href={`/${locale}`} className="btn btn-ghost btn-sm">
              {t("goHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: ErrorWithDigest;
  reset: () => void;
}) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ErrorFallback error={error} reset={reset} />
    </NextIntlClientProvider>
  );
}
