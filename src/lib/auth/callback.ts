export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildAuthCallbackUrl(locale: string, nextPath: string): string {
  const callbackUrl = new URL("/auth/callback", getAppUrl());
  callbackUrl.searchParams.set("next", `/${locale}${nextPath}`);
  return callbackUrl.toString();
}
