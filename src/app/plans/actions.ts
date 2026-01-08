"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import type Stripe from "stripe";
import { getAppBaseUrl, getPlanById } from "@/lib/stripe/plans";
import type { PlanId } from "@/types/billing";
import { getFeatureFlags } from "@/lib/env/server";

export async function createCheckoutSession(formData: FormData) {
  const { billing } = getFeatureFlags();
  if (!billing) {
    redirect("/plans?error=billing_disabled");
  }

  const planIdValue = formData.get("planId");

  if (typeof planIdValue !== "string") {
    redirect("/plans?error=invalid_plan");
  }

  const planId = planIdValue as PlanId;
  const plan = getPlanById(planId);

  if (!plan || !plan.stripePriceId) {
    redirect("/plans?error=plan_not_available");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/plans`);
  }

  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string }>();

  const stripe = getStripeClient();

  const baseUrl = getAppBaseUrl();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/plans?success=1`,
    cancel_url: `${baseUrl}/plans?canceled=1`,
    client_reference_id: user.id,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan.id,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      plan_id: plan.id,
    },
  };

  if (billingCustomer?.stripe_customer_id) {
    sessionParams.customer = billingCustomer.stripe_customer_id;
  } else {
    sessionParams.customer_email = user.email ?? undefined;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    redirect("/plans?error=checkout_unavailable");
  }

  redirect(session.url);
}
