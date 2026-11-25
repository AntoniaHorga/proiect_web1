// npm run db:import — imports data/raw/{cheltuieli,venituri}<year>.xlsx. Never publishes.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createDb } from '../src/db/client';
import { loadEnv, requireEnv } from '../src/db/env';
import { importBudgetFile } from '../src/db/import';
import { EXPENSE_LAYOUT, REVENUE_LAYOUT } from '../src/lib/budget/layout';

const RAW_DIR = 'data/raw';
const FILE_NAME = /^(cheltuieli|venituri)(\d{4})\.xlsx$/;

loadEnv();
const { db, pool } = createDb(requireEnv('DATABASE_URL'));

let failed = false;
try {
  for (const filename of readdirSync(RAW_DIR).sort()) {
    const match = FILE_NAME.exec(filename);
    if (!match) continue;
    const layout = match[1] === 'cheltuieli' ? EXPENSE_LAYOUT : REVENUE_LAYOUT;
    try {
      const outcome = await importBudgetFile(db, {
        data: readFileSync(join(RAW_DIR, filename)),
        filename,
        format: 'xlsx',
        fiscalYear: Number(match[2]),
        layout,
      });
      if (outcome.imported) {
        console.log(`${filename}: ${outcome.lines} lines, ${outcome.reconciliation.status} (import ${outcome.importId})`);
      } else {
        console.log(`${filename}: already imported (import ${outcome.importId}), skipped`);
      }
    } catch (error) {
      failed = true;
      console.error(`${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} finally {
  await pool.end();
}
if (failed) process.exitCode = 1;
