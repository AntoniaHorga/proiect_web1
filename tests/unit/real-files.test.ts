// The six official Șura Mare files (data/raw/) must parse and reconcile to the ban.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXPENSE_LAYOUT, REVENUE_LAYOUT } from '../../src/lib/budget/layout';
import { parseBudgetFile, type ParsedFile } from '../../src/lib/budget/parse';
import { reconcile } from '../../src/lib/budget/reconcile';

const load = (name: string): ParsedFile => {
  const layout = name.startsWith('cheltuieli') ? EXPENSE_LAYOUT : REVENUE_LAYOUT;
  return parseBudgetFile(readFileSync(new URL(`../../data/raw/${name}.xlsx`, import.meta.url)), 'xlsx', layout);
};

const FILES = ['cheltuieli2022', 'cheltuieli2024', 'cheltuieli2025', 'venituri2022', 'venituri2024', 'venituri2025'];

// Reported totals (lei) read from the files: plati efectuate / incasari realizate.
const TOTALS: Record<string, number> = {
  cheltuieli2022: 12423391,
  cheltuieli2024: 18645261,
  cheltuieli2025: 21940279,
  venituri2022: 11367548,
  venituri2024: 17788969,
  venituri2025: 20782961,
};

describe.each(FILES)('%s.xlsx', (name) => {
  const file = load(name);
  const result = reconcile(file);

  it('reconciles exactly on every check', () => {
    const failing = result.checks.filter((c) => c.status !== 'exact_match');
    expect(failing).toEqual([]);
    expect(result.status).toBe('exact_match');
  });

  it('runs total and parent checks', () => {
    const kinds = new Set(result.checks.map((c) => c.checkKind));
    expect(kinds.has('total_vs_chapters')).toBe(true);
    expect(kinds.has('parent_vs_children')).toBe(true);
    if (file.kind === 'expense') expect(kinds.has('functional_vs_mixed_total')).toBe(true);
  });

  it('reads the reported total', () => {
    const total = file.lines[0]!;
    const amount = file.kind === 'expense' ? total.amounts.plati_efectuate : total.amounts.incasari_realizate;
    expect(amount).toBe(BigInt(TOTALS[name]!) * 100n);
  });
});

describe('known values', () => {
  it('keeps the -5.953 lei recovered payments in 2022 (titlu 85)', () => {
    const line = load('cheltuieli2022').lines.find((l) => l.block === 'economic_summary' && l.titlu === '85')!;
    expect(line.amounts.plati_efectuate).toBe(-595300n);
  });

  it('keeps the -708.761 lei transfer at 37.02.03 in 2025', () => {
    const line = load('venituri2025').lines.find((l) => l.functionalCode === '37.02.03')!;
    expect(line.amounts.incasari_realizate).toBe(-70876100n);
    expect(line.name).toContain('cu semnul minus');
  });

  it('applies rule 6 to 66.02.50.50 in 2022', () => {
    const line = load('cheltuieli2022').lines.find((l) => l.block === 'functional' && l.sourceRow === 28)!;
    expect(line.functionalCode).toBe('66.02.50.50');
  });
});
