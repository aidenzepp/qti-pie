/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The tree guards: every node of a tree is reachable from its root, and the edges under one parent
 * are numbered contiguously from zero.
 */
import { Effect, Schema } from "effect";
import { Rows } from "#qti/import/tree.ts";
import { Edge, Node, Tree, TreeRoot } from "#qti/schema/node.ts";

/**
 * A guard refused the rows.
 */
export class GuardRefusal extends Schema.TaggedError<GuardRefusal>()("GuardRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["reachability", "ordering"]),
}) {}

/**
 * Refuse a tree whose nodes are not all reachable from its root, or whose edges under a parent are
 * not numbered `0..n-1`.
 *
 * Reachability is walked from each `TreeRoot` node through `Edge` rows, parent to child. A node the
 * walk never marks, a child it reaches twice (a ring, or a shared child) and an edge whose parent
 * it never reaches all refuse `reachability`. A parent whose edge positions are not exactly
 * `0..n-1` refuses `ordering`. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every tree passes; fails with the first {@link GuardRefusal} otherwise.
 */
export const treeGuards = Effect.fn("treeGuards")(function* treeGuards(
  rows: Rows,
): Effect.fn.Return<void, GuardRefusal> {
  const nodes = Map.groupBy(Rows.of(rows, Node), (node) => node.tree);
  const edges = Map.groupBy(Rows.of(rows, Edge), (edge) => edge.tree);
  const roots = new Map(Rows.of(rows, TreeRoot).map((root) => [root.tree, root.node]));

  for (const { id: tree } of Rows.of(rows, Tree)) {
    const own = edges.get(tree) ?? [];
    const children = Map.groupBy(own, (edge) => edge.parent);
    const root = roots.get(tree);
    if (root === undefined) {
      yield* new GuardRefusal({
        detail: `Tree ${tree} has no TreeRoot row, so no node of it is reachable.`,
        rule: "reachability",
      });
      continue;
    }

    const reached = new Set<string>([root]);
    const queue = [root];
    for (const parent of queue) {
      for (const edge of children.get(parent) ?? []) {
        if (reached.has(edge.child)) {
          yield* new GuardRefusal({
            detail: `Node ${edge.child} of tree ${tree} is reached twice, the second time from ${parent}.`,
            rule: "reachability",
          });
        }

        reached.add(edge.child);
        queue.push(edge.child);
      }
    }

    const stranded = own.find((edge) => !reached.has(edge.parent));
    if (stranded !== undefined) {
      yield* new GuardRefusal({
        detail: `Edge from ${stranded.parent} to ${stranded.child} in tree ${tree} starts at a node the root does not reach.`,
        rule: "reachability",
      });
    }

    const lost = (nodes.get(tree) ?? []).find((node) => !reached.has(node.id));
    if (lost !== undefined) {
      yield* new GuardRefusal({
        detail: `Node ${lost.id} of tree ${tree} is not reachable from the root ${root}.`,
        rule: "reachability",
      });
    }

    for (const [parent, group] of children) {
      const positions = group.map((edge) => edge.position).toSorted((a, b) => Number(a - b));
      const gap = positions.findIndex((position, index) => position !== BigInt(index));
      if (gap !== -1) {
        yield* new GuardRefusal({
          detail: `Edges under ${parent} in tree ${tree} hold positions ${positions.join(", ")}; expected 0 to ${group.length - 1} with no gap or repeat.`,
          rule: "ordering",
        });
      }
    }
  }
});
