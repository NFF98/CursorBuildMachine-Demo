import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/contract/**/*.{test,spec}.{ts,tsx}",
      "tests/behavior/**/*.{test,spec}.{ts,tsx}",
      "tests/api/**/*.{test,spec}.{ts,tsx}",
      "tests/runtime/**/*.{test,spec}.{ts,tsx}",
      "tests/state-machine/**/*.{test,spec}.{ts,tsx}",
      "tests/regression/**/*.{test,spec}.{ts,tsx}"
    ],
    exclude: [
      "tests/e2e/**",
      "tests/accessibility/**",
      "tests/responsive/**",
      "tests/visual/**"
    ],
    passWithNoTests: false,
    reporters: ["default"]
  }
});
