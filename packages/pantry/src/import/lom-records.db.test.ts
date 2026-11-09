/**
 * The LOM records of `simple`'s resource and of its image file, imported on the lease, PostgreSQL
 * the judge: a package whose resource's own record names another identifier or title is refused
 * under `lom-identifier` or `lom-title`, and one whose image file's record does is accepted, since
 * the file's record describes the file (spec reading 62, `test/lom-records.ts`). The oracle's side
 * is `test/lom-records.oracle.test.ts`.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { fileRecords, namings, recordPackageOf, rulesOf } from "#pantry/test/lom-records.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

describe.skipIf(!hasLease)(
  "import/lom-records.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the LOM records that name an item", (it) => {
      for (const identifier of namings) {
        for (const title of namings) {
          for (const file of fileRecords) {
            const drawn = { file, identifier, title };
            const rules = rulesOf(drawn);
            it.effect(
              `${rules.length === 0 ? "accepts" : "refuses"} a resource record naming ${identifier} identifier and ${title} title, its file's record ${file}`,
              () =>
                // Oracle: PostgreSQL, every law of the schema over the case's package; the expected
                // verdict is the case's as written (spec reading 62).
                Effect.scoped(
                  Effect.gen(function* recordVerdict() {
                    const fs = yield* FileSystem.FileSystem;
                    const dir = yield* scratchDirectory("lom-records-");
                    const base = yield* readPackage(yield* materialize("simple"));
                    for (const entry of recordPackageOf(base, drawn)) {
                      yield* fs.makeDirectory(path.dirname(`${dir}/${entry.path}`), {
                        recursive: true,
                      });
                      yield* fs.writeFile(`${dir}/${entry.path}`, entry.bytes);
                    }

                    const outcome = yield* Effect.result(importPackage(dir));

                    if (rules.length === 0) {
                      assert.strictEqual(outcome._tag, "Success", JSON.stringify(drawn));
                    } else {
                      assert.isTrue(
                        outcome._tag === "Failure" &&
                          outcome.failure instanceof ImportRefused &&
                          outcome.failure.rules.some((rule) => rules.includes(rule)),
                        `${JSON.stringify(drawn)}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
                      );
                    }
                  }),
                ),
            );
          }
        }
      }
    });
  },
);
