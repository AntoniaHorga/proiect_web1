// Integration tests against a real PostgreSQL 16 (npm run test:db).
// Safety: they only run on a database whose name ends in `_test`, apply the
// migrations (already-applied ones are skipped) and run every test inside a
// transaction that is rolled back. Nothing is deleted and nothing is committed.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { and, eq, sql, TransactionRollbackError } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDb, type Tx } from '../../src/db/client';
import { loadEnv, requireEnv } from '../../src/db/env';
import { importBudgetFile } from '../../src/db/import';
import {
  budgetCategories,
  budgetTaxonomyMapping,
  expenseLines,
  importBatches,
  localityStats,
} from '../../src/db/schema';
import { EXPENSE_LAYOUT, REVENUE_LAYOUT } from '../../src/lib/budget/layout';
import { PARSER_VERSION } from '../../src/lib/budget/parse';
import { canPublish } from '../../src/lib/budget/reconcile';

loadEnv();
const url = requireEnv('TEST_DATABASE_URL');
const dbName = new URL(url).pathname.replace(/^\//, '');
if (!dbName.endsWith('_test')) {
  throw new Error(`TEST_DATABASE_URL must point to a database ending in _test, got "${dbName}"`);
}

const { db, pool } = createDb(url);

/** Runs `fn` in a transaction and always rolls it back. */
async function inRollback(fn: (tx: Tx) => Promise<void>): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      tx.rollback();
    });
  } catch (error) {
    if (!(error instanceof TransactionRollbackError)) throw error;
  }
}

/** Expects the statement to be refused; a savepoint keeps the outer transaction usable. */
async function expectRefused(tx: Tx, fn: (sp: Tx) => Promise<unknown>, constraint: string): Promise<void> {
  let error: unknown;
  try {
    await tx.transaction(async (sp) => {
      await fn(sp);
    });
  } catch (e) {
    error = e;
  }
  expect(error, `expected ${constraint} to refuse the statement`).toBeDefined();
  const cause = (error as { cause?: { constraint?: string } }).cause;
  expect(cause?.constraint ?? (error as { constraint?: string }).constraint).toBe(constraint);
}

const batch = (overrides: Partial<typeof importBatches.$inferInsert> = {}) => ({
  kind: 'expense',
  fiscalYear: 2022,
  sourceFilename: 'test.xlsx',
  sourceSha256: 'a'.repeat(64),
  columnLayout: EXPENSE_LAYOUT,
  ...overrides,
});

let rowsBefore = 0;
const countBatches = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(importBatches))[0]!.n;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: 'drizzle' });
  rowsBefore = await countBatches();
});

afterAll(async () => {
  // Every test rolled back: the database holds exactly what it held before.
  expect(await countBatches()).toBe(rowsBefore);
  await pool.end();
});

describe('migration 0000_init', () => {
  it('creates the seven tables', async () => {
    const result = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    expect(result.rows.map((r) => r.table_name)).toEqual(
      expect.arrayContaining([
        'budget_categories',
        'budget_taxonomy_mapping',
        'expense_lines',
        'import_batches',
        'locality_stats',
        'reconciliation_checks',
        'revenue_lines',
      ]),
    );
  });

  it('seeds nothing into locality_stats (D-008)', async () => {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(localityStats);
    expect(row!.n).toBe(0);
  });
});

describe('money columns (D-007)', () => {
  it('stores bigint bani without loss above 2^53', async () => {
    await inRollback(async (tx) => {
      const [b] = await tx.insert(importBatches).values(batch()).returning({ id: importBatches.id });
      const big = 9_007_199_254_740_993n;
      await tx.insert(expenseLines).values({
        importId: b!.id,
        sourceRow: 2,
        block: 'functional',
        name: 'TOTAL CHELTUIELI',
        isSummary: true,
        isLeaf: false,
        platiEfectuate: big,
      });
      const [line] = await tx.select().from(expenseLines);
      expect(line!.platiEfectuate).toBe(big);
      expect(line!.cheltuieliEfective).toBe(0n);
    });
  });
});

describe('publication gate (D-004)', () => {
  it('refuses to publish a discrepancy without a justification of 20 characters', async () => {
    await inRollback(async (tx) => {
      const gate = 'import_batches_publication_gate_check';
      const discrepancy = { status: 'published', reconciliationStatus: 'discrepancy_detected' };
      await expectRefused(tx, (sp) => sp.insert(importBatches).values(batch(discrepancy)), gate);
      await expectRefused(
        tx,
        (sp) => sp.insert(importBatches).values(batch({ ...discrepancy, justification: `  ${'x'.repeat(19)}  ` })),
        gate,
      );
      await tx.insert(importBatches).values(batch({ ...discrepancy, justification: 'x'.repeat(20) }));
    });
  });

  it('does not count tabs and newlines around the justification, like canPublish', async () => {
    await inRollback(async (tx) => {
      const gate = 'import_batches_publication_gate_check';
      const discrepancy = { status: 'published', reconciliationStatus: 'discrepancy_detected' };
      const padded = `\n\t ${'x'.repeat(19)} \t\n`;
      expect(canPublish('discrepancy_detected', padded)).toBe(false);
      await expectRefused(tx, (sp) => sp.insert(importBatches).values(batch({ ...discrepancy, justification: padded })), gate);
      await expectRefused(
        tx,
        (sp) => sp.insert(importBatches).values(batch({ ...discrepancy, justification: '\n'.repeat(20) })),
        gate,
      );
    });
  });

  it('publishes exact and rounded matches without a justification', async () => {
    await inRollback(async (tx) => {
      await tx.insert(importBatches).values(batch({ status: 'published', reconciliationStatus: 'exact_match' }));
      await tx.insert(importBatches).values(
        // Another year: only one published batch per kind and year is allowed.
        batch({ sourceSha256: 'b'.repeat(64), fiscalYear: 2024, status: 'published', reconciliationStatus: 'rounded_match' }),
      );
    });
  });

  it('allows only one published batch per kind and fiscal year', async () => {
    await inRollback(async (tx) => {
      const published = { status: 'published', reconciliationStatus: 'exact_match' };
      await tx.insert(importBatches).values(batch({ ...published, sourceSha256: '1'.repeat(64) }));
      await expectRefused(
        tx,
        (sp) => sp.insert(importBatches).values(batch({ ...published, sourceSha256: '2'.repeat(64) })),
        'import_batches_one_published_per_year_key',
      );
      // Allowed: a reconciled batch of the same year, and published batches of another year or kind.
      await tx.insert(importBatches).values(
        batch({ sourceSha256: '3'.repeat(64), status: 'reconciled', reconciliationStatus: 'exact_match' }),
      );
      await tx.insert(importBatches).values(batch({ ...published, sourceSha256: '4'.repeat(64), fiscalYear: 2024 }));
      await tx.insert(importBatches).values(
        batch({ ...published, sourceSha256: '5'.repeat(64), kind: 'revenue', columnLayout: REVENUE_LAYOUT }),
      );
    });
  });

  it('refuses a reconciled batch without a reconciliation status', async () => {
    await inRollback(async (tx) => {
      await expectRefused(
        tx,
        (sp) => sp.insert(importBatches).values(batch({ status: 'reconciled' })),
        'import_batches_reconciled_has_status_check',
      );
    });
  });
});

describe('locality_stats (D-008)', () => {
  it('refuses a population without its source', async () => {
    await inRollback(async (tx) => {
      await expectRefused(
        tx,
        (sp) => sp.insert(localityStats).values({ year: 2025, population: 5000 }),
        'locality_stats_population_source_check',
      );
      await tx.insert(localityStats).values({ year: 2025, population: 5000, populationSource: 'test source' });
    });
  });
});

describe('budget_taxonomy_mapping (D-009)', () => {
  it('refuses a category of another axis and a duplicate open-ended prefix', async () => {
    await inRollback(async (tx) => {
      const [domain] = await tx
        .insert(budgetCategories)
        .values({ axis: 'domain', key: 'drumuri', label: 'Drumuri și Transport' })
        .returning({ id: budgetCategories.id });
      await expectRefused(
        tx,
        (sp) => sp.insert(budgetTaxonomyMapping).values({ axis: 'section', codePrefix: '84.02', categoryId: domain!.id }),
        'budget_taxonomy_mapping_category_axis_fk',
      );
      await tx.insert(budgetTaxonomyMapping).values({ axis: 'domain', codePrefix: '84.02', categoryId: domain!.id });
      await expectRefused(
        tx,
        (sp) => sp.insert(budgetTaxonomyMapping).values({ axis: 'domain', codePrefix: '84.02', categoryId: domain!.id }),
        'budget_taxonomy_mapping_axis_prefix_from_key',
      );
    });
  });
});

describe('importBudgetFile', () => {
  it('imports a real expense file as reconciled, never published, and skips a re-import', async () => {
    await inRollback(async (tx) => {
      const data = readFileSync('data/raw/cheltuieli2022.xlsx');
      const input = { data, filename: 'cheltuieli2022.xlsx', format: 'xlsx' as const, fiscalYear: 2022, layout: EXPENSE_LAYOUT };
      const outcome = await importBudgetFile(tx, input);
      expect(outcome).toMatchObject({ imported: true, lines: 386 });

      const [stored] = await tx.select().from(importBatches);
      expect(stored).toMatchObject({ status: 'reconciled', reconciliationStatus: 'exact_match', fiscalYear: 2022 });
      expect(stored!.columnLayout).toEqual(EXPENSE_LAYOUT);

      const [sums] = await tx
        .select({ leaves: sql<string>`sum(${expenseLines.platiEfectuate}) FILTER (WHERE ${expenseLines.isLeaf} AND ${expenseLines.block} = 'functional')` })
        .from(expenseLines);
      expect(BigInt(sums!.leaves)).toBe(1242339100n);

      expect(await importBudgetFile(tx, input)).toMatchObject({ imported: false, reason: 'already_imported' });
    });
  });

  it('returns already_imported, not a unique-key error, when the same file was stored in the meantime', async () => {
    await inRollback(async (tx) => {
      const data = readFileSync('data/raw/venituri2022.xlsx');
      const sha256 = createHash('sha256').update(data).digest('hex');
      // Simulates a concurrent import that stored the same file after our check:
      // the row exists, so the import must report it instead of failing on the unique key.
      const [existing] = await tx
        .insert(importBatches)
        .values(
          batch({ kind: 'revenue', sourceSha256: sha256, sourceFilename: 'venituri2022.xlsx', parserVersion: PARSER_VERSION }),
        )
        .returning({ id: importBatches.id });
      const input = { data, filename: 'venituri2022.xlsx', format: 'xlsx' as const, fiscalYear: 2022, layout: REVENUE_LAYOUT };
      const outcome = await importBudgetFile(tx, input);
      expect(outcome).toEqual({ imported: false, reason: 'already_imported', importId: existing!.id });
    });
  });

  it('re-parses a file imported by an older parser version into a new batch, keeping the old one', async () => {
    await inRollback(async (tx) => {
      const data = readFileSync('data/raw/venituri2022.xlsx');
      const sha256 = createHash('sha256').update(data).digest('hex');
      const [old] = await tx
        .insert(importBatches)
        .values(batch({ kind: 'revenue', sourceSha256: sha256, sourceFilename: 'venituri2022.xlsx', parserVersion: 1 }))
        .returning({ id: importBatches.id });
      const input = { data, filename: 'venituri2022.xlsx', format: 'xlsx' as const, fiscalYear: 2022, layout: REVENUE_LAYOUT };

      const outcome = await importBudgetFile(tx, input);
      expect(outcome).toMatchObject({ imported: true, lines: 64, previousImportId: old!.id });

      const batches = await tx
        .select({ id: importBatches.id, parserVersion: importBatches.parserVersion })
        .from(importBatches)
        .where(eq(importBatches.sourceSha256, sha256))
        .orderBy(importBatches.id);
      expect(batches.map((b) => b.parserVersion)).toEqual([1, PARSER_VERSION]);
    });
  });

  it('stores the raw name fragments', async () => {
    await inRollback(async (tx) => {
      const data = readFileSync('data/raw/cheltuieli2022.xlsx');
      await importBudgetFile(tx, { data, filename: 'cheltuieli2022.xlsx', format: 'xlsx', fiscalYear: 2022, layout: EXPENSE_LAYOUT });
      const [line] = await tx
        .select({ name: expenseLines.name, nameParts: expenseLines.nameParts })
        .from(expenseLines)
        .where(and(eq(expenseLines.sourceRow, 8), eq(expenseLines.block, 'functional')));
      expect(line).toEqual({
        name: 'Servicii publice comunitare de evidenta a persoanelor',
        nameParts: ['Servicii publice comunitare de', 'evidenta a persoanelor'],
      });
    });
  });

  it('imports a real revenue file', async () => {
    await inRollback(async (tx) => {
      const outcome = await importBudgetFile(tx, {
        data: readFileSync('data/raw/venituri2022.xlsx'),
        filename: 'venituri2022.xlsx',
        format: 'xlsx',
        fiscalYear: 2022,
        layout: REVENUE_LAYOUT,
      });
      expect(outcome).toMatchObject({ imported: true, lines: 64 });
      if (outcome.imported) expect(outcome.reconciliation.status).toBe('exact_match');
    });
  });
});
