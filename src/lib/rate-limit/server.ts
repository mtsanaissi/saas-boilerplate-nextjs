import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitConfig } from "@/lib/rate-limit/config";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
};

function normalizeKey(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(":");
}

export function buildRateLimitKey(prefix: string, identifier: string): string {
  return normalizeKey([prefix, identifier]);
}

export async function checkRateLimit({
  key,
  windowSeconds,
  max,
}: {
  key: string;
  windowSeconds: number;
  max: number;
}): Promise<RateLimitResult> {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin.rpc("rate_limit_check", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  });

  if (error) {
    throw error;
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error("Rate limit unavailable");
  }

  return result as RateLimitResult;
}

export async function rateLimitOrThrow({
  key,
  windowSeconds,
  max,
}: {
  key: string;
  windowSeconds: number;
  max: number;
}) {
  const result = await checkRateLimit({ key, windowSeconds, max });
  if (!result.allowed) {
    const error = new Error("rate_limited");
    error.name = "rate_limited";
    throw error;
  }
}

export async function rateLimitAuth(identifier: string) {
  const key = buildRateLimitKey("auth", identifier);
  return rateLimitOrThrow({
    key,
    windowSeconds: rateLimitConfig.auth.windowSeconds,
    max: rateLimitConfig.auth.max,
  });
}

export async function rateLimitApi(identifier: string) {
  const key = buildRateLimitKey("api", identifier);
  return rateLimitOrThrow({
    key,
    windowSeconds: rateLimitConfig.api.windowSeconds,
    max: rateLimitConfig.api.max,
  });
}

export async function rateLimitUsage(identifier: string) {
  const key = buildRateLimitKey("usage", identifier);
  return rateLimitOrThrow({
    key,
    windowSeconds: rateLimitConfig.usage.windowSeconds,
    max: rateLimitConfig.usage.max,
  });
}
