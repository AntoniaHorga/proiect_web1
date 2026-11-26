// Monetary amounts are integers in bani (D-007): 1 leu = 100 bani.

export class AmountCellError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmountCellError';
  }
}

export const BANI_PER_LEU = 100n;

const WHOLE_LEI = /^-?\d+$/;

/**
 * Parses one amount cell holding whole lei (DATA.md §4.2 rule 5) into bani.
 * Accepts a numeric cell or text of digits (amounts under 1.000 lei are stored as
 * text in the source files); an empty cell is 0. Anything else is an error.
 */
export function parseAmountCell(value: unknown): bigint {
  if (value === null || value === undefined) return 0n;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new AmountCellError(`not a whole number of lei: ${value}`);
    return BigInt(value) * BANI_PER_LEU;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') return 0n;
    if (!WHOLE_LEI.test(text)) throw new AmountCellError(`not a whole number of lei: "${value}"`);
    return BigInt(text) * BANI_PER_LEU;
  }
  throw new AmountCellError(`unexpected cell value: ${String(value)}`);
}

/** Formats bani as lei for display only, e.g. 1234567n -> "12345.67". */
export function baniToLei(bani: bigint): string {
  const sign = bani < 0n ? '-' : '';
  const abs = bani < 0n ? -bani : bani;
  const lei = abs / BANI_PER_LEU;
  const rest = (abs % BANI_PER_LEU).toString().padStart(2, '0');
  return `${sign}${lei}.${rest}`;
}
