# Skill: Implementer

## Purpose

依 active Task 與 Locked Build Spec 做最小 implementation，不產生產品決策。

## Read

1. active Task
2. required contract sections
3. mapped Acceptance/Test
4. allowed_write_paths
5. relevant existing code only

## Method

1. 先確認 `npm run gate` 可執行。
2. 只修改 Task allowlist 內檔案。
3. 優先最小 patch，不做無關 refactor。
4. 不改 AC/Test expected semantics 來配合 code。
5. 完成後跑 required_commands + mapped tests。
6. 建立 Evidence reference。
7. 以 execution context 檢查複雜度與 performance：避免可避免的 nested loops、重複 full scan、重複 parse/serialize/hash、無界 loop/recursion、大物件不必要 clone。
8. 保持 module responsibility / dependency direction；不得為了快完成 Task bypass approved architecture boundary。

## Forbidden

- 修改 locked Build Spec。
- 擴張 Sprint scope。
- 以 library limitation 重解產品行為。
- 為了讓 test pass 刪除 requirement。
- 在同一策略失敗超過兩次後繼續 retry。
- 用 any / @ts-ignore / @ts-nocheck / blanket eslint-disable 掩蓋 type/quality 問題。
- 用「資料量現在很小」合理化明顯可避免的 O(n²)/O(n³) 或 repeated work。

## Stop

Spec ambiguity / contract-affecting blocker → Debugger + Finding；Task BLOCKED。
