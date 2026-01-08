import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_ENV_FILES = [".env.local", ".env"];

function parseEnvValue(raw) {
  if (raw === undefined) return "";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvFile(contents) {
  const env = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length)
      : trimmed;
    const index = normalized.indexOf("=");
    if (index === -1) continue;
    const key = normalized.slice(0, index).trim();
    const value = parseEnvValue(normalized.slice(index + 1));
    if (!key) continue;
    env[key] = value;
  }
  return env;
}

export async function loadEnvFiles({
  cwd = process.cwd(),
  files = DEFAULT_ENV_FILES,
} = {}) {
  const loaded = [];
  for (const file of files) {
    const filePath = path.join(cwd, file);
    try {
      const contents = await fs.readFile(filePath, "utf8");
      const env = parseEnvFile(contents);
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
      loaded.push(file);
    } catch (error) {
      if (error && error.code === "ENOENT") continue;
      throw error;
    }
  }
  return loaded;
}

export function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export function isLocalSupabaseUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") return true;
    if (host === "host.docker.internal") return true;
    if (host.endsWith(".local")) return true;
    if (host.startsWith("127.")) return true;
    return false;
  } catch {
    return false;
  }
}
