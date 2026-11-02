import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import type { ItemInput } from "#qti/import/item.ts";
import { ownAttributes, renderTree } from "#qti/export/render.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import * as family from "#qti/schema/attributes.ts";
import { ResourceLomGeneral } from "#qti/schema/lang.ts";
import { registries } from "#qti/schema/seed/admission.ts";
import { listPackage } from "#qti/package/read.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The text of a canonical form, so a failed comparison prints the two documents and not two byte
 * arrays.
 */
const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Import the `sharedMedia` package into in-memory rows, no database: the manifest, then every
 * item document it lists.
 *
 * @returns The package directory, the rows of every tree, the manifest tree's id and each item's
 *   path with its tree id.
 */
const importSharedMedia = Effect.gen(function* importedSharedMedia() {
  const fs = yield* FileSystem.FileSystem;
  const dir = yield* materialize("sharedMedia");
  const entries = yield* listPackage(dir);
  const manifest = yield* readXml(yield* fs.readFile(path.join(dir, "imsmanifest.xml")));
  const imported = yield* manifestRows(dir, entries, manifest, Rows.empty());
  let { rows } = imported;
  const items: (readonly [path: string, treeId: string])[] = [];

  for (const document of imported.documents) {
    const doc = yield* readXml(yield* fs.readFile(path.join(dir, document.path)));
    const withItem = yield* itemRows(
      {
        doc,
        packageId: imported.packageId,
        path: document.path,
        resource: document.resource,
        resourceLomHasGeneral: Rows.of(rows, ResourceLomGeneral).some(
          (general) => general.resource === document.resource,
        ),
        resourceType: document.type,
        version: imported.version,
      },
      rows,
    );

    ({ rows } = withItem);
    items.push([document.path, withItem.documentId]);
  }

  return { dir, items, packageId: imported.packageId, rows };
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on sharedMedia, no database",
  (it) => {
    it.effect("the manifest and both items render to the oracle's canonical bytes", () =>
      Effect.gen(function* everyKindRenders() {
        const { dir, items, packageId, rows } = yield* importSharedMedia;

        assert.deepStrictEqual(items.map(([file]) => file).toSorted(), [
          "example/graphic_order.xml",
          "example/hotspot.xml",
        ]);

        const trees: readonly (readonly [string, string])[] = [
          ["imsmanifest.xml", packageId],
          ...items,
        ];

        for (const [file, treeId] of trees) {
          const expected = textOf(yield* xmllintC14n(path.join(dir, file)));
          const rendered = textOf(canonicalize(renderTree(rows, treeId)));

          assert.strictEqual(rendered, expected, file);
        }
      }),
    );
  },
);

/**
 * An item that writes the attributes whose absence and presence must both survive: an empty and a
 * padded `headers`, a padded ARIA reference, an order interaction with and without `shuffle`, a
 * `source` with no `src`, and a root with a `label`, an `xml:lang` and a padded `title`.
 */
const synthetic = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="synthetic" title="  Padded   title " label="L  1" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>
  <qti-response-declaration identifier="OTHER" cardinality="ordered" base-type="identifier"/>
  <qti-item-body class=" a   b " id="body">
    <table summary="s"><tbody><tr><td headers="" colspan="2">a</td><td headers=" h1   h2 " aria-labelledby=" x  y " role="cell">b</td></tr></tbody></table>
    <qti-order-interaction response-identifier="RESPONSE" shuffle="true"><qti-simple-choice identifier="A" fixed="true">a</qti-simple-choice><qti-simple-choice identifier="B">b</qti-simple-choice></qti-order-interaction>
    <qti-order-interaction response-identifier="OTHER"><qti-simple-choice identifier="C">c</qti-simple-choice></qti-order-interaction>
    <picture><source srcset="a.svg" type="image/svg"/><img src="a.png" alt=""/></picture>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * The attributes the registries admit that no relation stores, so the importer drops them and no
 * render can bring them back: the schema has no `show-hide` for these kinds and no `match-min`
 * row for an associable hotspot.
 */
const unstored: ReadonlyMap<string, readonly string[]> = new Map([
  ["qti-associable-hotspot", ["match-min", "show-hide"]],
  ["qti-gap", ["show-hide"]],
  ["qti-gap-img", ["show-hide"]],
  ["qti-gap-text", ["show-hide"]],
  ["qti-hotspot-choice", ["show-hide"]],
  ["qti-hottext", ["show-hide"]],
  ["qti-inline-choice", ["show-hide"]],
]);

/**
 * The attributes every kind may carry whatever its registry row: the families, `id`, `headers`,
 * `role` and the ARIA attributes, which are rendered for any node, and `data-ssml`, which the
 * importer refuses.
 */
const shared: ReadonlySet<string> = new Set([
  "class",
  "data-catalog-idref",
  "data-qti-suppress-tts",
  "data-ssml",
  "dir",
  "headers",
  "id",
  "label",
  "lang",
  "xml:base",
  "xml:lang",
  ...Object.keys(family.relations)
    .filter((key) => key.startsWith("Aria"))
    .map((key) => (key === "AriaRole" ? "role" : `aria-${key.slice("Aria".length).toLowerCase()}`)),
]);

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on written and absent attributes, no database",
  (it) => {
    it.effect("an attribute the source omitted stays omitted and one it wrote is kept", () =>
      Effect.gen(function* writtenAndAbsent() {
        const doc = yield* readXml(new TextEncoder().encode(synthetic));
        const input: ItemInput = {
          doc,
          packageId: crypto.randomUUID(),
          path: "synthetic.xml",
          resource: "synthetic",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        };
        const { documentId, rows } = yield* itemRows(input, Rows.empty());
        const rendered = textOf(canonicalize(renderTree(rows, documentId)));

        assert.strictEqual(rendered, textOf(canonicalize(doc)));
        assert.include(rendered, 'headers=""');
        assert.include(rendered, 'headers=" h1   h2 "');
        assert.strictEqual(rendered.split('shuffle="').length - 1, 1);
        assert.notInclude(rendered, 'src=""');
        assert.notInclude(rendered, "owner");
      }),
    );

    it.effect("every attribute a registry admits has a source, or is one nothing stores", () =>
      Effect.sync(() => {
        const sources = new Map(
          Object.entries(ownAttributes).map(([kind, own]) => [kind, own.map(([name]) => name)]),
        );
        const admitted = new Map(
          registries.flatMap((registry) =>
            Object.entries(registry).map(([kind, row]) => [kind, row.attributes] as const),
          ),
        );

        for (const [kind, attributes] of admitted) {
          const lacking = attributes.filter(
            (name) =>
              !shared.has(name) &&
              !(sources.get(kind) ?? []).includes(name) &&
              !(unstored.get(kind) ?? []).includes(name),
          );

          assert.deepStrictEqual(lacking, [], `${kind}: admitted attributes with no source`);
        }

        for (const [kind, names] of sources) {
          assert.isTrue(admitted.has(kind), `${kind}: a source for a kind no registry holds`);
          for (const name of names) {
            assert.include(admitted.get(kind) ?? [], name, `${kind}: a source for ${name}`);
          }
        }
      }),
    );
  },
);
