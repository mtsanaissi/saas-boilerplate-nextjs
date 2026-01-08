import { getFeatureFlags } from "@/lib/env/server";

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export function isAnalyticsEnabled(): boolean {
  const { analytics } = getFeatureFlags();
  return analytics;
}
