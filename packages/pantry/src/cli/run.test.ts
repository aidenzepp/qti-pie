import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import {
  CommitUnknown,
  CredentialError,
  ExecutionFailure,
  OpenError,
  ReadFailure,
  StaleSnapshot,
  TokenError,
  TransientFailure,
  TransportFailure,
} from "@bjornpagen/grizzle";
import { Cause, Effect, Exit, PlatformError } from "effect";
import { CliError } from "effect/cli";
import { ChildProcessSpawner } from "effect/process";
import {
  cliKind,
  describeFailure,
  grizzleErrorTags,
  kindExitCode,
  kindHelp,
  NotADirectory,
  RoundtripDiffers,
} from "#pantry/cli/errors.ts";
import type { Kind } from "#pantry/cli/errors.ts";
import { exitCodeOf } from "#pantry/cli/run.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { captureCli, spawnCli } from "#pantry/test/cli.ts";
import { cliProcessTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * Grizzle's nine public errors, each with the tag its class declares. The tag is read from the
 * class, so a tag grizzle renames fails the roster test below instead of silently mapping to
 * `internal`.
 */
const grizzleErrors = [
  CommitUnknown,
  CredentialError,
  ExecutionFailure,
  OpenError,
  ReadFailure,
  StaleSnapshot,
  TokenError,
  TransientFailure,
  TransportFailure,
].map((error) => ({ name: error.name, tag: String(error.fields._tag.ast.literal) }));

/**
 * A `PlatformError` of the kind a failed file read raises.
 */
const readFailed = PlatformError.systemError({
  _tag: "NotFound",
  method: "readFile",
  module: "FileSystem",
});

describe("describeFailure and exitCodeOf", () => {
  it("the kinds end with the codes of D3, and not-found is a refusal", () => {
    assert.deepStrictEqual(kindExitCode, {
      "cli-bad-argument": 2,
      "cli-path-missing": 2,
      "cli-usage": 2,
      config: 78,
      database: 1,
      "import-refused": 1,
      internal: 70,
      io: 74,
      "not-found": 1,
      "roundtrip-differs": 1,
      "target-not-empty": 1,
      timeout: 1,
    } satisfies Record<Kind, number>);
  });

  it("an ImportRefused exits 1 as import-refused", () => {
    const refused = new ImportRefused({ detail: "x", rule: "admission" });

    assert.deepStrictEqual(describeFailure(refused), {
      exitCode: 1,
      help: kindHelp["import-refused"],
      kind: "import-refused",
    });
    assert.strictEqual(exitCodeOf(Exit.fail(refused)), 1);
  });

  it("a RoundtripDiffers exits 1 and a NotADirectory exits 2, each by its own kind", () => {
    const differs = new RoundtripDiffers({ differing: 1, exportDir: "/out" });
    const missing = new NotADirectory({ path: "/nonexistent" });

    assert.strictEqual(describeFailure(differs).kind, "roundtrip-differs");
    assert.strictEqual(exitCodeOf(Exit.fail(differs)), 1);
    assert.strictEqual(describeFailure(missing).kind, "cli-path-missing");
    assert.strictEqual(exitCodeOf(Exit.fail(missing)), 2);
  });

  it("a PlatformError exits 74 as io", () => {
    assert.deepStrictEqual(describeFailure(readFailed), {
      exitCode: 74,
      help: kindHelp.io,
      kind: "io",
    });
    assert.strictEqual(exitCodeOf(Exit.fail(readFailed)), 74);
  });

  it("an Effect CLI error exits 2 as cli-usage", () => {
    const usage = new CliError.UnknownSubcommand({
      subcommand: "frobnicate",
      suggestions: [],
    });

    assert.deepStrictEqual(describeFailure(usage), {
      exitCode: 2,
      help: kindHelp["cli-usage"],
      kind: "cli-usage",
    });
    assert.strictEqual(exitCodeOf(Exit.fail(usage)), 2);
  });

  it("a defect exits 70 as internal, whatever it carries", () => {
    assert.strictEqual(exitCodeOf(Exit.die(new Error("x"))), 70);
    assert.strictEqual(exitCodeOf(Exit.die("x")), 70);
    assert.strictEqual(exitCodeOf(Exit.fail("unmapped")), 70);
  });

  it("a bare kind property is not a kind: only the cliKind symbol names one", () => {
    assert.deepStrictEqual(describeFailure({ kind: "config" }), {
      exitCode: 70,
      help: kindHelp.internal,
      kind: "internal",
    });
    assert.deepStrictEqual(describeFailure({ [cliKind]: "config" }), {
      exitCode: 78,
      help: kindHelp.config,
      kind: "config",
    });
    assert.strictEqual(describeFailure({ [cliKind]: "no-such-kind" }).kind, "internal");
  });

  it("an interrupt exits 130 and a success 0", () => {
    assert.strictEqual(exitCodeOf(Exit.interrupt(1)), 130);
    assert.strictEqual(exitCodeOf(Exit.succeed("done")), 0);
    assert.isTrue(Cause.hasInterruptsOnly(Cause.interrupt(1)));
  });

  it("the roster names the nine tags grizzle's classes declare", () => {
    assert.deepStrictEqual(
      grizzleErrors.map((error) => error.tag).toSorted((a, b) => a.localeCompare(b)),
      [...grizzleErrorTags].toSorted((a, b) => a.localeCompare(b)),
    );
    for (const error of grizzleErrors) {
      assert.strictEqual(error.tag, error.name);
    }
  });

  for (const error of grizzleErrors) {
    it(`${error.name} exits 1 as database`, () => {
      const failure = { _tag: error.tag };

      assert.deepStrictEqual(describeFailure(failure), {
        exitCode: 1,
        help: kindHelp.database,
        kind: "database",
      });
      assert.strictEqual(exitCodeOf(Exit.fail(failure)), 1);
    });
  }
});

layer(NodeServices.layer, { excludeTestServices: true })("the run's exit code", (live) => {
  live.effect("a mistyped command, a missing argument and a missing path exit 2", () =>
    Effect.gen(function* codes() {
      for (const args of [["frobnicate"], ["export", "only-one"], ["import", "/nonexistent"]]) {
        const { exit } = yield* captureCli(args);

        assert.isTrue(Exit.isFailure(exit), args.join(" "));
        assert.strictEqual(exitCodeOf(exit), 2, args.join(" "));
      }
    }),
  );

  live.effect("bare qti, with or without --json, exits 0 with its help on stdout alone", () =>
    Effect.gen(function* bare() {
      for (const args of [[], ["--json"]]) {
        const { exit, stderr, stdout } = yield* captureCli(args);

        assert.strictEqual(exitCodeOf(exit), 0, args.join(" "));
        assert.include(stdout, "EXAMPLES", args.join(" "));
        assert.strictEqual(stderr, "", args.join(" "));
      }
    }),
  );

  live.effect("a real usage error still exits 2 and says so on stderr", () =>
    Effect.gen(function* usage() {
      for (const args of [["--frobnicate"], ["import"]]) {
        const { exit, stderr } = yield* captureCli(args);

        assert.strictEqual(exitCodeOf(exit), 2, args.join(" "));
        assert.isTrue(stderr.startsWith("error[cli-usage]:"), args.join(" "));
      }
    }),
  );

  live.effect("--help lists no kind that no command can raise", () =>
    Effect.gen(function* help() {
      const { stdout } = yield* captureCli(["--help"]);

      assert.notInclude(stdout, "skill-target-outside");
    }),
  );

  live.effect(
    "the process ends with 0 for bare qti, which proves the teardown uses the same code",
    () =>
      Effect.gen(function* spawnedBare() {
        const { code } = yield* spawnCli([]);

        assert.strictEqual(code, ChildProcessSpawner.ExitCode(0));
      }),
    cliProcessTestTimeoutMs,
  );

  live.effect(
    "the process ends with 2 for a mistyped command, which proves the teardown is wired",
    () =>
      Effect.gen(function* spawned() {
        const { code } = yield* spawnCli(["frobnicate"]);

        assert.strictEqual(code, ChildProcessSpawner.ExitCode(2));
      }),
    cliProcessTestTimeoutMs,
  );
});
