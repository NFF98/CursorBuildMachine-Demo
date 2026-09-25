# Deploy / CD

NodeFF Phase 1 deployment targets依 Design Current Truth：

- Web / static：Cloudflare Pages / CDN
- Edge / Serverless：Cloudflare Workers
- Durable DB：Supabase PostgreSQL

Deployment automation只能執行 approved Release Manifest。

## Environments

GitHub Environments：

- `staging`
- `production`

兩個 environment 使用相同 secret 名稱、不同值：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PAGES_PROJECT`
- `CLOUDFLARE_WORKER_NAME`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `DEPLOY_BASE_URL`

只需為該 Release 實際啟用的 target 提供相應 secrets。

## Automated Path

```text
REL-* promoted
→ Release Gate
→ Product CI
→ staging deployment
→ staging smoke
→ production deployment
→ production smoke
→ success

production smoke fail
→ Cloudflare rollback
→ rollback smoke / report
→ Release HOLD
```

Supabase DB migration不自動 reverse；Production migration必須 backward-compatible / expand-only。

Cloudflare deployment command輸出寫進 `.deploy-output/`；runtime rollback state寫進 `.release-state/`，兩者都不進 Git。
