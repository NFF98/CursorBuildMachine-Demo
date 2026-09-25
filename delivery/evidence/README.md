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
