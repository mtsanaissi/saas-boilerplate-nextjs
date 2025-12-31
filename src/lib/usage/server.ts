import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanId, PlanStatus } from "@/types/billing";
import type { UsageAllowance, UsageBalance } from "@/types/usage";
import { getCreditsTotalForPlanStatus } from "@/lib/usage/limits";
import { getCurrentPeriodRange } from "@/lib/usage/period";

export async function getUsageAllowance(
  userId: string,
): Promise<UsageAllowance> {
  const supabaseAdmin = createAdminClient();
  const { periodStart, periodEnd } = getCurrentPeriodRange();

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan_id, plan_status")
    .eq("id", userId)
    .maybeSingle();

  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const creditsTotal = getCreditsTotalForPlanStatus(planId, planStatus);

  const { data: balance } = await supabaseAdmin
    .from("usage_balances")
    .select("user_id, period_start, period_end, credits_total, credits_used")
    .eq("user_id", userId)
    .eq("period_start", periodStart)
    .maybeSingle<UsageBalance>();

  const creditsUsed = balance?.credits_used ?? 0;

  return {
    periodStart,
    periodEnd,
    creditsTotal,
    creditsUsed,
    creditsRemaining: Math.max(creditsTotal - creditsUsed, 0),
  };
}

export async function consumeUsage({
  userId,
  feature,
  amount,
  metadata,
}: {
  userId: string;
  feature: string;
  amount: number;
  metadata?: Record<string, unknown> | null;
}): Promise<UsageAllowance> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid usage amount");
  }

  const supabaseAdmin = createAdminClient();
  const { periodStart, periodEnd } = getCurrentPeriodRange();
  const allowance = await getUsageAllowance(userId);

  if (allowance.creditsRemaining < amount) {
    const error = new Error("usage_limit_exceeded");
    error.name = "usage_limit_exceeded";
    throw error;
  }

  const { error: upsertError } = await supabaseAdmin
    .from("usage_balances")
    .upsert(
      {
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        credits_total: allowance.creditsTotal,
        credits_used: allowance.creditsUsed + amount,
      },
      { onConflict: "user_id,period_start" },
    );

  if (upsertError) {
    throw upsertError;
  }

  const { error: insertError } = await supabaseAdmin
    .from("usage_events")
    .insert({
      user_id: userId,
      feature,
      amount,
      period_start: periodStart,
      metadata: metadata ?? null,
    });

  if (insertError) {
    throw insertError;
  }

  return getUsageAllowance(userId);
}

export async function consumeUsageOrThrow({
  userId,
  feature,
  amount,
  metadata,
}: {
  userId: string;
  feature: string;
  amount: number;
  metadata?: Record<string, unknown> | null;
}): Promise<UsageAllowance> {
  try {
    return await consumeUsage({ userId, feature, amount, metadata });
  } catch (error) {
    if (error instanceof Error && error.name === "usage_limit_exceeded") {
      const limitError = new Error("usage_limit_exceeded");
      limitError.name = "usage_limit_exceeded";
      throw limitError;
    }
    throw error;
  }
}
