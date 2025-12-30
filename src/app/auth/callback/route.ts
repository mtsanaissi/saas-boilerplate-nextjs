import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

function isSafeNextPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath =
    requestUrl.searchParams.get("next") ??
    `/${routing.defaultLocale}/dashboard`;

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

  const destination = isSafeNextPath(nextPath)
    ? nextPath
    : `/${routing.defaultLocale}/dashboard`;

  return NextResponse.redirect(new URL(destination, request.url));
}
