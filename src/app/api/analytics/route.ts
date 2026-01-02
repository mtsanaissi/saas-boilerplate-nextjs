import { NextResponse, type NextRequest } from "next/server";
import { isAnalyticsEnabled } from "@/lib/observability/analytics";
import { getRequestId } from "@/lib/observability/request-id";
import { logInfo } from "@/lib/observability/logger";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";
import { rateLimitApi } from "@/lib/rate-limit/server";
import { reportError } from "@/lib/observability/error-reporting";

type AnalyticsPayload = {
  name?: string;
  properties?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();

  if (!isAnalyticsEnabled()) {
    logInfo("analytics_disabled", { requestId });
    return NextResponse.json({ error: "analytics_disabled" }, { status: 403 });
  }

  const ip = getClientIpFromRequest(request);
  try {
    await rateLimitApi(`analytics:ip:${ip}`);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    reportError(error, { requestId, route: "/api/analytics" });
    throw error;
  }

  const authResult = await requireUserInRoute(request);
  if ("response" in authResult) {
    return authResult.response;
  }

  let payload: AnalyticsPayload | null = null;
  try {
    payload = (await request.json()) as AnalyticsPayload;
  } catch {
    reportError(new Error("invalid_payload"), {
      requestId,
      route: "/api/analytics",
      extra: { reason: "json_parse" },
    });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (!payload?.name) {
    reportError(new Error("invalid_payload"), {
      requestId,
      route: "/api/analytics",
      extra: { reason: "missing_name" },
    });
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  logInfo("analytics_event", {
    requestId,
    userId: authResult.userId,
    event: payload.name,
    properties: payload.properties ?? {},
  });

  return NextResponse.json({ ok: true });
}
