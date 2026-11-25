import { describe, expect, it } from 'vitest';
import { AmountCellError, baniToLei, parseAmountCell } from '../../src/lib/money';

describe('parseAmountCell (DATA.md §4.2 rule 5, D-007)', () => {
  it('converts whole lei from numeric cells to bani', () => {
    expect(parseAmountCell(25000)).toBe(2500000n);
    expect(parseAmountCell(0)).toBe(0n);
  });

  it('converts whole lei stored as text to bani', () => {
    expect(parseAmountCell('890')).toBe(89000n);
    expect(parseAmountCell(' 25 ')).toBe(2500n);
  });

  it('keeps legitimate negative values', () => {
    expect(parseAmountCell('-5953')).toBe(-595300n);
    expect(parseAmountCell(-708761)).toBe(-70876100n);
  });

  it('treats an empty cell as 0', () => {
    expect(parseAmountCell(null)).toBe(0n);
    expect(parseAmountCell(undefined)).toBe(0n);
    expect(parseAmountCell('')).toBe(0n);
    expect(parseAmountCell('   ')).toBe(0n);
  });

  it('rejects text that is not a whole number', () => {
    for (const bad of ['abc', '1.890', '1,5', '12a', '--3']) {
      expect(() => parseAmountCell(bad)).toThrow(AmountCellError);
    }
  });

  it('rejects fractional or unsafe numbers', () => {
    expect(() => parseAmountCell(12.5)).toThrow(AmountCellError);
    expect(() => parseAmountCell(Number.NaN)).toThrow(AmountCellError);
    expect(() => parseAmountCell(2 ** 60)).toThrow(AmountCellError);
  });

  it('rejects values that are neither numbers nor text', () => {
    expect(() => parseAmountCell(true)).toThrow(AmountCellError);
  });
});

describe('baniToLei', () => {
  it('formats bani as lei with two decimals', () => {
    expect(baniToLei(1242339100n)).toBe('12423391.00');
    expect(baniToLei(5n)).toBe('0.05');
    expect(baniToLei(-595300n)).toBe('-5953.00');
    expect(baniToLei(-5n)).toBe('-0.05');
  });
});
