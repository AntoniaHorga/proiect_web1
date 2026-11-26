// Reconciliation (SCOPE.md §5, D-004): reported totals against totals computed from
// the detail lines, with a tolerance of ±1.00 RON (100 bani).
import { amountFieldsFor, type AmountField } from './layout';
import { isDescendant, type Block, type ParsedFile, type ParsedLine } from './parse';

export type ReconciliationStatus = 'exact_match' | 'rounded_match' | 'discrepancy_detected';

export type CheckKind = 'total_vs_chapters' | 'parent_vs_children' | 'functional_vs_mixed_total';

export interface ReconciliationCheck {
  checkKind: CheckKind;
  block: Block;
  /** Code of the reported line, e.g. "51.02" or "51.02 · 20". */
  code: string;
  sourceRow: number;
  amountColumn: AmountField;
  reportedBani: bigint;
  computedBani: bigint;
  differenceBani: bigint;
  status: ReconciliationStatus;
}

export interface ReconciliationResult {
  status: ReconciliationStatus;
  checks: ReconciliationCheck[];
}

export const TOLERANCE_BANI = 100n;
export const MIN_JUSTIFICATION_LENGTH = 20;

const SEVERITY: Record<ReconciliationStatus, number> = {
  exact_match: 0,
  rounded_match: 1,
  discrepancy_detected: 2,
};

export function statusForDifference(differenceBani: bigint): ReconciliationStatus {
  const abs = differenceBani < 0n ? -differenceBani : differenceBani;
  if (abs === 0n) return 'exact_match';
  if (abs <= TOLERANCE_BANI) return 'rounded_match';
  return 'discrepancy_detected';
}

function label(line: ParsedLine): string {
  return [line.functionalCode, line.economicCode].filter((c) => c !== null).join(' · ');
}

const amount = (line: ParsedLine, field: AmountField): bigint => line.amounts[field] ?? 0n;

/** Non-summary descendants of `parent` that have no other non-summary descendant of `parent` above them. */
function directChildren(parent: ParsedLine, candidates: ParsedLine[]): ParsedLine[] {
  const below = candidates.filter((l) => l !== parent && isDescendant(parent, l));
  return below.filter((child) => !below.some((mid) => mid !== child && isDescendant(mid, child)));
}

/** Non-summary lines with no non-summary ancestor: chapters, or a chapter's subchapters when it has no row (rule 7). */
function topLevel(candidates: ParsedLine[]): ParsedLine[] {
  return candidates.filter((line) => !candidates.some((other) => other !== line && isDescendant(other, line)));
}

export function reconcile(file: ParsedFile): ReconciliationResult {
  const fields = amountFieldsFor(file.kind);
  const checks: ReconciliationCheck[] = [];

  const add = (checkKind: CheckKind, reported: ParsedLine, computed: (field: AmountField) => bigint) => {
    for (const field of fields) {
      const reportedBani = amount(reported, field);
      const computedBani = computed(field);
      const differenceBani = reportedBani - computedBani;
      checks.push({
        checkKind,
        block: reported.block,
        code: label(reported),
        sourceRow: reported.sourceRow,
        amountColumn: field,
        reportedBani,
        computedBani,
        differenceBani,
        status: statusForDifference(differenceBani),
      });
    }
  };
  const sum = (lines: ParsedLine[]) => (field: AmountField) => lines.reduce((s, l) => s + amount(l, field), 0n);

  const blocks: Block[] = ['functional', 'economic_summary', 'mixed'];
  const byBlock = new Map(blocks.map((b) => [b, file.lines.filter((l) => l.block === b)]));
  const detail = new Map(blocks.map((b) => [b, byBlock.get(b)!.filter((l) => !l.isSummary)]));

  // Every line that has children must equal the sum of its direct children.
  for (const block of blocks) {
    for (const parent of byBlock.get(block)!) {
      const children = directChildren(parent, detail.get(block)!);
      if (children.length) add('parent_vs_children', parent, sum(children));
    }
  }

  // The reported total must equal the sum of the top-level lines (chapters).
  const functionalTotal = file.lines[0];
  if (functionalTotal) add('total_vs_chapters', functionalTotal, sum(topLevel(detail.get('functional')!)));

  if (file.kind === 'expense') {
    const economicTotal = byBlock.get('economic_summary')![0];
    if (economicTotal) {
      add('total_vs_chapters', economicTotal, sum(topLevel(detail.get('mixed')!)));
      if (functionalTotal) add('functional_vs_mixed_total', functionalTotal, (f) => amount(economicTotal, f));
    }
  }

  const status = checks.reduce<ReconciliationStatus>(
    (worst, c) => (SEVERITY[c.status] > SEVERITY[worst] ? c.status : worst),
    'exact_match',
  );
  return { status, checks };
}

/** D-004: a discrepancy blocks publication until a justification of at least 20 characters is given. */
export function canPublish(status: ReconciliationStatus, justification: string | null | undefined): boolean {
  if (status !== 'discrepancy_detected') return true;
  return (justification ?? '').trim().length >= MIN_JUSTIFICATION_LENGTH;
}
