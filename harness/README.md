# CursorBuildMachine Harness

Harness 的工作是阻止 drift，不是替 Product 做決策。

`npm run gate` 驗證：

1. forbidden shadow directory；
2. locked baseline immutability；
3. baseline file inventory + SHA-256 aggregate integrity；
4. Acceptance registry count / stable IDs / active test mapping；
5. active baseline / Sprint / Task binding；
6. Task Acceptance/Test mapping 必須真的存在於 active baseline；
7. Task write-path allowlist；
8. Sprint BLOCKED 時禁止產品 code change；
9. Finding / Delta reference + escalation sanity；
10. 同 strategy 最多兩次失敗；
11. Build HOLD 時禁止 `src/` / `tests/` 產品 implementation。

GitHub Actions 在 PR 與 `main` push 執行相同 Gate。

Harness 能偵測違規；要在 server-side 阻止 direct merge / push，正式 Build 前仍需 GitHub branch protection + required status check。
