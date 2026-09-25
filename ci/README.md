# CI Contract

CI 驗證 implementation；不重寫產品要求。

當 `build-spec/CURRENT.json.implementation_enabled=false` 時，Product CI 保持 HOLD 並只跑 repository governance gates。

一旦 implementation enable，以下 npm scripts 都必須存在並成功：

- `check:types`
- `check:lint`
- `test:unit`
- `test:contract`
- `test:regression`
- `build`

可再新增 state-machine / runtime / accessibility / visual / e2e，但不得刪除 required baseline 以讓 CI pass。
