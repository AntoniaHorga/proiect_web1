# Decisions — proiect_web1

<!-- graffino-agentic:begin v1 -->
> Constraints the code must obey. Status: `approved` (obey) · `proposed` (do not
> build on it) · `superseded-by <ID>` (kept to explain old code).
> Adding or changing an entry needs the user's OK (AGENTS.md → The gate).
<!-- graffino-agentic:end -->

## Index
- D-001 · Local branching and approval gate for commits
- D-002 · Full technology stack and architecture
- D-003 · Exact numeric representation for monetary values
- D-004 · Reconciliation tolerance and publication gate
- D-005 · Local containerized storage with abstracted interface for audit files
- D-006 · Session-based authentication via HTTP-only cookies and bcrypt password hashing
- D-007 · Monetary amounts stored as BIGINT in bani
- D-008 · Structure of locality_stats
- D-009 · Year-dependent taxonomy mapping with explainable notes

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
- **Confirmed:** 2026-11-25

## D-002 · Full technology stack and architecture
- **Status:** approved
- **Date:** 2026-11-19
- **Rule:** The application must be built using Node.js + TypeScript with Next.js (App Router, Server Actions, Route Handlers), styled with Tailwind CSS strictly adhering to design tokens in `docs/design/DESIGN.md`, backed by PostgreSQL 16 in Docker via `pg` / Drizzle ORM, with interactive Treemap and charts rendered via Apache ECharts, and tested using Vitest and Playwright.
- **Why:** Guarantees end-to-end type safety, reliable containerized database setup, server-side Excel parsing, robust native SQL window functions for YoY comparisons, and rapid test execution.
- **Rejected:** Separate backend services / microservices (unnecessary complexity for coursework), client-side only aggregation, or non-relational database.
- **Evidence:** docs/SCOPE.md#L45-L53, docs/agents/OPEN-QUESTIONS.md#L16-L23
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-003 · Exact numeric representation for monetary values
- **Status:** approved
- **Date:** 2026-11-19
- **Rule:** All financial and budgetary amounts must be stored and processed as exact numeric types (`BIGINT` in bani, where 1 leu = 100 bani, or `NUMERIC(15, 2)`). Floating-point data types (`FLOAT`, `REAL`, `DOUBLE PRECISION`) are strictly forbidden.
- **Why:** Floating-point representations introduce precision rounding errors in SQL aggregations and reconciliation calculations.
- **Rejected:** Storing amounts as floating-point numbers or raw unstructured strings.
- **Evidence:** docs/brief.md#L26, docs/SCOPE.md#L50-L51
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-004 · Reconciliation tolerance and publication gate
- **Status:** approved
- **Date:** 2026-11-19
- **Rule:** The reconciliation engine reports exact differences to the ban (`exact_match` for 0.00 RON) and allows a maximum rounding tolerance of ±1.00 RON (`rounded_match`). Any difference exceeding ±1.00 RON receives status `discrepancy_detected` and strictly blocks dataset publication until an administrator provides a mandatory explanatory justification of at least 20 characters stored for audit.
- **Why:** Accommodates legitimate minor rounding differences in source PDF documents and Treasury conversions while enforcing strict audit accountability for genuine accounting discrepancies.
- **Rejected:** Zero tolerance without explanation capability (would block valid data with minor rounding artifacts) or automatic publishing without audit notes.
- **Evidence:** docs/brief.md#L29-L31, docs/SCOPE.md#L67-L77
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-005 · Local containerized storage with abstracted interface for audit files
- **Status:** approved
- **Date:** 2026-11-19
- **Rule:** Original raw budget files (`.xlsx`, `.pdf`) uploaded for audit must be stored in a dedicated local persistent volume mounted in Docker (`uploads/original_files/`), served securely via `/audit`, and accessed through an abstracted `FileStorageService` interface allowing future migration to S3/MinIO.
- **Why:** Satisfies audit traceability requirements in a local coursework environment without requiring cloud object storage credentials while maintaining an architecture ready for S3.
- **Rejected:** Storing files directly in the PostgreSQL database as BLOBs or tightly coupling storage logic to the local filesystem without an abstraction layer.
- **Evidence:** docs/brief.md#L24, docs/SCOPE.md#L52, docs/agents/OPEN-QUESTIONS.md#L28-L33
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-006 · Session-based authentication via HTTP-only cookies and bcrypt password hashing
- **Status:** approved
- **Date:** 2026-11-19
- **Rule:** User and administrator authentication must be implemented locally using email and password hashed with `bcryptjs`, maintaining session tokens in secure, `HTTP-only`, `SameSite=Lax` cookies verified on the server, without third-party OAuth providers.
- **Why:** Guarantees zero external network dependencies, privacy, and full control over authentication and role-based access for local academic execution.
- **Rejected:** Third-party OAuth providers (Google, GitHub) or insecure localStorage-based JWT storage.
- **Evidence:** docs/SCOPE.md#L55-L65, docs/brief.md#L21
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-007 · Monetary amounts stored as BIGINT in bani
- **Status:** approved
- **Date:** 2026-11-25
- **Rule:** Every monetary amount is stored in PostgreSQL as `BIGINT` in bani (1 leu = 100 bani) and handled in TypeScript as `bigint` (or an integer value in bani that is never a fraction). Converting to lei happens only for display. `NUMERIC(15, 2)` is not used. This narrows D-003, which still applies (no floating-point types).
- **Why:** One exact representation for the schema, the parser and reconciliation. The source files hold whole lei, so the import is an integer multiplication by 100, and the ±1.00 RON tolerance in D-004 becomes an integer comparison (≤ 100 bani).
- **Rejected:** `NUMERIC(15, 2)` (returned as strings by `pg`, which requires decimal parsing in JavaScript).
- **Evidence:** user choice in session 2026-11-25; data/raw/*.xlsx contain only whole-lei integer values
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-008 · Structure of locality_stats
- **Status:** approved
- **Date:** 2026-11-25
- **Rule:** Table `locality_stats`: `year SMALLINT PRIMARY KEY`, `population INTEGER NULL CHECK (population > 0)`, `population_source TEXT NULL`, `cpi_index NUMERIC(7,3) NULL`, `cpi_source TEXT NULL`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, with `CHECK (population IS NULL OR population_source IS NOT NULL)` and `CHECK (cpi_index IS NULL OR cpi_source IS NOT NULL)`. No seed and no estimated values: the table stays empty until the user enters INS Tempo Online data. CPI is not money, so D-007 does not apply; D-003 (no floats) does.
- **Why:** Population is a must requirement (per capita); every value must carry its source.
- **Rejected:** Seeding estimated values (no invented data).
- **Evidence:** docs/SCOPE.md §2.1, docs/agents/OPEN-QUESTIONS.md#Q-002, user decision 2026-11-25
- **Source:** user · confidence high
- **Confirmed:** 2026-11-25

## D-009 · Year-dependent taxonomy mapping with explainable notes
- **Status:** approved
- **Date:** 2026-11-25
- **Rule:** Two tables.
  - `budget_categories`: `id SERIAL PRIMARY KEY`, `axis TEXT NOT NULL CHECK (axis IN ('section','domain','revenue_source'))`, `key TEXT NOT NULL`, `label TEXT NOT NULL`, `UNIQUE (axis, key)`, `UNIQUE (id, axis)`.
  - `budget_taxonomy_mapping`: `id SERIAL PRIMARY KEY`, `axis TEXT NOT NULL` (same CHECK), `code_prefix TEXT NOT NULL CHECK (code_prefix ~ '^\d{2}(\.\d{2})*$')`, `category_id INTEGER NOT NULL`, `valid_from_year SMALLINT NULL`, `valid_to_year SMALLINT NULL`, `note TEXT NULL` (explanation shown to the user, e.g. "in 2022, X was reported under Y"), `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`; `FOREIGN KEY (category_id, axis) REFERENCES budget_categories (id, axis)` so a mapping cannot point to a category of another axis; `UNIQUE NULLS NOT DISTINCT (axis, code_prefix, valid_from_year)`; `CHECK (valid_from_year IS NULL OR valid_to_year IS NULL OR valid_from_year <= valid_to_year)`.
  - Matching for a line of year Y: rows of the axis whose range contains Y (NULL = open-ended); the longest `code_prefix` wins; no match → `necategorisit`. `section` matches the economic titlu, `domain` the functional code, `revenue_source` the revenue capitol.
- **Why:** The P09 twist requires a mapping that changes over the years and can be explained to the user.
- **Rejected:** Free-text categories on the mapping row (no single list to edit or label); a mapping without year validity.
- **Evidence:** docs/SCOPE.md §2.2, user decision 2026-11-25
- **Source:** user · confidence high
- **Owner note:** Overlapping year ranges for the same axis and prefix are not blocked by the unique key; the code that writes mappings must reject them (an exclusion constraint would need the `btree_gist` extension).
- **Confirmed:** 2026-11-25

