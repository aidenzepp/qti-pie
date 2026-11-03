import path from "node:path";
import { Console, Effect, FileSystem, Stdio, Stream } from "effect";
import type { Exit } from "effect";
import { Command } from "effect/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { cli } from "#qti/cli.ts";

/**
 * The package folder, `packages/qti`: where the program runs by default and where `work/` is.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * The folder that holds every copy `packageCopy` makes.
 */
const copiesRoot = path.join(packageRoot, "work", "cli-copies");

/**
 * Run the command line on `args` in this process, with the console captured in place of the
 * terminal.
 *
 * @param args - The command line after the program name.
 * @returns How the run ended, and what it wrote with `Console.log` (standard output) and with
 *   `Console.error` (standard error), each joined by line feeds.
 */
export const captureCli = Effect.fn("test.cli.captureCli")(function* captureCli(
  args: readonly string[],
) {
  const out: string[] = [];
  const err: string[] = [];
  const exit: Exit.Exit<unknown, unknown> = yield* Command.run(cli, { version: "0.0.0" }).pipe(
    Effect.provide(Stdio.layerTest({ args: Effect.succeed(args) })),
    Effect.provideService(
      Console.Console,
      Object.assign(Object.create(console), {
        error: (...parts: readonly unknown[]): void => {
          err.push(parts.join(" "));
        },
        log: (...parts: readonly unknown[]): void => {
          out.push(parts.join(" "));
        },
      }),
    ),
    Effect.exit,
  );

  return { exit, stderr: err.join("\n"), stdout: out.join("\n") };
});

/**
 * Run the program as a child process, as a person's shell would, and collect how it ended.
 *
 * @param args - The command line after the program name.
 * @param options - The folder to run in, which must exist (default `packages/qti`), and variables
 *   laid over a copy of this process's environment.
 * @returns The exit code, and what the child wrote to standard output and standard error.
 */
export const spawnCli = Effect.fn("test.cli.spawnCli")(function* spawnCli(
  args: readonly string[],
  options?: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> },
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collect() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(
          process.execPath,
          [path.resolve(import.meta.dirname, "..", "cli.ts"), ...args],
          {
            cwd: options?.cwd ?? packageRoot,
            env: { ...process.env, ...options?.env },
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

/**
 * Copy the package folder `source` to `packages/qti/work/cli-copies/<label>`, replacing any earlier
 * copy, so a test that exports or rewrites a package works on a folder of its own.
 *
 * @param source - The package folder to copy.
 * @param label - The copy's name; it starts `copy-` and appears in one test file only.
 * @returns The absolute path of the copy.
 */
export const packageCopy = Effect.fn("test.cli.packageCopy")(function* packageCopy(
  source: string,
  label: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const target = path.join(copiesRoot, label);

  yield* fs.remove(target, { force: true, recursive: true });
  yield* fs.makeDirectory(copiesRoot, { recursive: true });
  yield* fs.copy(source, target);

  return target;
});
