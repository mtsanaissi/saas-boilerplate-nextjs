import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanByPriceId } from "@/lib/stripe/plans";
import type { PlanStatus } from "@/types/billing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const planStatuses: PlanStatus[] = [
  "free",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
];

function normalizePlanStatus(status: string): PlanStatus | null {
  return planStatuses.includes(status as PlanStatus)
    ? (status as PlanStatus)
    : null;
}

function toTimestamp(seconds?: number | null): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

async function resolveUserIdFromCustomer(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  stripeCustomerId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.user_id ?? null;
}

export async function POST(request: Request) {
  const supabaseAdmin = createAdminClient();

  const headerStore = await headers();
  const signature = headerStore.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const allowUnverified =
    process.env.STRIPE_WEBHOOK_ALLOW_UNVERIFIED === "true";
  const isDev = process.env.NODE_ENV !== "production";

  if (!signature && !(isDev && allowUnverified)) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      const stripe = getStripeClient();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else if (isDev && allowUnverified) {
      event = JSON.parse(body) as Stripe.Event;
    } else {
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid Stripe signature",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }

  let userId: string | null = null;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    userId = session.metadata?.supabase_user_id ?? null;
  } else if (event.data.object && "metadata" in event.data.object) {
    const metadata = (event.data.object as { metadata?: Stripe.Metadata })
      .metadata;
    userId = metadata?.supabase_user_id ?? null;
  }

  const { error: eventInsertError } = await supabaseAdmin
    .from("stripe_events")
    .upsert(
      {
        id: event.id,
        type: event.type,
        event_created_at: toTimestamp(event.created),
        processed_at: null,
        user_id: userId,
        payload: event,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (eventInsertError) {
    return NextResponse.json(
      {
        error: "Failed to record Stripe event",
        details: eventInsertError.message,
      },
      { status: 500 },
    );
  }

  const { data: eventRecord, error: eventFetchError } = await supabaseAdmin
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .maybeSingle();

  if (eventFetchError) {
    return NextResponse.json(
      {
        error: "Failed to load Stripe event",
        details: eventFetchError.message,
      },
      { status: 500 },
    );
  }

  if (eventRecord?.processed_at) {
    return NextResponse.json({ received: true, deduped: true });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : null;
      const sessionUserId = session.metadata?.supabase_user_id ?? null;

      if (stripeCustomerId && sessionUserId) {
        const { error: upsertCustomerError } = await supabaseAdmin
          .from("billing_customers")
          .upsert(
            {
              user_id: sessionUserId,
              stripe_customer_id: stripeCustomerId,
            },
            { onConflict: "user_id" },
          );

        if (upsertCustomerError) {
          return NextResponse.json(
            {
              error: "Failed to upsert billing customer",
              details: upsertCustomerError.message,
            },
            { status: 500 },
          );
        }
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : null;
      const subscriptionUserId =
        subscription.metadata?.supabase_user_id ??
        (stripeCustomerId
          ? await resolveUserIdFromCustomer(supabaseAdmin, stripeCustomerId)
          : null);

      if (!subscriptionUserId) {
        break;
      }

      const status = normalizePlanStatus(subscription.status);
      const priceId = subscription.items.data[0]?.price?.id ?? null;
      const currentPeriodEnd =
        "current_period_end" in subscription
          ? (subscription as Stripe.Subscription & {
              current_period_end?: number;
            }).current_period_end
          : subscription.items.data[0]?.current_period_end;

      if (!status || !priceId) {
        break;
      }

      const { error: upsertSubscriptionError } = await supabaseAdmin
        .from("billing_subscriptions")
        .upsert(
          {
            user_id: subscriptionUserId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status,
          current_period_end: toTimestamp(currentPeriodEnd),
            cancel_at_period_end: subscription.cancel_at_period_end ?? false,
          },
          { onConflict: "user_id" },
        );

      if (upsertSubscriptionError) {
        return NextResponse.json(
          {
            error: "Failed to upsert billing subscription",
            details: upsertSubscriptionError.message,
          },
          { status: 500 },
        );
      }

      const plan = getPlanByPriceId(priceId);
      if (plan) {
        const { error: updateProfileError } = await supabaseAdmin
          .from("profiles")
          .update({ plan_id: plan.id, plan_status: status })
          .eq("id", subscriptionUserId);

        if (updateProfileError) {
          return NextResponse.json(
            {
              error: "Failed to update profile plan info",
              details: updateProfileError.message,
            },
            { status: 500 },
          );
        }
      }
      break;
    }
    default:
      break;
  }

  const { error: eventUpdateError } = await supabaseAdmin
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString(), user_id: userId })
    .eq("id", event.id);

  if (eventUpdateError) {
    return NextResponse.json(
      {
        error: "Failed to finalize Stripe event",
        details: eventUpdateError.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
