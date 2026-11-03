import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Schema } from "effect";
import { Command } from "effect/cli";
import { inject } from "vitest";
import { RoundtripDiffers } from "#qti/cli/errors.ts";
import {
  ErrorObject,
  emitSuccess,
  outputGlobalFlags,
  outputMode,
  successEnvelope,
} from "#qti/cli/output.ts";
import { RoundtripData } from "#qti/cli/roundtrip.ts";
import { exitCodeOf } from "#qti/cli/run.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#qti/test/settings.ts";
import { captureCli, preloadEngine } from "#qti/test/cli.ts";

const fixtures = inject("fixtures");

/**
 * The scratch folders of this file, under the package's git-ignored `work/`.
 */
const scratch = path.resolve(import.meta.dirname, "..", "..", "work", "cli-present");

/**
 * One line of standard error, decoded as the error object a reader parses.
 */
const errorLine = Schema.decodeUnknownSync(Schema.fromJsonString(ErrorObject));

/**
 * A command named `roundtrip` that reports one differing entry, as the real one does: its envelope
 * on standard output with `ok` false, then the failure.
 */
const differing = Command.make(
  "roundtrip",
  {},
  Effect.fn("test.present.differing")(function* differingHandler() {
    const mode = yield* outputMode;

    yield* emitSuccess(mode, {
      command: "roundtrip",
      data: {
        differing: 1,
        entries: [{ outcome: { at: "item.xml", kind: "differs" }, path: "item.xml" }],
        export_dir: "work/export/x",
        package_id: "p",
      },
      dataSchema: RoundtripData,
      ok: false,
    });
    yield* new RoundtripDiffers({ differing: 1, exportDir: "work/export/x" });
  }),
).pipe(Command.withGlobalFlags(outputGlobalFlags));

/**
 * Loads the engine once, before this file's first test, so no test pays that load inside its own
 * timeout.
 */
beforeAll(() => preloadEngine, engineLoadHookTimeoutMs);

layer(NodeServices.layer, { excludeTestServices: true })("the text error shape", (it) => {
  it.effect("an unknown command prints its usage and the valid commands, not the whole help", () =>
    Effect.gen(function* unknownCommand() {
      const { stderr, stdout } = yield* captureCli(["frobnicate"]);

      assert.isTrue(stderr.startsWith("error[cli-usage]:"));
      assert.include(stderr, "= help:");

      for (const command of ["import", "export", "roundtrip"]) {
        assert.include(stderr, command);
      }

      assert.notInclude(stderr, "GLOBAL FLAGS");
      assert.strictEqual(stdout, "");
    }),
  );

  it.effect("a missing path prints error[cli-path-missing] with the path once", () =>
    Effect.gen(function* missingPath() {
      const { stderr } = yield* captureCli(["import", "/nonexistent"]);

      assert.include(stderr, "error[cli-path-missing]:");
      assert.include(stderr, "= help:");
      assert.strictEqual(stderr.split("/nonexistent").length - 1, 1);
    }),
  );

  it.effect(
    "conflicting output modes (the line says text, the environment json) print the text error shape, exit 2",
    () =>
      Effect.gen(function* conflictText() {
        const { exit, stderr, stdout } = yield* captureCli(["--output", "text", "import", "x"], {
          env: { HOME: "/", QTI_JSON: "true" },
        });

        assert.isTrue(stderr.startsWith("error[cli-usage]:"));
        assert.include(stderr, "= help:");
        assert.strictEqual(stdout, "");
        assert.strictEqual(exitCodeOf(exit), 2);
      }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("the JSON error shape", (it) => {
  it.effect("an unknown command under --json is one error object on stderr", () =>
    Effect.gen(function* unknownJson() {
      const { stderr, stdout } = yield* captureCli(["--json", "frobnicate"]);

      assert.strictEqual(stdout, "");
      assert.strictEqual(stderr.split("\n").length, 1);

      const error = errorLine(stderr);

      assert.strictEqual(error.kind, "cli-usage");
      assert.strictEqual(error.exit_code, 2);
      assert.isFalse(error.ok);
      assert.isTrue(error.error);
    }),
  );

  it.effect("a missing path under --json is cli-path-missing", () =>
    Effect.gen(function* missingJson() {
      const { stderr, stdout } = yield* captureCli(["--json", "import", "/nonexistent"]);

      assert.strictEqual(stdout, "");

      const error = errorLine(stderr);

      assert.strictEqual(error.kind, "cli-path-missing");
      assert.strictEqual(error.exit_code, 2);
      assert.strictEqual(error.command, "import");
    }),
  );

  it.effect("a parse error under --output jsonl is an error object", () =>
    Effect.gen(function* parseJsonl() {
      const { stderr } = yield* captureCli(["--output", "jsonl", "export", "only-one"]);

      assert.strictEqual(stderr.split("\n").length, 1);
      assert.strictEqual(errorLine(stderr).command, "export");
    }),
  );

  it.effect("conflicting output modes under --json are an error object, exit 2", () =>
    Effect.gen(function* conflictJson() {
      const { exit, stderr, stdout } = yield* captureCli(["import", "--json", "--jsonl", "x"]);

      assert.strictEqual(stdout, "");
      assert.strictEqual(errorLine(stderr).kind, "cli-usage");
      assert.strictEqual(exitCodeOf(exit), 2);
    }),
  );

  it.effect(
    "a missing local set-up under --json is config, exit 78",
    () =>
      Effect.gen(function* configJson() {
        const fs = yield* FileSystem.FileSystem;
        const home = path.join(scratch, "home");
        const state = path.join(scratch, "state");

        yield* fs.remove(state, { force: true, recursive: true });
        yield* fs.makeDirectory(home, { recursive: true });
        yield* fs.makeDirectory(state, { recursive: true });

        const { stderr } = yield* captureCli(["--json", "import", fixtures.simple], {
          env: { GRIZZLE_PG_STATE: state, HOME: home },
        });
        const error = errorLine(stderr);

        assert.strictEqual(error.kind, "config");
        assert.strictEqual(error.exit_code, 78);
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect("a differing roundtrip prints its envelope on stdout and the error on stderr", () =>
    Effect.gen(function* differsJson() {
      const { exit, stderr, stdout } = yield* captureCli(["--json"], { command: differing });
      const envelope = Schema.decodeUnknownSync(
        Schema.fromJsonString(successEnvelope("roundtrip", RoundtripData)),
      )(stdout);

      assert.strictEqual(stdout.split("\n").length, 1);
      assert.isFalse(envelope.ok);
      if ("dry_run" in envelope.data) {
        assert.fail("a real roundtrip printed the dry-run arm");
      }

      assert.strictEqual(envelope.data.differing, 1);
      assert.strictEqual(stderr.split("\n").length, 1);
      assert.strictEqual(errorLine(stderr).kind, "roundtrip-differs");
      assert.strictEqual(errorLine(stderr).exit_code, 1);
      assert.isTrue(Exit.isFailure(exit));
      assert.strictEqual(exitCodeOf(exit), 1);
    }),
  );
});
