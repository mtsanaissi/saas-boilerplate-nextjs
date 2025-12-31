import { NextResponse, type NextRequest } from "next/server";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import { consumeUsageOrThrow } from "@/lib/usage/server";

type ConsumePayload = {
  feature: string;
  amount: number;
  metadata?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult.response;
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

    return NextResponse.json({ allowance });
  } catch (error) {
    if (error instanceof Error && error.name === "usage_limit_exceeded") {
      return NextResponse.json(
        { error: "usage_limit_exceeded" },
        { status: 403 },
      );
    }

    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
