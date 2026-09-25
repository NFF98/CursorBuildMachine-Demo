# CursorBuildMachine Operating Model

## 1. Authority

```text
NodeFF/working = Design Current Truth
build-spec     = frozen implementation truth for a build baseline
backlog        = work derived from that baseline
sprint/task    = selected execution scope
src/tests      = implementation
evidence       = proof of completion
release        = approved deployment control
```

Code、tests、Backlog、Cursor opinion、library limitation 都不能反向覆蓋產品真相。

## 2. Build Enable Sequence

```text
Product Working clean
→ Build Freeze audit
→ User approves BS-*
→ generate Backlog from BS-* + AC registry
→ Backlog Gate
→ Sprint plan from READY backlog
→ User approves Sprint activation
→ exactly one Active Task
→ required Agent Skill(s)
→ Cursor automation
→ Evidence
→ Sprint Close
→ Release
```

## 3. Backlog Rule

Backlog 是 Build Spec 的 projection，不是新的需求層。

- 每個 item 必須 map 到 active baseline 中真實存在的 Acceptance/Test。
- 不得新增未存在於 Build Spec 的產品行為。
- `SPRINTED` 必須指向存在的 Sprint。
- Sprint Task 必須反向引用 Backlog Item。
- Build Spec Rebaseline 後，舊 baseline 的未完成 item 不得偷偷沿用；必須重新 bind / regenerate。

## 4. Sprint / Task

同時只允許一個 active Sprint、一個 active Task。

Task 必須固定：
- backlog item(s)
- Build Spec ID
- AC ↔ Test mapping
- allowed_write_paths
- required commands
- required skills
- completion evidence
- product_decision_allowed = false

## 5. Task Close

`VERIFIED/CLOSED` Task 必須有 Evidence record，且 Evidence 必須指回相同 Build Spec / Sprint / Task。

## 6. Fast Loop

```text
IMPLEMENTATION_BUG / TEST_BUG
→ fix without changing contract semantics
→ mapped tests
→ required commands
→ evidence
→ verify
```

同策略最多失敗兩次。

## 7. Slow Loop

```text
SPEC_AMBIGUITY / DESIGN_DELTA_CANDIDATE / contract-affecting BUILD_BLOCKER
→ Task BLOCKED
→ Finding
→ Human governance
→ Product Working if needed
→ User approval
→ new BS-*
→ regenerate/rebind affected Backlog + Task
→ resume
```

## 8. Release

只有 Closed Sprint + PASS gate-result + approved Release Manifest 才能進 Staging / Production。
