import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit, Stdio, Stream } from "effect";
import { Command } from "effect/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { cli } from "#qti/cli.ts";
import { cliProcessTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * Run the command on `args` with the console captured, in place of writing to the terminal.
 *
 * @param args - The command line after the program name.
 * @returns What the run wrote with `log` and with `error` joined by line feeds, and how it ended.
 */
const run = Effect.fn("cli.test.run")(function* run(args: readonly string[]) {
  const lines: string[] = [];
  const capture = (...parts: readonly unknown[]): void => {
    lines.push(parts.join(" "));
  };
  const exit = yield* Command.run(cli, { version: "0.0.0" }).pipe(
    Effect.provide(Stdio.layerTest({ args: Effect.succeed(args) })),
    Effect.provideService(
      Console.Console,
      Object.assign(Object.create(console), {
        error: capture,
        log: capture,
      }),
    ),
    Effect.exit,
  );

  return { exit, output: lines.join("\n") };
});

/**
 * Every failure of an exit, rendered as the text a person would read.
 */
const failures = (exit: Exit.Exit<unknown, unknown>): string =>
  Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "";

/**
 * Run the CLI as a child process, as a person's shell would, and collect how it ended.
 *
 * @param args - The command line after the program name.
 * @returns The exit code and what the process wrote to standard error and standard output.
 */
const spawnCli = Effect.fn("cli.test.spawnCli")(function* spawnCli(args: readonly string[]) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collect() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(
          process.execPath,
          [path.resolve(import.meta.dirname, "cli.ts"), ...args],
          {
            cwd: path.resolve(import.meta.dirname, ".."),
            stdin: "ignore",
          },
        ),
      );

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );
    }),
  ).pipe(Effect.orDie);
});

layer(NodeServices.layer, { excludeTestServices: true })("cli.ts, database-free", (it) => {
  it.effect("--help lists import, export and roundtrip", () =>
    Effect.gen(function* helpLists() {
      const { output } = yield* run(["--help"]);

      assert.include(output, "import");
      assert.include(output, "export");
      assert.include(output, "roundtrip");
    }),
  );

  it.effect("import of a missing directory fails naming the path, before any database", () =>
    Effect.gen(function* importMissing() {
      const { exit, output } = yield* run(["import", "/nonexistent"]);

      assert.isTrue(Exit.isFailure(exit));
      assert.include(failures(exit), "/nonexistent is not a directory");
      assert.notInclude(output, "USAGE");
    }),
  );

  it.effect("roundtrip of a missing directory fails naming the path", () =>
    Effect.gen(function* roundtripMissing() {
      const { exit } = yield* run(["roundtrip", "/nonexistent"]);

      assert.isTrue(Exit.isFailure(exit));
      assert.include(failures(exit), "/nonexistent is not a directory");
    }),
  );

  it.effect("export without two arguments fails with a usage error", () =>
    Effect.gen(function* exportUsage() {
      const { exit, output } = yield* run(["export", "only-one"]);

      assert.isTrue(Exit.isFailure(exit));
      assert.include(output, "USAGE");
      assert.match(output, /missing|required/iu);
      assert.include(output, "dir");
    }),
  );

  it.effect(
    "the process exits 0 for --help",
    () =>
      Effect.gen(function* helpExit() {
        const { code } = yield* spawnCli(["--help"]);

        assert.strictEqual(code, ChildProcessSpawner.ExitCode(0));
      }),
    cliProcessTestTimeoutMs,
  );

  for (const command of ["import", "roundtrip"]) {
    it.effect(
      `${command} of a missing directory exits 2 with its message once and no stack`,
      () =>
        Effect.gen(function* refusalOnce() {
          const { code, stderr, stdout } = yield* spawnCli([command, "/nonexistent"]);

          assert.notMatch(`${stdout}\n${stderr}`, /^\s+at /mu);
          assert.strictEqual(code, ChildProcessSpawner.ExitCode(2));
          assert.strictEqual(stderr.split("is not a directory").length - 1, 1);
        }),
      cliProcessTestTimeoutMs,
    );
  }
});
