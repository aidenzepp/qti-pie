import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, inject, layer } from "@effect/vitest";
import { Cause, Effect, Exit, Predicate, Schema } from "effect";
import { kindHelp } from "#pantry/cli/errors.ts";
import { ImportData } from "#pantry/cli/import.ts";
import { ErrorObject, successEnvelope } from "#pantry/cli/output.ts";
import { exitCodeOf } from "#pantry/cli/run.ts";
import { captureCli, matchesCommitted, preloadEngine } from "#pantry/test/cli.ts";
import { fileScratchDirectory, makeScratch, scratchEnv } from "#pantry/test/scratch.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The folder the run's home and cluster state live under, `packages/pantry/work/cli-import-*`, the
 * run's own.
 */
const root = fileScratchDirectory("cli-import-");

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
    "refuses a package the codec refuses, naming its rule, as an import refusal that exits 1",
    () =>
      // Oracle: the specification as a checker, the codec's rule (`not-qti3`, spec reading 89): the
      // published PCI sample declares a schema version the roster does not hold. The dry run reaches
      // no law of the database, so the refusal names no law and no source.
      Effect.gen(function* refused() {
        yield* makeScratch(env);

        const { exit, stderr } = yield* captureCli(["import", "--dry-run", fixtures.sample_pci], {
          env,
        });
        const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;

        assert.strictEqual(exitCodeOf(exit), 1);
        assert.strictEqual(
          Predicate.hasProperty(failure, "_tag") ? failure._tag : undefined,
          "ImportRefused",
        );
        assert.strictEqual(
          Predicate.hasProperty(failure, "rule") ? failure.rule : undefined,
          "not-qti3",
        );
        assert.isTrue(
          stderr.startsWith(
            "error[import-refused]: The package was refused under the not-qti3 rule: ",
          ),
          stderr,
        );
        assert.notInclude(stderr, "  source: ");
        assert.isTrue(stderr.endsWith(`  = help: ${kindHelp["import-refused"]}`), stderr);
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "--json prints the codec's refusal as one error object, its rule and no law",
    () =>
      Effect.gen(function* refusedJson() {
        yield* makeScratch(env);

        const { stderr, stdout } = yield* captureCli(
          ["--json", "import", "--dry-run", fixtures.sample_pci],
          { env },
        );
        const error = Schema.decodeUnknownSync(Schema.fromJsonString(ErrorObject))(stderr);

        assert.strictEqual(stdout, "");
        assert.strictEqual(stderr.split("\n").length, 1);
        assert.isTrue(matchesCommitted("error")(stderr), stderr);
        assert.strictEqual(error.kind, "import-refused");
        assert.strictEqual(error.rule, "not-qti3");
        assert.strictEqual(error.command, "import");
        assert.notProperty(error, "laws");
        assert.notProperty(error, "sources");
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

        assert.isTrue(matchesCommitted("import")(stdout), stdout);
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
