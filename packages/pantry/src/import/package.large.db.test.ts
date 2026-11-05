import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readRows } from "#pantry/import/preview.ts";
import { materializeProcessing } from "#pantry/processing/fixtures.ts";
import { Package } from "#pantry/schema/package.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The floor on the relations `large-program` writes: the number its import wrote when it crossed
 * the compiler's old ceiling of 1,048,576 SQL bytes.
 *
 * Measured on 2026-11-05 on pin `ee3b5fc`: the import program needed 1,048,611 SQL bytes, 35 over
 * the ceiling, and wrote facts to 199 relations (the `Package` relation and 198 others). `ee3b5fc`
 * refused it as `ResourceBound` on `sqlBytes`; the importer named the refusal `program-budget`.
 *
 * The floor keeps the package from silently shrinking below the size that crossed. It is a property
 * of the package, not a size of grizzle's program, which the pinned grizzle no longer reports.
 */
const LARGE_PROGRAM_RELATIONS = 199;

/**
 * The directory the export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export`;

describe.skipIf(!hasLease)(
  "import/package.large.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("a package whose import program passes the old 1 MiB cap", (it) => {
      it.effect("large-program imports in one transaction and its export compares all equal", () =>
        Effect.gen(function* importsAndRoundTrips() {
          const fs = yield* FileSystem.FileSystem;
          const source = yield* materializeProcessing("large-program");
          const { rows } = yield* readRows(source);
          const relations = [...rows].filter(
            ([relation, facts]) => relation === Package || facts.length > 0,
          ).length;
          const exported = `${exportRoot}/large-program`;

          yield* Effect.log(`large-program: writes ${relations} relations`);

          assert.isAtLeast(relations, LARGE_PROGRAM_RELATIONS);

          const importStarted = Date.now();
          const id = yield* importPackage(source);
          const importMs = Date.now() - importStarted;

          yield* fs.remove(exported, { force: true, recursive: true });
          yield* fs.makeDirectory(exported, { recursive: true });

          const exportStarted = Date.now();

          yield* exportPackage(id, exported);

          const report = yield* comparePackage(source, exported);
          const rendered = renderReport(report);

          yield* Effect.log(
            `large-program: import ${importMs} ms, export and compare ${Date.now() - exportStarted} ms`,
          );

          assert.isAbove(report.length, 0);
          for (const item of report) {
            assert.include(["canonical-equal", "byte-identical"], item.outcome.kind, rendered);
          }
        }),
      );
    });
  },
);
