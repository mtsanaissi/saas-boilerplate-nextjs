import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode ?? "test", rootDir, "");
  Object.assign(process.env, env);

  return {
    test: {
      environment: "node",
      globals: true,
    },
    resolve: {
      alias: {
        "@": `${rootDir}src`,
      },
    },
  };
});
