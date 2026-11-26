// Parses a budget execution file (XLSX or UTF-8 CSV) into logical lines, applying
// the cleaning rules of DATA.md §4.2. Pure: no I/O, no database.
import * as XLSX from 'xlsx';
import { AmountCellError, parseAmountCell } from '../money';
import {
  amountFieldsFor,
  CODE_FIELDS,
  validateLayout,
  type AmountField,
  type BudgetKind,
  type CodeField,
  type ColumnLayout,
} from './layout';

export type FileFormat = 'xlsx' | 'csv';

/**
 * Version of the parser's output. Any change to what the parser returns for the same
 * file increases it (PATTERN-005), so `db:import` re-parses files stored by an older version.
 * 1: first release. 2: lines carry the raw name fragments (`nameParts`).
 */
export const PARSER_VERSION = 2;

/** functional: first block; economic_summary: from the 2nd `5002` to the first chapter; mixed: chapter × titlu detail. */
export type Block = 'functional' | 'economic_summary' | 'mixed';

export interface ParsedLine {
  /** 0-based row index of the line's first row in the sheet (as in DATA.md). */
  sourceRow: number;
  block: Block;
  capitol: string | null;
  subcapitol: string | null;
  paragraf: string | null;
  titlu: string | null;
  articol: string | null;
  alineat: string | null;
  /** Dotted functional code, e.g. "51.02.01.03". */
  functionalCode: string | null;
  /** Dotted economic code, e.g. "20.01.09". */
  economicCode: string | null;
  name: string;
  /** Raw name fragments exactly as in the file, before joining (DATA.md §4.2 rule 3, Q-007). */
  nameParts: string[];
  /** Aggregating row (DATA.md §4.2 rule 2, plus the total rows): never summed. */
  isSummary: boolean;
  /** Non-summary line with no child line in its block. */
  isLeaf: boolean;
  /** Amounts in bani; every amount field of the layout's kind is present. */
  amounts: Partial<Record<AmountField, bigint>>;
}

export interface ParsedFile {
  kind: BudgetKind;
  lines: ParsedLine[];
}

export class BudgetParseError extends Error {
  constructor(
    message: string,
    /** 0-based row and column, when the error is tied to a cell. */
    readonly row?: number,
    readonly column?: number,
  ) {
    super(row === undefined ? message : `row ${row}${column === undefined ? '' : `, column ${column}`}: ${message}`);
    this.name = 'BudgetParseError';
  }
}

/** Total row of each kind: `5002 TOTAL CHELTUIELI`, `0001 TOTAL VENITURI`. */
const TOTAL_CODE: Record<BudgetKind, string> = { expense: '5002', revenue: '0001' };
/** Number of total rows expected (rule 1: expense files repeat `5002` before the economic part). */
const TOTAL_ROWS: Record<BudgetKind, number> = { expense: 2, revenue: 1 };
/** Titlu groups that aggregate other titluri (rule 2). */
const SUMMARY_TITLU = new Set(['01', '70', '79', '84']);

type Cell = unknown;
type Codes = Record<CodeField, string | null>;

interface Draft {
  sourceRow: number;
  codes: Partial<Codes>;
  nameParts: string[];
  amounts: Partial<Record<AmountField, bigint>>;
  hasAmounts: boolean;
}

export function parseBudgetFile(data: Uint8Array, format: FileFormat, layout: ColumnLayout): ParsedFile {
  validateLayout(layout);
  const rows = readRows(data, format);
  const drafts = mergeFragments(rows, layout);
  const lines = resolveCodes(drafts, layout.kind);
  markLeaves(lines);
  return { kind: layout.kind, lines };
}

/** Reads the first sheet as rows of cells, keeping the sheet's 0-based row index. */
function readRows(data: Uint8Array, format: FileFormat): { index: number; cells: Cell[] }[] {
  let workbook: XLSX.WorkBook;
  if (format === 'csv') {
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(data);
    } catch {
      throw new BudgetParseError('CSV file is not valid UTF-8 (Q-005: only UTF-8 is accepted)');
    }
    // raw: keep every CSV value as text, so codes such as "02" keep their leading zero.
    workbook = XLSX.read(text, { type: 'string', raw: true });
  } else {
    workbook = XLSX.read(data, { type: 'array' });
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName === undefined ? undefined : workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) throw new BudgetParseError('the file has no data sheet');
  const start = XLSX.utils.decode_range(sheet['!ref']).s.r;
  const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null, blankrows: true });
  return matrix.map((cells, i) => ({ index: start + i, cells }));
}

function isEmpty(value: Cell): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

function readCode(value: Cell, field: CodeField, row: number, column: number): string | null {
  if (isEmpty(value)) return null;
  const text = String(value).trim();
  const pattern = field === 'capitol' ? /^\d{4}$/ : /^\d{2}$/;
  if (!pattern.test(text)) {
    throw new BudgetParseError(`invalid ${field} code "${text}"`, row, column);
  }
  return text;
}

/** Rule 3: rows without any code continue the previous line's name; amounts come from the last fragment. */
function mergeFragments(rows: { index: number; cells: Cell[] }[], layout: ColumnLayout): Draft[] {
  const codeFields = CODE_FIELDS.filter((f) => layout.codes[f] !== undefined);
  const amountFields = amountFieldsFor(layout.kind);
  const drafts: Draft[] = [];

  for (const { index, cells } of rows.slice(layout.headerRows)) {
    const codes: Partial<Codes> = {};
    let hasCode = false;
    for (const field of codeFields) {
      const column = layout.codes[field]!;
      const code = readCode(cells[column], field, index, column);
      codes[field] = code;
      if (code !== null) hasCode = true;
    }

    const nameCell = cells[layout.name];
    const name = isEmpty(nameCell) ? '' : String(nameCell);

    const amounts: Partial<Record<AmountField, bigint>> = {};
    let hasAmounts = false;
    for (const field of amountFields) {
      const column = layout.amounts[field]!;
      const cell = cells[column];
      if (!isEmpty(cell)) hasAmounts = true;
      try {
        amounts[field] = parseAmountCell(cell);
      } catch (error) {
        if (error instanceof AmountCellError) throw new BudgetParseError(error.message, index, column);
        throw error;
      }
    }

    if (!hasCode && name === '' && !hasAmounts) continue; // blank row

    const current = drafts[drafts.length - 1];
    if (!hasCode) {
      if (!current) throw new BudgetParseError('the first data row has no budget code', index);
      if (hasAmounts && current.hasAmounts) {
        throw new BudgetParseError('amounts on two fragments of the same line', index);
      }
      current.nameParts.push(name);
      if (hasAmounts) {
        current.amounts = amounts;
        current.hasAmounts = true;
      }
      continue;
    }
    drafts.push({ sourceRow: index, codes, nameParts: [name], amounts, hasAmounts });
  }
  return drafts;
}

function dotted(capitol: string | null, rest: (string | null)[]): string | null {
  if (capitol === null) return null;
  return [`${capitol.slice(0, 2)}.${capitol.slice(2)}`, ...rest.filter((c): c is string => c !== null)].join('.');
}

/** Rules 1, 2 and 6: inherit codes, split the blocks, mark summary lines. */
function resolveCodes(drafts: Draft[], kind: BudgetKind): ParsedLine[] {
  const ctx: Codes = { capitol: null, subcapitol: null, paragraf: null, titlu: null, articol: null, alineat: null };
  const totalCode = TOTAL_CODE[kind];
  let totals = 0;
  let block: Block = 'functional';
  const lines: ParsedLine[] = [];

  for (const draft of drafts) {
    const c = draft.codes;

    if (c.capitol === totalCode) {
      totals += 1;
      if (totals > TOTAL_ROWS[kind]) {
        throw new BudgetParseError(`more than ${TOTAL_ROWS[kind]} "${totalCode}" total rows`, draft.sourceRow);
      }
      if (kind === 'expense' && totals === 2) block = 'economic_summary';
    } else if (block === 'economic_summary' && c.capitol) {
      block = 'mixed';
    }

    if (c.capitol) {
      // Rule 6: the current chapter code repeated on a lower-level row does not open a new chapter.
      const sameChapter = c.capitol === ctx.capitol && Boolean(c.subcapitol || c.paragraf);
      if (!sameChapter) {
        ctx.capitol = c.capitol;
        ctx.subcapitol = ctx.paragraf = ctx.titlu = ctx.articol = ctx.alineat = null;
      }
    }
    if (c.subcapitol) {
      ctx.subcapitol = c.subcapitol;
      ctx.paragraf = null;
    }
    if (c.paragraf) ctx.paragraf = c.paragraf;
    if (c.titlu) {
      ctx.titlu = c.titlu;
      ctx.articol = ctx.alineat = null;
    }
    if (c.articol) {
      ctx.articol = c.articol;
      ctx.alineat = null;
    }
    if (c.alineat) ctx.alineat = c.alineat;

    const titluLevel = ctx.titlu !== null && ctx.articol === null && ctx.alineat === null;
    // Only a row's own chapter code makes it a total or a Partea/grouping row; lines that
    // inherit the chapter (e.g. the titluri after the second 5002) are judged on their titlu.
    const ownChapter = c.capitol ?? null;
    const isSummary =
      (ownChapter !== null &&
        (ownChapter === totalCode || ownChapter.endsWith('00') || ownChapter.startsWith('00'))) ||
      (titluLevel && SUMMARY_TITLU.has(ctx.titlu!));

    const economic = [ctx.titlu, ctx.articol, ctx.alineat].filter((x): x is string => x !== null);
    lines.push({
      sourceRow: draft.sourceRow,
      block,
      ...ctx,
      functionalCode: dotted(ctx.capitol, [ctx.subcapitol, ctx.paragraf]),
      economicCode: economic.length ? economic.join('.') : null,
      name: draft.nameParts.join(' ').replace(/\s+/g, ' ').trim().normalize('NFC'),
      nameParts: [...draft.nameParts],
      isSummary,
      isLeaf: false,
      amounts: draft.amounts,
    });
  }

  if (totals !== TOTAL_ROWS[kind]) {
    throw new BudgetParseError(
      `expected ${TOTAL_ROWS[kind]} "${totalCode}" total row(s), found ${totals}`,
    );
  }
  return lines;
}

/** Code path of a line: capitol, subcapitol, paragraf, titlu, articol, alineat. */
export function codePath(line: ParsedLine): (string | null)[] {
  return [line.capitol, line.subcapitol, line.paragraf, line.titlu, line.articol, line.alineat];
}

/** True when `descendant` sits below `ancestor` in the code hierarchy (same block assumed). */
export function isDescendant(ancestor: ParsedLine, descendant: ParsedLine): boolean {
  const a = codePath(ancestor);
  const d = codePath(descendant);
  let extra = false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== null) {
      if (d[i] !== a[i]) return false;
    } else if (d[i] !== null) {
      extra = true;
    }
  }
  return extra;
}

function markLeaves(lines: ParsedLine[]): void {
  for (const line of lines) {
    if (line.isSummary) continue;
    line.isLeaf = !lines.some((other) => other.block === line.block && !other.isSummary && isDescendant(line, other));
  }
}
