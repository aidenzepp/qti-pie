import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { readTree, treesOf } from "#qti/export/read.ts";
import { renderTree } from "#qti/export/render.ts";
import { importPackage } from "#qti/import/package.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import { Author } from "#qti/schema/roles.ts";
import { listPackage } from "#qti/package/read.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "#qti/xml/read.ts";
import { hasLease } from "#qti/test/settings.ts";

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

const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gu;

/**
 * The relations of a package that belong to no tree: the package's entries and the bytes of its
 * files, which `readTree` does not read.
 */
const packageLevel: ReadonlySet<string> = new Set(["FileContent", "PackageEntry"]);

/**
 * Every fact of `rows` by relation name as sorted text with its ids masked, so two sets of rows
 * that differ only in the ids a run generated compare equal.
 */
const maskedFacts = (rows: Rows): ReadonlyMap<string, readonly string[]> =>
  new Map(
    Author.write
      .filter((name) => !packageLevel.has(name))
      .map((name) => [
        name,
        Rows.of(rows, Author.relations[name])
          .map((fact) =>
            Object.entries(fact)
              .toSorted(([left], [right]) => left.localeCompare(right))
              .map(([field, value]) => `${field}=${String(value)}`)
              .join("\n")
              .replaceAll(uuidPattern, "id"),
          )
          .toSorted(),
      ]),
  );

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

describe.skipIf(!hasLease)("export/read.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: "120 seconds",
  })("export/read.ts, on the lease", (it) => {
    for (const name of [
      "simple",
      "comment-in-element",
      "padded-attributes",
      "padded-text",
    ] as const) {
      it.effect(
        `${name}: the read-back of both trees renders to the oracle's canonical bytes`,
        () =>
          Effect.gen(function* readBackBothTrees() {
            const dir = yield* materialize(name);
            const packageId = yield* importPackage(dir);
            const trees = yield* treesOf(packageId);

            assert.lengthOf(trees, 2, `the ${name} package holds a manifest tree and an item tree`);

            const [manifestId = "", documentId = ""] = trees;

            assert.strictEqual(manifestId, packageId);

            const manifest = yield* assertRenders(
              yield* readTree(packageId, manifestId),
              manifestId,
              path.join(dir, "imsmanifest.xml"),
            );
            const item = yield* assertRenders(
              yield* readTree(packageId, documentId),
              documentId,
              path.join(dir, "choice.xml"),
            );

            assert.strictEqual(
              commentsIn(manifest) + commentsIn(item),
              name === "comment-in-element" ? 4 : 3,
            );
            assert.strictEqual(item.includes("<!-- c -->"), name === "comment-in-element");
            assert.strictEqual(item.includes("<?pi d?>"), name === "comment-in-element");
          }),
      );
    }

    for (const name of [
      "simple",
      "comment-in-element",
      "padded-attributes",
      "padded-text",
    ] as const) {
      it.effect(`${name}: the read-back holds the importer's facts, one for one`, () =>
        Effect.gen(function* sameFacts() {
          const { dir } = yield* importFixture(name);
          const imported = (yield* importFixture(name)).rows;
          const packageId = yield* importPackage(dir);
          const read = new Map<AnyRelation, readonly object[]>();
          for (const tree of yield* treesOf(packageId)) {
            for (const [relation, facts] of yield* readTree(packageId, tree)) {
              read.set(relation, [...(read.get(relation) ?? []), ...facts]);
            }
          }

          const expected = maskedFacts(imported);
          const actual = maskedFacts(read);
          assert.isAtLeast(
            [...expected.values()].filter((facts) => facts.length > 0).length,
            40,
            `${name}: the importer wrote facts of at least forty relations`,
          );
          for (const [relation, facts] of expected) {
            assert.deepStrictEqual(actual.get(relation), facts, `${name}: ${relation}`);
          }
        }),
      );
    }
  });
});
