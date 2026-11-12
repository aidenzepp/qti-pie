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
import { AnonymousType, GoverningOf } from "#pantry/grammar/install.ts";
import { ownViewOf } from "#pantry/import/fold.ts";
import type { IdentityIds } from "#pantry/import/overlays/identity.ts";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import { placedShareRowsOf, rowsOf } from "#pantry/import/overlays/mathml-share.ts";
import type {
  IncludeSite,
  MathmlShareRows,
  PlacedShareRows,
} from "#pantry/import/overlays/mathml-share.ts";
import type { InstanceRoot } from "#pantry/import/overlays/tests.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type { XdmAttribute, XdmChild, XdmClosedElement, XdmDocument } from "#pantry/model/xdm.ts";
import { splicingParents } from "#pantry/vocab/terms/tests.ts";

/**
 * The timeout, in milliseconds, that this file's slower test states: a hang guard.
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
 * which attribute is an ID: none for a kind whose type is anonymous (`AnonymousType`), as every
 * MathML kind's is, else `GoverningOf`'s row whose governor is the kind itself.
 *
 * @param kind - The kind.
 * @returns Its declared type's `TypeName` handle, if it names one.
 */
const declaredType = (kind: CaseKind): Option.Option<string> =>
  AnonymousType.rows.some((row) => row.kind === kind && row.version === version)
    ? Option.none()
    : Option.some(
        GoverningOf.rows.find(
          (row) => row.kind === kind && row.governor === kind && row.version === version,
        )?.governs ?? assert.fail(`GoverningOf holds ${kind} under its own governor`),
      );

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
 * Where every case's document stands: in a package that holds no document at any path, listed as
 * an item's, a type whose records a package does not read, its nodes numbered in document order.
 */
const ids = {
  assembled: false,
  documentType: "imsqti_item_xmlv3p0",
  package: "MANIFEST-share",
  path: "items/share.xml",
} as const satisfies IdentityIds;

/**
 * The starts of the nodes a row set holds, sorted: a keyed set read by its rows' fields.
 *
 * @param rows - A keyed set of node-keyed rows.
 * @returns The starts, sorted.
 */
const startsOf = (rows: ReadonlyMap<string, { readonly start: bigint }>): readonly bigint[] =>
  [...rows.values()].map(({ start }) => start).toSorted((a, b) => (a < b ? -1 : 1));

/**
 * The starts of document-order numbers, sorted.
 *
 * @param numbers - The nodes' numbers.
 * @returns Their starts, sorted.
 */
const nodesOf = (...numbers: readonly number[]): readonly bigint[] =>
  numbers.map(BigInt).toSorted((a, b) => (a < b ? -1 : 1));

/**
 * Read a case's rank row at a node, by the row's fields.
 *
 * @param rows - A document's share rows.
 * @param start - The node's start.
 * @returns Its row, if any.
 */
const rankAt = (rows: MathmlShareRows, start: bigint) =>
  [...rows.MathRank.values()].find((row) => row.start === start);

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

    const parent = rankAt(rows, row.parent);

    return parent === undefined
      ? [`the row of ${row.start} has no row for its parent`]
      : [
          ...(parent.rank === row.parentRank ? [] : [`${row.start} copies a wrong parentRank`]),
          ...(row.rank < row.parentRank ? [] : [`${row.start} is not below its parent`]),
        ];
  }),
  ...[...rows.ShareTarget.values()].flatMap((row) => {
    const share = rankAt(rows, row.start);
    const target = rankAt(rows, row.targetStart);

    return [
      ...(share?.rank === row.shareRank ? [] : [`${row.start} copies a wrong shareRank`]),
      ...(target?.rank === row.targetRank ? [] : [`${row.start} copies a wrong targetRank`]),
      ...(row.shareRank > row.targetRank ? [] : [`${row.start} is not above its target`]),
    ];
  }),
];

/**
 * Read one share row of a case, failing when the case holds none.
 *
 * @param rows - The rows.
 * @param start - The share's start.
 * @returns Its row.
 */
const shareRowOf = (rows: MathmlShareRows, start: number) =>
  [...rows.ShareTarget.values()].find((row) => row.start === BigInt(start)) ??
  assert.fail(`the case holds no ShareTarget row for ${start}`);

describe("import/overlays/mathml-share.ts, the rank and share rows (spec reading 2)", () => {
  it("gives apply(plus, ci id=a, share src=#a) a share rank above the ci's", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 share.
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf(
            "m:math",
            [],
            [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
          ),
        ),
      ),
      ids,
    );

    // plus has no row: no share stands on it.
    assert.deepStrictEqual(startsOf(rows.MathRank), nodesOf(1, 2, 4, 5));
    assert.deepStrictEqual(startsOf(rows.ShareTarget), nodesOf(5));
    assert.deepStrictEqual(shareRowOf(rows, 5), {
      id: "a",
      package: ids.package,
      path: ids.path,
      shareRank: 1n,
      start: 5n,
      targetRank: 0n,
      targetStart: 4n,
    });
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("gives every row the tuple its node's row carries", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 share.
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf(
            "m:math",
            [],
            [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
          ),
        ),
      ),
      ids,
    );
    const share = rankAt(rows, 5n) ?? assert.fail("the share has no row");

    assert.strictEqual(share.package, ids.package);
    assert.strictEqual(share.path, ids.path);
    assert.strictEqual(share.kind, "m:share");
    assert.strictEqual(share.nearest, 0n);
    assert.strictEqual(share.parent, 2n);
    assert.strictEqual(share.version, version);
  });

  it("gives two shares of one element two ShareTarget rows above its one rank", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 ci, 5 apply, 6 plus, 7 share, 8 share.
    const rows = rowsOf(
      ownViewOf(
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
      ),
      ids,
    );

    assert.deepStrictEqual(startsOf(rows.ShareTarget), nodesOf(7, 8));
    assert.strictEqual(shareRowOf(rows, 7).targetStart, 4n);
    assert.strictEqual(shareRowOf(rows, 8).targetStart, 4n);
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("gives apply id=a(plus, share src=#a, cn) a share rank not above its target's", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 share, 5 cn.
    const rows = rowsOf(
      ownViewOf(
        documentOf(elementOf("m:math", [], [plusOf("a", [shareOf("#a"), elementOf("m:cn")])])),
      ),
      ids,
    );
    const row = shareRowOf(rows, 4);

    assert.strictEqual(row.targetStart, 2n);
    assert.isTrue(row.shareRank <= row.targetRank);
    assert.isAbove(breachesOf(rows).length, 0);
  });

  it("refuses two applies each holding a share of the other, at the share that closes the cycle", () => {
    // Nodes: 0 document, 1 math, 2 apply a, 3 plus, 4 share, 5 apply b, 6 plus, 7 share.
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf("m:math", [], [plusOf("a", [shareOf("#b")]), plusOf("b", [shareOf("#a")])]),
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(startsOf(rows.ShareTarget), nodesOf(4, 7));
    assert.deepStrictEqual(breachesOf(rows), ["7 is not above its target"]);
  });

  it("refuses a share three levels below the element it names", () => {
    // Nodes: 0 document, 1 math, 2 apply a, 3 plus, 4 apply, 5 plus, 6 apply, 7 plus, 8 share.
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf(
            "m:math",
            [],
            [plusOf("a", [plusOf(undefined, [plusOf(undefined, [shareOf("#a")])])])],
          ),
        ),
      ),
      ids,
    );

    assert.deepStrictEqual(breachesOf(rows), ["8 is not above its target"]);
  });

  it("accepts a share of an element in a sibling subtree however deep", () => {
    // Nodes: 0 document, 1 math, 2 apply, 3 plus, 4 apply, 5 plus, 6 apply, 7 plus, 8 ci,
    // 9 apply, 10 plus, 11 apply, 12 plus, 13 share.
    const rows = rowsOf(
      ownViewOf(
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
      ),
      ids,
    );

    assert.deepStrictEqual(startsOf(rows.ShareTarget), nodesOf(13));
    assert.strictEqual(shareRowOf(rows, 13).targetStart, 8n);
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("writes a row for a target that is no MathML element, with the rows of its ancestors up to the m:math", () => {
    // The target is an HTML element inside an annotation, which a MathML share may name.
    // Nodes: 0 document, 1 math, 2 semantics, 3 apply, 4 plus, 5 share, 6 annotation-xml, 7 div.
    const rows = rowsOf(
      ownViewOf(
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
      ),
      ids,
    );

    assert.deepStrictEqual(startsOf(rows.MathRank), nodesOf(1, 2, 3, 5, 6, 7));
    assert.strictEqual(rankAt(rows, 7n)?.kind, "div");
    assert.strictEqual(shareRowOf(rows, 5).targetStart, 7n);
    assert.deepStrictEqual(breachesOf(rows), []);
  });

  it("refuses a share inside an HTML element it names, through the annotation that holds the math", () => {
    // Nodes: 0 document, 1 math, 2 semantics, 3 annotation-xml, 4 div, 5 math, 6 share.
    const rows = rowsOf(
      ownViewOf(
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
      ),
      ids,
    );

    // The share's chain stops at the inner m:math and the target's at the outer one, and the child
    // edges between them tie the two, so the cycle through the foreign element is followed.
    assert.deepStrictEqual(startsOf(rows.ShareTarget), nodesOf(6));
    assert.deepStrictEqual(startsOf(rows.MathRank), nodesOf(1, 2, 3, 4, 5, 6));
    assert.deepStrictEqual(breachesOf(rows), ["6 is not above its target"]);
  });

  it("writes no ShareTarget row for a share whose fragment names no id, or that names a file", () => {
    for (const src of ["#nowhere", "other.xml#a", "#", ""]) {
      const rows = rowsOf(
        ownViewOf(documentOf(elementOf("m:math", [], [plusOf("a", [shareOf(src)])]))),
        ids,
      );

      assert.strictEqual(rows.ShareTarget.size, 0, src);
      assert.strictEqual(rows.MathRank.size, 0, src);
    }
  });

  it("writes no rows for a document that holds no share", () => {
    const rows = rowsOf(
      ownViewOf(documentOf(elementOf("m:math", [], [plusOf("a", [elementOf("m:cn")])]))),
      ids,
    );

    assert.strictEqual(rows.MathRank.size, 0);
    assert.strictEqual(rows.ShareTarget.size, 0);
  });

  it("writes the target's rows to the document node when no m:math holds it", () => {
    // Nodes: 0 document, 1 item, 2 div, 3 math, 4 share. The law has no row for the document node
    // that it accepts, so the database refuses this document; the oracle accepts it (a follow-up).
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf(
            "qti-assessment-item",
            [],
            [elementOf("div", [attribute("id", "t")]), elementOf("m:math", [], [shareOf("#t")])],
          ),
        ),
      ),
      ids,
    );

    assert.strictEqual(shareRowOf(rows, 4).targetStart, 2n);
    assert.deepStrictEqual(startsOf(rows.MathRank), nodesOf(0, 1, 2, 3, 4));
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
      const rows = rowsOf(ownViewOf(doc), ids);

      assert.deepStrictEqual(startsOf(rows.MathRank), nodesOf(1, 2, 4, count + 4));
      assert.deepStrictEqual(breachesOf(rows), []);
    },
    testTimeoutMs,
  );
});

/**
 * A document of the placed cases: its path in the package, and its tree.
 */
interface Written {
  readonly path: string;
  readonly tree: XdmDocument<Composed>;
}

/**
 * Where a written document stands: in an assembly of {@link ids}'s package, listed as an item's as
 * {@link ids} is.
 *
 * @param path - The document's path.
 * @returns Its place.
 */
const assembledIds = (path: string): IdentityIds => ({ ...ids, assembled: true, path });

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
  instances: readonly InstanceRoot[],
  sites: readonly IncludeSite[] = [],
): PlacedShareRows => {
  const rows = documents.map(({ path, tree }) =>
    identityRowsOf(ownViewOf(tree), assembledIds(path)),
  );

  return placedShareRowsOf({
    ids: rows.flatMap(({ DocumentId }) => [...DocumentId.values()]),
    instances,
    nodesOf: (path) => {
      const written = documents.find((document) => document.path === path);

      return written === undefined ? [] : ownViewOf(written.tree).rows.nodes;
    },
    shares: rows.flatMap(({ ShareFragment }) => [...ShareFragment.values()]),
    sites,
  });
};

/**
 * The path of the first item of the placed cases.
 */
const itemPath = "items/a.xml";

/**
 * The path of the fragment the items include.
 */
const fragmentPath = "fragments/f.xml";

/**
 * An item of the placed cases whose math is the given markup, followed by a division the include
 * stands at: nodes 0 the document, 1 the item, and the math, then the division, last.
 *
 * @param math - The `m:math` the item holds.
 * @param path - The item's path.
 * @returns The item.
 */
const itemWith = (math: XdmClosedElement<Composed>, path = itemPath): Written => ({
  path,
  tree: documentOf(elementOf("qti-assessment-item", [], [math, elementOf("div")])),
});

/**
 * A fragment of the placed cases: a root `m:math` holding the given elements.
 *
 * @param children - The math's children.
 * @returns The fragment.
 */
const fragmentWith = (...children: readonly XdmChild<Composed>[]): Written => ({
  path: fragmentPath,
  tree: documentOf(elementOf("m:math", [], children)),
});

/**
 * What every instance of the placed cases states beside its document and site: no mixing, no
 * replacement, in no test part.
 */
const plainInstance = {
  mixes: false,
  part: 0n,
  replaced: false,
  siteLooseChain: false,
  siteMixes: false,
  sitePart: 0n,
  siteReplaced: false,
} as const;

/**
 * An assembly of an item and the fragment it includes, an instance of each: the item's instance 0
 * and the fragment's 1, in the instance tree's pre-order.
 *
 * @param item - The item's path, the assembly's.
 * @param include - The start of the include, the division that ends the item.
 * @returns The assembly's root.
 */
const assemblyOf = (item: string, include: number): InstanceRoot => ({
  ...plainInstance,
  assembly: item,
  assemblyKind: "qti-assessment-item",
  children: [
    {
      ...plainInstance,
      assemblyKind: "qti-assessment-item",
      children: [],
      document: fragmentPath,
      rootKind: "m:math",
      site: BigInt(include),
      siteDocument: item,
    },
  ],
  document: item,
  package: ids.package,
  rootKind: "qti-assessment-item",
  site: 0n,
  siteDocument: item,
});

/**
 * The include's site: the item's root (node 1) holds it, a parent whose include splices.
 *
 * @param item - The item's path.
 * @param include - The start of the include.
 * @returns The site.
 */
const siteOf = (item: string, include: number): IncludeSite => ({
  parent: 1n,
  parentKind: splicingParents[0] ?? assert.fail("some parent's include splices"),
  path: item,
  start: BigInt(include),
});

/**
 * Judge the placed rows by the placed law, from the rows alone.
 *
 * @param rows - A package's placed rows.
 * @returns The breaches, each a sentence; none when the database would accept the rows.
 */
const placedBreachesOf = (rows: PlacedShareRows): readonly string[] => {
  const ranks = [...rows.PlacedMathRank.values()];
  const placedRankAt = (assembly: string, instance: bigint, start: bigint) =>
    ranks.find(
      (row) => row.assembly === assembly && row.instance === instance && row.start === start,
    );

  return [
    ...ranks.flatMap((row) => {
      if (row.kind === "m:math" || row.start === row.parent) {
        return [];
      }

      const parent = placedRankAt(row.assembly, row.instance, row.parent);

      return parent === undefined
        ? [`the row of ${row.start} has no row for its parent`]
        : [
            ...(parent.rank === row.parentRank ? [] : [`${row.start} copies a wrong parentRank`]),
            ...(row.rank < row.parentRank ? [] : [`${row.start} is not below its parent`]),
          ];
    }),
    ...[...rows.PlacedShareTarget.values()].flatMap((row) => {
      const share = placedRankAt(row.assembly, row.instance, row.start);
      const target = placedRankAt(row.assembly, row.targetInstance, row.targetStart);

      return [
        ...(share?.rank === row.shareRank ? [] : [`${row.start} copies a wrong shareRank`]),
        ...(target?.rank === row.targetRank ? [] : [`${row.start} copies a wrong targetRank`]),
        ...(row.shareRank > row.targetRank ? [] : [`${row.start} is not above its target`]),
      ];
    }),
  ];
};

describe("import/overlays/mathml-share.ts, the shares of an assembled document (spec reading 117)", () => {
  // Nodes of the item: 0 document, 1 item, 2 math, 3 mi id=x, 4 division (the include).
  // Nodes of the fragment: 0 document, 1 math, 2 share. Instances: 0 the item, 1 the fragment.
  it("writes no MathRank or ShareTarget row for a document in an assembly", () => {
    const rows = rowsOf(
      ownViewOf(
        documentOf(
          elementOf(
            "m:math",
            [],
            [plusOf(undefined, [elementOf("m:ci", [attribute("id", "a")]), shareOf("#a")])],
          ),
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
      [assemblyOf(itemPath, 4)],
      [siteOf(itemPath, 4)],
    );
    const placed = [...rows.PlacedShareTarget.values()];

    assert.deepStrictEqual(placed.length, 1);
    assert.deepStrictEqual(placed[0], {
      assembly: itemPath,
      assemblyKind: "qti-assessment-item",
      id: "x",
      instance: 1n,
      package: ids.package,
      path: fragmentPath,
      shareRank: 1n,
      start: 2n,
      target: itemPath,
      targetCopy: 0n,
      targetInstance: 0n,
      targetRank: 0n,
      targetStart: 3n,
    });
    assert.deepStrictEqual(placedBreachesOf(rows), []);
  });

  it("places an item's share naming its fragment's element, below the item's math", () => {
    const rows = placedOf(
      [
        itemWith(elementOf("m:math", [], [shareOf("#y")])),
        fragmentWith(elementOf("m:mi", [attribute("id", "y")])),
      ],
      [assemblyOf(itemPath, 4)],
      [siteOf(itemPath, 4)],
    );
    const [placed] = [...rows.PlacedShareTarget.values()];

    assert.strictEqual(placed?.instance, 0n);
    assert.strictEqual(placed?.targetInstance, 1n);
    assert.strictEqual(placed?.targetCopy, 1n);
    assert.isTrue((placed?.shareRank ?? 0n) > (placed?.targetRank ?? 0n));
    assert.deepStrictEqual(placedBreachesOf(rows), []);
  });

  it("places a fragment included by two items, and ranks it, once per instance", () => {
    // The fragment's `m:share` names `x`, an `m:mrow` holding a `cn` in the first item and an `m:mi`
    // in the second, so the share ranks above the first's target and apart from the second's.
    const first = itemWith(
      elementOf("m:math", [], [elementOf("m:mrow", [attribute("id", "x")], [elementOf("m:cn")])]),
    );
    const secondPath = "items/b.xml";
    const second = itemWith(
      elementOf("m:math", [], [elementOf("m:mi", [attribute("id", "x")])]),
      secondPath,
    );
    const rows = placedOf(
      [first, second, fragmentWith(shareOf("#x"))],
      [assemblyOf(itemPath, 5), assemblyOf(secondPath, 4)],
      [siteOf(itemPath, 5), siteOf(secondPath, 4)],
    );

    // Nodes of the first item: 0 document, 1 item, 2 math, 3 mrow, 4 cn, 5 division; of the
    // second: 0 document, 1 item, 2 math, 3 mi, 4 division. Of the fragment: 0 document, 1 math,
    // 2 share. Each assembly's instances: 0 its item, 1 the fragment.
    assert.deepStrictEqual(
      [...rows.PlacedShareTarget.values()].map(
        ({ assembly, instance, target, targetInstance, targetStart }) => [
          assembly,
          instance,
          target,
          targetStart,
          targetInstance,
        ],
      ),
      [
        [itemPath, 1n, itemPath, 3n, 0n],
        [secondPath, 1n, secondPath, 3n, 0n],
      ],
    );
    assert.deepStrictEqual(
      [...rows.PlacedMathRank.values()]
        .filter(({ path, start }) => path === fragmentPath && start === 2n)
        .map(({ assembly, instance }) => [assembly, instance]),
      [
        [itemPath, 1n],
        [secondPath, 1n],
      ],
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
      [assemblyOf(itemPath, 5)],
      [siteOf(itemPath, 5)],
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
      [assemblyOf(itemPath, 4)],
      [siteOf(itemPath, 4)],
    );
    const none = placedOf(
      [itemWith(elementOf("m:math")), fragmentWith(elementOf("m:mi"))],
      [assemblyOf(itemPath, 4)],
      [siteOf(itemPath, 4)],
    );

    assert.strictEqual(unbound.PlacedShareTarget.size, 0);
    assert.strictEqual(unbound.PlacedMathRank.size, 0);
    assert.strictEqual(none.PlacedShareTarget.size, 0);
    assert.strictEqual(none.PlacedMathRank.size, 0);
  });
});
