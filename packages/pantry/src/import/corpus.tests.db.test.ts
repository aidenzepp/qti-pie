import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { materializeZip } from "#pantry/test/fixtures.ts";
import type { ZipName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs, settings } from "#pantry/test/settings.ts";

/**
 * The corpus packages phase 5 accepts: each imports, exports, and the export compares canonically
 * equal to its source (spec 4.19).
 */
const acceptedPackages = [
  "BegGuide_March2025",
  "CASE",
  "externalMetadata",
  "englishBasicLevelV2",
  "interactionMixSaxonyV3",
  "ccPackage",
] as const satisfies readonly ZipName[];

/**
 * The corpus packages phase 5 refuses, each with the rules its refusal may name (spec 4.19). A
 * refusal under any rule outside its set fails the case.
 */
const refusedPackages = [
  { name: "englishHighLevelV2", rules: ["lom-title", "section-empty"] },
  { name: "test_package_minfiles", rules: ["P8", "lom-identifier", "lom-title"] },
  { name: "CASEWithOutcome", rules: ["lom-title"] },
] as const satisfies readonly { readonly name: ZipName; readonly rules: readonly Rule[] }[];

/**
 * The folder every case's export lands in, `packages/pantry/work/corpus-tests`; each package has a
 * folder of its own under it, named for the package.
 */
const scratchRoot = path.resolve(import.meta.dirname, "..", "..", "work", "corpus-tests");

/**
 * Import a corpus package, export it, and assert every entry of the export compares equal to the
 * source.
 */
const roundTrips = Effect.fn("corpus.roundTrips")(function* roundTrips(name: ZipName) {
  const fs = yield* FileSystem.FileSystem;
  const source = yield* materializeZip(name);
  const target = path.join(scratchRoot, name);

  const id = yield* importPackage(source);

  yield* fs.remove(target, { force: true, recursive: true });
  yield* fs.makeDirectory(target, { recursive: true });
  yield* exportPackage(id, target);

  const report = yield* comparePackage(source, target);
  const rendered = renderReport(report);

  assert.isAbove(report.length, 0, `${name}: the package has entries`);
  for (const { outcome, path: at } of report) {
    assert.include(
      ["canonical-equal", "byte-identical"],
      outcome.kind,
      `${name}: ${at} is equal\n${rendered}`,
    );
  }
});

/**
 * Import a corpus package and assert the importer refuses it under one of the given rules.
 */
const refusedUnder = Effect.fn("corpus.refusedUnder")(function* refusedUnder(
  name: ZipName,
  rules: readonly Rule[],
) {
  const result = yield* Effect.result(importPackage(yield* materializeZip(name)));

  if (Result.isSuccess(result)) {
    assert.fail(`${name} was accepted as package ${result.success}`);
  }

  const refusal = result.failure;

  if (!(refusal instanceof ImportRefused)) {
    assert.fail(`${name} failed with something other than a refusal: ${refusal.message}`);
  }

  assert.include(rules, refusal.rule, `${name}: ${refusal.message}`);
});

describe.skipIf(!(hasLease && settings.corpusRequested))(
  "import/corpus.tests.db.test.ts, the corpus proofs on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the nine corpus rows of spec 4.19", (it) => {
      for (const name of acceptedPackages) {
        it.effect(`${name} is accepted and round-trips canonically equal`, () => roundTrips(name));
      }

      for (const { name, rules } of refusedPackages) {
        it.effect(`${name} is refused under ${rules.join(", ")}`, () => refusedUnder(name, rules));
      }
    });
  },
);
