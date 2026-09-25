# Build Spec

Cursor implementation 的唯一產品輸入區。

Build Spec 不是新的 Design SSOT；它是從 `OWNER/PRODUCT-DESIGN-REPO/working/` 經 User 批准 Build Freeze Gate 產生的 immutable implementation snapshot。

```text
Product Working Current Truth
→ consistency / delta / acceptance / UI audit
→ User approval
→ Build Freeze
→ BS-P1-001 LOCKED
→ Sprint Activation
```

一旦 baseline merge 到 `main`：禁止修改、刪除、補檔、改 hash、或為了讓 implementation pass 而重寫 contract。

## Required Baseline Shape

```text
build-spec/baselines/BS-P1-001/
├─ manifest.json
├─ functions/
├─ shared/
├─ UI-UX/
└─ registries/
   └─ acceptance-test-registry.json
```

`manifest.json` 必須 inventory baseline 內除 manifest 本身外的所有檔案，記錄每個 SHA-256，並提供 aggregate `content_sha256`。Harness 會重新計算，避免 baseline 內容被偷偷替換。

若批准的 Design Delta 改變 implementation truth：

```text
BS-P1-001 remains immutable
→ upstream Working updated
→ User rebaseline approval
→ BS-P1-002 added
→ BS-P1-002 supersedes BS-P1-001
```

第一個 baseline 只有在 Product Working authority 清理、Delta 清帳、Acceptance/Test 完整、Function/Shared/Registry/UI cross-check 與 User 明確批准後才能建立。
