# Evidence

Task 不能只因為「Cursor 說完成了」而關閉。

每筆 Evidence 使用獨立 JSON：

`EV-<SPRINT>-<TASK>-<NNN>.json`

Evidence kinds：
- TEST_RESULT
- COMMAND_RESULT
- REVIEW
- SCREENSHOT
- VISUAL_DIFF
- ACCESSIBILITY
- BUILD_ARTIFACT
- DEPLOYMENT
- RUNTIME_TRACE

Evidence 必須綁定 Build Spec、Sprint、Task，並提供可追蹤 locator；檔案型證據可加 SHA-256。


## Completion Rule

Task 進入 REVIEW 前必須有：
- 每一組 mapped AC ↔ Test 的 PASS `TEST_RESULT`；
- 每一個 Task required command + global implementation quality command 的 PASS `COMMAND_RESULT`。

Task 進入 VERIFIED / CLOSED 前，另外必須有 PASS `REVIEW` Evidence，且 Engineering Quality / Semantic Drift checks 全部 PASS、`blocking_findings=[]`。

Evidence 必須記錄被驗證的 `source_commit`。FAIL / INFO Evidence 可以保留歷史，但不能拿來滿足完成條件。
