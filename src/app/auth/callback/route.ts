import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { upsertUserSession } from "@/lib/auth/session-tracking";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";
import { logAuditEvent } from "@/lib/observability/audit";

function isSafeNextPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath =
    requestUrl.searchParams.get("next") ??
    `/${routing.defaultLocale}/dashboard`;
  const flowType = requestUrl.searchParams.get("type");
  const isEmailChange =
    flowType === "email_change" || nextPath.includes("emailChange=1");

  if (!code) {
    const fallback = `/${routing.defaultLocale}/auth/login?error=invalid_session`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const fallback = `/${routing.defaultLocale}/auth/login?error=invalid_session`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  const [{ data: sessionData }, { data: userData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  await upsertUserSession({
    supabase,
    accessToken: sessionData.session?.access_token ?? null,
    userId: userData.user?.id ?? null,
    ipAddress: getClientIpFromRequest(request),
    userAgent: request.headers.get("user-agent"),
  });

  if (isEmailChange && userData.user) {
    await logAuditEvent({
      userId: userData.user.id,
      action: "account.email_change_confirmed",
      ipAddress: getClientIpFromRequest(request),
      userAgent: request.headers.get("user-agent"),
      metadata: { email: userData.user.email ?? null },
    });
  }

  const destination = isSafeNextPath(nextPath)
    ? nextPath
    : `/${routing.defaultLocale}/dashboard`;

  return NextResponse.redirect(new URL(destination, request.url));
}
