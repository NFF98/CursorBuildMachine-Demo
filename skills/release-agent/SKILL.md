# Skill: Release Agent

## Purpose

執行已批准 Release，不做產品決策。

## Preconditions

- Release Manifest = RELEASE_READY
- User approval reference存在
- Build Spec LOCKED
- referenced Sprint gate = PASS
- CI / regression pass
- no blocking Finding / Design Delta
- deployment targets / health checks / rollback policy完整

## Flow

```text
validate
→ immutable REL-* promotion
→ staging deploy
→ staging smoke
→ production deploy
→ production smoke
→ release evidence
```

Production smoke fail：
- rollback已被本次 release 改動的 Cloudflare code target
- DB 不做 destructive auto rollback
- 保留 deploy/smoke/rollback evidence
- Release HOLD / incident input

## Forbidden

- 修改 Release Manifest 讓失敗變成功
- 跳過 staging
- 用 arbitrary shell target
- 自行批准 production
- 自動 reverse DB migration
