import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { manifestRows } from "#qti/import/manifest.ts";
import { kindOf, Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import {
  CsmCaseItemUri,
  CsmGuid,
  CsmLabel,
  CsmSet,
  CsmSetResourceLabel,
  CsmSetResourcePartId,
} from "#qti/schema/csm.ts";
import {
  FileLom,
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
  QtiMetadataInResourceLom,
  ResourceLom,
  ResourceLomIdentified,
  ResourceLomTitled,
} from "#qti/schema/metadata.ts";
import { Edge, Node, NodeKind } from "#qti/schema/node.ts";
import {
  FileMetadata,
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

  suite.effect("writes csm's two sets under the manifest and resource metadata nodes", () =>
    Effect.gen(function* csmRows() {
      const dir = yield* materialize("csm");
      const rows = yield* rowsOf(dir);
      const kinds = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));
      assert.deepStrictEqual(
        Rows.of(rows, CsmSet)
          .map((set) => kinds.get(set.host) ?? "")
          .toSorted((left, right) => left.localeCompare(right)),
        ["cp:metadata.manifest", "cp:metadata.resource"],
      );

      const doc = yield* manifestOf(dir);
      const guids = elementsOf(doc.root, null)
        .filter(({ element }) => element.local === "GUID")
        .map(({ element }) =>
          element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        );
      assert.isAbove(guids.length, 0);
      assert.deepStrictEqual(
        Rows.of(rows, CsmGuid).map((row) => row.value),
        guids,
      );
      assert.strictEqual(Rows.of(rows, CsmLabel).length, guids.length);
      assert.strictEqual(Rows.of(rows, CsmCaseItemUri).length, guids.length);
      assert.strictEqual(Rows.of(rows, CsmSetResourceLabel).length, 1);
      assert.strictEqual(Rows.of(rows, CsmSetResourcePartId).length, 1);
      assert.strictEqual(Rows.of(rows, CsmSetResourcePartId)[0]?.value, "choice");
    }),
  );

  suite.effect("writes filelom's file metadata, two file records and two sets", () =>
    Effect.gen(function* fileRows() {
      const rows = yield* rowsOf(yield* materialize("filelom"));
      const kinds = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));
      const [metadata, ...more] = Rows.of(rows, FileMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(kinds.get(metadata?.file ?? ""), "cp:file");

      const records = Rows.of(rows, FileLom);
      assert.strictEqual(records.length, 2);
      for (const record of records) {
        assert.strictEqual(record.metadata, metadata?.id);
        assert.strictEqual(record.file, metadata?.file);
      }

      const sets = Rows.of(rows, CsmSet).filter((set) => set.host === metadata?.id);
      assert.strictEqual(sets.length, 2);
      assert.strictEqual(kinds.get(metadata?.id ?? ""), "cp:metadata.file");

      const fileLoms = new Set(records.map((record) => record.lom));
      for (const record of Rows.of(rows, ResourceLom)) {
        assert.isFalse(fileLoms.has(record.lom));
      }

      for (const row of [
        ...Rows.of(rows, ResourceLomIdentified),
        ...Rows.of(rows, ResourceLomTitled),
      ]) {
        assert.isFalse(fileLoms.has(row.lom));
      }
    }),
  );

  suite.effect("writes nestedqmd's one resource-lom QtiMetadata with its host arm", () =>
    Effect.gen(function* nestedRows() {
      const rows = yield* rowsOf(yield* materialize("nestedqmd"));
      const [record, ...more] = Rows.of(rows, QtiMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(record?.host, "resourceLom");

      const [arm, ...rest] = Rows.of(rows, QtiMetadataInResourceLom);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(arm?.id, record?.id);
      assert.strictEqual(arm?.resource, record?.resource);
      assert.deepStrictEqual(
        Rows.of(rows, ResourceLom).map((lom) => lom.lom),
        [arm?.lom],
      );
      assert.strictEqual(Rows.of(rows, QtiMetadataInMetadata).length, 0);
    }),
  );

  suite.effect("writes no QtiMetadata row for a qtiMetadata with no arm to land in", () =>
    Effect.gen(function* noArmRows() {
      for (const name of ["nestedqmd-manifest-lom", "filelom-qmd"] as const) {
        const rows = yield* rowsOf(yield* materialize(name));
        const parents = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.parentKind]));
        const stranded = Rows.of(rows, Node).filter(
          (node) =>
            node.kind === "qmd:qtiMetadata" &&
            (parents.get(node.id) === "cp:metadata.file" || parents.get(node.id) === "lom:lom"),
        );
        assert.isAbove(stranded.length, 0, name);

        const records = new Set([
          ...Rows.of(rows, QtiMetadata).map((row) => row.id),
          ...Rows.of(rows, QtiMetadataInMetadata).map((row) => row.id),
          ...Rows.of(rows, QtiMetadataInResourceLom).map((row) => row.id),
        ]);
        for (const node of stranded) {
          assert.isFalse(records.has(node.id), name);
        }
      }
    }),
  );
});
