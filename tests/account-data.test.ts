import { describe, expect, it } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAccountExport } from "@/lib/account/export";
import {
  deleteAccountById,
  performAccountDeletion,
} from "@/lib/account/deletion";
import { getCurrentPeriodRange } from "@/lib/usage/period";

const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const describeIf = hasSupabaseEnv ? describe : describe.skip;

async function createTestUser() {
  const supabase = createAdminClient();
  const email = `account-test-${crypto.randomUUID()}@example.com`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error("Failed to create test user");
  }

  const userId = data.user.id;

  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  return { supabase, userId, email };
}

describeIf("account data flows", () => {
  it("exports profile, billing, and usage data for the user", async () => {
    const { supabase, userId, email } = await createTestUser();
    const { periodStart, periodEnd } = getCurrentPeriodRange();

    try {
      await supabase
        .from("profiles")
        .update({
          display_name: "Export Test",
          avatar_url: "https://example.com/avatar.png",
          locale: "en",
          plan_id: "starter",
          plan_status: "active",
        })
        .eq("id", userId);

      const stripeCustomerId = `cus_${crypto.randomUUID()}`;
      const stripeSubscriptionId = `sub_${crypto.randomUUID()}`;
      const stripePriceId = `price_${crypto.randomUUID()}`;

      await supabase.from("billing_customers").insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });

      await supabase.from("billing_subscriptions").insert({
        user_id: userId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_price_id: stripePriceId,
        status: "active",
        current_period_end: new Date().toISOString(),
        cancel_at_period_end: false,
      });

      await supabase.from("usage_balances").insert({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        credits_total: 100,
        credits_used: 40,
      });

      await supabase.from("usage_events").insert({
        user_id: userId,
        feature: "export-test",
        amount: 5,
        period_start: periodStart,
        metadata: { source: "test" },
      });

      const exportData = await buildAccountExport({
        supabase,
        userId,
        email,
      });

      expect(exportData.user).toMatchObject({ id: userId, email });
      expect(exportData.profile).toMatchObject({
        id: userId,
        display_name: "Export Test",
        avatar_url: "https://example.com/avatar.png",
        locale: "en",
        plan_id: "starter",
        plan_status: "active",
      });
      expect(exportData.billing.customer?.stripe_customer_id).toBe(
        stripeCustomerId,
      );
      expect(exportData.billing.subscription?.stripe_subscription_id).toBe(
        stripeSubscriptionId,
      );
      expect(exportData.usage.balances[0]).toMatchObject({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        credits_total: 100,
        credits_used: 40,
      });
      expect(exportData.usage.events[0]).toMatchObject({
        user_id: userId,
        feature: "export-test",
        amount: 5,
        period_start: periodStart,
      });
    } finally {
      await deleteAccountById(userId);
    }
  });

  it("deletes user data and records an audit log entry", async () => {
    const { supabase, userId } = await createTestUser();
    const { periodStart, periodEnd } = getCurrentPeriodRange();

    await supabase.from("billing_customers").insert({
      user_id: userId,
      stripe_customer_id: `cus_${crypto.randomUUID()}`,
    });

    await supabase.from("usage_balances").insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      credits_total: 50,
      credits_used: 10,
    });

    await supabase.from("usage_events").insert({
      user_id: userId,
      feature: "delete-test",
      amount: 10,
      period_start: periodStart,
      metadata: null,
    });

    const requestedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await performAccountDeletion({
      userId,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      requestedAt,
      expiresAt,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    expect(profile).toBeNull();

    const { data: billingCustomers } = await supabase
      .from("billing_customers")
      .select("user_id")
      .eq("user_id", userId);

    expect(billingCustomers ?? []).toHaveLength(0);

    const { data: usageEvents } = await supabase
      .from("usage_events")
      .select("user_id")
      .eq("user_id", userId);

    expect(usageEvents ?? []).toHaveLength(0);

    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("action, target_id")
      .eq("action", "account.deletion_confirmed")
      .order("created_at", { ascending: false })
      .limit(1);

    expect(auditLogs?.[0]).toMatchObject({
      action: "account.deletion_confirmed",
      target_id: userId,
    });
  });
});
