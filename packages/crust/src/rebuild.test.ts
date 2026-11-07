import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter } from "effect";
import { rebuild } from "#crust/rebuild.ts";
import type { Leaf } from "#crust/tour.ts";
import {
  caseHang,
  generatedTree,
  GENERATED_TIMEOUT_MS,
  labelled,
  PLANE_TREES_TO_7,
  planeTreeUpTo,
  situationsOf,
  treeSituations,
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
 * The largest node count the box holds every tree of: the 197 ordered trees of 1 to 7 nodes.
 */
const BOX_NODES = 7;

/**
 * How many rotating cases each run's search compares, beside its floor and steered witnesses, and
 * the bounds each case draws its own within: depth and width small enough for the recursive
 * oracle.
 */
const CASES = 400;

const CASE_BOUNDS: Bounds = { depth: 12, nodes: 64, width: 6 };

describe("rebuild gives the recursive rebuild's tree", () => {
  it.effect(
    `for every plane tree of 1 to ${BOX_NODES} nodes, labelled, exhausted`,
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every plane tree of 1 to 7 nodes, labelled: 197 trees",
            caseHang,
            coverage: noCoverage,
            generator: planeTreeUpTo(BOX_NODES),
            limit: PLANE_TREES_TO_7,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the recursive rebuild of read.ts at 1854123",
            },
            suite: "crust/rebuild/plane-trees",
          },
          ({ nodes, tree }) =>
            Effect.sync(() => {
              agrees(labelled(tree), `a plane tree of ${nodes} nodes`);
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, PLANE_TREES_TO_7);
          }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `for swarmed trees, each within ${CASE_BOUNDS.nodes} nodes, depth ${CASE_BOUNDS.depth} and width ${CASE_BOUNDS.width}: ${CASES} rotating cases a run beside the witnesses`,
    (ctx) =>
      // Bound: the drawn trees, each with its own swarm and bounds within CASE_BOUNDS; the
      // witnesses reach every situation of `treeSituations`.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required(treeSituations, { cases: 200, sense: notesOnly }),
            draw: drawn(generatedTree(CASE_BOUNDS)),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the recursive rebuild of read.ts at 1854123",
            },
            runs: CASES,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "crust/rebuild/trees",
          },
          ({ root }, c) =>
            Effect.sync(() => {
              c.noteAll(situationsOf(root));
              agrees(root, "the drawn tree");
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});
