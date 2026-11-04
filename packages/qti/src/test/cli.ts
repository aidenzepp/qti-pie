import path from "node:path";
import { ConfigProvider, Console, Effect, FileSystem, Layer, Stdio, Stream } from "effect";
import type { Exit } from "effect";
import type { Command } from "effect/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { cli } from "#qti/cli.ts";
import { runCli } from "#qti/cli/run.ts";

/**
 * The package folder, `packages/qti`: where the program runs by default and where `work/` is.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * The folder that holds every copy `packageCopy` makes.
 */
const copiesRoot = path.join(packageRoot, "work", "cli-copies");

/**
 * Load every engine module a command handler imports when it runs, all at once.
 *
 * A test file pays that load once, in a `beforeAll` under `engineLoadHookTimeoutMs`, instead of
 * inside its first test's timeout. The list must equal this command's output, so a new lazy import
 * gets added here:
 *
 * ```sh
 * cd packages/qti && grep -hoE 'import\("#qti/[^"]+"\)' src/cli.ts $(ls src/cli/*.ts | grep -v '\.test\.ts$') | sort -u
 * ```
 */
export const preloadEngine = Effect.promise(() =>
  Promise.all([
    import("#qti/db/layer.ts"),
    import("#qti/export/compare.ts"),
    import("#qti/export/package.ts"),
    import("#qti/import/package.ts"),
    import("#qti/import/preview.ts"),
    import("#qti/package/read.ts"),
  ]),
);

/**
 * Run the command line on `args` in this process, through the same runner as the program, with the
 * console captured in place of the terminal.
 *
 * @param args - The command line after the program name.
 * @param options - The command to run in place of `cli`, and the environment its settings read.
 *   With `env`, the run reads its configuration from those variables alone, in place of the
 *   process environment, so pass every variable the run needs.
 * @returns How the run ended, and what it wrote with `Console.log` (standard output) and with
 *   `Console.error` (standard error), each joined by line feeds.
 */
export const captureCli = Effect.fn("test.cli.captureCli")(function* captureCli<
  C extends Command.Command.Any = typeof cli,
>(
  args: readonly string[],
  options?: {
    readonly command?: C;
    readonly env?: Readonly<Record<string, string>>;
  },
) {
  const out: string[] = [];
  const err: string[] = [];
  const command: Command.Command.Any = options?.command ?? cli;
  // SAFETY: `runCli` cannot infer a command's services from the `Any` bound, which reads them as
  // the command itself. They are the services of `C`, plus the environment `Command.run` adds.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  const run = runCli(command, { version: "0.0.0" }) as Effect.Effect<
    void,
    unknown,
    Command.Services<C> | Command.Environment
  >;
  const exit: Exit.Exit<unknown, unknown> = yield* run.pipe(
    Effect.provide(Stdio.layerTest({ args: Effect.succeed(args) })),
    Effect.provide(
      options?.env === undefined
        ? Layer.empty
        : ConfigProvider.layer(ConfigProvider.fromUnknown(options.env)),
    ),
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
