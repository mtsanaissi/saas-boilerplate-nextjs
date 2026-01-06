import { describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPeriodRange } from "@/lib/usage/period";

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const describeIf = hasSupabaseEnv ? describe : describe.skip;

async function createTestUser() {
  const supabase = createAdminClient();
  const email = `usage-test-${crypto.randomUUID()}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create test user");
  }

  const userId = data.user.id;

  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  return { supabase, userId };
}

async function deleteTestUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  await supabase.auth.admin.deleteUser(userId);
}

describeIf("consume_usage RPC", () => {
  it("increments balances and inserts usage events atomically", async () => {
    const { supabase, userId } = await createTestUser();
    const { periodStart, periodEnd } = getCurrentPeriodRange();

    try {
      const { data, error } = await supabase.rpc("consume_usage", {
        p_user_id: userId,
        p_feature: "demo",
        p_amount: 10,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_credits_total: 100,
        p_metadata: { source: "test" },
      });

      expect(error).toBeNull();
      const result = Array.isArray(data) ? data[0] : data;

      expect(result).toMatchObject({
        period_start: periodStart,
        period_end: periodEnd,
        credits_total: 100,
        credits_used: 10,
        credits_remaining: 90,
      });

      const { data: balance } = await supabase
        .from("usage_balances")
        .select("credits_total, credits_used")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();

      expect(balance).toMatchObject({
        credits_total: 100,
        credits_used: 10,
      });

      const { data: events } = await supabase
        .from("usage_events")
        .select("feature, amount, period_start")
        .eq("user_id", userId)
        .eq("period_start", periodStart);

      expect(events).toHaveLength(1);
      expect(events?.[0]).toMatchObject({
        feature: "demo",
        amount: 10,
        period_start: periodStart,
      });
    } finally {
      await deleteTestUser(supabase, userId);
    }
  });

  it("returns a stable error when usage exceeds the limit", async () => {
    const { supabase, userId } = await createTestUser();
    const { periodStart, periodEnd } = getCurrentPeriodRange();

    try {
      const { data, error } = await supabase.rpc("consume_usage", {
        p_user_id: userId,
        p_feature: "demo",
        p_amount: 10,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_credits_total: 5,
        p_metadata: null,
      });

      expect(data).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.message).toBe("usage_limit_exceeded");

      const { data: balances } = await supabase
        .from("usage_balances")
        .select("user_id")
        .eq("user_id", userId)
        .eq("period_start", periodStart);

      const { data: events } = await supabase
        .from("usage_events")
        .select("user_id")
        .eq("user_id", userId)
        .eq("period_start", periodStart);

      expect(balances ?? []).toHaveLength(0);
      expect(events ?? []).toHaveLength(0);
    } finally {
      await deleteTestUser(supabase, userId);
    }
  });

  it("prevents double-spend when concurrent usage exceeds the limit", async () => {
    const { supabase, userId } = await createTestUser();
    const { periodStart, periodEnd } = getCurrentPeriodRange();

    try {
      const [first, second] = await Promise.all([
        supabase.rpc("consume_usage", {
          p_user_id: userId,
          p_feature: "demo",
          p_amount: 7,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_credits_total: 10,
          p_metadata: null,
        }),
        supabase.rpc("consume_usage", {
          p_user_id: userId,
          p_feature: "demo",
          p_amount: 7,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_credits_total: 10,
          p_metadata: null,
        }),
      ]);

      const results = [first, second];
      const successCount = results.filter((result) => !result.error).length;
      const errorMessages = results
        .map((result) => result.error?.message)
        .filter(Boolean);

      expect(successCount).toBe(1);
      expect(errorMessages).toContain("usage_limit_exceeded");

      const { data: balance } = await supabase
        .from("usage_balances")
        .select("credits_used")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();

      expect(balance?.credits_used).toBe(7);

      const { data: events } = await supabase
        .from("usage_events")
        .select("id")
        .eq("user_id", userId)
        .eq("period_start", periodStart);

      expect(events ?? []).toHaveLength(1);
    } finally {
      await deleteTestUser(supabase, userId);
    }
  });
});
