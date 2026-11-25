// Imports one budget file: parse, reconcile, store. Never publishes (status `reconciled`).
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { ColumnLayout } from '../lib/budget/layout';
import { parseBudgetFile, type FileFormat, type ParsedLine } from '../lib/budget/parse';
import { reconcile, type ReconciliationResult } from '../lib/budget/reconcile';
import type { Db, Tx } from './client';
import { expenseLines, importBatches, reconciliationChecks, revenueLines } from './schema';

export interface ImportInput {
  data: Uint8Array;
  filename: string;
  format: FileFormat;
  fiscalYear: number;
  layout: ColumnLayout;
}

export type ImportOutcome =
  | { imported: true; importId: number; lines: number; reconciliation: ReconciliationResult }
  | { imported: false; reason: 'already_imported'; importId: number };

const CHUNK = 500;

async function insertChunks<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += CHUNK) await insert(rows.slice(i, i + CHUNK));
}

const a = (line: ParsedLine, field: keyof ParsedLine['amounts']) => line.amounts[field] ?? 0n;

/** `db` may be a transaction: the import then runs in a savepoint (used by the integration tests). */
export async function importBudgetFile(db: Db | Tx, input: ImportInput): Promise<ImportOutcome> {
  const sha256 = createHash('sha256').update(input.data).digest('hex');
  const existing = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(eq(importBatches.sourceSha256, sha256));
  if (existing[0]) return { imported: false, reason: 'already_imported', importId: existing[0].id };

  const parsed = parseBudgetFile(input.data, input.format, input.layout);
  const reconciliation = reconcile(parsed);

  const importId = await db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(importBatches)
      .values({
        kind: parsed.kind,
        fiscalYear: input.fiscalYear,
        sourceFilename: input.filename,
        sourceSha256: sha256,
        columnLayout: input.layout,
        status: 'reconciled',
        reconciliationStatus: reconciliation.status,
        reconciledAt: new Date(),
      })
      .returning({ id: importBatches.id });
    const id = batch!.id;

    const common = (l: ParsedLine) => ({
      importId: id,
      sourceRow: l.sourceRow,
      capitol: l.capitol,
      subcapitol: l.subcapitol,
      paragraf: l.paragraf,
      functionalCode: l.functionalCode,
      name: l.name,
      isSummary: l.isSummary,
      isLeaf: l.isLeaf,
    });

    if (parsed.kind === 'expense') {
      const rows = parsed.lines.map((l) => ({
        ...common(l),
        block: l.block,
        titlu: l.titlu,
        articol: l.articol,
        alineat: l.alineat,
        economicCode: l.economicCode,
        crediteAngajamentInitiale: a(l, 'credite_angajament_initiale'),
        crediteAngajamentDefinitive: a(l, 'credite_angajament_definitive'),
        crediteBugetareInitiale: a(l, 'credite_bugetare_initiale'),
        crediteBugetareDefinitive: a(l, 'credite_bugetare_definitive'),
        angajamenteBugetare: a(l, 'angajamente_bugetare'),
        angajamenteLegale: a(l, 'angajamente_legale'),
        platiEfectuate: a(l, 'plati_efectuate'),
        angajamenteLegaleDePlatit: a(l, 'angajamente_legale_de_platit'),
        cheltuieliEfective: a(l, 'cheltuieli_efective'),
      }));
      await insertChunks(rows, (chunk) => tx.insert(expenseLines).values(chunk));
    } else {
      const rows = parsed.lines.map((l) => ({
        ...common(l),
        prevederiInitiale: a(l, 'prevederi_initiale'),
        prevederiDefinitive: a(l, 'prevederi_definitive'),
        drepturiTotal: a(l, 'drepturi_total'),
        drepturiAniPrecedenti: a(l, 'drepturi_ani_precedenti'),
        drepturiAnCurent: a(l, 'drepturi_an_curent'),
        incasariRealizate: a(l, 'incasari_realizate'),
        stingeriAlteCai: a(l, 'stingeri_alte_cai'),
        drepturiContestate: a(l, 'drepturi_contestate'),
      }));
      await insertChunks(rows, (chunk) => tx.insert(revenueLines).values(chunk));
    }

    const checks = reconciliation.checks.map((c) => ({ importId: id, ...c }));
    await insertChunks(checks, (chunk) => tx.insert(reconciliationChecks).values(chunk));
    return id;
  });

  return { imported: true, importId, lines: parsed.lines.length, reconciliation };
}
