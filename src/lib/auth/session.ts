type JwtPayload = {
  session_id?: string;
};

function decodeBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(padded, "base64").toString("utf-8");
    return decoded;
  } catch {
    return null;
  }
}

export function getSessionIdFromAccessToken(token: string | null | undefined) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) return null;
  try {
    const payload = JSON.parse(payloadRaw) as JwtPayload;
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}
