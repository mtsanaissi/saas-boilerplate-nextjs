import { describe, expect, it, vi } from "vitest";
import { upsertUserSession } from "@/lib/auth/session-tracking";

function base64Url(input: string) {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function makeToken(payload: Record<string, unknown>) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe("upsertUserSession", () => {
  it("noops when access token is missing", async () => {
    const supabase = { from: vi.fn() };

    await upsertUserSession({
      supabase: supabase as never,
      accessToken: null,
      userId: "user-1",
      ipAddress: "127.0.0.1",
      userAgent: "ua",
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("noops when session_id is missing in token", async () => {
    const supabase = { from: vi.fn() };
    const token = makeToken({ foo: "bar" });

    await upsertUserSession({
      supabase: supabase as never,
      accessToken: token,
      userId: "user-1",
      ipAddress: "127.0.0.1",
      userAgent: "ua",
    });

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("upserts when session_id is present", async () => {
    const upsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: { session_id: "s-1" } }),
      }),
    });
    const supabase = {
      from: vi.fn().mockReturnValue({ upsert }),
    };
    const token = makeToken({ session_id: "sess-123" });

    await upsertUserSession({
      supabase: supabase as never,
      accessToken: token,
      userId: "user-1",
      ipAddress: "127.0.0.1",
      userAgent: "ua",
    });

    expect(supabase.from).toHaveBeenCalledWith("user_sessions");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: "sess-123",
        user_id: "user-1",
        ip_address: "127.0.0.1",
        user_agent: "ua",
      }),
    );
  });
});
