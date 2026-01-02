import { createAdminClient } from "@/lib/supabase/admin";

export type AuditLogEvent = {
  userId: string | null;
  action: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function logAuditEvent(event: AuditLogEvent) {
  const supabaseAdmin = createAdminClient();
  await supabaseAdmin.from("audit_logs").insert({
    user_id: event.userId,
    action: event.action,
    target_id: event.targetId ?? null,
    ip_address: event.ipAddress ?? null,
    user_agent: event.userAgent ?? null,
    metadata: event.metadata ?? null,
  });
}
