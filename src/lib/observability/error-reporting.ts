import { logError } from "@/lib/observability/logger";

type ErrorReportContext = {
  requestId?: string;
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
};

export function reportError(error: unknown, context?: ErrorReportContext) {
  if (process.env.ERROR_REPORTING_ENABLED !== "true") {
    return;
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  logError(message, {
    requestId: context?.requestId,
    route: context?.route,
    userId: context?.userId,
    extra: context?.extra,
  });

  // Placeholder for external provider integration.
  // Example: Sentry.captureException(error, { extra: context })
}
