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
const run = Effect.fn("cli.packaging.test.run")(function* run(args: readonly string[]) {
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

layer(NodeServices.layer, { excludeTestServices: true })(
  "cli.ts zip target, database-free",
  (it) => {
    for (const command of ["export", "roundtrip"]) {
      it.effect(`${command} --help names the --zip flag`, () =>
        Effect.gen(function* helpNamesZip() {
          const { output } = yield* run([command, "--help"]);

          assert.include(output, "--zip");
        }),
      );
    }

    it.effect("import --help says it reads a directory or a .zip", () =>
      Effect.gen(function* importHelp() {
        const { output } = yield* run(["import", "--help"]);

        assert.include(output, ".zip");
      }),
    );

    it.effect(
      "import of a .zip that does not exist fails naming the path, before any database",
      () =>
        Effect.gen(function* importMissingZip() {
          const { exit, output } = yield* run(["import", "/nonexistent/package.zip"]);

          assert.isTrue(Exit.isFailure(exit));
          assert.include(
            Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "",
            "/nonexistent/package.zip is not a directory or a .zip file",
          );
          assert.notInclude(output, "USAGE");
        }),
    );

    it.effect("roundtrip --zip of a missing .zip fails naming the path", () =>
      Effect.gen(function* roundtripMissingZip() {
        const { exit } = yield* run(["roundtrip", "/nonexistent/package.zip", "--zip"]);

        assert.isTrue(Exit.isFailure(exit));
        assert.include(
          Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "",
          "/nonexistent/package.zip is not a directory or a .zip file",
        );
      }),
    );
  },
);
