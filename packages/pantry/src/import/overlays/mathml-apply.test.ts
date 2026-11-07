/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML apply builder's free tests: over small `m:math` documents, `rowsOf` gives each
 * `m:apply` with an element child its `MathApply` row, each element after the operator that is no
 * qualifier its `MathArgument` row, and each `degree`, `momentabout` or `logbase` beside a built-in
 * operator its `MathQualifier` row, under the ids the tree's nodes carry.
 *
 * Each case is built by construction and its expected rows are written by hand from MathML 3's
 * reading of `apply` (§4.3.4: its first element child is the operator, the rest are arguments and
 * qualifiers), never computed by the builder's own code; only a node's `start` and `version`, which
 * the tree owns and the rows copy, are read from the flat rows.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { rowsOf } from "#pantry/import/overlays/mathml-apply.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type {
  XdmChild,
  XdmClosedElement,
  XdmComment,
  XdmDocument,
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
type CaseKind =
  | "m:apply"
  | "m:bvar"
  | "m:ci"
  | "m:cn"
  | "m:degree"
  | "m:int"
  | "m:log"
  | "m:logbase"
  | "m:lowlimit"
  | "m:math"
  | "m:moment"
  | "m:momentabout"
  | "m:root"
  | "m:sin";

/**
 * Write an element of a kind, which governs no type (`GoverningOf` gives MathML's `none`).
 *
 * @param kind - Its kind.
 * @param children - Its children, in order.
 * @returns The element.
 */
const elementOf = (
  kind: CaseKind,
  children: readonly XdmChild<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: [],
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "m",
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
 * The ids every case's rows are written under, `idOf`, numbering nodes in document order.
 */
const ids = { idOf };

/**
 * The document node's id, node 0 of every case.
 */
const documentNode = idOf(0);

/**
 * The `start` the tree gives a node, which the rows copy.
 *
 * @param doc - The case's document.
 * @param at - The node's number in document order.
 * @returns Its `start`.
 */
const startOf = (doc: XdmDocument<Composed>, at: number): bigint =>
  flatten(doc, idOf).nodes.find((node) => node.id === idOf(at))?.start ??
  assert.fail(`the case holds no node ${at}`);

/**
 * The tuple of a node the rows copy, as every row of a case carries it: its document, version,
 * start, nearest interaction (the document node, where no interaction holds the formula) and
 * parent.
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
 * The nodes a row set holds, in key order, as numbers of document order.
 *
 * @param rows - A keyed set of node-keyed rows.
 * @returns The keys, sorted.
 */
const keysOf = (rows: ReadonlyMap<string, unknown>): readonly string[] =>
  [...rows.keys()].toSorted();

/**
 * A whitespace run between two elements, which is no element.
 */
const spacing: XdmWhitespace = { _tag: "ws", value: "\n" };

/**
 * A comment between two elements, which is no element either.
 */
const comment: XdmComment = { _tag: "comment", value: "c" };

describe("import/overlays/mathml-apply.ts, the apply rows (spec reading 2)", () => {
  it("gives apply(sin, ci) one MathApply row with one argument and no qualifier", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 sin, 4 ci.
    const doc = documentOf(
      elementOf("m:math", [elementOf("m:apply", [elementOf("m:sin"), elementOf("m:ci")])]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathApply), [idOf(2)]);
    assert.deepStrictEqual(rows.MathApply.get(idOf(2)), {
      ...copied(doc, 2, 1),
      elementChildren: 2n,
      elements: 1n,
      kind: "m:apply",
      operator: "m:sin",
    });
    assert.deepStrictEqual(keysOf(rows.MathArgument), [idOf(4)]);
    assert.deepStrictEqual(rows.MathArgument.get(idOf(4)), {
      ...copied(doc, 4, 2),
      kind: "m:ci",
    });
    assert.deepStrictEqual(keysOf(rows.MathQualifier), []);
  });

  it("gives apply(log, logbase, ci) a qualifier row with head m:log, and the logbase no argument row", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 log, 4 logbase, 5 cn, 6 ci.
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [
          elementOf("m:log"),
          elementOf("m:logbase", [elementOf("m:cn")]),
          elementOf("m:ci"),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(rows.MathApply.get(idOf(2)), {
      ...copied(doc, 2, 1),
      elementChildren: 3n,
      elements: 1n,
      kind: "m:apply",
      operator: "m:log",
    });
    assert.deepStrictEqual(keysOf(rows.MathQualifier), [idOf(4)]);
    assert.deepStrictEqual(rows.MathQualifier.get(idOf(4)), {
      ...copied(doc, 4, 2),
      head: "m:log",
      kind: "m:logbase",
    });
    assert.deepStrictEqual(keysOf(rows.MathArgument), [idOf(6)]);
  });

  it("gives apply(apply(ci), degree, ci) no qualifier row, the head being no operator, and rows for both applications", () => {
    // Nodes: 0 document, 1 math, 2 outer apply, 3 inner apply, 4 ci, 5 degree, 6 ci, 7 ci.
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [
          elementOf("m:apply", [elementOf("m:ci")]),
          elementOf("m:degree", [elementOf("m:ci")]),
          elementOf("m:ci"),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathQualifier), []);
    assert.deepStrictEqual(keysOf(rows.MathApply), [idOf(2), idOf(3)]);
    assert.deepStrictEqual(rows.MathApply.get(idOf(2)), {
      ...copied(doc, 2, 1),
      elementChildren: 3n,
      elements: 1n,
      kind: "m:apply",
      operator: "m:apply",
    });
    assert.deepStrictEqual(rows.MathApply.get(idOf(3)), {
      ...copied(doc, 3, 2),
      elementChildren: 1n,
      elements: 1n,
      kind: "m:apply",
      operator: "m:ci",
    });
    // The degree is a qualifier kind, so only the last ci is an argument of the outer application,
    // and the inner one's ci its own.
    assert.deepStrictEqual(keysOf(rows.MathArgument), [idOf(7)]);
  });

  it("gives apply(int, bvar, lowlimit, ci) one argument and no qualifier row, its element count showing the qualifiers", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 int, 4 bvar, 5 ci, 6 lowlimit, 7 cn, 8 ci.
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [
          elementOf("m:int"),
          elementOf("m:bvar", [elementOf("m:ci")]),
          elementOf("m:lowlimit", [elementOf("m:cn")]),
          elementOf("m:ci"),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(rows.MathApply.get(idOf(2)), {
      ...copied(doc, 2, 1),
      elementChildren: 4n,
      elements: 1n,
      kind: "m:apply",
      operator: "m:int",
    });
    assert.deepStrictEqual(keysOf(rows.MathArgument), [idOf(8)]);
    assert.deepStrictEqual(keysOf(rows.MathQualifier), []);
  });

  it("gives a head qualifier beside a built-in operator a row, whether or not its syntax table lists the qualifier", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 root, 4 degree, 5 ci, 6 logbase, 7 cn, 8 ci; and a
    // second apply, 9, of moment (10), momentabout (11), ci (12) and ci (13).
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [
          elementOf("m:root"),
          elementOf("m:degree", [elementOf("m:ci")]),
          elementOf("m:logbase", [elementOf("m:cn")]),
          elementOf("m:ci"),
        ]),
        elementOf("m:apply", [
          elementOf("m:moment"),
          elementOf("m:momentabout", [elementOf("m:ci")]),
          elementOf("m:ci"),
        ]),
      ]),
    );
    const rows = rowsOf(doc, ids);

    // The row is written for any pair; the database refuses the one the syntax tables do not list.
    assert.deepStrictEqual(keysOf(rows.MathQualifier), [idOf(4), idOf(6), idOf(11)]);
    assert.strictEqual(rows.MathQualifier.get(idOf(4))?.head, "m:root");
    assert.strictEqual(rows.MathQualifier.get(idOf(6))?.head, "m:root");
    assert.strictEqual(rows.MathQualifier.get(idOf(6))?.kind, "m:logbase");
    assert.strictEqual(rows.MathQualifier.get(idOf(11))?.head, "m:moment");
    assert.deepStrictEqual(keysOf(rows.MathArgument), [idOf(8), idOf(13)]);
    assert.strictEqual(rows.MathApply.get(idOf(9))?.elements, 2n);
  });

  it("gives an application no row where it holds no element child, and counts only elements among its children", () => {
    // An empty apply, then one holding whitespace, a comment, sin, whitespace and ci: the character
    // nodes are numbered but are no element, so sin ranks 1 and ci 2 and the count is 2.
    const doc = documentOf(
      elementOf("m:math", [
        elementOf("m:apply", [spacing, comment]),
        elementOf("m:apply", [spacing, comment, elementOf("m:sin"), spacing, elementOf("m:ci")]),
      ]),
    );
    const rows = rowsOf(doc, ids);
    const flat = flatten(doc, idOf);
    const [, second] = flat.nodes.filter((node) => node.kind === "m:apply");
    const sin = flat.nodes.find((node) => node.kind === "m:sin");
    const ci = flat.nodes.find((node) => node.kind === "m:ci");
    assert.ok(second !== undefined && sin !== undefined && ci !== undefined);

    assert.deepStrictEqual(keysOf(rows.MathApply), [second.id]);
    assert.strictEqual(rows.MathApply.get(second.id)?.elementChildren, 2n);
    assert.strictEqual(rows.MathApply.get(second.id)?.elements, 2n);
    assert.strictEqual(rows.MathApply.get(second.id)?.operator, "m:sin");
    assert.deepStrictEqual(keysOf(rows.MathArgument), [ci.id]);
  });

  it("gives a document with no apply no rows", () => {
    const rows = rowsOf(documentOf(elementOf("m:math", [elementOf("m:ci")])), ids);

    assert.deepStrictEqual(keysOf(rows.MathApply), []);
    assert.deepStrictEqual(keysOf(rows.MathArgument), []);
    assert.deepStrictEqual(keysOf(rows.MathQualifier), []);
  });
});
