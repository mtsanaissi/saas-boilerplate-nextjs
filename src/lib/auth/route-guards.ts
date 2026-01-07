import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlanId, PlanStatus } from "@/types/billing";
import type { UserProfile } from "@/types/profile";
import { hasPlanAccess, isEmailVerified } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/observability/audit";
import { logInfo } from "@/lib/observability/logger";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";

type RouteAuthSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
};

type RouteAuthFailure = { response: NextResponse };

const activeStatuses: PlanStatus[] = ["trialing", "active"];

export async function requireUserInRoute(
  _request?: NextRequest,
): Promise<RouteAuthSuccess | RouteAuthFailure> {
  void _request;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!isEmailVerified(user)) {
    const ipAddress = _request ? getClientIpFromRequest(_request) : null;
    const userAgent = _request?.headers.get("user-agent") ?? null;
    const requestId = _request?.headers.get("x-request-id") ?? null;
    const path = _request?.nextUrl?.pathname ?? null;

    await logAuditEvent({
      userId: user.id,
      action: "auth.email_unverified_blocked",
      ipAddress,
      userAgent,
      metadata: { path },
    });

    logInfo("auth_email_unverified", {
      requestId,
      userId: user.id,
      path,
    });

    return {
      response: NextResponse.json(
        { error: "email_unverified" },
        { status: 403 },
      ),
    };
  }

  return { supabase, userId: user.id, email: user.email ?? null };
}

export async function requirePlanInRoute(
  request: NextRequest,
  requiredPlan: PlanId,
): Promise<
  (RouteAuthSuccess & { profile: UserProfile | null }) | RouteAuthFailure
> {
  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult;
  }

  const { supabase, userId, email } = authResult;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale, plan_id, plan_status")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  const currentPlan = (profile?.plan_id as PlanId) ?? "free";
  const currentStatus = (profile?.plan_status as PlanStatus) ?? "free";
  const requiresPaidStatus = requiredPlan !== "free";

  if (
    !hasPlanAccess(currentPlan, requiredPlan) ||
    (requiresPaidStatus && !activeStatuses.includes(currentStatus))
  ) {
    return {
      response: NextResponse.json(
        { error: "upgrade_required" },
        { status: 403 },
      ),
    };
  }

  return { supabase, userId, email, profile };
}
