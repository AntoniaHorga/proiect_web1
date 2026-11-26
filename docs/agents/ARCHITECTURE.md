# Architecture — proiect_web1

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
P09, local budget explorer for Comuna Șura Mare. Current state (Step E): the data
foundation. Budget execution files are parsed, reconciled and stored in PostgreSQL. There
is no web UI yet: Next.js comes in the next plan (D-002).

```text
data/raw/*.xlsx ──► parseBudgetFile ──► reconcile ──► importBudgetFile ──► PostgreSQL 16
 (or UTF-8 CSV)     (layout, rules 1-7)  (D-004)       (status reconciled)   (Docker)
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Money | `src/lib/money.ts` | amount cells (whole lei) → bani `bigint` (D-007) | — |
| Layout | `src/lib/budget/layout.ts` | column positions passed to the parser, validated; default layouts | — |
| Parser | `src/lib/budget/parse.ts` | DATA.md §4.2 rules 1–7 → logical lines with blocks, codes, summary/leaf flags | SheetJS |
| Reconciliation | `src/lib/budget/reconcile.ts` | total vs chapters, parent vs children, functional vs economic total; D-004 statuses; `canPublish` | — |
| Schema | `src/db/schema.ts`, `drizzle/` | 7 tables and their constraints | PostgreSQL |
| Import | `src/db/import.ts`, `scripts/import-raw.ts` | parse + reconcile + store in one transaction; a file already stored with the same sha256 and `PARSER_VERSION` is reported as `already_imported` (`ON CONFLICT DO NOTHING`); a newer parser version re-parses it into a new batch and keeps the old one (PATTERN-005) | PostgreSQL |
| Repository docs & ledger | `docs/agents/` | rules, decisions, architecture | agent / developer |
| Agentic workflows | `.claude/`, `.agents/` | planning and building automations | agent CLI / IDE |

## Data flow
1. `npm run db:import` reads each `data/raw/{cheltuieli,venituri}<year>.xlsx`.
2. `parseBudgetFile(bytes, format, layout)` returns logical lines; any malformed cell
   stops the file with its row and column.
3. `reconcile(parsed)` returns every check and the worst status.
4. `importBudgetFile` stores the batch (with the layout used), the lines and the checks
   in one transaction, with status `reconciled`. Publishing is a later admin action,
   guarded by `canPublish` and by the `import_batches_publication_gate_check` constraint.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| Imported files | `import_batches` | import | kind, year, filename, sha256 + `parser_version` (unique together), layout (jsonb), lifecycle status; at most one `published` batch per kind and year (partial unique index) |
| Expense lines | `expense_lines` | import | 3 blocks (functional, economic_summary, mixed); 9 BIGINT amounts in bani; `name_parts` keeps the raw name fragments |
| Revenue lines | `revenue_lines` | import | 8 BIGINT amounts in bani; `name_parts` keeps the raw name fragments |
| Reconciliation checks | `reconciliation_checks` | import | one row per check and amount column |
| Population and CPI | `locality_stats` | user (D-008) | empty until INS data is entered |
| Taxonomy | `budget_categories`, `budget_taxonomy_mapping` | admin (D-009) | structure only; year-dependent, with notes |
| Database data | Docker volume `pgdata` | Docker | `budget` (dev) and `budget_test` (integration tests) |
| Knowledge ledger | `docs/agents/` | Git | maintained via `ledger-lint.py` |

### Entity relationships
Generated from `src/db/schema.ts` (migrations `drizzle/0000`–`0002`). Money columns are
`BIGINT` in bani (D-007). `expense_lines` and `revenue_lines` have no foreign key to the
taxonomy tables: lines are matched to `budget_taxonomy_mapping` by code prefix and year
at query time (D-009). `locality_stats` is joined by year, with no foreign key.

```mermaid
erDiagram
    import_batches ||--o{ expense_lines : "import_id (on delete cascade)"
    import_batches ||--o{ revenue_lines : "import_id (on delete cascade)"
    import_batches ||--o{ reconciliation_checks : "import_id (on delete cascade)"
    budget_categories ||--o{ budget_taxonomy_mapping : "(category_id, axis)"

    import_batches {
        serial id PK
        text kind "expense | revenue"
        smallint fiscal_year "one published batch per kind and year"
        text source_filename
        char source_sha256 UK "unique with parser_version"
        smallint parser_version UK "PATTERN-005"
        jsonb column_layout
        text status "uploaded | reconciled | published"
        text reconciliation_status "exact_match | rounded_match | discrepancy_detected"
        text justification "D-004 publication gate"
        timestamptz created_at
        timestamptz reconciled_at
        timestamptz published_at
    }
    expense_lines {
        serial id PK
        integer import_id FK
        integer source_row
        text block "functional | economic_summary | mixed"
        char capitol
        char subcapitol
        char paragraf
        char titlu
        char articol
        char alineat
        text functional_code
        text economic_code
        text name
        text_array name_parts
        boolean is_summary
        boolean is_leaf
        bigint credite_angajament_initiale
        bigint credite_angajament_definitive
        bigint credite_bugetare_initiale
        bigint credite_bugetare_definitive
        bigint angajamente_bugetare
        bigint angajamente_legale
        bigint plati_efectuate
        bigint angajamente_legale_de_platit
        bigint cheltuieli_efective
    }
    revenue_lines {
        serial id PK
        integer import_id FK
        integer source_row
        char capitol
        char subcapitol
        char paragraf
        text functional_code
        text name
        text_array name_parts
        boolean is_summary
        boolean is_leaf
        bigint prevederi_initiale
        bigint prevederi_definitive
        bigint drepturi_total
        bigint drepturi_ani_precedenti
        bigint drepturi_an_curent
        bigint incasari_realizate
        bigint stingeri_alte_cai
        bigint drepturi_contestate
    }
    reconciliation_checks {
        serial id PK
        integer import_id FK
        text check_kind "total_vs_chapters | parent_vs_children | functional_vs_mixed_total"
        text block
        text code
        integer source_row
        text amount_column
        bigint reported_bani
        bigint computed_bani
        bigint difference_bani
        text status
    }
    locality_stats {
        smallint year PK
        integer population "D-008, no seed"
        text population_source
        numeric cpi_index
        text cpi_source
        timestamptz updated_at
    }
    budget_categories {
        serial id PK
        text axis UK "section | domain | revenue_source"
        text key UK
        text label
    }
    budget_taxonomy_mapping {
        serial id PK
        text axis FK
        text code_prefix UK "e.g. 70.02.05"
        integer category_id FK
        smallint valid_from_year UK "NULL = open-ended"
        smallint valid_to_year
        text note "explanation shown to the user"
        timestamptz updated_at
    }
```

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `.env` | docker compose | `.env` is git-ignored; template in `.env.example` |
| `DATABASE_URL` | `.env` | drizzle-kit, `db:import` | dev database |
| `TEST_DATABASE_URL` | `.env`, CI env | `test:db` | must end in `_test` |

## Build, deploy, runtime
Runs locally: Node ≥ 24 (CI uses 26) and Docker. CI on GitHub Actions
(`.github/workflows/ci.yml`) runs typecheck, unit tests, integration tests against a
PostgreSQL 16 service container, and the ledger lint. No deployment yet.

## Boundaries
Local development boundary. Secrets are never committed (`.env` is git-ignored). The
integration tests only touch a `*_test` database and roll back every test.
PostgreSQL is published on `127.0.0.1:5432` only.

Required before the upload and publication routes exist (deferred from the PR #1 review):
- Upload: input limits for the parser (file size, sheet range, rows, ZIP signature), see Q-008.
- Publication: the route never accepts `reconciliation_status` from the client, see Q-009.
