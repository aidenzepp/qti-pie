/**
 * What the MathML tree guards share when they read a tree's `Edge` rows: the kinds that are not
 * elements, and the edges grouped under their parent in document order.
 */
import type { Fact, Uuid } from "@bjornpagen/grizzle";
import { Rows } from "#pantry/import/tree.ts";
import { kinds as genericKinds } from "#pantry/schema/kinds/generic.ts";
import { Edge } from "#pantry/schema/node.ts";

/**
 * The kinds of the children that are not elements: text, whitespace, entity references, comments
 * and processing instructions. A content model, a count and an alignment check read element
 * children alone.
 */
export const notElements: ReadonlySet<string> = new Set(genericKinds);

/**
 * Group a tree's edges under their parent, each group in `position` order.
 *
 * @param rows - The rows an import built.
 * @returns The `Edge` rows of each node that has children, by the node's id.
 */
export const edgesByParent = (rows: Rows): Map<Uuid, Fact<typeof Edge>[]> =>
  Map.groupBy(
    Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );
