"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { getAppBaseUrl, getPlanById } from "@/lib/stripe/plans";
import type { PlanId } from "@/types/billing";

export async function createCheckoutSession(formData: FormData) {
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

  const stripe = getStripeClient();

  const baseUrl = getAppBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/plans?success=1`,
    cancel_url: `${baseUrl}/plans?canceled=1`,
    customer_email: user.email ?? undefined,
    metadata: {
      supabase_user_id: user.id,
      plan_id: plan.id,
    },
  });

  if (!session.url) {
    redirect("/plans?error=checkout_unavailable");
  }

  redirect(session.url);
}
