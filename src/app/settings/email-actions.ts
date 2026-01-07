"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { routing, type AppLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { buildAuthCallbackUrl } from "@/lib/auth/callback";
import { logAuditEvent } from "@/lib/observability/audit";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";

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

async function getUserAgent(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("user-agent");
}

export async function requestEmailChange(formData: FormData) {
  const locale = getLocale(formData);
  const newEmail = formData.get("newEmail");

  if (typeof newEmail !== "string" || newEmail.trim().length === 0) {
    redirect(`/${locale}/settings?error=invalid_email#email`);
  }

  const { supabase, userId, email } = await requireUser(locale, "/settings");
  const normalizedNewEmail = newEmail.trim();

  if (email && normalizedNewEmail.toLowerCase() === email.toLowerCase()) {
    redirect(`/${locale}/settings?error=email_change_same#email`);
  }

  const { error } = await supabase.auth.updateUser(
    { email: normalizedNewEmail },
    {
      emailRedirectTo: buildAuthCallbackUrl(
        locale,
        "/settings?emailChange=1#email",
      ),
    },
  );

  if (error) {
    const lowerMessage = error.message?.toLowerCase() ?? "";
    if (
      lowerMessage.includes("already registered") ||
      lowerMessage.includes("already exists")
    ) {
      redirect(`/${locale}/settings?error=email_already_registered#email`);
    }
    redirect(`/${locale}/settings?error=email_change_failed#email`);
  }

  const ipAddress = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId,
    action: "account.email_change_requested",
    ipAddress,
    userAgent,
    metadata: { newEmail: normalizedNewEmail },
  });

  redirect(`/${locale}/settings?emailChangeRequested=1#email`);
}
