// Column layout of a budget execution file. The parser never hard-codes column
// positions: it receives a layout (DATA.md §4). The default layouts below match the
// Șura Mare files in data/raw/; a mapping assistant can produce other layouts later.

export type BudgetKind = 'expense' | 'revenue';

export type CodeField = 'capitol' | 'subcapitol' | 'paragraf' | 'titlu' | 'articol' | 'alineat';

export const CODE_FIELDS: readonly CodeField[] = [
  'capitol',
  'subcapitol',
  'paragraf',
  'titlu',
  'articol',
  'alineat',
];

export const EXPENSE_AMOUNT_FIELDS = [
  'credite_angajament_initiale',
  'credite_angajament_definitive',
  'credite_bugetare_initiale',
  'credite_bugetare_definitive',
  'angajamente_bugetare',
  'angajamente_legale',
  'plati_efectuate',
  'angajamente_legale_de_platit',
  'cheltuieli_efective',
] as const;

export const REVENUE_AMOUNT_FIELDS = [
  'prevederi_initiale',
  'prevederi_definitive',
  'drepturi_total',
  'drepturi_ani_precedenti',
  'drepturi_an_curent',
  'incasari_realizate',
  'stingeri_alte_cai',
  'drepturi_contestate',
] as const;

export type ExpenseAmountField = (typeof EXPENSE_AMOUNT_FIELDS)[number];
export type RevenueAmountField = (typeof REVENUE_AMOUNT_FIELDS)[number];
export type AmountField = ExpenseAmountField | RevenueAmountField;

/** Code fields each kind must map. Revenue files have no economic classification. */
const REQUIRED_CODE_FIELDS: Record<BudgetKind, readonly CodeField[]> = {
  expense: CODE_FIELDS,
  revenue: ['capitol', 'subcapitol', 'paragraf'],
};

export interface ColumnLayout {
  kind: BudgetKind;
  /** Rows before the first data row (names row + column-codes row). */
  headerRows: number;
  /** 0-based column index of each code level. */
  codes: Partial<Record<CodeField, number>>;
  /** 0-based column index of "Denumire indicator". */
  name: number;
  /** 0-based column index of each amount. */
  amounts: Partial<Record<AmountField, number>>;
}

export class LayoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutError';
  }
}

export function amountFieldsFor(kind: BudgetKind): readonly AmountField[] {
  if (kind === 'expense') return EXPENSE_AMOUNT_FIELDS;
  if (kind === 'revenue') return REVENUE_AMOUNT_FIELDS;
  throw new LayoutError(`unknown kind "${String(kind)}"`);
}

/** Throws LayoutError when a required field is missing, an index is invalid or two fields share a column. */
export function validateLayout(layout: ColumnLayout): void {
  // A layout may come back from jsonb, so the kind is checked at runtime too.
  if (layout.kind !== 'expense' && layout.kind !== 'revenue') {
    throw new LayoutError(`unknown kind "${String(layout.kind)}"`);
  }
  if (!Number.isInteger(layout.headerRows) || layout.headerRows < 0) {
    throw new LayoutError(`headerRows must be a non-negative integer, got ${layout.headerRows}`);
  }
  const used = new Map<number, string>();
  const claim = (field: string, index: number | undefined) => {
    if (index === undefined) throw new LayoutError(`missing column for "${field}"`);
    if (!Number.isInteger(index) || index < 0) {
      throw new LayoutError(`column for "${field}" must be a non-negative integer, got ${index}`);
    }
    const other = used.get(index);
    if (other) throw new LayoutError(`"${field}" and "${other}" both use column ${index}`);
    used.set(index, field);
  };

  for (const field of REQUIRED_CODE_FIELDS[layout.kind]) claim(field, layout.codes[field]);
  claim('name', layout.name);
  for (const field of amountFieldsFor(layout.kind)) claim(field, layout.amounts[field]);

  const allowedAmounts = new Set<string>(amountFieldsFor(layout.kind));
  for (const field of Object.keys(layout.amounts)) {
    if (!allowedAmounts.has(field)) {
      throw new LayoutError(`"${field}" is not an amount of a ${layout.kind} file`);
    }
  }
  for (const field of Object.keys(layout.codes) as CodeField[]) {
    if (!REQUIRED_CODE_FIELDS[layout.kind].includes(field)) {
      throw new LayoutError(`"${field}" is not a code of a ${layout.kind} file`);
    }
  }
}

/** Layout of data/raw/cheltuieli{2022,2024,2025}.xlsx (DATA.md §4). */
export const EXPENSE_LAYOUT: ColumnLayout = {
  kind: 'expense',
  headerRows: 2,
  codes: { capitol: 0, subcapitol: 1, paragraf: 2, titlu: 3, articol: 4, alineat: 5 },
  name: 6,
  amounts: {
    credite_angajament_initiale: 7,
    credite_angajament_definitive: 8,
    credite_bugetare_initiale: 9,
    credite_bugetare_definitive: 10,
    angajamente_bugetare: 11,
    angajamente_legale: 12,
    plati_efectuate: 13,
    angajamente_legale_de_platit: 14,
    cheltuieli_efective: 15,
  },
};

/** Layout of data/raw/venituri{2022,2024,2025}.xlsx (DATA.md §4). */
export const REVENUE_LAYOUT: ColumnLayout = {
  kind: 'revenue',
  headerRows: 2,
  codes: { capitol: 0, subcapitol: 1, paragraf: 2 },
  name: 6,
  amounts: {
    prevederi_initiale: 7,
    prevederi_definitive: 8,
    drepturi_total: 9,
    drepturi_ani_precedenti: 10,
    drepturi_an_curent: 11,
    incasari_realizate: 12,
    stingeri_alte_cai: 13,
    drepturi_contestate: 14,
  },
};
