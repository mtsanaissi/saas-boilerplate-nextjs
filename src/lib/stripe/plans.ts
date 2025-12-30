import type { Plan, PlanId } from "@/types/billing";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const plans: Plan[] = [
  {
    id: "free",
    priceMonthly: 0,
  },
  {
    id: "starter",
    priceMonthly: 29,
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  },
  {
    id: "pro",
    priceMonthly: 79,
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
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
