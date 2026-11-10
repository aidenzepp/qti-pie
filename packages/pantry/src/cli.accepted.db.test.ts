/**
 * The accepted packages through the command line, on the lease (plan W5, Q5.18): each of the three
 * corpus packages the verdict file accepts, imported, exported and round-tripped by `qti` as a
 * person runs it, under `--json`, and held to the importer's, the exporter's and the committed
 * schemas' account of the same package.
 */
import path from "node:path";
import { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Formatter, Layer, Schema } from "effect";
import { describe } from "vitest";
import { ExportData } from "#pantry/cli/export.ts";
import { ImportData } from "#pantry/cli/import.ts";
import { successEnvelope } from "#pantry/cli/output.ts";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage } from "#pantry/export/compare.ts";
import { compareWithRecord } from "#pantry/export/package.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { readEntries } from "#pantry/package/read.ts";
import { captureCli, matchesCommitted } from "#pantry/test/cli.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The corpus packages the verdict file accepts (`verdicts/qti-examples-0a92fbb.tsv`), each with the
 * directory or zip file it is materialized as.
 */
const accepted = [
  { name: "simple", source: materialize("simple") },
  { name: "sharedMedia", source: materialize("sharedMedia") },
  { name: "svg", source: materializeZip("svg") },
] as const;

/**
 * The folder every case here works under, `packages/pantry/work/cli-accepted`, one folder per
 * package. No other test file writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "work", "cli-accepted");

const importEnvelope = Schema.fromJsonString(successEnvelope("import", ImportData));

const exportEnvelope = Schema.fromJsonString(successEnvelope("export", ExportData));

const roundtripEnvelope = Schema.fromJsonString(successEnvelope("roundtrip", RoundtripData));

/**
 * Parse a package id a run printed, failing the test when it is no UUID.
 */
const idOf = (text: string): Uuid => {
  const id = Uuid.parse(text);

  return id.ok ? id.value : assert.fail(`${text} is not a UUID`);
};

/**
 * Make `work/cli-accepted/<name>/<step>` absent, its folder present, and return its path.
 */
const freshTarget = Effect.fn("test.cli.accepted.freshTarget")(function* freshTarget(
  name: string,
  step: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const target = path.join(root, name, step);

  yield* fs.remove(target, { force: true, recursive: true });
  yield* fs.makeDirectory(path.dirname(target), { recursive: true });

  return target;
});

describe.skipIf(!hasLease)(
  "cli.accepted.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the accepted packages through the command line", (it) => {
      for (const { name, source } of accepted) {
        it.effect(
          `${name}: --json import stores it and prints its id in the committed schema`,
          () =>
            // Oracle: the committed schema of the envelope, and the database, which holds a package
            // at the printed id that the exporter compares with its record, every entry equal.
            Effect.gen(function* imports() {
              const dir = yield* source;
              const { exit, stderr, stdout } = yield* captureCli(["--json", "import", dir]);

              assert.isTrue(Exit.isSuccess(exit), stderr);
              assert.isTrue(matchesCommitted("import")(stdout), stdout);

              const { data, ok } = Schema.decodeUnknownSync(importEnvelope)(stdout);

              assert.isTrue(ok);
              if ("dry_run" in data) {
                assert.fail("a real import printed the dry-run arm");
              }

              const report = yield* compareWithRecord(idOf(data.package_id));

              assert.isFalse(
                report.some(({ outcome }) => outcome.kind === "differs"),
                Formatter.format(report),
              );
            }),
        );

        it.effect(
          `${name}: --json export writes every entry, comparing equal with the package`,
          () =>
            // Oracle: the package as `readEntries` lists it, the files the export left on disk, and
            // `comparePackage` of the package with them, which reads no database.
            Effect.gen(function* exports() {
              const fs = yield* FileSystem.FileSystem;
              const dir = yield* source;
              const id = yield* importDir(dir);
              const target = yield* freshTarget(name, "export");
              const { exit, stderr, stdout } = yield* captureCli(["--json", "export", target, id]);

              assert.isTrue(Exit.isSuccess(exit), stderr);
              assert.isTrue(matchesCommitted("export")(stdout), stdout);

              const { data } = Schema.decodeUnknownSync(exportEnvelope)(stdout);
              const listed = yield* readEntries(dir);

              assert.strictEqual(data.package_id, id);
              assert.deepStrictEqual(
                data.entries.map((entry) => entry.path).toSorted(),
                listed.map((entry) => entry.path).toSorted(),
              );
              for (const entry of data.entries) {
                const { size } = yield* fs.stat(path.join(target, entry.path));

                assert.strictEqual(BigInt(entry.bytes), size, entry.path);
              }

              const report = yield* comparePackage(dir, target);

              assert.isFalse(
                report.some(({ outcome }) => outcome.kind === "differs"),
                Formatter.format(report),
              );
            }),
        );

        it.effect(
          `${name}: --json roundtrip prints the exporter's report, all equal, and exits 0`,
          () =>
            // Oracle: `compareWithRecord` of the id the envelope names, the exporter's own report,
            // and the committed schema of the envelope.
            Effect.gen(function* roundtrips() {
              const dir = yield* source;
              const { exit, stderr, stdout } = yield* captureCli([
                "--json",
                "roundtrip",
                "--yes",
                dir,
              ]);

              assert.isTrue(Exit.isSuccess(exit), stderr);
              assert.isTrue(matchesCommitted("roundtrip")(stdout), stdout);

              const { data, ok } = Schema.decodeUnknownSync(roundtripEnvelope)(stdout);

              assert.isTrue(ok);
              if ("dry_run" in data) {
                assert.fail("a real roundtrip printed the dry-run arm");
              }

              assert.strictEqual(data.differing, 0);
              assert.deepStrictEqual(data.entries, [
                ...(yield* compareWithRecord(idOf(data.package_id))),
              ]);
            }),
        );
      }
    });
  },
);
