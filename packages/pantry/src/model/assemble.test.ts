import { assert, describe, it } from "@effect/vitest";
import { Effect, Order } from "effect";
import { assemble } from "#pantry/model/assemble.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import { flatten, none } from "#pantry/model/xdm.ts";
import type {
  FixedKind,
  FlatRows,
  NodeId,
  NodeRow,
  OpenClass,
  XdmAttribute,
  XdmAttributeName,
  XdmChild,
  XdmDocument,
  XdmDocumentChild,
  XdmElement,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";

/**
 * A vocabulary of a few handles, so a small generated tree reaches every arm.
 */
interface Toy extends XdmVocabulary {
  readonly domain: "identifier" | "language" | "string";
  readonly kind: FixedKind | "body" | "item" | "p";
  readonly name: OpenClass | "identifier" | "title" | "xml:lang";
  readonly version: "3.0.0" | "3.0.1";
}

/**
 * Give the node numbered `index` a uuid that spells its number, so ids sort in document order.
 *
 * @param index - The node's number in document order.
 * @returns A uuid whose last group is the number in hexadecimal.
 */
const idOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/**
 * Give the node numbered `index` a uuid whose order is not document order, as drawn ids are not:
 * the number times an odd constant, modulo 2³², is a bijection, so every node keeps its own id.
 *
 * @param index - The node's number in document order, below 3,000,000, where the product is exact.
 * @returns A uuid that spells the scrambled number.
 */
const scrambledIdOf = (index: number): NodeId => idOf((index * 2_654_435_761) % 4_294_967_296);

/**
 * Draws a whole number below `bound`.
 *
 * @param bound - One more than the largest number it may draw.
 * @returns The number drawn.
 */
type Draw = (bound: number) => number;

/**
 * Make a seeded Park-Miller generator, so a failing tree is rebuilt from its seed.
 *
 * @param seed - The generator's seed, from 1 to 2,147,483,646.
 * @returns A draw over the generator's sequence.
 */
const seeded = (seed: number): Draw => {
  let state = seed;

  return (bound) => {
    state = (state * 48_271) % 2_147_483_647;

    return state % bound;
  };
};

/**
 * Draw one item of a non-empty list.
 *
 * @param draw - The generator to draw with.
 * @param items - The items to choose from.
 * @returns The item drawn.
 */
const pick = <T>(draw: Draw, items: readonly [T, ...T[]]): T =>
  items[draw(items.length)] ?? items[0];

/**
 * The attribute names a generated attribute takes: closed names and one of each open class.
 */
const names: readonly [XdmAttributeName<Toy>, ...XdmAttributeName<Toy>[]] = [
  { _tag: "closed", handle: "identifier" },
  { _tag: "closed", handle: "xml:lang" },
  { _tag: "data-*", local: "data-x" },
  { _tag: "foreign", local: "foo", prefix: "m", uri: "urn:m" },
  { _tag: "lax", local: "patternMask" },
];

/**
 * Generate an attribute holding none, one or two unexpanded entity references.
 *
 * @param draw - The generator to draw with.
 * @returns The attribute.
 */
const attribute = (draw: Draw): XdmAttribute<Toy> => {
  const references = Array.from({ length: draw(3) }, (_, at) => ({
    name: `e${String(draw(3))}`,
    offset: at * 4,
  }));

  return {
    domain: pick(draw, ["identifier", "language", "string"]),
    lexical: `${references.map(({ name }) => `&${name};`).join("")}v${String(draw(10))}`,
    name: pick(draw, names),
    references,
  };
};

/**
 * Generate a leaf an element holds: any kind of character data, with a drawn value.
 *
 * @param draw - The generator to draw with.
 * @returns The leaf.
 */
const leaf = (draw: Draw): XdmChild<Toy> => {
  const value = String(draw(10));

  return pick<XdmChild<Toy>>(draw, [
    { _tag: "text", value: `t${value}` },
    { _tag: "ws", value: " ".repeat(Number(value) + 1) },
    { _tag: "comment", value: `c${value}` },
    { _tag: "pi", data: `d${value}`, target: "t" },
    { _tag: "entityRef", name: `e${value}` },
  ]);
};

/**
 * The extent of a generated tree: how deep its spine runs and how many other children an element
 * holds at most.
 */
interface Extent {
  readonly depth: number;
  readonly width: number;
}

/**
 * The extents every law is checked over: a bushy tree, a deep and narrow one, and a shallow and
 * wide one.
 */
const extents: readonly Extent[] = [
  { depth: 4, width: 4 },
  { depth: 40, width: 2 },
  { depth: 2, width: 24 },
];

/**
 * Generate an element and its subtree: up to `width` children, each an element or a leaf, and at a
 * drawn place among them one element whose subtree reaches the full depth.
 *
 * @param draw - The generator to draw with.
 * @param width - How many children, beside the spine, an element holds at most.
 * @param depth - How many levels of elements sit below it on its spine.
 * @returns The element.
 */
const element = (draw: Draw, width: number, depth: number): XdmElement<Toy> => {
  const children = Array.from({ length: draw(width + 1) }, () =>
    depth > 0 && draw(2) === 0 ? element(draw, width, draw(Math.min(depth, 3))) : leaf(draw),
  );
  const spine = depth > 0 ? [element(draw, width, depth - 1)] : [];
  const at = draw(children.length + 1);

  return {
    _tag: "element",
    attributes: Array.from({ length: draw(4) }, () => attribute(draw)),
    children: [...children.slice(0, at), ...spine, ...children.slice(at)],
    kind: pick(draw, ["body", "item", "p"]),
    namespaces: Array.from({ length: draw(3) }, (_, slot) => ({
      prefix: slot === 0 ? "" : `n${String(slot)}`,
      uri: `urn:n${String(slot)}`,
    })),
    prefix: pick(draw, ["", "q"]),
  };
};

/**
 * Generate a document: an optional doctype, a prolog, a root element of the given extent and an
 * epilog, and a declaration whose fields agree on whether it exists.
 *
 * @param seed - The seed the document is rebuilt from.
 * @param extent - The root element's extent.
 * @returns The document.
 */
const generated = (seed: number, extent: Extent): XdmDocument<Toy> => {
  const draw = seeded(seed);
  const misc = (): readonly XdmDocumentChild<Toy>[] =>
    Array.from({ length: draw(3) }, () =>
      pick<XdmDocumentChild<Toy>>(draw, [
        { _tag: "comment", value: "m" },
        { _tag: "pi", data: "", target: "m" },
      ]),
    );
  const doctype: readonly XdmDocumentChild<Toy>[] =
    draw(2) === 0 ? [] : [{ _tag: "doctype", value: "<!DOCTYPE item>" }];
  const declared = draw(2) === 0;

  return {
    _tag: "document",
    charset: "utf-8",
    children: [...doctype, ...misc(), element(draw, extent.width, extent.depth), ...misc()],
    encoding: declared ? pick(draw, ["", "utf-8"]) : "",
    exportCharset: "utf-8",
    standalone: declared ? pick(draw, [none, "yes", "no"]) : none,
    version: pick(draw, ["3.0.0", "3.0.1"]),
    xmlVersion: declared ? "1.0" : none,
  };
};

/**
 * The documents every law is checked over: 100 seeds of each extent.
 */
const documents = extents.flatMap((extent) =>
  Array.from({ length: 100 }, (_, index) => generated(index + 1, extent)),
);

/**
 * The order of a family's rows by key: owner, then slot.
 */
const byOwnerAndSlot = Order.mapInput(
  Order.Tuple([Order.String, Order.BigInt]),
  (row: { readonly at: bigint; readonly node: NodeId }) => [row.node, row.at] as const,
);

/**
 * The order of leaf rows by key, their node.
 */
const byNode = Order.mapInput(Order.String, (row: { readonly node: NodeId }) => row.node);

/**
 * Sort every relation of a document's rows into key order, as a scan in key order returns them: the
 * nodes by (parent, at), the attribute-keyed rows by (node, at), entity references by offset within
 * their attribute, and the leaves by node.
 *
 * @param rows - The rows, in any order.
 * @returns The same rows in key order.
 */
const inKeyOrder = (rows: FlatRows<Toy>): FlatRows<Toy> => ({
  attributeEntities: rows.attributeEntities.toSorted(
    Order.mapInput(
      Order.Tuple([Order.String, Order.BigInt, Order.BigInt]),
      (row: FlatRows<Toy>["attributeEntities"][number]) => [row.node, row.at, row.offset] as const,
    ),
  ),
  attributes: rows.attributes.toSorted(byOwnerAndSlot),
  comments: rows.comments.toSorted(byNode),
  doctypes: rows.doctypes.toSorted(byNode),
  document: rows.document,
  entityRefs: rows.entityRefs.toSorted(byNode),
  lexicals: rows.lexicals.toSorted(byOwnerAndSlot),
  namespaces: rows.namespaces.toSorted(byOwnerAndSlot),
  nodes: rows.nodes.toSorted(
    Order.mapInput(
      Order.Tuple([Order.String, Order.BigInt]),
      (row: NodeRow<Toy>) => [row.parent, row.at] as const,
    ),
  ),
  openNames: rows.openNames.toSorted(byOwnerAndSlot),
  pis: rows.pis.toSorted(byNode),
  texts: rows.texts.toSorted(byNode),
  whitespace: rows.whitespace.toSorted(byNode),
});

/**
 * A document that reaches every arm: a doctype and a prolog, attributes under each kind of name
 * with an entity reference in one, namespace declarations, every kind of character data, and an
 * epilog. Its nodes are numbered 0 (the document node) to 11 in document order.
 */
const sample: XdmDocument<Toy> = {
  _tag: "document",
  charset: "utf-8",
  children: [
    { _tag: "doctype", value: "<!DOCTYPE item>" },
    { _tag: "comment", value: " prolog " },
    {
      _tag: "element",
      attributes: [
        {
          domain: "identifier",
          lexical: "i1",
          name: { _tag: "closed", handle: "identifier" },
          references: [],
        },
        {
          domain: "string",
          lexical: "&ent;y",
          name: { _tag: "data-*", local: "data-x" },
          references: [{ name: "ent", offset: 0 }],
        },
        {
          domain: "string",
          lexical: "bar",
          name: { _tag: "foreign", local: "foo", prefix: "m", uri: "urn:m" },
          references: [],
        },
        {
          domain: "string",
          lexical: "z",
          name: { _tag: "lax", local: "patternMask" },
          references: [],
        },
      ],
      children: [
        { _tag: "ws", value: "\n  " },
        {
          _tag: "element",
          attributes: [
            {
              domain: "language",
              lexical: "en",
              name: { _tag: "closed", handle: "xml:lang" },
              references: [],
            },
          ],
          children: [
            { _tag: "text", value: "Hi " },
            { _tag: "entityRef", name: "ent" },
            { _tag: "pi", data: "d", target: "t" },
            { _tag: "comment", value: "c" },
          ],
          kind: "body",
          namespaces: [],
          prefix: "m",
        },
        { _tag: "ws", value: "\n" },
      ],
      kind: "item",
      namespaces: [
        { prefix: "", uri: "urn:qti" },
        { prefix: "m", uri: "urn:m" },
      ],
      prefix: "",
    },
    { _tag: "pi", data: "", target: "end" },
  ],
  encoding: "",
  exportCharset: "utf-8",
  standalone: none,
  version: "3.0.1",
  xmlVersion: "1.0",
};

/**
 * The sample's rows, its nodes numbered by {@link idOf}.
 */
const sampleRows = flatten(sample, idOf);

/**
 * Change one of the sample's node rows.
 *
 * @param index - The node's number.
 * @param change - The fields to give it.
 * @param change.kind - Its new kind, when it changes.
 * @param change.parent - Its new parent, when it changes.
 * @returns The sample's rows with that node changed.
 */
const changed = (
  index: number,
  change: { readonly kind: NodeRow<Toy>["kind"] } | { readonly parent: NodeId },
): FlatRows<Toy> => ({
  ...sampleRows,
  nodes: sampleRows.nodes.map((row, at) => (at === index ? { ...row, ...change } : row)),
});

/**
 * Assemble rows that must be refused.
 *
 * @param rows - The rows.
 * @returns The refusal, or a failure with the document when the rows assemble.
 */
const refusal = (rows: FlatRows<Toy>): Effect.Effect<AssembleError, XdmDocument<Toy>> =>
  Effect.flip(Effect.fromResult(assemble(rows)));

describe("assemble", () => {
  it.effect("assembles a document that reaches every arm back from its rows", () =>
    Effect.gen(function* sampleDocument() {
      const assembled = yield* Effect.fromResult(assemble(sampleRows));

      assert.deepStrictEqual(assembled, sample);
    }),
  );

  it.effect("assembles every generated document back from its rows in document order", () =>
    Effect.gen(function* documentOrder() {
      for (const document of documents) {
        const assembled = yield* Effect.fromResult(assemble(flatten(document, idOf)));

        assert.deepStrictEqual(assembled, document);
      }
    }),
  );

  it.effect("assembles rows in key order, under ids that do not follow document order", () =>
    Effect.gen(function* keyOrder() {
      const reordered = documents.filter((document) => {
        const rows = flatten(document, scrambledIdOf);

        return inKeyOrder(rows).nodes.some((row, at) => row !== rows.nodes[at]);
      });
      for (const document of documents) {
        const assembled = yield* Effect.fromResult(
          assemble(inKeyOrder(flatten(document, scrambledIdOf))),
        );

        assert.deepStrictEqual(assembled, document);
      }

      assert.strictEqual(reordered.length, documents.length);
    }),
  );

  it.effect(
    "assembles a tree 100,000 elements deep, and an element 100,000 children wide",
    () =>
      Effect.gen(function* extremes() {
        const leafElement: XdmElement<Toy> = {
          _tag: "element",
          attributes: [],
          children: [],
          kind: "p",
          namespaces: [],
          prefix: "",
        };
        const size = 100_000;
        let deep = leafElement;
        for (let level = 1; level < size; level += 1) {
          deep = { ...leafElement, children: [deep] };
        }

        const wide: XdmElement<Toy> = {
          ...leafElement,
          children: Array.from({ length: size }, (_, at): XdmChild<Toy> => ({
            _tag: "text",
            value: String(at),
          })),
        };
        const of = (root: XdmElement<Toy>): XdmDocument<Toy> => ({
          _tag: "document",
          charset: "utf-8",
          children: [root],
          encoding: "",
          exportCharset: "utf-8",
          standalone: none,
          version: "3.0.0",
          xmlVersion: none,
        });
        const deepRows = inKeyOrder(flatten(of(deep), scrambledIdOf));
        const deepAssembled = yield* Effect.fromResult(assemble(deepRows));
        const wideAssembled = yield* Effect.fromResult(
          assemble(inKeyOrder(flatten(of(wide), scrambledIdOf))),
        );

        // A deep comparison recurses once per level, so the deep tree is compared through its rows:
        // flatten writes every field of every node, so equal rows are equal trees.
        assert.deepStrictEqual(inKeyOrder(flatten(deepAssembled, scrambledIdOf)), deepRows);
        assert.deepStrictEqual(wideAssembled, of(wide));
      }),
    // Two trees of 100,000 nodes take about 2 s on an idle laptop: the timeout leaves room for a busy one.
    30_000,
  );

  it.effect("refuses rows that lack a row another of them names", () =>
    Effect.gen(function* missing() {
      const cases: readonly (readonly [FlatRows<Toy>, string])[] = [
        [{ ...sampleRows, texts: [] }, `no texts row at (${idOf(6)})`],
        [{ ...sampleRows, pis: sampleRows.pis.slice(1) }, `no pis row at (${idOf(8)})`],
        [
          { ...sampleRows, lexicals: sampleRows.lexicals.filter(({ node }) => node !== idOf(5)) },
          `no lexicals row at (${idOf(5)}, 0)`,
        ],
        [
          { ...sampleRows, openNames: sampleRows.openNames.filter(({ at }) => at !== 2n) },
          `no openNames row at (${idOf(3)}, 2)`,
        ],
        [{ ...sampleRows, nodes: sampleRows.nodes.slice(1) }, `no nodes row at (${idOf(0)})`],
      ];
      for (const [rows, fragment] of cases) {
        const failure = yield* refusal(rows);

        assert.strictEqual(failure._tag, "RowMissing");
        assert.include(failure.message, fragment);
      }
    }),
  );

  it.effect("refuses a node under a parent that cannot hold it", () =>
    Effect.gen(function* misplaced() {
      const cases: readonly (readonly [FlatRows<Toy>, string])[] = [
        [changed(6, { parent: idOf(0) }), `Node ${idOf(6)}, of kind text, sits under ${idOf(0)}`],
        [changed(4, { parent: idOf(0) }), `Node ${idOf(4)}, of kind ws, sits under ${idOf(0)}`],
        [
          changed(7, { parent: idOf(0) }),
          `Node ${idOf(7)}, of kind entityRef, sits under ${idOf(0)}`,
        ],
        [
          changed(1, { parent: idOf(3) }),
          `Node ${idOf(1)}, of kind doctype, sits under ${idOf(3)}`,
        ],
        [
          changed(7, { parent: idOf(6) }),
          `Node ${idOf(7)}, of kind entityRef, sits under ${idOf(6)}`,
        ],
        [
          changed(9, { kind: "document" }),
          `Node ${idOf(9)}, of kind document, sits under ${idOf(5)}`,
        ],
        [changed(8, { parent: idOf(99) }), `Node ${idOf(8)}, of kind pi, sits under ${idOf(99)}`],
      ];
      for (const [rows, fragment] of cases) {
        const failure = yield* refusal(rows);

        assert.strictEqual(failure._tag, "NodeMisplaced");
        assert.include(failure.message, fragment);
      }
    }),
  );

  it.effect("refuses a data attribute whose name does not begin with data-", () =>
    Effect.gen(function* malformed() {
      const failure = yield* refusal({
        ...sampleRows,
        openNames: sampleRows.openNames.map((row) =>
          row.at === 1n ? { ...row, local: "x-data" } : row,
        ),
      });

      assert.strictEqual(failure._tag, "OpenNameMalformed");
      assert.include(failure.message, `The data attribute at (${idOf(3)}, 1) is named x-data`);
    }),
  );
});
