import type { Plan, PlanId } from "@/types/billing";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect to explore the product and local dev.",
    priceMonthly: 0,
    highlight: "No credit card required",
    features: ["Up to 1 project", "Community support", "Local Supabase setup"],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For freelancers and small teams getting started.",
    priceMonthly: 29,
    highlight: "Best for early-stage SaaS",
    features: ["Up to 5 projects", "Email support", "Basic analytics"],
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? "",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Scale with advanced features and priority support.",
    priceMonthly: 79,
    highlight: "For growing teams in production",
    features: ["Unlimited projects", "Priority support", "Advanced analytics"],
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  },
];

export function getPlanById(id: PlanId): Plan | undefined {
  return plans.find((plan) => plan.id === id);
}

export function getAppBaseUrl(): string {
  return appUrl;
}
