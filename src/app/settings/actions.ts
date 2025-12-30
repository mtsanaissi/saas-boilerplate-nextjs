"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { routing, type AppLocale } from "@/i18n/routing";

const MAX_DISPLAY_NAME_LENGTH = 80;

function getLocale(formData: FormData): AppLocale {
  const locale = formData.get("locale");
  if (
    typeof locale === "string" &&
    routing.locales.includes(locale as AppLocale)
  ) {
    return locale as AppLocale;
  }

  return routing.defaultLocale;
}

function isValidPublicUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateProfile(formData: FormData) {
  const locale = getLocale(formData);
  const displayName = formData.get("displayName");
  const avatarUrl = formData.get("avatarUrl");
  const localePreference = formData.get("localePreference");

  if (typeof displayName !== "string") {
    redirect(`/${locale}/settings?error=invalid_profile`);
  }

  if (typeof localePreference !== "string") {
    redirect(`/${locale}/settings?error=invalid_profile`);
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length > MAX_DISPLAY_NAME_LENGTH) {
    redirect(`/${locale}/settings?error=invalid_profile`);
  }

  if (
    localePreference &&
    !routing.locales.includes(localePreference as AppLocale)
  ) {
    redirect(`/${locale}/settings?error=invalid_profile`);
  }

  let normalizedAvatarUrl: string | null = null;
  if (typeof avatarUrl === "string" && avatarUrl.trim().length > 0) {
    const trimmedUrl = avatarUrl.trim();
    if (!isValidPublicUrl(trimmedUrl)) {
      redirect(`/${locale}/settings?error=invalid_profile`);
    }
    normalizedAvatarUrl = trimmedUrl;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=/settings`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: trimmedName.length > 0 ? trimmedName : null,
      avatar_url: normalizedAvatarUrl,
      locale: localePreference,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/${locale}/settings?error=profile_update_failed`);
  }

  redirect(`/${locale}/settings?success=1`);
}
