// Database schema (PostgreSQL 16, Drizzle ORM). Money is BIGINT in bani (D-007).
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  smallint,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import type { ColumnLayout } from '../lib/budget/layout';

// The default is written as SQL: drizzle-kit cannot serialize a bigint literal.
const money = (name: string) => bigint(name, { mode: 'bigint' }).notNull().default(sql`0`);
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

const RECONCILIATION_STATUSES = sql`('exact_match', 'rounded_match', 'discrepancy_detected')`;
const BLOCKS = sql`('functional', 'economic_summary', 'mixed')`;
const AXES = sql`('section', 'domain', 'revenue_source')`;

/** One imported file. Lifecycle (SCOPE.md §5): uploaded → reconciled → published. */
export const importBatches = pgTable(
  'import_batches',
  {
    id: serial('id').primaryKey(),
    kind: text('kind').notNull(),
    fiscalYear: smallint('fiscal_year').notNull(),
    sourceFilename: text('source_filename').notNull(),
    sourceSha256: char('source_sha256', { length: 64 }).notNull(),
    /** The column layout the file was parsed with (audit trail for the mapping assistant). */
    columnLayout: jsonb('column_layout').$type<ColumnLayout>().notNull(),
    status: text('status').notNull().default('uploaded'),
    reconciliationStatus: text('reconciliation_status'),
    justification: text('justification'),
    createdAt: createdAt(),
    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (t) => [
    unique('import_batches_source_sha256_key').on(t.sourceSha256),
    check('import_batches_kind_check', sql`${t.kind} IN ('expense', 'revenue')`),
    check('import_batches_status_check', sql`${t.status} IN ('uploaded', 'reconciled', 'published')`),
    check(
      'import_batches_reconciliation_status_check',
      sql`${t.reconciliationStatus} IS NULL OR ${t.reconciliationStatus} IN ${RECONCILIATION_STATUSES}`,
    ),
    check(
      'import_batches_reconciled_has_status_check',
      sql`${t.status} = 'uploaded' OR ${t.reconciliationStatus} IS NOT NULL`,
    ),
    // D-004: a discrepancy blocks publication without a justification of at least 20 characters.
    check(
      'import_batches_publication_gate_check',
      sql`${t.status} <> 'published' OR ${t.reconciliationStatus} IN ('exact_match', 'rounded_match') OR char_length(btrim(coalesce(${t.justification}, ''))) >= 20`,
    ),
  ],
);

export const expenseLines = pgTable(
  'expense_lines',
  {
    id: serial('id').primaryKey(),
    importId: integer('import_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    sourceRow: integer('source_row').notNull(),
    block: text('block').notNull(),
    capitol: char('capitol', { length: 4 }),
    subcapitol: char('subcapitol', { length: 2 }),
    paragraf: char('paragraf', { length: 2 }),
    titlu: char('titlu', { length: 2 }),
    articol: char('articol', { length: 2 }),
    alineat: char('alineat', { length: 2 }),
    functionalCode: text('functional_code'),
    economicCode: text('economic_code'),
    name: text('name').notNull(),
    isSummary: boolean('is_summary').notNull(),
    isLeaf: boolean('is_leaf').notNull(),
    crediteAngajamentInitiale: money('credite_angajament_initiale'),
    crediteAngajamentDefinitive: money('credite_angajament_definitive'),
    crediteBugetareInitiale: money('credite_bugetare_initiale'),
    crediteBugetareDefinitive: money('credite_bugetare_definitive'),
    angajamenteBugetare: money('angajamente_bugetare'),
    angajamenteLegale: money('angajamente_legale'),
    platiEfectuate: money('plati_efectuate'),
    angajamenteLegaleDePlatit: money('angajamente_legale_de_platit'),
    cheltuieliEfective: money('cheltuieli_efective'),
  },
  (t) => [
    check('expense_lines_block_check', sql`${t.block} IN ${BLOCKS}`),
    index('expense_lines_import_id_idx').on(t.importId),
    index('expense_lines_functional_code_idx').on(t.functionalCode),
  ],
);

export const revenueLines = pgTable(
  'revenue_lines',
  {
    id: serial('id').primaryKey(),
    importId: integer('import_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    sourceRow: integer('source_row').notNull(),
    capitol: char('capitol', { length: 4 }),
    subcapitol: char('subcapitol', { length: 2 }),
    paragraf: char('paragraf', { length: 2 }),
    functionalCode: text('functional_code'),
    name: text('name').notNull(),
    isSummary: boolean('is_summary').notNull(),
    isLeaf: boolean('is_leaf').notNull(),
    prevederiInitiale: money('prevederi_initiale'),
    prevederiDefinitive: money('prevederi_definitive'),
    drepturiTotal: money('drepturi_total'),
    drepturiAniPrecedenti: money('drepturi_ani_precedenti'),
    drepturiAnCurent: money('drepturi_an_curent'),
    incasariRealizate: money('incasari_realizate'),
    stingeriAlteCai: money('stingeri_alte_cai'),
    drepturiContestate: money('drepturi_contestate'),
  },
  (t) => [
    index('revenue_lines_import_id_idx').on(t.importId),
    index('revenue_lines_functional_code_idx').on(t.functionalCode),
  ],
);

export const reconciliationChecks = pgTable(
  'reconciliation_checks',
  {
    id: serial('id').primaryKey(),
    importId: integer('import_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    checkKind: text('check_kind').notNull(),
    block: text('block').notNull(),
    code: text('code').notNull(),
    sourceRow: integer('source_row').notNull(),
    amountColumn: text('amount_column').notNull(),
    reportedBani: bigint('reported_bani', { mode: 'bigint' }).notNull(),
    computedBani: bigint('computed_bani', { mode: 'bigint' }).notNull(),
    differenceBani: bigint('difference_bani', { mode: 'bigint' }).notNull(),
    status: text('status').notNull(),
  },
  (t) => [
    check(
      'reconciliation_checks_check_kind_check',
      sql`${t.checkKind} IN ('total_vs_chapters', 'parent_vs_children', 'functional_vs_mixed_total')`,
    ),
    check('reconciliation_checks_block_check', sql`${t.block} IN ${BLOCKS}`),
    check('reconciliation_checks_status_check', sql`${t.status} IN ${RECONCILIATION_STATUSES}`),
    index('reconciliation_checks_import_id_idx').on(t.importId),
  ],
);

/** D-008: population and CPI per year, entered from INS Tempo Online; no seed, no estimates. */
export const localityStats = pgTable(
  'locality_stats',
  {
    year: smallint('year').primaryKey(),
    population: integer('population'),
    populationSource: text('population_source'),
    cpiIndex: numeric('cpi_index', { precision: 7, scale: 3 }),
    cpiSource: text('cpi_source'),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('locality_stats_population_check', sql`${t.population} IS NULL OR ${t.population} > 0`),
    check(
      'locality_stats_population_source_check',
      sql`${t.population} IS NULL OR ${t.populationSource} IS NOT NULL`,
    ),
    check('locality_stats_cpi_source_check', sql`${t.cpiIndex} IS NULL OR ${t.cpiSource} IS NOT NULL`),
  ],
);

/** D-009: the categories of each taxonomy axis. */
export const budgetCategories = pgTable(
  'budget_categories',
  {
    id: serial('id').primaryKey(),
    axis: text('axis').notNull(),
    key: text('key').notNull(),
    label: text('label').notNull(),
  },
  (t) => [
    check('budget_categories_axis_check', sql`${t.axis} IN ${AXES}`),
    unique('budget_categories_axis_key_key').on(t.axis, t.key),
    unique('budget_categories_id_axis_key').on(t.id, t.axis),
  ],
);

/** D-009: year-dependent mapping of a code prefix to a category, with an explanation for the user. */
export const budgetTaxonomyMapping = pgTable(
  'budget_taxonomy_mapping',
  {
    id: serial('id').primaryKey(),
    axis: text('axis').notNull(),
    codePrefix: text('code_prefix').notNull(),
    categoryId: integer('category_id').notNull(),
    validFromYear: smallint('valid_from_year'),
    validToYear: smallint('valid_to_year'),
    note: text('note'),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('budget_taxonomy_mapping_axis_check', sql`${t.axis} IN ${AXES}`),
    check('budget_taxonomy_mapping_code_prefix_check', sql`${t.codePrefix} ~ '^[0-9]{2}([.][0-9]{2})*$'`),
    check(
      'budget_taxonomy_mapping_years_check',
      sql`${t.validFromYear} IS NULL OR ${t.validToYear} IS NULL OR ${t.validFromYear} <= ${t.validToYear}`,
    ),
    foreignKey({
      name: 'budget_taxonomy_mapping_category_axis_fk',
      columns: [t.categoryId, t.axis],
      foreignColumns: [budgetCategories.id, budgetCategories.axis],
    }),
    unique('budget_taxonomy_mapping_axis_prefix_from_key')
      .on(t.axis, t.codePrefix, t.validFromYear)
      .nullsNotDistinct(),
  ],
);
