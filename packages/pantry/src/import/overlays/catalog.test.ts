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
import { Effect, Result } from "effect";
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
import type { NodeId, XdmDocument } from "#pantry/model/xdm.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

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
 * @returns Each node's name, by its id.
 */
const namesOf = (tree: XdmDocument<Composed>): ReadonlyMap<NodeId, string> => {
  const rows = flatten(tree, idOf);
  const seen = new Map<string, number>();

  return new Map([
    [rows.document.node, "#doc"],
    ...rows.nodes.map(({ id, kind }): readonly [NodeId, string] => {
      const at = seen.get(kind) ?? 0;
      seen.set(kind, at + 1);

      return [id, `${kind}#${String(at)}`];
    }),
  ]);
};

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
  const nameOf = (node: NodeId): string => names.get(node) ?? node;

  return {
    defaults: [...rows.DefaultEntry.values()]
      .map(
        ({ card, lexical, node }) =>
          `${nameOf(node)} > ${nameOf(card)}: ${JSON.stringify(lexical)} = ${collapse(lexical)}`,
      )
      .toSorted(),
    supports: [...rows.CardSupport.values()]
      .map(
        ({ catalog, lexical, node }) =>
          `${nameOf(node)} > ${nameOf(catalog)}: ${JSON.stringify(lexical)} = ${collapse(lexical)}`,
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
        const rows = rowsOf(tree, { idOf });

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
      const rows = rowsOf(yield* itemOf(""), { idOf });

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
        const flat = flatten(tree, idOf);
        const card = flat.nodes.find(({ kind }) => kind === "qti-card");
        const entry = flat.nodes.find(({ kind }) => kind === "qti-card-entry");
        const context: DocumentContext = {
          ancestry: new Set(),
          nearest: idOf(9999),
          nearestKind: "document",
        };
        const own = rowsOf(tree, { idOf });
        const placed = rowsOf(tree, { context, idOf });

        assert.deepStrictEqual(own.CardSupport.get(card?.id ?? ""), {
          catalog: card?.parent,
          document: flat.document.node,
          kind: "qti-card",
          lexical: "spoken",
          nearest: flat.document.node,
          node: card?.id,
          start: card?.start,
          version: "3.0.1",
        });
        assert.deepStrictEqual(own.DefaultEntry.get(entry?.id ?? ""), {
          card: entry?.parent,
          document: flat.document.node,
          kind: "qti-card-entry",
          lexical: "true",
          nearest: flat.document.node,
          node: entry?.id,
          start: entry?.start,
          version: "3.0.1",
        });
        assert.strictEqual(placed.CardSupport.get(card?.id ?? "")?.nearest, idOf(9999));
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
        const rows = rowsOf(tree, { idOf });
        const names = namesOf(tree);
        const nameOf = (node: NodeId): string => names.get(node) ?? node;

        assert.deepStrictEqual(
          [...rows.CatalogRef.values()]
            .map(
              ({ lexical, node, token }) =>
                `${nameOf(node)}: ${JSON.stringify(lexical)} = ${token}`,
            )
            .toSorted(),
          ['p#0: "A" = A', 'p#1: " B " = B'],
        );
        assert.deepStrictEqual(
          [...rows.CatalogId.values()]
            .map(({ id, node, owner }) => `${nameOf(node)} = ${id} (${nameOf(owner)})`)
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
          yield* itemOf(
            `<qti-catalog><qti-card support="spoken"/></qti-catalog>`,
            `<p id="p1">c</p>`,
          ),
          { idOf },
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
          yield* itemOf(
            `<qti-catalog id="A"/>`,
            `<p data-catalog-idref="">a</p><p data-catalog-idref=" \t ">b</p><p data-catalog-idref="A">c</p>`,
          ),
          { idOf },
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
      const flat = flatten(tree, idOf);
      const paragraph = flat.nodes.find(({ kind }) => kind === "p");
      const catalog = flat.nodes.find(({ kind }) => kind === "qti-catalog");
      const rows = rowsOf(tree, { idOf });

      assert.deepStrictEqual(rows.CatalogRef.get(paragraph?.id ?? ""), {
        document: flat.document.node,
        lexical: "A",
        node: paragraph?.id,
        token: "A",
      });
      assert.deepStrictEqual(rows.CatalogId.get(catalog?.id ?? ""), {
        document: flat.document.node,
        id: "A",
        node: catalog?.id,
        owner: catalog?.id,
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
        const document = flatten(tree, idOf).document.node;
        const targets = (assembled?: boolean) =>
          [
            ...rowsOf(
              tree,
              assembled === undefined ? { idOf } : { assembled, idOf },
            ).CatalogTarget.values(),
          ].toSorted((a, b) => a.id.localeCompare(b.id));

        assert.deepStrictEqual(targets(), [
          { assembled: false, document, id: "A" },
          { assembled: false, document, id: "B" },
        ]);
        assert.deepStrictEqual(targets(true), [
          { assembled: true, document, id: "A" },
          { assembled: true, document, id: "B" },
        ]);
      }),
  );

  it.effect("gives a document with no reference no CatalogTarget", () =>
    Effect.gen(function* noTargets() {
      const rows = rowsOf(yield* itemOf(`<qti-catalog id="A"/>`, `<p id="p1">c</p>`), { idOf });

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
const memberOf = (
  id: NodeId,
  document: NodeId,
  children: readonly InstanceMember[] = [],
): InstanceMember => ({
  assemblyKind: "qti-assessment-item",
  children,
  document,
  id,
  mixes: false,
  part: document,
  replaced: false,
  rootKind: "qti-assessment-item",
  site: document,
  siteLooseChain: false,
  siteMixes: false,
  sitePart: document,
  siteReplaced: false,
  siteStart: 0n,
});

describe("import/overlays/catalog.ts, placedCatalogRowsOf", () => {
  const assembly = idOf(100);
  const item = idOf(101);
  const fragment = idOf(102);
  const catalogNode = idOf(103);
  const otherNode = idOf(104);
  const root: InstanceRoot = {
    ...memberOf(idOf(110), item, [memberOf(idOf(111), item)]),
    assembly,
  };
  const targets = [{ assembled: true, document: item, id: "C" }];
  const catalogs = [{ document: item, id: "C", node: catalogNode, owner: catalogNode }];

  it("places each token of an instance's document once under each instance", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [],
      catalogs,
      instances: [root],
      targets: [...targets, { assembled: true, document: fragment, id: "Z" }],
    });

    assert.deepStrictEqual(
      [...rows.PlacedCatalogRef.values()].map(({ assembly: a, document, id, instance }) => [
        a,
        document,
        id,
        instance,
      ]),
      [
        [assembly, item, "C", idOf(110)],
        [assembly, item, "C", idOf(111)],
      ],
    );
  });

  it("writes one AssembledCatalog for an assembly's id a catalog owns, and none for another owner", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [
        { assembly, copy: idOf(110), id: "C", owner: catalogNode },
        { assembly, copy: idOf(111), id: "C", owner: catalogNode },
        { assembly, copy: idOf(110), id: "other", owner: otherNode },
      ],
      catalogs,
      instances: [root],
      targets,
    });

    assert.deepStrictEqual(
      [...rows.AssembledCatalog.values()],
      [{ assembly, id: "C", owner: catalogNode }],
    );
  });

  it("writes nothing for a document in no assembly", () => {
    const rows = placedCatalogRowsOf({
      assembledIds: [],
      catalogs,
      instances: [],
      targets: [{ assembled: false, document: item, id: "C" }],
    });

    assert.strictEqual(rows.PlacedCatalogRef.size, 0);
    assert.strictEqual(rows.AssembledCatalog.size, 0);
  });
});
