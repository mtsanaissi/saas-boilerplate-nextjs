"use server";

import { redirect } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { logAuditEvent } from "@/lib/observability/audit";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import { headers } from "next/headers";

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

  const { supabase, userId } = await requireUser(locale, "/settings");

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: trimmedName.length > 0 ? trimmedName : null,
      avatar_url: normalizedAvatarUrl,
      locale: localePreference,
    })
    .eq("id", userId);

  if (error) {
    redirect(`/${locale}/settings?error=profile_update_failed`);
  }

  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");
  const ipAddress = await getClientIpFromHeaders();
  await logAuditEvent({
    userId,
    action: "profile.updated",
    ipAddress,
    userAgent,
    metadata: { displayName: trimmedName, localePreference },
  });

  redirect(`/${locale}/settings?success=1`);
}
