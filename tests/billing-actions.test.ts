import { beforeEach, describe, it, vi } from "vitest";
import { createRedirectError, expectRedirect } from "./helpers";

const createClient = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw createRedirectError(to);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

describe("billing actions", () => {
  beforeEach(() => {
    createClient.mockReset();
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
});
