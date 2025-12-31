export interface UsageBalance {
  user_id: string;
  period_start: string;
  period_end: string;
  credits_total: number;
  credits_used: number;
}

export interface UsageEvent {
  id: string;
  user_id: string;
  feature: string;
  amount: number;
  period_start: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface UsageAllowance {
  periodStart: string;
  periodEnd: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
}
