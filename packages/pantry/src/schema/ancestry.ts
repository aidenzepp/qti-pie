/**
 * What each ancestry admits: the `AncestryStep` rows that say which node kinds may sit at an
 * ancestry and which ancestry their children then sit at, and the two statements that read them.
 *
 * The ban and the step are both containments into `AncestryStep`: a node whose kind has no row at
 * its ancestry is refused, and so is an edge whose child ancestry is not the row's `next` for its
 * parent. The rows are derived in `seed/ancestry.ts`; this module only declares the relation and
 * the statements, because a statement that reads a leaf relation lives in the leaf's module, never
 * in one the composed schema already spreads.
 */
import { closedId, contained, on, relation } from "@bjornpagen/grizzle";
import { Ancestry, Edge, Node, NodeKind } from "#pantry/schema/node.ts";

/**
 * One kind that may sit at one ancestry, and the ancestry its children sit at. Seeded by a custom
 * migration and read-only to every role; a pair with no row is banned.
 */
export const AncestryStep = relation(
  "AncestryStep",
  { ancestry: closedId(Ancestry), kind: closedId(NodeKind), next: closedId(Ancestry) },
  ["ancestry", "kind"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = { AncestryStep };

/**
 * No arms: `AncestryStep` is not keyed by a node.
 */
export const arms = {};

/**
 * The statements over `AncestryStep`: every node's kind has a row at its ancestry, and every
 * edge's parent kind at its parent ancestry steps to its child ancestry.
 */
export const rules = [
  contained(on(Node, "ancestry", "kind"), on(AncestryStep, "ancestry", "kind")),
  contained(
    on(Edge, "parentAncestry", "parentKind", "childAncestry"),
    on(AncestryStep, "ancestry", "kind", "next"),
  ),
] as const;
