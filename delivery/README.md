# Delivery Operating Structure

本目錄控制「做什麼、何時做、怎麼證明完成」，但不定義產品真相。

```text
Locked Build Spec
→ Backlog
→ Sprint
→ Task
→ Implementation / Test
→ Evidence
→ Sprint Gate
→ Release Candidate
```

## Directories

- `backlog/`：由 Locked Build Spec + Acceptance 派生的 approved work queue。
- `sprints/`：當期 Sprint manifests / tasks / gate result。
- `findings/`：Build 異常 quarantine。
- `deltas/`：Finding 經治理後的受控變更。
- `evidence/`：Task/Test/Review/Artifact verification records。
- `reports/`：跨 Sprint / Gate summary。
- `templates/`：machine-readable templates。

## Hard Rule

Backlog、Sprint、Code、Test、Evidence 都不能改寫 Build Spec semantics。若需要新的產品決策，必須走 Finding → Design Delta → Product Working → User approval → Rebaseline。
