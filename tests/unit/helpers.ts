// Builds small synthetic budget files as UTF-8 CSV, in the column order of the
// default layouts (codes 0-5, name 6, amounts from 7).

export interface Row {
  c?: string; // capitol
  s?: string; // subcapitol
  p?: string; // paragraf
  t?: string; // titlu
  a?: string; // articol
  al?: string; // alineat
  name: string;
  /** amount cells by 0-based column index (lei, as written in the file) */
  v?: Record<number, string>;
}

const HEADER_NAMES = (width: number) => Array.from({ length: width }, (_, i) => `H${i}`);
const HEADER_CODES = (width: number) => Array.from({ length: width }, (_, i) => (i < 7 ? '' : String(i - 6)));

function cell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCells(rows: Row[], width: number): string[][] {
  return rows.map((r) => {
    const cells = Array.from({ length: width }, () => '');
    cells[0] = r.c ?? '';
    cells[1] = r.s ?? '';
    cells[2] = r.p ?? '';
    cells[3] = r.t ?? '';
    cells[4] = r.a ?? '';
    cells[5] = r.al ?? '';
    cells[6] = r.name;
    for (const [col, value] of Object.entries(r.v ?? {})) cells[Number(col)] = value;
    return cells;
  });
}

export function cellsToCsv(cells: string[][]): Uint8Array {
  const width = cells[0]?.length ?? 0;
  const lines = [HEADER_NAMES(width), HEADER_CODES(width), ...cells].map((r) => r.map(cell).join(','));
  return new TextEncoder().encode(lines.join('\n') + '\n');
}

export function csv(rows: Row[], width: number): Uint8Array {
  return cellsToCsv(toCells(rows, width));
}

// Expense amounts used in the fixtures: col 10 = credite bugetare definitive, col 13 = plati efectuate.
export const exp = (def: string | null, plati: string | null): Record<number, string> => {
  const cells: Record<number, string> = {};
  if (def !== null) cells[10] = def;
  if (plati !== null) cells[13] = plati;
  return cells;
};

// Revenue amounts used in the fixtures: col 7 = prevederi initiale, col 12 = incasari realizate.
export const rev = (init: string | null, inc: string | null): Record<number, string> => {
  const cells: Record<number, string> = {};
  if (init !== null) cells[7] = init;
  if (inc !== null) cells[12] = inc;
  return cells;
};

/** A small expense file that reconciles exactly; exercises rules 1, 2, 3, 4 and 6. */
export const EXPENSE_ROWS: Row[] = [
  // functional block
  { c: '5002', name: 'TOTAL CHELTUIELI', v: exp('1500', '1200') },
  { c: '5100', s: '02', name: 'Partea I-a SERVICII PUBLICE GENERALE', v: exp('1000', '900') },
  { c: '5102', name: 'AUTORITATI PUBLICE', v: exp('1000', '900') },
  { s: '01', name: 'Autoritati executive si' },
  { name: '  legislative ', v: exp('1000', '900') },
  { p: '03', name: 'Autoritati executive', v: exp('1000', '900') },
  { c: '6500', s: '02', name: 'Partea III-a CHELTUIELI SOCIAL-CULTURALE', v: exp('500', '300') },
  { c: '6602', name: 'SANATATE', v: exp('500', '300') },
  { s: '50', name: 'Alte cheltuieli in domeniul sanatatii', v: exp('500', '300') },
  { c: '6602', p: '50', name: 'Alte institutii si actiuni sanitare', v: exp('500', '300') },
  // economic summary block
  { c: '5002', name: 'TOTAL CHELTUIELI', v: exp('1500', '1200') },
  { t: '01', name: 'CHELTUIELI CURENTE', v: exp('1500', '1210') },
  { t: '10', name: 'TITLUL I CHELTUIELI DE PERSONAL', v: exp('1000', '910') },
  { t: '20', name: 'TITLUL II BUNURI SI SERVICII', v: exp('500', '300') },
  { t: '84', name: 'PLATI EFECTUATE IN ANII PRECEDENTI', v: exp(null, '-10') },
  { t: '85', name: 'Titlul XXI PLATI EFECTUATE IN ANII PRECEDENTI', v: exp(null, '-10') },
  // mixed block
  { c: '5100', s: '02', name: 'Partea I-a SERVICII PUBLICE GENERALE', v: exp('1000', '900') },
  { c: '5102', name: 'AUTORITATI PUBLICE', v: exp('1000', '900') },
  { t: '01', name: 'CHELTUIELI CURENTE', v: exp('1000', '910') },
  { t: '10', name: 'TITLUL I CHELTUIELI DE PERSONAL', v: exp('1000', '910') },
  { t: '10', a: '01', name: 'Cheltuieli salariale in bani', v: exp('1000', '910') },
  { t: '84', name: 'PLATI EFECTUATE IN ANII PRECEDENTI', v: exp(null, '-10') },
  { t: '85', name: 'Titlul XXI PLATI EFECTUATE IN ANII PRECEDENTI', v: exp(null, '-10') },
  { c: '6500', s: '02', name: 'Partea III-a CHELTUIELI SOCIAL-CULTURALE', v: exp('500', '300') },
  { c: '6602', name: 'SANATATE', v: exp('500', '300') },
  { t: '20', name: 'TITLUL II BUNURI SI SERVICII', v: exp('500', '300') },
];

/** A small revenue file that reconciles exactly; exercises rules 2, 4, 6 and 7. */
export const REVENUE_ROWS: Row[] = [
  { c: '0001', s: '02', name: 'TOTAL VENITURI-BUGET LOCAL', v: rev('100', '100') },
  { c: '0002', name: 'I. VENITURI CURENTE', v: rev('100', '100') },
  { c: '0402', name: 'COTE SI SUME DEFALCATE', v: rev('100', '100') },
  { c: '0402', s: '01', name: 'Cote defalcate din impozitul pe venit', v: rev('60', '60') },
  { s: '04', name: 'Sume alocate din cotele defalcate', v: rev('40', '40') },
  // chapter 37.02 without its own row (rule 7)
  { c: '3702', s: '03', name: 'Varsaminte din sectiunea de functionare (cu semnul minus)', v: rev('-50', '-50') },
  { c: '3702', s: '04', name: 'Varsaminte din sectiunea de functionare', v: rev('50', '50') },
];

export const EXPENSE_WIDTH = 16;
export const REVENUE_WIDTH = 15;
