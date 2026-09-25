# Skill: Test Builder

## Purpose

把 Locked Acceptance/Test mapping 轉成可執行測試；Test 驗證 contract，不重新定義 contract。

## Read

- active baseline Acceptance/Test registry
- relevant Function/shared contract
- active Task acceptance_links
- existing tests in matching family
- `tooling/TOOLCHAIN.json`

## Tool Routing

- unit / contract / behavior / API / runtime / state-machine / regression → **Vitest**
- real browser E2E / responsive / visual → **Playwright**
- accessibility → **Playwright + @axe-core/playwright**
- type contract → **TypeScript**
- static code correctness → **ESLint**
- security finding → **CodeQL / npm audit / Dependabot evidence**

Do not introduce Jest or Cypress for the same role without an approved Toolchain change.

## Placement

- unit → `tests/unit/`
- schema/contract → `tests/contract/`
- function behavior → `tests/behavior/`
- API → `tests/api/`
- runtime → `tests/runtime/`
- state transition → `tests/state-machine/`
- browser E2E → `tests/e2e/`
- visual → `tests/visual/`
- responsive → `tests/responsive/`
- accessibility → `tests/accessibility/`
- regression → `tests/regression/`

## Method

1. 每個 mapped Test ID 必須能追到 Acceptance ID。
2. 測正常、邊界、錯誤/Recovery；以 contract 為準。
3. deterministic 能自動化就不得降成純 manual。
4. 視覺類 machine diff 必須保留 human materiality review。
5. Test 失敗先判斷 implementation bug / test bug / contract gap。

## Stop

Expected behavior 不明確時，不自行補 expected value；開 SPEC_AMBIGUITY Finding。
