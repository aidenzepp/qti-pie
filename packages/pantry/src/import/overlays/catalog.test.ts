/**
 * The catalog builder's free tests: over a document of a known structure `rowsOf` gives each card
 * that writes a `support` its `CardSupport`, and each entry whose `default` collapses to `true` or
 * `1` its `DefaultEntry`, as the document's own construction says (spec reading R9-a).
 *
 * The expected rows are written by hand from each document's construction, so no expected row is
 * computed by the builder's own reading. The database tests judge the rows through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { rowsOf } from "#pantry/import/overlays/catalog.ts";
import type { CatalogRows } from "#pantry/import/overlays/catalog.ts";
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
 * @returns The item's tree.
 */
const itemOf = (catalogs: string) =>
  Effect.gen(function* shredsItem() {
    const xml = yield* readXml(
      new TextEncoder().encode(
        `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body/><qti-catalog-info>${catalogs}</qti-catalog-info></qti-assessment-item>`,
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
        ({ card, lexical, node, value }) =>
          `${nameOf(node)} > ${nameOf(card)}: ${JSON.stringify(lexical)} = ${value}`,
      )
      .toSorted(),
    supports: [...rows.CardSupport.values()]
      .map(
        ({ catalog, lexical, node, support }) =>
          `${nameOf(node)} > ${nameOf(catalog)}: ${JSON.stringify(lexical)} = ${support}`,
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
          support: "spoken",
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
          value: "true",
          version: "3.0.1",
        });
        assert.strictEqual(placed.CardSupport.get(card?.id ?? "")?.nearest, idOf(9999));
      }),
  );
});
