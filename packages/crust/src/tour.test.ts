/* oxlint-disable unicorn/text-encoding-identifier-case -- The XML 1.0 section 4.3.3 label spellings (`ISO-8859-1`, `US-ASCII`, `UTF-8`) are the labels `exportCharset` takes and returns, not identifiers passed to a Node encoding API. */
/**
 * The tour every walk of crust's trees reads, held to a recursive one, and the walks that read it
 * at depths and widths recursion cannot reach.
 *
 * The oracle (`stepsOf`) is the tour's definition written as recursion: an element opens, its
 * children's tours follow in order, and it closes; a leaf is one step. It is exhausted over every
 * labelled plane tree of 1 to 7 nodes. The deep and wide trees then hold `exportCharset`, whose
 * inspection reads the tour, to the label it must pick: a chain or a row of 100,000 elements, with
 * an unwritable comment at its far end or none.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option } from "effect";
import { exportCharset } from "#crust/charset.ts";
import { caseHang, labelled, PLANE_TREES_TO_7, planeTreeUpTo } from "#crust/test/trees.ts";
import { preorder, tour } from "#crust/tour.ts";
import type { Step } from "#crust/tour.ts";
import type { Child, Element, XmlDocument } from "#crust/tree.ts";

/**
 * The oracle: a node's tour, by recursion.
 *
 * @param node - The node.
 * @returns Its steps, in document order.
 */
const stepsOf = (node: Child): readonly Step[] =>
  node.kind === "element"
    ? [
        { element: node, kind: "open" },
        ...node.children.flatMap(stepsOf),
        { element: node, kind: "close" },
      ]
    : [{ kind: "leaf", node }];

/**
 * The node a step visits: an element at its open, a leaf at its own step, none at a close.
 *
 * @param step - The step.
 * @returns The visited node, if any.
 */
const visitedAt = (step: Step): readonly Child[] => {
  if (step.kind === "open") {
    return [step.element];
  }

  return step.kind === "leaf" ? [step.node] : [];
};

describe("the tour", () => {
  it.effect(
    "is the recursive tour on every plane tree of 1 to 7 nodes, and its preorder the open and leaf steps",
    (ctx) =>
      // Oracle: the tour by recursion (`stepsOf`). Bound: every labelled plane tree of 1 to 7
      // nodes; residual: larger trees, whose walks the crust suites' differentials hold.
      searched(
        ctx,
        exhaust(
          {
            box: "every plane tree of 1 to 7 nodes, labelled: 197 trees",
            caseHang,
            coverage: noCoverage,
            generator: planeTreeUpTo(7),
            limit: PLANE_TREES_TO_7,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the tour by recursion" },
            suite: "crust/tour/plane-trees",
          },
          ({ nodes, tree }) =>
            Effect.sync(() => {
              const root = labelled(tree);
              const steps = stepsOf(root);

              assert.deepStrictEqual([...tour(root)], steps, `a plane tree of ${nodes} nodes`);
              assert.deepStrictEqual(
                [...preorder(root)],
                steps.flatMap(visitedAt),
                `a plane tree of ${nodes} nodes`,
              );
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, PLANE_TREES_TO_7);
          }),
        ),
      ),
  );
});

/**
 * How many elements the deep and the wide trees hold.
 */
const SIZE = 100_000;

/**
 * An element of no namespace with no attributes.
 *
 * @param qname - Its name.
 * @param children - Its children.
 * @returns The element.
 */
const element = (qname: string, children: readonly Child[]): Element => ({
  attributes: [],
  children,
  kind: "element",
  local: qname,
  namespace: "",
  prefix: "",
  qname,
});

/**
 * A chain of `depth` elements, each the only child of the one above, the deepest holding `bottom`.
 *
 * @param depth - The elements in the chain.
 * @param bottom - The deepest element's children.
 * @returns The chain's top element.
 */
const chain = (depth: number, bottom: readonly Child[]): Element => {
  let top = element("a", bottom);
  for (let at = 1; at < depth; at += 1) {
    top = element("a", [top]);
  }

  return top;
};

/**
 * A document of `root` alone, read under ISO-8859-1.
 *
 * @param root - The root element.
 * @returns The document.
 */
const documentOf = (root: Element): XmlDocument => ({
  charset: "ISO-8859-1",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  prolog: [],
  root,
});

/**
 * A comment no single-byte label can write.
 */
const unwritable: Child = { kind: "comment", text: "€" };

describe("exportCharset", () => {
  it(`inspects a chain and a row of ${SIZE} elements, keeping a single-byte label unless an unwritable comment sits at the far end`, () => {
    const deep = chain(SIZE, []);
    const deepUnwritable = chain(SIZE, [unwritable]);
    const wide = element(
      "r",
      Array.from({ length: SIZE }, () => element("a", [])),
    );
    const wideUnwritable = element("r", [...wide.children, unwritable]);

    for (const label of ["ISO-8859-1", "US-ASCII"]) {
      assert.strictEqual(exportCharset(label, documentOf(deep)), label);
      assert.strictEqual(exportCharset(label, documentOf(wide)), label);
      assert.strictEqual(exportCharset(label, documentOf(deepUnwritable)), "UTF-8");
      assert.strictEqual(exportCharset(label, documentOf(wideUnwritable)), "UTF-8");
    }
  });
});
