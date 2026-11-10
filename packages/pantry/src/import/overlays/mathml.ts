/**
 * The MathML overlays' rows (spec reading 2, §C's `rowsOf`): the four families' builders run over
 * one document and their rows merged, one keyed set per relation `#pantry/qti/mathml.ts` declares.
 */
import type { DocumentView } from "#pantry/import/fold.ts";
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import { rowsOf as alignRowsOf } from "#pantry/import/overlays/mathml-align.ts";
import type { MathmlAlignRows } from "#pantry/import/overlays/mathml-align.ts";
import { rowsOf as applyRowsOf } from "#pantry/import/overlays/mathml-apply.ts";
import type { MathmlApplyRows } from "#pantry/import/overlays/mathml-apply.ts";
import { rowsOf as cnRowsOf } from "#pantry/import/overlays/mathml-cn.ts";
import type { MathmlCnRows } from "#pantry/import/overlays/mathml-cn.ts";
import { rowsOf as shareRowsOf } from "#pantry/import/overlays/mathml-share.ts";
import type { MathmlShareRows } from "#pantry/import/overlays/mathml-share.ts";

/**
 * A document's MathML rows: the four families' rows together, none yet.
 */
export type MathmlRows = MathmlAlignRows & MathmlApplyRows & MathmlCnRows & MathmlShareRows;

/**
 * The MathML rows of one document, from the four families' builders.
 *
 * @param view - The document's view.
 * @param ids - Where it stands in its package, as the share builder reads it.
 * @returns The rows of every MathML relation.
 */
export const mathmlRowsOf = (view: DocumentView, ids: IdentityIds): MathmlRows => ({
  ...applyRowsOf(view),
  ...cnRowsOf(view),
  ...alignRowsOf(view),
  ...shareRowsOf(view, ids),
});
