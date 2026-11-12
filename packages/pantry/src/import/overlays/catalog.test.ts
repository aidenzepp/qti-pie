/**
 * The catalog builder's free tests: over a document of a known structure `rowsOf` gives each card
 * that writes a `support` its `CardSupport`, each entry whose `default` collapses to `true` or `1`
 * its `DefaultEntry`, each `data-catalog-idref` that holds a token its `CatalogRef` and each
 * catalog that writes an `id` its `CatalogId`, as the document's own construction says (spec
 * reading R9-a).
 *
 * The expected rows are written by hand from each document's construction, so no expected row is
 * computed by the builder's own reading. The database tests judge the rows through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { collapse } from "#pantry/grammar/domains.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { placedCatalogRowsOf, rowsOf } from "#pantry/import/overlays/catalog.ts";
import type { CatalogRows } from "#pantry/import/overlays/catalog.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
import { ownViewOf, viewOf } from "#pantry/import/fold.ts";

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Find the first node of a kind in a document's rows.
 *
 * @param nodes - The document's nodes.
 * @param kind - The kind.
 * @returns The node.
 * @throws {Error} When the document holds none: a defect of the test's markup.
 */
const nodeOf = <N extends { readonly kind: string }>(nodes: readonly N[], kind: string): N => {
  const node = nodes.find((candidate) => candidate.kind === kind);
  if (node === undefined) {
    throw new Error(`The test's document holds no ${kind}; write one in its markup.`);
  }

  return node;
};

/**
 * The grammar shred reads each document by.
 */
const shredGrammar = shredGrammarOf(Result.getOrThrow(composed()));

/**
 * Shred an item whose catalog info is the given markup, under 3.0.1.
 *
 * @param catalogs - The `qti-catalog` children of the item's catalog info.
 * @param body - The item body's markup, empty where none is given.
 * @returns The item's tree.
 */
const itemOf = (catalogs: string, body = "") =>
  Effect.gen(function* shredsItem() {
    const xml = yield* readXml(
      new TextEncoder().encode(
        `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body>${body}</qti-item-body><qti-catalog-info>${catalogs}</qti-catalog-info></qti-assessment-item>`,
      ),
    );

    return yield* shred(xml, "3.0.1", shredGrammar);
  });

/**
 * Name each element of a catalog by the order it is met in among its kind: `qti-catalog#0`,
 * `qti-card#1` and so on, the document node `#doc`.
 *
 * @param tree - The tree.
 * @returns Each node's name, by its start.
 */
const namesOf = (tree: XdmDocument<Composed>): ReadonlyMap<bigint, string> => {
  const rows = flatten(tree);
  const seen = new Map<string, number>();

  return new Map(
    rows.nodes.map(({ kind, start }): readonly [bigint, string] => {
      if (start === 0n) {
        return [start, "#doc"];
      }

      const at = seen.get(kind) ?? 0;
      seen.set(kind, at + 1);

      return [start, `${kind}#${String(at)}`];
    }),
  );
};

/**
 * The item's place in its package, as the builder reads it.
 */
const place = { package: "P", path: "item.xml" } as const;

/**
 * Where the item stands, in no assembly or in one.
 *
 * @param assembled - Whether it is in an assembly.
 * @returns Its ids.
 */
const idsOf = (assembled: boolean) => ({ ...place, assembled });

/**
 * Read a document's catalog rows back by the names of their nodes: each card as `name > catalog:
 * lexical = support` and each designated entry as `name > card: lexical = value`.
 *
 * @param tree - The tree.
 * @param rows - Its rows.
 * @returns The two keyed sets, by names, each sorted.
 */
const named = (tree: XdmDocument<Composed>, rows: CatalogRows) => {
  const names = namesOf(tree);
  const nameOf = (start: bigint): string => names.get(start) ?? String(start);

  return {
    defaults: [...rows.DefaultEntry.values()]
      .map(
        ({ card, lexical, start }) =>
          `${nameOf(start)} > ${nameOf(card)}: ${JSON.stringify(lexical)} = ${collapse(lexical)}`,
      )
      .toSorted(),
    supports: [...rows.CardSupport.values()]
      .map(
        ({ catalog, lexical, start }) =>
          `${nameOf(start)} > ${nameOf(catalog)}: ${JSON.stringify(lexical)} = ${collapse(lexical)}`,
      )
      .toSorted(),
  };
};

describe("import/overlays/catalog.ts, rowsOf", () => {
  it.effect(
    "gives each card its support as written and collapsed, and each entry designated by true or 1 its default, and no other entry a row",
    () =>
      Effect.gen(function* catalogRows() {
        const tree = yield* itemOf(
          `<qti-catalog id="A"><qti-card support="spoken"><qti-card-entry default="true"><qti-html-content/></qti-card-entry><qti-card-entry default=" 1 "/><qti-card-entry default="false"/><qti-card-entry default="0"/><qti-card-entry/></qti-card></qti-catalog><qti-catalog id="B"><qti-card support=" braille "><qti-html-content/></qti-card></qti-catalog>`,
        );
        const rows = rowsOf(ownViewOf(tree), idsOf(false));

        assert.deepStrictEqual(named(tree, rows), {
          defaults: [
            'qti-card-entry#0 > qti-card#0: "true" = true',
            'qti-card-entry#1 > qti-card#0: " 1 " = 1',
          ],
          supports: [
            'qti-card#0 > qti-catalog#0: "spoken" = spoken',
            'qti-card#1 > qti-catalog#1: " braille " = braille',
          ],
        });
      }),
  );

  it.effect("gives a document with no catalog no row", () =>
    Effect.gen(function* noCatalog() {
      const rows = rowsOf(ownViewOf(yield* itemOf("")), idsOf(false));

      assert.strictEqual(rows.CardSupport.size, 0);
      assert.strictEqual(rows.DefaultEntry.size, 0);
    }),
  );

  it.effect(
    "writes each row under its node's tuple: its document, kind, version and start, and the nearest interaction its context gives",
    () =>
      Effect.gen(function* tuple() {
        const tree = yield* itemOf(
          `<qti-catalog id="A"><qti-card support="spoken"><qti-card-entry default="true"/></qti-card></qti-catalog>`,
        );
        const flat = flatten(tree);
        const card = nodeOf(flat.nodes, "qti-card");
        const entry = nodeOf(flat.nodes, "qti-card-entry");
        const context: DocumentContext = {
          ancestry: new Set(),
          nearest: 9999n,
          nearestKind: "document",
          nearestPath: Option.some("other.xml"),
        };
        const own = rowsOf(ownViewOf(tree), idsOf(false));
        const placed = rowsOf(viewOf(tree, flat, context), idsOf(false));

        assert.deepStrictEqual(own.CardSupport.get(String(card.start)), {
          ...place,
          catalog: card.parent,
          kind: "qti-card",
          lexical: "spoken",
          nearest: 0n,
          start: card.start,
          version: "3.0.1",
        });
        assert.deepStrictEqual(own.DefaultEntry.get(String(entry.start)), {
          ...place,
          card: entry.parent,
          kind: "qti-card-entry",
          lexical: "true",
          nearest: 0n,
          start: entry.start,
          version: "3.0.1",
        });
        assert.strictEqual(placed.CardSupport.get(String(card.start))?.nearest, 9999n);
      }),
  );
});

describe("import/overlays/catalog.ts, rowsOf, references", () => {
  it.effect(
    "gives each data-catalog-idref its token as written and collapsed, and each catalog its id as written and trimmed",
    () =>
      Effect.gen(function* referenceRows() {
        const tree = yield* itemOf(
          `<qti-catalog id="A"><qti-card support="spoken"/></qti-catalog><qti-catalog id=" B "><qti-card support="spoken"/></qti-catalog>`,
          `<p data-catalog-idref="A">a</p><p data-catalog-idref=" B ">b</p><p id="p1">c</p>`,
        );
        const rows = rowsOf(ownViewOf(tree), idsOf(false));
        const names = namesOf(tree);
        const nameOf = (start: bigint): string => names.get(start) ?? String(start);

        assert.deepStrictEqual(
          [...rows.CatalogRef.values()]
            .map(
              ({ lexical, start, token }) =>
                `${nameOf(start)}: ${JSON.stringify(lexical)} = ${token}`,
            )
            .toSorted(),
          ['p#0: "A" = A', 'p#1: " B " = B'],
        );
        assert.deepStrictEqual(
          [...rows.CatalogId.values()]
            .map(({ id, owner, start }) => `${nameOf(start)} = ${id} (${nameOf(owner)})`)
            .toSorted(),
          ["qti-catalog#0 = A (qti-catalog#0)", "qti-catalog#1 = B (qti-catalog#1)"],
        );
      }),
  );

  it.effect(
    "gives a catalog with no id no CatalogId, and a document with no reference no ref",
    () =>
      Effect.gen(function* noReferences() {
        const rows = rowsOf(
          ownViewOf(
            yield* itemOf(
              `<qti-catalog><qti-card support="spoken"/></qti-catalog>`,
              `<p id="p1">c</p>`,
            ),
          ),
          idsOf(false),
        );

        assert.strictEqual(rows.CatalogRef.size, 0);
        assert.strictEqual(rows.CatalogId.size, 0);
      }),
  );

  it.effect(
    "gives an empty or blank data-catalog-idref no CatalogRef, as it holds no IDREF token",
    () =>
      Effect.gen(function* noToken() {
        const rows = rowsOf(
          ownViewOf(
            yield* itemOf(
              `<qti-catalog id="A"/>`,
              `<p data-catalog-idref="">a</p><p data-catalog-idref=" \t ">b</p><p data-catalog-idref="A">c</p>`,
            ),
          ),
          idsOf(false),
        );

        assert.deepStrictEqual(
          [...rows.CatalogRef.values()].map(({ token }) => token),
          ["A"],
        );
      }),
  );

  it.effect("writes each reference under its document", () =>
    Effect.gen(function* tuple() {
      const tree = yield* itemOf(`<qti-catalog id="A"/>`, `<p data-catalog-idref="A">a</p>`);
      const flat = flatten(tree);
      const paragraph = nodeOf(flat.nodes, "p");
      const catalog = nodeOf(flat.nodes, "qti-catalog");
      const rows = rowsOf(ownViewOf(tree), idsOf(false));

      assert.deepStrictEqual(rows.CatalogRef.get(String(paragraph.start)), {
        ...place,
        lexical: "A",
        start: paragraph.start,
        token: "A",
      });
      assert.deepStrictEqual(rows.CatalogId.get(String(catalog.start)), {
        ...place,
        id: "A",
        owner: catalog.start,
        start: catalog.start,
      });
    }),
  );
});

describe("import/overlays/catalog.ts, rowsOf, targets", () => {
  it.effect(
    "gives each distinct token of a document's references one CatalogTarget, its assembled copied",
    () =>
      Effect.gen(function* targetRows() {
        const tree = yield* itemOf(
          `<qti-catalog id="A"/><qti-catalog id="B"/>`,
          `<p data-catalog-idref="A">a</p><p data-catalog-idref=" A ">b</p><p data-catalog-idref="B">c</p><p data-catalog-idref=" ">d</p>`,
        );
        const targets = (assembled: boolean) =>
          [...rowsOf(ownViewOf(tree), idsOf(assembled)).CatalogTarget.values()].toSorted((a, b) =>
            a.id.localeCompare(b.id),
          );

        assert.deepStrictEqual(targets(false), [
          { ...place, assembled: false, id: "A" },
          { ...place, assembled: false, id: "B" },
        ]);
        assert.deepStrictEqual(targets(true), [
          { ...place, assembled: true, id: "A" },
          { ...place, assembled: true, id: "B" },
        ]);
      }),
  );

  it.effect("gives a document with no reference no CatalogTarget", () =>
    Effect.gen(function* noTargets() {
      const rows = rowsOf(
        ownViewOf(yield* itemOf(`<qti-catalog id="A"/>`, `<p id="p1">c</p>`)),
        idsOf(false),
      );

      assert.strictEqual(rows.CatalogTarget.size, 0);
    }),
  );
});

/**
 * An instance of an assembly, as `assembledRowsOf` writes it, over the fields the placements read.
 *
 * @param id - The instance's id.
 * @param document - Its document.
 * @param children - Its children.
 * @returns The member.
 */
const memberOf = (document: string, children: readonly InstanceMember[] = []): InstanceMember => ({
  assemblyKind: "qti-assessment-item",
  children,
  document,
  mixes: false,
  part: 0n,
  replaced: false,
  rootKind: "qti-assessment-item",
  site: 0n,
  siteDocument: document,
  siteLooseChain: false,
  siteMixes: false,
  sitePart: 0n,
  siteReplaced: false,
});

describe("import/overlays/catalog.ts, placedCatalogRowsOf", () => {
  const pkg = "P";
  const assembly = "item.xml";
  const item = "item.xml";
  const fragment = "fragment.xml";
  const catalogStart = 3n;
  const otherStart = 4n;
  const root: InstanceRoot = { ...memberOf(item, [memberOf(item)]), assembly, package: pkg };
  const targets = [{ assembled: true, id: "C", package: pkg, path: item }];
  const catalogs = [
    { id: "C", owner: catalogStart, package: pkg, path: item, start: catalogStart },
  ];

  it("places each token of an instance's document once under each instance", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [],
      catalogs,
      instances: [root],
      targets: [...targets, { assembled: true, id: "Z", package: pkg, path: fragment }],
    });

    assert.deepStrictEqual(
      [...rows.PlacedCatalogRef.values()].map(({ assembly: a, id, instance, path }) => [
        a,
        path,
        id,
        instance,
      ]),
      [
        [assembly, item, "C", 0n],
        [assembly, item, "C", 1n],
      ],
    );
  });

  it("writes one AssembledCatalog for an assembly's id a catalog owns, and none for another owner", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [
        { assembly, copy: 0n, id: "C", owner: catalogStart, package: pkg, path: item },
        { assembly, copy: 1n, id: "C", owner: catalogStart, package: pkg, path: item },
        { assembly, copy: 0n, id: "other", owner: otherStart, package: pkg, path: item },
      ],
      catalogs,
      instances: [root],
      targets,
    });

    assert.deepStrictEqual(
      [...rows.AssembledCatalog.values()],
      [{ assembly, id: "C", owner: catalogStart, package: pkg, path: item }],
    );
  });

  it("writes nothing for a document in no assembly", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [],
      catalogs,
      instances: [],
      targets: [{ assembled: false, id: "C", package: pkg, path: item }],
    });

    assert.strictEqual(rows.PlacedCatalogRef.size, 0);
    assert.strictEqual(rows.AssembledCatalog.size, 0);
  });
});
