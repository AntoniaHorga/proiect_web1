import { describe, expect, it } from 'vitest';
import {
  amountFieldsFor,
  EXPENSE_LAYOUT,
  LayoutError,
  REVENUE_LAYOUT,
  validateLayout,
  type BudgetKind,
  type ColumnLayout,
} from '../../src/lib/budget/layout';
import { parseBudgetFile } from '../../src/lib/budget/parse';
import { EXPENSE_ROWS, EXPENSE_WIDTH, cellsToCsv, csv, toCells } from './helpers';

describe('validateLayout', () => {
  it('accepts the default layouts', () => {
    expect(() => validateLayout(EXPENSE_LAYOUT)).not.toThrow();
    expect(() => validateLayout(REVENUE_LAYOUT)).not.toThrow();
  });

  it('rejects a layout with a missing amount', () => {
    const { plati_efectuate: _, ...amounts } = EXPENSE_LAYOUT.amounts;
    expect(() => validateLayout({ ...EXPENSE_LAYOUT, amounts })).toThrow(LayoutError);
  });

  it('rejects a layout with a missing code column', () => {
    const { titlu: _, ...codes } = EXPENSE_LAYOUT.codes;
    expect(() => validateLayout({ ...EXPENSE_LAYOUT, codes })).toThrow(LayoutError);
  });

  it('rejects two fields on the same column', () => {
    expect(() => validateLayout({ ...EXPENSE_LAYOUT, name: 0 })).toThrow(/both use column 0/);
  });

  it('rejects an amount that does not belong to the kind', () => {
    const amounts = { ...REVENUE_LAYOUT.amounts, plati_efectuate: 20 };
    expect(() => validateLayout({ ...REVENUE_LAYOUT, amounts })).toThrow(LayoutError);
  });

  it('rejects an unknown kind with a LayoutError, e.g. a layout read back from jsonb', () => {
    for (const kind of ['Expense', 'constructor', '__proto__', '']) {
      const layout = { ...EXPENSE_LAYOUT, kind } as unknown as ColumnLayout;
      expect(() => validateLayout(layout)).toThrow(LayoutError);
    }
  });

  it('does not treat an unknown kind as revenue', () => {
    expect(() => amountFieldsFor('Expense' as unknown as BudgetKind)).toThrow(LayoutError);
  });

  it('rejects a negative header row count', () => {
    expect(() => validateLayout({ ...EXPENSE_LAYOUT, headerRows: -1 })).toThrow(LayoutError);
  });

  it('is applied by the parser', () => {
    const bad: ColumnLayout = { ...EXPENSE_LAYOUT, name: 0 };
    expect(() => parseBudgetFile(csv(EXPENSE_ROWS, EXPENSE_WIDTH), 'csv', bad)).toThrow(LayoutError);
  });
});

describe('parser reads columns from the layout', () => {
  it('gives the same lines when the columns are moved and the layout says so', () => {
    const original = parseBudgetFile(csv(EXPENSE_ROWS, EXPENSE_WIDTH), 'csv', EXPENSE_LAYOUT);

    // Move "Denumire indicator" to the first column and shift the codes right by one.
    const moved = toCells(EXPENSE_ROWS, EXPENSE_WIDTH).map((r) => [r[6]!, ...r.slice(0, 6), ...r.slice(7)]);
    const layout: ColumnLayout = {
      ...EXPENSE_LAYOUT,
      name: 0,
      codes: { capitol: 1, subcapitol: 2, paragraf: 3, titlu: 4, articol: 5, alineat: 6 },
    };
    const reparsed = parseBudgetFile(cellsToCsv(moved), 'csv', layout);

    expect(reparsed).toEqual(original);
  });
});
