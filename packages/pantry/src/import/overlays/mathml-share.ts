/**
 * The MathML share overlay's rows (spec reading 2, §C's `rowsOf`): the rows of every relation
 * `#pantry/qti/mathml-share.ts` declares, in the two scopes a share resolves in (spec reading 117).
 *
 * **A document in no assembly** ({@link rowsOf}), from its view (`DocumentView` of
 * `#pantry/import/fold.ts`):
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
 *   keyed by the share: the fragment, the owner of the id as `targetStart`, and the two ranks
 *   copied from the `MathRank` rows. A fragment that names no id has no row, and "Idref target"
 *   refuses it.
 *
 * **A document in an assembly** ({@link placedShareRowsOf}), from every document's rows, in a pass
 * over each assembly: its shares are resolved in the assembly, under each instance of their
 * document, and ranked over the assembly's merged graph (below). {@link rowsOf} writes none of
 * their rows.
 *
 * A target that is no MathML element gets a row as any other element does, with those of its
 * ancestors, which end at an `m:math` only when an `m:math` holds it (an annotation's HTML). A
 * target no `m:math` holds has rows up to the document node, the one node that is its own parent,
 * at position 0:
 * the law frees its rank as it frees an `m:math`'s, so the database accepts what the oracle does.
 *
 * The rows restate what the tree says and nothing else. Each element's children are collected in
 * one pass, appended in place, so the work is linear in the document.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeRow } from "#pantry/model/xdm.ts";
import type { DocumentId, ShareFragment } from "#pantry/qti/identity.ts";
import type {
  MathRank,
  PlacedMathRank,
  PlacedShareTarget,
  ShareTarget,
} from "#pantry/qti/mathml-share.ts";
import type { Site } from "#pantry/qti/tests.ts";
import { splicingParents, testKind } from "#pantry/vocab/terms/tests.ts";

/**
 * A document's share rows, one keyed set per relation, each keyed by its node's
 * `(package, path, start)` as a JSON array ({@link keyOf}).
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
 * The document node's `start`, 0: the copy under which a test's assembly binds an id, since it
 * writes each of its documents once (reading 86).
 */
const documentStart = 0n;

/**
 * The text of a row's key, or of a node's place in a walk: its values in key order, as a JSON
 * array.
 *
 * @param values - The key's values.
 * @returns The key text.
 */
const keyOf = (values: readonly (bigint | string)[]): string => JSON.stringify(values.map(String));

/**
 * Collect the elements that hold a row: each share with a target and each target, with their
 * ancestors up to the nearest `m:math` or, where none holds them, the document node.
 *
 * @param byStart - A document's node rows by `start`.
 * @param starts - The nodes the walks start from.
 * @returns The rows' nodes by `start`, each once.
 */
const rowedOf = (
  byStart: ReadonlyMap<bigint, NodeRow<Composed>>,
  starts: Iterable<bigint>,
): ReadonlyMap<bigint, NodeRow<Composed>> => {
  const rowed = new Map<bigint, NodeRow<Composed>>();
  for (const start of starts) {
    // A node already held has its chain held with it, so the walk stops there.
    for (
      let node = byStart.get(start);
      node !== undefined && !rowed.has(node.start);
      node =
        node.kind === mathRoot || node.parent === node.start ? undefined : byStart.get(node.parent)
    ) {
      rowed.set(node.start, node);
    }
  }

  return rowed;
};

/**
 * One node of the depth-first walk that ranks the rows: its edges, how many it has followed, the
 * rank they give it so far, and whether its rank bounds the frame below it on the walk's stack.
 */
interface Frame<Key> {
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
const ranksOf = <Key>(
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
 * @param view - The document's view.
 * @param ids - Where it stands in its package, as the identity builder reads it.
 * @returns The {@link MathRank} and {@link ShareTarget} rows; none for a document in an assembly.
 */
export const rowsOf = (view: DocumentView, ids: IdentityIds): MathmlShareRows => {
  const none: MathmlShareRows = { MathRank: new Map(), ShareTarget: new Map() };
  // A document in an assembly has its shares placed under each instance of it
  // ({@link placedShareRowsOf}), so it has none of its own.
  if (ids.assembled) {
    return none;
  }

  const flat = view.rows;
  // Every share's fragment and every id's owner are the identity builder's rows; a document with
  // no `src` that could be one needs neither.
  if (!flat.attributes.some(({ lexical, name }) => name === "src" && lexical.startsWith("#"))) {
    return none;
  }

  const { IdBinding, ShareFragment } = identityRowsOf(view, ids);
  const owners = new Map<string, bigint>();
  for (const { id, owner } of IdBinding.values()) {
    if (!owners.has(id)) {
      owners.set(id, owner);
    }
  }

  const targetOf = new Map<bigint, bigint>();
  for (const { id, start } of ShareFragment.values()) {
    const owner = owners.get(id);
    if (owner !== undefined) {
      targetOf.set(start, owner);
    }
  }

  if (targetOf.size === 0) {
    return none;
  }

  const rowed = rowedOf(new Map(flat.nodes.map((node) => [node.start, node] as const)), [
    ...targetOf.keys(),
    ...targetOf.values(),
  ]);
  const members = flat.nodes.filter(({ start }) => rowed.has(start));
  const childrenOf = new Map<bigint, bigint[]>();
  for (const { parent, start } of members) {
    if (parent !== start && rowed.has(parent)) {
      const siblings = childrenOf.get(parent);
      if (siblings === undefined) {
        childrenOf.set(parent, [start]);
      } else {
        siblings.push(start);
      }
    }
  }

  const ranks = ranksOf(
    members.map(({ start }) => start),
    childrenOf,
    targetOf,
  );
  const { folds } = view;
  const rankOf = (start: bigint): bigint => ranks.get(start) ?? 0n;
  const keyTextOf = (start: bigint): string => keyOf([ids.package, ids.path, start]);

  return {
    MathRank: new Map(
      members.map((node) => [
        keyTextOf(node.start),
        {
          kind: node.kind,
          nearest: foldAt(folds, node.start).nearest,
          package: ids.package,
          parent: node.parent,
          parentRank: rankOf(node.parent),
          path: ids.path,
          rank: rankOf(node.start),
          start: node.start,
          version: node.version,
        },
      ]),
    ),
    ShareTarget: new Map(
      [...ShareFragment.values()].flatMap(({ id, start }) => {
        const target = targetOf.get(start);

        return target === undefined
          ? []
          : [
              [
                keyTextOf(start),
                {
                  id,
                  package: ids.package,
                  path: ids.path,
                  shareRank: rankOf(start),
                  start,
                  targetRank: rankOf(target),
                  targetStart: target,
                },
              ] as const,
            ];
      }),
    ),
  };
};

/**
 * A package's placed share rows, one keyed set per relation, each keyed by its instance
 * `(package, assembly, instance)` and its node's `start` as a JSON array.
 */
export interface PlacedShareRows {
  readonly PlacedMathRank: ReadonlyMap<string, Addition<typeof PlacedMathRank>>;
  readonly PlacedShareTarget: ReadonlyMap<string, Addition<typeof PlacedShareTarget>>;
}

/**
 * An include's site as the pass reads it: the include's document and place, its parent element and
 * that element's kind.
 */
export type IncludeSite = Pick<Addition<typeof Site>, "parent" | "parentKind" | "path" | "start">;

/**
 * One instance as the pass over an assembly places it: its document, its position `instance` in
 * the assembly's instance tree, and the include that splices it (the include's parent element, in
 * the instance that holds the include), none for a root and for an instance placed whole at an
 * item ref or a section ref.
 */
interface Seat {
  readonly document: string;
  readonly includer?: { readonly node: bigint; readonly seat: Seat };
  readonly instance: bigint;
}

/**
 * Collect every instance of an assembly, parents before children, each with its includer and its
 * pre-order position, `Instance.start`, as the instance tree draws it: the root 0, then each
 * child's subtree in slot order.
 *
 * @param root - The assembly's root instance.
 * @param sites - Each include's site by its document and place ({@link keyOf}).
 * @returns The instances, in pre-order.
 */
const seatsOf = (root: InstanceRoot, sites: ReadonlyMap<string, IncludeSite>): readonly Seat[] => {
  const splicing = new Set<string>(splicingParents);
  const seats: Seat[] = [];
  const stack: { instance: InstanceMember | InstanceRoot; parent: Seat | undefined }[] = [
    { instance: root, parent: undefined },
  ];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { children, document, site, siteDocument } = next.instance;
    const instance = BigInt(seats.length);
    const included = next.parent === undefined ? undefined : sites.get(keyOf([siteDocument, site]));
    const seat: Seat =
      next.parent !== undefined && included !== undefined && splicing.has(included.parentKind)
        ? { document, includer: { node: included.parent, seat: next.parent }, instance }
        : { document, instance };
    seats.push(seat);
    stack.push(...children.toReversed().map((child) => ({ instance: child, parent: seat })));
  }

  return seats;
};

/**
 * Where an id an assembly binds is held: its owner, the document that holds it, the instance of it
 * the binding is first met at, and the copy the assembly writes it under.
 */
interface Bound {
  readonly copy: bigint;
  readonly document: string;
  readonly owner: bigint;
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
 * @param ids - Each document's IDs, by its path.
 * @param shares - Each document's shares, by its path.
 * @returns Each share whose id the assembly binds.
 */
const resolvedOf = (
  seats: readonly Seat[],
  underTest: boolean,
  ids: ReadonlyMap<string, readonly Addition<typeof DocumentId>[]>,
  shares: ReadonlyMap<string, readonly Addition<typeof ShareFragment>[]>,
): readonly Resolved[] => {
  const firstOf = new Map<string, Seat>();
  const bound = new Map<string, Bound>();
  for (const seat of seats) {
    if (!firstOf.has(seat.document)) {
      firstOf.set(seat.document, seat);
    }

    for (const { id, owner, path } of ids.get(seat.document) ?? []) {
      if (!bound.has(id)) {
        bound.set(id, {
          copy: underTest ? documentStart : seat.instance,
          document: path,
          owner,
          seat,
        });
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
 * The text of an element's place in an assembly's walk: its instance and its `start`.
 *
 * @param seat - The instance.
 * @param start - The element's `start` in the instance's document.
 * @returns The place's text.
 */
const placeOf = (seat: Seat, start: bigint): string => keyOf([seat.instance, start]);

/**
 * Collect the elements that hold a row in an assembly: each share and each target, with the chain
 * of ancestors up to the nearest `m:math` or, where none holds them, the document node, and from a
 * top-level element of a spliced document on, at the include's parent element.
 *
 * @param resolved - The assembly's resolved shares.
 * @param nodesOf - A document's nodes by `start`, the document named by its path.
 * @returns The rowed elements by their place ({@link placeOf}), each once.
 */
const rowedUnder = (
  resolved: readonly Resolved[],
  nodesOf: (document: string) => ReadonlyMap<bigint, NodeRow<Composed>>,
): ReadonlyMap<string, Rowed> => {
  const rowed = new Map<string, Rowed>();
  const mark = (start: Seat, at: bigint): void => {
    let seat = start;
    let node = nodesOf(seat.document).get(at);
    while (node !== undefined) {
      const key = placeOf(seat, node.start);
      if (rowed.has(key)) {
        return;
      }

      rowed.set(key, { node, seat });
      if (node.kind !== mathRoot && node.parent !== node.start) {
        node = nodesOf(seat.document).get(node.parent);
        continue;
      }

      const { includer } = seat;
      if (
        includer === undefined ||
        (node.start !== documentStart && node.parent !== documentStart)
      ) {
        return;
      }

      node = nodesOf(includer.seat.document).get(includer.node);
      ({ seat } = includer);
    }
  };
  for (const { seat, share, target, targetSeat } of resolved) {
    mark(seat, share.start);
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
  const bySeat = Map.groupBy(rowed.values(), ({ seat }) => seat.instance);
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
    const mine = (bySeat.get(seat.instance) ?? []).toSorted((a, b) =>
      a.node.start < b.node.start ? -1 : 1,
    );
    for (const { node } of mine) {
      const key = placeOf(seat, node.start);
      const parent = placeOf(seat, node.parent);
      members.push(key);
      if (node.parent !== node.start && rowed.has(parent)) {
        append(parent, key);
      }

      if (
        seat.includer !== undefined &&
        node.parent === documentStart &&
        node.start !== documentStart
      ) {
        const includer = placeOf(seat.includer.seat, seat.includer.node);
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
 * @param input.nodesOf - A document's nodes by its path, each parent before its children.
 * @param input.shares - Every document's {@link ShareFragment} rows.
 * @param input.sites - Every document's include sites.
 * @returns The rows.
 */
export const placedShareRowsOf = (input: {
  readonly ids: Iterable<Addition<typeof DocumentId>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly nodesOf: (path: string) => readonly NodeRow<Composed>[];
  readonly shares: Iterable<Addition<typeof ShareFragment>>;
  readonly sites: Iterable<IncludeSite>;
}): PlacedShareRows => {
  const ranked = new Map<string, Addition<typeof PlacedMathRank>>();
  const targets = new Map<string, Addition<typeof PlacedShareTarget>>();
  const sharesOf = Map.groupBy(input.shares, ({ path }) => path);
  if (sharesOf.size === 0) {
    return { PlacedMathRank: ranked, PlacedShareTarget: targets };
  }

  const idsOf = Map.groupBy(input.ids, ({ path }) => path);
  const sites = new Map(
    [...input.sites].map((site) => [keyOf([site.path, site.start]), site] as const),
  );
  const held = new Map<string, ReadonlyMap<bigint, NodeRow<Composed>>>();
  const byStartOf = (path: string): ReadonlyMap<bigint, NodeRow<Composed>> => {
    const read = held.get(path);
    if (read !== undefined) {
      return read;
    }

    const nodes = new Map(input.nodesOf(path).map((node) => [node.start, node] as const));
    held.set(path, nodes);

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

    const rowed = rowedUnder(resolved, byStartOf);
    const { childrenOf, includerOf, members } = graphOf(seats, rowed);
    const ranks = ranksOf(
      members,
      childrenOf,
      new Map(
        resolved.map(({ seat, share, target, targetSeat }) => [
          placeOf(seat, share.start),
          placeOf(targetSeat, target.owner),
        ]),
      ),
      includerOf,
    );
    const rankOf = (seat: Seat, start: bigint): bigint => ranks.get(placeOf(seat, start)) ?? 0n;
    const { assembly, assemblyKind } = root;
    const keyTextOf = (seat: Seat, start: bigint): string =>
      keyOf([root.package, assembly, seat.instance, start]);
    for (const { node, seat } of rowed.values()) {
      ranked.set(keyTextOf(seat, node.start), {
        assembly,
        instance: seat.instance,
        kind: node.kind,
        package: root.package,
        parent: node.parent,
        parentRank: rankOf(seat, node.parent),
        path: seat.document,
        rank: rankOf(seat, node.start),
        start: node.start,
      });
    }

    for (const { seat, share, target, targetSeat } of resolved) {
      targets.set(keyTextOf(seat, share.start), {
        assembly,
        assemblyKind,
        id: share.id,
        instance: seat.instance,
        package: root.package,
        path: seat.document,
        shareRank: rankOf(seat, share.start),
        start: share.start,
        target: target.document,
        targetCopy: target.copy,
        targetInstance: targetSeat.instance,
        targetRank: rankOf(targetSeat, target.owner),
        targetStart: target.owner,
      });
    }
  }

  return { PlacedMathRank: ranked, PlacedShareTarget: targets };
};
