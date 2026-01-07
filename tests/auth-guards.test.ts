import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRedirectError } from "./helpers";

const createClient = vi.fn();
const logAuditEvent = vi.fn();
const logInfo = vi.fn();
const getClientIpFromHeaders = vi.fn();
const getRequestId = vi.fn();

let redirectedTo: unknown = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo,
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromHeaders,
}));

vi.mock("@/lib/observability/request-id", () => ({
  getRequestId,
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) => (name === "user-agent" ? "test-agent" : null),
    }),
}));

vi.mock("@/i18n/navigation", () => ({
  redirect: (to: unknown) => {
    redirectedTo = to;
    throw createRedirectError("REDIRECT");
  },
}));

describe("auth guards", () => {
  beforeEach(() => {
    redirectedTo = null;
    createClient.mockReset();
    logAuditEvent.mockReset();
    logInfo.mockReset();
    getClientIpFromHeaders.mockReset();
    getRequestId.mockReset();
    vi.resetModules();
  });

  it("redirects unverified users to email verification", async () => {
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
    getClientIpFromHeaders.mockResolvedValue("127.0.0.1");
    getRequestId.mockResolvedValue("req-123");

    const { requireUser } = await import("@/lib/auth/guards");

    await requireUser("en", "/dashboard").catch((error) => {
      expect(error).toBeInstanceOf(Error);
    });

    expect(redirectedTo).toEqual({
      href: { pathname: "/auth/verify", query: { error: "email_unverified" } },
      locale: "en",
    });
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "auth.email_unverified_blocked",
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
        metadata: { redirectTo: "/dashboard" },
      }),
    );
    expect(logInfo).toHaveBeenCalledWith(
      "auth_email_unverified",
      expect.objectContaining({
        requestId: "req-123",
        userId: "user-1",
        redirectTo: "/dashboard",
        locale: "en",
      }),
    );
  });

  it("returns user data when email is verified", async () => {
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: {
                id: "user-2",
                email: "verified@example.com",
                email_confirmed_at: "2026-01-05T00:00:00Z",
              },
            },
          }),
      },
    });

    const { requireUser } = await import("@/lib/auth/guards");

    const result = await requireUser("en", "/dashboard");

    expect(result).toMatchObject({
      userId: "user-2",
      email: "verified@example.com",
    });
    expect(logAuditEvent).not.toHaveBeenCalled();
  });
});
