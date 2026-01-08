import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("db-seed dry run", () => {
  it("exits successfully", async () => {
    const { stdout } = await execFileAsync(
      "node",
      ["scripts/db-seed.mjs", "--dry-run"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        },
      },
    );

    expect(stdout).toContain("DRY RUN");
  });
});
