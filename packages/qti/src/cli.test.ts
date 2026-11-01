import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit, Stdio } from "effect";
import { Command } from "effect/cli";
import { cli } from "#qti/cli.ts";

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
});
