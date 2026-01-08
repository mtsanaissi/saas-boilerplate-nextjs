import { spawn } from "node:child_process";
import { isLocalSupabaseUrl, loadEnvFiles } from "./lib/env.mjs";

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/db-reset.mjs",
      "  node scripts/db-reset.mjs --seed",
      "  node scripts/db-reset.mjs --dry-run",
      "  node scripts/db-reset.mjs --force",
      "",
      "Resets the local Supabase database to a clean state.",
      "--seed runs db-seed after reset.",
      "--dry-run prints the plan without changing data.",
      "--force allows non-local Supabase URLs.",
    ].join("\n"),
  );
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--help") || args.has("-h")) {
    usage();
    return;
  }

  const dryRun = args.has("--dry-run");
  const withSeed = args.has("--seed");
  const force = args.has("--force");

  await loadEnvFiles();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  if (!dryRun && !force && supabaseUrl && !isLocalSupabaseUrl(supabaseUrl)) {
    throw new Error(
      `Refusing to reset non-local Supabase URL: ${supabaseUrl}. Use --force to override.`,
    );
  }

  if (dryRun) {
    console.log("DRY RUN: No changes will be applied.");
    console.log("Reset plan:");
    console.log("- pnpm dlx supabase db reset");
    if (withSeed) {
      console.log("- node scripts/db-seed.mjs");
    }
    return;
  }

  await runCommand("pnpm", ["dlx", "supabase", "db", "reset"]);
  if (withSeed) {
    await runCommand("node", ["scripts/db-seed.mjs"]);
  }
}

main().catch((error) => {
  console.error("Reset failed:", error?.message ?? error);
  process.exitCode = 1;
});
