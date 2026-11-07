import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit, Schema, Stdio } from "effect";
import { Command } from "effect/cli";
import { describe, inject } from "vitest";
import { cli } from "#pantry/cli.ts";
import { ErrorObject } from "#pantry/cli/output.ts";
import { captureCli } from "#pantry/test/cli.ts";
import { hasLease } from "#pantry/test/settings.ts";

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

describe.skipIf(!hasLease)("cli.roundtrip.test.ts, on the lease", () => {
  layer(NodeServices.layer, { excludeTestServices: true, timeout: "120 seconds" })(
    "cli.ts roundtrip on the lease",
    (it) => {
      it.effect(
        "roundtrip of simple lists every entry equal and ends all equal",
        () =>
          // Oracle: `simple`'s own bytes. Its two XML entries end their lines in CR LF, which XML's
          // end-of-line handling reads as LF and the export writes as LF, so their bytes differ and
          // their canonical forms agree; its image is written back as read.
          Effect.gen(function* roundtripSimple() {
            const { exit, output } = yield* run(["roundtrip", "--yes", fixtures.simple]);

            assert.isTrue(
              Exit.isSuccess(exit),
              Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "",
            );
            assert.include(output, "imsmanifest.xml: canonical-equal");
            assert.include(output, "choice.xml: canonical-equal");
            assert.include(output, "images/sign.png: byte-identical");
            assert.strictEqual(output.split("\n").at(-1), "all equal");
          }),
        TEST_TIMEOUT,
      );

      it.effect(
        "import of metaData is refused by the database, naming its rule, each law and its sources",
        () =>
          // Oracle: the verdict file's rule family for metaData (`lom-`, O6's metadata laws), which
          // the database states, so the refusal carries laws and sources.
          Effect.gen(function* importRefused() {
            const { exit, stderr } = yield* captureCli(["--json", "import", fixtures.metaData]);
            const error = Schema.decodeUnknownSync(Schema.fromJsonString(ErrorObject))(stderr);

            assert.isTrue(Exit.isFailure(exit));
            assert.strictEqual(error.kind, "import-refused");
            assert.match(error.rule ?? "", /^lom-/u);
            assert.isAbove(error.laws?.length ?? 0, 0, stderr);
            assert.isTrue(
              (error.laws ?? []).some((law) => law.rule === error.rule),
              `one of the laws keeps the rule ${error.rule ?? ""}: ${stderr}`,
            );
            assert.isAbove(error.sources?.length ?? 0, 0, stderr);
          }),
        TEST_TIMEOUT,
      );
    },
  );
});
