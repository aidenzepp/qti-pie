/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML align builder's free tests: over small `m:math` documents, `rowsOf` gives each
 * `m:maction` its `MathAction` row, each `m:mtd` its `MathCell` row and the root of its scope, each
 * element below a cell its `MathAlignScope` row in the state MathML 3 §3.5.5.2 and §3.5.5.9 give
 * it, each open `m:maligngroup` its `MathAlignGroup` row, and each complete element of a cell its
 * `CellLeaf` row, in document order, under the ids the tree's nodes carry.
 *
 * Each case is built by construction and its expected rows are written by hand from MathML 3's
 * reading of the alignment group (§3.5.5.2: which elements let a group through to its cell) and of
 * `maction` (§3.7.1.1: `selection` numbers the child shown, 1 by default), never computed by the
 * builder's own code; only a node's `start` and `version`, which the tree owns and the rows copy,
 * are read from the flat rows.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { rowsOf } from "#pantry/import/overlays/mathml-align.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName, flatten } from "#pantry/model/xdm.ts";
import type {
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmComment,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The version every case is written in.
 */
const version = "3.0.1";

/**
 * The kinds the cases' elements are of.
 */
type CaseKind =
  | "div"
  | "m:maction"
  | "m:maligngroup"
  | "m:math"
  | "m:mfrac"
  | "m:mi"
  | "m:mphantom"
  | "m:mrow"
  | "m:mtable"
  | "m:mtd"
  | "m:mtr";

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
 * Write a `dir` or a `selection`.
 *
 * @param name - Its name.
 * @param lexical - Its lexical form.
 * @returns The attribute.
 */
const attributeOf = (name: "dir" | "selection", lexical: string): XdmAttribute<Composed> => ({
  lexical,
  name: closedName(name),
  references: [],
});

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
 * Write a formula around a table cell's children: `m:math(m:mtd(...))`, nodes 0 document, 1 math, 2
 * cell, the children from 3.
 *
 * @param children - The cell's children.
 * @param math - The `m:math`'s attributes.
 * @returns The document.
 */
const cellOf = (
  children: readonly XdmChild<Composed>[],
  math: readonly XdmAttribute<Composed>[] = [],
): XdmDocument<Composed> => documentOf(elementOf("m:math", [elementOf("m:mtd", children)], math));

/**
 * The ids every case's rows are written under, `idOf`, numbering nodes in document order.
 */
const ids = { idOf };

/**
 * The document node's id, node 0 of every case.
 */
const documentNode = idOf(0);

/**
 * The flat row of a node, whose `start` and `version` the rows copy.
 *
 * @param doc - The case's document.
 * @param at - The node's number in document order.
 * @returns Its `start`.
 */
const startOf = (doc: XdmDocument<Composed>, at: number): bigint =>
  flatten(doc, idOf).nodes.find((node) => node.id === idOf(at))?.start ??
  assert.fail(`the case holds no node ${at}`);

/**
 * The tuple of a node the rows copy: its document, version, start, nearest interaction (the
 * document node, where no interaction holds the formula) and parent.
 *
 * @param doc - The case's document.
 * @param at - The node's number.
 * @param parent - Its parent's number.
 * @returns The copied fields.
 */
const copied = (doc: XdmDocument<Composed>, at: number, parent: number) => ({
  document: documentNode,
  nearest: documentNode,
  node: idOf(at),
  parent: idOf(parent),
  start: startOf(doc, at),
  version,
});

/**
 * The keys a row set holds, in the order it holds them.
 *
 * @param rows - A keyed set.
 * @returns Its keys.
 */
const keysOf = (rows: ReadonlyMap<string, unknown>): readonly string[] => [...rows.keys()];

/**
 * A cell's leaves, in the order its row nests them.
 *
 * @param rows - The document's rows.
 * @param cell - The cell's number.
 * @returns Its leaves.
 */
const leavesOf = (rows: ReturnType<typeof rowsOf>, cell: number) =>
  rows.MathCell.get(idOf(cell))?.leaves ?? assert.fail(`no cell row for node ${cell}`);

/**
 * The nodes of every cell's leaves, cell by cell, each cell's in nesting order.
 *
 * @param rows - The document's rows.
 * @returns The leaves' node ids.
 */
const leafKeysOf = (rows: ReturnType<typeof rowsOf>): readonly string[] =>
  [...rows.MathCell.values()].flatMap((cell) => cell.leaves.map((leaf) => leaf.node));

/**
 * What a scope row says of where its element stands.
 *
 * @param rows - A case's rows.
 * @param at - The element's number.
 * @returns Its `state`, `received`, `passes`, `inherited` and `own`.
 */
const standing = (rows: ReturnType<typeof rowsOf>, at: number) => {
  const row = rows.MathAlignScope.get(idOf(at)) ?? assert.fail(`no scope row for node ${at}`);

  return {
    inherited: row.inherited,
    own: row.own,
    passes: row.passes,
    received: row.received,
    state: row.state,
  };
};

/**
 * A comment between two elements, which is no element.
 */
const comment: XdmComment = { _tag: "comment", value: "c" };

/**
 * Build the row of an `maction` over one `mi` that writes a `selection`.
 *
 * @param lexical - The `selection`'s lexical form.
 * @returns Its `MathAction` row (node 2).
 */
const readSelection = (lexical: string) =>
  rowsOf(
    documentOf(
      elementOf("m:math", [
        elementOf("m:maction", [elementOf("m:mi")], [attributeOf("selection", lexical)]),
      ]),
    ),
    ids,
  ).MathAction.get(idOf(2));

describe("import/overlays/mathml-align.ts, the align rows (spec reading 2)", () => {
  it("closes a group under an mfrac's mrow: the mfrac is the first to stop it", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mfrac, 4 mrow, 5 maligngroup, 6 mi.
    const doc = cellOf([
      elementOf("m:mfrac", [elementOf("m:mrow", [elementOf("m:maligngroup"), elementOf("m:mi")])]),
    ]);
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(rows.MathAlignScope.get(idOf(3)), {
      ...copied(doc, 3, 2),
      cell: idOf(2),
      chosen: 0n,
      dirLexical: "",
      elementChildren: 1n,
      elements: 1n,
      inherited: "ltr",
      kind: "m:mfrac",
      own: "ltr",
      parentKind: "m:mtd",
      passes: "closed",
      received: "open",
      state: "open",
    });
    assert.deepStrictEqual(standing(rows, 4), {
      inherited: "ltr",
      own: "ltr",
      passes: "closed",
      received: "closed",
      state: "closed",
    });
    assert.deepStrictEqual(rows.MathAlignScope.get(idOf(5)), {
      ...copied(doc, 5, 4),
      cell: idOf(2),
      chosen: 0n,
      dirLexical: "",
      elementChildren: 0n,
      elements: 1n,
      inherited: "ltr",
      kind: "m:maligngroup",
      own: "ltr",
      parentKind: "m:mrow",
      passes: "closed",
      received: "closed",
      state: "closed",
    });
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), []);
  });

  it("opens a group under an mrow whose dir is the one it inherits, and closes it under another", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mrow, 4 maligngroup, 5 mi.
    const same = cellOf([
      elementOf(
        "m:mrow",
        [elementOf("m:maligngroup"), elementOf("m:mi")],
        [attributeOf("dir", "ltr")],
      ),
    ]);
    const sameRows = rowsOf(same, ids);

    assert.deepStrictEqual(standing(sameRows, 3), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(sameRows.MathAlignScope.get(idOf(3))?.dirLexical, "ltr");
    assert.strictEqual(sameRows.MathAlignScope.get(idOf(4))?.state, "open");
    assert.deepStrictEqual(keysOf(sameRows.MathAlignGroup), [idOf(4)]);
    assert.deepStrictEqual(sameRows.MathAlignGroup.get(idOf(4)), {
      cell: idOf(2),
      node: idOf(4),
    });

    const other = cellOf([
      elementOf(
        "m:mrow",
        [elementOf("m:maligngroup"), elementOf("m:mi")],
        [attributeOf("dir", " rtl ")],
      ),
    ]);
    const otherRows = rowsOf(other, ids);

    assert.deepStrictEqual(standing(otherRows, 3), {
      inherited: "ltr",
      own: "rtl",
      passes: "closed",
      received: "open",
      state: "open",
    });
    assert.strictEqual(otherRows.MathAlignScope.get(idOf(3))?.dirLexical, " rtl ");
    assert.strictEqual(otherRows.MathAlignScope.get(idOf(4))?.state, "closed");
    assert.deepStrictEqual(keysOf(otherRows.MathAlignGroup), []);
  });

  it("reads an mrow's dir against the formula's: ltr in an rtl formula is a change", () => {
    // Nodes: 0 document, 1 math (dir rtl), 2 mtd, 3 mrow (dir ltr), 4 maligngroup.
    const doc = cellOf(
      [elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "ltr")])],
      [attributeOf("dir", "rtl")],
    );
    const rows = rowsOf(doc, ids);

    assert.strictEqual(rows.MathAlignScope.get(idOf(2))?.inherited, "rtl");
    assert.deepStrictEqual(standing(rows, 3), {
      inherited: "rtl",
      own: "ltr",
      passes: "closed",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(idOf(4))?.state, "closed");
  });

  it("writes a dir that is neither ltr nor rtl as none: no direction change, no dirLexical", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mrow (dir auto), 4 maligngroup.
    const doc = cellOf([
      elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "auto")]),
    ]);
    const rows = rowsOf(doc, ids);

    assert.strictEqual(rows.MathAlignScope.get(idOf(3))?.dirLexical, "");
    assert.deepStrictEqual(standing(rows, 3), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
  });

  it("copies every dir an element writes into MathDir as written, in a cell or not", () => {
    // Nodes: 0 document, 1 math, 2 mrow (dir " rtl ", outside every cell), 3 mtable, 4 mtr, 5 mtd,
    // 6 mi (dir ltr), 7 mi (dir auto), 8 mi (no dir).
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:mrow", [], [attributeOf("dir", " rtl ")]),
        elementOf("m:mtable", [
          elementOf("m:mtr", [
            elementOf("m:mtd", [
              elementOf("m:mi", [], [attributeOf("dir", "ltr")]),
              elementOf("m:mi", [], [attributeOf("dir", "auto")]),
              elementOf("m:mi"),
            ]),
          ]),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);
    assert.deepStrictEqual(
      [...rows.MathDir.values()],
      [
        { lexical: " rtl ", node: idOf(2) },
        { lexical: "ltr", node: idOf(6) },
        { lexical: "auto", node: idOf(7) },
      ],
    );
    assert.deepStrictEqual(keysOf(rows.MathDir), [idOf(2), idOf(6), idOf(7)]);
    assert.strictEqual(rows.MathAlignScope.get(idOf(7))?.dirLexical, "");
    assert.strictEqual(rows.MathAlignScope.get(idOf(6))?.dirLexical, "ltr");
  });

  it("leaves a group unjudged under an maction child that is not the selected one", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 maction, 4 mi, 5 mrow, 6 mi, 7 maligngroup.
    const doc = cellOf([
      elementOf("m:maction", [
        elementOf("m:mi"),
        elementOf("m:mrow", [elementOf("m:mi"), elementOf("m:maligngroup")]),
      ]),
    ]);
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(standing(rows, 3), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(idOf(4))?.chosen, 1n);
    assert.strictEqual(rows.MathAlignScope.get(idOf(4))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.state, "unjudged");
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.chosen, 1n);
    assert.deepStrictEqual(standing(rows, 7), {
      inherited: "ltr",
      own: "ltr",
      passes: "unjudged",
      received: "unjudged",
      state: "unjudged",
    });
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), []);
  });

  it("stands a group in a cell when it is the maction's selected child", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 maction (selection 2), 4 mi, 5 maligngroup.
    const doc = cellOf([
      elementOf(
        "m:maction",
        [elementOf("m:mi"), elementOf("m:maligngroup")],
        [attributeOf("selection", "2")],
      ),
    ]);
    const rows = rowsOf(doc, ids);

    assert.strictEqual(rows.MathAlignScope.get(idOf(4))?.state, "unjudged");
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.chosen, 2n);
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [idOf(5)]);
  });

  it("numbers a cell's leaves in document order: in mtd(mi, maligngroup, mi) slot 0 is the first mi", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mi, 4 maligngroup, 5 mi.
    const doc = cellOf([elementOf("m:mi"), elementOf("m:maligngroup"), elementOf("m:mi")]);
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(leafKeysOf(rows), [idOf(3), idOf(4), idOf(5)]);
    assert.deepStrictEqual(leavesOf(rows, 2)[0], {
      ...copied(doc, 3, 2),
      groups: 1n,
      kind: "m:mi",
    });
    assert.deepStrictEqual(leavesOf(rows, 2)[1], {
      ...copied(doc, 4, 2),
      groups: 1n,
      kind: "m:maligngroup",
    });
    assert.deepStrictEqual(keysOf(rows.MathCell), [idOf(2)]);
    assert.strictEqual(rows.MathCell.get(idOf(2))?.node, idOf(2));
    assert.strictEqual(leavesOf(rows, 2).length, 3);
  });

  it("gives leaves in document order across depth, skipping comments and an element with children", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 comment, 4 mrow, 5 mi, 6 mrow, 7 mi, 8 mi.
    const doc = cellOf([
      comment,
      elementOf("m:mrow", [elementOf("m:mi"), elementOf("m:mrow", [elementOf("m:mi")])]),
      elementOf("m:mi"),
    ]);
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(leafKeysOf(rows), [idOf(5), idOf(7), idOf(8)]);
    assert.strictEqual(leavesOf(rows, 2)[0]?.groups, 0n);
  });

  it("gives an maction its selection, 1 where unwritten, and its counts", () => {
    // Nodes: 0 document, 1 math, 2 maction (selection 2), 3 mi, 4 mi.
    const chosen = documentOf(
      elementOf("m:math", [
        elementOf(
          "m:maction",
          [elementOf("m:mi"), elementOf("m:mi")],
          [attributeOf("selection", "2")],
        ),
      ]),
    );
    const chosenRows = rowsOf(chosen, ids);

    assert.deepStrictEqual(chosenRows.MathAction.get(idOf(2)), {
      elementChildren: 2n,
      elements: 1n,
      node: idOf(2),
      selection: 2n,
      selectionLexical: "2",
      selectionText: "2",
      selectionWritten: true,
    });
    assert.deepStrictEqual(keysOf(chosenRows.MathAlignScope), []);

    const plain = documentOf(
      elementOf("m:math", [elementOf("m:maction", [elementOf("m:mi"), elementOf("m:mi")])]),
    );

    assert.deepStrictEqual(rowsOf(plain, ids).MathAction.get(idOf(2)), {
      elementChildren: 2n,
      elements: 1n,
      node: idOf(2),
      selection: 1n,
      selectionLexical: "",
      selectionText: "",
      selectionWritten: false,
    });
  });

  it("reads a selection by its collapsed form: spaces drop, a non-integer is 0", () => {
    // Nodes: 0 document, 1 math, 2 maction, 3 mi.
    assert.strictEqual(readSelection(" 3 ")?.selection, 3n);
    assert.strictEqual(readSelection(" 3 ")?.selectionText, "3");
    assert.strictEqual(readSelection(" 3 ")?.selectionLexical, " 3 ");
    assert.strictEqual(readSelection("x")?.selection, 0n);
    assert.strictEqual(readSelection("1.5")?.selection, 0n);
    assert.strictEqual(readSelection("")?.selection, 0n);
    assert.strictEqual(readSelection("99999999999999999999")?.selection, 0n);
  });

  it("reads a negative selection as 0, the natural column's floor", () => {
    // Nodes: 0 document, 1 math, 2 maction, 3 mi.
    assert.strictEqual(readSelection("-1")?.selection, 0n);
    assert.strictEqual(readSelection(" -7 ")?.selection, 0n);
    assert.strictEqual(readSelection("-9223372036854775808")?.selection, 0n);
    assert.strictEqual(readSelection("-0")?.selection, 0n);
    assert.strictEqual(readSelection("+0")?.selection, 0n);
    assert.strictEqual(readSelection("+2")?.selection, 2n);
    assert.strictEqual(readSelection("-1")?.selectionLexical, "-1");
  });

  it("gives a group outside every cell no scope row, and counts no cell", () => {
    // Nodes: 0 document, 1 math, 2 mrow, 3 maligngroup, 4 mi.
    const doc = documentOf(
      elementOf("m:math", [elementOf("m:mrow", [elementOf("m:maligngroup"), elementOf("m:mi")])]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathAlignScope), []);
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), []);
    assert.deepStrictEqual(keysOf(rows.MathCell), []);
    assert.deepStrictEqual(leafKeysOf(rows), []);
    assert.deepStrictEqual(keysOf(rows.MathAction), []);
  });

  it("makes a nested cell the root of its own scope, and an empty nested cell no leaf of the outer one", () => {
    // Nodes: 0 document, 1 math, 2 mtd (outer), 3 mi, 4 mtable, 5 mtr, 6 mtd (empty), 7 mtd, 8 mi.
    const doc = cellOf([
      elementOf("m:mi"),
      elementOf("m:mtable", [
        elementOf("m:mtr", [elementOf("m:mtd"), elementOf("m:mtd", [elementOf("m:mi")])]),
      ]),
    ]);
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathCell), [idOf(2), idOf(6), idOf(7)]);
    assert.strictEqual(rows.MathAlignScope.get(idOf(6))?.cell, idOf(6));
    assert.strictEqual(rows.MathAlignScope.get(idOf(6))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(idOf(7))?.cell, idOf(7));
    assert.strictEqual(rows.MathAlignScope.get(idOf(8))?.cell, idOf(7));
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.cell, idOf(2));
    assert.deepStrictEqual(leafKeysOf(rows), [idOf(3), idOf(8)]);
    assert.deepStrictEqual(
      leavesOf(rows, 2).map((leaf) => leaf.node),
      [idOf(3)],
    );
    assert.deepStrictEqual(
      leavesOf(rows, 7).map((leaf) => leaf.node),
      [idOf(8)],
    );
  });

  it("states a cell's own dir and takes its inherited one from the nearest ancestor that writes one", () => {
    // Nodes: 0 document, 1 math (dir rtl), 2 mtable, 3 mtr, 4 mtd (dir ltr), 5 mrow, 6 maligngroup.
    const doc = documentOf(
      elementOf(
        "m:math",
        [
          elementOf("m:mtable", [
            elementOf("m:mtr", [
              elementOf(
                "m:mtd",
                [elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "ltr")])],
                [attributeOf("dir", "ltr")],
              ),
            ]),
          ]),
        ],
        [attributeOf("dir", "rtl")],
      ),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(rows.MathAlignScope.get(idOf(4)), {
      ...copied(doc, 4, 3),
      cell: idOf(4),
      chosen: 0n,
      dirLexical: "ltr",
      elementChildren: 1n,
      elements: 1n,
      inherited: "rtl",
      kind: "m:mtd",
      own: "ltr",
      parentKind: "m:mtr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.deepStrictEqual(standing(rows, 5), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [idOf(6)]);
  });

  it("takes ltr at m:math whatever an HTML ancestor's dir (spec reading 164)", () => {
    // Nodes: 0 document, 1 div (dir rtl), 2 math, 3 mtd, 4 mrow (dir ltr), 5 maligngroup.
    const doc = documentOf(
      elementOf(
        "div",
        [
          elementOf("m:math", [
            elementOf("m:mtd", [
              elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "ltr")]),
            ]),
          ]),
        ],
        [attributeOf("dir", "rtl")],
      ),
    );
    const rows = rowsOf(doc, ids);

    assert.strictEqual(rows.MathAlignScope.get(idOf(3))?.inherited, "ltr");
    assert.deepStrictEqual(standing(rows, 4), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(idOf(5))?.state, "open");
  });

  it("passes a group through mphantom and an maction but not through any other kind", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mphantom, 4 maligngroup, 5 mfrac, 6 maligngroup.
    const doc = cellOf([
      elementOf("m:mphantom", [elementOf("m:maligngroup")]),
      elementOf("m:mfrac", [elementOf("m:maligngroup")]),
    ]);
    const rows = rowsOf(doc, ids);

    assert.strictEqual(rows.MathAlignScope.get(idOf(4))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(idOf(6))?.state, "closed");
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [idOf(4)]);
    assert.deepStrictEqual(
      leavesOf(rows, 2).map((leaf) => [leaf.node, leaf.groups]),
      [
        [idOf(4), 1n],
        [idOf(6), 1n],
      ],
    );
  });

  it("builds the rows of an element with many children in linear time", () => {
    // One cell holding 50 000 leaves: a copy of the sibling list per child would cost over a
    // billion element copies.
    const count = 50_000;
    const doc = cellOf(Array.from({ length: count }, () => elementOf("m:mi")));
    const began = performance.now();
    const rows = rowsOf(doc, ids);
    const seconds = (performance.now() - began) / 1000;

    assert.strictEqual(leafKeysOf(rows).length, count);
    assert.strictEqual(rows.MathAlignScope.size, count + 1);
    assert.isBelow(seconds, 5);
  });
});
