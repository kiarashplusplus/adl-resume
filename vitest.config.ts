import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Standalone config so tests don't load the app's Vite plugins.
export default defineConfig({
  resolve: {
    alias: { "cloudflare:email": fileURLToPath(new URL("./tests/stubs/cloudflare-email.ts", import.meta.url)) },
  },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
