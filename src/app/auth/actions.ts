"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import { rateLimitAuth } from "@/lib/rate-limit/server";
import { rateLimitConfig } from "@/lib/rate-limit/config";
import { logAuditEvent } from "@/lib/observability/audit";
import { logError, logWarn } from "@/lib/observability/logger";
import { getRequestId } from "@/lib/observability/request-id";
import { headers } from "next/headers";
import { buildAuthCallbackUrl } from "@/lib/auth/callback";

function getRedirectTarget(formData: FormData, fallback: string): string {
  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.length > 0) {
    return redirectTo;
  }

  return fallback;
}

function getLocale(formData: FormData): string {
  const locale = formData.get("locale");
  return typeof locale === "string" && locale.length > 0 ? locale : "en";
}

async function getUserAgent(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("user-agent");
}

async function enforceAuthRateLimit({
  key,
  redirectTo,
  action,
  locale,
  identifier,
  identifierType,
}: {
  key: string;
  redirectTo: string;
  action: string;
  locale: string;
  identifier: string;
  identifierType: "ip" | "email";
}): Promise<void> {
  const requestId = await getRequestId();
  try {
    await rateLimitAuth(key);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      logWarn("auth_rate_limited", {
        requestId,
        action,
        locale,
        identifierType,
        identifier,
      });
      redirect(redirectTo);
    }
    logError("auth_rate_limit_unavailable", {
      requestId,
      action,
      locale,
      identifierType,
      identifier,
      failureMode: rateLimitConfig.auth.failureMode,
      errorName: error instanceof Error ? error.name : "unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    if (rateLimitConfig.auth.failureMode === "deny") {
      redirect(redirectTo);
    }
  }
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit({
    key: `ip:${ip}`,
    redirectTo: `/${locale}/auth/login?error=rate_limited`,
    action: "auth.sign_in",
    locale,
    identifier: ip,
    identifierType: "ip",
  });

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`/${locale}/auth/login?error=invalid_credentials`);
  }

  await enforceAuthRateLimit({
    key: `email:${email.toLowerCase()}`,
    redirectTo: `/${locale}/auth/login?error=rate_limited`,
    action: "auth.sign_in",
    locale,
    identifier: "redacted",
    identifierType: "email",
  });

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/${locale}/auth/login?error=invalid_credentials`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userAgent = await getUserAgent();
  if (user) {
    await logAuditEvent({
      userId: user.id,
      action: "auth.sign_in",
      ipAddress: ip,
      userAgent,
    });
  }

  redirect(getRedirectTarget(formData, `/${locale}/dashboard`));
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit({
    key: `ip:${ip}`,
    redirectTo: `/${locale}/auth/register?error=rate_limited`,
    action: "auth.sign_up",
    locale,
    identifier: ip,
    identifierType: "ip",
  });

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`/${locale}/auth/register?error=invalid_credentials`);
  }

  await enforceAuthRateLimit({
    key: `email:${email.toLowerCase()}`,
    redirectTo: `/${locale}/auth/register?error=rate_limited`,
    action: "auth.sign_up",
    locale,
    identifier: "redacted",
    identifierType: "email",
  });

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(locale, "/dashboard"),
    },
  });

  if (error) {
    const lowerMessage = error.message?.toLowerCase() ?? "";
    if (
      lowerMessage.includes("already registered") ||
      lowerMessage.includes("already exists")
    ) {
      redirect(`/${locale}/auth/register?error=email_already_registered`);
    }
    redirect(`/${locale}/auth/register?error=signup_failed`);
  }

  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId: null,
    action: "auth.sign_up",
    ipAddress: ip,
    userAgent,
    metadata: { email },
  });

  redirect(`/${locale}/auth/confirm`);
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  const ip = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId: null,
    action: "auth.sign_out",
    ipAddress: ip,
    userAgent,
  });

  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit({
    key: `ip:${ip}`,
    redirectTo: `/${locale}/auth/forgot?error=rate_limited`,
    action: "auth.password_reset",
    locale,
    identifier: ip,
    identifierType: "ip",
  });

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/forgot?error=invalid_email`);
  }

  await enforceAuthRateLimit({
    key: `email:${email.toLowerCase()}`,
    redirectTo: `/${locale}/auth/forgot?error=rate_limited`,
    action: "auth.password_reset",
    locale,
    identifier: "redacted",
    identifierType: "email",
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildAuthCallbackUrl(locale, "/auth/reset"),
  });

  if (error) {
    redirect(`/${locale}/auth/forgot?error=reset_failed`);
  }

  redirect(`/${locale}/auth/forgot?success=1`);
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password");
  const locale = getLocale(formData);

  if (typeof password !== "string" || password.length < 8) {
    redirect(`/${locale}/auth/reset?error=invalid_password`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/reset?error=invalid_session`);
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/${locale}/auth/reset?error=update_password_failed`);
  }

  redirect(`/${locale}/auth/reset?success=1`);
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get("email");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit({
    key: `ip:${ip}`,
    redirectTo: `/${locale}/auth/magic?error=rate_limited`,
    action: "auth.magic_link",
    locale,
    identifier: ip,
    identifierType: "ip",
  });

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/magic?error=invalid_email`);
  }

  await enforceAuthRateLimit({
    key: `email:${email.toLowerCase()}`,
    redirectTo: `/${locale}/auth/magic?error=rate_limited`,
    action: "auth.magic_link",
    locale,
    identifier: "redacted",
    identifierType: "email",
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(locale, "/dashboard"),
    },
  });

  if (error) {
    redirect(`/${locale}/auth/magic?error=magic_link_failed`);
  }

  redirect(`/${locale}/auth/magic?success=1`);
}

export async function resendVerificationEmail(formData: FormData) {
  const email = formData.get("email");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit({
    key: `ip:${ip}`,
    redirectTo: `/${locale}/auth/verify?error=rate_limited`,
    action: "auth.resend_verification",
    locale,
    identifier: ip,
    identifierType: "ip",
  });

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/verify?error=invalid_email`);
  }

  await enforceAuthRateLimit({
    key: `email:${email.toLowerCase()}`,
    redirectTo: `/${locale}/auth/verify?error=rate_limited`,
    action: "auth.resend_verification",
    locale,
    identifier: "redacted",
    identifierType: "email",
  });

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(locale, "/dashboard"),
    },
  });

  if (error) {
    redirect(`/${locale}/auth/verify?error=resend_failed`);
  }

  redirect(`/${locale}/auth/verify?success=1`);
}
