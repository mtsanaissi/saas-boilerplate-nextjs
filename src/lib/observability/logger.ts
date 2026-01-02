type LogContext = Record<string, unknown>;
type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: LogLevel[] = ["debug", "info", "warn", "error"];

function resolveLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.toLowerCase();
  if (value === "debug" || value === "info" || value === "warn" || value === "error") {
    return value;
  }
  return "info";
}

const activeLevel = resolveLogLevel();

function shouldLog(level: LogLevel) {
  return levelOrder.indexOf(level) >= levelOrder.indexOf(activeLevel);
}

function formatLogEntry(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

export function logDebug(message: string, context?: LogContext) {
  if (!shouldLog("debug")) return;
  console.debug(formatLogEntry("debug", message, context));
}

export function logInfo(message: string, context?: LogContext) {
  if (!shouldLog("info")) return;
  console.info(formatLogEntry("info", message, context));
}

export function logWarn(message: string, context?: LogContext) {
  if (!shouldLog("warn")) return;
  console.warn(formatLogEntry("warn", message, context));
}

export function logError(message: string, context?: LogContext) {
  if (!shouldLog("error")) return;
  console.error(formatLogEntry("error", message, context));
}
