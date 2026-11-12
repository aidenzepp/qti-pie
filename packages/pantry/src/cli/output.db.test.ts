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
 * The report the exporter gives for the package a run stored: `compareWithRecord` of its manifest
 * identifier, the comparison `roundtrip` prints, read again from the database.
 */
const recordReport = compareWithRecord;

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
      package: Schema.String,
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
      it.effect(
        "--json import prints one line, the envelope with the manifest identifier, and the same package again is no-change under it",
        () =>
          // Oracle: the contract's identity: a package is keyed by its manifest identifier and an
          // import mints nothing, so a second import of the same bytes names the same package and
          // changes nothing, whatever the first found stored.
          Effect.gen(function* importJson() {
            const first = yield* captureCli(["--json", "import", fixtures.simple]);
            const again = yield* captureCli(["--json", "import", fixtures.simple]);

            assert.isTrue(Exit.isSuccess(first.exit), first.stderr);
            assert.isTrue(Exit.isSuccess(again.exit), again.stderr);
            assert.strictEqual(first.stdout.split("\n").length, 1);

            const stored = Schema.decodeUnknownSync(importEnvelope)(first.stdout);
            const repeated = Schema.decodeUnknownSync(importEnvelope)(again.stdout);

            assert.isTrue(stored.ok);
            assert.strictEqual(stored.schema_version, 1);
            if ("dry_run" in stored.data || "dry_run" in repeated.data) {
              assert.fail("a real import printed the dry-run arm");
            }

            assert.deepStrictEqual(repeated.data, {
              outcome: "no-change",
              package: stored.data.package,
            });
          }),
      );

      it.effect(
        "--json roundtrip prints the exporter's report of the stored package, no differing",
        () =>
          // Oracle: the exporter's `compareWithRecord` of the package the envelope names, read
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
              ...(yield* recordReport(envelope.data.package)),
            ]);
          }),
      );

      it.effect(
        "--output jsonl roundtrip prints one object per entry, then the summary, and its debug log to stderr alone",
        () =>
          Effect.gen(function* roundtripJsonl() {
            const copy = yield* packageCopy(fixtures.simple, "copy-output-jsonl-simple");
            const { exit, stderr, stdout } = yield* captureCli([
              "--log-level",
              "debug",
              "--output",
              "jsonl",
              "roundtrip",
              "--yes",
              copy,
            ]);

            assert.isTrue(Exit.isSuccess(exit), stderr);

            const lines = stdout.split("\n");
            const summary = Schema.decodeUnknownSync(summaryEnvelope)(lines.at(-1));
            const report = yield* recordReport(summary.data.package);

            assert.strictEqual(lines.length, report.length + 1);
            assert.deepStrictEqual(
              lines.slice(0, -1).map((line) => Schema.decodeUnknownSync(entryLine)(line)),
              [...report],
            );
            assert.isTrue(summary.ok);
            assert.strictEqual(summary.data.differing, 0);
            assert.notProperty(summary.data, "entries");
            assert.match(stderr, /DEBUG/u);
          }),
      );
    });
  },
);
