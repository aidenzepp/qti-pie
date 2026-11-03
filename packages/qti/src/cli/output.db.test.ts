import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, Layer, Schema } from "effect";
import { describe, inject } from "vitest";
import { ImportData } from "#qti/cli/import.ts";
import { RoundtripData } from "#qti/cli/roundtrip.ts";
import { successEnvelope } from "#qti/cli/output.ts";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage } from "#qti/export/compare.ts";
import { captureCli, packageCopy } from "#qti/test/cli.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The envelope of `import`, as a reader decodes it from a line of standard output.
 */
const importEnvelope = Schema.fromJsonString(successEnvelope("import", ImportData));

/**
 * The envelope of `roundtrip`, whole.
 */
const roundtripEnvelope = Schema.fromJsonString(successEnvelope("roundtrip", RoundtripData));

/**
 * The last line of a jsonl run: the envelope without its entries.
 */
const summaryEnvelope = Schema.fromJsonString(
  successEnvelope(
    "roundtrip",
    Schema.Struct({
      differing: Schema.Number,
      export_dir: Schema.String,
      package_id: Schema.String,
    }),
  ),
);

/**
 * One entry line of a jsonl run.
 */
const entryLine = Schema.fromJsonString(
  Schema.Struct({
    outcome: Schema.Struct({ at: Schema.optionalKey(Schema.String), kind: Schema.String }),
    path: Schema.String,
  }),
);

describe.skipIf(!hasLease)(
  "output.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("--output on the lease", (it) => {
      it.effect("--json import prints one line, the envelope with the package id", () =>
        Effect.gen(function* importJson() {
          const { exit, stderr, stdout } = yield* captureCli(["--json", "import", fixtures.simple]);

          assert.isTrue(Exit.isSuccess(exit), stderr);
          assert.strictEqual(stdout.split("\n").length, 1);

          const envelope = Schema.decodeUnknownSync(importEnvelope)(stdout);

          assert.isTrue(envelope.ok);
          assert.strictEqual(envelope.schema_version, 1);
          assert.match(
            envelope.data.package_id,
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
          );
        }),
      );

      it.effect("--json roundtrip prints the report's entries and no differing", () =>
        Effect.gen(function* roundtripJson() {
          const copy = yield* packageCopy(fixtures.simple, "copy-output-json-simple");
          const { exit, stderr, stdout } = yield* captureCli(["--json", "roundtrip", copy]);

          assert.isTrue(Exit.isSuccess(exit), stderr);
          assert.strictEqual(stdout.split("\n").length, 1);

          const envelope = Schema.decodeUnknownSync(roundtripEnvelope)(stdout);
          const report = yield* comparePackage(copy, "work/export/copy-output-json-simple");

          assert.isTrue(envelope.ok);
          assert.strictEqual(envelope.data.differing, 0);
          assert.deepStrictEqual(
            envelope.data.entries.map(({ path }) => path),
            report.map(({ path }) => path),
          );
        }),
      );

      it.effect("--output jsonl roundtrip prints one object per entry, then the summary", () =>
        Effect.gen(function* roundtripJsonl() {
          const copy = yield* packageCopy(fixtures.simple, "copy-output-jsonl-simple");
          const { exit, stderr, stdout } = yield* captureCli([
            "--output",
            "jsonl",
            "roundtrip",
            copy,
          ]);

          assert.isTrue(Exit.isSuccess(exit), stderr);

          const lines = stdout.split("\n");
          const report = yield* comparePackage(copy, "work/export/copy-output-jsonl-simple");
          const summary = Schema.decodeUnknownSync(summaryEnvelope)(lines.at(-1));

          assert.strictEqual(lines.length, report.length + 1);
          assert.deepStrictEqual(
            lines.slice(0, -1).map((line) => Schema.decodeUnknownSync(entryLine)(line)),
            [...report],
          );
          assert.isTrue(summary.ok);
          assert.strictEqual(summary.data.differing, 0);
          assert.notProperty(summary.data, "entries");
        }),
      );
    });
  },
);
