import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit, Stdio } from "effect";
import { Command } from "effect/cli";
import { inject } from "vitest";
import { cli } from "#qti/cli.ts";

const fixtures = inject("fixtures");

const TEST_TIMEOUT = 120_000;

/**
 * Run the command on `args` with the console captured, in place of writing to the terminal.
 *
 * @param args - The command line after the program name.
 * @returns What the run wrote with `log` and `error` joined by line feeds, and how it ended.
 */
const run = Effect.fn("cli.roundtrip.test.run")(function* run(args: readonly string[]) {
  const lines: string[] = [];
  const capture = (...parts: readonly unknown[]): void => {
    lines.push(parts.join(" "));
  };
  const exit = yield* Command.run(cli, { version: "0.0.0" }).pipe(
    Effect.provide(Stdio.layerTest({ args: Effect.succeed(args) })),
    Effect.provideService(
      Console.Console,
      Object.assign(Object.create(console), { error: capture, log: capture }),
    ),
    Effect.exit,
  );

  return { exit, output: lines.join("\n") };
});

layer(NodeServices.layer, { excludeTestServices: true, timeout: "120 seconds" })(
  "cli.ts roundtrip on the lease",
  (it) => {
    it.effect(
      "roundtrip of simple lists every entry equal and ends all equal",
      () =>
        Effect.gen(function* roundtripSimple() {
          const { exit, output } = yield* run(["roundtrip", fixtures.simple]);

          assert.isTrue(Exit.isSuccess(exit), Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "");
          assert.include(output, "imsmanifest.xml: canonical-equal");
          assert.include(output, "choice.xml: canonical-equal");
          assert.include(output, "images/sign.png: byte-identical");
          assert.strictEqual(output.split("\n").at(-1), "all equal");
        }),
      TEST_TIMEOUT,
    );

    it.effect(
      "import of metaData fails and names the rule",
      () =>
        Effect.gen(function* importRefused() {
          const { exit } = yield* run(["import", fixtures.metaData]);

          assert.isTrue(Exit.isFailure(exit));
          assert.match(Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "", /lom-/u);
        }),
      TEST_TIMEOUT,
    );
  },
);
