# Build Readiness Checkpoint

## Status

**BUILD READINESS: PASS CANDIDATE**

This repository is a generic Cursor Build Machine. This checkpoint becomes **PASS** only when the hardening pull request is merged after all repository-required checks succeed.

## Hardening Contract

1. **Fail-closed write scope**
   - Active Task may change only declared `allowed_write_paths` plus validated Finding/Evidence side effects.
   - Governance, CI, Sprint definitions and test tooling are protected during execution.

2. **PLANNED Sprint machine validation**
   - Backlog selection, AC/Test exact coverage, commands, skills and write paths are validated before activation.

3. **Task dependency enforcement**
   - `blocked_by` references/cycles are validated.
   - A dependent Task cannot become active until prerequisites are VERIFIED/CLOSED.

4. **Backlog ↔ Sprint lifecycle**
   - READY / SPRINTED / BLOCKED / DONE bindings must match the Sprint manifest.

5. **Evidence completion integrity**
   - REVIEW requires PASS Evidence for every mapped AC/Test and every required command.
   - VERIFIED/CLOSED additionally requires PASS Engineering/Semantic Review.

6. **Executable Test integrity / anti-cheat**
   - Mapped Test IDs must exist in executable tests before Product CI can pass.
   - `.skip/.todo/.only`, obvious fake assertions and TypeScript escape hatches are rejected.

7. **Activation / Product CI bootstrap**
   - Human Sprint Activation may be a control-only transition.
   - First real implementation change must provide a reproducible lockfile and then run task-aware Product CI.

8. **Engineering / Coding Quality**
   - Reviewer must PASS semantic drift, readability, maintainability, algorithmic complexity, performance risk, architecture boundary, type safety, error handling, duplication, security and test quality.
   - Static quality thresholds cover complexity, nesting, parameter count and function size.

## Role Boundary

```text
HUMAN
  Product / Governance authority
        ↓
ChatGPT = sole Planning Agent
        ↓
Human Sprint Activation
        ↓
Cursor = Execution / Test / Debug / Evidence / Review
```

Cursor does not create or redefine Sprint Tasks.

## Safe Default State

A fresh machine remains:

```text
active_baseline = null
CURRENT-SPRINT = HOLD
active_sprint = null
active_task = null
implementation_enabled = false
```

No product implementation is permitted until a locked Build Spec and Human-approved Sprint Activation exist.

## Checkpoint Rule

The final squash-merge commit for this hardening PR is the **Build Readiness PASS checkpoint** only if:

- CI Gate = PASS
- Governance Gate = PASS
- Governance Attack Dry-run = PASS
- CodeQL = PASS
- default safe HOLD state remains unchanged
