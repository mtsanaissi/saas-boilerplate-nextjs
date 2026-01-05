"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { routing, type AppLocale } from "@/i18n/routing";
import { logAuditEvent } from "@/lib/observability/audit";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import { headers } from "next/headers";

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

async function getUserAgent(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("user-agent");
}

export async function updateConsents(formData: FormData) {
  const locale = getLocale(formData);
  const analyticsEnabled = formData.get("analyticsEnabled") === "on";
  const marketingEnabled = formData.get("marketingEnabled") === "on";
  const termsAccepted = formData.get("termsAccepted") === "on";
  const privacyAccepted = formData.get("privacyAccepted") === "on";

  const { supabase, userId } = await requireUser(locale, "/settings");

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_consents")
    .upsert({
      user_id: userId,
      analytics_enabled: analyticsEnabled,
      marketing_enabled: marketingEnabled,
      terms_accepted_at: termsAccepted ? now : null,
      privacy_accepted_at: privacyAccepted ? now : null,
    })
    .select()
    .maybeSingle();

  if (error) {
    redirect(`/${locale}/settings?error=consent_update_failed`);
  }

  const ip = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId,
    action: "consents.updated",
    ipAddress: ip,
    userAgent,
    metadata: { analyticsEnabled, marketingEnabled },
  });

  redirect(`/${locale}/settings?success=1#consents`);
}

export async function signOutOtherSessions(formData: FormData) {
  const locale = getLocale(formData);
  const currentSessionId = formData.get("currentSessionId");
  const { supabase, userId } = await requireUser(locale, "/settings");
  await supabase.auth.signOut({ scope: "others" });

  const deleteQuery = supabase
    .from("user_sessions")
    .delete()
    .eq("user_id", userId);
  if (typeof currentSessionId === "string" && currentSessionId.length > 0) {
    await deleteQuery.neq("session_id", currentSessionId);
  } else {
    const { data: latestSession } = await supabase
      .from("user_sessions")
      .select("session_id")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ session_id: string }>();
    if (latestSession?.session_id) {
      await deleteQuery.neq("session_id", latestSession.session_id);
    } else {
      await deleteQuery;
    }
  }

  const ip = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId,
    action: "sessions.revoked_others",
    ipAddress: ip,
    userAgent,
  });

  redirect(`/${locale}/settings?success=1#sessions`);
}

export async function signOutAllSessions(formData: FormData) {
  const locale = getLocale(formData);
  const { supabase, userId } = await requireUser(locale, "/settings");
  await supabase.auth.signOut({ scope: "global" });

  await supabase.from("user_sessions").delete().eq("user_id", userId);

  const ip = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId,
    action: "sessions.revoked_all",
    ipAddress: ip,
    userAgent,
  });

  redirect(`/${locale}/auth/login`);
}
