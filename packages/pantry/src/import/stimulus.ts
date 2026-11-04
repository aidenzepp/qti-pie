/**
 * The stimulus document's rows: a `qti-assessment-stimulus` root. This module is the entry the
 * package importer routes that root to.
 */
import { Effect, Option } from "effect";
import type { ItemInput } from "#pantry/import/item.ts";
import { UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { Rows } from "#pantry/import/tree.ts";

/**
 * Write the rows of a stimulus document. Not yet built: every root is refused.
 *
 * @param input - The decoded document and where its package lists it.
 * @param _rows - The rows so far.
 * @returns Never succeeds yet; `UnmodeledVocabulary` naming the document's root.
 */
export const stimulusRows = Effect.fn("import.stimulusRows")(function* stimulusRows(
  input: ItemInput,
  _rows: Rows,
): Effect.fn.Return<{ rows: Rows }, UnmodeledVocabulary> {
  return yield* new UnmodeledVocabulary({
    kind: "element",
    name: input.doc.root.qname,
    parent: Option.none(),
  });
});
