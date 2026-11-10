/**
 * The MathML share law (spec reading 2, MathML 3 validity): the law "MathML share cycle", stated
 * over the elements of a MathML tree and the `m:share` elements that name one of them.
 *
 * "An element may not dominate itself" (MathML 3 §4.2.7): an element dominates its children and,
 * through a `share`, the element its `src` names. grizzle plans no recursion, so the module states
 * the law by a dominance rank. Each element holds a rank above each of its children's, and each
 * `share` holds a rank above its target's. A cycle of those edges would make a rank exceed itself,
 * so every ranking of it breaks one of the two, and the database refuses the document. The host
 * never refuses: it writes the ranks of a depth-first order that ignores the closing edge, and the
 * row of the `share` that closes the cycle breaks the check. The importer refused none of it
 * before: only the law oracle judged it.
 *
 * - **{@link MathRank}**, one row per element a share can dominate or be dominated through, keyed by
 *   its node: its `rank`, and `parentRank`, its parent's rank, copied from the parent's row (the
 *   containment of `(parent, parentRank)` into `(node, rank)`). Every element below an `m:math` has
 *   a parent that is a MathML element (the grammar admits no MathML kind but `m:math` under another
 *   parent), so the parents' rows are written step by step up to the root, an `m:math`, whose
 *   `parentRank` states nothing. A target no `m:math` holds has a chain that ends at the document
 *   node instead, the one node that is its own parent: its row states nothing either. `E1_derived`
 *   holds each of those two tops' rank free and every other row's rank below its `parentRank`.
 * - **{@link ShareTarget}**, one row per `m:share` of a document in no assembly with a same-document
 *   fragment, keyed by the share's node: its `document` and `id` as {@link ShareFragment} holds
 *   them, `target`, the element that carries the id (an {@link IdBinding} owner), and the two
 *   ranks, `shareRank` copied from the share's {@link MathRank} row and `targetRank` from the
 *   target's. `MathML_share_cycle` is the check over it: the share's rank is above its target's.
 *
 * A document in an assembly resolves its shares in its assembly, once per instance (spec reading
 * 117), as its IDREFs do, so the two scopes are stated apart:
 *
 * - **{@link PlacedMathRank}**, {@link MathRank} per instance, keyed by the instance and the node.
 *   The host ranks each assembly's merged graph: each instance's child edges, the edge from an
 *   include's parent element to each top-level element of the instance it splices, and each share's
 *   edge to its target. The database proves the order of the edges it ties, the child edges.
 * - **{@link PlacedShareTarget}**, one row per `m:share` of an assembled document under each instance
 *   of it (`ShareFragment.placements` counts them, and a test document's `instances` is the count
 *   each share must reach), keyed by the instance and the share's node: its `target` resolved over
 *   the assembly's {@link AssembledId} bindings, the instance that holds the target, and the two
 *   ranks copied from {@link PlacedMathRank} under the right instances. Its own
 *   `MathML_share_cycle` check compares them.
 *
 * A fragment placed in two items is ranked once per instance, so share edges that close a cycle
 * only across the two assemblies refuse nothing.
 *
 * Every element a cycle runs through has a row: a row's parent has one, so the rows of a share's
 * and a target's ancestors are written up to the root, and a share with a fragment has a
 * {@link ShareTarget} or {@link PlacedShareTarget} row, both ways. A document with a share and a
 * rank row its host omits for the share or its target is refused by those containments. The ranks
 * are the host's, and only their order is proved. A target that is no MathML element has no
 * {@link MathRank} row unless the host writes one, and a cycle that crosses a foreign element
 * between two MathML elements is not followed (the phase-6 audit list).
 *
 * Every statement but the checks is a restatement of the tree, "E1 derived"; the share check is
 * named by its law, as `#pantry/qti/expressions.ts` names `Arity`.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter4.html#contm.share | MathML 3 §4.2.7, share}
 */
import {
  check,
  closedId,
  contained,
  counted,
  fin,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { AssembledId, IdBinding, ShareFragment } from "#pantry/qti/identity.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { Instance, TestDocument } from "#pantry/qti/tests.ts";
import { testKind } from "#pantry/vocab/terms/tests.ts";

/**
 * One MathML element a share can dominate or be dominated through, keyed by its node.
 *
 * - **the host's:** the `nodeRef` tuple (`node`, `document`, `kind`, `start`, `nearest`, `version`,
 *   `parent`), proved by containment, and `rank`, its dominance rank;
 * - **copied from the parent's row:** `parentRank`, the parent's `rank`. An `m:math` has no MathML
 *   parent, and its `parentRank` is not read.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const MathRank = relation(
  "MathRank",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentRank: natural,
    rank: natural,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One `m:share` whose `src` is a fragment of its own document, keyed by the share's node: the
 * element its fragment names and the two ranks the law compares.
 *
 * - **the host's:** `node`, `document` and `id`, the share's fragment as {@link ShareFragment} holds
 *   it, and `target`, the owner of that id under {@link IdBinding};
 * - **copied from {@link MathRank}:** `shareRank`, the share's rank, and `targetRank`, the target's.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const ShareTarget = relation(
  "ShareTarget",
  {
    document: uuid,
    id: keyText,
    node: uuid,
    shareRank: natural,
    target: uuid,
    targetRank: natural,
  },
  ["node"],
);

/**
 * One MathML element of an instance of an assembly that a placed share stands on or names, or that
 * lies on such an element's chain, keyed by the instance and the element's node. It is
 * {@link MathRank} per instance (spec reading 117): the same element is ranked once under each
 * instance of its document, in that instance's assembly.
 *
 * - **the host's:** the `nodeRef` tuple's `node`, `document`, `kind` and `parent`, proved by
 *   containment, the `instance` and its `assembly`, proved against {@link Instance}, and `rank`,
 *   its dominance rank in its assembly's merged graph;
 * - **copied from the parent's row:** `parentRank`, the parent's `rank` under the same instance. An
 *   `m:math` and the document node have no tied parent, and their `parentRank` is not read.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const PlacedMathRank = relation(
  "PlacedMathRank",
  {
    assembly: uuid,
    document: uuid,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    parent: uuid,
    parentRank: natural,
    rank: natural,
  },
  ["instance", "node"],
);

/**
 * One `m:share` of an assembled document under one instance of it, keyed by the instance and the
 * share's node: the element its fragment names in that instance's assembly and the two ranks the
 * law compares.
 *
 * - **the host's:** `node`, `document` and `id`, the share's fragment as {@link ShareFragment} holds
 *   it, the `instance` with its `assembly` and `assemblyKind`, `target` and `targetCopy`, the
 *   binding of the id in the assembly ({@link AssembledId}'s `owner` and `copy`), and
 *   `targetDocument` and `targetInstance`, the document that holds the target and an instance of it
 *   in the assembly. Outside a test's assembly `targetCopy` is `targetInstance`; under a test's
 *   assembly it is the target's document, written once there (reading 86), and `targetInstance` an
 *   instance of it;
 * - **copied from {@link PlacedMathRank}:** `shareRank`, the share's rank under `instance`, and
 *   `targetRank`, the target's rank under `targetInstance`.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const PlacedShareTarget = relation(
  "PlacedShareTarget",
  {
    assembly: uuid,
    assemblyKind: closedId(NodeKind),
    document: uuid,
    id: keyText,
    instance: uuid,
    node: uuid,
    shareRank: natural,
    target: uuid,
    targetCopy: uuid,
    targetDocument: uuid,
    targetInstance: uuid,
    targetRank: natural,
  },
  ["instance", "node"],
);

/**
 * The {@link MathRank} rows below a chain's top: every row but an `m:math`'s and the document
 * node's (the one node that is its own parent), each tied to its parent's row.
 */
const innerRanks = select(MathRank, (r) => r.and(r.ne(r.kind, "m:math"), r.ne(r.node, r.parent)));

/**
 * The {@link PlacedMathRank} rows below a chain's top, each tied to its parent's row under the same
 * instance.
 */
const innerPlacedRanks = select(PlacedMathRank, (r) =>
  r.and(r.ne(r.kind, "m:math"), r.ne(r.node, r.parent)),
);

/**
 * The shares of a document in an assembly, the ones {@link PlacedShareTarget} places once under
 * each instance.
 */
const assembledShares = select(ShareFragment, (f) => f.eq(f.assembled, true));

/**
 * The shares of a document in no assembly, the ones {@link ShareTarget} holds.
 */
const unassembledShares = select(ShareFragment, (f) => f.eq(f.assembled, false));

/**
 * A share of a document in no assembly resolves: it has its {@link ShareTarget}, whose `target` is
 * an owner of its id under {@link IdBinding}. A share whose id names nothing has none, and this is
 * the one statement it breaks beside "Idref target"'s own, so it is stated under that law (spec
 * reading 2; decision 428): a dangling share is refused by "Idref target" alone, and every share
 * of a document that law accepts has its target, the one the cycle check reads.
 */
export const shareResolution = contained(
  on(unassembledShares, "node", "document", "id"),
  on(ShareTarget, "node", "document", "id"),
);

/**
 * Each share's placements, counted by `ShareFragment.placements`.
 */
export const placedShareFamily = counted(
  on(PlacedShareTarget, "node"),
  fin(ShareFragment, "placements"),
);

/**
 * The relations the share law declares, each under its own name, as `#pantry/qti/schema.ts`
 * composes them.
 */
export const shareRelations = { MathRank, PlacedMathRank, PlacedShareTarget, ShareTarget };

/**
 * Every statement over the module's relations, the check named by its law:
 *
 * - **the ranks:** each row's `nodeRef` tuple proved by containment, and `E1_derived`: an element's
 *   rank is above its parent's for every kind but `m:math`, the root of a tree, and the document
 *   node, which is its own parent and ends the chain of a target no `m:math` holds, and each other
 *   row's `(parent, parentRank)` contained in its parent's `(node, rank)`;
 * - **the targets:** a {@link ShareTarget} row only for a {@link ShareFragment} of a document in no
 *   assembly, and one for each such share that resolves ({@link shareResolution}, under "Idref
 *   target"), its `target` an owner of its id under {@link IdBinding}, its two ranks copied from
 *   the {@link MathRank} rows of the share and of the target, and `MathML_share_cycle`: the share's
 *   rank is above its target's;
 * - **the placed ranks and targets:** the same per instance of an assembled document: each
 *   {@link PlacedMathRank} row's tuple and instance proved by containment, its `(parent,
 *   parentRank)` tied under its instance, a {@link PlacedShareTarget} row for each share under
 *   every instance of its document, its target resolved over {@link AssembledId}, its ranks copied
 *   from the rows under the right instances, and a second `MathML_share_cycle` check.
 */
export const shareLaws = [
  contained(
    on(MathRank, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(innerRanks, "parent", "parentRank"), on(MathRank, "node", "rank")),
  check("E1_derived", MathRank, (r) =>
    r.or(r.eq(r.kind, "m:math"), r.eq(r.node, r.parent), r.lt(r.rank, r.parentRank)),
  ),

  contained(
    on(ShareTarget, "node", "document", "id"),
    on(unassembledShares, "node", "document", "id"),
  ),
  shareResolution,
  contained(on(ShareTarget, "document", "id", "target"), on(IdBinding, "document", "id", "owner")),
  contained(on(ShareTarget, "node", "shareRank"), on(MathRank, "node", "rank")),
  contained(on(ShareTarget, "target", "targetRank"), on(MathRank, "node", "rank")),
  check("MathML_share_cycle", ShareTarget, (s) => s.gt(s.shareRank, s.targetRank)),

  contained(
    on(PlacedMathRank, "node", "document", "kind", "parent"),
    on(Node, "id", "document", "kind", "parent"),
  ),
  contained(
    on(PlacedMathRank, "instance", "document", "assembly"),
    on(Instance, "id", "document", "assembly"),
  ),
  contained(
    on(innerPlacedRanks, "instance", "parent", "parentRank"),
    on(PlacedMathRank, "instance", "node", "rank"),
  ),
  check("E1_derived", PlacedMathRank, (r) =>
    r.or(r.eq(r.kind, "m:math"), r.eq(r.node, r.parent), r.lt(r.rank, r.parentRank)),
  ),

  contained(
    on(PlacedShareTarget, "node", "document", "id"),
    on(ShareFragment, "node", "document", "id"),
  ),
  contained(
    on(PlacedShareTarget, "instance", "document", "assembly", "assemblyKind"),
    on(Instance, "id", "document", "assembly", "assemblyKind"),
  ),
  placedShareFamily,
  contained(on(assembledShares, "document", "placements"), on(TestDocument, "node", "instances")),
  contained(
    on(PlacedShareTarget, "assembly", "id", "target", "targetCopy"),
    on(AssembledId, "assembly", "id", "owner", "copy"),
  ),
  contained(
    on(PlacedShareTarget, "targetInstance", "targetDocument", "assembly"),
    on(Instance, "id", "document", "assembly"),
  ),
  check("E1_derived", PlacedShareTarget, (s) =>
    s.or(
      s.and(s.ne(s.assemblyKind, testKind), s.eq(s.targetCopy, s.targetInstance)),
      s.and(s.eq(s.assemblyKind, testKind), s.eq(s.targetCopy, s.targetDocument)),
    ),
  ),
  contained(
    on(PlacedShareTarget, "instance", "node", "shareRank"),
    on(PlacedMathRank, "instance", "node", "rank"),
  ),
  contained(
    on(PlacedShareTarget, "targetInstance", "target", "targetRank"),
    on(PlacedMathRank, "instance", "node", "rank"),
  ),
  check("MathML_share_cycle", PlacedShareTarget, (s) => s.gt(s.shareRank, s.targetRank)),
];
