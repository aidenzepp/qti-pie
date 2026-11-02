import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { readTree, treesOf } from "#qti/export/read.ts";
import { importPackage } from "#qti/import/package.ts";
import { Rows } from "#qti/import/tree.ts";
import { Coords } from "#qti/schema/shapes.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The 20 positives of phase 2's fixtures a: the 19 cut items of `p2-51`, one per interaction that
 * has a pure corpus item, and `end-attempt`, the hand-written item of the one interaction that has
 * none (spec 3.6).
 */
const positives = [
  "cut-associate",
  "cut-choice",
  "cut-drawing",
  "cut-extended-text",
  "cut-gap-match",
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-graphic-order",
  "cut-hotspot",
  "cut-hottext",
  "cut-inline-choice",
  "cut-match",
  "cut-media",
  "cut-order",
  "cut-position-object",
  "cut-select-point",
  "cut-slider",
  "cut-text-entry",
  "cut-upload",
  "end-attempt",
] as const satisfies readonly FixtureName[];

/**
 * The four cut items that carry `Coords` rows, the witness of N1: a hotspot-bearing element writes
 * one `Coords` row of its own node kind under each of the three selected bindings of `p2-15`.
 */
const hotspotBearing = [
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-graphic-order",
  "cut-hotspot",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/` and compare the export with the fixture.
 *
 * @param name - The fixture to round-trip.
 * @returns The package id the import answered and the comparison report, whose rendering is also
 *   left beside the export in `work/export/<name>.report.txt`.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return { id, report };
  });

/**
 * The `Coords` rows an imported package holds, from every tree it has.
 *
 * @param id - The package id `importPackage` answered.
 * @returns The rows, each a node, the kind of its owner, a shape and a value.
 */
const coordsOf = (id: string) =>
  Effect.gen(function* coordsOfPackage() {
    const trees = yield* treesOf(id);
    const read = yield* Effect.all(trees.map((tree) => readTree(id, tree)));

    return read.flatMap((rows) => Rows.of(rows, Coords));
  });

describe.skipIf(!hasLease)(
  "import/content-a.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the 20 positives round-trip through the database", (it) => {
      for (const name of positives) {
        it.effect(`${name} imports, exports and compares all equal`, () =>
          Effect.gen(function* positiveRoundTrip() {
            const { report } = yield* roundTrip(name);

            assert.isAbove(report.length, 1, "a package is at least a manifest and an item");
            assert.strictEqual(
              report.filter(
                (item) =>
                  item.outcome.kind !== "canonical-equal" && item.outcome.kind !== "byte-identical",
              ).length,
              0,
              renderReport(report),
            );
            assert.isTrue(renderReport(report).endsWith("\nall equal"), renderReport(report));
          }),
        );
      }

      for (const name of hotspotBearing) {
        it.effect(`${name} carries Coords rows of one owner kind`, () =>
          Effect.gen(function* coordsWitness() {
            const fs = yield* FileSystem.FileSystem;
            const { id } = yield* roundTrip(name);
            const coords = yield* coordsOf(id);
            const kinds = [...new Set(coords.map((row) => row.ownerKind))];
            const line = `${name}: ${coords.length} Coords rows, owner kind ${kinds.join(", ")}`;

            yield* fs.writeFileString(`${workDirectory}/export/${name}.coords.txt`, `${line}\n`);
            yield* Effect.log(line);

            assert.isAbove(coords.length, 0, line);
            assert.strictEqual(kinds.length, 1, line);
          }),
        );
      }
    });
  },
);
