# CursorBuildMachine Agent Skills

Skills 定義「Agent 應該怎麼完成一類工作」；Harness 定義「什麼不准做」。

```text
Structure = 工作放哪裡
Build Spec = 要做什麼
Sprint/Task = 現在做哪一小塊
Skill = 這一小塊應怎麼做
Harness = 不准越界
Evidence = 怎麼證明做完
```

Canonical registry：`skills/REGISTRY.json`

每個 active Task 的 `required_skills` 必須引用 registry 中存在的 Skill。Cursor 在開始 Task 前必須先讀對應 `SKILL.md`。

目前 Core Skills：
- task-planner
- implementer
- test-builder
- debugger
- reviewer
- ui-verifier
- db-migration
- release-agent

Skill 不可授權超出 Task `allowed_write_paths` 的寫入，也不可授權產品決策。
