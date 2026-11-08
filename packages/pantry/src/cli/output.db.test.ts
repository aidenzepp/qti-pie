import { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, Layer, Schema } from "effect";
import { describe, inject } from "vitest";
import { ImportData } from "#pantry/cli/import.ts";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";
import { successEnvelope } from "#pantry/cli/output.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { compareWithRecord } from "#pantry/export/package.ts";
import { captureCli, packageCopy } from "#pantry/test/cli.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The report the exporter gives for the package a run stored: `compareWithRecord` of its id, the
 * comparison `roundtrip` prints, read again from the database.
 */
const recordReport = Effect.fn("test.output.db.recordReport")(function* recordReport(
  packageId: string,
) {
  const id = Uuid.parse(packageId);

  return id.ok ? yield* compareWithRecord(id.value) : assert.fail(`${packageId} is not a UUID`);
});

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
          if ("dry_run" in envelope.data) {
            assert.fail("a real import printed the dry-run arm");
          }

          assert.match(
            envelope.data.package_id,
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
          );
        }),
      );

      it.effect(
        "--json roundtrip prints the exporter's report of the stored package, no differing",
        () =>
          // Oracle: the exporter's `compareWithRecord` of the package id the envelope names, read
          // again from the database, and the committed schema of the envelope.
          Effect.gen(function* roundtripJson() {
            const copy = yield* packageCopy(fixtures.simple, "copy-output-json-simple");
            const { exit, stderr, stdout } = yield* captureCli([
              "--json",
              "roundtrip",
              "--yes",
              copy,
            ]);

            assert.isTrue(Exit.isSuccess(exit), stderr);
            assert.strictEqual(stdout.split("\n").length, 1);

            const envelope = Schema.decodeUnknownSync(roundtripEnvelope)(stdout);

            assert.isTrue(envelope.ok);
            if ("dry_run" in envelope.data) {
              assert.fail("a real roundtrip printed the dry-run arm");
            }

            assert.strictEqual(envelope.data.differing, 0);
            assert.deepStrictEqual(envelope.data.entries, [
              ...(yield* recordReport(envelope.data.package_id)),
            ]);
          }),
      );

      it.effect("--output jsonl roundtrip prints one object per entry, then the summary", () =>
        Effect.gen(function* roundtripJsonl() {
          const copy = yield* packageCopy(fixtures.simple, "copy-output-jsonl-simple");
          const { exit, stderr, stdout } = yield* captureCli([
            "--output",
            "jsonl",
            "roundtrip",
            "--yes",
            copy,
          ]);

          assert.isTrue(Exit.isSuccess(exit), stderr);

          const lines = stdout.split("\n");
          const summary = Schema.decodeUnknownSync(summaryEnvelope)(lines.at(-1));
          const report = yield* recordReport(summary.data.package_id);

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
