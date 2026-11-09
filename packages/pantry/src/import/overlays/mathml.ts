/**
 * The MathML overlays' rows (spec reading 2, §C's `rowsOf`): the four families' builders run over
 * one document and their rows merged, one keyed set per relation `#pantry/qti/mathml.ts` declares.
 */
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
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
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under.
 * @returns The rows of every MathML relation.
 */
export const mathmlRowsOf = (tree: XdmDocument<Composed>, ids: NodeIds): MathmlRows => ({
  ...applyRowsOf(tree, ids),
  ...cnRowsOf(tree, ids),
  ...alignRowsOf(tree, ids),
  ...shareRowsOf(tree, ids),
});
