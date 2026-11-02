import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { manifestRows } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import { LomValue } from "#qti/schema/metadata.ts";
import { Edge, NodeKind } from "#qti/schema/node.ts";
import { ManifestId, ManifestIdOfManifest, ManifestIdOfResource } from "#qti/schema/package.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";

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
});
