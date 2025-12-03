export function safeDecodeURIComponent(
  value: string | undefined,
): string | undefined {
  if (!value) {
    return value;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
