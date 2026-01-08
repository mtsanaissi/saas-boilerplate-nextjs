import { createClient } from "@supabase/supabase-js";
import {
  getRequiredEnv,
  isLocalSupabaseUrl,
  loadEnvFiles,
} from "./lib/env.mjs";

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/db-seed.mjs",
      "  node scripts/db-seed.mjs --dry-run",
      "  node scripts/db-seed.mjs --force",
      "",
      "Seeds demo users, billing, and usage data in local Supabase.",
      "--dry-run prints the plan without changing data.",
      "--force allows non-local Supabase URLs.",
    ].join("\n"),
  );
}

function getCurrentPeriodRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

const usageLimitsByPlan = {
  free: 50,
  starter: 500,
  pro: 2000,
};

function getCreditsTotalForPlanStatus(planId, planStatus) {
  if (planId === "free") return usageLimitsByPlan.free;
  if (planStatus !== "trialing" && planStatus !== "active") return 0;
  return usageLimitsByPlan[planId] ?? 0;
}

function buildSeedUsers() {
  return [
    {
      id: "00000000-0000-0000-0000-000000000001",
      email: "dev@dev.com",
      password: "devdevdev",
      displayName: "Dev User",
      locale: "en",
      planId: "starter",
      planStatus: "active",
      billing: {
        stripeCustomerId: "cus_demo_dev",
        stripeSubscriptionId: "sub_demo_dev",
        stripePriceId: "price_demo_starter",
      },
      usageEvents: [
        {
          id: "10000000-0000-0000-0000-000000000001",
          feature: "onboarding",
          amount: 25,
          metadata: { source: "seed", note: "starter usage" },
        },
        {
          id: "10000000-0000-0000-0000-000000000002",
          feature: "reports",
          amount: 40,
          metadata: { source: "seed", note: "starter usage" },
        },
        {
          id: "10000000-0000-0000-0000-000000000003",
          feature: "dev_seed",
          amount: 10,
          metadata: { source: "seed", note: "starter usage" },
        },
      ],
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      email: "free@demo.com",
      password: "freedemo",
      displayName: "Free Demo",
      locale: "en",
      planId: "free",
      planStatus: "free",
      usageEvents: [
        {
          id: "20000000-0000-0000-0000-000000000001",
          feature: "trial",
          amount: 12,
          metadata: { source: "seed", note: "free usage" },
        },
      ],
    },
  ];
}

function printPlan({ users, periodStart, periodEnd, supabaseUrl }) {
  console.log("DRY RUN: No changes will be applied.");
  console.log("Seed plan:");
  console.log(`- Supabase URL: ${supabaseUrl ?? "(not set)"}`);
  console.log(`- Usage period: ${periodStart} → ${periodEnd}`);
  console.log(`- Users: ${users.length}`);
  for (const user of users) {
    const totalEvents = user.usageEvents?.length ?? 0;
    const billingNote = user.billing ? "with billing" : "no billing";
    console.log(
      `  - ${user.email} (${user.planId}/${user.planStatus}, ${billingNote}, ${totalEvents} usage events)`,
    );
  }
}

async function ensureUser(admin, user) {
  const { data: byId } = await admin.getUserById(user.id);
  if (byId?.user) {
    const { data, error } = await admin.updateUserById(byId.user.id, {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.displayName },
    });
    if (error) throw error;
    return data.user;
  }

  const { data: listed, error: listError } = await admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = listed?.users?.find((entry) => entry.email === user.email);
  if (existing) {
    const { data, error } = await admin.updateUserById(existing.id, {
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.displayName },
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.createUser({
    id: user.id,
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.displayName },
  });
  if (error) throw error;
  return data.user;
}

async function upsertProfile(supabase, user, userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: user.displayName,
      locale: user.locale,
      plan_id: user.planId,
      plan_status: user.planStatus,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

async function upsertBilling(supabase, user, userId, periodEnd) {
  if (!user.billing) return;

  const { error: customerError } = await supabase
    .from("billing_customers")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: user.billing.stripeCustomerId,
      },
      { onConflict: "user_id" },
    );
  if (customerError) throw customerError;

  const periodEndDate = new Date(`${periodEnd}T23:59:59.000Z`);
  const { error: subscriptionError } = await supabase
    .from("billing_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: user.billing.stripeSubscriptionId,
        stripe_price_id: user.billing.stripePriceId,
        status: user.planStatus,
        current_period_end: periodEndDate.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" },
    );
  if (subscriptionError) throw subscriptionError;
}

async function upsertUsage(supabase, user, userId, periodStart, periodEnd) {
  const events = (user.usageEvents ?? []).map((event) => ({
    id: event.id,
    user_id: userId,
    feature: event.feature,
    amount: event.amount,
    period_start: periodStart,
    metadata: event.metadata ?? null,
  }));

  const creditsUsed = events.reduce((sum, event) => sum + event.amount, 0);
  const creditsTotal = getCreditsTotalForPlanStatus(
    user.planId,
    user.planStatus,
  );

  const { error: balanceError } = await supabase.from("usage_balances").upsert(
    {
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      credits_total: creditsTotal,
      credits_used: creditsUsed,
    },
    { onConflict: "user_id,period_start" },
  );
  if (balanceError) throw balanceError;

  if (events.length === 0) return;
  const { error: eventsError } = await supabase
    .from("usage_events")
    .upsert(events, { onConflict: "id" });
  if (eventsError) throw eventsError;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    usage();
    return;
  }

  const dryRun = args.has("--dry-run");
  const force = args.has("--force");

  await loadEnvFiles();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const { periodStart, periodEnd } = getCurrentPeriodRange();
  const users = buildSeedUsers();

  if (dryRun) {
    printPlan({ users, periodStart, periodEnd, supabaseUrl });
    return;
  }

  const requiredUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!force && !isLocalSupabaseUrl(requiredUrl)) {
    throw new Error(
      `Refusing to seed non-local Supabase URL: ${requiredUrl}. Use --force to override.`,
    );
  }

  const supabase = createClient(requiredUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const user of users) {
    const authUser = await ensureUser(supabase.auth.admin, user);
    const userId = authUser?.id ?? user.id;

    await upsertProfile(supabase, user, userId);
    await upsertBilling(supabase, user, userId, periodEnd);
    await upsertUsage(supabase, user, userId, periodStart, periodEnd);
  }

  console.log(`Seeded ${users.length} demo users for ${periodStart}.`);
}

main().catch((error) => {
  console.error("Seed failed:", error?.message ?? error);
  process.exitCode = 1;
});
