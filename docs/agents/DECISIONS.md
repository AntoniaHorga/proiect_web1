# Decisions — proiect_web1

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Local branching and approval gate for commits · approved

---

## D-001 · Local branching and approval gate for commits
- **Status:** approved
- **Date:** 2026-11-08
- **Rule:** All work must be developed on local branches (`feat/*`, `fix/*`, `chore/*`) and merged locally to `main` with user confirmation. Never push to remote without explicit user command.
- **Why:** Maintains control over code state, avoids pushing incomplete coursework, and maintains clean history.
- **Rejected:** Committing directly to `main` (risks broken code on primary branch).
- **Evidence:** AGENTS.md:58
- **Source:** user · confidence high
- **Owner note:** Setup rule for repository workflow.
