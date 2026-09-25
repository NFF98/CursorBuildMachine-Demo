# CursorBuildMachine-Demo

**Generic Cursor Build Machine 的實驗 / regression / attack sandbox。**

這個 repo 專門用來測試 Build Machine 本身，不承載正式產品。

## Role

```text
ROLE = DEMO / SANDBOX
REAL_PRODUCT_INPUT = FORBIDDEN
PRODUCTION_RELEASE = FORBIDDEN
STATUS = READY_FOR_MACHINE_EXPERIMENTS
```

可在這裡安全測：

- Fake Build Spec
- Fake Backlog / Sprint / Task
- Bug → Fix → Evidence
- Finding / Design Delta
- Rebaseline
- Scope attacks
- Governance attacks
- Harness changes
- CI / CodeQL changes
- Release Gate simulation

Fake state 應優先使用 ephemeral fixture，測試後刪除，只留下 NON-CANONICAL report。

## Relationship

```text
Demo
  ↓ 驗證 machine change
Template
  ↓ 建立 project-specific Build repo
Real Project Build
```

**先 Demo 驗證，再更新 Template；不要拿正式產品 repo 當 Harness 實驗場。**

## Deployment profile

目前保留從已驗證 machine 繼承的 Cloudflare / Supabase deployment adapter，目的在測試 Release machinery。這不代表所有使用 Template 的專案都必須採用該 stack。

## Provenance

Derived from NFF98/NFFBuild@2187ed3ee365bc7b1f50c7196012fe5080583d71. Product-specific history was intentionally excluded.
