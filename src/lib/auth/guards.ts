import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { routing, type AppLocale } from "@/i18n/routing";
import type { PlanId, PlanStatus } from "@/types/billing";
import type { UserProfile } from "@/types/profile";

const planOrder: PlanId[] = ["free", "starter", "pro"];
const activeStatuses: PlanStatus[] = ["trialing", "active"];

function getPlanRank(plan: PlanId): number {
  return planOrder.indexOf(plan);
}

export function hasPlanAccess(currentPlan: PlanId, requiredPlan: PlanId) {
  return getPlanRank(currentPlan) >= getPlanRank(requiredPlan);
}

export async function requireUser(
  locale: AppLocale,
  redirectTo: string,
): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({
      href: { pathname: "/auth/login", query: { redirect: redirectTo } },
      locale,
    });
  }

  if (!user) {
    throw new Error("User required but not available after redirect.");
  }

  return { supabase, userId: user.id, email: user.email ?? null };
}

export async function requireProfile(
  locale: AppLocale,
  redirectTo: string,
): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  profile: UserProfile | null;
}> {
  const { supabase, userId, email } = await requireUser(locale, redirectTo);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale, plan_id, plan_status")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  return { supabase, userId, email, profile };
}

export async function requirePlanAccess(
  locale: AppLocale,
  redirectTo: string,
  requiredPlan: PlanId,
): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  profile: UserProfile | null;
}> {
  const { supabase, userId, profile } = await requireProfile(
    locale,
    redirectTo,
  );
  const currentPlan = (profile?.plan_id as PlanId) ?? "free";
  const currentStatus = (profile?.plan_status as PlanStatus) ?? "free";

  const requiresPaidStatus = requiredPlan !== "free";

  if (
    !hasPlanAccess(currentPlan, requiredPlan) ||
    (requiresPaidStatus && !activeStatuses.includes(currentStatus))
  ) {
    redirect({
      href: { pathname: "/plans", query: { error: "upgrade_required" } },
      locale,
    });
  }

  return { supabase, userId, profile };
}

export function resolveLocale(value: string | null): AppLocale {
  if (value && routing.locales.includes(value as AppLocale)) {
    return value as AppLocale;
  }

  return routing.defaultLocale;
}
