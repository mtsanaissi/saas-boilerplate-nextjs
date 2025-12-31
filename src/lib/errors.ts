export const errorCodeToMessageKey = {
  invalid_credentials: "invalidCredentials",
  invalid_email: "invalidEmail",
  invalid_password: "invalidPassword",
  invalid_profile: "invalidProfile",
  signup_failed: "signupFailed",
  reset_failed: "resetFailed",
  update_password_failed: "updatePasswordFailed",
  magic_link_failed: "magicLinkFailed",
  resend_failed: "resendFailed",
  invalid_session: "invalidSession",
  profile_update_failed: "profileUpdateFailed",
  access_denied: "accessDenied",
  upgrade_required: "upgradeRequired",
  unauthorized: "unauthorized",
  usage_limit_exceeded: "usageLimitExceeded",
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
