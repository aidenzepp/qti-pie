/**
 * The MathML share overlay's rows (spec reading 2, §C's `rowsOf`): the rows of every relation
 * `#pantry/qti/mathml-share.ts` declares, in the two scopes a share resolves in (spec reading 117).
 *
 * **A document in no assembly** ({@link rowsOf}), from its XDM tree and the ids its nodes are
 * written under:
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
 * **A document in an assembly** ({@link placedShareRowsOf}), from every document's rows, in a pass
 * over each assembly: its shares are resolved in the assembly, under each instance of their
 * document, and ranked over the assembly's merged graph (below). {@link rowsOf} writes none of
 * their rows.
 *
 * A target that is no MathML element gets a row as any other element does, with those of its
 * ancestors, which end at an `m:math` only when an `m:math` holds it (an annotation's HTML). A
 * target no `m:math` holds has rows up to the document node, the one node that is its own parent:
 * the law frees its rank as it frees an `m:math`'s, so the database accepts what the oracle does.
 *
 * The rows restate what the tree says and nothing else. Each element's children are collected in
 * one pass, appended in place, so the work is linear in the document.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import type { InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { DocumentId, ShareFragment } from "#pantry/qti/identity.ts";
import type {
  MathRank,
  PlacedMathRank,
  PlacedShareTarget,
  ShareTarget,
} from "#pantry/qti/mathml-share.ts";
import { splicingParents, testKind } from "#pantry/qti/tests.ts";
import type { Site } from "#pantry/qti/tests.ts";

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
 * One node of the depth-first walk that ranks the rows: its edges, how many it has followed, the
 * rank they give it so far, and whether its rank bounds the frame below it on the walk's stack.
 */
interface Frame<Key extends string> {
  readonly edges: readonly Key[];
  readonly id: Key;
  readonly lifts: boolean;
  at: number;
  rank: bigint;
}

/**
 * Rank every element that holds a row by its height in the graph of child edges and share edges
 * (a leaf 0), by a depth-first walk that skips an edge to a node still on the walk: that edge
 * closes a cycle, and it is the one the ranks leave broken. The walk keeps its own stack, so a deep
 * document does not exhaust the call stack.
 *
 * Under an assembly the graph also holds the edge from an include's parent element to each
 * top-level element of the document it splices, which no row of the database ties. So that such an
 * edge is never the one that closes a cycle, the walk enters an element an include splices only
 * from the include's parent, whenever that is not yet on the walk or done: a cycle through the
 * include then closes at a child edge or a share edge, which the database proves.
 *
 * @param members - The rowed nodes, each parent before its children and each include's parent
 *   before the elements it splices.
 * @param childrenOf - Each rowed node's edges to its rowed children, in order, and to the elements
 *   an include of it splices.
 * @param targetOf - Each share's target.
 * @param includerOf - Each element an include splices: the include's parent element.
 * @returns Each rowed node's rank.
 */
const ranksOf = <Key extends string>(
  members: readonly Key[],
  childrenOf: ReadonlyMap<Key, readonly Key[]>,
  targetOf: ReadonlyMap<Key, Key>,
  includerOf: ReadonlyMap<Key, Key> = new Map(),
): ReadonlyMap<Key, bigint> => {
  const ranks = new Map<Key, bigint>();
  const open = new Set<Key>();
  const stack: Frame<Key>[] = [];
  const enter = (id: Key, lifts: boolean): void => {
    const target = targetOf.get(id);
    open.add(id);
    stack.push({
      at: 0,
      edges:
        target === undefined ? (childrenOf.get(id) ?? []) : [...(childrenOf.get(id) ?? []), target],
      id,
      lifts,
      rank: 0n,
    });
  };
  const entryOf = (id: Key): Key => {
    let entry = id;
    for (
      let up = includerOf.get(entry);
      up !== undefined && !ranks.has(up) && !open.has(up);
      up = includerOf.get(entry)
    ) {
      entry = up;
    }

    return entry;
  };

  // A node whose parent holds a row is met from the parent, which precedes it, so each walk starts
  // from the top of a chain.
  for (const id of members) {
    while (!ranks.has(id)) {
      const entry = entryOf(id);
      enter(entry, entry === id);
      for (let frame = stack.at(-1); frame !== undefined; frame = stack.at(-1)) {
        const next = frame.edges[frame.at];
        if (next === undefined) {
          stack.pop();
          open.delete(frame.id);
          ranks.set(frame.id, frame.rank);

          const above = stack.at(-1);
          if (frame.lifts && above !== undefined && above.rank <= frame.rank) {
            above.rank = frame.rank + 1n;
          }

          continue;
        }

        const held = ranks.get(next);
        if (held !== undefined) {
          frame.at += 1;
          frame.rank = held >= frame.rank ? held + 1n : frame.rank;
        } else if (open.has(next)) {
          frame.at += 1;
        } else {
          // An element an include splices is entered from the include's parent, and this edge is
          // met again once that walk is done.
          const via = entryOf(next);
          frame.at += via === next ? 1 : 0;
          enter(via, via === next);
        }
      }
    }
  }

  return ranks;
};

/**
 * The share rows of one document in no assembly.
 *
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under, as the identity builder reads them.
 * @returns The {@link MathRank} and {@link ShareTarget} rows; none for a document in an assembly.
 */
export const rowsOf = (tree: XdmDocument<Composed>, ids: IdentityIds): MathmlShareRows => {
  const none: MathmlShareRows = { MathRank: new Map(), ShareTarget: new Map() };
  // A document in an assembly has its shares placed under each instance of it
  // ({@link placedShareRowsOf}), so it has none of its own.
  if (ids.assembled) {
    return none;
  }

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

  const ranks = ranksOf(
    members.map(({ id }) => id),
    childrenOf,
    targetOf,
  );
  const document = flat.document.node;
  const folds = foldOf(flat.nodes, ids.context);
  const rankOf = (node: NodeId): bigint => ranks.get(node) ?? 0n;

  return {
    MathRank: new Map(
      members.map((node) => [
        node.id,
        {
          document,
          kind: node.kind,
          nearest: foldAt(folds, node.id).nearest,
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

/**
 * A package's placed share rows, one keyed set per relation, each keyed by its instance and node as
 * a JSON array.
 */
export interface PlacedShareRows {
  readonly PlacedMathRank: ReadonlyMap<string, Addition<typeof PlacedMathRank>>;
  readonly PlacedShareTarget: ReadonlyMap<string, Addition<typeof PlacedShareTarget>>;
}

/**
 * The text of a row's key: its values in key order, as a JSON array.
 *
 * @param values - The key's values.
 * @returns The key text.
 */
const keyOf = (values: readonly string[]): string => JSON.stringify(values);

/**
 * An include's site as the pass reads it: the include, its parent element and that element's kind.
 */
export type IncludeSite = Pick<Addition<typeof Site>, "node" | "parent" | "parentKind">;

/**
 * An instance as the pass over an assembly reads it: its document, the site it is placed at, and
 * its own children nested ({@link InstanceRoot}'s tree, as it writes it).
 */
interface Placement {
  readonly children: readonly Placement[];
  readonly document: NodeId;
  readonly id: NodeId;
  readonly site: NodeId;
}

/**
 * An assembly's root instance as the pass reads it: its assembly, and the kind of its root.
 */
export type PlacementRoot = Placement & Pick<InstanceRoot, "assembly" | "assemblyKind">;

/**
 * One instance as the pass over an assembly places it: its document, and the include that splices
 * it (the include's parent element, in the instance that holds the include), none for a root and
 * for an instance placed whole at an item ref or a section ref.
 */
interface Seat {
  readonly document: NodeId;
  readonly id: NodeId;
  readonly includer?: { readonly node: NodeId; readonly seat: Seat };
}

/**
 * Collect every instance of an assembly, parents before children, each with its includer.
 *
 * @param root - The assembly's root instance.
 * @param sites - Each include's site by its node.
 * @returns The instances, in pre-order.
 */
const seatsOf = (root: PlacementRoot, sites: ReadonlyMap<NodeId, IncludeSite>): readonly Seat[] => {
  const splicing = new Set<string>(splicingParents);
  const seats: Seat[] = [];
  const stack: { instance: Placement; parent: Seat | undefined }[] = [
    { instance: root, parent: undefined },
  ];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const site = next.parent === undefined ? undefined : sites.get(next.instance.site);
    const seat: Seat =
      next.parent !== undefined && site !== undefined && splicing.has(site.parentKind)
        ? {
            document: next.instance.document,
            id: next.instance.id,
            includer: { node: site.parent, seat: next.parent },
          }
        : { document: next.instance.document, id: next.instance.id };
    seats.push(seat);
    stack.push(
      ...next.instance.children.toReversed().map((instance) => ({ instance, parent: seat })),
    );
  }

  return seats;
};

/**
 * Where an id an assembly binds is held: its owner, the document that holds it, the instance of it
 * the binding is first met at, and the copy the assembly writes it under.
 */
interface Bound {
  readonly copy: NodeId;
  readonly document: NodeId;
  readonly owner: NodeId;
  readonly seat: Seat;
}

/**
 * One share of an instance, resolved: the binding of its id, and the instance that holds its
 * target.
 */
interface Resolved {
  readonly seat: Seat;
  readonly share: Addition<typeof ShareFragment>;
  readonly target: Bound;
  readonly targetSeat: Seat;
}

/**
 * Resolve each share of each instance of an assembly among the assembly's ids.
 *
 * @param seats - The assembly's instances, in pre-order.
 * @param underTest - Whether the assembly's root is a test.
 * @param ids - Each document's IDs.
 * @param shares - Each document's shares.
 * @returns Each share whose id the assembly binds.
 */
const resolvedOf = (
  seats: readonly Seat[],
  underTest: boolean,
  ids: ReadonlyMap<NodeId, readonly Addition<typeof DocumentId>[]>,
  shares: ReadonlyMap<NodeId, readonly Addition<typeof ShareFragment>[]>,
): readonly Resolved[] => {
  const firstOf = new Map<NodeId, Seat>();
  const bound = new Map<string, Bound>();
  for (const seat of seats) {
    if (!firstOf.has(seat.document)) {
      firstOf.set(seat.document, seat);
    }

    for (const { document, id, owner } of ids.get(seat.document) ?? []) {
      if (!bound.has(id)) {
        bound.set(id, { copy: underTest ? document : seat.id, document, owner, seat });
      }
    }
  }

  return seats.flatMap((seat) =>
    (shares.get(seat.document) ?? []).flatMap((share) => {
      const target = bound.get(share.id);

      return target === undefined
        ? []
        : [
            {
              seat,
              share,
              target,
              targetSeat: underTest ? (firstOf.get(target.document) ?? target.seat) : target.seat,
            },
          ];
    }),
  );
};

/**
 * One rowed element: the instance it is under, and its node.
 */
interface Rowed {
  readonly node: NodeRow<Composed>;
  readonly seat: Seat;
}

/**
 * Collect the elements that hold a row in an assembly: each share and each target, with the chain
 * of ancestors up to the nearest `m:math` or, where none holds them, the document node, and from a
 * top-level element of a spliced document on, at the include's parent element.
 *
 * @param resolved - The assembly's resolved shares.
 * @param nodesOf - A document's nodes by id.
 * @returns The rowed elements by their key, each once.
 */
const rowedUnder = (
  resolved: readonly Resolved[],
  nodesOf: (document: NodeId) => ReadonlyMap<NodeId, NodeRow<Composed>>,
): ReadonlyMap<string, Rowed> => {
  const rowed = new Map<string, Rowed>();
  const mark = (start: Seat, at: NodeId): void => {
    let seat = start;
    let node = nodesOf(seat.document).get(at);
    while (node !== undefined) {
      const key = keyOf([seat.id, node.id]);
      if (rowed.has(key)) {
        return;
      }

      rowed.set(key, { node, seat });
      if (node.kind !== mathRoot && node.parent !== node.id) {
        node = nodesOf(seat.document).get(node.parent);
        continue;
      }

      const { includer } = seat;
      if (includer === undefined || (node.id !== seat.document && node.parent !== seat.document)) {
        return;
      }

      node = nodesOf(includer.seat.document).get(includer.node);
      ({ seat } = includer);
    }
  };
  for (const { seat, share, target, targetSeat } of resolved) {
    mark(seat, share.node);
    mark(targetSeat, target.owner);
  }

  return rowed;
};

/**
 * An assembly's merged graph over its rowed elements, as {@link ranksOf} reads it.
 */
interface Graph {
  readonly childrenOf: ReadonlyMap<string, readonly string[]>;
  readonly includerOf: ReadonlyMap<string, string>;
  readonly members: readonly string[];
}

/**
 * Draw the merged graph's edges over the rowed elements: each element's edge to its rowed children,
 * and the edge from an include's parent element to each top-level element of the document it
 * splices. Each instance's elements follow its parent's, in document order.
 *
 * @param seats - The assembly's instances, in pre-order.
 * @param rowed - The rowed elements.
 * @returns The graph.
 */
const graphOf = (seats: readonly Seat[], rowed: ReadonlyMap<string, Rowed>): Graph => {
  const bySeat = Map.groupBy(rowed.values(), ({ seat }) => seat.id);
  const members: string[] = [];
  const childrenOf = new Map<string, string[]>();
  const includerOf = new Map<string, string>();
  const append = (parent: string, child: string): void => {
    const siblings = childrenOf.get(parent);
    if (siblings === undefined) {
      childrenOf.set(parent, [child]);
    } else {
      siblings.push(child);
    }
  };
  for (const seat of seats) {
    const mine = (bySeat.get(seat.id) ?? []).toSorted((a, b) =>
      a.node.start < b.node.start ? -1 : 1,
    );
    for (const { node } of mine) {
      const key = keyOf([seat.id, node.id]);
      const parent = keyOf([seat.id, node.parent]);
      members.push(key);
      if (node.parent !== node.id && rowed.has(parent)) {
        append(parent, key);
      }

      if (
        seat.includer !== undefined &&
        node.parent === seat.document &&
        node.id !== seat.document
      ) {
        const includer = keyOf([seat.includer.seat.id, seat.includer.node]);
        if (rowed.has(includer)) {
          append(includer, key);
          includerOf.set(key, includer);
        }
      }
    }
  }

  return { childrenOf, includerOf, members };
};

/**
 * Build a package's placed share rows (spec reading 117), in a pass over each assembly: each
 * `m:share` of an instance's document is resolved among the assembly's ids, as an IDREF is
 * (`placedIdRowsOf`'s `AssembledId`), and ranked over the assembly's merged graph.
 *
 * - **Resolved**: the first instance, in pre-order, that holds the id, as {@link rowsOf} takes the
 *   first owner of a document's id. The target's instance is that one, and under a test's assembly,
 *   where a document placed twice is written once (reading 86), the first instance of the target's
 *   document. A share whose id the assembly binds nowhere has no row, which "Idref target"
 *   refuses.
 * - **Ranked**: the nodes are each instance's elements, and the edges each instance's child edges,
 *   the edge from an include's parent element to each top-level element of the document the include
 *   splices (the edges the law oracle's merged view follows), and each share's edge to its target.
 *   The rowed elements are those of {@link rowsOf}, per instance, and where a chain's top is a
 *   top-level element of a spliced document the chain continues at the include's parent element. A
 *   fragment placed twice is ranked once per instance, so a cycle only the two assemblies close
 *   together breaks nothing.
 *
 * An assembly none of whose documents holds a share writes nothing, and a document is read only
 * where a share or a target of it has a row.
 *
 * @param input - The package's rows the placements read.
 * @param input.ids - Every document's IDs (the identity builder's `DocumentId`).
 * @param input.instances - Every assembly's root instance, its tree nested.
 * @param input.nodesOf - A document's nodes, each parent before its children.
 * @param input.shares - Every document's {@link ShareFragment} rows.
 * @param input.sites - Every document's include sites.
 * @returns The rows.
 */
export const placedShareRowsOf = (input: {
  readonly ids: Iterable<Addition<typeof DocumentId>>;
  readonly instances: Iterable<PlacementRoot>;
  readonly nodesOf: (document: NodeId) => readonly NodeRow<Composed>[];
  readonly shares: Iterable<Addition<typeof ShareFragment>>;
  readonly sites: Iterable<IncludeSite>;
}): PlacedShareRows => {
  const ranked = new Map<string, Addition<typeof PlacedMathRank>>();
  const targets = new Map<string, Addition<typeof PlacedShareTarget>>();
  const sharesOf = Map.groupBy(input.shares, ({ document }) => document);
  if (sharesOf.size === 0) {
    return { PlacedMathRank: ranked, PlacedShareTarget: targets };
  }

  const idsOf = Map.groupBy(input.ids, ({ document }) => document);
  const sites = new Map([...input.sites].map((site) => [site.node, site] as const));
  const held = new Map<NodeId, ReadonlyMap<NodeId, NodeRow<Composed>>>();
  const byIdOf = (document: NodeId): ReadonlyMap<NodeId, NodeRow<Composed>> => {
    const read = held.get(document);
    if (read !== undefined) {
      return read;
    }

    const nodes = new Map(input.nodesOf(document).map((node) => [node.id, node] as const));
    held.set(document, nodes);

    return nodes;
  };

  for (const root of input.instances) {
    const seats = seatsOf(root, sites);
    const resolved = seats.some(({ document }) => sharesOf.has(document))
      ? resolvedOf(seats, root.assemblyKind === testKind, idsOf, sharesOf)
      : [];
    if (resolved.length === 0) {
      continue;
    }

    const rowed = rowedUnder(resolved, byIdOf);
    const { childrenOf, includerOf, members } = graphOf(seats, rowed);
    const ranks = ranksOf(
      members,
      childrenOf,
      new Map(
        resolved.map(({ seat, share, target, targetSeat }) => [
          keyOf([seat.id, share.node]),
          keyOf([targetSeat.id, target.owner]),
        ]),
      ),
      includerOf,
    );
    const rankOf = (seat: Seat, node: NodeId): bigint => ranks.get(keyOf([seat.id, node])) ?? 0n;
    for (const { node, seat } of rowed.values()) {
      ranked.set(keyOf([seat.id, node.id]), {
        assembly: root.assembly,
        document: seat.document,
        instance: seat.id,
        kind: node.kind,
        node: node.id,
        parent: node.parent,
        parentRank: rankOf(seat, node.parent),
        rank: rankOf(seat, node.id),
      });
    }

    for (const { seat, share, target, targetSeat } of resolved) {
      targets.set(keyOf([seat.id, share.node]), {
        assembly: root.assembly,
        assemblyKind: root.assemblyKind,
        document: seat.document,
        id: share.id,
        instance: seat.id,
        node: share.node,
        shareRank: rankOf(seat, share.node),
        target: target.owner,
        targetCopy: target.copy,
        targetDocument: target.document,
        targetInstance: targetSeat.id,
        targetRank: rankOf(targetSeat, target.owner),
      });
    }
  }

  return { PlacedMathRank: ranked, PlacedShareTarget: targets };
};
