"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import { rateLimitAuth } from "@/lib/rate-limit/server";

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

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function buildAuthCallbackUrl(locale: string, nextPath: string): string {
  const callbackUrl = new URL("/auth/callback", getAppUrl());
  callbackUrl.searchParams.set("next", `/${locale}${nextPath}`);
  return callbackUrl.toString();
}

async function enforceAuthRateLimit(
  key: string,
  redirectTo: string,
): Promise<void> {
  try {
    await rateLimitAuth(key);
  } catch (error) {
    if (error instanceof Error && error.name === "rate_limited") {
      redirect(redirectTo);
    }
    console.error("Rate limit check failed", error);
  }
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit(
    `ip:${ip}`,
    `/${locale}/auth/login?error=rate_limited`,
  );

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`/${locale}/auth/login?error=invalid_credentials`);
  }

  await enforceAuthRateLimit(
    `email:${email.toLowerCase()}`,
    `/${locale}/auth/login?error=rate_limited`,
  );

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/${locale}/auth/login?error=invalid_credentials`);
  }

  redirect(getRedirectTarget(formData, `/${locale}/dashboard`));
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit(
    `ip:${ip}`,
    `/${locale}/auth/register?error=rate_limited`,
  );

  if (typeof email !== "string" || typeof password !== "string") {
    redirect(`/${locale}/auth/register?error=invalid_credentials`);
  }

  await enforceAuthRateLimit(
    `email:${email.toLowerCase()}`,
    `/${locale}/auth/register?error=rate_limited`,
  );

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

  redirect(`/${locale}/auth/confirm`);
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");
  const locale = getLocale(formData);
  const ip = await getClientIpFromHeaders();

  await enforceAuthRateLimit(
    `ip:${ip}`,
    `/${locale}/auth/forgot?error=rate_limited`,
  );

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/forgot?error=invalid_email`);
  }

  await enforceAuthRateLimit(
    `email:${email.toLowerCase()}`,
    `/${locale}/auth/forgot?error=rate_limited`,
  );

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

  await enforceAuthRateLimit(
    `ip:${ip}`,
    `/${locale}/auth/magic?error=rate_limited`,
  );

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/magic?error=invalid_email`);
  }

  await enforceAuthRateLimit(
    `email:${email.toLowerCase()}`,
    `/${locale}/auth/magic?error=rate_limited`,
  );

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

  await enforceAuthRateLimit(
    `ip:${ip}`,
    `/${locale}/auth/verify?error=rate_limited`,
  );

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/verify?error=invalid_email`);
  }

  await enforceAuthRateLimit(
    `email:${email.toLowerCase()}`,
    `/${locale}/auth/verify?error=rate_limited`,
  );

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
