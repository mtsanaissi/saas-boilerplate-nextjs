type RateLimitConfig = {
  windowSeconds: number;
  max: number;
};

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const rateLimitConfig = {
  auth: {
    windowSeconds: parseNumber(process.env.RATE_LIMIT_AUTH_WINDOW_SECONDS, 300),
    max: parseNumber(process.env.RATE_LIMIT_AUTH_MAX, 10),
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
  auth: RateLimitConfig;
  api: RateLimitConfig;
  usage: RateLimitConfig;
};

export type { RateLimitConfig };
