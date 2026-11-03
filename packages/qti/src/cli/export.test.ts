import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Effect, Exit, FileSystem } from "effect";
import { BadPackageId, replaceWith, TargetNotEmpty } from "#qti/cli/args.ts";
import { describeFailure } from "#qti/cli/errors.ts";
import { exitCodeOf } from "#qti/cli/run.ts";
import { captureCli } from "#qti/test/cli.ts";

/**
 * The folder every case here works under, `packages/qti/work/cli-export`. No other test file
 * writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "work", "cli-export");

/**
 * The timeout, in milliseconds, for a case that reaches the database step. The first run in a
 * process loads the engine and decodes the migrations snapshot before the cluster config fails;
 * measured at 7.2 s on 2026-11-03 at 224e12e with no database, past vitest's 5 s default.
 */
const configFailureTimeoutMs = 30_000;

/**
 * An id no package has.
 */
const packageId = "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40";

/**
 * The environment of a run: a scratch home and a cluster state folder that is empty, so any step
 * that needs the database fails with kind `config`.
 */
const env = {
  GRIZZLE_PG_STATE: path.join(root, "state"),
  HOME: path.join(root, "home"),
} as const;

/**
 * Make `work/cli-export/<name>` an empty folder and return its path.
 */
const fresh = Effect.fn("test.export.fresh")(function* fresh(name: string) {
  const fs = yield* FileSystem.FileSystem;
  const folder = path.join(root, name);

  yield* fs.remove(folder, { force: true, recursive: true });
  yield* fs.makeDirectory(folder, { recursive: true });
  yield* fs.makeDirectory(env.GRIZZLE_PG_STATE, { recursive: true });
  yield* fs.makeDirectory(env.HOME, { recursive: true });

  return folder;
});

/**
 * Put one file in `folder` and return its path.
 */
const put = Effect.fn("test.export.put")(function* put(folder: string, name: string) {
  const fs = yield* FileSystem.FileSystem;
  const file = path.join(folder, name);

  yield* fs.writeFileString(file, "kept");

  return file;
});

/**
 * The failure a run ended with.
 */
// oxlint-disable-next-line anti-slop/no-unknown-returns -- A squashed cause can be any value; the callers assert its class.
const failureOf = (exit: Exit.Exit<unknown, unknown>): unknown => {
  assert.isTrue(Exit.isFailure(exit));

  return Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;
};

/**
 * The names left in `folder` that start with a dot and carry `qti-`: what `replaceWith` leaves
 * when it forgets a sibling.
 */
const siblingsIn = Effect.fn("test.export.siblingsIn")(function* siblingsIn(folder: string) {
  const fs = yield* FileSystem.FileSystem;

  return (yield* fs.readDirectory(folder)).filter((entry) => /^\..*\.qti-/u.test(entry));
});

layer(NodeServices.layer, { excludeTestServices: true })("export's target guard", (it) => {
  it.effect("(1) a folder holding a file needs --yes, and keeps the file", () =>
    Effect.gen(function* refused() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("one");
      const file = yield* put(dir, "a.txt");
      const { exit } = yield* captureCli(["export", dir, packageId], { env });
      const failure = failureOf(exit);

      assert.instanceOf(failure, TargetNotEmpty);
      assert.strictEqual(describeFailure(failure).kind, "target-not-empty");
      assert.strictEqual(exitCodeOf(exit), 1);
      assert.strictEqual(yield* fs.readFileString(file), "kept");
    }),
  );

  it.effect(
    "(2) with --yes the guard passes, the database step fails and nothing changes",
    () =>
      Effect.gen(function* passes() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* fresh("two");
        const file = yield* put(dir, "a.txt");
        const { exit } = yield* captureCli(["export", "--yes", dir, packageId], { env });

        assert.strictEqual(describeFailure(failureOf(exit)).kind, "config");
        assert.strictEqual(exitCodeOf(exit), 78);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
        assert.deepStrictEqual(yield* siblingsIn(path.dirname(dir)), []);
      }),
    configFailureTimeoutMs,
  );

  it.effect("(3) an id that is not a UUID exits 2, not config", () =>
    Effect.gen(function* badId() {
      const dir = yield* fresh("three");
      const { exit } = yield* captureCli(["export", path.join(dir, "out"), "not-an-id"], { env });

      assert.instanceOf(failureOf(exit), BadPackageId);
      assert.strictEqual(exitCodeOf(exit), 2);
    }),
  );

  it.effect(
    "(4) an absent target passes the guard, fails on config and stays absent",
    () =>
      Effect.gen(function* absent() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* fresh("four");
        const target = path.join(dir, "out");
        const { exit } = yield* captureCli(["export", target, packageId], { env });

        assert.strictEqual(describeFailure(failureOf(exit)).kind, "config");
        assert.isFalse(yield* fs.exists(target));
      }),
    configFailureTimeoutMs,
  );

  it.effect("(5) a symlink to a non-empty folder needs --yes, and the linked folder stays", () =>
    Effect.gen(function* linked() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("five");
      const real = path.join(dir, "real");

      yield* fs.makeDirectory(real);

      const file = yield* put(real, "a.txt");
      const link = path.join(dir, "link");

      yield* fs.symlink(real, link);

      const { exit } = yield* captureCli(["export", link, packageId], { env });

      assert.instanceOf(failureOf(exit), TargetNotEmpty);
      assert.strictEqual(yield* fs.readFileString(file), "kept");
    }),
  );

  it.effect("(6) QTI_ZIP with a file at out.zip and no --yes needs --yes", () =>
    Effect.gen(function* zipped() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("six");
      const file = yield* put(dir, "out.zip");
      const { exit } = yield* captureCli(["export", path.join(dir, "out"), packageId], {
        env: { ...env, QTI_ZIP: "1" },
      });
      const failure = failureOf(exit);

      assert.instanceOf(failure, TargetNotEmpty);
      assert.isTrue(failure instanceof TargetNotEmpty && failure.target.endsWith("out.zip"));
      assert.strictEqual(yield* fs.readFileString(file), "kept");
    }),
  );

  it.effect("(C7) --yes still refuses the current folder, its parent, the home folder and /", () =>
    Effect.gen(function* never() {
      const dir = yield* fresh("seven");

      yield* put(env.HOME, "a.txt");
      yield* put(dir, "a.txt");

      for (const target of [".", "..", env.HOME, "/"]) {
        const { exit } = yield* captureCli(["export", "--yes", target, packageId], { env });
        const failure = failureOf(exit);

        assert.instanceOf(failure, TargetNotEmpty, target);
        assert.isTrue(failure instanceof TargetNotEmpty && failure.protects !== undefined, target);
        assert.strictEqual(exitCodeOf(exit), 1, target);
      }
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("replaceWith", (it) => {
  const wrote = "wrote.txt";

  /**
   * A write that creates a file in the path it is given, then fails when `fails`.
   */
  const writing = (fails: boolean) =>
    Effect.fn("test.export.writing")(function* writeThenMaybeFail(target: string) {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(target, { recursive: true });
      yield* fs.writeFileString(path.join(target, wrote), "new");

      if (fails) {
        yield* Effect.fail("write failed" as const);
      }
    });

  it.effect("(7) a failed write leaves the target as it was and no sibling", () =>
    Effect.gen(function* failed() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("seven-folder");
      const target = path.join(dir, "out");

      yield* fs.makeDirectory(target);

      const file = yield* put(target, "a.txt");
      const exit = yield* Effect.exit(replaceWith(target, writing(true)));

      assert.strictEqual(failureOf(exit), "write failed");
      assert.deepStrictEqual(yield* fs.readDirectory(target), ["a.txt"]);
      assert.strictEqual(yield* fs.readFileString(file), "kept");
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );

  it.effect("(8) a successful write leaves only the written file and no sibling", () =>
    Effect.gen(function* succeeded() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("eight");
      const target = path.join(dir, "out");

      yield* fs.makeDirectory(target);
      yield* put(target, "a.txt");
      yield* replaceWith(target, writing(false));

      assert.deepStrictEqual(yield* fs.readDirectory(target), [wrote]);
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );

  it.effect(
    "(9) on a symlink target, a failed write keeps the link and a good one replaces it",
    () =>
      Effect.gen(function* symlinked() {
        const fs = yield* FileSystem.FileSystem;
        const dir = yield* fresh("nine");
        const real = path.join(dir, "real");
        const link = path.join(dir, "link");

        yield* fs.makeDirectory(real);

        const file = yield* put(real, "a.txt");

        yield* fs.symlink(real, link);

        const exit = yield* Effect.exit(replaceWith(link, writing(true)));

        assert.strictEqual(failureOf(exit), "write failed");
        assert.strictEqual((yield* fs.lstat(link)).type, "SymbolicLink");
        assert.strictEqual(yield* fs.readFileString(file), "kept");
        assert.deepStrictEqual(yield* siblingsIn(dir), []);

        yield* replaceWith(link, writing(false));

        assert.strictEqual((yield* fs.lstat(link)).type, "Directory");
        assert.deepStrictEqual(yield* fs.readDirectory(link), [wrote]);
        assert.deepStrictEqual(yield* fs.readDirectory(real), ["a.txt"]);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
        assert.deepStrictEqual(yield* siblingsIn(dir), []);
      }),
  );

  it.effect("(C8) a .zip target keeps .zip last on the sibling and ends as the new file", () =>
    Effect.gen(function* zipped() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("zip");
      const target = path.join(dir, "out.zip");
      const seen: string[] = [];

      yield* put(dir, "out.zip");
      yield* replaceWith(target, (sibling) =>
        Effect.gen(function* record() {
          seen.push(sibling);
          yield* fs.writeFileString(sibling, "new");
        }),
      );

      assert.isTrue(seen.every((sibling) => sibling.endsWith(".zip") && sibling !== target));
      assert.strictEqual(yield* fs.readFileString(target), "new");
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );
});
