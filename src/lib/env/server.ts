import type { FeatureFlags, ServerEnv } from "@/types/env";

const BASE_REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const BILLING_REQUIRED = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER_MONTHLY",
  "STRIPE_PRICE_PRO_MONTHLY",
] as const;

const DEFAULT_APP_URL = "http://localhost:3000";

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

function parseLogLevel(value: string | undefined): ServerEnv["logLevel"] {
  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  ) {
    return value;
  }
  return "info";
}

function parseOptionalNumber(
  value: string | undefined,
  label: string,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric env var ${label}: ${value}`);
  }
  return parsed;
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function getFeatureFlags(
  env: NodeJS.ProcessEnv = process.env,
): FeatureFlags {
  const analyticsDefault = env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";
  const billingDefault = Boolean(
    env.STRIPE_SECRET_KEY ||
    env.STRIPE_PRICE_STARTER_MONTHLY ||
    env.STRIPE_PRICE_PRO_MONTHLY,
  );

  return {
    billing: parseBooleanEnv(env.FEATURE_BILLING_ENABLED, billingDefault),
    analytics: parseBooleanEnv(env.FEATURE_ANALYTICS_ENABLED, analyticsDefault),
    devPages: parseBooleanEnv(env.DEV_PAGES_ENABLED, false),
    errorReporting: parseBooleanEnv(env.ERROR_REPORTING_ENABLED, false),
  };
}

export function validateServerEnv(
  env: NodeJS.ProcessEnv = process.env,
  flags: FeatureFlags = getFeatureFlags(env),
) {
  const missing: string[] = [];

  for (const key of BASE_REQUIRED) {
    if (!normalizeEnvValue(env[key])) {
      missing.push(key);
    }
  }

  if (flags.billing) {
    for (const key of BILLING_REQUIRED) {
      if (!normalizeEnvValue(env[key])) {
        missing.push(key);
      }
    }
  }

  if (missing.length) {
    const list = missing.join(", ");
    throw new Error(
      `Missing required environment variables: ${list}. ` +
        "Set them in .env.local or your deployment environment.",
    );
  }
}

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  const featureFlags = getFeatureFlags(env);
  validateServerEnv(env, featureFlags);

  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    stripeSecretKey: normalizeEnvValue(env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: normalizeEnvValue(env.STRIPE_WEBHOOK_SECRET),
    stripeWebhookAllowUnverified:
      env.STRIPE_WEBHOOK_ALLOW_UNVERIFIED === "true",
    stripePriceStarterMonthly: normalizeEnvValue(
      env.STRIPE_PRICE_STARTER_MONTHLY,
    ),
    stripePriceProMonthly: normalizeEnvValue(env.STRIPE_PRICE_PRO_MONTHLY),
    stripeApiHost: normalizeEnvValue(env.STRIPE_API_HOST),
    stripeApiPort: parseOptionalNumber(env.STRIPE_API_PORT, "STRIPE_API_PORT"),
    stripeApiProtocol: normalizeEnvValue(env.STRIPE_API_PROTOCOL),
    appUrl: env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL,
    logLevel: parseLogLevel(env.LOG_LEVEL?.toLowerCase()),
    featureFlags,
  };
}

export function assertServerEnv() {
  validateServerEnv();
}
