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
import {
  mathHeadOperators,
  mathHeadQualifiers,
  mathQualifiers,
} from "#pantry/grammar/expression.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import { nonElements } from "#pantry/import/overlays/mathml-tree.ts";
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
 * The kinds a {@link MathQualifier} row is written for: `degree`, `momentabout` and `logbase`.
 */
const headQualifiers: ReadonlySet<string> = new Set(
  mathHeadQualifiers.map(({ qualifier }) => qualifier),
);

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
  const folds = foldOf(nodes, ids.context ?? ownContext(document.node));
  // Each parent's element children in order; their count and each one's rank are the fold's.
  const elementsOf = new Map<NodeId, NodeRow<Composed>[]>();
  for (const node of nodes) {
    if (node.parent !== node.id && !nonElements.has(node.kind)) {
      const siblings = elementsOf.get(node.parent) ?? [];
      siblings.push(node);
      elementsOf.set(node.parent, siblings);
    }
  }

  const applications = new Map<string, Addition<typeof MathApply>>();
  const arguments_ = new Map<string, Addition<typeof MathArgument>>();
  const qualifiers = new Map<string, Addition<typeof MathQualifier>>();
  const placed = (node: NodeRow<Composed>) => ({
    document: document.node,
    nearest: folds.get(node.id)?.nearest ?? document.node,
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
      elementChildren: folds.get(application.id)?.elementChildren ?? 0n,
      elements: folds.get(application.id)?.elements ?? 1n,
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
