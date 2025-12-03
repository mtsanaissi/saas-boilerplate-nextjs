export type PlanId = "free" | "starter" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  highlight?: string;
  features: string[];
  stripePriceId?: string;
}
