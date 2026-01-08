import type { Plan, PlanId } from "@/types/billing";
import { getServerEnv } from "@/lib/env/server";

const env = getServerEnv();
const appUrl = env.appUrl;

export const plans: Plan[] = [
  {
    id: "free",
    priceMonthly: 0,
  },
  {
    id: "starter",
    priceMonthly: 29,
    stripePriceId: env.stripePriceStarterMonthly ?? "",
  },
  {
    id: "pro",
    priceMonthly: 79,
    stripePriceId: env.stripePriceProMonthly ?? "",
  },
];

export function getPlanById(id: PlanId): Plan | undefined {
  return plans.find((plan) => plan.id === id);
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
  return plans.find((plan) => plan.stripePriceId === priceId);
}

export function getAppBaseUrl(): string {
  return appUrl;
}
