import { describe, expect, it } from 'vitest';
import { EXPENSE_LAYOUT, REVENUE_LAYOUT } from '../../src/lib/budget/layout';
import { BudgetParseError, PARSER_VERSION, parseBudgetFile, type ParsedLine } from '../../src/lib/budget/parse';
import { EXPENSE_ROWS, EXPENSE_WIDTH, REVENUE_ROWS, REVENUE_WIDTH, csv, exp } from './helpers';

const expense = () => parseBudgetFile(csv(EXPENSE_ROWS, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT);
const revenue = () => parseBudgetFile(csv(REVENUE_ROWS, REVENUE_WIDTH), 'csv', REVENUE_LAYOUT);
const byRow = (lines: ParsedLine[], row: number) => {
  const line = lines.find((l) => l.sourceRow === row);
  if (!line) throw new Error(`no line at row ${row}`);
  return line;
};

describe('parseBudgetFile — header and amounts', () => {
  it('skips the two header rows and numbers rows as in DATA.md (data starts at row 2)', () => {
    const { kind, lines } = expense();
    expect(kind).toBe('expense');
    expect(lines[0]!.sourceRow).toBe(2);
    expect(lines[0]!.name).toBe('TOTAL CHELTUIELI');
  });

  it('stores every amount of the kind in bani, empty cells as 0', () => {
    const total = expense().lines[0]!;
    expect(total.amounts.credite_bugetare_definitive).toBe(150000n);
    expect(total.amounts.plati_efectuate).toBe(120000n);
    expect(total.amounts.cheltuieli_efective).toBe(0n);
    expect(Object.keys(total.amounts)).toHaveLength(9);
    expect(Object.keys(revenue().lines[0]!.amounts)).toHaveLength(8);
  });

  it('keeps negative values (rule 4)', () => {
    const t85 = expense().lines.find((l) => l.block === 'economic_summary' && l.titlu === '85')!;
    expect(t85.amounts.plati_efectuate).toBe(-1000n);
  });

  it('reports a non-numeric amount with its row and column', () => {
    const rows = [...EXPENSE_ROWS];
    rows[2] = { ...rows[2]!, v: exp('1000', 'abc') };
    let error: unknown;
    try {
      parseBudgetFile(csv(rows, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(BudgetParseError);
    expect((error as BudgetParseError).row).toBe(4);
    expect((error as BudgetParseError).column).toBe(13);
  });

  it('rejects a malformed code', () => {
    const rows = [...EXPENSE_ROWS];
    rows[2] = { ...rows[2]!, c: '51' };
    expect(() => parseBudgetFile(csv(rows, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT)).toThrow(BudgetParseError);
  });
});

describe('parseBudgetFile — split names (rule 3)', () => {
  it('joins name fragments and takes the amounts from the last fragment', () => {
    const sub = byRow(expense().lines, 5);
    expect(sub.name).toBe('Autoritati executive si legislative');
    expect(sub.amounts.plati_efectuate).toBe(90000n);
    expect(expense().lines.some((l) => l.sourceRow === 6)).toBe(false);
  });

  it('keeps the raw name fragments exactly as they are in the file', () => {
    const sub = byRow(expense().lines, 5);
    expect(sub.nameParts).toEqual(['Autoritati executive si', '  legislative ']);
    expect(byRow(expense().lines, 7).nameParts).toEqual(['Autoritati executive']);
  });

  it('exposes the parser version as a positive integer', () => {
    expect(Number.isInteger(PARSER_VERSION) && PARSER_VERSION >= 2).toBe(true);
  });

  it('rejects a data file whose first row has no code', () => {
    const rows = [{ name: 'fragment without code', v: exp('1', '1') }, ...EXPENSE_ROWS];
    expect(() => parseBudgetFile(csv(rows, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT)).toThrow(BudgetParseError);
  });
});

describe('parseBudgetFile — codes (rule 6)', () => {
  it('inherits higher levels and builds dotted functional codes', () => {
    const { lines } = expense();
    expect(byRow(lines, 4).functionalCode).toBe('51.02');
    expect(byRow(lines, 5).functionalCode).toBe('51.02.01');
    const para = byRow(lines, 7);
    expect(para).toMatchObject({ capitol: '5102', subcapitol: '01', paragraf: '03', functionalCode: '51.02.01.03' });
  });

  it('does not open a new chapter when the current chapter code is repeated on a lower-level row', () => {
    const para = byRow(expense().lines, 11);
    expect(para).toMatchObject({ capitol: '6602', subcapitol: '50', paragraf: '50', functionalCode: '66.02.50.50' });
  });

  it('applies the same rule to revenue rows that carry the chapter code', () => {
    const { lines } = revenue();
    expect(byRow(lines, 5)).toMatchObject({ capitol: '0402', subcapitol: '01', functionalCode: '04.02.01' });
    expect(byRow(lines, 6)).toMatchObject({ capitol: '0402', subcapitol: '04', functionalCode: '04.02.04' });
    expect(byRow(lines, 7)).toMatchObject({ capitol: '3702', subcapitol: '03', functionalCode: '37.02.03' });
  });

  it('builds economic codes in the economic blocks', () => {
    const { lines } = expense();
    expect(byRow(lines, 22)).toMatchObject({ block: 'mixed', functionalCode: '51.02', economicCode: '10.01' });
    expect(byRow(lines, 14)).toMatchObject({ block: 'economic_summary', economicCode: '10' });
  });
});

describe('parseBudgetFile — blocks (rule 1)', () => {
  it('splits the expense file at the second 5002', () => {
    const { lines } = expense();
    expect(byRow(lines, 2).block).toBe('functional');
    expect(byRow(lines, 11).block).toBe('functional');
    expect(byRow(lines, 12)).toMatchObject({ block: 'economic_summary', capitol: '5002' });
    expect(byRow(lines, 17).block).toBe('economic_summary');
    expect(byRow(lines, 18).block).toBe('mixed');
    expect(byRow(lines, 27).block).toBe('mixed');
  });

  it('puts every revenue line in the functional block', () => {
    expect(new Set(revenue().lines.map((l) => l.block))).toEqual(new Set(['functional']));
  });

  it('rejects an expense file without exactly two 5002 rows', () => {
    const rows = EXPENSE_ROWS.filter((_, i) => i !== 10);
    expect(() => parseBudgetFile(csv(rows, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT)).toThrow(/5002/);
  });

  it('rejects a revenue file without exactly one 0001 row', () => {
    const rows = REVENUE_ROWS.slice(1);
    expect(() => parseBudgetFile(csv(rows, REVENUE_WIDTH), 'csv', REVENUE_LAYOUT)).toThrow(/0001/);
  });
});

describe('parseBudgetFile — summary and leaf lines (rule 2)', () => {
  it('marks totals, Partea rows and the titlu groups 01, 70, 79, 84 as summary', () => {
    const { lines } = expense();
    const summary = lines.filter((l) => l.isSummary).map((l) => l.sourceRow);
    expect(summary).toEqual([2, 3, 8, 12, 13, 16, 18, 20, 23, 25]);
  });

  it('marks revenue totals 0001-0004 as summary', () => {
    const { lines } = revenue();
    expect(lines.filter((l) => l.isSummary).map((l) => l.sourceRow)).toEqual([2, 3]);
  });

  it('marks lines without children as leaves, never summary lines', () => {
    const { lines } = expense();
    const leaves = lines.filter((l) => l.isLeaf).map((l) => l.sourceRow);
    expect(leaves).toEqual([7, 11, 14, 15, 17, 22, 24, 27]);
    expect(revenue().lines.filter((l) => l.isLeaf).map((l) => l.sourceRow)).toEqual([5, 6, 7, 8]);
  });
});

describe('parseBudgetFile — CSV encoding (Q-005)', () => {
  it('rejects a CSV that is not valid UTF-8', () => {
    const latin1 = new Uint8Array([...new TextEncoder().encode('a,b\n'), 0xe3, 0x2c, 0x0a]);
    expect(() => parseBudgetFile(latin1, 'csv', EXPENSE_LAYOUT)).toThrow(/UTF-8/);
  });

  it('accepts a UTF-8 BOM and normalises names to NFC', () => {
    const rows = [...EXPENSE_ROWS];
    rows[2] = { ...rows[2]!, name: 'AUTORITĂȚI PUBLICE'.normalize('NFD') };
    const bytes = csv(rows, EXPENSE_WIDTH);
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes]);
    const line = byRow(parseBudgetFile(withBom, 'csv', EXPENSE_LAYOUT).lines, 4);
    expect(line.name).toBe('AUTORITĂȚI PUBLICE'.normalize('NFC'));
  });
});
