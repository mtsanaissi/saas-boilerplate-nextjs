import type { SupabaseClient } from "@supabase/supabase-js";
import { getSessionIdFromAccessToken } from "@/lib/auth/session";

type UpsertSessionInput = {
  supabase: SupabaseClient;
  accessToken: string | null | undefined;
  userId: string | null | undefined;
  ipAddress: string | null;
  userAgent: string | null;
};

export async function upsertUserSession({
  supabase,
  accessToken,
  userId,
  ipAddress,
  userAgent,
}: UpsertSessionInput) {
  if (!accessToken || !userId) return;
  const sessionId = getSessionIdFromAccessToken(accessToken);
  if (!sessionId) return;

  try {
    await supabase
      .from("user_sessions")
      .upsert({
        session_id: sessionId,
        user_id: userId,
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
  } catch {
    return;
  }
}
