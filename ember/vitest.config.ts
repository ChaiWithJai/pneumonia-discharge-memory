import { defineConfig } from "vitest/config";

// The engine and loops are pure TypeScript; tests run in node with no DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
  },
});
