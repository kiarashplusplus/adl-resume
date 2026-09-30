import { defineConfig } from "vitest/config";

// Standalone config so tests don't load the app's Vite plugins.
export default defineConfig({
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
