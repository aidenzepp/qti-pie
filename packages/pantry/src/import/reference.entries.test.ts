import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readRows } from "#pantry/import/preview.ts";
import { Rows } from "#pantry/import/tree.ts";
import { materializeProcessing, processingFixtureNames } from "#pantry/processing/fixtures.ts";
import { PackageEntry } from "#pantry/schema/package.ts";
import { AttributeFileReference } from "#pantry/schema/reference.ts";
import { fixtureNames, materialize } from "#pantry/test/fixtures.ts";

/**
 * The fixtures whose rows name a `(package, path)` that no `PackageEntry` holds, each a negative
 * some test expects refused. The list is measured; a fixture that joins it must be one a test
 * expects refused.
 */
const violators = [
  // Refused with `resource-root` by `package.packaging.test.ts:67`.
  "extmeta-item-root",
  // Refused with `file-exists` and `document-reference` by `tests.db.test.ts:314`.
  "stimulus-missing-image",
];

/**
 * Read every fixture of both name lists. A fixture the read refuses counts as refused-by-read; for
 * the rest, whether some `AttributeFileReference` names a `(package, path)` no `PackageEntry` row
 * holds.
 */
const survey = Effect.gen(function* surveyFixtures() {
  const all = [
    ...fixtureNames.map((name) => ({ dir: materialize(name), name })),
    ...processingFixtureNames.map((name) => ({ dir: materializeProcessing(name), name })),
  ];
  const read: { name: string; violates: boolean }[] = [];
  let refused = 0;

  for (const { dir, name } of all) {
    const result = yield* Effect.result(
      Effect.gen(function* readFixture() {
        return yield* readRows(yield* dir);
      }),
    );

    if (result._tag === "Failure") {
      refused += 1;
    } else {
      const { rows } = result.success;
      const held = new Set(
        Rows.of(rows, PackageEntry).map((entry) => `${entry.package}\u0000${entry.path}`),
      );

      read.push({
        name,
        violates: Rows.of(rows, AttributeFileReference).some(
          (reference) => !held.has(`${reference.package}\u0000${reference.path}`),
        ),
      });
    }
  }

  return { names: all.length, read, refused };
});

layer(NodeServices.layer)(
  "every fixture the importer reads holds the files its references name",
  (it) => {
    it.effect(
      "breaks the file-exists law only in the negatives a test expects refused",
      () =>
        Effect.gen(function* witness() {
          const { names, read, refused } = yield* survey;

          assert.strictEqual(read.length + refused, names);
          assert.isAbove(read.length, 0);
          assert.sameMembers(
            read.filter((fixture) => fixture.violates).map((fixture) => fixture.name),
            violators,
          );
        }),
      300_000,
    );
  },
);
