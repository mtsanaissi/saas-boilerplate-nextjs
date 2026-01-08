import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/health/route";

const fromMock = vi.hoisted(() => vi.fn());
const selectMock = vi.hoisted(() => vi.fn());
const limitMock = vi.hoisted(() => vi.fn());
const validateServerEnvMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/env/server", () => ({
  validateServerEnv: validateServerEnvMock,
}));

vi.mock("@/lib/observability/request-id", () => ({
  getRequestId: vi.fn().mockResolvedValue("req-123"),
}));

vi.mock("@/lib/observability/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    validateServerEnvMock.mockReset();
    fromMock.mockReset();
    selectMock.mockReset();
    limitMock.mockReset();

    fromMock.mockReturnValue({ select: selectMock });
    selectMock.mockReturnValue({ limit: limitMock });
    limitMock.mockResolvedValue({ data: [], error: null });
  });

  it("returns status and dependency checks", async () => {
    const request = new NextRequest("http://localhost/api/health");
    const response = await GET(request);

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload).toMatchObject({
      status: "ok",
      requestId: "req-123",
      dependencies: {
        env: { status: "ok" },
        supabase: { status: "ok" },
      },
    });

    expect(typeof payload.timestamp).toBe("string");
    expect(typeof payload.uptime).toBe("number");
  });
});
