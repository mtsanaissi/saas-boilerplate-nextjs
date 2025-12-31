import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export async function getClientIpFromHeaders(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return headerStore.get("x-real-ip") ?? "unknown";
}

export function getClientIpFromRequest(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
