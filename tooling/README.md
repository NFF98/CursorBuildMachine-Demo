# CursorBuildMachine Toolchain

這裡記錄 Build Tooling 的固定角色與版本。工具必須服務 AC → Test → Evidence → Gate，不因「流行」而增加。

## Installed / Integrated

| Tool | Role | Gate |
|---|---|---|
| TypeScript 6.0.3 | compile-time type safety | `check:types` |
| ESLint 10.11.0 + typescript-eslint 8.70.1 | static correctness / code quality | `check:lint` |
| Vitest 5.0.1 | deterministic unit / contract / behavior / API / runtime / state / regression | matching test scripts |
| Playwright 1.63.0 | real-browser E2E / responsive / visual | browser / release gate |
| @axe-core/playwright 4.13.0 | accessibility inside real browser tests | `test:a11y` |
| GitHub CodeQL v4 | SAST / code scanning | GitHub security workflow |
| Dependabot | dependency + GitHub Actions updates | PR workflow |
| npm audit | dependency vulnerability gate | `security:audit` |

## Compatibility Decision

TypeScript 7.x 暫不採用。Current `typescript-eslint` 官方支援 TypeScript `>=4.8.4 <6.1.0`；因此固定 TypeScript 6.0.3，等 lint ecosystem 正式支援再升級。

## Deliberately NOT installed now

- Cypress：和 Playwright 重疊；不需要第二套 E2E runner。
- Jest：和 Vitest 重疊；不需要第二套 deterministic test runner。
- Lighthouse：有價值，但屬 performance gate，等真實 App / bundle / URL 後加入。
- Load testing：等 API traffic model / SLO 定義後加入。
- Mutation testing：成本高，Phase 1 先用 Acceptance + regression coverage。
- 第二套 accessibility runner：axe 已嵌入 Playwright，不重複。

## Lockfile

正式 implementation enable 前必須產生並 commit `package-lock.json`。沒有 lockfile，Product CI 必須 FAIL；Release workflow 使用 `npm ci`，所以無法繞過 reproducible dependency lock。
