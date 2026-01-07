import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/observability/audit";

type AccountDeletionAuditContext = {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestedAt: string;
  expiresAt: string;
};

export async function deleteAccountById(userId: string) {
  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw error;
  }
}

export async function performAccountDeletion({
  userId,
  ipAddress,
  userAgent,
  requestedAt,
  expiresAt,
}: AccountDeletionAuditContext) {
  await logAuditEvent({
    userId,
    action: "account.deletion_confirmed",
    targetId: userId,
    ipAddress,
    userAgent,
    metadata: { requestedAt, expiresAt },
  });

  await deleteAccountById(userId);
}
