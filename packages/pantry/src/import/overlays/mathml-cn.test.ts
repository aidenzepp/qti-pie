/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML cn builder's free tests: over small `m:math` documents, `rowsOf` gives each `m:cn`
 * whose `type` and `base` are judged its `MathCn` row, and each part of its content, split at its
 * `m:sep` children, a `CnPartText` row with the part's collapsed text and its form, under the ids
 * the tree's nodes carry.
 *
 * Each case is built by construction and its expected rows are written by hand from MathML 3's
 * reading of `cn` (§4.2.1: the parts a `type` implies, separated by `sep`; §2.1.7: whitespace
 * around character data is collapsed), never computed by the builder's own code.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { rowsOf } from "#pantry/import/overlays/mathml-cn.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmComment,
  XdmDocument,
  XdmEntityRef,
  XdmText,
  XdmWhitespace,
} from "#pantry/model/xdm.ts";
import { keyTextBytes, utf8Length } from "#pantry/qti/limits.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The version every case is written in.
 */
const version = "3.0.1";

/**
 * The kinds the cases' elements are of.
 */
type CaseKind = "m:apply" | "m:ci" | "m:cn" | "m:math" | "m:mglyph" | "m:mi" | "m:plus" | "m:sep";

/**
 * Write an element of a kind, which no named type governs.
 *
 * @param kind - Its kind.
 * @param children - Its children, in order.
 * @param attributes - Its attributes, in order.
 * @returns The element.
 */
const elementOf = (
  kind: CaseKind,
  children: readonly XdmChild<Composed>[] = [],
  attributes: readonly XdmAttribute<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes,
  children,
  governs: Option.none(),
  kind,
  namespaces: [],
  prefix: "m",
});

/**
 * Write an attribute of an `m:cn`.
 *
 * @param name - Its name.
 * @param lexical - Its lexical form.
 * @returns The attribute.
 */
const attributeOf = (name: "base" | "type", lexical: string): XdmAttribute<Composed> => ({
  lexical,
  name: closedName(name),
  references: [],
});

/**
 * Write a run of character data.
 *
 * @param value - Its characters, not all XML whitespace.
 * @returns The text node.
 */
const text = (value: string): XdmText => ({ _tag: "text", value });

/**
 * Write a document around its root element.
 *
 * @param root - The root.
 * @returns The document, with no declaration, doctype, prolog or epilog.
 */
const documentOf = (root: XdmClosedElement<Composed>): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "UTF-8",
  prolog: [],
  root,
  version,
});

/**
 * The ids every case's rows are written under, `idOf`, numbering nodes in document order.
 */
const ids = { idOf };

/**
 * The key of a part's row.
 *
 * @param at - The `cn`'s number in document order.
 * @param part - The part's number.
 * @returns The key the builder keys it by.
 */
const partKey = (at: number, part: number): string => JSON.stringify([idOf(at), String(part)]);

/**
 * The key of an attribute's row.
 *
 * @param at - The `cn`'s number in document order.
 * @param name - The attribute's name.
 * @returns The key the builder keys it by.
 */
const attributeKey = (at: number, name: string): string => JSON.stringify([idOf(at), name]);

/**
 * A whitespace run, which is character data too.
 */
const spacing: XdmWhitespace = { _tag: "ws", value: "\n " };

/**
 * A comment, which adds nothing to a part.
 */
const comment: XdmComment = { _tag: "comment", value: "c" };

/**
 * An entity reference, which a part may not hold.
 */
const reference: XdmEntityRef = { _tag: "entityRef", name: "amp" };

/**
 * The keys a row set holds, sorted.
 *
 * @param rows - A keyed set.
 * @returns Its keys.
 */
const keysOf = (rows: ReadonlyMap<string, unknown>): readonly string[] =>
  [...rows.keys()].toSorted();

describe("import/overlays/mathml-cn.ts, the cn rows (spec reading 2)", () => {
  it("gives a base-40 rational of three parts a shape and three slots, and no MathCn or CnPartText", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 text, 4 sep, 5 text, 6 sep, 7 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [text("1"), elementOf("m:sep"), text("2"), elementOf("m:sep"), text("3")],
            [attributeOf("type", "rational"), attributeOf("base", "40")],
          ),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.CnCount), [idOf(2)]);
    assert.deepStrictEqual(rows.CnCount.get(idOf(2)), {
      node: idOf(2),
      type: "rational",
      typeLexical: "rational",
    });
    assert.deepStrictEqual(keysOf(rows.CnSlot), [partKey(2, 0), partKey(2, 1), partKey(2, 2)]);
    assert.deepStrictEqual(rows.CnSlot.get(partKey(2, 1)), {
      form: "integer",
      node: idOf(2),
      part: "1",
      type: "rational",
    });
    assert.strictEqual(rows.CnSlot.get(partKey(2, 2))?.form, "real");
    assert.deepStrictEqual(keysOf(rows.MathCn), []);
    assert.deepStrictEqual(keysOf(rows.CnPartText), []);
  });

  it("gives a cn with an mglyph part its slots, and a cn of a type no form lists none", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 mglyph, 4 sep, 5 text; 6 cn, 7 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [elementOf("m:mglyph"), elementOf("m:sep"), text("2")],
            [attributeOf("type", "rational")],
          ),
          elementOf("m:cn", [text("x")], [attributeOf("type", "constant")]),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.CnCount), [idOf(2)]);
    assert.deepStrictEqual(keysOf(rows.CnSlot), [partKey(2, 0), partKey(2, 1)]);
    assert.deepStrictEqual(keysOf(rows.MathCn), []);
  });

  it("gives every cn of a listed type a shape and its slots, whatever its base, and writes the slots as the parts are", () => {
    // Nodes: 0 document, 1 math, 2 cn (no base), 3 text; 4 cn (base 37), 5 text; 6 cn (empty
    // base), 7 text; 8 cn (rational surplus of three), 9 text, 10 sep, 11 text, 12 sep, 13 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:cn", [text("1")]),
          elementOf("m:cn", [text("1")], [attributeOf("base", "37")]),
          elementOf("m:cn", [text("1")], [attributeOf("base", "")]),
          elementOf(
            "m:cn",
            [text("1"), elementOf("m:sep"), text("2"), elementOf("m:sep"), text("3")],
            [attributeOf("type", "rational")],
          ),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.CnCount), [idOf(2), idOf(4), idOf(6), idOf(8)]);
    assert.deepStrictEqual(keysOf(rows.CnSlot), [
      partKey(2, 0),
      partKey(4, 0),
      partKey(6, 0),
      partKey(8, 0),
      partKey(8, 1),
      partKey(8, 2),
    ]);
    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(2), idOf(8)]);
  });

  it("gives a rational cn one MathCn row and two integer parts, split at its sep", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 text, 4 sep, 5 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [text("1"), elementOf("m:sep"), text("2")],
            [attributeOf("type", "rational")],
          ),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(2)]);
    assert.deepStrictEqual(rows.MathCn.get(idOf(2)), {
      base: "10",
      baseLexical: "",
      node: idOf(2),
      type: "rational",
      typeLexical: "rational",
    });
    assert.deepStrictEqual(keysOf(rows.CnPartText), [partKey(2, 0), partKey(2, 1)]);
    assert.deepStrictEqual(rows.CnPartText.get(partKey(2, 0)), {
      base: "10",
      form: "integer",
      node: idOf(2),
      part: "0",
      text: "1",
      type: "rational",
    });
    assert.deepStrictEqual(rows.CnPartText.get(partKey(2, 1)), {
      base: "10",
      form: "integer",
      node: idOf(2),
      part: "1",
      text: "2",
      type: "rational",
    });
  });

  it("gives a cn with no type its real default, one part, and its text collapsed", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 text.
    const rows = rowsOf(
      documentOf(elementOf("m:math", [elementOf("m:cn", [text(" \t3.5\n ")])])),
      ids,
    );

    assert.deepStrictEqual(rows.MathCn.get(idOf(2)), {
      base: "10",
      baseLexical: "",
      node: idOf(2),
      type: "real",
      typeLexical: "",
    });
    assert.deepStrictEqual(keysOf(rows.CnPartText), [partKey(2, 0)]);
    assert.deepStrictEqual(rows.CnPartText.get(partKey(2, 0)), {
      base: "10",
      form: "real",
      node: idOf(2),
      part: "0",
      text: "3.5",
      type: "real",
    });
  });

  it("reads the type and the base through the whitespace around them, and keeps their lexical forms", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [text("ff")],
            [attributeOf("type", " integer\n"), attributeOf("base", " 016 ")],
          ),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(rows.MathCn.get(idOf(2)), {
      base: "16",
      baseLexical: " 016 ",
      node: idOf(2),
      type: "integer",
      typeLexical: " integer\n",
    });
    assert.strictEqual(rows.CnPartText.get(partKey(2, 0))?.base, "16");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 0))?.text, "ff");
  });

  it("copies the type and the base of every cn into CnAttribute as written, judged or not, and of no other element", () => {
    // Nodes: 0 document, 1 math, 2 cn (judged, both), 3 text, 4 cn (type no form lists), 5 text,
    // 6 cn (no attribute), 7 text, 8 mi (a type), 9 text, 10 cn (base outside the radixes), 11 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [text("ff")],
            [attributeOf("type", " integer\n"), attributeOf("base", " 016 ")],
          ),
          elementOf("m:cn", [text("x")], [attributeOf("type", "constant")]),
          elementOf("m:cn", [text("1")]),
          elementOf("m:mi", [text("y")], [attributeOf("type", "integer")]),
          elementOf("m:cn", [text("1")], [attributeOf("base", "37")]),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(Object.fromEntries(rows.CnAttribute), {
      [attributeKey(2, "base")]: { lexical: " 016 ", name: "base", node: idOf(2) },
      [attributeKey(2, "type")]: { lexical: " integer\n", name: "type", node: idOf(2) },
      [attributeKey(4, "type")]: { lexical: "constant", name: "type", node: idOf(4) },
      [attributeKey(10, "base")]: { lexical: "37", name: "base", node: idOf(10) },
    });
    // The judged cns are 2 and the one that writes nothing (6); the unjudged 4 and 10 still have rows.
    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(2), idOf(6)]);
  });

  it("copies a type longer than the key-text bound unchanged, for the database to refuse under Key text bound", () => {
    // The builder restates the tree; the stated limit (reading 2, findings row 24) is the schema's.
    const long = "t".repeat(keyTextBytes + 1);
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [elementOf("m:cn", [text("x")], [attributeOf("type", long)])]),
      ),
      ids,
    );

    const copied = rows.CnAttribute.get(attributeKey(2, "type"));
    assert.strictEqual(copied?.lexical, long);
    assert.strictEqual(utf8Length(copied?.lexical ?? ""), 2588);
    assert.strictEqual(keyTextBytes, 2587);
    assert.deepStrictEqual(keysOf(rows.MathCn), []);
  });

  it("gives a cn of a type no form lists no rows, its content being text", () => {
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:cn", [text("x")], [attributeOf("type", "constant")]),
          elementOf("m:cn", [text("x")], [attributeOf("type", "Integer")]),
          elementOf("m:cn", [text("x")], [attributeOf("type", "")]),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.MathCn), []);
    assert.deepStrictEqual(keysOf(rows.CnPartText), []);
  });

  it("gives a cn whose base is no radix from 2 to 36 no rows, its digits being application specific", () => {
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          ["1", "37", "abc", "16.5", "", "0"].map((base) =>
            elementOf("m:cn", [text("1")], [attributeOf("base", base)]),
          ),
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.MathCn), []);
    assert.deepStrictEqual(keysOf(rows.CnPartText), []);
  });

  it("gives a cn with a part that holds an element or an entity reference no rows, and no row for the part beside it", () => {
    // Nodes: 0 document, 1 math, 2 cn (an element in a part), 3 mglyph; 4 cn (an entity reference
    // in a part), 5 text, 6 entityRef, 7 sep, 8 text; 9 cn, whole, 10 text.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:cn", [elementOf("m:mglyph")]),
          elementOf(
            "m:cn",
            [text("1"), reference, elementOf("m:sep"), text("2")],
            [attributeOf("type", "rational")],
          ),
          elementOf("m:cn", [text("7")]),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(9)]);
    assert.deepStrictEqual(keysOf(rows.CnPartText), [partKey(9, 0)]);
  });

  it("splits at every sep, keeps an empty part as empty text, and lets comments and whitespace add nothing", () => {
    // Nodes: 0 document, 1 math, 2 cn, 3 comment, 4 ws, 5 text, 6 sep, 7 ws, 8 comment.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf(
            "m:cn",
            [comment, spacing, text("1 2"), elementOf("m:sep"), spacing, comment],
            [attributeOf("type", "e-notation")],
          ),
        ]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.CnPartText), [partKey(2, 0), partKey(2, 1)]);
    assert.strictEqual(rows.CnPartText.get(partKey(2, 0))?.text, "1 2");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 0))?.form, "real");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.text, "");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.form, "integer");
  });

  it("writes a cn's surplus part at the place no type lists, for the database to refuse", () => {
    // A real with a sep holds two parts where its type lists one: the second is written under the
    // form `real`, which CnForm does not list at its place. A rational holds two parts, so a third
    // is written at the place no type lists (place 2), under `real`, and a fourth has no place.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:cn", [text("1"), elementOf("m:sep"), text("2")]),
          elementOf(
            "m:cn",
            [text("1"), elementOf("m:sep"), text("2"), elementOf("m:sep"), text("3")],
            [attributeOf("type", "rational")],
          ),
          elementOf(
            "m:cn",
            [
              text("1"),
              elementOf("m:sep"),
              text("2"),
              elementOf("m:sep"),
              text("3"),
              elementOf("m:sep"),
              text("4"),
            ],
            [attributeOf("type", "rational")],
          ),
        ]),
      ),
      ids,
    );

    // Nodes: 2 cn, 3 text, 4 sep, 5 text; 6 cn, 7 text, 8 sep, 9 text, 10 sep, 11 text;
    // 12 cn, 13 text, 14 sep, 15 text, 16 sep, 17 text, 18 sep, 19 text.
    assert.deepStrictEqual(keysOf(rows.CnPartText), [
      partKey(2, 0),
      partKey(2, 1),
      partKey(6, 0),
      partKey(6, 1),
      partKey(6, 2),
      partKey(12, 0),
      partKey(12, 1),
      partKey(12, 2),
    ]);
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.form, "real");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.type, "real");
    assert.strictEqual(rows.CnPartText.get(partKey(6, 2))?.form, "real");
    assert.strictEqual(rows.CnPartText.get(partKey(6, 2))?.type, "rational");
    assert.strictEqual(rows.CnPartText.get(partKey(6, 2))?.text, "3");
    assert.strictEqual(rows.CnPartText.get(partKey(12, 2))?.text, "3");
  });

  it("finds a cn anywhere in the formula, and gives a document with none no rows", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 cn, 5 text, 6 ci.
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [
          elementOf("m:plus"),
          elementOf("m:cn", [text("1")]),
          elementOf("m:ci"),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(4)]);
    assert.deepStrictEqual(
      keysOf(rowsOf(documentOf(elementOf("m:math", [elementOf("m:ci")])), ids).MathCn),
      [],
    );
  });

  it("builds the rows of one element with 50 000 children in linear time", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 and on its 50 000 ci children, then one cn.
    const children = 50_000;
    const doc = documentOf(
      elementOf("m:math", [
        elementOf(
          "m:apply",
          Array.from({ length: children }, () => elementOf("m:ci")),
        ),
        elementOf("m:cn", [text("1")]),
      ]),
    );
    const start = performance.now();
    const rows = rowsOf(doc, ids);
    const elapsed = performance.now() - start;

    assert.deepStrictEqual(keysOf(rows.MathCn), [idOf(children + 3)]);
    assert.isBelow(elapsed, 1000);
  });
});
