import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { upsertUserSession } from "@/lib/auth/session-tracking";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";
import { getServerEnv } from "@/lib/env/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const env = getServerEnv();

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const [{ data: userData }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  const ipAddress = getClientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent");
  await upsertUserSession({
    supabase,
    accessToken: sessionData.session?.access_token ?? null,
    userId: userData.user?.id ?? null,
    ipAddress,
    userAgent,
  });

  return supabaseResponse;
}
