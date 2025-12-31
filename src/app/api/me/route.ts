import { NextResponse, type NextRequest } from "next/server";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import type { UserProfile } from "@/types/profile";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";
import { rateLimitApi } from "@/lib/rate-limit/server";

export async function GET(request: NextRequest) {
  const ip = getClientIpFromRequest(request);
  try {
    await rateLimitApi(`ip:${ip}`);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    throw error;
  }

  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  try {
    await rateLimitApi(`user:${authResult.userId}`);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    throw error;
  }

  const { supabase, userId, email } = authResult;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, locale, plan_id, plan_status")
    .eq("id", userId)
    .maybeSingle<UserProfile>();

  return NextResponse.json({
    user: { id: userId, email },
    profile,
  });
}
