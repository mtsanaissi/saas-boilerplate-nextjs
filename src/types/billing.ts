export type PlanId = "free" | "starter" | "pro";
export type PlanStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface Plan {
  id: PlanId;
  priceMonthly: number;
  stripePriceId?: string;
}

export interface BillingSubscription {
  status: PlanStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}
