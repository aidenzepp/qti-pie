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
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The version every case is written in.
 */
const version = "3.0.1";

/**
 * The kinds the cases' elements are of.
 */
type CaseKind = "m:apply" | "m:ci" | "m:cn" | "m:math" | "m:mglyph" | "m:plus" | "m:sep";

/**
 * Write an element of a kind, which governs no type (`GoverningOf` gives MathML's `none`).
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
  governs: "none",
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

  it("writes the parts a cn holds beyond its type's, up to the places CnPart names, for the database to refuse", () => {
    // A real with a sep holds two parts where its type lists one: the second is written under the
    // form `real`, which CnForm does not list at its place. A rational with a third part has it
    // beyond the places CnPart names, so no row is written for it.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:cn", [text("1"), elementOf("m:sep"), text("2")]),
          elementOf(
            "m:cn",
            [text("1"), elementOf("m:sep"), text("2"), elementOf("m:sep"), text("3")],
            [attributeOf("type", "rational")],
          ),
        ]),
      ),
      ids,
    );

    // Nodes: 2 cn, 3 text, 4 sep, 5 text; 6 cn, 7 text, 8 sep, 9 text, 10 sep, 11 text.
    assert.deepStrictEqual(keysOf(rows.CnPartText), [
      partKey(2, 0),
      partKey(2, 1),
      partKey(6, 0),
      partKey(6, 1),
    ]);
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.form, "real");
    assert.strictEqual(rows.CnPartText.get(partKey(2, 1))?.type, "real");
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
