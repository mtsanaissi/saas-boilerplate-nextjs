import { describe, expect, it } from "vitest";
import { getFeatureFlags, validateServerEnv } from "@/lib/env/server";

const requiredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
} as const;

describe("env validation", () => {
  it("throws with a clear message when required env vars are missing", () => {
    expect(() => validateServerEnv({} as NodeJS.ProcessEnv)).toThrow(
      /Missing required environment variables/,
    );
    expect(() => validateServerEnv({} as NodeJS.ProcessEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
    expect(() => validateServerEnv({} as NodeJS.ProcessEnv)).toThrow(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
    expect(() => validateServerEnv({} as NodeJS.ProcessEnv)).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });

  it("defaults optional feature flags when not explicitly set", () => {
    const flags = getFeatureFlags({} as NodeJS.ProcessEnv);
    expect(flags.billing).toBe(false);
    expect(flags.analytics).toBe(true);
    expect(flags.devPages).toBe(false);
    expect(flags.errorReporting).toBe(false);
  });

  it("accepts base required env vars when billing is disabled", () => {
    const env = {
      ...requiredEnv,
      FEATURE_BILLING_ENABLED: "false",
      NODE_ENV: "test",
    } as const;

    expect(() =>
      validateServerEnv(env as unknown as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});
