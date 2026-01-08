export type FeatureFlags = {
  billing: boolean;
  analytics: boolean;
  devPages: boolean;
  errorReporting: boolean;
};

export type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeWebhookAllowUnverified: boolean;
  stripePriceStarterMonthly?: string;
  stripePriceProMonthly?: string;
  stripeApiHost?: string;
  stripeApiPort?: number;
  stripeApiProtocol?: string;
  appUrl: string;
  logLevel: "debug" | "info" | "warn" | "error";
  featureFlags: FeatureFlags;
};
