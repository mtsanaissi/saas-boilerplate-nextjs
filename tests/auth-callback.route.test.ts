import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";

const createClient = vi.fn();
const upsertUserSession = vi.fn();
const logAuditEvent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClient(),
}));

vi.mock("@/lib/auth/session-tracking", () => ({
  upsertUserSession: (...args: unknown[]) => upsertUserSession(...args),
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromRequest: () => "127.0.0.1",
}));

vi.mock("@/lib/observability/audit", () => ({
  logAuditEvent: (...args: unknown[]) => logAuditEvent(...args),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
        getSession: vi.fn().mockResolvedValue({
          data: { session: { access_token: "token-123" } },
        }),
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "new@example.com" } },
        }),
      },
    });
  });

  it("logs email change confirmation and redirects to settings", async () => {
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc&next=%2Fen%2Fsettings%3FemailChange%3D1%23email",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/en/settings?emailChange=1#email",
    );
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        action: "account.email_change_confirmed",
        metadata: { email: "new@example.com" },
      }),
    );
  });
});
