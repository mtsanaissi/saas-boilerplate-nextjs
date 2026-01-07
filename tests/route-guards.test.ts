import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createClient = vi.fn();
const logAuditEvent = vi.fn();
const logInfo = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  redirect: () => {
    throw new Error("redirect not expected in route-guards tests");
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo,
}));

describe("route guards", () => {
  beforeEach(() => {
    createClient.mockReset();
    logAuditEvent.mockReset();
    logInfo.mockReset();
    vi.resetModules();
  });

  it("returns email_unverified when user email is not confirmed", async () => {
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: {
                id: "user-1",
                email: "user@example.com",
                email_confirmed_at: null,
                confirmed_at: null,
              },
            },
          }),
      },
    });

    const { requireUserInRoute } = await import("@/lib/auth/route-guards");
    const request = new NextRequest("http://localhost/api/me", {
      headers: {
        "x-forwarded-for": "10.0.0.1",
        "x-request-id": "req-456",
        "user-agent": "test-agent",
      },
    });

    const result = await requireUserInRoute(request);

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toMatchObject({
        error: "email_unverified",
      });
    }
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "auth.email_unverified_blocked",
        ipAddress: "10.0.0.1",
        userAgent: "test-agent",
        metadata: { path: "/api/me" },
      }),
    );
    expect(logInfo).toHaveBeenCalledWith(
      "auth_email_unverified",
      expect.objectContaining({
        requestId: "req-456",
        userId: "user-1",
        path: "/api/me",
      }),
    );
  });
});
