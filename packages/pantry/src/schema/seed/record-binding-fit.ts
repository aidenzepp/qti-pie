/**
 * The interactions whose response is a record: a record has no base type, so the pairing has no
 * `BindingFit` row, and these kinds are the only ones that may bind a record variable.
 */
import type { NodeKindHandle } from "#pantry/schema/node.ts";

/**
 * A kind that may bind a record variable.
 */
export interface RecordBindingFitRow {
  readonly interactionKind: NodeKindHandle;
}

/**
 * The record-binding interactions (spec 4.4): text entry and extended text.
 */
export const recordBindingFit: readonly RecordBindingFitRow[] = [
  { interactionKind: "qti-text-entry-interaction" },
  { interactionKind: "qti-extended-text-interaction" },
];
