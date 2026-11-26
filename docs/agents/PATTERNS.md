# Patterns — proiect_web1

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan before build for non-trivial changes · approved
- PATTERN-002 · Zero raw hex in mock CSS — all values through CSS custom properties · candidate
- PATTERN-003 · Database tests run in rolled-back transactions on a *_test database · candidate
- PATTERN-004 · Public URLs are built from budget codes and year, never from database ids · candidate
- PATTERN-005 · Any change to the parser's output increases PARSER_VERSION · candidate

---

## PATTERN-001 · Plan before build for non-trivial changes
- **Status:** approved
- **Use when:** Any modification touching more than a few lines, involving structural changes or architectural choices.
- **How:** Run `/plan` to specify approach, files, and tests; obtain user approval; then execute via `/build`.
- **Example:** AGENTS.md:23
- **Why:** Prevents regressions, eliminates speculative code, and guarantees user alignment before editing.
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## PATTERN-002 · Zero raw hex in mock CSS — all values through CSS custom properties
- **Status:** candidate
- **Use when:** Authoring or updating any mock HTML file in `docs/design/mocks/`.
- **How:** Declare every colour, shadow, and radius as a CSS custom property in `:root` (and override in `html.dark`). Outside those two blocks, use only `var(--token-name)`. Fixed-identity tokens (e.g. `--brand-primary-fixed`) go in `:root` only and are never overridden. Run the hex-audit script to verify before committing.
- **Example:** `docs/design/mocks/01-dashboard.html` after fix/mock-design-compliance (commit e20dbfe)
- **Why:** Guarantees theme-switching works without touching component CSS, enables contrast-compliant dark mode without duplication, and makes WCAG audits scriptable.
- **Source:** build session 2026-11-24 · confidence medium (one implementation)

## PATTERN-003 · Database tests run in rolled-back transactions on a *_test database
- **Status:** candidate
- **Use when:** Writing any test that talks to PostgreSQL, locally or in CI.
- **How:** Read the URL from `TEST_DATABASE_URL` and refuse to run unless the database name ends in `_test`. Apply migrations with Drizzle's `migrate` (already-applied ones are skipped). Run each test inside `inRollback()` (a transaction ended by `tx.rollback()`), and test refused statements with `expectRefused()` inside a savepoint, asserting the constraint name. Code under test accepts a transaction handle (`Db | Tx`) so its own transactions become savepoints. Never drop or truncate.
- **Example:** `tests/integration/db.test.ts`
- **Why:** Tests leave no data behind, never touch the dev database, and need no destructive clean-up.
- **Source:** build session 2026-11-25 (user asked for the no-delete approach) · confidence medium (one implementation)

## PATTERN-004 · Public URLs are built from budget codes and year, never from database ids
- **Status:** candidate
- **Use when:** Any route, link, canonical URL, export or structured-data identifier that points to a budget year, chapter or line.
- **How:** Build the path from the fiscal year and the dotted codes (`functional_code`, `economic_code`, and the block for expenses), e.g. `/explorator?an=2025&cod=70.02.05`. Never expose `expense_lines.id`, `revenue_lines.id` or `import_batches.id`: they change on every re-import.
- **Example:** none yet (no routes); decided in the review of PR #1, 2026-11-25. All six imports have no duplicate code tuple per import and block (checked 2026-11-25).
- **Why:** Stable, readable URLs that survive re-imports and that search engines and AI assistants can cite.
- **Source:** user, review of PR #1 · confidence medium (no implementation yet)

## PATTERN-005 · Any change to the parser's output increases PARSER_VERSION
- **Status:** candidate
- **Use when:** Changing `src/lib/budget/parse.ts` (or anything it calls) in a way that changes what it returns for the same file: lines, codes, names, flags, amounts.
- **How:** Increase `PARSER_VERSION` in `src/lib/budget/parse.ts` and add one line to its comment saying what changed. `npm run db:import` then re-parses every file into a new batch (`parser_version` = new value) and keeps the old batch unchanged; switching the published batch is the publication route's job (Q-009). Refactors with identical output do not change the version.
- **Example:** `PARSER_VERSION = 2` (raw name fragments, `nameParts`), commit for review findings 2–4 of PR #1.
- **Why:** The import skips a file already stored with the same sha256 and parser version, so without the bump a parser fix would never reach the stored data.
- **Source:** user, review of PR #1, 2026-11-25 · confidence medium (one implementation)

