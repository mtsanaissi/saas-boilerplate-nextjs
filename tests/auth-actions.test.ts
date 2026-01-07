import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRedirectError, expectRedirect } from "./helpers";

const createClient = vi.fn();
const rateLimitAuth = vi.fn();
const logWarn = vi.fn();
const logError = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw createRedirectError(to);
  },
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromHeaders: () => Promise.resolve("127.0.0.1"),
}));

vi.mock("@/lib/rate-limit/server", () => ({
  rateLimitAuth,
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: () => Promise.resolve(),
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn,
  logError,
}));

vi.mock("@/lib/observability/request-id", () => ({
  getRequestId: () => Promise.resolve("req-123"),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: () => null,
    }),
}));

describe("auth actions", () => {
  beforeEach(() => {
    createClient.mockReset();
    rateLimitAuth.mockReset();
    logWarn.mockReset();
    logError.mockReset();
    vi.resetModules();
  });

  afterEach(() => {
    delete process.env.RATE_LIMIT_AUTH_FAILURE_MODE;
  });

  it("redirects on invalid sign-in credentials", async () => {
    rateLimitAuth.mockResolvedValue(undefined);
    const { signInWithEmail } = await import("@/app/auth/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        signInWithPassword: () => Promise.resolve({ error: null }),
        getUser: () =>
          Promise.resolve({
            data: { user: null },
          }),
      },
    });
    const formData = new FormData();
    formData.append("locale", "en");

    await signInWithEmail(formData).catch((error) => {
      expectRedirect(error, "/en/auth/login?error=invalid_credentials");
    });
  });

  it("redirects with email already registered on signup error", async () => {
    rateLimitAuth.mockResolvedValue(undefined);
    const { signUpWithEmail } = await import("@/app/auth/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        signUp: () =>
          Promise.resolve({
            error: { message: "User already registered" },
          }),
      },
    });
    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    await signUpWithEmail(formData).catch((error) => {
      expectRedirect(error, "/en/auth/register?error=email_already_registered");
    });
  });

  it("denies auth when rate-limit service fails in deny mode", async () => {
    process.env.RATE_LIMIT_AUTH_FAILURE_MODE = "deny";
    rateLimitAuth.mockRejectedValue(new Error("rate limit backend down"));
    const { signInWithEmail } = await import("@/app/auth/actions");
    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    await signInWithEmail(formData).catch((error) => {
      expectRedirect(error, "/en/auth/login?error=rate_limited");
    });

    expect(logError).toHaveBeenCalledWith(
      "auth_rate_limit_unavailable",
      expect.objectContaining({
        requestId: "req-123",
        action: "auth.sign_in",
        failureMode: "deny",
      }),
    );
  });

  it("allows auth when rate-limit service fails in allow mode", async () => {
    process.env.RATE_LIMIT_AUTH_FAILURE_MODE = "allow";
    rateLimitAuth.mockRejectedValue(new Error("rate limit backend down"));
    const { signInWithEmail } = await import("@/app/auth/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        signInWithPassword: () => Promise.resolve({ error: null }),
        getUser: () =>
          Promise.resolve({
            data: { user: { id: "user-1" } },
          }),
      },
    });
    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("email", "test@example.com");
    formData.append("password", "password123");

    await signInWithEmail(formData).catch((error) => {
      expectRedirect(error, "/en/dashboard");
    });

    expect(logError).toHaveBeenCalledWith(
      "auth_rate_limit_unavailable",
      expect.objectContaining({
        requestId: "req-123",
        action: "auth.sign_in",
        failureMode: "allow",
      }),
    );
  });
});
