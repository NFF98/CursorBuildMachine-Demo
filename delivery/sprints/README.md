# Sprints

每個 Sprint 使用獨立目錄：
```text
delivery/sprints/SP-P1-001/
├─ manifest.json
├─ tasks.json
└─ gate-report.md
```

Sprint 必須由 locked Build Spec 派生。不得建立沒有 Acceptance/Test traceability 的正式 implementation task。

Task lifecycle：
`PLANNED → IN_PROGRESS → BLOCKED | REVIEW → VERIFIED → CLOSED`
