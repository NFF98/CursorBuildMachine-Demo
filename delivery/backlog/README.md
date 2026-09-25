# Build Backlog

Build Backlog 不是產品需求文件；它是 active Locked Build Spec 的可執行工作佇列。

Canonical queue：`delivery/backlog/QUEUE.json`

每筆 Backlog Item 必須：
- 來源 = `BUILD_SPEC`
- 綁定 active Build Spec ID
- 綁定 Function / contract scope
- 綁定至少一組 Acceptance ID ↔ Test ID
- 明確 dependencies / priority / status
- `product_decision_allowed = false`

Lifecycle：

`QUEUED → READY → SPRINTED → BLOCKED | DONE`

沒有 active Build Spec 時，QUEUE 必須是 HOLD 且 items = []。
