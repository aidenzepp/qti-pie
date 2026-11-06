/**
 * The MathML align overlay's rows (spec reading 2, §C's `rowsOf`): from one document's XDM tree and
 * the ids its nodes are written under, the rows of every relation `#pantry/qti/mathml-align.ts`
 * declares. It declares none yet, so the builder returns none.
 */
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";

/**
 * A document's align rows, one keyed set per relation: none yet.
 */
export type MathmlAlignRows = Record<never, never>;

/**
 * The align rows of one document: none yet.
 *
 * @param _tree - The document's XDM tree.
 * @param _ids - The ids its nodes are written under.
 * @returns The rows of every relation the align module declares.
 */
export const rowsOf = (_tree: XdmDocument<Composed>, _ids: NodeIds): MathmlAlignRows => ({});
