import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { manifestRows } from "#qti/import/manifest.ts";
import { kindOf, Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import {
  LomAnnotation,
  LomClassification,
  LomEducational,
  LomEntryLangString,
  LomId,
  LomRelation,
  LomSourceLangString,
  LomTaxonPath,
  LomValue,
  QtiMetadata,
  QtiMetadataInMetadata,
} from "#qti/schema/metadata.ts";
import { Edge, NodeKind } from "#qti/schema/node.ts";
import {
  ManifestId,
  ManifestIdOfManifest,
  ManifestIdOfResource,
  Resource,
} from "#qti/schema/package.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * Every element of the subtree rooted at `element`, in document order, with its parent.
 */
const elementsOf = (
  element: Element,
  parent: Element | null,
): readonly { readonly element: Element; readonly parent: Element | null }[] => [
  { element, parent },
  ...element.children.flatMap((child) =>
    child.kind === "element" ? elementsOf(child, element) : [],
  ),
];

/**
 * The manifest of the package at `dir`, read.
 */
const manifestOf = (dir: string): Effect.Effect<XmlDocument, unknown> =>
  Effect.gen(function* manifestDocument() {
    return yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  }).pipe(Effect.provide(NodeServices.layer));

/**
 * The manifest rows of the package at `dir`.
 */
const rowsOf = (dir: string) =>
  Effect.gen(function* rowsOfPackage() {
    const entries = yield* listPackage(dir);
    const doc = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));

    return (yield* manifestRows(dir, entries, doc, Rows.empty())).rows;
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/manifest.ts holders", (suite) => {
  suite.effect(
    "writes the manifest's and the resource's ManifestId rows beside their holders",
    () =>
      Effect.gen(function* manifestIdRows() {
        const rows = yield* rowsOf(yield* materialize("simple"));
        const manifest = Rows.of(rows, ManifestIdOfManifest);
        const resource = Rows.of(rows, ManifestIdOfResource);
        assert.deepStrictEqual(
          manifest.map((row) => row.id),
          ["MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"],
        );
        assert.deepStrictEqual(
          resource.map((row) => row.id),
          ["choice"],
        );
        assert.deepStrictEqual(
          Rows.of(rows, ManifestId)
            .map((row) => row.holder)
            .toSorted(),
          ["manifest", "resource"],
        );
      }),
  );

  suite.effect("gives every ManifestId row the package of its holder", () =>
    Effect.gen(function* samePackage() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const packages = new Set(Rows.of(rows, ManifestId).map((row) => row.package));
      assert.strictEqual(packages.size, 1);
    }),
  );

  suite.effect("writes SIMPLE's one QtiMetadata row with its host arm on the resource node", () =>
    Effect.gen(function* hostRow() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const [record, ...more] = Rows.of(rows, QtiMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(record?.host, "metadata");
      assert.strictEqual(record?.resource, "choice");

      const [arm, ...rest] = Rows.of(rows, QtiMetadataInMetadata);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(arm?.id, record?.id);
      assert.strictEqual(arm?.package, record?.package);
      assert.strictEqual(arm?.resource, "choice");

      const [holder] = Rows.of(rows, Resource);
      assert.strictEqual(arm?.resourceNode, holder?.id);
    }),
  );

  suite.effect("composes every cpx and drd handle into NodeKind", () =>
    Effect.sync(() => {
      const handles: readonly string[] = NodeKind.handles;
      for (const kind of [...cpx.kinds, ...drd.kinds]) {
        assert.isTrue(handles.includes(kind), kind);
      }
    }),
  );

  suite.effect("gives every LomValue row the parentKind of its Edge row", () =>
    Effect.gen(function* valueParents() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const edges = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.parentKind]));
      const values = Rows.of(rows, LomValue);
      assert.isAbove(values.length, 0);
      for (const value of values) {
        assert.strictEqual(value.parentKind, edges.get(value.id), value.id);
      }
    }),
  );

  suite.effect("writes the LOM remainder's rows for the lomrest package", () =>
    Effect.gen(function* remainderRows() {
      const rows = yield* rowsOf(yield* materialize("lomrest"));
      assert.strictEqual(Rows.of(rows, LomEducational).length, 2);
      assert.strictEqual(Rows.of(rows, LomClassification).length, 1);
      assert.strictEqual(Rows.of(rows, LomRelation).length, 1);
      assert.strictEqual(Rows.of(rows, LomAnnotation).length, 1);
      assert.strictEqual(Rows.of(rows, LomTaxonPath).length, 2);
      assert.strictEqual(Rows.of(rows, LomSourceLangString).length, 2);
      assert.strictEqual(Rows.of(rows, LomEntryLangString).length, 2);

      const types = Rows.of(rows, LomValue).filter(
        (value) => value.parentKind === "lom:learningResourceType",
      );
      assert.deepStrictEqual(
        types.map((value) => value.collapsed),
        ["exercise"],
      );
    }),
  );

  suite.effect("writes one LomId row per lom:id with the leaf's text", () =>
    Effect.gen(function* idRows() {
      const dir = yield* materialize("lomrest");
      const rows = yield* rowsOf(dir);
      const doc = yield* manifestOf(dir);
      const expected = elementsOf(doc.root, null)
        .filter(({ element }) => element.local === "id" && element.namespace.includes("LOM"))
        .map(({ element }) =>
          element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        );
      assert.isAbove(expected.length, 0);
      assert.deepStrictEqual(
        Rows.of(rows, LomId).map((row) => row.value),
        expected,
      );
    }),
  );

  suite.effect("reads lomrest's manifest without an UnmodeledVocabulary refusal", () =>
    Effect.gen(function* resolved() {
      const rows = yield* rowsOf(yield* materialize("lomrest"));
      assert.isAbove(Rows.of(rows, Edge).length, 0);
    }),
  );

  suite.effect("resolves a duration under typicalLearningTime to lom:duration.string", () =>
    Effect.gen(function* durationKinds() {
      const doc = yield* manifestOf(yield* materialize("lomrest"));
      const found = elementsOf(doc.root, null).filter(
        ({ element, parent }) =>
          element.local === "duration" && parent?.local === "typicalLearningTime",
      );
      assert.isAbove(found.length, 0);
      for (const { element } of found) {
        assert.deepStrictEqual(
          kindOf(element, Option.some("lom:typicalLearningTime")),
          Option.some("lom:duration.string"),
        );
      }
    }),
  );
});
