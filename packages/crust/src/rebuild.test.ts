import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Result } from "effect";
import { rebuild } from "#crust/rebuild.ts";
import type { Opened } from "#crust/rebuild.ts";
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
import type { Child, Element } from "#crust/tree.ts";

/**
 * The oracle: the recursive rebuild that `read.ts`'s `applyAttlists` and `restoreReferences` each
 * were at 1854123, with their two per-node rules made parameters, a context threaded down and the
 * first failure in document order kept. It overflows the stack within a few thousand levels, so the
 * trees below stay far shallower.
 *
 * @param element - The element to rebuild.
 * @param scope - The context it is opened in.
 * @param open - Gives an element's counterpart and its children's context, or a failure.
 * @param leaf - Gives the nodes that stand in a leaf's place, or a failure.
 * @returns The rebuilt element, or the first failure.
 */
const recursiveRebuild = <S, E>(
  element: Element,
  scope: S,
  open: (element: Element, scope: S) => Result.Result<Opened<S>, E>,
  leaf: (node: Leaf) => Result.Result<readonly Child[], E>,
): Result.Result<Element, E> => {
  const opened = open(element, scope);
  if (Result.isFailure(opened)) {
    return Result.fail(opened.failure);
  }

  const children: Child[] = [];
  for (const child of element.children) {
    const nodes =
      child.kind === "element"
        ? Result.map(recursiveRebuild(child, opened.success.scope, open, leaf), (held) => [held])
        : leaf(child);
    if (Result.isFailure(nodes)) {
      return Result.fail(nodes.failure);
    }

    children.push(...nodes.success);
  }

  return Result.succeed({ ...opened.success.element, children });
};

/**
 * An open rule whose result shows which element it was given, the order of that element's own
 * attributes and the depth its context carries: its attributes reversed, then one naming the
 * element and its depth, the children's context one deeper.
 *
 * @param element - The original element.
 * @param depth - The context, the element's depth.
 * @returns The counterpart and the children's depth.
 */
const marked = (element: Element, depth: number): Result.Result<Opened<number>> =>
  Result.succeed({
    element: {
      ...element,
      attributes: [
        ...element.attributes.toReversed(),
        {
          local: "of",
          namespace: "",
          prefix: "",
          qname: "of",
          references: [],
          value: `${element.qname}@${String(depth)}`,
        },
      ],
    },
    scope: depth + 1,
  });

/**
 * An open rule that fails at the third element in document order, naming it and its depth, and
 * marks every other as {@link marked} does: the rebuild must stop at the same element as the
 * oracle, and before any later leaf.
 *
 * @returns The rule, with its own count of the elements it has opened.
 */
const failingAtThird = () => {
  let opened = 0;

  return (element: Element, depth: number): Result.Result<Opened<number>, string> => {
    opened += 1;

    return opened === 3 ? Result.fail(`${element.qname}@${String(depth)}`) : marked(element, depth);
  };
};

/**
 * A leaf rule that gives each kind a different number of stand-ins: a text run becomes two, a
 * processing instruction stays twice, a comment is dropped, and an entity reference becomes text.
 *
 * @param node - The original leaf.
 * @returns The nodes that stand in its place; it never fails.
 */
const replaced = (node: Leaf): Result.Result<readonly Child[], string> => {
  switch (node.kind) {
    case "text": {
      return Result.succeed([node, { ...node, value: `${node.value}+` }]);
    }
    case "pi": {
      return Result.succeed([node, node]);
    }
    case "comment": {
      return Result.succeed([]);
    }
    case "entityRef": {
      return Result.succeed([{ cdata: false, kind: "text", value: node.name }]);
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
      undefined,
      (element) => Result.succeed({ element, scope: undefined }),
      (node) => Result.succeed([node]),
    ),
    Result.succeed(root),
    `${name}, identity`,
  );
  assert.deepStrictEqual(
    rebuild(root, 0, marked, replaced),
    recursiveRebuild(root, 0, marked, replaced),
    `${name}, marked and replaced`,
  );
  assert.deepStrictEqual(
    rebuild(root, 0, failingAtThird(), replaced),
    recursiveRebuild(root, 0, failingAtThird(), replaced),
    `${name}, failing at the third element`,
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
