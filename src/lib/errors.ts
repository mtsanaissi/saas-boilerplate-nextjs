export const errorCodeToMessageKey = {
  invalid_credentials: "invalidCredentials",
  invalid_email: "invalidEmail",
  invalid_password: "invalidPassword",
  invalid_profile: "invalidProfile",
  email_already_registered: "emailAlreadyRegistered",
  signup_failed: "signupFailed",
  reset_failed: "resetFailed",
  update_password_failed: "updatePasswordFailed",
  magic_link_failed: "magicLinkFailed",
  resend_failed: "resendFailed",
  invalid_session: "invalidSession",
  profile_update_failed: "profileUpdateFailed",
  email_change_failed: "emailChangeFailed",
  email_change_same: "emailChangeSame",
  access_denied: "accessDenied",
  email_unverified: "emailUnverified",
  upgrade_required: "upgradeRequired",
  unauthorized: "unauthorized",
  usage_limit_exceeded: "usageLimitExceeded",
  rate_limited: "rateLimited",
  billing_portal_unavailable: "billingPortalUnavailable",
  consent_update_failed: "consentUpdateFailed",
  invalid_plan: "invalidPlan",
  plan_not_available: "planNotAvailable",
  checkout_unavailable: "checkoutUnavailable",
  data_export_failed: "dataExportFailed",
  deletion_request_failed: "deletionRequestFailed",
  deletion_confirmation_required: "deletionConfirmationRequired",
  deletion_confirmation_mismatch: "deletionConfirmationMismatch",
  deletion_request_invalid: "deletionRequestInvalid",
  deletion_request_expired: "deletionRequestExpired",
  deletion_confirm_failed: "deletionConfirmFailed",
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
