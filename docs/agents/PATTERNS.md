# Patterns — proiect_web1

<!-- graffino-agentic:begin v1 -->
> How we build things here. Copy only `approved` entries. `candidate` = seen once or
> not yet confirmed; agents add these freely. Promotion needs the user's OK.
<!-- graffino-agentic:end -->

## Index
- PATTERN-001 · Plan before build for non-trivial changes · approved

---

## PATTERN-001 · Plan before build for non-trivial changes
- **Status:** approved
- **Use when:** Any modification touching more than a few lines, involving structural changes or architectural choices.
- **How:** Run `/plan` to specify approach, files, and tests; obtain user approval; then execute via `/build`.
- **Example:** AGENTS.md:23
- **Why:** Prevents regressions, eliminates speculative code, and guarantees user alignment before editing.
- **Source:** user · confidence high
