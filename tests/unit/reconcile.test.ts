import { describe, expect, it } from 'vitest';
import { EXPENSE_LAYOUT, REVENUE_LAYOUT } from '../../src/lib/budget/layout';
import { parseBudgetFile } from '../../src/lib/budget/parse';
import { canPublish, reconcile, statusForDifference } from '../../src/lib/budget/reconcile';
import { EXPENSE_ROWS, EXPENSE_WIDTH, REVENUE_ROWS, REVENUE_WIDTH, csv, exp, type Row } from './helpers';

const parseExpense = (rows: Row[]) => parseBudgetFile(csv(rows, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT);

describe('statusForDifference (D-004)', () => {
  it('is exact_match at 0 bani', () => {
    expect(statusForDifference(0n)).toBe('exact_match');
  });
  it('is rounded_match up to ±100 bani', () => {
    expect(statusForDifference(1n)).toBe('rounded_match');
    expect(statusForDifference(100n)).toBe('rounded_match');
    expect(statusForDifference(-100n)).toBe('rounded_match');
  });
  it('is discrepancy_detected above ±100 bani', () => {
    expect(statusForDifference(101n)).toBe('discrepancy_detected');
    expect(statusForDifference(-101n)).toBe('discrepancy_detected');
  });
});

describe('reconcile', () => {
  it('finds an exact match on a consistent expense file', () => {
    const result = reconcile(parseExpense(EXPENSE_ROWS));
    expect(result.status).toBe('exact_match');
    const kinds = new Set(result.checks.map((c) => c.checkKind));
    expect(kinds).toEqual(new Set(['total_vs_chapters', 'parent_vs_children', 'functional_vs_mixed_total']));
    expect(result.checks.every((c) => c.differenceBani === 0n)).toBe(true);
  });

  it('checks every amount column', () => {
    const result = reconcile(parseExpense(EXPENSE_ROWS));
    const columns = new Set(result.checks.map((c) => c.amountColumn));
    expect(columns.size).toBe(9);
  });

  it('checks the total against the sum of chapters, rule 6 included', () => {
    const check = reconcile(parseExpense(EXPENSE_ROWS)).checks.find(
      (c) => c.checkKind === 'total_vs_chapters' && c.block === 'functional' && c.amountColumn === 'plati_efectuate',
    )!;
    expect(check).toMatchObject({ reportedBani: 120000n, computedBani: 120000n, status: 'exact_match' });
  });

  it('reports a 1 leu difference as rounded_match', () => {
    const rows = [...EXPENSE_ROWS];
    rows[0] = { ...rows[0]!, v: exp('1500', '1201') };
    const result = reconcile(parseExpense(rows));
    expect(result.status).toBe('rounded_match');
    const check = result.checks.find(
      (c) => c.checkKind === 'total_vs_chapters' && c.block === 'functional' && c.amountColumn === 'plati_efectuate',
    )!;
    expect(check).toMatchObject({ reportedBani: 120100n, computedBani: 120000n, differenceBani: 100n });
  });

  it('reports a parent that does not match its children as a discrepancy', () => {
    const rows = [...EXPENSE_ROWS];
    rows[5] = { ...rows[5]!, v: exp('1000', '850') }; // paragraf 51.02.01.03
    const result = reconcile(parseExpense(rows));
    expect(result.status).toBe('discrepancy_detected');
    const check = result.checks.find((c) => c.status === 'discrepancy_detected')!;
    expect(check).toMatchObject({ checkKind: 'parent_vs_children', code: '51.02.01', differenceBani: 5000n });
  });

  it('compares the functional and the economic 5002 totals', () => {
    const rows = [...EXPENSE_ROWS];
    rows[10] = { ...rows[10]!, v: exp('1500', '1100') };
    const result = reconcile(parseExpense(rows));
    const check = result.checks.find(
      (c) => c.checkKind === 'functional_vs_mixed_total' && c.amountColumn === 'plati_efectuate',
    )!;
    expect(check).toMatchObject({ reportedBani: 120000n, computedBani: 110000n, status: 'discrepancy_detected' });
  });

  it('counts a chapter without its own row through its subchapters (rule 7)', () => {
    const file = parseBudgetFile(csv(REVENUE_ROWS, REVENUE_WIDTH), 'csv', REVENUE_LAYOUT);
    const result = reconcile(file);
    expect(result.status).toBe('exact_match');
    const check = result.checks.find(
      (c) => c.checkKind === 'total_vs_chapters' && c.amountColumn === 'incasari_realizate',
    )!;
    expect(check).toMatchObject({ reportedBani: 10000n, computedBani: 10000n });
  });
});

describe('canPublish (D-004)', () => {
  it('allows exact and rounded matches without justification', () => {
    expect(canPublish('exact_match', null)).toBe(true);
    expect(canPublish('rounded_match', undefined)).toBe(true);
  });
  it('blocks a discrepancy without a justification of at least 20 characters', () => {
    expect(canPublish('discrepancy_detected', null)).toBe(false);
    expect(canPublish('discrepancy_detected', 'x'.repeat(19))).toBe(false);
    expect(canPublish('discrepancy_detected', `  ${'x'.repeat(19)}  `)).toBe(false);
  });
  it('allows a discrepancy with a justification of 20 characters', () => {
    expect(canPublish('discrepancy_detected', 'x'.repeat(20))).toBe(true);
  });
});
