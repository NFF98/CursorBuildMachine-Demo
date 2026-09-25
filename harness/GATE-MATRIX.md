# Harness Gate Matrix

| Area | Automation Level | Gate / Tool |
|---|---|---|
| Forbidden shadow SSOT directories | FULL AUTO | Harness |
| Locked baseline file/hash integrity | FULL AUTO | Harness |
| Old baseline mutation | FULL AUTO | Harness |
| Toolchain version/config drift | FULL AUTO | Toolchain Gate |
| Acceptance ID/Test ID existence + duplicates | FULL AUTO | Harness |
| Backlog ↔ Build Spec binding | FULL AUTO | Backlog Gate |
| Sprint ↔ Build Spec binding | FULL AUTO | Sprint Gate |
| One active Task + write-path scope | FULL AUTO | Scope Gate |
| Type correctness | FULL AUTO | TypeScript |
| Static code quality | FULL AUTO | ESLint |
| Unit / contract / runtime deterministic tests | FULL AUTO | Vitest |
| Real browser E2E | FULL AUTO before release | Playwright |
| Responsive checks | FULL AUTO + human UX where material | Playwright |
| Accessibility | FULL AUTO + human UX where material | Playwright + axe |
| Dependency vulnerability | FULL AUTO | npm audit + Dependabot |
| SAST | FULL AUTO | CodeQL |
| Finding/Delta schema + references | FULL AUTO | Harness |
| Two-attempt retry ceiling | FULL AUTO | Harness |
| Visual regression | SEMI AUTO | Playwright screenshot + human materiality review |
| Implementation ↔ Build Spec semantic drift | SEMI AUTO | traceability + human semantic review |
| Product behavior choice | HUMAN ONLY | User / governance |
| DESIGN_DELTA approval | HUMAN ONLY | User |
| Build Spec Freeze / Rebaseline | HUMAN ONLY | User |
| Material visual change | HUMAN ONLY | User |
| Public API / Data / Security / Runtime contract change | HUMAN ONLY | User |
| Sprint Activation / Sprint Close | HUMAN GATE | User / governance |
| Production Release approval | HUMAN GATE | User / governance |
