import { beforeEach, describe, it, vi } from "vitest";
import { createRedirectError, expectRedirect } from "./helpers";

const createClient = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw createRedirectError(to);
  },
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromHeaders: () => Promise.resolve("127.0.0.1"),
}));

vi.mock("@/lib/rate-limit/server", () => ({
  rateLimitAuth: () => Promise.resolve(),
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: () => Promise.resolve(),
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
    vi.resetModules();
  });

  it("redirects on invalid sign-in credentials", async () => {
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
});
