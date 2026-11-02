import path from "node:path";
import { Db, query, uuid, v } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Ref, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { importPackage } from "#qti/import/package.ts";
import { Document } from "#qti/schema/document.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { AttributeLexical, Node } from "#qti/schema/node.ts";
import { Author } from "#qti/schema/roles.ts";
import { materialize, materializeZip } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

/**
 * The directory the scratch files of this suite are made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The packaging fixtures whose import is accepted whole, the spec's 4.12 positives.
 */
const positives = [
  "lomrest",
  "csm",
  "filelom",
  "nestedqmd",
  "extmeta",
  "variant",
  "variant-padded",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "outcome",
  "lti301",
  "lti300",
  "bytes",
] as const satisfies readonly FixtureName[];

const documentsOf = query(Author).rule((r) => {
  const { id } = v(Document);

  return r.match(Document, { id, package: r.param("package", uuid) }).find({ id });
});

const lexicalsOf = query(Author).rule((r) => {
  const { attribute, kind, node, value } = v(AttributeLexical);

  return r
    .match(Node, { id: node, tree: r.param("tree", uuid) })
    .match(AttributeLexical, { attribute, kind, node, value })
    .find({ attribute, kind, node, value });
});

const nodesOf = query(Author).rule((r) => {
  const { id } = v(Node);

  return r.match(Node, { id, tree: r.param("tree", uuid) }).find({ total: r.count() });
});

/**
 * Every tree an imported package holds: the manifest's, whose id is the package id, and its
 * documents'.
 */
const treesOf = (packageId: string) =>
  Effect.gen(function* treesOfPackage() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const documents = yield* (yield* db.execute(documentsOf, { package: packageId })).collect;

    return [packageId, ...documents.map((row) => row.id)];
  });

/**
 * The `AttributeLexical` rows of every tree of a package, read back by a query over the relation.
 */
const lexicalsOfPackage = (packageId: string) =>
  Effect.gen(function* lexicalsOfTrees() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const found = [];

    for (const tree of yield* treesOf(packageId)) {
      found.push(...(yield* (yield* db.execute(lexicalsOf, { tree })).collect));
    }

    return found;
  });

/**
 * How many nodes a package's trees hold in all, read back by a query over `Node`.
 */
const nodeTotalOf = (packageId: string) =>
  Effect.gen(function* nodeTotalOfPackage() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    let total = 0n;

    for (const tree of yield* treesOf(packageId)) {
      for (const row of yield* (yield* db.execute(nodesOf, { tree })).collect) {
        total += row.total;
      }
    }

    return total;
  });

/**
 * The part of an accepted apply outcome this suite reads: the rows added to each relation.
 */
const AppliedCounts = Schema.Struct({
  counts: Schema.Array(Schema.Struct({ added: Schema.BigInt, relation: Schema.String })),
});

/**
 * The rows an accepted apply added, by relation, as the strings the report keeps.
 */
const countsOf = ({ counts }: typeof AppliedCounts.Type): Record<string, string> =>
  Object.fromEntries(counts.map((count) => [count.relation, String(count.added)]));

const decodeCounts = Schema.decodeUnknownOption(AppliedCounts);

/**
 * Import a package and keep the row count the engine reports for each relation of the apply.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The package id and the rows added, by relation name.
 */
const importCounting = (dir: string) =>
  Effect.gen(function* importCountingRows() {
    const counts = yield* Ref.make<Record<string, string>>({});
    const id = yield* importPackage(dir, {
      wrapApply: (apply) =>
        Effect.tap(apply, (outcome) =>
          Option.match(decodeCounts(outcome), {
            onNone: () => Effect.void,
            onSome: (decoded) => Ref.set(counts, countsOf(decoded)),
          }),
        ),
    });

    return { counts: yield* Ref.get(counts), id };
  });

describe.skipIf(!hasLease)(
  "import/package.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("importPackage of the packaging fixtures on the lease", (it) => {
      for (const name of positives) {
        it.effect(`accepts ${name} as one package`, () =>
          Effect.gen(function* acceptsPositive() {
            const { counts, id } = yield* importCounting(yield* materialize(name));

            assert.match(id, uuidPattern);
            assert.isAbove(Object.keys(counts).length, 0, `${name}: the apply reported no counts`);
          }),
        );
      }

      it.effect("variant-padded keeps its padded identifier in one AttributeLexical row", () =>
        Effect.gen(function* variantPadded() {
          const { id } = yield* importCounting(yield* materialize("variant-padded"));
          const rows = yield* lexicalsOfPackage(id);
          const found = rows.filter((row) => row.kind === "cpx:variant");

          assert.deepStrictEqual(
            found.map((row) => [row.attribute, row.value]),
            [["identifier", " v1 "]],
          );
        }),
      );

      it.effect("usage3-padded keeps the statistic's name and the map entry's key", () =>
        Effect.gen(function* usagePadded() {
          const { id } = yield* importCounting(yield* materialize("usage3-padded"));
          const rows = yield* lexicalsOfPackage(id);
          const found = rows.filter((row) => row.kind.startsWith("ud:"));

          assert.deepStrictEqual(found.map((row) => `${row.attribute}=${row.value}`).toSorted(), [
            "mapKey=a\tb",
            "name= AIS ",
          ]);
          assert.strictEqual(found.length, rows.length, "no other attribute keeps a lexical form");
        }),
      );

      it.effect("records the apply's row counts for usage3, the largest of the packages", () =>
        Effect.gen(function* usageCounts() {
          const fs = yield* FileSystem.FileSystem;
          const { counts } = yield* importCounting(yield* materialize("usage3"));

          yield* fs.makeDirectory(`${workDirectory}/import`, { recursive: true });
          yield* fs.writeFileString(
            `${workDirectory}/import/usage3.counts.json`,
            `${JSON.stringify(counts, undefined, 2)}\n`,
          );
          yield* Effect.log("usage3 apply counts", counts);
        }),
      );

      it.effect("simple imported from its zip and from its directory yields the same rows", () =>
        Effect.gen(function* sameRows() {
          const fromZip = yield* importCounting(yield* materializeZip("simple"));
          const fromDirectory = yield* importCounting(yield* materialize("simple"));

          assert.notStrictEqual(fromZip.id, fromDirectory.id);
          assert.deepStrictEqual(fromZip.counts, fromDirectory.counts);
          assert.strictEqual(yield* nodeTotalOf(fromZip.id), yield* nodeTotalOf(fromDirectory.id));
        }),
      );
    });
  },
);
