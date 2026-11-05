import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { rebuild } from "#crust/rebuild.ts";
import type { Leaf } from "#crust/rebuild.ts";
import {
  arbitrarySwarm,
  arbitraryTree,
  labelled,
  runSeed,
  GENERATED_TIMEOUT_MS,
  seeded,
  planeTrees,
} from "#crust/test/trees.ts";
import type { Bounds } from "#crust/test/trees.ts";
import type { Attribute, Child, Element } from "#crust/tree.ts";

/**
 * The oracle: the recursive rebuild that `read.ts`'s `applyAttlists` and `restoreReferences` each
 * were at 1854123, with their two per-node rules made parameters. It overflows the stack within a
 * few thousand levels, so the trees below stay far shallower.
 *
 * @param element - The element to rebuild.
 * @param attributesOf - Gives the attributes of an element's rebuilt counterpart.
 * @param leaf - Gives the nodes that stand in a leaf's place.
 * @returns The rebuilt element.
 */
const recursiveRebuild = (
  element: Element,
  attributesOf: (element: Element) => readonly Attribute[],
  leaf: (node: Leaf) => readonly Child[],
): Element => ({
  ...element,
  attributes: attributesOf(element),
  children: element.children.flatMap((child): readonly Child[] =>
    child.kind === "element" ? [recursiveRebuild(child, attributesOf, leaf)] : leaf(child),
  ),
});

/**
 * An attribute rule whose result shows which element it was given and the order of that
 * element's own attributes.
 *
 * @param element - The original element.
 * @returns Its attributes reversed, then one naming the element.
 */
const marked = (element: Element): readonly Attribute[] => [
  ...element.attributes.toReversed(),
  { local: "of", namespace: "", prefix: "", qname: "of", references: [], value: element.qname },
];

/**
 * A leaf rule that gives each kind a different number of stand-ins: a text run becomes two, a
 * processing instruction stays twice, a comment is dropped, and an entity reference becomes text.
 *
 * @param node - The original leaf.
 * @returns The nodes that stand in its place.
 */
const replaced = (node: Leaf): readonly Child[] => {
  switch (node.kind) {
    case "text": {
      return [node, { ...node, value: `${node.value}+` }];
    }
    case "pi": {
      return [node, node];
    }
    case "comment": {
      return [];
    }
    case "entityRef": {
      return [{ cdata: false, kind: "text", value: node.name }];
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Check that `rebuild` gives the recursive rebuild's tree for `root`, under the identity rules and
 * under the marking and replacing ones.
 *
 * @param root - The tree.
 * @param name - What to name the case by in a failure: its seed or its tree.
 */
const agrees = (root: Element, name: string): void => {
  assert.deepStrictEqual(
    rebuild(
      root,
      (element) => element.attributes,
      (node) => [node],
    ),
    root,
    `${name}, identity`,
  );
  assert.deepStrictEqual(
    rebuild(root, marked, replaced),
    recursiveRebuild(root, marked, replaced),
    `${name}, marked and replaced`,
  );
};

/**
 * The largest node count the box holds every tree tree of: the 197 ordered trees of 1 to 7 nodes.
 */
const BOX_NODES = 7;

/**
 * How many random trees each run compares, and their bounds: depth and width small enough for the
 * recursive oracle.
 */
const CASES = 400;

const CASE_BOUNDS: Bounds = { depth: 12, nodes: 64, width: 6 };

describe("rebuild gives the recursive rebuild's tree", () => {
  it.effect(
    `for every plane tree of 1 to ${BOX_NODES} nodes, labelled`,
    () =>
      Effect.sync(() => {
        let compared = 0;
        for (let nodes = 1; nodes <= BOX_NODES; nodes += 1) {
          for (const [index, tree] of planeTrees(nodes).entries()) {
            agrees(labelled(tree), `plane tree ${index} of ${nodes} nodes`);
            compared += 1;
          }
        }

        assert.strictEqual(compared, 197);
      }),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `for ${CASES} swarmed trees of at most ${CASE_BOUNDS.nodes} nodes, depth ${CASE_BOUNDS.depth} and width ${CASE_BOUNDS.width}`,
    () =>
      Effect.gen(function* everyCase() {
        for (let index = 0; index < CASES; index += 1) {
          const seed = `${runSeed}/${index}`;
          const root = yield* seeded(seed, (choices) =>
            arbitraryTree(choices, arbitrarySwarm(choices), CASE_BOUNDS),
          );
          agrees(root, `seed ${seed} (replay: CRUST_SEED=${runSeed})`);
        }
      }),
    GENERATED_TIMEOUT_MS,
  );
});
