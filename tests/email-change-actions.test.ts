import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRedirectError, expectRedirect } from "./helpers";

const requireUser = vi.fn();
const logAuditEvent = vi.fn();
const getClientIpFromHeaders = vi.fn();
const updateUser = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw createRedirectError(to);
  },
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: () => "test-agent",
    }),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromHeaders: () => getClientIpFromHeaders(),
}));

describe("email change actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requests an email change and redirects with success", async () => {
    updateUser.mockResolvedValue({ error: null });
    requireUser.mockResolvedValue({
      supabase: { auth: { updateUser } },
      userId: "user-1",
      email: "old@example.com",
    });
    getClientIpFromHeaders.mockResolvedValue("127.0.0.1");

    const { requestEmailChange } = await import("@/app/settings/email-actions");
    const formData = new FormData();
    formData.append("locale", "en");
    formData.append("newEmail", "new@example.com");

    await requestEmailChange(formData).catch((error) => {
      expectRedirect(error, "/en/settings?emailChangeRequested=1#email");
    });

    expect(updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      expect.objectContaining({
        emailRedirectTo: expect.stringContaining("/auth/callback"),
      }),
    );
    expect(updateUser.mock.calls[0]?.[1]?.emailRedirectTo).toContain(
      "next=%2Fen%2Fsettings%3FemailChange%3D1%23email",
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "account.email_change_requested",
        metadata: { newEmail: "new@example.com" },
      }),
    );
  });
});
