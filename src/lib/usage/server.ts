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
    const error = new Error("invalid_request");
    error.name = "invalid_request";
    throw error;
  }

  const supabaseAdmin = createAdminClient();
  const { periodStart, periodEnd } = getCurrentPeriodRange();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("plan_id, plan_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const planId = (profile?.plan_id as PlanId) ?? "free";
  const planStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const creditsTotal = getCreditsTotalForPlanStatus(planId, planStatus);

  const { data, error } = await supabaseAdmin.rpc("consume_usage", {
    p_user_id: userId,
    p_feature: feature,
    p_amount: amount,
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_credits_total: creditsTotal,
    p_metadata: metadata ?? null,
  });

  if (error) {
    if (error.message === "usage_limit_exceeded") {
      const limitError = new Error("usage_limit_exceeded");
      limitError.name = "usage_limit_exceeded";
      throw limitError;
    }

    if (
      error.message === "invalid_usage_amount" ||
      error.message === "invalid_usage_total"
    ) {
      const requestError = new Error("invalid_request");
      requestError.name = "invalid_request";
      throw requestError;
    }

    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result) {
    throw new Error("usage_rpc_no_result");
  }

  return {
    periodStart: result.period_start,
    periodEnd: result.period_end,
    creditsTotal: result.credits_total,
    creditsUsed: result.credits_used,
    creditsRemaining: result.credits_remaining,
  };
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
    if (error instanceof Error && error.name === "invalid_request") {
      const requestError = new Error("invalid_request");
      requestError.name = "invalid_request";
      throw requestError;
    }
    throw error;
  }
}
