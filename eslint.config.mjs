import js from "@eslint/js";
import tseslint from "typescript-eslint";

const globals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly"
};

export default tseslint.config(
  {
    ignores: [
      "build-spec/**",
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      ".release-state/**",
      ".deploy-output/**"
    ]
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      sourceType: "module",
      globals
    }
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ["**/*.{ts,tsx,mts,cts}"]
  })),
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      globals,
      parserOptions: {
        onUnsupportedTypeScriptVersion: "error"
      }
    },
    rules: {
      "no-undef": "off"
    }
  }
);
