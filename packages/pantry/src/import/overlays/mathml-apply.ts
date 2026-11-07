/**
 * The MathML apply overlay's rows (spec reading 2, §C's `rowsOf`): from one document's XDM tree and
 * the ids its nodes are written under, the rows of every relation `#pantry/qti/mathml-apply.ts`
 * declares.
 *
 * - **`MathApply`**, one row for every `m:apply` with an element child: its copied `nodeRef` tuple,
 *   its element rank and its element count (the node's own `elements` and `elementChildren`), and
 *   the kind of its first element child as its `operator`.
 * - **`MathArgument`**, one row for every element child after the operator whose kind is none of
 *   Content MathML's qualifier kinds ({@link mathQualifiers}).
 * - **`MathQualifier`**, one row for every `degree`, `momentabout` or `logbase` after the operator of
 *   an application whose operator is a {@link mathHeadOperators} member, with that operator as its
 *   `head`. The row is written for any such pair, listed by the syntax tables or not: the database
 *   refuses the pair it does not list ("MathML head qualifier"). Beside a head that is no built-in
 *   operator nothing is judged, so no row is written.
 *
 * The rows restate what the tree says and nothing else. `MathApply.arguments` and `owned` are
 * drawn by the database from the two families, so no row carries them.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { interactionKinds, nonElementKinds } from "#pantry/grammar/install.ts";
import {
  mathHeadOperators,
  mathHeadQualifiers,
  mathQualifiers,
} from "#pantry/grammar/expression.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { MathApply, MathArgument, MathQualifier } from "#pantry/qti/mathml-apply.ts";

/**
 * A document's apply rows, one keyed set per relation, each keyed by its node's id.
 */
export interface MathmlApplyRows {
  readonly MathApply: ReadonlyMap<string, Addition<typeof MathApply>>;
  readonly MathArgument: ReadonlyMap<string, Addition<typeof MathArgument>>;
  readonly MathQualifier: ReadonlyMap<string, Addition<typeof MathQualifier>>;
}

/**
 * The kinds that are no element: the document node and character data.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The kinds a {@link MathQualifier} row is written for: `degree`, `momentabout` and `logbase`.
 */
const headQualifiers: ReadonlySet<string> = new Set(
  mathHeadQualifiers.map(({ qualifier }) => qualifier),
);

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * its context's, or itself; a child of an interaction's is that interaction; every other node's is
 * its parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's own, its context's; itself where none is given.
 * @returns Each node's nearest interaction, by its id.
 */
const nearestOf = (
  nodes: readonly NodeRow<Composed>[],
  rootNearest: NodeId | undefined,
): ReadonlyMap<NodeId, NodeId> => {
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();

  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    nearest.set(
      node.id,
      interactions.has(kinds.get(node.parent) ?? "")
        ? node.parent
        : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

/**
 * The apply rows of one document.
 *
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under, and its context where it is judged in one.
 * @returns The rows of every relation the apply module declares.
 */
export const rowsOf = (
  tree: XdmDocument<Composed>,
  ids: Pick<NodeIds, "idOf"> & Partial<Pick<NodeIds, "context">>,
): MathmlApplyRows => {
  const { document, nodes } = flatten(tree, ids.idOf);
  const nearest = nearestOf(nodes, ids.context?.nearest);
  // Each element's rank among its parent's element children, 1 for the first (`Node.elements`),
  // and each parent's element children in order (`Node.elementChildren` is their count).
  const rankOf = new Map<NodeId, bigint>();
  const elementsOf = new Map<NodeId, NodeRow<Composed>[]>();
  for (const node of nodes) {
    if (node.parent !== node.id && !nonElements.has(node.kind)) {
      const siblings = elementsOf.get(node.parent) ?? [];
      siblings.push(node);
      elementsOf.set(node.parent, siblings);
      rankOf.set(node.id, BigInt(siblings.length));
    }
  }

  const applications = new Map<string, Addition<typeof MathApply>>();
  const arguments_ = new Map<string, Addition<typeof MathArgument>>();
  const qualifiers = new Map<string, Addition<typeof MathQualifier>>();
  const placed = (node: NodeRow<Composed>) => ({
    document: document.node,
    nearest: nearest.get(node.id) ?? document.node,
    node: node.id,
    parent: node.parent,
    start: node.start,
    version: node.version,
  });

  for (const application of nodes) {
    const children = elementsOf.get(application.id) ?? [];
    const [first, ...rest] = children;
    if (application.kind !== "m:apply" || first === undefined) {
      continue;
    }

    const head = first.kind;
    applications.set(application.id, {
      ...placed(application),
      elementChildren: BigInt(children.length),
      elements: rankOf.get(application.id) ?? 1n,
      kind: application.kind,
      operator: head,
    });

    for (const node of rest) {
      if (!mathQualifiers.has(node.kind)) {
        arguments_.set(node.id, { ...placed(node), kind: node.kind });
      } else if (headQualifiers.has(node.kind) && mathHeadOperators.has(head)) {
        qualifiers.set(node.id, { ...placed(node), head, kind: node.kind });
      }
    }
  }

  return { MathApply: applications, MathArgument: arguments_, MathQualifier: qualifiers };
};
