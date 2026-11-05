import { assert, describe, it } from "@effect/vitest";
import { flatten, none } from "#pantry/model/xdm.ts";
import type {
  FixedKind,
  FlatRows,
  NodeId,
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
 * Give the node numbered `index` a uuid that spells its number, so a row names its node legibly.
 *
 * @param index - The node's number in document order.
 * @returns A uuid whose last group is the number in hexadecimal.
 */
const idOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

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
 * The attribute names a generated attribute takes: two closed names and one of each open class.
 */
const names: readonly [XdmAttributeName<Toy>, ...XdmAttributeName<Toy>[]] = [
  { _tag: "closed", handle: "identifier" },
  { _tag: "closed", handle: "title" },
  { _tag: "data-*", local: "data-x" },
  { _tag: "foreign", local: "foo", prefix: "m", uri: "urn:m" },
  { _tag: "lax", local: "patternMask" },
];

/**
 * Generate an attribute, holding an unexpanded entity reference about half the time.
 *
 * @param draw - The generator to draw with.
 * @returns The attribute.
 */
const attribute = (draw: Draw): XdmAttribute<Toy> => {
  const referenced = draw(2) === 0;

  return {
    domain: pick(draw, ["identifier", "language", "string"]),
    lexical: referenced ? "&ent;v" : "v",
    name: pick(draw, names),
    references: referenced ? [{ name: "ent", offset: 0 }] : [],
  };
};

/**
 * Generate an element and its subtree, each child an element or any kind of character data.
 *
 * @param draw - The generator to draw with.
 * @param depth - How many levels of elements may sit below it.
 * @returns The element.
 */
const element = (draw: Draw, depth: number): XdmElement<Toy> => ({
  _tag: "element",
  attributes: Array.from({ length: draw(4) }, () => attribute(draw)),
  children: Array.from({ length: depth === 0 ? 0 : draw(5) }, () =>
    pick<() => XdmChild<Toy>>(draw, [
      () => element(draw, depth - 1),
      () => ({ _tag: "text", value: "t" }),
      () => ({ _tag: "ws", value: " " }),
      () => ({ _tag: "comment", value: "c" }),
      () => ({ _tag: "pi", data: "d", target: "t" }),
      () => ({ _tag: "entityRef", name: "e" }),
    ])(),
  ),
  kind: pick(draw, ["body", "item", "p"]),
  namespaces: Array.from({ length: draw(3) }, (_, at) => ({
    prefix: at === 0 ? "" : `n${String(at)}`,
    uri: `urn:n${String(at)}`,
  })),
  prefix: pick(draw, ["", "q"]),
});

/**
 * Generate a document: an optional doctype, a prolog, a root element up to four levels deep and an
 * epilog, and a declaration whose fields agree on whether it exists.
 *
 * @param seed - The seed the document is rebuilt from.
 * @returns The document.
 */
const generated = (seed: number): XdmDocument<Toy> => {
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
    children: [...doctype, ...misc(), element(draw, 4), ...misc()],
    encoding: declared ? pick(draw, ["", "utf-8"]) : "",
    exportCharset: "utf-8",
    standalone: declared ? pick(draw, [none, "yes", "no"]) : none,
    version: pick(draw, ["3.0.0", "3.0.1"]),
    xmlVersion: declared ? "1.0" : none,
  };
};

/**
 * Count a subtree's nodes.
 *
 * @param node - The subtree's root.
 * @returns The root and every node below it.
 */
const count = (node: XdmChild<Toy> | XdmDocumentChild<Toy>): number =>
  node._tag === "element" ? 1 + node.children.reduce((total, below) => total + count(below), 0) : 1;

/**
 * The kinds of character data, whose nodes have no children and no prefix.
 */
const characterKinds: ReadonlySet<string> = new Set<FixedKind>([
  "text",
  "ws",
  "comment",
  "pi",
  "entityRef",
  "doctype",
]);

/**
 * The open classes, the attribute name handles that carry an exact name beside them.
 */
const openClasses: ReadonlySet<string> = new Set<OpenClass>(["data-*", "foreign", "lax"]);

/**
 * The seeds every law below is checked over.
 */
const seeds = Array.from({ length: 200 }, (_, index) => index + 1);

/**
 * Flatten each seed's document with {@link idOf}.
 *
 * @returns Each document beside its rows.
 */
const flattened = (): readonly (readonly [XdmDocument<Toy>, FlatRows<Toy>])[] =>
  seeds.map((seed) => {
    const document = generated(seed);

    return [document, flatten(document, idOf)];
  });

/**
 * Group rows' slots by their owner.
 *
 * @param rows - Each row's owner and slot.
 * @returns Each owner's slots, in row order.
 */
const slotsByOwner = (
  rows: readonly { readonly at: bigint; readonly owner: string }[],
): ReadonlyMap<string, readonly bigint[]> => {
  const slots = new Map<string, bigint[]>();
  for (const { at, owner } of rows) {
    slots.set(owner, [...(slots.get(owner) ?? []), at]);
  }

  return slots;
};

/**
 * Test that each owner's slots run from 0 with no gap and no repeat.
 *
 * @param rows - Each row's owner and slot.
 * @returns Whether every owner's slots, sorted, are 0 to one less than their count.
 */
const indexedFromZero = (
  rows: readonly { readonly at: bigint; readonly owner: string }[],
): boolean =>
  [...slotsByOwner(rows).values()].every((slots) =>
    slots.toSorted((a, b) => Number(a - b)).every((at, index) => at === BigInt(index)),
  );

/**
 * The key of an attribute row, by its element and its slot.
 *
 * @param row - An attribute-keyed row.
 * @param row.at - The attribute's slot.
 * @param row.node - The attribute's element.
 * @returns The key as one string.
 */
const attributeKey = ({ at, node }: { readonly at: bigint; readonly node: NodeId }): string =>
  `${node}/${String(at)}`;

describe("flatten", () => {
  it("writes a document's rows exactly", () => {
    const document: XdmDocument<Toy> = {
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
    const version = "3.0.1";
    const expected: FlatRows<Toy> = {
      attributeEntities: [{ at: 1n, name: "ent", node: idOf(3), offset: 0n }],
      attributes: [
        { at: 0n, domain: "identifier", name: "identifier", node: idOf(3) },
        { at: 1n, domain: "string", name: "data-*", node: idOf(3) },
        { at: 2n, domain: "string", name: "foreign", node: idOf(3) },
        { at: 3n, domain: "string", name: "lax", node: idOf(3) },
        { at: 0n, domain: "language", name: "xml:lang", node: idOf(5) },
      ],
      comments: [
        { node: idOf(2), value: " prolog " },
        { node: idOf(9), value: "c" },
      ],
      doctypes: [{ node: idOf(1), value: "<!DOCTYPE item>" }],
      document: {
        charset: "utf-8",
        encoding: "",
        exportCharset: "utf-8",
        node: idOf(0),
        standalone: none,
        xmlVersion: "1.0",
      },
      entityRefs: [{ name: "ent", node: idOf(7) }],
      lexicals: [
        { at: 0n, lexical: "i1", node: idOf(3) },
        { at: 1n, lexical: "&ent;y", node: idOf(3) },
        { at: 2n, lexical: "bar", node: idOf(3) },
        { at: 3n, lexical: "z", node: idOf(3) },
        { at: 0n, lexical: "en", node: idOf(5) },
      ],
      namespaces: [
        { at: 0n, node: idOf(3), prefix: "", uri: "urn:qti" },
        { at: 1n, node: idOf(3), prefix: "m", uri: "urn:m" },
      ],
      nodes: [
        { at: 0n, id: idOf(0), kind: "document", parent: idOf(0), prefix: "", version },
        { at: 0n, id: idOf(1), kind: "doctype", parent: idOf(0), prefix: "", version },
        { at: 1n, id: idOf(2), kind: "comment", parent: idOf(0), prefix: "", version },
        { at: 2n, id: idOf(3), kind: "item", parent: idOf(0), prefix: "", version },
        { at: 0n, id: idOf(4), kind: "ws", parent: idOf(3), prefix: "", version },
        { at: 1n, id: idOf(5), kind: "body", parent: idOf(3), prefix: "m", version },
        { at: 0n, id: idOf(6), kind: "text", parent: idOf(5), prefix: "", version },
        { at: 1n, id: idOf(7), kind: "entityRef", parent: idOf(5), prefix: "", version },
        { at: 2n, id: idOf(8), kind: "pi", parent: idOf(5), prefix: "", version },
        { at: 3n, id: idOf(9), kind: "comment", parent: idOf(5), prefix: "", version },
        { at: 2n, id: idOf(10), kind: "ws", parent: idOf(3), prefix: "", version },
        { at: 3n, id: idOf(11), kind: "pi", parent: idOf(0), prefix: "", version },
      ],
      openNames: [
        { at: 1n, local: "data-x", node: idOf(3), prefix: "", uri: "" },
        { at: 2n, local: "foo", node: idOf(3), prefix: "m", uri: "urn:m" },
        { at: 3n, local: "patternMask", node: idOf(3), prefix: "", uri: "" },
      ],
      pis: [
        { data: "d", node: idOf(8), target: "t" },
        { data: "", node: idOf(11), target: "end" },
      ],
      texts: [{ node: idOf(6), value: "Hi " }],
      whitespace: [
        { node: idOf(4), value: "\n  " },
        { node: idOf(10), value: "\n" },
      ],
    };

    assert.deepStrictEqual(flatten(document, idOf), expected);
  });

  it("selects the document node out: the only document-kind node, its own parent at slot 0", () => {
    for (const [document, rows] of flattened()) {
      const [first, ...rest] = rows.nodes;

      assert.deepStrictEqual(first, {
        at: 0n,
        id: idOf(0),
        kind: "document",
        parent: idOf(0),
        prefix: "",
        version: document.version,
      });
      assert.isTrue(rest.every((row) => row.kind !== "document" && row.parent !== row.id));
      assert.strictEqual(rows.document.node, idOf(0));
    }
  });

  it("writes one node row per node, numbered in document order", () => {
    for (const [document, rows] of flattened()) {
      const total = 1 + document.children.reduce((sum, below) => sum + count(below), 0);

      assert.strictEqual(rows.nodes.length, total);
      assert.deepStrictEqual(
        rows.nodes.map(({ id }) => id),
        rows.nodes.map((_, index) => idOf(index)),
      );
    }
  });

  it("gives every node its parent's earlier number, and an element or the document as its parent", () => {
    for (const [, rows] of flattened()) {
      const numbers = new Map(rows.nodes.map(({ id }, index) => [id, index]));
      const owners = new Set(
        rows.nodes
          .filter(({ kind }) => kind === "document" || !characterKinds.has(kind))
          .map(({ id }) => id),
      );

      assert.isTrue(
        rows.nodes
          .slice(1)
          .every(
            ({ id, parent }) =>
              owners.has(parent) && (numbers.get(parent) ?? Infinity) < (numbers.get(id) ?? 0),
          ),
      );
    }
  });

  it("indexes the children, the attributes and the namespaces of each owner from 0, without gaps", () => {
    for (const [, rows] of flattened()) {
      assert.isTrue(
        indexedFromZero(rows.nodes.slice(1).map(({ at, parent }) => ({ at, owner: parent }))),
      );
      assert.isTrue(indexedFromZero(rows.attributes.map(({ at, node }) => ({ at, owner: node }))));
      assert.isTrue(indexedFromZero(rows.namespaces.map(({ at, node }) => ({ at, owner: node }))));
    }
  });

  it("gives each character-data node one row of its kind, and each such row a node of that kind", () => {
    for (const [, rows] of flattened()) {
      const arms = {
        comment: rows.comments,
        doctype: rows.doctypes,
        entityRef: rows.entityRefs,
        pi: rows.pis,
        text: rows.texts,
        ws: rows.whitespace,
      };
      for (const [kind, arm] of Object.entries(arms)) {
        assert.deepStrictEqual(
          arm.map(({ node }) => node),
          rows.nodes.filter((row) => row.kind === kind).map(({ id }) => id),
        );
      }
    }
  });

  it("gives each attribute one lexical form, and one open name exactly when an open class names it", () => {
    for (const [, rows] of flattened()) {
      const keys = rows.attributes.map(attributeKey);
      const elements = new Set(
        rows.nodes
          .filter(({ kind }) => kind !== "document" && !characterKinds.has(kind))
          .map(({ id }) => id),
      );

      assert.deepStrictEqual(rows.lexicals.map(attributeKey), keys);
      assert.deepStrictEqual(
        rows.openNames.map(attributeKey),
        rows.attributes.filter(({ name }) => openClasses.has(name)).map(attributeKey),
      );
      assert.isTrue(rows.attributeEntities.every((row) => keys.includes(attributeKey(row))));
      assert.isTrue(rows.attributes.every(({ node }) => elements.has(node)));
      assert.isTrue(rows.namespaces.every(({ node }) => elements.has(node)));
    }
  });

  it("copies the document's version to every node, and the empty prefix to every node but elements", () => {
    for (const [document, rows] of flattened()) {
      assert.isTrue(rows.nodes.every(({ version }) => version === document.version));
      assert.isTrue(
        rows.nodes
          .filter(({ kind }) => kind === "document" || characterKinds.has(kind))
          .every(({ prefix }) => prefix === ""),
      );
    }
  });

  it("writes a tree 100,000 elements deep, and an element 100,000 children wide", () => {
    const leaf: XdmElement<Toy> = {
      _tag: "element",
      attributes: [],
      children: [],
      kind: "p",
      namespaces: [],
      prefix: "",
    };
    const depth = 100_000;
    let deep = leaf;
    for (let level = 1; level < depth; level += 1) {
      deep = { ...leaf, children: [deep] };
    }

    const wide: XdmElement<Toy> = {
      ...leaf,
      children: Array.from({ length: depth }, (): XdmChild<Toy> => ({ _tag: "text", value: "t" })),
    };
    const of = (root: XdmElement<Toy>): FlatRows<Toy> =>
      flatten(
        {
          _tag: "document",
          charset: "utf-8",
          children: [root],
          encoding: "",
          exportCharset: "utf-8",
          standalone: none,
          version: "3.0.0",
          xmlVersion: none,
        },
        idOf,
      );
    const deepRows = of(deep).nodes;
    const wideRows = of(wide).nodes;

    assert.strictEqual(deepRows.length, depth + 1);
    assert.isTrue(
      deepRows.every(
        ({ at, parent }, index) => at === 0n && parent === idOf(Math.max(index - 1, 0)),
      ),
    );
    assert.strictEqual(wideRows.length, depth + 2);
    assert.isTrue(
      wideRows
        .slice(2)
        .every(({ at, parent }, index) => at === BigInt(index) && parent === idOf(1)),
    );
  });

  it("cannot write an open class as a closed name, nor text beside the root element", () => {
    // @ts-expect-error -- `data-*` is an open class, so an attribute under it carries its exact name.
    const closed: XdmAttributeName<Toy> = { _tag: "closed", handle: "data-*" };
    // @ts-expect-error -- XML holds no character data outside the root element.
    const prolog: XdmDocumentChild<Toy> = { _tag: "text", value: "x" };

    assert.deepStrictEqual([closed._tag, prolog._tag], ["closed", "text"]);
  });
});
