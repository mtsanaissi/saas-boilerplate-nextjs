import type { PlanId, PlanStatus } from "@/types/billing";

export type UsageLimit = {
  creditsMonthly: number;
};

export const usageLimitsByPlan: Record<PlanId, UsageLimit> = {
  free: {
    creditsMonthly: 50,
  },
  starter: {
    creditsMonthly: 500,
  },
  pro: {
    creditsMonthly: 2000,
  },
};

export function getCreditsForPlan(planId: PlanId): number {
  return usageLimitsByPlan[planId]?.creditsMonthly ?? 0;
}

export function isActivePlanStatus(status: PlanStatus): boolean {
  return status === "trialing" || status === "active";
}

export function getCreditsTotalForPlanStatus(
  planId: PlanId,
  planStatus: PlanStatus,
): number {
  if (planId === "free") {
    return getCreditsForPlan(planId);
  }

  if (!isActivePlanStatus(planStatus)) {
    return 0;
  }

  return getCreditsForPlan(planId);
}
