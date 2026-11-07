import path from "node:path";
import type { Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Result, Schema } from "effect";
import { Command } from "effect/cli";
import { inject } from "vitest";
import { RoundtripDiffers } from "#pantry/cli/errors.ts";
import {
  ErrorObject,
  emitSuccess,
  outputGlobalFlags,
  outputMode,
  successEnvelope,
} from "#pantry/cli/output.ts";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";
import { exitCodeOf } from "#pantry/cli/run.ts";
import type { RefusalWitness } from "#pantry/import/refusal.ts";
import { readerOrigin, WitnessKind } from "#pantry/package/refusal-origin.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";
import { captureCli, matchesCommitted, preloadEngine } from "#pantry/test/cli.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";

const fixtures = inject("fixtures");

/**
 * The scratch folders of this file, under `work/cli-present-*`, the run's own.
 */
const scratch = fileScratchDirectory("cli-present-");

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

/**
 * Whether a printed line, parsed as JSON, matches the committed schema of the error object,
 * `schema/error.json`.
 */
const matchesCommittedError = matchesCommitted("error");

/**
 * The one law of the table this file's refusals name, with a law the table does not hold beside it:
 * AL1's admission check, and a check of no law.
 */
const refusedLaws = (checkName: string): readonly [Law, Law] => [
  { kind: "check", name: checkName, relation: "Attribute" },
  { kind: "check", name: "not_a_law", relation: "Node" },
];

/**
 * A command named `import` that fails as the database refuses a package: with the refusal
 * `refusalOfLaws` builds from AL1's admission check and a check of no law, under an unreported
 * witness, as the importer builds it when it passes no locator.
 */
const refusing = Command.make(
  "import",
  {},
  Effect.fn("test.present.refusing")(function* refusingHandler() {
    yield* outputMode;

    const { checkNameOf, refusalOfLaws } = yield* Effect.promise(
      () => import("#pantry/import/refusal.ts"),
    );
    const { grammar } = yield* Effect.promise(() => import("#pantry/grammar/install.ts"));
    const [first, second] = refusedLaws(checkNameOf("AL1 admission"));
    const refusal = refusalOfLaws([first, second], { kind: "unreported" }, grammar);

    return yield* Result.isSuccess(refusal)
      ? Effect.fail(refusal.success)
      : Effect.die(refusal.failure);
  }),
).pipe(Command.withGlobalFlags(outputGlobalFlags));

/**
 * A command named `name` that fails with `failure`, or dies with it when `dies`, under the output
 * flags.
 */
const ending = <F>(name: string, failure: () => Promise<F>, dies: boolean) =>
  Command.make(
    name,
    {},
    Effect.fn("test.present.ending")(function* endingHandler() {
      yield* outputMode;

      const value = yield* Effect.promise(failure);

      return yield* dies ? Effect.die(value) : Effect.fail(value);
    }),
  ).pipe(Command.withGlobalFlags(outputGlobalFlags));

layer(NodeServices.layer, { excludeTestServices: true })("a refusal the database gave", (it) => {
  it.effect("prints its rule, its explanation and each law's source, and where to look", () =>
    // Oracle: the refusal as `refusalOfLaws` builds it; the printed lines carry its message, each of
    // its sources once, and the help `describeFailure` gives a refusal that carries laws.
    Effect.gen(function* text() {
      const { exit, stderr, stdout } = yield* captureCli([], { command: refusing });
      const { source } = lawTable["AL1 admission"];

      assert.strictEqual(stdout, "");
      assert.strictEqual(exitCodeOf(exit), 1);
      assert.isTrue(
        stderr.startsWith(
          "error[import-refused]: The package was refused under the attribute-admission rule: ",
        ),
        stderr,
      );
      assert.include(stderr, "the database names no row");
      assert.include(stderr, "check not_a_law, which no rule of the law table owns");
      assert.strictEqual(
        stderr.split("\n").filter((line) => line === `  source: ${source}`).length,
        1,
      );
      assert.match(
        stderr,
        /\n {2}= help: The database names no row for this law, so find what the law describes in the package by the law's source, .*Nothing was written\.$/u,
      );
    }),
  );

  it.effect("under --json prints one error object with the rule, each law and its sources", () =>
    // Oracle: the law table, read directly by the name each law was built from: its identity as
    // grizzle names a check, and the name and rule the table gives it; a check of no law has its
    // identity alone. The witness kind the refusal was built under, and the committed schema of
    // the error object.
    Effect.gen(function* json() {
      const { checkNameOf } = yield* Effect.promise(() => import("#pantry/import/refusal.ts"));
      const { stderr, stdout } = yield* captureCli(["--json"], { command: refusing });
      const error = errorLine(stderr);

      assert.strictEqual(stdout, "");
      assert.strictEqual(stderr.split("\n").length, 1);
      assert.isTrue(matchesCommittedError(stderr), stderr);
      assert.strictEqual(error.kind, "import-refused");
      assert.strictEqual(error.command, "import");
      assert.strictEqual(error.rule, "attribute-admission");
      assert.deepStrictEqual(error.laws, [
        {
          identity: `check ${checkNameOf("AL1 admission")}`,
          name: "AL1 admission",
          rule: "attribute-admission",
        },
        { identity: "check not_a_law" },
      ]);
      assert.deepStrictEqual(error.sources, [lawTable["AL1 admission"].source]);
      assert.strictEqual(error.witness, "unreported");
      assert.notProperty(error, "failure");
    }),
  );

  it.effect(
    "under --json a refusal of any one law of the table names that law, its rule and its source",
    () =>
      // Oracle: the law table, read directly by the name the refusal's one check was built from:
      // the rule and the source the table gives that name. And the committed schema of the error
      // object. Bound: every law of the table (`lawNames`), each the one law of a refusal under an
      // unreported witness, exhausted; residual none.
      Effect.gen(function* everyLaw() {
        const { checkNameOf, lawNames, refusalOfLaws } = yield* Effect.promise(
          () => import("#pantry/import/refusal.ts"),
        );
        const { grammar } = yield* Effect.promise(() => import("#pantry/grammar/install.ts"));

        assert.isAbove(lawNames.length, 0);
        for (const name of lawNames) {
          const law: Law = { kind: "check", name: checkNameOf(name), relation: "Node" };
          const refusal = refusalOfLaws([law], { kind: "unreported" }, grammar);

          if (Result.isFailure(refusal)) {
            assert.fail(`${name}: no rule owns its own check`);
          }

          const { rule, source } = lawTable[name];
          const { exit, stderr } = yield* captureCli(["--json"], {
            command: ending("import", () => Promise.resolve(refusal.success), false),
          });
          const error = errorLine(stderr);

          assert.strictEqual(exitCodeOf(exit), 1, name);
          assert.isTrue(matchesCommittedError(stderr), `${name}: ${stderr}`);
          assert.deepStrictEqual(
            { kind: error.kind, laws: error.laws, rule: error.rule, sources: error.sources },
            {
              kind: "import-refused",
              laws: [{ identity: `check ${checkNameOf(name)}`, name, rule }],
              rule,
              sources: [source],
            },
            name,
          );
        }
      }),
  );
});

/**
 * A witness of each kind a database refusal names its row by, as the importer passes it: grizzle's
 * key witness, a located row, and none. A kind `WitnessKind` adds fails to compile here.
 */
const witnessesByKind = {
  key: { kind: "key", relation: "Attribute", values: { local: "href", node: "n-1" } },
  row: { kind: "row", relation: "Node", values: { node: "n-2" } },
  unreported: { kind: "unreported" },
} as const satisfies {
  readonly [Kind in typeof WitnessKind.Type]: RefusalWitness & { readonly kind: Kind };
};

/**
 * Where each origin's help sends the person: the reader's to the message, a named row's to that
 * row, an unreported witness's to the law's source.
 */
const helpByOrigin = {
  Reader: "Fix the package as the message says, then import it again.",
  key: "at the row the message names",
  row: "at the row the message names",
  unreported: "The database names no row for this law, so find what the law describes",
} as const satisfies Readonly<Record<"Reader" | typeof WitnessKind.Type, string>>;

layer(NodeServices.layer, { excludeTestServices: true })("every origin of a refusal", (it) => {
  it.effect(
    "prints the laws, their sources and the witness exactly when the database refused, and its origin's help",
    () =>
      // Oracle: the origin each refusal is built from, and the law table read directly by the name
      // its one check was built from: a refusal the reader made prints no law, no source and no
      // witness in either mode; one the database made prints its law with the table's name and rule,
      // the table's source once, and the kind of the witness it was built under. The help is the
      // origin's, by its own words. Bound: the reader's origin and the database's under each kind of
      // `WitnessKind`, exhausted, each in text and JSON; residual none.
      Effect.gen(function* everyOrigin() {
        const { checkNameOf, ImportRefused, refusalOfLaws } = yield* Effect.promise(
          () => import("#pantry/import/refusal.ts"),
        );
        const { grammar } = yield* Effect.promise(() => import("#pantry/grammar/install.ts"));
        const { rule, source } = lawTable["AL1 admission"];
        const law: Law = { kind: "check", name: checkNameOf("AL1 admission"), relation: "Node" };
        const reader = new ImportRefused({
          detail: "The zip entry a.xml was refused",
          origin: readerOrigin,
          rule: "zip-format",
        });
        const origins = [
          { expected: {}, help: helpByOrigin.Reader, printed: [], refusal: reader },
          ...WitnessKind.literals.map((witness) => {
            const built = refusalOfLaws([law], witnessesByKind[witness], grammar);

            if (Result.isFailure(built)) {
              return assert.fail(`${witness}: no rule owns AL1's own check`);
            }

            return {
              expected: {
                laws: [
                  {
                    identity: `check ${checkNameOf("AL1 admission")}`,
                    name: "AL1 admission",
                    rule,
                  },
                ],
                sources: [source],
                witness,
              },
              help: helpByOrigin[witness],
              printed: [source],
              refusal: built.success,
            };
          }),
        ];

        assert.strictEqual(origins.length, 1 + WitnessKind.literals.length);
        for (const { expected, help, printed, refusal } of origins) {
          const label = refusal.origin._tag === "Database" ? refusal.origin.witness : "Reader";
          const command = ending("import", () => Promise.resolve(refusal), false);
          const json = yield* captureCli(["--json"], { command });
          const text = yield* captureCli([], { command });
          const error = errorLine(json.stderr);
          const { laws, sources, witness } = error;

          assert.strictEqual(exitCodeOf(json.exit), 1, label);
          assert.strictEqual(exitCodeOf(text.exit), 1, label);
          assert.isTrue(matchesCommittedError(json.stderr), `${label}: ${json.stderr}`);
          assert.strictEqual(error.kind, "import-refused", label);
          assert.strictEqual(error.rule, refusal.rule, label);
          assert.deepStrictEqual(
            Object.fromEntries(
              Object.entries({ laws, sources, witness }).filter(([, value]) => value !== undefined),
            ),
            expected,
            label,
          );
          assert.include(error.help, help, label);
          assert.include(text.stderr, `= help: ${error.help}`, label);
          assert.deepStrictEqual(
            text.stderr.split("\n").filter((line) => line.startsWith("  source: ")),
            printed.map((stated) => `  source: ${stated}`),
            label,
          );
        }
      }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("a failure qti names", (it) => {
  it.effect(
    "an export that cannot rebuild a stored document prints its own message, its tag and a help that keeps the target",
    () =>
      Effect.gen(function* rowCount() {
        const failing = ending(
          "export",
          () =>
            import("#pantry/export/pages.ts").then(
              ({ DocumentRowCount }) =>
                new DocumentRowCount({
                  document: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
                  found: 2,
                }),
            ),
          false,
        );
        const text = yield* captureCli([], { command: failing });
        const json = yield* captureCli(["--json"], { command: failing });
        const error = errorLine(json.stderr);

        assert.strictEqual(exitCodeOf(text.exit), 70);
        assert.isTrue(
          text.stderr.startsWith(
            "error[internal]: The scan of document 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40 held 2 Document rows",
          ),
          text.stderr,
        );
        assert.include(text.stderr, "\n  failure: DocumentRowCount\n");
        assert.include(text.stderr, "the target is as it was");
        assert.isTrue(matchesCommittedError(json.stderr), json.stderr);
        assert.strictEqual(error.failure, "DocumentRowCount");
        assert.strictEqual(error.kind, "internal");
        assert.strictEqual(error.exit_code, 70);
      }),
  );

  it.effect("crust's EncodeError, which carries no message, is told by its fields", () =>
    // Oracle: the error's own fields, spelled as Unicode spells a code point. Bound: every construct
    // crust's encoder names, each at a code point below and above U+FFFF; residual none.
    Effect.gen(function* encode() {
      const { EncodeError } = yield* Effect.promise(() => import("@qti-pie/crust/errors.ts"));
      const constructs = ["doctype", "name", "comment", "pi", "text", "attribute"] as const;
      const points = [
        { codePoint: 0x1_f6_00, spelled: "U+1F600", threshold: 0xff, under: "U+00FF" },
        { codePoint: 0x1_00, spelled: "U+0100", threshold: 0x7f, under: "U+007F" },
      ];

      for (const where of constructs) {
        for (const { codePoint, spelled, threshold, under } of points) {
          const failing = ending(
            "export",
            () => Promise.resolve(new EncodeError({ codePoint, threshold, where })),
            false,
          );
          const { exit, stderr } = yield* captureCli([], { command: failing });

          assert.strictEqual(exitCodeOf(exit), 70, where);
          assert.isTrue(
            stderr.startsWith(
              `error[internal]: The export cannot write a document's ${where}: it holds ${spelled}, and the document's charset writes code points up to ${under} there.\n  failure: EncodeError\n`,
            ),
            stderr,
          );
        }
      }

      const label = ending(
        "export",
        () => Promise.resolve(new EncodeError({ codePoint: 0, threshold: 0, where: "label" })),
        false,
      );

      assert.isTrue(
        (yield* captureCli([], { command: label })).stderr.startsWith(
          "error[internal]: The export has no encoder for a document's charset label, so it cannot write the document.\n",
        ),
      );
    }),
  );

  it.effect("a defect the importer names prints its message, its tag, its help and its trace", () =>
    Effect.gen(function* conflict() {
      const dying = ending(
        "import",
        () =>
          import("#pantry/import/overlays/index.ts").then(
            ({ OverlayConflict }) =>
              new OverlayConflict({ first: "a", key: "k", relation: "Choice", second: "b" }),
          ),
        true,
      );
      const text = yield* captureCli([], { command: dying });
      const json = yield* captureCli(["--json"], { command: dying });
      const error = errorLine(json.stderr.split("\n")[0] ?? "");

      assert.strictEqual(exitCodeOf(text.exit), 70);
      assert.isTrue(
        text.stderr.startsWith(
          "error[internal]: Two builders give Choice two different rows at the key k: a and b.",
        ),
        text.stderr,
      );
      assert.include(text.stderr, "\n  failure: OverlayConflict\n");
      assert.include(
        text.stderr,
        "= help: This is a defect in qti, not in the package, and nothing was written.",
      );
      assert.include(text.stderr.split("= help:")[1] ?? "", "OverlayConflict");
      assert.isTrue(matchesCommittedError(json.stderr), json.stderr);
      assert.strictEqual(error.failure, "OverlayConflict");
      assert.strictEqual(error.exit_code, 70);
    }),
  );

  it.effect("any other defect prints as an unexpected failure, with its trace, and no tag", () =>
    Effect.gen(function* unnamed() {
      const dying = ending("export", () => Promise.resolve(new Error("boom")), true);
      const text = yield* captureCli([], { command: dying });
      const json = yield* captureCli(["--json"], { command: dying });
      const error = errorLine(json.stderr);

      assert.strictEqual(exitCodeOf(text.exit), 70);
      assert.isTrue(
        text.stderr.startsWith("error[internal]: an unexpected failure ended the run.\n  = help:"),
        text.stderr,
      );
      assert.include(text.stderr, "boom");
      assert.strictEqual(error.message, "an unexpected failure ended the run: boom");
      assert.notProperty(error, "failure");
    }),
  );
});
