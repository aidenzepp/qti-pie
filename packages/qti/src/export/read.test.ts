import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { renderTree } from "#qti/export/render.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import { listPackage } from "#qti/package/read.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The text of a canonical form, so a failed comparison prints the two documents and not two byte
 * arrays.
 */
const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Import a fixture package's manifest and its one item into in-memory rows, no database.
 *
 * @param name - The fixture to materialize and import.
 * @returns The package directory, the rows of both trees and the id of each tree.
 */
const importFixture = (name: FixtureName) =>
  Effect.gen(function* importedFixture() {
    const fs = yield* FileSystem.FileSystem;
    const dir = yield* materialize(name);
    const entries = yield* listPackage(dir);
    const manifest = yield* readXml(yield* fs.readFile(path.join(dir, "imsmanifest.xml")));
    const imported = yield* manifestRows(dir, entries, manifest, Rows.empty());
    const [document] = imported.documents;
    if (document === undefined) {
      return assert.fail(`the ${name} manifest names an item`);
    }

    const item = yield* readXml(yield* fs.readFile(path.join(dir, document.path)));
    const withItem = yield* itemRows(
      {
        doc: item,
        packageId: imported.packageId,
        path: document.path,
        resource: document.resource,
        resourceType: document.type,
        version: imported.version,
      },
      imported.rows,
    );

    return {
      dir,
      documentId: withItem.documentId,
      packageId: imported.packageId,
      rows: withItem.rows,
    };
  });

/**
 * Assert that the tree `treeId` of `rows` renders to the canonical form `xmllint` gives `file`.
 *
 * @returns The rendered canonical text, for the assertions that name what it holds.
 */
const assertRenders = (rows: Rows, treeId: string, file: string) =>
  Effect.gen(function* rendersLikeTheOracle() {
    const expected = textOf(yield* xmllintC14n(file));
    const rendered = textOf(canonicalize(renderTree(rows, treeId)));

    assert.strictEqual(rendered, expected);

    return rendered;
  });

/**
 * How many comments a canonical text holds.
 */
const commentsIn = (text: string): number => text.split("<!--").length - 1;

layer(NodeServices.layer, { excludeTestServices: true })("export/render.ts, no database", (it) => {
  for (const name of [
    "simple",
    "comment-in-element",
    "padded-attributes",
    "padded-text",
  ] as const) {
    it.effect(`${name}: both trees render to the oracle's canonical bytes`, () =>
      Effect.gen(function* bothTrees() {
        const { dir, documentId, packageId, rows } = yield* importFixture(name);

        const manifest = yield* assertRenders(rows, packageId, path.join(dir, "imsmanifest.xml"));
        const item = yield* assertRenders(rows, documentId, path.join(dir, "choice.xml"));

        assert.strictEqual(
          commentsIn(manifest) + commentsIn(item),
          name === "comment-in-element" ? 4 : 3,
        );
        assert.strictEqual(item.includes("<!-- c -->"), name === "comment-in-element");
        assert.strictEqual(item.includes("<?pi d?>"), name === "comment-in-element");
      }),
    );
  }
});
