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
 * - **{@link ShareTarget}**, one row per `m:share` with a same-document fragment, keyed by the
 *   share's node: its `document` and `id` as {@link ShareFragment} holds them, `target`, the
 *   element that carries the id (an {@link IdBinding} owner), and the two ranks, `shareRank` copied
 *   from the share's {@link MathRank} row and `targetRank` from the target's. `MathML_share_cycle`
 *   is the check over it: the share's rank is above its target's.
 *
 * Every element a cycle runs through has a row: a row's parent has one, so the rows of a share's
 * and a target's ancestors are written up to the root, and a share with a fragment has a
 * {@link ShareTarget} row, both ways. A document with a share and a `MathRank` row its host omits
 * for the share or its target is refused by those containments. The ranks are the host's, and
 * only their order is proved. A target that is no MathML element has no {@link MathRank} row
 * unless the host writes one, and a cycle that crosses a foreign element between two MathML
 * elements is not followed (the phase-6 audit list).
 *
 * Every statement but the check is a restatement of the tree, "E1 derived"; the check is named by
 * its law, as `#pantry/qti/expressions.ts` names `Arity`.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter4.html#contm.share | MathML 3 §4.2.7, share}
 */
import {
  check,
  closedId,
  contained,
  mirrors,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { IdBinding, ShareFragment } from "#pantry/qti/identity.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { nodeRef } from "#pantry/qti/node.ts";

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
 * The {@link MathRank} rows below a chain's top: every row but an `m:math`'s and the document
 * node's (the one node that is its own parent), each tied to its parent's row.
 */
const innerRanks = select(MathRank, (r) => r.and(r.ne(r.kind, "m:math"), r.ne(r.node, r.parent)));

/**
 * The relations the share law declares, each under its own name, as `#pantry/qti/schema.ts`
 * composes them.
 */
export const shareRelations = { MathRank, ShareTarget };

/**
 * Every statement over the module's relations, the check named by its law:
 *
 * - **the ranks:** each row's `nodeRef` tuple proved by containment, and `E1_derived`: an element's
 *   rank is above its parent's for every kind but `m:math`, the root of a tree, and the document
 *   node, which is its own parent and ends the chain of a target no `m:math` holds, and each other
 *   row's `(parent, parentRank)` contained in its parent's `(node, rank)`;
 * - **the targets:** a {@link ShareTarget} row for each {@link ShareFragment} and no other (both
 *   ways), its `target` an owner of its id under {@link IdBinding}, its two ranks copied from the
 *   {@link MathRank} rows of the share and of the target, and `MathML_share_cycle`: the share's
 *   rank is above its target's.
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

  mirrors(on(ShareTarget, "node", "document", "id"), on(ShareFragment, "node", "document", "id")),
  contained(on(ShareTarget, "document", "id", "target"), on(IdBinding, "document", "id", "owner")),
  contained(on(ShareTarget, "node", "shareRank"), on(MathRank, "node", "rank")),
  contained(on(ShareTarget, "target", "targetRank"), on(MathRank, "node", "rank")),
  check("MathML_share_cycle", ShareTarget, (s) => s.gt(s.shareRank, s.targetRank)),
];
