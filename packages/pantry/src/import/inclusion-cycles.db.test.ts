/**
 * Inclusion cycles through `rtest01`'s fragment, imported on the lease, PostgreSQL the judge: a
 * cycle is refused under `inclusion-cycle` and no other rule, since no instance repeats a document
 * whose placements would break the assembly's keys first, whether or not an item places it and with
 * or without a fragment only the cycle places, and the same packages without the cycle are
 * accepted. The oracle's side is `test/inclusion-cycles.oracle.test.ts`.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { cyclePackageOf, cycles, includerCounts, tails } from "#pantry/test/inclusion-cycles.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

describe.skipIf(!hasLease)(
  "import/inclusion-cycles.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("an inclusion cycle, refused under its own rule alone", (it) => {
      for (const [cycle, includers, tail] of cycles.flatMap((held) =>
        includerCounts.flatMap((count) => tails.map((has) => [held, count, has] as const)),
      )) {
        it.effect(
          `${cycle === "none" ? "accepts" : "refuses"} rtest01 with ${cycle === "none" ? "no cycle" : `a ${cycle} cycle`}, placed by ${String(includers)} set items${tail ? ", with a tail" : ""}`,
          () =>
            // Oracle: PostgreSQL, every law of the schema over the case's package; the expected
            // verdict is its inclusion graph's, a cycle or none.
            Effect.scoped(
              Effect.gen(function* cycleVerdict() {
                const fs = yield* FileSystem.FileSystem;
                const dir = yield* scratchDirectory("inclusion-cycles-");
                const base = yield* readPackage(yield* materialize("rtest01"));
                for (const file of cyclePackageOf(base, { cycle, includers, tail })) {
                  yield* fs.makeDirectory(path.dirname(`${dir}/${file.path}`), {
                    recursive: true,
                  });
                  yield* fs.writeFile(`${dir}/${file.path}`, file.bytes);
                }

                const outcome = yield* Effect.result(importPackage(dir));

                if (cycle === "none") {
                  assert.strictEqual(outcome._tag, "Success", "the acyclic package");
                } else {
                  assert.isTrue(
                    outcome._tag === "Failure" &&
                      outcome.failure instanceof ImportRefused &&
                      outcome.failure.rule === "inclusion-cycle",
                    outcome._tag === "Failure" ? outcome.failure.message : "accepted",
                  );
                }
              }),
            ),
        );
      }
    });
  },
);
