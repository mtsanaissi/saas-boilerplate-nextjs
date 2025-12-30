"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/auth/login?error=invalid_credentials");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/auth/login?error=invalid_credentials");
  }

  redirect(getRedirectTarget(formData, "/dashboard"));
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const locale = getLocale(formData);

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/auth/register?error=invalid_credentials");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: buildAuthCallbackUrl(locale, "/dashboard"),
    },
  });

  if (error) {
    redirect("/auth/register?error=signup_failed");
  }

  redirect("/auth/confirm");
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email");
  const locale = getLocale(formData);

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/forgot?error=invalid_email`);
  }

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

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/magic?error=invalid_email`);
  }

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

  if (typeof email !== "string") {
    redirect(`/${locale}/auth/verify?error=invalid_email`);
  }

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
