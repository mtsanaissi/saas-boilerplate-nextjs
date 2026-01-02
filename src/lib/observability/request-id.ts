import { headers } from "next/headers";
import { randomUUID } from "crypto";

export async function getRequestId(): Promise<string> {
  const headerStore = await headers();
  const existing = headerStore.get("x-request-id");
  return existing ?? randomUUID();
}
