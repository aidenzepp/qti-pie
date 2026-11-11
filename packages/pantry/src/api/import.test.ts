/**
 * The public import and preview programs (`#pantry/api/import.ts`), without the database: the
 * preview's verdict on a package the importer accepts, and the refused verdict the reader's
 * refusal becomes.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { inject } from "vitest";
import { previewPackage } from "#pantry/api/import.ts";

const fixtures = inject("fixtures");

/**
 * The package's own scratch directory, which holds the empty package directory a test makes.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

layer(NodeServices.layer, { excludeTestServices: true })("previewPackage", (suite) => {
  suite.effect(
    "previews a corpus package the importer accepts, with positive counts and no database check",
    () =>
      Effect.gen(function* previewed() {
        const verdict = yield* previewPackage(fixtures.simple);

        assert.strictEqual(verdict.verdict, "previewed");
        if (verdict.verdict === "previewed") {
          assert.isFalse(verdict.databaseChecked);
          assert.isAbove(verdict.relations, 0);
          assert.isAbove(verdict.rows, 0);
        }
      }),
  );

  suite.effect(
    "refuses a directory with no imsmanifest.xml at level Qti, under the manifest-root rule",
    () =>
      // Oracle: the internal preview's own refusal, `manifest-root` (`#pantry/import/program.ts`,
      // `listDocuments`), the rule the public verdict must carry unchanged.
      Effect.gen(function* refused() {
        const fs = yield* FileSystem.FileSystem;

        yield* fs.makeDirectory(workDirectory, { recursive: true });

        const empty = yield* fs.makeTempDirectoryScoped({
          directory: workDirectory,
          prefix: "api-import-test-",
        });
        const verdict = yield* previewPackage(empty);

        assert.strictEqual(verdict.verdict, "refused");
        if (verdict.verdict === "refused") {
          assert.strictEqual(verdict.refusal.kind, "qti");
          assert.strictEqual(verdict.refusal.level, "Qti");
          assert.strictEqual(verdict.refusal.rule, "manifest-root");
          assert.strictEqual(verdict.refusal.origin._tag, "Reader");
        }
      }).pipe(Effect.scoped),
  );
});
