export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, unknown>;
};

export function isAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "false";
}
