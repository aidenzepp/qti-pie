/**
 * The MathML share overlay's rows (spec reading 2, §C's `rowsOf`): from one document's XDM tree and
 * the ids its nodes are written under, the rows of every relation `#pantry/qti/mathml-share.ts`
 * declares.
 *
 * - **`MathRank`**, one row for every element a share stands on or names, and for each of its
 *   ancestors up to the nearest `m:math` (the document node, where none holds it): its copied
 *   `nodeRef` tuple, its `rank`, and its parent's as `parentRank`. An element's rank is its height
 *   in the graph of its children and its shares' targets, a leaf being 0, over the elements that
 *   have a row. Where that graph has a cycle, the ranks are those of a depth-first order that
 *   ignores the edge it meets closing the cycle, so some row breaks the law ("MathML share cycle"
 *   when the closing edge is a share's, `E1_derived` when it is a child's) and the database
 *   refuses. The host never refuses.
 * - **`ShareTarget`**, one row for every {@link ShareFragment} whose `id` an {@link IdBinding} names,
 *   keyed by the share: the fragment, the owner of the id as `target`, and the two ranks copied
 *   from the `MathRank` rows. A fragment that names no id has no row, and "Idref target" refuses
 *   it.
 *
 * A target that is no MathML element gets a row as any other element does, with those of its
 * ancestors, which end at an `m:math` only when an `m:math` holds it (an annotation's HTML). A
 * target no `m:math` holds has rows up to the document node, whose own row no rank can satisfy
 * (its parent is itself), so the law refuses a document the oracle accepts; that is the law's
 * gap, not the builder's.
 *
 * The rows restate what the tree says and nothing else. Each element's children are collected in
 * one pass, appended in place, so the work is linear in the document.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { interactionKinds } from "#pantry/grammar/install.ts";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { MathRank, ShareTarget } from "#pantry/qti/mathml-share.ts";

/**
 * A document's share rows, one keyed set per relation, each keyed by its node's id.
 */
export interface MathmlShareRows {
  readonly MathRank: ReadonlyMap<string, Addition<typeof MathRank>>;
  readonly ShareTarget: ReadonlyMap<string, Addition<typeof ShareTarget>>;
}

/**
 * The kind of the root of a MathML tree, whose rank no parent's bounds.
 */
const mathRoot = "m:math";

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

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
 * Collect the elements that hold a row: each share with a target and each target, with their
 * ancestors up to the nearest `m:math` or, where none holds them, the document node.
 *
 * @param byId - A document's node rows by id.
 * @param starts - The nodes the walks start from.
 * @returns The rows' nodes by id, each once.
 */
const rowedOf = (
  byId: ReadonlyMap<NodeId, NodeRow<Composed>>,
  starts: Iterable<NodeId>,
): ReadonlyMap<NodeId, NodeRow<Composed>> => {
  const rowed = new Map<NodeId, NodeRow<Composed>>();
  for (const start of starts) {
    // A node already held has its chain held with it, so the walk stops there.
    for (
      let node = byId.get(start);
      node !== undefined && !rowed.has(node.id);
      node = node.kind === mathRoot || node.parent === node.id ? undefined : byId.get(node.parent)
    ) {
      rowed.set(node.id, node);
    }
  }

  return rowed;
};

/**
 * One node of the depth-first walk that ranks the rows: its edges, how many it has followed, and
 * the rank they give it so far.
 */
interface Frame {
  readonly edges: readonly NodeId[];
  readonly id: NodeId;
  at: number;
  rank: bigint;
}

/**
 * Rank every element that holds a row by its height in the graph of child edges and share edges
 * (a leaf 0), by a depth-first walk that skips an edge to a node still on the walk: that edge
 * closes a cycle, and it is the one the ranks leave broken. The walk keeps its own stack, so a deep
 * document does not exhaust the call stack.
 *
 * @param members - The rowed nodes, in document order, so each parent precedes its children.
 * @param childrenOf - Each rowed node's rowed children, in document order.
 * @param targetOf - Each share's target.
 * @returns Each rowed node's rank.
 */
const ranksOf = (
  members: readonly NodeRow<Composed>[],
  childrenOf: ReadonlyMap<NodeId, readonly NodeId[]>,
  targetOf: ReadonlyMap<NodeId, NodeId>,
): ReadonlyMap<NodeId, bigint> => {
  const ranks = new Map<NodeId, bigint>();
  const open = new Set<NodeId>();
  const stack: Frame[] = [];
  const enter = (id: NodeId): void => {
    const target = targetOf.get(id);
    open.add(id);
    stack.push({
      at: 0,
      edges:
        target === undefined ? (childrenOf.get(id) ?? []) : [...(childrenOf.get(id) ?? []), target],
      id,
      rank: 0n,
    });
  };

  // A node whose parent holds a row is met from the parent, which precedes it, so each walk starts
  // from the top of a chain.
  for (const { id } of members) {
    if (ranks.has(id)) {
      continue;
    }

    enter(id);
    for (let frame = stack.at(-1); frame !== undefined; frame = stack.at(-1)) {
      const next = frame.edges[frame.at];
      if (next === undefined) {
        stack.pop();
        open.delete(frame.id);
        ranks.set(frame.id, frame.rank);

        const above = stack.at(-1);
        if (above !== undefined && above.rank <= frame.rank) {
          above.rank = frame.rank + 1n;
        }

        continue;
      }

      frame.at += 1;
      const held = ranks.get(next);
      if (held !== undefined) {
        frame.rank = held >= frame.rank ? held + 1n : frame.rank;
      } else if (!open.has(next)) {
        enter(next);
      }
    }
  }

  return ranks;
};

/**
 * The share rows of one document.
 *
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under, as the identity builder reads them.
 * @returns The rows of every relation the share module declares.
 */
export const rowsOf = (tree: XdmDocument<Composed>, ids: IdentityIds): MathmlShareRows => {
  const none: MathmlShareRows = { MathRank: new Map(), ShareTarget: new Map() };
  const flat = flatten(tree, ids.idOf);
  // Every share's fragment and every id's owner are the identity builder's rows; a document with
  // no `src` that could be one needs neither.
  if (!flat.attributes.some(({ lexical, name }) => name === "src" && lexical.startsWith("#"))) {
    return none;
  }

  const { IdBinding, ShareFragment } = identityRowsOf(tree, ids);
  const owners = new Map<string, NodeId>();
  for (const { id, owner } of IdBinding.values()) {
    if (!owners.has(id)) {
      owners.set(id, owner);
    }
  }

  const targetOf = new Map<NodeId, NodeId>();
  for (const { id, node } of ShareFragment.values()) {
    const owner = owners.get(id);
    if (owner !== undefined) {
      targetOf.set(node, owner);
    }
  }

  if (targetOf.size === 0) {
    return none;
  }

  const rowed = rowedOf(new Map(flat.nodes.map((node) => [node.id, node] as const)), [
    ...targetOf.keys(),
    ...targetOf.values(),
  ]);
  const members = flat.nodes.filter(({ id }) => rowed.has(id));
  const childrenOf = new Map<NodeId, NodeId[]>();
  for (const { id, parent } of members) {
    if (parent !== id && rowed.has(parent)) {
      const siblings = childrenOf.get(parent);
      if (siblings === undefined) {
        childrenOf.set(parent, [id]);
      } else {
        siblings.push(id);
      }
    }
  }

  const ranks = ranksOf(members, childrenOf, targetOf);
  const nearest = nearestOf(flat.nodes, ids.context?.nearest);
  const document = flat.document.node;
  const rankOf = (node: NodeId): bigint => ranks.get(node) ?? 0n;

  return {
    MathRank: new Map(
      members.map((node) => [
        node.id,
        {
          document,
          kind: node.kind,
          nearest: nearest.get(node.id) ?? document,
          node: node.id,
          parent: node.parent,
          parentRank: rankOf(node.parent),
          rank: rankOf(node.id),
          start: node.start,
          version: node.version,
        },
      ]),
    ),
    ShareTarget: new Map(
      [...ShareFragment.values()].flatMap(({ id, node }) => {
        const target = targetOf.get(node);

        return target === undefined
          ? []
          : [
              [
                node,
                {
                  document,
                  id,
                  node,
                  shareRank: rankOf(node),
                  target,
                  targetRank: rankOf(target),
                },
              ] as const,
            ];
      }),
    ),
  };
};
