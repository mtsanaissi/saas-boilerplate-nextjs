import { NextResponse, type NextRequest } from "next/server";
import { requireUserInRoute } from "@/lib/auth/route-guards";
import { buildAccountExport } from "@/lib/account/export";
import { logAuditEvent } from "@/lib/observability/audit";
import { getClientIpFromRequest } from "@/lib/rate-limit/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = await requireUserInRoute(request);

  if ("response" in authResult) {
    return authResult.response;
  }

  const { supabase, userId, email } = authResult;

  const exportData = await buildAccountExport({
    supabase,
    userId,
    email,
  });

  const ipAddress = getClientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent");
  await logAuditEvent({
    userId,
    action: "data_export.downloaded",
    ipAddress,
    userAgent,
  });

  const body = JSON.stringify(exportData, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="account-export-${userId}.json"`,
    },
  });
}
