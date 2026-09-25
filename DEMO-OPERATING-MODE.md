# Demo Operating Mode

## Allowed

- 建立 fake baseline / backlog / sprint / evidence / delta。
- 故意觸發 gate failure。
- 修改 Harness 後做 regression。
- 跑 ephemeral full Fake Sprint。
- 測試新的 GitHub workflow / toolchain policy。

## Forbidden

- 不得把真實產品需求視為此 repo 的 Product Truth。
- 不得保存真實 Production secrets。
- 不得把 Demo 的 Build Spec promote 成正式產品 Build Spec。
- 不得直接從 Demo 發 Production release。

Machine change 若要成為正式 reusable 標準：

```text
Demo PASS
→ Human review
→ Template update
→ Template gates PASS
→ New project / controlled rollout
```
