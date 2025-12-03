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

  if (typeof email !== "string" || typeof password !== "string") {
    redirect("/auth/register?error=invalid_credentials");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
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
