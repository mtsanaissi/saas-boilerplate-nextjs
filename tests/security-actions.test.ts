import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const logAuditEvent = vi.fn();
const getClientIpFromHeaders = vi.fn();

vi.mock("@/lib/auth/guards", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromHeaders: () => getClientIpFromHeaders(),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: () => "test-agent",
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));

describe("security actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("keeps the latest session when current session id is missing", async () => {
    const deleteChain = {
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
    };
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { session_id: "sess-latest" },
      }),
    };
    const supabase = {
      auth: { signOut: vi.fn().mockResolvedValue({}) },
      from: vi.fn((table: string) => {
        if (table === "user_sessions") {
          return {
            delete: vi.fn(() => deleteChain),
            select: vi.fn(() => selectChain),
          };
        }
        return {};
      }),
    };

    requireUser.mockResolvedValue({ supabase, userId: "user-1" });
    getClientIpFromHeaders.mockResolvedValue("127.0.0.1");

    const { signOutOtherSessions } =
      await import("@/app/settings/security-actions");
    const formData = new FormData();
    formData.append("locale", "en");

    await signOutOtherSessions(formData).catch((error) => {
      expect(String(error)).toContain("NEXT_REDIRECT");
    });

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(selectChain.order).toHaveBeenCalledWith("last_seen_at", {
      ascending: false,
    });
    expect(deleteChain.neq).toHaveBeenCalledWith("session_id", "sess-latest");
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
