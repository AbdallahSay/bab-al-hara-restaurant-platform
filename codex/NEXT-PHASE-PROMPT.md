# Template for future Codex phases

Read the repository governance docs first. Implement only the requested phase from `PLANS.md` as a production-grade vertical slice.

Before coding:
- inspect current code and relevant docs
- create a dedicated feature branch
- write a concise plan
- identify API/data/state/security/UX implications

During implementation:
- follow `DESIGN-BRIEF.md` and `UX-GUIDELINES.md`
- no invented features or meaningless UI
- implement Angular -> API -> domain -> persistence -> real-time/integration where applicable
- include Arabic RTL + English LTR
- include validation, authorization, loading/error/empty states, tests, docs

Before completion:
- run all relevant builds/tests/lint
- review target viewports
- update `PLANS.md`
- commit meaningful completed work
- push branch to `origin`
- report branch, commit SHA, push result, and test results

Never call a task complete while significant work exists only locally.
