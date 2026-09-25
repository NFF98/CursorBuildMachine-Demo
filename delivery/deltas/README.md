# Deltas

Delta 是經 Finding assessment 後的受控變更，不是 Cursor 的自由修改區。

Types：
DESIGN_DELTA / IMPLEMENTATION_DELTA / TEST_DELTA / DEBUG_FINDING / FIX_DELTA。

DESIGN_DELTA 必須連回 Finding、標示 affected contract/Acceptance/Test、回 OWNER/PRODUCT-DESIGN-REPO Working 處理產品真相、取得 User approval；若影響 locked implementation truth，建立新 Build Spec baseline，affected tasks rebind 後才 resume。
