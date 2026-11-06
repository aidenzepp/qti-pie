import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import type { AnyRelation, Uuid } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { readTree, treesOf } from "#pantry/export/read.ts";
import { renderTree } from "#pantry/export/render.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { importPackage, readRows } from "#pantry/import/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import { listPackage } from "#pantry/package/read.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import { Author } from "#pantry/schema/roles.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { xmllintC14n } from "#pantry/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";

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
        resourceLomHasGeneral: Rows.of(imported.rows, ResourceLomGeneral).some(
          (general) => general.resource === document.resource,
        ),
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
const assertRenders = (rows: Rows, treeId: Uuid, file: string) =>
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

describe.skipIf(!hasLease)(
  "export/read.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
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

              assert.lengthOf(
                trees,
                2,
                `the ${name} package holds a manifest tree and an item tree`,
              );

              const [manifestId, documentId] = trees;

              if (manifestId === undefined || documentId === undefined) {
                assert.fail(`the ${name} package has two trees`);
              }

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
            const dir = yield* materialize(name);
            const imported = (yield* readRows(dir)).rows;
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
  },
);
