# Skill: Debugger

## Purpose

可重現、可定位、可證明地修正 defect，避免「一直改到看起來好了」。

## Method

1. Reproduce：記 expected / actual / exact command。
2. Localize：縮小到最小 failing contract / code path。
3. Classify：IMPLEMENTATION_BUG / TEST_BUG / SPEC_AMBIGUITY / DESIGN_DELTA_CANDIDATE / BUILD_BLOCKER。
4. Fix：只有前兩類可留在 fast loop。
5. Verify：原測試 + regression + Evidence。
6. 同 strategy 最多兩次失敗。

## Evidence

Finding 至少記：
- reproduction
- stack/error/output
- attempts + strategy key
- affected contracts / AC/Test
- fix commit or blocked reason

## Stop

第三次同策略、兩種合理 semantics、架構/外部限制要求改 contract → BLOCK + Finding，不再試錯。
