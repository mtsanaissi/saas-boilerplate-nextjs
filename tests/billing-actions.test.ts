import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRedirectError, expectRedirect } from "./helpers";

const createClient = vi.fn();
const stripeSessionCreate = vi.fn();
const getStripeClient = vi.fn(() => ({
  checkout: { sessions: { create: stripeSessionCreate } },
}));

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw createRedirectError(to);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripeClient,
}));

describe("billing actions", () => {
  beforeEach(() => {
    createClient.mockReset();
    stripeSessionCreate.mockReset();
    getStripeClient.mockClear();
    vi.resetModules();
  });

  it("redirects when plan id is missing", async () => {
    const { createCheckoutSession } = await import("@/app/plans/actions");
    const formData = new FormData();

    await createCheckoutSession(formData).catch((error) => {
      expectRedirect(error, "/plans?error=invalid_plan");
    });
  });

  it("redirects to login when user is not authenticated", async () => {
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_test";
    const { createCheckoutSession } = await import("@/app/plans/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: null },
          }),
      },
    });
    const formData = new FormData();
    formData.append("planId", "starter");

    await createCheckoutSession(formData).catch((error) => {
      expectRedirect(error, "/auth/login?redirect=/plans");
    });
  });

  it("reuses existing Stripe customer when available", async () => {
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_test";
    stripeSessionCreate.mockResolvedValueOnce({
      url: "https://stripe.test/checkout",
    });

    const { createCheckoutSession } = await import("@/app/plans/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: { id: "user-123", email: "test@example.com" },
            },
          }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { stripe_customer_id: "cus_123" },
              }),
          }),
        }),
      }),
    });

    const formData = new FormData();
    formData.append("planId", "starter");

    await createCheckoutSession(formData).catch((error) => {
      expectRedirect(error, "https://stripe.test/checkout");
    });

    expect(stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_123",
      }),
    );
  });

  it("falls back to customer email when no Stripe customer exists", async () => {
    process.env.STRIPE_PRICE_STARTER_MONTHLY = "price_test";
    stripeSessionCreate.mockResolvedValueOnce({
      url: "https://stripe.test/checkout",
    });

    const { createCheckoutSession } = await import("@/app/plans/actions");
    createClient.mockResolvedValueOnce({
      auth: {
        getUser: () =>
          Promise.resolve({
            data: {
              user: { id: "user-456", email: "fallback@example.com" },
            },
          }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: null,
              }),
          }),
        }),
      }),
    });

    const formData = new FormData();
    formData.append("planId", "starter");

    await createCheckoutSession(formData).catch((error) => {
      expectRedirect(error, "https://stripe.test/checkout");
    });

    expect(stripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_email: "fallback@example.com",
      }),
    );
  });
});
