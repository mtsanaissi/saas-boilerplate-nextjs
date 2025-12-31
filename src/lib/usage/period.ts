function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getCurrentPeriodRange(now: Date = new Date()) {
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return {
    periodStart: toDateString(start),
    periodEnd: toDateString(end),
  };
}
