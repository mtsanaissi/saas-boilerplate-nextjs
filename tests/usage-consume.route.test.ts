import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/usage/consume/route";

const rpcMock = vi.hoisted(() => vi.fn());
const profilesMaybeSingleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: profilesMaybeSingleMock,
        }),
      }),
    }),
    rpc: rpcMock,
  }),
}));

vi.mock("@/lib/auth/route-guards", () => ({
  requireUserInRoute: vi.fn().mockResolvedValue({ userId: "user-123" }),
}));

vi.mock("@/lib/rate-limit/server", () => ({
  rateLimitApi: vi.fn().mockResolvedValue(undefined),
  rateLimitUsage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability/request-id", () => ({
  getRequestId: vi.fn().mockResolvedValue("req-123"),
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: vi.fn(),
}));

vi.mock("@/lib/observability/error-reporting", () => ({
  reportError: vi.fn(),
}));

describe("POST /api/usage/consume", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    profilesMaybeSingleMock.mockResolvedValue({
      data: { plan_id: "free", plan_status: "free" },
      error: null,
    });
  });

  it("returns 403 when usage_limit_exceeded", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "usage_limit_exceeded" },
    });

    const request = new NextRequest("http://localhost/api/usage/consume", {
      method: "POST",
      body: JSON.stringify({ feature: "demo", amount: 5 }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: "usage_limit_exceeded",
    });
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 on invalid payload", async () => {
    const request = new NextRequest("http://localhost/api/usage/consume", {
      method: "POST",
      body: JSON.stringify({ amount: 5 }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "invalid_request",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
