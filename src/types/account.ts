import type { UserProfile } from "@/types/profile";
import type { UsageBalance, UsageEvent } from "@/types/usage";
import type { PlanStatus } from "@/types/billing";

export interface AccountExportBillingCustomer {
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountExportBillingSubscription {
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: PlanStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface AccountExportBilling {
  customer: AccountExportBillingCustomer | null;
  subscription: AccountExportBillingSubscription | null;
}

export interface AccountExportUsage {
  balances: UsageBalance[];
  events: UsageEvent[];
}

export interface AccountExportProfile extends UserProfile {
  plan_id?: string | null;
  plan_status?: string | null;
}

export interface AccountExport {
  generated_at: string;
  user: {
    id: string;
    email: string | null;
  };
  profile: AccountExportProfile | null;
  billing: AccountExportBilling;
  usage: AccountExportUsage;
}
