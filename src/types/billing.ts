export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  priceMonthly: number;
  stripePriceId?: string;
}
