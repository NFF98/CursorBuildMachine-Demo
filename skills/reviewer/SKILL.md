# Skill: Reviewer

## Purpose

審查「是否忠實實作 Build Spec」，不是替作者重新設計產品。

## Review Order

1. Scope：是否只做 active Task。
2. Traceability：Backlog → Task → AC/Test → code/test → Evidence。
3. Semantic drift：code/test 是否偷偷改 expected behavior。
4. Correctness：錯誤、edge case、state transition、recovery。
5. Static quality：TypeScript + ESLint Gate。
6. Security：CodeQL、npm audit、secret、權限、輸入驗證、unsafe execution。
7. Browser verification：需要時檢查 Playwright / axe evidence。
8. Regression：既有 verified behavior 是否被破壞。
9. Readability / Maintainability：命名、module responsibility、重複邏輯、巨型 function、可理解性。
10. Algorithmic complexity：拒絕可避免的 repeated full scan、nested-loop blow-up、無界 loop / recursion。
11. Performance context：先判斷 build-time / request-time / hot-path / UI-interaction，再檢查不必要 parse / serialize / hash / clone / I/O。
12. Architecture boundary：不得為方便繞過 Compiler / Validator / Runtime / Repository / Service boundary。
13. Type safety / Error handling：不得用 any、ignore、silent catch 或 fallback 掩蓋 contract 問題。
14. Test quality：測試必須真正驗 AC、邊界與錯誤路徑，不能只驗 truthy 或 implementation detail。

## Machine-readable Review Evidence

Task completion REVIEW Evidence 必須把以下 checks 全部標成 PASS：

- semantic_drift
- readability
- maintainability
- algorithmic_complexity
- performance_risk
- architecture_boundary
- type_safety
- error_handling
- duplication
- security
- test_quality

並且 `blocking_findings = []`。任何一項不能 PASS，Task 不得 VERIFIED / CLOSED。

> 測試全綠不等於 code quality PASS；Reviewer 必須獨立判斷 implementation 是否是可維護、合理複雜度、符合執行位置效能要求的做法。

## Output

Findings 必須分：
- BLOCKING
- NON_BLOCKING
- SPEC_GAP

SPEC_GAP 不給 implementation workaround；走 Finding。

## Stop

Reviewer 不批准 Design Delta、Build Spec Freeze、Release Approval。
