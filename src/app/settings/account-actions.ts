"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { routing, type AppLocale } from "@/i18n/routing";
import { requireUser } from "@/lib/auth/guards";
import { performAccountDeletion } from "@/lib/account/deletion";
import { logAuditEvent } from "@/lib/observability/audit";
import { getClientIpFromHeaders } from "@/lib/rate-limit/headers";
import type { AccountDeletionRequest } from "@/types/security";

const DELETION_REQUEST_TTL_HOURS = 24;

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

export async function requestAccountDeletion(formData: FormData) {
  const locale = getLocale(formData);
  const { supabase, userId } = await requireUser(locale, "/settings");

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + DELETION_REQUEST_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const token = randomUUID();

  const { error } = await supabase
    .from("account_deletion_requests")
    .upsert({
      user_id: userId,
      token,
      requested_at: now.toISOString(),
      expires_at: expiresAt,
      confirmed_at: null,
    })
    .select()
    .maybeSingle();

  if (error) {
    redirect(`/${locale}/settings?error=deletion_request_failed#account`);
  }

  const ipAddress = await getClientIpFromHeaders();
  const userAgent = await getUserAgent();
  await logAuditEvent({
    userId,
    action: "account.deletion_requested",
    targetId: userId,
    ipAddress,
    userAgent,
    metadata: { expiresAt },
  });

  redirect(`/${locale}/settings?accountDeletionRequested=1#account`);
}

export async function confirmAccountDeletion(formData: FormData) {
  const locale = getLocale(formData);
  const confirmation = formData.get("confirmation");
  const token = formData.get("token");

  if (typeof confirmation !== "string" || typeof token !== "string") {
    redirect(
      `/${locale}/settings?error=deletion_confirmation_required#account`,
    );
  }

  const t = await getTranslations({ locale, namespace: "settings" });
  const requiredPhrase = t("deletionConfirmPhrase");

  if (confirmation.trim() !== requiredPhrase) {
    redirect(
      `/${locale}/settings?error=deletion_confirmation_mismatch#account`,
    );
  }

  const { supabase, userId } = await requireUser(locale, "/settings");

  const { data: request } = await supabase
    .from("account_deletion_requests")
    .select("user_id, token, requested_at, expires_at, confirmed_at")
    .eq("user_id", userId)
    .maybeSingle<AccountDeletionRequest>();

  if (!request || request.token !== token) {
    redirect(`/${locale}/settings?error=deletion_request_invalid#account`);
  }

  const now = new Date();
  const expiresAt = new Date(request.expires_at);

  if (expiresAt.getTime() <= now.getTime()) {
    redirect(`/${locale}/settings?error=deletion_request_expired#account`);
  }

  await supabase
    .from("account_deletion_requests")
    .update({ confirmed_at: now.toISOString() })
    .eq("user_id", userId);

  try {
    const ipAddress = await getClientIpFromHeaders();
    const userAgent = await getUserAgent();
    await performAccountDeletion({
      userId,
      ipAddress,
      userAgent,
      requestedAt: request.requested_at,
      expiresAt: request.expires_at,
    });
  } catch {
    redirect(`/${locale}/settings?error=deletion_confirm_failed#account`);
  }

  redirect(`/${locale}/goodbye`);
}
