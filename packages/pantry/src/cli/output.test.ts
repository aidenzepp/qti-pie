import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit } from "effect";
import { CliError, Command } from "effect/cli";
import { outputGlobalFlags, outputMode } from "#pantry/cli/output.ts";
import { captureCli } from "#pantry/test/cli.ts";

/**
 * A command that registers the output settings and prints the mode they resolve to.
 */
const probe = Command.make(
  "probe",
  {},
  Effect.fn("test.output.probe")(function* probeHandler() {
    yield* Console.log(yield* outputMode);
  }),
).pipe(Command.withGlobalFlags(outputGlobalFlags));

layer(NodeServices.layer, { excludeTestServices: true })("output settings", (it) => {
  const selects = [
    { args: [], mode: "text" },
    { args: ["--output", "jsonl"], mode: "jsonl" },
    { args: ["--output", "json", "--json"], mode: "json" },
  ] as const;

  for (const { args, mode } of selects) {
    it.effect(`${args.join(" ") || "no flag"} selects ${mode}`, () =>
      Effect.gen(function* selectCase() {
        const { exit, stderr, stdout } = yield* captureCli(args, { command: probe });

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(stdout, mode);
      }),
    );
  }

  const fromEnvironment = [
    { args: [], env: { HOME: "/", QTI_OUTPUT: "json" }, mode: "json" },
    { args: [], env: { HOME: "/", QTI_JSONL: "true" }, mode: "jsonl" },
    { args: ["--output", "text"], env: { HOME: "/", QTI_OUTPUT: "json" }, mode: "text" },
  ] as const;

  for (const { args, env, mode } of fromEnvironment) {
    it.effect(`${args.join(" ") || "no flag"} with ${JSON.stringify(env)} selects ${mode}`, () =>
      Effect.gen(function* environmentCase() {
        const { exit, stderr, stdout } = yield* captureCli(args, { command: probe, env });

        assert.isTrue(Exit.isSuccess(exit), stderr);
        assert.strictEqual(stdout, mode);
      }),
    );
  }

  const disagreements = [["--json", "--jsonl"]] as const;

  for (const args of disagreements) {
    it.effect(`${args.join(" ")} is a usage error`, () =>
      Effect.gen(function* disagreeCase() {
        const { exit, stdout } = yield* captureCli(args, { command: probe });

        assert.isTrue(Exit.isFailure(exit));
        assert.strictEqual(stdout, "");

        if (Exit.isFailure(exit)) {
          assert.isTrue(CliError.isCliError(Cause.squash(exit.cause)));
        }
      }),
    );
  }
});
