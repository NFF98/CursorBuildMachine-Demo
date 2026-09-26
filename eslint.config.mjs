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
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    rules: {
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-params": ["error", 5],
      "max-lines-per-function": ["error", { max: 120, skipBlankLines: true, skipComments: true }]
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      globals,
      parserOptions: {
        onUnsupportedTypeScriptVersion: "error"
      }
    },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error"
    }
  }
);
