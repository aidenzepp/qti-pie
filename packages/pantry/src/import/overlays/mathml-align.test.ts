/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML align builder's free tests: over small `m:math` documents, `rowsOf` gives each
 * `m:maction` its `MathAction` row, each `m:mtd` its `MathCell` row and the root of its scope, each
 * element below a cell its `MathAlignScope` row in the state MathML 3 §3.5.5.2 and §3.5.5.9 give
 * it, each open `m:maligngroup` its `MathAlignGroup` row, and each complete element of a cell its
 * `CellLeaf` row, in document order, each keyed by its node's place in its document, its `start`,
 * which numbers the nodes in document order.
 *
 * Each case is built by construction and its expected rows are written by hand from MathML 3's
 * reading of the alignment group (§3.5.5.2: which elements let a group through to its cell) and of
 * `maction` (§3.7.1.1: `selection` numbers the child shown, 1 by default), never computed by the
 * builder's own code: each node's `start` is its number in the case's comment, the document node
 * 0.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { rowsOf } from "#pantry/import/overlays/mathml-align.ts";
import { keyTextOf } from "#pantry/import/overlays/mathml-tree.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmComment,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { ownViewOf } from "#pantry/import/fold.ts";

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
 * Where every case's document stands in its package: the key its rows hold.
 */
const ids = { package: "MANIFEST-align", path: "items/align.xml" };

/**
 * The key fields of a node's row: its document's, and its `start`, its number in document order.
 *
 * @param at - The node's number.
 * @returns Its `package`, `path` and `start`.
 */
const nodeAt = (at: number) => ({ package: ids.package, path: ids.path, start: BigInt(at) });

/**
 * The key of a node's row.
 *
 * @param at - The node's number.
 * @returns The key the builder keys it by.
 */
const keyAt = (at: number): string => keyTextOf(ids, BigInt(at));

/**
 * The tuple of a node a cell's leaf copies, beside the key its cell's nesting supplies: its
 * version, start, nearest interaction (the document node, 0, where no interaction holds the
 * formula) and parent.
 *
 * @param at - The node's number.
 * @param parent - Its parent's number.
 * @returns The copied fields.
 */
const leafCopied = (at: number, parent: number) => ({
  nearest: 0n,
  parent: BigInt(parent),
  start: BigInt(at),
  version,
});

/**
 * The tuple of a node the rows copy: its key, version, nearest interaction (the document node, 0,
 * where no interaction holds the formula) and parent.
 *
 * @param at - The node's number.
 * @param parent - Its parent's number.
 * @returns The copied fields.
 */
const copied = (at: number, parent: number) => ({ ...nodeAt(at), ...leafCopied(at, parent) });

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
  rows.MathCell.get(keyAt(cell))?.leaves ?? assert.fail(`no cell row for node ${cell}`);

/**
 * The nodes of every cell's leaves, cell by cell, each cell's in nesting order.
 *
 * @param rows - The document's rows.
 * @returns The leaves' starts.
 */
const leafStartsOf = (rows: ReturnType<typeof rowsOf>): readonly bigint[] =>
  [...rows.MathCell.values()].flatMap((cell) => cell.leaves.map((leaf) => leaf.start));

/**
 * What a scope row says of where its element stands.
 *
 * @param rows - A case's rows.
 * @param at - The element's number.
 * @returns Its `state`, `received`, `passes`, `inherited` and `own`.
 */
const standing = (rows: ReturnType<typeof rowsOf>, at: number) => {
  const row = rows.MathAlignScope.get(keyAt(at)) ?? assert.fail(`no scope row for node ${at}`);

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
    ownViewOf(
      documentOf(
        elementOf("m:math", [
          elementOf("m:maction", [elementOf("m:mi")], [attributeOf("selection", lexical)]),
        ]),
      ),
    ),
    ids,
  ).MathAction.get(keyAt(2));

/**
 * Read the selection the importer copies to an `maction`'s child, its `chosen`, of an `maction` in
 * a cell over one `mi` that writes a `selection`. The database derives the action's own
 * `selection` (`MathAction`, a generated field) and holds every child's copy to it.
 *
 * @param lexical - The `selection`'s lexical form.
 * @returns The `mi`'s `chosen` (node 4: 0 document, 1 math, 2 mtd, 3 maction, 4 mi).
 */
const chosenUnder = (lexical: string) =>
  rowsOf(
    ownViewOf(
      cellOf([elementOf("m:maction", [elementOf("m:mi")], [attributeOf("selection", lexical)])]),
    ),
    ids,
  ).MathAlignScope.get(keyAt(4))?.chosen;

describe("import/overlays/mathml-align.ts, the align rows (spec reading 2)", () => {
  it("closes a group under an mfrac's mrow: the mfrac is the first to stop it", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mfrac, 4 mrow, 5 maligngroup, 6 mi.
    const doc = cellOf([
      elementOf("m:mfrac", [elementOf("m:mrow", [elementOf("m:maligngroup"), elementOf("m:mi")])]),
    ]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(rows.MathAlignScope.get(keyAt(3)), {
      ...copied(3, 2),
      cell: 2n,
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
    assert.deepStrictEqual(rows.MathAlignScope.get(keyAt(5)), {
      ...copied(5, 4),
      cell: 2n,
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
    const sameRows = rowsOf(ownViewOf(same), ids);

    assert.deepStrictEqual(standing(sameRows, 3), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(sameRows.MathAlignScope.get(keyAt(3))?.dirLexical, "ltr");
    assert.strictEqual(sameRows.MathAlignScope.get(keyAt(4))?.state, "open");
    assert.deepStrictEqual(keysOf(sameRows.MathAlignGroup), [keyAt(4)]);
    assert.deepStrictEqual(sameRows.MathAlignGroup.get(keyAt(4)), {
      cell: 2n,
      ...nodeAt(4),
    });

    const other = cellOf([
      elementOf(
        "m:mrow",
        [elementOf("m:maligngroup"), elementOf("m:mi")],
        [attributeOf("dir", " rtl ")],
      ),
    ]);
    const otherRows = rowsOf(ownViewOf(other), ids);

    assert.deepStrictEqual(standing(otherRows, 3), {
      inherited: "ltr",
      own: "rtl",
      passes: "closed",
      received: "open",
      state: "open",
    });
    assert.strictEqual(otherRows.MathAlignScope.get(keyAt(3))?.dirLexical, " rtl ");
    assert.strictEqual(otherRows.MathAlignScope.get(keyAt(4))?.state, "closed");
    assert.deepStrictEqual(keysOf(otherRows.MathAlignGroup), []);
  });

  it("reads an mrow's dir against the formula's: ltr in an rtl formula is a change", () => {
    // Nodes: 0 document, 1 math (dir rtl), 2 mtd, 3 mrow (dir ltr), 4 maligngroup.
    const doc = cellOf(
      [elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "ltr")])],
      [attributeOf("dir", "rtl")],
    );
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.strictEqual(rows.MathAlignScope.get(keyAt(2))?.inherited, "rtl");
    assert.deepStrictEqual(standing(rows, 3), {
      inherited: "rtl",
      own: "ltr",
      passes: "closed",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(keyAt(4))?.state, "closed");
  });

  it("writes a dir that is neither ltr nor rtl as none: no direction change, no dirLexical", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mrow (dir auto), 4 maligngroup.
    const doc = cellOf([
      elementOf("m:mrow", [elementOf("m:maligngroup")], [attributeOf("dir", "auto")]),
    ]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.strictEqual(rows.MathAlignScope.get(keyAt(3))?.dirLexical, "");
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
    const rows = rowsOf(ownViewOf(doc), ids);
    assert.deepStrictEqual(
      [...rows.MathDir.values()],
      [
        { lexical: " rtl ", ...nodeAt(2) },
        { lexical: "ltr", ...nodeAt(6) },
        { lexical: "auto", ...nodeAt(7) },
      ],
    );
    assert.deepStrictEqual(keysOf(rows.MathDir), [keyAt(2), keyAt(6), keyAt(7)]);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(7))?.dirLexical, "");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(6))?.dirLexical, "ltr");
  });

  it("leaves a group unjudged under an maction child that is not the selected one", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 maction, 4 mi, 5 mrow, 6 mi, 7 maligngroup.
    const doc = cellOf([
      elementOf("m:maction", [
        elementOf("m:mi"),
        elementOf("m:mrow", [elementOf("m:mi"), elementOf("m:maligngroup")]),
      ]),
    ]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(standing(rows, 3), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(keyAt(4))?.chosen, 1n);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(4))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.state, "unjudged");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.chosen, 1n);
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
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.strictEqual(rows.MathAlignScope.get(keyAt(4))?.state, "unjudged");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.chosen, 2n);
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [keyAt(5)]);
  });

  it("numbers a cell's leaves in document order: in mtd(mi, maligngroup, mi) slot 0 is the first mi", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mi, 4 maligngroup, 5 mi.
    const doc = cellOf([elementOf("m:mi"), elementOf("m:maligngroup"), elementOf("m:mi")]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(leafStartsOf(rows), [3n, 4n, 5n]);
    assert.deepStrictEqual(leavesOf(rows, 2)[0], {
      ...leafCopied(3, 2),
      groups: 1n,
      kind: "m:mi",
    });
    assert.deepStrictEqual(leavesOf(rows, 2)[1], {
      ...leafCopied(4, 2),
      groups: 1n,
      kind: "m:maligngroup",
    });
    assert.deepStrictEqual(keysOf(rows.MathCell), [keyAt(2)]);
    assert.strictEqual(rows.MathCell.get(keyAt(2))?.start, 2n);
    assert.strictEqual(leavesOf(rows, 2).length, 3);
  });

  it("gives leaves in document order across depth, skipping comments and an element with children", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 comment, 4 mrow, 5 mi, 6 mrow, 7 mi, 8 mi.
    const doc = cellOf([
      comment,
      elementOf("m:mrow", [elementOf("m:mi"), elementOf("m:mrow", [elementOf("m:mi")])]),
      elementOf("m:mi"),
    ]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(leafStartsOf(rows), [5n, 7n, 8n]);
    assert.strictEqual(leavesOf(rows, 2)[0]?.groups, 0n);
  });

  it("gives an maction its selection's lexical form, empty where unwritten, and its counts", () => {
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
    const chosenRows = rowsOf(ownViewOf(chosen), ids);

    assert.deepStrictEqual(chosenRows.MathAction.get(keyAt(2)), {
      elementChildren: 2n,
      elements: 1n,
      ...nodeAt(2),
      selectionLexical: "2",
      selectionWritten: true,
    });
    assert.deepStrictEqual(keysOf(chosenRows.MathAlignScope), []);

    const plain = documentOf(
      elementOf("m:math", [elementOf("m:maction", [elementOf("m:mi"), elementOf("m:mi")])]),
    );

    assert.deepStrictEqual(rowsOf(ownViewOf(plain), ids).MathAction.get(keyAt(2)), {
      elementChildren: 2n,
      elements: 1n,
      ...nodeAt(2),
      selectionLexical: "",
      selectionWritten: false,
    });
  });

  it("copies a selection to the action's child by its collapsed form: spaces drop, a non-integer is 0", () => {
    // Oracle: the database's generated `MathAction.selection` as `src/qti/mathml-align.ts` states
    // it, the collapsed form read in `integerForm`, 0 for a non-integer, which the child's copy is
    // held to.
    assert.strictEqual(chosenUnder(" 3 "), 3n);
    assert.strictEqual(readSelection(" 3 ")?.selectionLexical, " 3 ");
    assert.strictEqual(chosenUnder("x"), 0n);
    assert.strictEqual(chosenUnder("1.5"), 0n);
    assert.strictEqual(chosenUnder(""), 0n);
    assert.strictEqual(chosenUnder("99999999999999999999"), 0n);
  });

  it("copies a negative selection to the action's child as 0, the natural column's floor", () => {
    assert.strictEqual(chosenUnder("-1"), 0n);
    assert.strictEqual(chosenUnder(" -7 "), 0n);
    assert.strictEqual(chosenUnder("-9223372036854775808"), 0n);
    assert.strictEqual(chosenUnder("-0"), 0n);
    assert.strictEqual(chosenUnder("+0"), 0n);
    assert.strictEqual(chosenUnder("+2"), 2n);
    assert.strictEqual(readSelection("-1")?.selectionLexical, "-1");
  });

  it("gives a group outside every cell no scope row, and counts no cell", () => {
    // Nodes: 0 document, 1 math, 2 mrow, 3 maligngroup, 4 mi.
    const doc = documentOf(
      elementOf("m:math", [elementOf("m:mrow", [elementOf("m:maligngroup"), elementOf("m:mi")])]),
    );
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(keysOf(rows.MathAlignScope), []);
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), []);
    assert.deepStrictEqual(keysOf(rows.MathCell), []);
    assert.deepStrictEqual(leafStartsOf(rows), []);
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
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(keysOf(rows.MathCell), [keyAt(2), keyAt(6), keyAt(7)]);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(6))?.cell, 6n);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(6))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(7))?.cell, 7n);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(8))?.cell, 7n);
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.cell, 2n);
    assert.deepStrictEqual(leafStartsOf(rows), [3n, 8n]);
    assert.deepStrictEqual(
      leavesOf(rows, 2).map((leaf) => leaf.start),
      [3n],
    );
    assert.deepStrictEqual(
      leavesOf(rows, 7).map((leaf) => leaf.start),
      [8n],
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
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.deepStrictEqual(rows.MathAlignScope.get(keyAt(4)), {
      ...copied(4, 3),
      cell: 4n,
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
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [keyAt(6)]);
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
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.strictEqual(rows.MathAlignScope.get(keyAt(3))?.inherited, "ltr");
    assert.deepStrictEqual(standing(rows, 4), {
      inherited: "ltr",
      own: "ltr",
      passes: "open",
      received: "open",
      state: "open",
    });
    assert.strictEqual(rows.MathAlignScope.get(keyAt(5))?.state, "open");
  });

  it("passes a group through mphantom and an maction but not through any other kind", () => {
    // Nodes: 0 document, 1 math, 2 mtd, 3 mphantom, 4 maligngroup, 5 mfrac, 6 maligngroup.
    const doc = cellOf([
      elementOf("m:mphantom", [elementOf("m:maligngroup")]),
      elementOf("m:mfrac", [elementOf("m:maligngroup")]),
    ]);
    const rows = rowsOf(ownViewOf(doc), ids);

    assert.strictEqual(rows.MathAlignScope.get(keyAt(4))?.state, "open");
    assert.strictEqual(rows.MathAlignScope.get(keyAt(6))?.state, "closed");
    assert.deepStrictEqual(keysOf(rows.MathAlignGroup), [keyAt(4)]);
    assert.deepStrictEqual(
      leavesOf(rows, 2).map((leaf) => [leaf.start, leaf.groups]),
      [
        [4n, 1n],
        [6n, 1n],
      ],
    );
  });
});
