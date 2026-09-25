# Generic Cursor Build Machine Readiness — 2026-09-25

> **NON-PRODUCT MACHINE RECORD**

```text
MACHINE_ROLE = DEMO_SANDBOX
STATUS = READY_FOR_MACHINE_EXPERIMENTS
PRODUCT_TRUTH = NONE
ACTIVE_BUILD_SPEC = null
IMPLEMENTATION_ENABLED = false
ACTIVE_SPRINT = null
ACTIVE_TASK = null
BACKLOG = HOLD / EMPTY
RELEASE = HOLD
```

本 repo 只用於 Fake Sprint、regression、attack 與 Harness 實驗；禁止承載正式產品 truth。

## Genericization verified

- Upstream Product Design repo 由 `harness/policy/repo-policy.json > design_source_repo` 設定。
- Build Spec baseline 的 `source_repo` 不再綁定任何特定產品 repo。
- Baseline validator 會以 policy 中的 design source 驗證。
- Sprint Activation transition-aware scope fix 已包含。
- Governance Attack Dry-run 包含合法 Activation PASS / 夾帶 governance edit FAIL 的 regression cases。
- Build Spec / Backlog / Sprint / Finding / Delta / Evidence / Release governance 保留。
- TypeScript / ESLint / Vitest / Playwright / axe / CodeQL / Dependabot toolchain 保留。
- 預設保持乾淨 HOLD；沒有正式產品輸入。

## Provenance

Derived from `NFF98/NFFBuild@2187ed3ee365bc7b1f50c7196012fe5080583d71`.

該來源 machine 在 extraction 前已完成：
- `CURSOR_AUTOMATION_SAFE = PASS`
- `OPERATING_E2E = PASS`
- Fake Sprint E2E PASS
- Fake data persisted = 0
- Governance Attack Dry-run 28/28 PASS

## Deployment profile

目前保留已驗證的 Cloudflare / Supabase deployment adapter 作為預設 profile。新專案若使用其他 stack，必須先替換或擴充 deployment adapter 與 Release validator，再跑 Demo / Attack / CI / CodeQL 驗證。

## GitHub repository settings

Repository 內容與 workflows 已準備完成；GitHub server-side Ruleset 必須另外套用與 NFFBuild 相同的 required checks / merge restrictions，因為這些設定不是 repo file。
