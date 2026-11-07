import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Cause, Deferred, Effect, Exit, Fiber, FileSystem } from "effect";
import { BadPackageId, replaceWith, TargetNotEmpty } from "#pantry/cli/args.ts";
import { describeFailure } from "#pantry/cli/errors.ts";
import { exitCodeOf } from "#pantry/cli/run.ts";
import { captureCli, preloadEngine } from "#pantry/test/cli.ts";
import { fileScratchDirectory, makeScratch, scratchEnv } from "#pantry/test/scratch.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The folder every case here works under, `packages/pantry/work/cli-export-*`, the run's own, so
 * two runs at once never empty each other's folders.
 */
const root = fileScratchDirectory("cli-export-");

/**
 * An id no package has.
 */
const packageId = "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40";

/**
 * The environment of a run: a scratch home and a cluster state folder that is empty, so any step
 * that needs the database fails with kind `config`.
 */
const env = scratchEnv(root);

/**
 * Make `work/cli-export/<name>` an empty folder and return its path.
 */
const fresh = Effect.fn("test.export.fresh")(function* fresh(name: string) {
  const fs = yield* FileSystem.FileSystem;
  const folder = path.join(root, name);

  yield* fs.remove(folder, { force: true, recursive: true });
  yield* fs.makeDirectory(folder, { recursive: true });
  yield* makeScratch(env);

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

/**
 * Loads the engine once, before this file's first test, so no test pays that load inside its own
 * timeout.
 */
beforeAll(() => preloadEngine, engineLoadHookTimeoutMs);

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
    cliProcessTestTimeoutMs,
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
    cliProcessTestTimeoutMs,
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

  it.effect("(5b) a dangling symlink, and a symlink to an empty folder, need --yes and stay", () =>
    Effect.gen(function* linkedEmpty() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("five-b");
      const empty = path.join(dir, "empty");
      const dangling = path.join(dir, "dangling");
      const toEmpty = path.join(dir, "to-empty");

      yield* fs.makeDirectory(empty);
      yield* fs.symlink(path.join(dir, "absent"), dangling);
      yield* fs.symlink(empty, toEmpty);

      for (const link of [dangling, toEmpty]) {
        const { exit } = yield* captureCli(["export", link, packageId], { env });

        assert.instanceOf(failureOf(exit), TargetNotEmpty, link);
        assert.strictEqual((yield* fs.lstat(link)).type, "SymbolicLink", link);
      }
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

  it.effect(
    "(decision 130) --yes still refuses the current folder, its parent, the home folder and /",
    () =>
      Effect.gen(function* never() {
        const dir = yield* fresh("seven");

        yield* put(env.HOME, "a.txt");
        yield* put(dir, "a.txt");

        for (const target of [".", "..", env.HOME, "/"]) {
          const { exit } = yield* captureCli(["export", "--yes", target, packageId], { env });
          const failure = failureOf(exit);

          assert.strictEqual(describeFailure(failure).kind, "cli-bad-argument", target);
          assert.strictEqual(exitCodeOf(exit), 2, target);
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

  it.effect("(7b) an interrupted write leaves the target as it was and no sibling", () =>
    Effect.gen(function* interrupted() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("seven-b");
      const target = path.join(dir, "out");
      const started = yield* Deferred.make<string>();

      yield* fs.makeDirectory(target);
      yield* put(target, "a.txt");

      const fiber = yield* Effect.forkChild(
        replaceWith(target, (staged) =>
          Effect.gen(function* hang() {
            yield* fs.makeDirectory(staged);
            yield* fs.writeFileString(path.join(staged, wrote), "new");
            yield* Deferred.succeed(started, "written");
            yield* Effect.never;
          }),
        ),
      );

      yield* Deferred.await(started);
      yield* Fiber.interrupt(fiber);

      assert.deepStrictEqual(yield* fs.readDirectory(target), ["a.txt"]);
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );

  it.effect("(7c) a write that dies leaves the target as it was and no sibling", () =>
    Effect.gen(function* died() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("seven-c");
      const target = path.join(dir, "out");

      yield* fs.makeDirectory(target);
      yield* put(target, "a.txt");

      const exit = yield* Effect.exit(
        replaceWith(target, (staged) =>
          Effect.gen(function* explode() {
            yield* fs.makeDirectory(staged);
            yield* Effect.die("defect");
          }),
        ),
      );

      assert.isTrue(Exit.isFailure(exit) && Cause.hasDies(exit.cause));
      assert.deepStrictEqual(yield* fs.readDirectory(target), ["a.txt"]);
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );

  it.effect("(C3) a relative target is resolved first, and the write lands at the target", () =>
    Effect.gen(function* relative() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("relative");
      const target = path.join(dir, "out");

      yield* fs.makeDirectory(target);
      yield* put(target, "a.txt");
      yield* replaceWith(path.relative(process.cwd(), target), writing(false));

      assert.deepStrictEqual(yield* fs.readDirectory(target), [wrote]);
      assert.deepStrictEqual(yield* siblingsIn(dir), []);
    }),
  );

  it.effect("(staging) an entry at the old predictable sibling name is never followed", () =>
    Effect.gen(function* staged() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* fresh("staging");
      const decoy = path.join(dir, "decoy");
      const target = path.join(dir, "out");
      const old = path.join(dir, `.out.qti-${process.pid}`);

      yield* fs.makeDirectory(decoy);

      const file = yield* put(decoy, "a.txt");

      yield* fs.symlink(decoy, old);
      yield* put(dir, "out");

      for (const fails of [true, false]) {
        yield* Effect.exit(replaceWith(target, writing(fails)));

        assert.strictEqual((yield* fs.lstat(old)).type, "SymbolicLink");
        assert.deepStrictEqual(yield* fs.readDirectory(decoy), ["a.txt"]);
        assert.strictEqual(yield* fs.readFileString(file), "kept");
      }

      assert.deepStrictEqual(yield* fs.readDirectory(target), [wrote]);
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
