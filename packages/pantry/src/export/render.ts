/**
 * The export's last step, with no database: one document's XML written from the rows its scan
 * delivered (`#pantry/export/scan.ts` `documentScan`), assembled with one stack and written by
 * `unshred` in its export charset. The export runs it for each document of a package
 * (`#pantry/export/package.ts`), and an app outside this package runs it over the rows its own
 * workload's scan read, paged by `scannedRows` of `#pantry/export/pages.ts` as the export pages it.
 */
import { Array as Arr, Effect } from "effect";
import { addRow, assembleScan, emptyScan } from "#pantry/export/pages.ts";
import type { DocumentKey, Scan, ScanRow } from "#pantry/export/pages.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { names } from "#pantry/model/names.ts";
import { unshred } from "#pantry/model/unshred.ts";

/**
 * Write a document from the rows its whole scan folded.
 *
 * @param document - The document's key, its package's manifest identifier and its path, which its
 *   scan was filtered by.
 * @param scan - The rows the whole scan folded (`#pantry/export/pages.ts` `addRow`).
 * @returns The document's bytes in its export charset. Fails with `assemble`'s refusal of rows that
 *   are not one document's, `DocumentRowCount`, or the encoder's error for a document its charset
 *   cannot write.
 */
export const scanXml = Effect.fn("export.scanXml")(function* scanXml(
  document: DocumentKey,
  scan: Scan<Composed>,
) {
  const assembled = yield* Effect.fromResult(assembleScan(document, scan));

  return yield* unshred(assembled, names);
});

/**
 * Write a document from every row of its scan, in any order and cut into any pages, since each row
 * is folded by its own key (`#pantry/export/pages.ts`).
 *
 * @param document - The document's key, which its scan was filtered by.
 * @param rows - Every row the scan delivered.
 * @returns The document's bytes in its export charset, failing as {@link scanXml} does.
 */
export const documentXml = (document: DocumentKey, rows: Iterable<ScanRow<Composed>>) =>
  scanXml(document, Arr.reduce(rows, emptyScan<Composed>(), addRow));
