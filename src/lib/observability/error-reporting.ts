import { logError } from "@/lib/observability/logger";
import { getFeatureFlags } from "@/lib/env/server";

type ErrorReportContext = {
  requestId?: string;
  route?: string;
  userId?: string;
  extra?: Record<string, unknown>;
};

export function reportError(error: unknown, context?: ErrorReportContext) {
  const { errorReporting } = getFeatureFlags();
  if (!errorReporting) {
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
