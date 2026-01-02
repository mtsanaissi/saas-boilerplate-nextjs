import { NextResponse, type NextRequest } from "next/server";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import { consumeUsageOrThrow } from "@/lib/usage/server";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";
import { rateLimitApi, rateLimitUsage } from "@/lib/rate-limit/server";
import { getRequestId } from "@/lib/observability/request-id";
import { logInfo } from "@/lib/observability/logger";
import { reportError } from "@/lib/observability/error-reporting";

type ConsumePayload = {
  feature: string;
  amount: number;
  metadata?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const ip = getClientIpFromRequest(request);
  try {
    await rateLimitApi(`ip:${ip}`);
    await rateLimitUsage(`ip:${ip}`);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    reportError(error, { requestId, route: "/api/usage/consume" });
    throw error;
  }

  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    await rateLimitApi(`user:${authResult.userId}`);
    await rateLimitUsage(`user:${authResult.userId}`);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    reportError(error, {
      requestId,
      route: "/api/usage/consume",
      userId: authResult.userId,
    });
    throw error;
  }

  const payload = (await request.json()) as ConsumePayload;

  if (!payload?.feature || typeof payload.amount !== "number") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  try {
    const allowance = await consumeUsageOrThrow({
      userId: authResult.userId,
      feature: payload.feature,
      amount: payload.amount,
      metadata: payload.metadata ?? null,
    });

    logInfo("usage_consumed", {
      requestId,
      userId: authResult.userId,
      feature: payload.feature,
      amount: payload.amount,
    });

    return NextResponse.json({ allowance });
  } catch (error) {
    if (error instanceof Error && error.name === "usage_limit_exceeded") {
      return NextResponse.json(
        { error: "usage_limit_exceeded" },
        { status: 403 },
      );
    }
    reportError(error, {
      requestId,
      route: "/api/usage/consume",
      userId: authResult.userId,
    });

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
