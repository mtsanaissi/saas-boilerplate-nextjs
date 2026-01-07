import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const rateLimitApi = vi.hoisted(() => vi.fn());

const stripeEventsUpsertMock = vi.hoisted(() => vi.fn());
const stripeEventsSelectEqMock = vi.hoisted(() => vi.fn());
const stripeEventsSelectMaybeSingleMock = vi.hoisted(() => vi.fn());
const stripeEventsUpdateMock = vi.hoisted(() => vi.fn());
const stripeEventsUpdateEqMock = vi.hoisted(() => vi.fn());

const billingCustomersUpsertMock = vi.hoisted(() => vi.fn());
const billingCustomersSelectEqMock = vi.hoisted(() => vi.fn());
const billingCustomersSelectMaybeSingleMock = vi.hoisted(() => vi.fn());

const billingSubscriptionsUpsertMock = vi.hoisted(() => vi.fn());

const profilesUpdateMock = vi.hoisted(() => vi.fn());
const profilesUpdateEqMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit/server", () => ({
  rateLimitApi,
}));

vi.mock("@/lib/rate-limit/headers", () => ({
  getClientIpFromRequest: () => "127.0.0.1",
}));

vi.mock("@/lib/observability/request-id", () => ({
  getRequestId: () => Promise.resolve("req-123"),
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: vi.fn(),
}));

vi.mock("@/lib/observability/error-reporting", () => ({
  reportError: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: () => null,
    }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "stripe_events") {
        return {
          upsert: stripeEventsUpsertMock,
          select: () => ({
            eq: stripeEventsSelectEqMock,
          }),
          update: stripeEventsUpdateMock,
        };
      }
      if (table === "billing_customers") {
        return {
          upsert: billingCustomersUpsertMock,
          select: () => ({
            eq: billingCustomersSelectEqMock,
          }),
        };
      }
      if (table === "billing_subscriptions") {
        return {
          upsert: billingSubscriptionsUpsertMock,
        };
      }
      if (table === "profiles") {
        return {
          update: profilesUpdateMock,
        };
      }
      return {};
    },
  }),
}));

function loadFixture<T>(name: string): T {
  const fixturePath = join(process.cwd(), "tests", "fixtures", "stripe", name);
  return JSON.parse(readFileSync(fixturePath, "utf8")) as T;
}

async function getWebhookPost() {
  const webhookModule = await import("@/app/api/stripe/webhook/route");
  return webhookModule.POST;
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.resetModules();
    rateLimitApi.mockResolvedValue(undefined);

    stripeEventsUpsertMock.mockResolvedValue({ error: null });
    stripeEventsSelectEqMock.mockReturnValue({
      maybeSingle: stripeEventsSelectMaybeSingleMock,
    });
    stripeEventsSelectMaybeSingleMock.mockResolvedValue({
      data: { processed_at: null },
      error: null,
    });
    stripeEventsUpdateMock.mockImplementation(() => ({
      eq: stripeEventsUpdateEqMock,
    }));
    stripeEventsUpdateEqMock.mockResolvedValue({ error: null });

    billingCustomersUpsertMock.mockResolvedValue({ error: null });
    billingCustomersSelectEqMock.mockReturnValue({
      maybeSingle: billingCustomersSelectMaybeSingleMock,
    });
    billingCustomersSelectMaybeSingleMock.mockResolvedValue({
      data: { user_id: "user-123" },
      error: null,
    });

    billingSubscriptionsUpsertMock.mockResolvedValue({ error: null });

    profilesUpdateMock.mockImplementation(() => ({
      eq: profilesUpdateEqMock,
    }));
    profilesUpdateEqMock.mockResolvedValue({ error: null });

    vi.stubEnv("STRIPE_WEBHOOK_ALLOW_UNVERIFIED", "true");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("STRIPE_PRICE_STARTER_MONTHLY", "price_starter");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it("returns 429 when rate-limited", async () => {
    const rateLimitedError = new Error("rate limited");
    rateLimitedError.name = "rate_limited";
    rateLimitApi.mockRejectedValue(rateLimitedError);

    const POST = await getWebhookPost();
    const event = loadFixture<Record<string, unknown>>(
      "checkout-session-completed.json",
    );
    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(event),
    });

    const response = await POST(request);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: "rate_limited",
    });
    expect(stripeEventsUpsertMock).not.toHaveBeenCalled();
  });

  it("dedupes already processed events", async () => {
    stripeEventsSelectMaybeSingleMock.mockResolvedValueOnce({
      data: { processed_at: "2024-01-01T00:00:00.000Z" },
      error: null,
    });

    const POST = await getWebhookPost();
    const event = loadFixture<Record<string, unknown>>(
      "checkout-session-completed.json",
    );
    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(event),
    });

    const response = await POST(request);

    await expect(response.json()).resolves.toMatchObject({
      received: true,
      deduped: true,
    });
    expect(billingCustomersUpsertMock).not.toHaveBeenCalled();
    expect(billingSubscriptionsUpsertMock).not.toHaveBeenCalled();
    expect(profilesUpdateMock).not.toHaveBeenCalled();
    expect(stripeEventsUpdateMock).not.toHaveBeenCalled();
  });

  it("upserts subscription state and profile plan info", async () => {
    const POST = await getWebhookPost();
    const event = loadFixture<Record<string, unknown>>(
      "customer-subscription-updated.json",
    );
    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(event),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    const expectedPeriodEnd = new Date(1702592000 * 1000).toISOString();

    expect(stripeEventsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "evt_subscription_updated_456",
        type: "customer.subscription.updated",
        user_id: "user-123",
        payload: event,
      }),
      { onConflict: "id", ignoreDuplicates: true },
    );

    expect(billingSubscriptionsUpsertMock).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        stripe_subscription_id: "sub_123",
        stripe_price_id: "price_starter",
        status: "active",
        current_period_end: expectedPeriodEnd,
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" },
    );

    expect(profilesUpdateMock).toHaveBeenCalledWith({
      plan_id: "starter",
      plan_status: "active",
    });
    expect(profilesUpdateEqMock).toHaveBeenCalledWith("id", "user-123");

    expect(stripeEventsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        processed_at: expect.any(String),
        user_id: "user-123",
      }),
    );
  });
});
