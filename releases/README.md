# Releases

Release 是 implementation 的部署批准，不是新的 Product SSOT。

## Lifecycle

```text
locked Build Spec
→ closed Sprint(s)
→ passing CI / regression
→ Release Manifest
→ User Release Approval
→ promote REL-* tag
→ automated staging deploy
→ staging smoke
→ automated production deploy
→ production smoke
→ RELEASED or automatic code rollback
```

Release ID：`REL-P<phase>-<NNN>`，例如 `REL-P1-001`。

## Hard Rules

1. Release 必須引用 locked Build Spec。
2. 所有引用 Sprint 必須有 `gate-result.json = PASS`。
3. Release 必須記 source implementation commit。
4. User approval 必須有 decision reference。
5. Manifest 只允許：`CLOUDFLARE_PAGES`、`CLOUDFLARE_WORKER`、`SUPABASE_MIGRATIONS`。
6. Manifest 不允許 shell / command 欄位。
7. Production DB migration 只允許 `FORWARD_COMPATIBLE_EXPAND_ONLY`。
8. DB 不自動 rollback。
9. Production Cloudflare deploy smoke fail → rollback workflow。
10. Release tag 只由 Promote Release workflow 建立。

目前 `releases/CURRENT.json` 為 HOLD；第一個 approved Release 前不會部署。
