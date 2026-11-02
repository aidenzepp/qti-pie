import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The 40 positives of phase 2's fixtures b: one hand-written item per HTML kind that has an arm
 * and that the corpus never uses (spec 3.6's second census; `template` has no arm and no positive).
 * Each is `cut-choice`'s item with one minimal use of the element in its body.
 */
const positives = [
  "html-abbr",
  "html-acronym",
  "html-address",
  "html-article",
  "html-aside",
  "html-audio",
  "html-bdi",
  "html-big",
  "html-caption",
  "html-cite",
  "html-code",
  "html-col",
  "html-colgroup",
  "html-dd",
  "html-details",
  "html-dfn",
  "html-dl",
  "html-dt",
  "html-footer",
  "html-h4",
  "html-h6",
  "html-header",
  "html-kbd",
  "html-label",
  "html-nav",
  "html-ol",
  "html-param",
  "html-pre",
  "html-q",
  "html-rp",
  "html-rtc",
  "html-samp",
  "html-small",
  "html-sub",
  "html-summary",
  "html-tfoot",
  "html-th",
  "html-thead",
  "html-tt",
  "html-var",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/` and compare the export with the fixture.
 *
 * @param name - The fixture to round-trip.
 * @returns The comparison report, whose rendering is also left beside the export in
 *   `work/export/<name>.report.txt`.
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

    return report;
  });

describe.skipIf(!hasLease)(
  "import/content-b.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the 40 HTML positives round-trip through the database", (it) => {
      for (const name of positives) {
        it.effect(`${name} imports, exports and compares all equal`, () =>
          Effect.gen(function* positiveRoundTrip() {
            const report = yield* roundTrip(name);

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
    });
  },
);
