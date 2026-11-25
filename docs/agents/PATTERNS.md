# Patterns — proiect_web1

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan before build for non-trivial changes · approved
- PATTERN-002 · Zero raw hex in mock CSS — all values through CSS custom properties · candidate

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
