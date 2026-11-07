import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer, inject } from "@effect/vitest";
import { Cause, Effect, Exit, FileSystem, Schema } from "effect";
import { TargetNotEmpty } from "#pantry/cli/args.ts";
import { describeFailure } from "#pantry/cli/errors.ts";
import { successEnvelope } from "#pantry/cli/output.ts";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";
import { exitCodeOf } from "#pantry/cli/run.ts";
import { captureCli, packageCopy, preloadEngine } from "#pantry/test/cli.ts";
import { fileScratchDirectory, makeScratch, scratchEnv } from "#pantry/test/scratch.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The folder the run's home and cluster state live under, `packages/pantry/work/cli-roundtrip-*`,
 * the run's own.
 */
const root = fileScratchDirectory("cli-roundtrip-");

/**
 * The environment of a run: a scratch home and a cluster state folder that is empty, so the import
 * fails with kind `config` before it reads the package.
 */
const env = { GR8DES_PG_PORT: "1", ...scratchEnv(root) } as const;

/**
 * The failure a run ended with.
 */
// oxlint-disable-next-line anti-slop/no-unknown-returns -- A squashed cause can be any value; the callers assert its class.
const failureOf = (exit: Exit.Exit<unknown, unknown>): unknown => {
  assert.isTrue(Exit.isFailure(exit));

  return Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;
};

/**
 * Make `work/export/<label>` hold one file and return that file's path. `roundtrip` writes there,
 * named after the package folder, which `packageCopy` names `<label>`.
 */
const earlierExport = Effect.fn("test.roundtrip.earlierExport")(function* earlierExport(
  label: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const folder = path.resolve("work", "export", label);
  const file = path.join(folder, "earlier.txt");

  yield* fs.remove(folder, { force: true, recursive: true });
  yield* fs.makeDirectory(folder, { recursive: true });
  yield* makeScratch(env);
  yield* fs.writeFileString(file, "kept");

  return file;
});

/**
 * Loads the engine once, before this file's first test, so no test pays that load inside its own
 * timeout.
 */
beforeAll(() => preloadEngine, engineLoadHookTimeoutMs);

layer(NodeServices.layer, { excludeTestServices: true })("roundtrip's target guard", (it) => {
  it.effect(
    "an earlier export needs --yes, is refused before any import and stays",
    () =>
      Effect.gen(function* refused() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-replace-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const file = yield* earlierExport(label);
        const { exit } = yield* captureCli(["roundtrip", copy], { env });
        const failure = failureOf(exit);

        assert.instanceOf(failure, TargetNotEmpty);
        assert.strictEqual(describeFailure(failure).kind, "target-not-empty");
        assert.strictEqual(exitCodeOf(exit), 1);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "with --yes the guard passes, the import fails on config and the earlier export stays",
    () =>
      Effect.gen(function* passes() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-replace-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const file = yield* earlierExport(label);
        const { exit } = yield* captureCli(["roundtrip", "--yes", copy], { env });

        assert.strictEqual(describeFailure(failureOf(exit)).kind, "config");
        assert.strictEqual(exitCodeOf(exit), 78);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
      }),
    cliProcessTestTimeoutMs,
  );
});

/**
 * The envelope `--json roundtrip` prints.
 */
const roundtripEnvelope = Schema.fromJsonString(successEnvelope("roundtrip", RoundtripData));

/**
 * The dry-run arm of `--json roundtrip --dry-run`'s data, failing the test when the data is the
 * other arm.
 */
const dryRunArm = (stdout: string) => {
  const { data } = Schema.decodeUnknownSync(roundtripEnvelope)(stdout);

  if (!("dry_run" in data)) {
    return assert.fail("the data is not the dry-run arm");
  }

  return data;
};

layer(NodeServices.layer, { excludeTestServices: true })("roundtrip --dry-run", (it) => {
  it.effect(
    "previews the import, writes nothing and leaves no export behind",
    () =>
      Effect.gen(function* previews() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-dryrun-simple";
        const copy = yield* packageCopy(fixtures.simple, label);

        yield* fs.remove(path.resolve("work", "export", label), { force: true, recursive: true });
        yield* makeScratch(env);

        const { exit, stderr, stdout } = yield* captureCli(["roundtrip", "--dry-run", copy], {
          env,
        });

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.match(
          stdout,
          /^would import .+: [1-9]\d* rows in [1-9]\d* relations, then create /u,
        );
        assert.include(stdout, "the database's own checks did not run");
        assert.isFalse(yield* fs.exists(path.resolve("work", "export", label)));
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "--json prints the dry-run arm, with export_dir_action create while the export is absent",
    () =>
      Effect.gen(function* json() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-dryrun-json-simple";
        const copy = yield* packageCopy(fixtures.simple, label);

        yield* fs.remove(path.resolve("work", "export", label), { force: true, recursive: true });
        yield* makeScratch(env);

        const { exit, stderr, stdout } = yield* captureCli(
          ["--json", "roundtrip", "--dry-run", copy],
          { env },
        );

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(stdout.split("\n").length, 1);

        const data = dryRunArm(stdout);

        assert.isTrue(data.dry_run);
        assert.isFalse(data.database_checked);
        assert.isAbove(data.rows, 0);
        assert.strictEqual(data.export_dir_action, "create");
        assert.strictEqual(data.export_dir, path.join("work", "export", label));
        assert.isFalse(yield* fs.exists(path.resolve("work", "export", label)));
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "onto an earlier export it refuses without --yes, exactly as the real command does",
    () =>
      Effect.gen(function* refused() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-dryrun-refused-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const file = yield* earlierExport(label);
        const { exit } = yield* captureCli(["roundtrip", "--dry-run", copy], { env });
        const failure = failureOf(exit);

        assert.instanceOf(failure, TargetNotEmpty);
        assert.strictEqual(describeFailure(failure).kind, "target-not-empty");
        assert.strictEqual(exitCodeOf(exit), 1);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "onto an earlier export with --yes it reports replace and leaves the export as it was",
    () =>
      Effect.gen(function* replaces() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-dryrun-replace-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const file = yield* earlierExport(label);
        const { exit, stderr, stdout } = yield* captureCli(
          ["--json", "roundtrip", "--dry-run", "--yes", copy],
          { env },
        );

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(dryRunArm(stdout).export_dir_action, "replace");
        assert.strictEqual(yield* fs.readFileString(file), "kept");
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect(
    "onto an empty export folder it reports replace, with or without --yes, since existence decides",
    () =>
      Effect.gen(function* empty() {
        const fs = yield* FileSystem.FileSystem;
        const label = "copy-dryrun-empty-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const folder = path.resolve("work", "export", label);

        yield* fs.remove(folder, { force: true, recursive: true });
        yield* fs.makeDirectory(folder, { recursive: true });
        yield* makeScratch(env);

        const { exit, stderr, stdout } = yield* captureCli(
          ["--json", "roundtrip", "--dry-run", copy],
          { env },
        );

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(dryRunArm(stdout).export_dir_action, "replace");
        assert.deepStrictEqual(yield* fs.readDirectory(folder), []);
      }),
    cliProcessTestTimeoutMs,
  );
});
