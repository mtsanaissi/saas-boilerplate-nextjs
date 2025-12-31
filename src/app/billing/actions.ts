"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/server";
import { getAppBaseUrl } from "@/lib/stripe/plans";
import { routing, type AppLocale } from "@/i18n/routing";

function getLocale(formData: FormData): AppLocale {
  const locale = formData.get("locale");
  if (
    typeof locale === "string" &&
    routing.locales.includes(locale as AppLocale)
  ) {
    return locale as AppLocale;
  }
  return routing.defaultLocale;
}

export async function createBillingPortalSession(formData: FormData) {
  const locale = getLocale(formData);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/settings`);
  }

  const { data: customer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle<{ stripe_customer_id: string }>();

  if (!customer?.stripe_customer_id) {
    redirect(`/${locale}/settings?error=billing_portal_unavailable`);
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${baseUrl}/${locale}/settings`,
    });

    if (!session.url) {
      redirect(`/${locale}/settings?error=billing_portal_unavailable`);
    }

    redirect(session.url);
  } catch {
    redirect(`/${locale}/settings?error=billing_portal_unavailable`);
  }
}
