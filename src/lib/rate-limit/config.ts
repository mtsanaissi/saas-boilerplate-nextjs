type RateLimitConfig = {
  windowSeconds: number;
  max: number;
};

type RateLimitFailureMode = "allow" | "deny";

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseFailureMode(
  value: string | undefined,
  fallback: RateLimitFailureMode,
): RateLimitFailureMode {
  const normalized = value?.toLowerCase();
  if (normalized === "allow" || normalized === "deny") {
    return normalized;
  }
  return fallback;
}

export const rateLimitConfig = {
  auth: {
    windowSeconds: parseNumber(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS, 300),
    max: parseNumber(process.env.RATE_LIMIT_AUTH_MAX, 10),
    failureMode: parseFailureMode(
      process.env.RATE_LIMIT_AUTH_FAILURE_MODE,
      "deny",
    ),
  },
  api: {
    windowSeconds: parseNumber(process.env.RATE_LIMIT_API_WINDOW_SECONDS, 60),
    max: parseNumber(process.env.RATE_LIMIT_API_MAX, 30),
  },
  usage: {
    windowSeconds: parseNumber(process.env.RATE_LIMIT_USAGE_WINDOW_SECONDS, 60),
    max: parseNumber(process.env.RATE_LIMIT_USAGE_MAX, 10),
  },
} satisfies {
  auth: RateLimitConfig & { failureMode: RateLimitFailureMode };
  api: RateLimitConfig;
  usage: RateLimitConfig;
};

export type { RateLimitConfig, RateLimitFailureMode };
