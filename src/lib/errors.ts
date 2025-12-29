export const errorCodeToMessageKey = {
  invalid_credentials: "invalidCredentials",
  signup_failed: "signupFailed",
  invalid_plan: "invalidPlan",
  plan_not_available: "planNotAvailable",
  checkout_unavailable: "checkoutUnavailable",
} as const;

export type ErrorCode = keyof typeof errorCodeToMessageKey;
export type ErrorMessageKey =
  | (typeof errorCodeToMessageKey)[ErrorCode]
  | "unknown";

export function getErrorMessageKey(errorCode: string | undefined) {
  if (!errorCode) return null;
  const key =
    errorCodeToMessageKey[errorCode as keyof typeof errorCodeToMessageKey];
  return key ?? "unknown";
}
