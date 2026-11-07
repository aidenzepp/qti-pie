/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) as crust's reader reports them. */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { foreignKinds } from "#pantry/grammar/kinds.ts";
import type { ForeignKind } from "#pantry/grammar/kinds.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { foldGrammarOf, namesOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type {
  FixedKind,
  FlatRows,
  OpenClass,
  XdmAttributeName,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
  XdmElement,
  XdmMisc,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";
import { caseHang, featuresOf, idOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
import type { Placed, XdmFeature } from "#pantry/test/gen/xdm.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import type { Child } from "@qti-pie/crust/tree.ts";

/**
 * A vocabulary of literal handles, over which the tree's types state their contracts: they are
 * generic in the vocabulary, so one with literal handles shows each.
 */
interface Literal extends XdmVocabulary {
  readonly domain: "string";
  readonly kind: FixedKind | ForeignKind | "p";
  readonly name: OpenClass | "id";
  readonly version: "3.0.1";
}

/**
 * The composed grammar every property draws its trees over.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The features a search over generated trees must reach on its witnesses: each kind of node, open
 * names, a doctype, and a foreign element under a wildcard.
 */
const reached = required<XdmFeature>(
  [
    "element",
    "wildcard",
    "text",
    "ws",
    "comment",
    "pi",
    "entityRef",
    "attribute",
    "openName",
    "doctype",
  ],
  { cases: 300, sense: notesOnly },
);

/**
 * Number a tree's model in pre-order from each node's parent and slot alone: an independent
 * numbering, which reads none of the intervals the generator or `flatten` writes.
 *
 * @param model - The generator's model, the document node 0, its own parent.
 * @returns For each model number, its children by slot, its place in pre-order, and the number of
 *   nodes its subtree holds, itself included.
 */
const preorderOf = (model: readonly Placed[]) => {
  const childrenOf: number[][] = model.map(() => []);
  for (const [number, placed] of model.entries()) {
    if (number > 0) {
      childrenOf[placed.parent]?.push(number);
    }
  }

  for (const family of childrenOf) {
    family.sort((left, right) => (model[left]?.at ?? 0) - (model[right]?.at ?? 0));
  }

  const order: number[] = [];
  const stack = [0];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    order.push(next);
    stack.push(...(childrenOf[next] ?? []).toReversed());
  }

  const index: number[] = model.map(() => -1);
  for (const [place, number] of order.entries()) {
    index[number] = place;
  }

  const size: number[] = model.map(() => 1);
  for (const number of order.toReversed()) {
    const parent = model[number]?.parent ?? 0;
    if (number > 0) {
      size[parent] = (size[parent] ?? 0) + (size[number] ?? 0);
    }
  }

  return { childrenOf, index, size };
};

describe("flatten", { timeout: searchTimeout }, () => {
  it.effect(
    "writes each node's row where the generator's model of the tree places it, in document order",
    (ctx) =>
      // Oracle: a second implementation, the model the generator writes as it places each node and
      // closes each subtree.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the model the generator writes as it places each node and closes each subtree",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/xdm-flatten-model",
          },
          ({ document, model }, c) =>
            Effect.sync(() => {
              c.noteAll(featuresOf(document));

              const rows = flatten(document, idOf);

              assert.deepStrictEqual(
                rows.nodes.map(({ at, end, id, kind, parent, start, version }) => ({
                  at,
                  end,
                  id,
                  kind,
                  parent,
                  start,
                  version,
                })),
                model.map((placed, number) => ({
                  at: BigInt(placed.at),
                  end: BigInt(placed.end),
                  id: idOf(number),
                  kind: placed.kind,
                  parent: idOf(placed.parent),
                  start: BigInt(placed.start),
                  version: document.version,
                })),
              );
            }),
        ),
      ),
  );

  it.effect(
    "draws each node's interval as its pre-order numbering: start its index, end − start its subtree's size, containment its descendants, siblings tiling their parent, and the document node over [0, N)",
    (ctx) =>
      // Oracle: a second implementation, a pre-order numbering of the generator's model from each
      // node's parent and slot alone, its subtree sizes summed bottom-up, and descent read off
      // parent chains; none of it reads an interval.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree; containment over
      // every ordered pair of nodes.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a pre-order numbering of the generator's model from each node's parent and slot alone",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/xdm-flatten-intervals",
          },
          ({ document, model }, c) =>
            Effect.sync(() => {
              c.noteAll(featuresOf(document));

              const rows = flatten(document, idOf);
              const { childrenOf, index, size } = preorderOf(model);
              const row = (number: number) =>
                rows.nodes[number] ?? assert.fail(`no node numbered ${String(number)}`);
              const above = (number: number): ReadonlySet<number> => {
                const chain = new Set<number>();
                for (let at = number; at !== 0; at = model[at]?.parent ?? 0) {
                  chain.add(model[at]?.parent ?? 0);
                }

                return chain;
              };

              assert.deepStrictEqual(
                rows.nodes.map(({ end, start }) => [start, end - start]),
                model.map((_, number) => [BigInt(index[number] ?? -1), BigInt(size[number] ?? -1)]),
              );
              assert.deepStrictEqual([row(0).start, row(0).end], [0n, BigInt(model.length)]);
              for (const number of model.keys()) {
                const ancestors = above(number);
                for (const other of model.keys()) {
                  const outer = row(other);
                  const inner = row(number);

                  assert.strictEqual(
                    other !== number && outer.start < inner.start && inner.end <= outer.end,
                    ancestors.has(other),
                    `${String(other)} above ${String(number)}`,
                  );
                }

                const family = childrenOf[number] ?? [];
                const starts = family.map((child) => row(child).start);
                const ends = family.map((child) => row(child).end);

                assert.deepStrictEqual(
                  [row(number).start + 1n, ...ends],
                  [...starts, row(number).end],
                  `${String(number)}'s children tile its interior`,
                );
              }
            }),
        ),
      ),
  );

  it.effect(
    "writes rows that hold Node(parent, at)'s invariants: one self-parented sentinel, each family's slots 0 to n − 1, one row per node, and each attribute its own id, which its open name and references name",
    (ctx) =>
      // Oracle: the specification as a checker, plan §1.3's N1 and N2 and Node's key, and the
      // attribute ids flatten's contract numbers after the nodes.
      // Bound: the generator's drawn bounds.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "plan §1.3's N1 and N2, Node's key, and the attribute ids flatten's contract numbers after the nodes",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/xdm-flatten-invariants",
          },
          ({ document }, c) =>
            Effect.sync(() => {
              c.noteAll(featuresOf(document));

              const rows: FlatRows<Composed> = flatten(document, idOf);
              const self = rows.document.node;
              const sentinels = rows.nodes.filter(({ parent, id }) => parent === id);
              const families = Map.groupBy(
                rows.nodes.filter(({ id }) => id !== self),
                ({ parent }) => parent,
              );

              assert.deepStrictEqual(
                sentinels.map(({ at, id, kind }) => ({ at, id, kind })),
                [{ at: 0n, id: self, kind: "document" }],
              );
              assert.strictEqual(rows.nodes.filter(({ kind }) => kind === "document").length, 1);
              assert.strictEqual(new Set(rows.nodes.map(({ id }) => id)).size, rows.nodes.length);
              assert.deepStrictEqual(
                rows.attributes.map(({ id }) => id),
                rows.attributes.map((_, index) => idOf(rows.nodes.length + index)),
              );
              assert.isTrue(
                [...rows.openNames, ...rows.attributeEntities].every(({ attribute }) =>
                  rows.attributes.some(({ id }) => id === attribute),
                ),
              );
              for (const family of families.values()) {
                assert.deepStrictEqual(
                  family.map(({ at }) => at).toSorted((left, right) => Number(left - right)),
                  family.map((_, at) => BigInt(at)),
                );
              }
            }),
        ),
      ),
  );

  it("cannot hold what XML does not: an open class as a closed name, character data beside the root, a nameless foreign element, or a named closed one", () => {
    const content = { attributes: [], children: [], namespaces: [], prefix: "" } as const;
    const name = { local: "p", namespace: "" };
    const closedP = { _tag: "element", ...content, kind: "p" } as const;
    // @ts-expect-error -- `data-*` is an open class, so an attribute under it carries its exact name.
    const openClosed: XdmAttributeName<Literal> = { _tag: "closed", handle: "data-*" };
    // @ts-expect-error -- XML holds no character data outside the root element.
    const textBesideRoot: XdmMisc = { _tag: "text", value: "x" };
    // @ts-expect-error -- One kind stands for every foreign element, so each carries its name.
    const nameless: XdmElement<Literal> = { _tag: foreignKinds.other, ...content };
    // @ts-expect-error -- A closed kind stands for its element's name, so the element keeps none.
    const named: XdmElement<Literal> = { ...closedP, name };

    assert.lengthOf([openClosed, textBesideRoot, nameless, named], 4);
  });
});

/**
 * The size of the trees the walks are checked at: past any engine's call stack, so a walk that
 * recursed once per level or per child would overflow.
 */
const extent = 100_000;

/**
 * Build a document around a body: an item whose item body holds it.
 *
 * @param body - The item body's one child.
 * @returns The document.
 */
const itemAround = (body: XdmClosedElement<Composed>): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "UTF-8",
  prolog: [],
  root: {
    _tag: "element",
    attributes: [],
    children: [
      {
        _tag: "element",
        attributes: [],
        children: [body],
        governs: grammar.xsi.declaredType("3.0.1", "qti-item-body"),
        kind: "qti-item-body",
        namespaces: [],
        prefix: "",
      },
    ],
    governs: grammar.xsi.declaredType("3.0.1", "qti-assessment-item"),
    kind: "qti-assessment-item",
    namespaces: [],
    prefix: "",
  },
  version: "3.0.1",
});

/**
 * A `div` holding children.
 *
 * @param children - Its children.
 * @returns The element.
 */
const div = (children: readonly XdmChild<Composed>[]): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: [],
  children,
  governs: grammar.xsi.declaredType("3.0.1", "div"),
  kind: "div",
  namespaces: [],
  prefix: "",
});

/**
 * Count the elements down a crust tree's first-child chain, without recursion.
 *
 * @param root - The root element.
 * @returns How many elements the chain holds.
 */
const chainLength = (root: Child): number => {
  let length = 0;
  for (let below: Child | undefined = root; below?.kind === "element"; [below] = below.children) {
    length += 1;
  }

  return length;
};

describe("the model's walks", { timeout: searchTimeout }, () => {
  it.effect(
    "flatten, assemble, fold and convert a tree 100,000 elements deep and one 100,000 children wide, without recursion, to the same canonical bytes",
    () =>
      Effect.gen(function* walks() {
        let deep = div([]);
        for (let level = 1; level < extent; level += 1) {
          deep = div([deep]);
        }

        const wide = div(
          Array.from({ length: extent }, (_, at): XdmChild<Composed> =>
            at % 2 === 0 ? div([]) : { _tag: "text", value: "t" },
          ),
        );
        for (const [layout, document] of [
          ["deep", itemAround(deep)],
          ["wide", itemAround(wide)],
        ] as const) {
          const rows = flatten(document, idOf);
          const folded = yield* Effect.fromResult(fold(document, idOf, foldGrammarOf(grammar)));
          const assembled = yield* Effect.fromResult(assemble(rows));
          const tree = toXmlDocument(document, namesOf(grammar));

          assert.strictEqual(rows.nodes.length, extent + (layout === "deep" ? 3 : 4), layout);
          assert.deepStrictEqual(
            [rows.nodes[0]?.start, rows.nodes[0]?.end],
            [0n, BigInt(rows.nodes.length)],
            layout,
          );
          assert.deepStrictEqual(
            canonicalize(toXmlDocument(assembled, namesOf(grammar))),
            canonicalize(tree),
            layout,
          );
          assert.strictEqual(folded.nodes.length, rows.nodes.length, layout);
          // A deep comparison recurses once per level, so the trees are compared through their rows:
          // flatten writes every field of every node, so equal rows are equal trees.
          assert.deepStrictEqual(flatten(assembled, idOf), rows, layout);
          assert.strictEqual(chainLength(tree.root), layout === "deep" ? extent + 2 : 4, layout);
        }
      }),
    // Two trees of 100,000 nodes through four walks take about 10 s on an idle laptop: the timeout
    // leaves room for a busy one.
    120_000,
  );
});
