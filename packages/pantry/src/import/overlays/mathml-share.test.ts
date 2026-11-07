/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The MathML share builder's free tests: over small `m:math` documents, `rowsOf` gives the rows the
 * law "MathML share cycle" is stated over (`#pantry/qti/mathml-share.ts`): a `MathRank` row for
 * each element a share or its target stands on, up to the nearest `m:math`, and a `ShareTarget` row
 * for each `m:share` whose fragment names an element of its document.
 *
 * `placedShareRowsOf` places the shares of a document in an assembly under each instance of it
 * (spec reading 117), over documents built by construction and instances written by hand; its
 * oracle is the placed law as the module states it, read by `placedBreachesOf` from the rows alone.
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
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import { placedShareRowsOf, rowsOf } from "#pantry/import/overlays/mathml-share.ts";
import type {
  IncludeSite,
  MathmlShareRows,
  PlacedShareRows,
  PlacementRoot,
} from "#pantry/import/overlays/mathml-share.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName, flatten } from "#pantry/model/xdm.ts";
import type {
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
  NodeId,
} from "#pantry/model/xdm.ts";
import { splicingParents } from "#pantry/qti/tests.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The timeout, in milliseconds, that this file's slower test states: a hang guard, never a budget.
 * Measured 2026-11-07: 3.7 s at a load average of 17.65 to 123.38, its slowest test, in a free run.
 * Measured 2026-11-07: 1.8 s at a load average of 74.59 to 117.21, its slowest test, run alone.
 */
const testTimeoutMs = 60_000;

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
  | "m:mi"
  | "m:mrow"
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
 * package that holds no document at any path, the document listed as an item's, a type whose
 * records a package does not read.
 */
const ids = {
  documentType: "imsqti_item_xmlv3p0",
  idOf,
  targetAt: () => Option.none(),
} as const satisfies IdentityIds;

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

  it(
    "builds a document of 50,000 siblings and one share, each element's children collected once",
    () => {
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
    },
    testTimeoutMs,
  );
});

/**
 * A document of the placed cases: its tree, and the ids its nodes are written under, numbered from
 * `base` so no two documents of a case share an id.
 */
interface Written {
  readonly base: number;
  readonly tree: XdmDocument<Composed>;
}

/**
 * The ids of a written document.
 *
 * @param written - The document.
 * @returns Its ids, `base` and the node's number in document order, in an assembly, listed as
 *   an item's as {@link ids} is.
 */
const assembledIds = ({ base }: Written): IdentityIds => ({
  assembled: true,
  documentType: ids.documentType,
  idOf: (index: number) => idOf(base + index),
  targetAt: () => Option.none(),
});

/**
 * Place the shares of some written documents, as the package's pass reads them.
 *
 * @param documents - Every document of the package.
 * @param instances - Every assembly's root instance.
 * @param sites - The includes' sites.
 * @returns The placed rows.
 */
const placedOf = (
  documents: readonly Written[],
  instances: readonly PlacementRoot[],
  sites: readonly IncludeSite[] = [],
): PlacedShareRows => {
  const rows = documents.map((written) => identityRowsOf(written.tree, assembledIds(written)));

  return placedShareRowsOf({
    ids: rows.flatMap(({ DocumentId }) => [...DocumentId.values()]),
    instances,
    nodesOf: (document) => {
      const written = documents.find(({ base }) => idOf(base) === document);

      return written === undefined ? [] : flatten(written.tree, assembledIds(written).idOf).nodes;
    },
    shares: rows.flatMap(({ ShareFragment }) => [...ShareFragment.values()]),
    sites,
  });
};

/**
 * An item of the placed cases whose math is the given markup, followed by a division the include
 * stands at: nodes 0 the document, 1 the item, and the math, then the division, last.
 *
 * @param math - The `m:math` the item holds.
 * @returns The item at base 0.
 */
const itemWith = (math: XdmClosedElement<Composed>): Written => ({
  base: 0,
  tree: documentOf(elementOf("qti-assessment-item", [], [math, elementOf("div")])),
});

/**
 * A fragment of the placed cases: a root `m:math` holding the given elements, at base 100.
 *
 * @param children - The math's children.
 * @returns The fragment.
 */
const fragmentWith = (...children: readonly XdmChild<Composed>[]): Written => ({
  base: 100,
  tree: documentOf(elementOf("m:math", [], children)),
});

/**
 * An assembly of an item and the fragment it includes, an instance of each.
 *
 * @param item - The item's base.
 * @param include - The node of the include, the division that ends the item.
 * @param instance - The fragment's instance's id.
 * @returns The assembly's root.
 */
const assemblyOf = (item: number, include: number, instance: NodeId): PlacementRoot => ({
  assembly: idOf(item),
  assemblyKind: "qti-assessment-item",
  children: [{ children: [], document: idOf(100), id: instance, site: idOf(item + include) }],
  document: idOf(item),
  id: idOf(item),
  site: idOf(item),
});

/**
 * The include's site: the item's root holds it, a parent whose include splices.
 *
 * @param item - The item's base.
 * @param include - The node of the include.
 * @returns The site.
 */
const siteOf = (item: number, include: number): IncludeSite => ({
  node: idOf(item + include),
  parent: idOf(item + 1),
  parentKind: splicingParents[0] ?? assert.fail("some parent's include splices"),
});

/**
 * Judge the placed rows by the placed law, from the rows alone.
 *
 * @param rows - A package's placed rows.
 * @returns The breaches, each a sentence; none when the database would accept the rows.
 */
const placedBreachesOf = (rows: PlacedShareRows): readonly string[] => {
  const rankAt = (instance: NodeId, node: NodeId) =>
    rows.PlacedMathRank.get(JSON.stringify([instance, node]));

  return [
    ...[...rows.PlacedMathRank.values()].flatMap((row) => {
      if (row.kind === "m:math" || row.node === row.parent) {
        return [];
      }

      const parent = rankAt(row.instance, row.parent);

      return parent === undefined
        ? [`the row of ${row.node} has no row for its parent`]
        : [
            ...(parent.rank === row.parentRank ? [] : [`${row.node} copies a wrong parentRank`]),
            ...(row.rank < row.parentRank ? [] : [`${row.node} is not below its parent`]),
          ];
    }),
    ...[...rows.PlacedShareTarget.values()].flatMap((row) => {
      const share = rankAt(row.instance, row.node);
      const target = rankAt(row.targetInstance, row.target);

      return [
        ...(share?.rank === row.shareRank ? [] : [`${row.node} copies a wrong shareRank`]),
        ...(target?.rank === row.targetRank ? [] : [`${row.node} copies a wrong targetRank`]),
        ...(row.shareRank > row.targetRank ? [] : [`${row.node} is not above its target`]),
      ];
    }),
  ];
};

describe("import/overlays/mathml-share.ts, the shares of an assembled document (spec reading 117)", () => {
  // Nodes of the item: 0 document, 1 item, 2 math, 3 mi id=x, 4 division (the include).
  // Nodes of the fragment: 100 document, 101 math, 102 share.
  it("writes no MathRank or ShareTarget row for a document in an assembly", () => {
    const rows = rowsOf(
      documentOf(
        elementOf(
          "m:math",
          [],
          [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
        ),
      ),
      { ...ids, assembled: true },
    );

    assert.strictEqual(rows.MathRank.size, 0);
    assert.strictEqual(rows.ShareTarget.size, 0);
  });

  it("places a fragment's share naming its item's element once, in the item's instance", () => {
    const rows = placedOf(
      [
        itemWith(elementOf("m:math", [], [elementOf("m:mi", [attribute("id", "x")])])),
        fragmentWith(shareOf("#x")),
      ],
      [assemblyOf(0, 4, idOf(900))],
      [siteOf(0, 4)],
    );
    const placed = [...rows.PlacedShareTarget.values()];

    assert.deepStrictEqual(placed.length, 1);
    assert.deepStrictEqual(placed[0], {
      assembly: idOf(0),
      assemblyKind: "qti-assessment-item",
      document: idOf(100),
      id: "x",
      instance: idOf(900),
      node: idOf(102),
      shareRank: 1n,
      target: idOf(3),
      targetCopy: idOf(0),
      targetDocument: idOf(0),
      targetInstance: idOf(0),
      targetRank: 0n,
    });
    assert.deepStrictEqual(placedBreachesOf(rows), []);
  });

  it("places an item's share naming its fragment's element, below the item's math", () => {
    const rows = placedOf(
      [
        itemWith(elementOf("m:math", [], [shareOf("#y")])),
        fragmentWith(elementOf("m:mi", [attribute("id", "y")])),
      ],
      [assemblyOf(0, 4, idOf(900))],
      [siteOf(0, 4)],
    );
    const [placed] = [...rows.PlacedShareTarget.values()];

    assert.strictEqual(placed?.instance, idOf(0));
    assert.strictEqual(placed?.targetInstance, idOf(900));
    assert.strictEqual(placed?.targetCopy, idOf(900));
    assert.isTrue((placed?.shareRank ?? 0n) > (placed?.targetRank ?? 0n));
    assert.deepStrictEqual(placedBreachesOf(rows), []);
  });

  it("places a fragment included by two items, and ranks it, once per instance", () => {
    // The fragment's `m:share` names `x`, an `m:mrow` holding a `cn` in the first item and an `m:mi`
    // in the second, so the share ranks above the first's target and apart from the second's.
    const first = itemWith(
      elementOf("m:math", [], [elementOf("m:mrow", [attribute("id", "x")], [elementOf("m:cn")])]),
    );
    const second: Written = {
      base: 200,
      tree: documentOf(
        elementOf(
          "qti-assessment-item",
          [],
          [elementOf("m:math", [], [elementOf("m:mi", [attribute("id", "x")])]), elementOf("div")],
        ),
      ),
    };
    const rows = placedOf(
      [first, second, fragmentWith(shareOf("#x"))],
      [assemblyOf(0, 5, idOf(900)), assemblyOf(200, 4, idOf(901))],
      [siteOf(0, 5), siteOf(200, 4)],
    );

    // Nodes of the first item: 0 document, 1 item, 2 math, 3 mrow, 4 cn, 5 division. Of the
    // fragment: 100 document, 101 math, 102 share.
    assert.deepStrictEqual(
      [...rows.PlacedShareTarget.values()].map(({ instance, target, targetInstance }) => [
        instance,
        target,
        targetInstance,
      ]),
      [
        [idOf(900), idOf(3), idOf(0)],
        [idOf(901), idOf(203), idOf(200)],
      ],
    );
    assert.deepStrictEqual(
      [...rows.PlacedMathRank.values()]
        .filter(({ node }) => node === idOf(102))
        .map(({ instance }) => instance),
      [idOf(900), idOf(901)],
    );
    assert.deepStrictEqual(placedBreachesOf(rows), []);
  });

  it("refuses a cycle across the include at exactly one share", () => {
    const rows = placedOf(
      [
        itemWith(
          elementOf("m:math", [], [elementOf("m:mrow", [attribute("id", "x")], [shareOf("#y")])]),
        ),
        fragmentWith(elementOf("m:mrow", [attribute("id", "y")], [shareOf("#x")])),
      ],
      [assemblyOf(0, 5, idOf(900))],
      [siteOf(0, 5)],
    );

    assert.strictEqual(rows.PlacedShareTarget.size, 2);
    assert.strictEqual(
      [...rows.PlacedShareTarget.values()].filter(
        ({ shareRank, targetRank }) => shareRank <= targetRank,
      ).length,
      1,
    );
    assert.isAbove(placedBreachesOf(rows).length, 0);
  });

  it("writes no PlacedShareTarget for a share whose id the assembly does not bind, and nothing for no share", () => {
    const unbound = placedOf(
      [itemWith(elementOf("m:math")), fragmentWith(shareOf("#nowhere"))],
      [assemblyOf(0, 4, idOf(900))],
      [siteOf(0, 4)],
    );
    const none = placedOf(
      [itemWith(elementOf("m:math")), fragmentWith(elementOf("m:mi"))],
      [assemblyOf(0, 4, idOf(900))],
      [siteOf(0, 4)],
    );

    assert.strictEqual(unbound.PlacedShareTarget.size, 0);
    assert.strictEqual(unbound.PlacedMathRank.size, 0);
    assert.strictEqual(none.PlacedShareTarget.size, 0);
    assert.strictEqual(none.PlacedMathRank.size, 0);
  });
});
