# TODO — proiect_web1

What remains after Step E (data foundation, PR #1). Each item starts with `/plan`.
Ledger references point to `docs/agents/`.

## Next plan
- [ ] **Next.js + login + deploy** — Next.js (App Router), Tailwind with the tokens from
  `docs/design/DESIGN.md`, email/password login with bcrypt and HTTP-only cookies
  (D-006), admin account from environment variables, deploy to a live URL.

## Application
- [ ] **API + `docs/agents/CONTRACTS.md`** — Route Handlers / Server Actions for the
  screens; every endpoint the UI relies on recorded as a provided contract (C-).
- [ ] **Upload with mapping assistant** — admin uploads XLSX/CSV; the assistant produces
  the `ColumnLayout` the parser already accepts. Required: the parser input limits in
  Q-008 (file size, sheet range, rows, ZIP signature).
- [ ] **Screens from the mocks** — DS-001 … DS-007 from `docs/design/mocks/`. DS-002
  (explorer) must first be redrawn for the two treemap views decided in Q-006, and
  confirmed (it is back to `draft`).
- [ ] **Annotations + CSV export** — annotations with moderation (`pending` →
  `approved` / `rejected`); CSV export from the explorer, format still open (Q-004).
- [ ] **Publication route** — publish a reconciled batch with the D-004 gate. Required:
  the route never accepts `reconciliation_status` from the client (Q-009); switching the
  published batch when a file is re-parsed (PATTERN-005).
- [ ] **Taxonomy seed** — `budget_categories` and `budget_taxonomy_mapping` rows from
  `docs/SCOPE.md` §2.2 (D-009); writes must reject overlapping year ranges.

## Data and open questions
- [ ] **INS data (Q-002)** — population and CPI for 2022, 2024, 2025, entered by the
  user into `locality_stats`; no estimated values.
- [ ] **Q-007** — how to join name fragments that end in a hyphen
  (`cheltuie- lilor` vs `administrativ- teritoriale`); then bump `PARSER_VERSION` and
  re-import.

## Submission
- [ ] **`SUBMISSION.md`**
- [ ] **Video**
