import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, inject, layer } from "@effect/vitest";
import { Cause, Effect, Exit, Schema } from "effect";
import { ImportData } from "#qti/cli/import.ts";
import { successEnvelope } from "#qti/cli/output.ts";
import { exitCodeOf } from "#qti/cli/run.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { captureCli, preloadEngine } from "#qti/test/cli.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { makeScratch, scratchEnv } from "#qti/test/scratch.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#qti/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The folder the run's home and cluster state live under, `packages/qti/work/cli-import`. No other
 * test file writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "work", "cli-import");

/**
 * The environment of a run: a scratch home, a cluster state folder that is empty and a port nothing
 * listens on, so any step that needs the database fails with kind `config`.
 */
const env = { GR8DES_PG_PORT: "1", ...scratchEnv(root) } as const;

/**
 * The envelope `--json import` prints.
 */
const importEnvelope = Schema.fromJsonString(successEnvelope("import", ImportData));

/**
 * Loads the engine once, before this file's first test, so no test pays that load inside its own
 * timeout.
 */
beforeAll(() => preloadEngine, engineLoadHookTimeoutMs);

layer(NodeServices.layer, { excludeTestServices: true })("import --dry-run", (it) => {
  it.effect(
    "reads a package and says how many rows it holds, with no database",
    () =>
      Effect.gen(function* previews() {
        yield* makeScratch(env);

        const { exit, stderr, stdout } = yield* captureCli(
          ["import", "--dry-run", fixtures.simple],
          {
            env,
          },
        );

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(stdout.split("\n").length, 1);
        assert.match(stdout, /^would import .+: [1-9]\d* rows in [1-9]\d* relations; /u);
        assert.include(stdout, "the database's own checks did not run");
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "refuses a package a guard refuses, as an import refusal that exits 1",
    () =>
      Effect.gen(function* refused() {
        yield* makeScratch(env);

        const { exit } = yield* captureCli(
          ["import", "--dry-run", yield* materialize("quoted-q")],
          {
            env,
          },
        );

        assert.isTrue(Exit.isFailure(exit));

        const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;

        assert.instanceOf(failure, ImportRefused);
        assert.strictEqual(
          failure instanceof ImportRefused ? failure.rule : undefined,
          "q-punctuation",
        );
        assert.strictEqual(exitCodeOf(exit), 1);
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "--json prints one line, the dry-run arm of the envelope",
    () =>
      Effect.gen(function* json() {
        yield* makeScratch(env);

        const { exit, stderr, stdout } = yield* captureCli(
          ["--json", "import", "--dry-run", fixtures.simple],
          { env },
        );

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(stdout.split("\n").length, 1);

        const envelope = Schema.decodeUnknownSync(importEnvelope)(stdout);

        assert.isTrue(envelope.ok);
        assert.strictEqual(envelope.schema_version, 1);
        assert.isTrue("dry_run" in envelope.data);

        if ("dry_run" in envelope.data) {
          assert.isTrue(envelope.data.dry_run);
          assert.isFalse(envelope.data.database_checked);
          assert.isAbove(envelope.data.rows, 0);
          assert.isAbove(envelope.data.relations, 0);
          assert.strictEqual(envelope.data.package_dir, fixtures.simple);
        }
      }),
    cliProcessTestTimeoutMs,
  );
});
