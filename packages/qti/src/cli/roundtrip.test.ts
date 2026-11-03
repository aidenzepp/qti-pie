import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer, inject } from "@effect/vitest";
import { Cause, Effect, Exit, FileSystem } from "effect";
import { TargetNotEmpty } from "#qti/cli/args.ts";
import { describeFailure } from "#qti/cli/errors.ts";
import { exitCodeOf } from "#qti/cli/run.ts";
import { captureCli, packageCopy } from "#qti/test/cli.ts";
import { cliProcessTestTimeoutMs } from "#qti/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The folder the run's home and cluster state live under, `packages/qti/work/cli-roundtrip`. No
 * other test file writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "work", "cli-roundtrip");

/**
 * The environment of a run: a scratch home and a cluster state folder that is empty, so the import
 * fails with kind `config` before it reads the package.
 */
const env = {
  GRIZZLE_PG_STATE: path.join(root, "state"),
  HOME: path.join(root, "home"),
} as const;

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
  yield* fs.makeDirectory(env.GRIZZLE_PG_STATE, { recursive: true });
  yield* fs.makeDirectory(env.HOME, { recursive: true });
  yield* fs.writeFileString(file, "kept");

  return file;
});

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
