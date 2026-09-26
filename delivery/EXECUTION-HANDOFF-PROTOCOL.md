# CursorBuildMachine Execution Handoff Protocol

> Canonical Current Truth for Human / ChatGPT / Cursor execution collaboration.
>
> Scope: execution handoff, Task completion reporting, review outcomes, manual actions, secret handling, Product/Spec gap escalation, and execution hard-stop behavior.
>
> This document does **not** redefine Product truth, Build Spec, Acceptance, Sprint scope, or Task scope.

## 1. Purpose

This protocol defines how the three execution roles cooperate after Build planning is ready:

```text
Human = Product / Governance / External Authority
ChatGPT = Planning / Audit / Translation Layer
Cursor = Execution Engine
```

Chat transcripts are discussion context. Git commits / PRs are historical evidence. This file is the canonical current execution-collaboration rule.

## 2. Authority Boundary

### HUMAN

Human is the authority for:

- Product truth and Product decisions
- Governance approval
- Sprint Activation
- Product / UX / behavior choices
- External platform accounts and permissions
- Secrets and production credentials
- Sprint Close
- Release Approval

Human does not need to review every line of code. Human intervenes when a decision or external action actually requires Human authority.

### ChatGPT

ChatGPT is the sole Planning Agent and execution auditor for this operating model.

Responsibilities:

- Sprint / Task planning before activation
- Task scope audit
- Code and architecture review
- AC/Test mapping audit
- Engineering quality audit
- Test-quality and fake-green audit
- Evidence audit
- Semantic-drift audit
- Cursor instruction generation
- Technical-to-Human translation
- Manual Action triage
- Product / Spec gap triage
- Next-Task selection according to the approved Sprint dependency graph

ChatGPT does not invent Product decisions or silently modify locked contract semantics.

### Cursor

Cursor is the execution engine.

Responsibilities:

- Implement the active Task
- Build mapped executable tests
- Run required commands
- Debug and fix implementation issues
- Create Evidence
- Create Findings when required
- Perform assigned review work

Cursor must not:

- change Product requirements
- expand Task scope
- change locked Build Spec
- change Acceptance semantics
- re-plan the Sprint
- decide Product ambiguity
- skip Task dependencies
- self-authorize Production or external-platform changes

## 3. Execution Preconditions

Product implementation is legal only when all machine and Human activation conditions are satisfied.

Before Human Sprint Activation:

- Sprint remains HOLD / PLANNED
- no active Task exists
- `implementation_enabled=false`
- Product implementation is forbidden

Activation is a control-state transition only. The Activation PR must not contain Product code.

Activation must pass the repository's required governance checks before merge. In the standard Build Machine these include:

```text
CI Gate
Governance Gate
Governance Attack Dry-run
CodeQL
```

After Activation is merged:

- exactly one Sprint may be active
- exactly one Task may be active
- Cursor receives only that active Task as execution scope
- locked Build Spec + active Task + mapped contracts remain the execution truth

Cursor must never treat the entire Sprint, Backlog, or Build Spec as free implementation scope.

## 4. Cursor Task Completion Handoff

When Cursor finishes a Task attempt, Cursor must provide:

```text
Task ID
PR number
commit SHA
changed files
AC/Test covered
commands executed
test results
Evidence created
Findings created
manual actions required
known risks / remaining issues
```

Preferred Human handoff sentence:

```text
Txxx Cursor 做完了，PR #XX，請驗收。
```

Human does not need to paste long Cursor output into ChatGPT when the PR is available in GitHub.

## 5. ChatGPT Verification Rule

ChatGPT must re-read GitHub and independently verify the PR. Cursor's summary is not proof.

Minimum review:

1. Task scope was followed.
2. No undeclared work was added.
3. Allowed write paths were respected.
4. AC/Test mapping is correct.
5. Executable tests actually verify mapped Acceptance semantics.
6. No fake-green mechanism exists.
7. Error and boundary cases are handled.
8. Code is readable.
9. Duplication is reasonable.
10. Complexity is reasonable.
11. Performance matches the execution context.
12. Architecture dependency direction remains valid.
13. Type safety is maintained.
14. Security boundaries are preserved.
15. Evidence is complete.
16. Reviewer Quality is PASS.
17. No Product / Spec semantic drift occurred.

Task completion is never accepted solely because Cursor says "done" or tests are green.

## 6. Allowed Review Outcomes

ChatGPT returns exactly one execution outcome.

### PASS

Use when implementation, tests, quality, Evidence, and semantics all pass.

```text
PASS
→ Task may proceed to VERIFIED / CLOSED
→ prepare the next dependency-legal Task
```

### CURSOR_FIX

Use for engineering defects that do not require a Human Product decision.

Examples:

- missing or weak tests
- type-safety issue
- architecture violation
- missing error handling
- avoidable duplication
- bad complexity
- Evidence incomplete
- fake-green or insufficient assertions

ChatGPT must return a precise fix instruction scoped to the same PR / Task. Cursor must not expand scope or change Build Spec / Acceptance.

### HUMAN_REVIEW_REQUIRED

Use only when a real Product / UX / behavior choice requires Human authority.

Examples:

- user-visible behavior choice
- UX tradeoff
- visual comparison
- user-flow difference
- business-rule choice

ChatGPT must translate the issue into plain language, present concrete alternatives and tradeoffs, and identify what the locked contract does or does not decide.

### HUMAN_MANUAL_ACTION

Use when an external platform or privileged Human action is required.

Examples:

- database / backend service
- cloud deployment platform
- GitHub Environment
- Secrets
- Production approval
- Domain / DNS
- external API / model provider account

ChatGPT must provide:

```text
platform
purpose
where to configure it
required secret / variable names
completion criterion
```

Never ask Human to paste a secret value into ChatGPT or Cursor chat.

### SPEC_GAP

Use when implementation exposes real contract ambiguity or missing Product truth.

```text
Cursor Finding
→ affected Task BLOCKED
→ ChatGPT analyzes Build Spec / implementation impact
→ Human decision if required
→ Design Delta / rebaseline when contract-affecting
```

Cursor must not guess, hardcode a temporary Product rule, add a TODO and continue, or silently reinterpret Acceptance.

## 7. Manual Setup Principle

External setup is **Just-in-Time**.

Do not configure every external system or secret in advance. Configure only what the next approved Task actually requires.

Before a Task that may require real infrastructure begins, ChatGPT should re-audit the Task's concrete implementation requirements. If a real external environment is required, ChatGPT emits HUMAN_MANUAL_ACTION before Cursor proceeds.

## 8. Secret Security Rule

Never:

- paste secret values into ChatGPT
- paste secret values into Cursor chat
- commit secrets
- place secrets in client-visible data
- expose provider keys to the browser
- store secrets in Evidence
- print secrets to console logs

Human confirmation should contain status only, for example:

```text
Staging service secrets configured.
```

No actual secret value is required in chat.

## 9. Cursor Manual-Dependency Flow

Cursor must not directly request privileged credentials from Human.

Correct flow:

```text
Cursor
→ Finding / manual dependency
→ ChatGPT verifies necessity
→ HUMAN_MANUAL_ACTION
→ Human completes action in external platform
→ Human reports completion status only
→ ChatGPT authorizes the execution flow to continue
```

## 10. Spec Gap / Rebaseline Flow

For contract-affecting gaps:

```text
Finding
→ Task BLOCKED
→ ChatGPT triage
→ Human Product / Design decision when needed
→ Product Design Current Truth update
→ Human Freeze
→ new immutable Build Spec
→ affected Backlog / Task rebaseline
→ resume
```

An existing immutable Build Spec must never be edited in place to hide an implementation-discovered contract gap.

## 11. Task Close

A Task may close only when:

```text
Mapped AC/Test PASS
+ Required Commands PASS
+ Type / Lint / Security / Build PASS
+ Engineering Quality Review PASS
+ Semantic Drift Review PASS
+ Evidence Complete
= VERIFIED / CLOSED
```

After close, ChatGPT selects the next dependency-legal Task according to the approved Sprint plan. Cursor does not self-select the next Task.

## 12. Process Failure / Hard Stop

Execution must avoid tool-orchestration retry loops.

Rules:

```text
same path fails 2 times → change method
single work item has not converged within 10 minutes → hard stop and surface the blocker
do not fan out across multiple repos unnecessarily
do not extend a failing path with "almost done" reasoning
```

A failed execution path must be made explicit instead of being silently retried indefinitely.

## 13. Canonical Relationship

```text
Chat                       = discussion
PR / Commit                = historical evidence
EXECUTION-HANDOFF-PROTOCOL = current execution collaboration rule
Build Spec / Sprint / Task = execution scope and Product contract authority
```

If this protocol conflicts with locked Product truth, locked Build Spec, machine-enforced Sprint/Task controls, or Human authority, those higher-order controls win. This protocol defines collaboration behavior; it does not redefine Product semantics.
