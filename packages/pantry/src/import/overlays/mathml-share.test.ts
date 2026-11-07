/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML share builder's free tests: over small `m:math` documents, `rowsOf` gives the rows the
 * law "MathML share cycle" is stated over (`#pantry/qti/mathml-share.ts`): a `MathRank` row for
 * each element a share or its target stands on, up to the nearest `m:math`, and a `ShareTarget` row
 * for each `m:share` whose fragment names an element of its document.
 *
 * Each case is built by construction. The oracle is the law as the module states it, read by
 * `breachesOf` below from the rows alone: each row's rank is below its parent's (but an
 * `m:math`'s), each row copies its parent's rank, and each share's rank is above its target's, with
 * both ranks copied from their `MathRank` rows. No case reads a rank off the builder's own code,
 * but the one the brief states: a share beside the element it names has the greater rank.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { GoverningOf } from "#pantry/grammar/install.ts";
import { rowsOf } from "#pantry/import/overlays/mathml-share.ts";
import type { MathmlShareRows } from "#pantry/import/overlays/mathml-share.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
  NodeId,
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
  | "m:annotation-xml"
  | "m:apply"
  | "m:ci"
  | "m:cn"
  | "m:math"
  | "m:plus"
  | "m:semantics"
  | "m:share"
  | "qti-assessment-item";

/**
 * Read the type a kind's element is governed by under its own declaration, as `identity.ts` reads
 * which attribute is an ID.
 *
 * @param kind - The kind.
 * @returns Its declared type's `TypeName` handle.
 */
const declaredType = (kind: CaseKind): string =>
  GoverningOf.rows.find(
    (row) => row.kind === kind && row.governor === kind && row.version === version,
  )?.governs ?? assert.fail(`GoverningOf holds ${kind} under its own governor`);

/**
 * Write an `id` or `src` attribute.
 *
 * @param handle - Its name.
 * @param lexical - Its lexical form.
 * @returns The attribute.
 */
const attribute = (handle: "id" | "src", lexical: string): XdmAttribute<Composed> => ({
  lexical,
  name: closedName(handle),
  references: [],
});

/**
 * Write an element of a kind under its declared type.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes.
 * @param children - Its children, in order.
 * @returns The element.
 */
const elementOf = (
  kind: CaseKind,
  attributes: readonly XdmAttribute<Composed>[] = [],
  children: readonly XdmChild<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes,
  children,
  governs: declaredType(kind),
  kind,
  namespaces: [],
  prefix: kind.startsWith("m:") ? "m" : "",
});

/**
 * Write a share of a `src`.
 *
 * @param src - Its `src`.
 * @returns The `m:share`.
 */
const shareOf = (src: string): XdmClosedElement<Composed> =>
  elementOf("m:share", [attribute("src", src)]);

/**
 * Write an `m:apply` of `plus`, carrying an id and holding the children after the operator.
 *
 * @param id - Its id, none to write none.
 * @param children - Its operands.
 * @returns The `m:apply`.
 */
const plusOf = (id: string | undefined, children: readonly XdmChild<Composed>[]) =>
  elementOf("m:apply", id === undefined ? [] : [attribute("id", id)], [
    elementOf("m:plus"),
    ...children,
  ]);

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
 * The ids every case's rows are written under, `idOf`, numbering nodes in document order, in a
 * package that holds no document at any path.
 */
const ids = { documentAt: () => Option.none(), idOf };

/**
 * The nodes a row set holds, in key order.
 *
 * @param rows - A keyed set of node-keyed rows.
 * @returns The keys, sorted.
 */
const keysOf = (rows: ReadonlyMap<string, unknown>): readonly string[] =>
  [...rows.keys()].toSorted();

/**
 * The ids of document-order numbers, sorted.
 *
 * @param numbers - The nodes' numbers.
 * @returns Their ids, sorted.
 */
const nodesOf = (...numbers: readonly number[]): readonly string[] => numbers.map(idOf).toSorted();

/**
 * Judge the rows by the law as `#pantry/qti/mathml-share.ts` states it, from the rows alone.
 *
 * @param rows - A document's share rows.
 * @returns The breaches, each a sentence; none when the database would accept the rows.
 */
const breachesOf = (rows: MathmlShareRows): readonly string[] => [
  ...[...rows.MathRank.values()].flatMap((row) => {
    if (row.kind === "m:math") {
      return [];
    }

    const parent = rows.MathRank.get(row.parent);

    return parent === undefined
      ? [`the row of ${row.node} has no row for its parent`]
      : [
          ...(parent.rank === row.parentRank ? [] : [`${row.node} copies a wrong parentRank`]),
          ...(row.rank < row.parentRank ? [] : [`${row.node} is not below its parent`]),
        ];
  }),
  ...[...rows.ShareTarget.values()].flatMap((row) => {
    const share = rows.MathRank.get(row.node);
    const target = rows.MathRank.get(row.target);

    return [
      ...(share?.rank === row.shareRank ? [] : [`${row.node} copies a wrong shareRank`]),
      ...(target?.rank === row.targetRank ? [] : [`${row.node} copies a wrong targetRank`]),
      ...(row.shareRank > row.targetRank ? [] : [`${row.node} is not above its target`]),
    ];
  }),
];

/**
 * Read one share row of a case, failing when the case holds none.
 *
 * @param rows - The rows.
 * @param node - The share's id.
 * @returns Its row.
 */
const shareRowOf = (rows: MathmlShareRows, node: NodeId) =>
  rows.ShareTarget.get(node) ?? assert.fail(`the case holds no ShareTarget row for ${node}`);

describe("import/overlays/mathml-share.ts, the rank and share rows (spec reading 2)", () => {
  it("gives apply(plus, ci id=a, share src=#a) a share rank above the ci's", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
        ),
      ),
      ids,
    );

    // plus has no row: no share stands on it.
    assert.deepStrictEqual(keysOf(rows.MathRank), nodesOf(1, 2, 4, 5));
    assert.deepStrictEqual(keysOf(rows.ShareTarget), nodesOf(5));
    assert.deepStrictEqual(shareRowOf(rows, idOf(5)), {
      document: idOf(0),
      id: "a",
      node: idOf(5),
      shareRank: 1n,
      target: idOf(4),
      targetRank: 0n,
    });
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("gives every row the tuple its node's row carries", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
        ),
      ),
      ids,
    );
    const share = rows.MathRank.get(idOf(5)) ?? assert.fail("the share has no row");

    assert.strictEqual(share.document, idOf(0));
    assert.strictEqual(share.kind, "m:share");
    assert.strictEqual(share.nearest, idOf(0));
    assert.strictEqual(share.parent, idOf(2));
    assert.strictEqual(share.version, version);
  });

  it("gives two shares of one element two ShareTarget rows above its one rank", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 apply, 6 plus, 7 share, 8 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [
            plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")])]),
            plusOf(undefined, [shareOf("#a"), shareOf("#a")]),
          ],
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.ShareTarget), nodesOf(7, 8));
    assert.strictEqual(shareRowOf(rows, idOf(7)).target, idOf(4));
    assert.strictEqual(shareRowOf(rows, idOf(8)).target, idOf(4));
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("gives apply id=a(plus, share src=#a, cn) a share rank not above its target's", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 share, 5 cn.
    const rows = rowsOf(
      documentOf(elementOf("m:math", [], [plusOf("a", [shareOf("#a"), elementOf("m:cn")])])),
      ids,
    );
    const row = shareRowOf(rows, idOf(4));

    assert.strictEqual(row.target, idOf(2));
    assert.isTrue(row.shareRank <= row.targetRank);
    assert.isAbove(breachesOf(rows).length, 0);
  });

  it("refuses two applies each holding a share of the other, at the share that closes the cycle", () => {
    // Nodes: 0 document, 1 math, 2 apply a, 3 plus, 4 share, 5 apply b, 6 plus, 7 share.
    const rows = rowsOf(
      documentOf(
        elementOf("m:math", [], [plusOf("a", [shareOf("#b")]), plusOf("b", [shareOf("#a")])]),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.ShareTarget), nodesOf(4, 7));
    assert.deepStrictEqual(breachesOf(rows), [`${idOf(7)} is not above its target`]);
  });

  it("refuses a share three levels below the element it names", () => {
    // Nodes: 0 document, 1 math, 2 apply a, 3 plus, 4 apply, 5 plus, 6 apply, 7 plus, 8 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [plusOf("a", [plusOf(undefined, [plusOf(undefined, [shareOf("#a")])])])],
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(breachesOf(rows), [`${idOf(8)} is not above its target`]);
  });

  it("accepts a share of an element in a sibling subtree however deep", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 apply, 5 plus, 6 apply, 7 plus, 8 ci,
    // 9 apply, 10 plus, 11 apply, 12 plus, 13 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [
            plusOf(undefined, [
              plusOf(undefined, [plusOf(undefined, [elementOf("m:ci", [attribute("id", "t")])])]),
            ]),
            plusOf(undefined, [plusOf(undefined, [shareOf("#t")])]),
          ],
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.ShareTarget), nodesOf(13));
    assert.strictEqual(shareRowOf(rows, idOf(13)).target, idOf(8));
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("writes a row for a target that is no MathML element, with the rows of its ancestors up to the m:math", () => {
    // The target is an HTML element inside an annotation, which a MathML share may name.
    // Nodes: 0 document, 1 math, 2 semantics, 3 apply, 4 plus, 5 share, 6 annotation-xml, 7 div.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [
            elementOf(
              "m:semantics",
              [],
              [
                plusOf(undefined, [shareOf("#t")]),
                elementOf("m:annotation-xml", [], [elementOf("div", [attribute("id", "t")])]),
              ],
            ),
          ],
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(keysOf(rows.MathRank), nodesOf(1, 2, 3, 5, 6, 7));
    assert.strictEqual(rows.MathRank.get(idOf(7))?.kind, "div");
    assert.strictEqual(shareRowOf(rows, idOf(5)).target, idOf(7));
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("refuses a share inside an HTML element it names, through the annotation that holds the math", () => {
    // Nodes: 0 document, 1 math, 2 semantics, 3 annotation-xml, 4 div, 5 math, 6 share.
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [
            elementOf(
              "m:semantics",
              [],
              [
                elementOf(
                  "m:annotation-xml",
                  [],
                  [
                    elementOf(
                      "div",
                      [attribute("id", "t")],
                      [elementOf("m:math", [], [shareOf("#t")])],
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
      ids,
    );

    // The share's chain stops at the inner m:math and the target's at the outer one, and the child
    // edges between them tie the two, so the cycle through the foreign element is followed.
    assert.deepStrictEqual(keysOf(rows.ShareTarget), nodesOf(6));
    assert.deepStrictEqual(keysOf(rows.MathRank), nodesOf(1, 2, 3, 4, 5, 6));
    assert.deepStrictEqual(breachesOf(rows), [`${idOf(6)} is not above its target`]);
  });

  it("writes no ShareTarget row for a share whose fragment names no id, or that names a file", () => {
    for (const src of ["#nowhere", "other.xml#a", "#", ""]) {
      const rows = rowsOf(documentOf(elementOf("m:math", [], [plusOf("a", [shareOf(src)])])), ids);

      assert.strictEqual(rows.ShareTarget.size, 0, src);
      assert.strictEqual(rows.MathRank.size, 0, src);
    }
  });

  it("writes no rows for a document that holds no share", () => {
    const rows = rowsOf(
      documentOf(elementOf("m:math", [], [plusOf("a", [elementOf("m:cn")])])),
      ids,
    );

    assert.strictEqual(rows.MathRank.size, 0);
    assert.strictEqual(rows.ShareTarget.size, 0);
  });

  it("writes the target's rows to the document node when no m:math holds it", () => {
    // Nodes: 0 document, 1 item, 2 div, 3 math, 4 share. The law has no row for the document node
    // that it accepts, so the database refuses this document; the oracle accepts it (a follow-up).
    const rows = rowsOf(
      documentOf(
        elementOf(
          "qti-assessment-item",
          [],
          [elementOf("div", [attribute("id", "t")]), elementOf("m:math", [], [shareOf("#t")])],
        ),
      ),
      ids,
    );

    assert.strictEqual(shareRowOf(rows, idOf(4)).target, idOf(2));
    assert.deepStrictEqual(keysOf(rows.MathRank), nodesOf(0, 1, 2, 3, 4));
  });

  it("builds a document of 50,000 siblings and one share, each element's children collected once", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 to 50,003 ci (the first holds the id), 50,004 share.
    const count = 50_000;
    const siblings = Array.from({ length: count }, (_, at) =>
      elementOf("m:ci", at === 0 ? [attribute("id", "a")] : []),
    );
    const doc = documentOf(
      elementOf("m:math", [], [plusOf(undefined, [...siblings, shareOf("#a")])]),
    );
    const rows = rowsOf(doc, ids);

    assert.deepStrictEqual(keysOf(rows.MathRank), nodesOf(1, 2, 4, count + 4));
    assert.deepStrictEqual(breachesOf(rows), []);
  }, 60_000);
});
