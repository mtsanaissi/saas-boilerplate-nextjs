import { NextResponse, type NextRequest } from "next/server";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import type { UserProfile } from "@/types/profile";

export async function GET(request: NextRequest) {
  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult.response;
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
