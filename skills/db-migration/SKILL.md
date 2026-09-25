# Skill: DB Migration

## Purpose

依 Locked Data/API contract 建立安全、可部署、forward-compatible 的 PostgreSQL migration。

## Rules

1. Migration 只能實作已批准 schema semantics。
2. Production-capable migration 採 expand-only / backward-compatible。
3. 不在同一 Release 直接 destructive rename/drop active field/table。
4. 先 add/backfill/dual-read-write，再由後續 approved Release 清理。
5. migration 必須 deterministic、idempotency boundary明確。
6. secrets / production credentials 不進 repo。
7. migration 必須有 contract / integration verification。

## Placement

Migration code：`supabase/migrations/`，且必須在 active Task allowed_write_paths。

## Stop

資料遺失風險、不可 backward-compatible change、需要人工 data repair、contract 未定 → BLOCK + Finding / Human Gate。
