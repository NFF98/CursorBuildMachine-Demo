# CursorBuildMachine Agent Contract

本檔是所有 coding agent / Cursor 的 repository-level operating contract。

## Absolute Rules

- Product truth 不在本 Repo 產生；來源是已批准的 locked Build Spec。
- 未有 active locked Build Spec + active Sprint + active Task 時，不得做產品 implementation。
- 不得修改 `build-spec/baselines/<existing-baseline>/`。
- 不得建立 `working/`、`spec/`、`execution/` shadow trees。
- 不得把 code behavior、library limitation 或「比較好做」反推成 product truth。
- 發現 gap 先記錄 Finding；受影響 Task 必須 BLOCKED。
- 同一 implementation strategy 失敗兩次，停止 retry loop，建立 Finding。
- Sprint 外工作不得混入當前 Sprint commit。
- Cursor 不得自行建立、批准或 promote Production Release。
- Production deployment 只能由 approved Release workflow 執行。

## Mandatory Read Order

```text
build-spec/CURRENT.json
→ delivery/backlog/QUEUE.json
→ delivery/CURRENT-SPRINT.json
→ active Sprint manifest/tasks
→ active Build Spec + mapped contracts
→ skills/REGISTRY.json
→ every SKILL.md in active Task required_skills
→ mapped tests
```

## Skill Rule

Skill = method，不是 permission。

- Task 的 `required_skills` 必須來自 `skills/REGISTRY.json`。
- 使用 Skill 仍受 `allowed_write_paths`、Build Spec、Sprint scope、Harness 約束。
- Skill 不得授權 Product decision。
- 需要未註冊 Skill / 未定產品行為時停止並升 governance。

## Fast Loop

```text
Implement → Test → Debug → Fix → Re-test → Evidence → Review
```

只允許在不改變 locked contract semantics 時自動進行。

## Slow Loop

```text
Spec ambiguity / Design issue / Build blocker
→ Finding
→ Quarantine affected task
→ Human assessment
→ Product Working change if approved
→ User approval
→ New Build Spec
→ Backlog/Task rebind
→ Resume
```

## Release Loop

```text
Closed Sprint → Release Manifest → Human Approval
→ Staging → Smoke → Production → Smoke → PASS / code rollback
```
