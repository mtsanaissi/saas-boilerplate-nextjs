import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AccountExport,
  AccountExportBillingCustomer,
  AccountExportBillingSubscription,
} from "@/types/account";
import type { UserProfile } from "@/types/profile";
import type { UsageBalance, UsageEvent } from "@/types/usage";

type BuildAccountExportInput = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
};

export async function buildAccountExport({
  supabase,
  userId,
  email,
}: BuildAccountExportInput): Promise<AccountExport> {
  const [
    profileResult,
    customerResult,
    subscriptionResult,
    balancesResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url, locale, plan_id, plan_status")
      .eq("id", userId)
      .maybeSingle<UserProfile>(),
    supabase
      .from("billing_customers")
      .select("stripe_customer_id, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle<AccountExportBillingCustomer>(),
    supabase
      .from("billing_subscriptions")
      .select(
        "stripe_subscription_id, stripe_price_id, status, current_period_end, cancel_at_period_end, created_at, updated_at",
      )
      .eq("user_id", userId)
      .maybeSingle<AccountExportBillingSubscription>(),
    supabase
      .from("usage_balances")
      .select("user_id, period_start, period_end, credits_total, credits_used")
      .eq("user_id", userId)
      .order("period_start", { ascending: false })
      .returns<UsageBalance[]>(),
    supabase
      .from("usage_events")
      .select(
        "id, user_id, feature, amount, period_start, created_at, metadata",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .returns<UsageEvent[]>(),
  ]);

  return {
    generated_at: new Date().toISOString(),
    user: {
      id: userId,
      email,
    },
    profile: profileResult.data ?? null,
    billing: {
      customer: customerResult.data ?? null,
      subscription: subscriptionResult.data ?? null,
    },
    usage: {
      balances: balancesResult.data ?? [],
      events: eventsResult.data ?? [],
    },
  };
}
