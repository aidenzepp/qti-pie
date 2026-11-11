import path from "node:path";
import type { Law, Witness } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Cause, Effect, Exit, FileSystem, Formatter, Schema } from "effect";
import { Command } from "effect/cli";
import { inject } from "vitest";
import { TargetNotEmpty } from "#pantry/cli/args.ts";
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
import type { RefusalLaw, RefusalOf } from "#pantry/import/refusal.ts";
import { readerOrigin, RefusedKind, WitnessKind } from "#pantry/package/refusal-origin.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";
import { captureCli, matchesCommitted, packageCopy, preloadEngine } from "#pantry/test/cli.ts";
import { fileScratchDirectory, makeScratch, scratchEnv } from "#pantry/test/scratch.ts";

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

  it.effect(
    "a roundtrip onto an earlier export without --yes is target-not-empty, exit 1, before any import, and the export stays",
    () =>
      // The guard itself, requireReplaceable, is exhausted in cli/target-action.test.ts; this
      // holds roundtrip to calling it before the import, whose settings here reach no database.
      Effect.gen(function* earlierExport() {
        const fs = yield* FileSystem.FileSystem;
        const env = { GR8DES_PG_PORT: "1", ...scratchEnv(scratch) } as const;
        const label = "present-replace-simple";
        const copy = yield* packageCopy(fixtures.simple, label);
        const folder = path.resolve("work", "export", label);
        const file = path.join(folder, "earlier.txt");

        yield* fs.remove(folder, { force: true, recursive: true });
        yield* fs.makeDirectory(folder, { recursive: true });
        yield* makeScratch(env);
        yield* fs.writeFileString(file, "kept");

        const { exit, stderr } = yield* captureCli(["--json", "roundtrip", copy], { env });

        assert.strictEqual(errorLine(stderr).kind, "target-not-empty");
        assert.strictEqual(exitCodeOf(exit), 1);
        assert.isTrue(
          Exit.isFailure(exit) && Cause.squash(exit.cause) instanceof TargetNotEmpty,
          stderr,
        );
        assert.strictEqual(yield* fs.readFileString(file), "kept");
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
 * The installed name the constraint that refuses AL1's check carries in this file's refusals. The
 * importer reads a refused law's installed name off the object that refused it (`by.name`,
 * grizzle's `RefusedLaw`) and compiles nothing, so the name is planted, and a printed `installed`
 * is that name exactly when the refusal carried it through.
 */
const plantedConstraint = "planted_al1_admission_constraint";

/**
 * A check law, as grizzle names one.
 */
type CheckLaw = Extract<Law, { readonly kind: "check" }>;

/**
 * A law the table does not hold: a check of no law, which `Qti` does not state, so it has no
 * installed name.
 */
const unownedLaw = { kind: "check", name: "not_a_law", relation: "Node" } as const satisfies Law;

/**
 * A check as a refusal by a write statement carries it, which names no installed object. A check
 * needs no LawId: the importer names it by its own name.
 *
 * @param law - The check.
 * @returns The refused law.
 */
const refusedByStatement = (law: CheckLaw): RefusalLaw => ({
  by: { kind: "statement" },
  id: "",
  law,
});

/**
 * A check as PostgreSQL's refusal of it carries it, as the login's own law or as a level above
 * states it: refused by its table's constraint, under the {@link plantedConstraint} name.
 *
 * @param law - The check, or a level above's law of it.
 * @returns The refused law.
 */
const refusedByConstraint = (law: Law): RefusalLaw => ({
  by: { kind: "constraint", name: plantedConstraint },
  id: "",
  law,
});

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

/**
 * A witness of each kind a database refusal names its row by: grizzle's key witness, and none. A
 * kind `WitnessKind` adds fails to compile here.
 */
const witnessesByKind = {
  key: { kind: "key", relation: "Attribute", values: { local: "href", node: "n-1" } },
  unreported: { kind: "unreported" },
} as const satisfies {
  readonly [Kind in typeof WitnessKind.Type]: Witness & { readonly kind: Kind };
};

/**
 * Where each origin's help sends the person: the reader's to the message, a named row's to that
 * row, an unreported witness's to the law's source.
 */
const helpByOrigin = {
  Reader: "Fix the package as the message says, then import it again.",
  key: "at the row the message names",
  unreported: "The database names no row for this law, so find what the law describes",
} as const satisfies Readonly<Record<"Reader" | typeof WitnessKind.Type, string>>;

layer(NodeServices.layer, { excludeTestServices: true })("every origin of a refusal", (it) => {
  it.effect(
    "prints the decision, the laws, their sources and the witness exactly when the database refused, and its origin's help",
    () =>
      // Oracle: the origin each refusal is built from, and the law table read directly by the name
      // its one check was built from: a refusal the reader made prints its one rule and no
      // decision, law, source or witness in either mode; one the database made prints how grizzle
      // decided its laws, its laws with the table's name and rule and, for the check `Qti` states,
      // the installed name its refusing constraint carried, the table's source once, and the kind
      // of the witness it was built under. A `some` outcome names two laws, AL1's check and a check of no law, which `Qti` does
      // not state and which has its text alone, as grizzle's `Refused` requires. An `above`
      // outcome names AL1's check first as a level above states it, by the name of the law it
      // wraps, and `above every` the login's own AL1 check after it. The help is
      // the origin's, by its own words. Bound: the reader's origin and the database's under each
      // kind of `RefusedKind` and of `WitnessKind`, exhausted, each in text and JSON; residual
      // none.
      Effect.gen(function* everyOrigin() {
        const { checkNameOf, refusalOf } = yield* Effect.promise(
          () => import("#pantry/import/refusal.ts"),
        );
        const { ImportRefused } = yield* Effect.promise(() => import("#pantry/import/rules.ts"));
        const { rule, source } = lawTable["AL1 admission"];
        const law = {
          kind: "check",
          name: checkNameOf("AL1 admission"),
          relation: "Attribute",
        } as const;
        const lawFact = {
          installed: plantedConstraint,
          name: "AL1 admission",
          rule,
          text: Formatter.format(law),
        };
        const unownedFact = { text: Formatter.format(unownedLaw) };
        const aboveLaw = { kind: "above", law, level: "QtiMedia" } as const;
        const aboveFact = { ...lawFact, text: Formatter.format(aboveLaw) };
        const refusedAbove = refusedByConstraint(aboveLaw);
        const own = refusedByConstraint(law);
        const refusalsByDecision = {
          "above every": {
            facts: [aboveFact, lawFact],
            refused: { kind: "above", laws: [refusedAbove, own], own: "every" },
          },
          "above none": {
            facts: [aboveFact],
            refused: { kind: "above", laws: [refusedAbove], own: "none" },
          },
          "above unjudged": {
            facts: [aboveFact],
            refused: { kind: "above", laws: [refusedAbove], own: "unjudged" },
          },
          every: { facts: [lawFact], refused: { kind: "every", laws: [own] } },
          first: { facts: [lawFact], refused: { kind: "first", laws: [own] } },
          some: {
            facts: [lawFact, unownedFact],
            refused: { kind: "some", laws: [own, refusedByStatement(unownedLaw)] },
          },
        } as const satisfies {
          readonly [Decision in typeof RefusedKind.Type]: {
            readonly facts: readonly unknown[];
            readonly refused: RefusalOf;
          };
        };
        const reader = new ImportRefused({
          detail: "The zip entry a.xml was refused",
          origin: readerOrigin,
          rules: ["zip-format"],
        });
        const origins = [
          { decided: [], expected: {}, help: helpByOrigin.Reader, printed: [], refusal: reader },
          ...WitnessKind.literals.flatMap((witness) =>
            RefusedKind.literals.map((kind) => ({
              decided: [kind],
              expected: {
                laws: refusalsByDecision[kind].facts,
                refused_kind: kind,
                sources: [source],
                witness,
              },
              help: helpByOrigin[witness],
              printed: [source],
              refusal: refusalOf(refusalsByDecision[kind].refused, witnessesByKind[witness]),
            })),
          ),
        ];

        assert.strictEqual(
          origins.length,
          1 + WitnessKind.literals.length * RefusedKind.literals.length,
        );
        for (const { decided, expected, help, printed, refusal } of origins) {
          const label =
            refusal.origin._tag === "Database"
              ? `${refusal.origin.kind} ${refusal.origin.witness}`
              : "Reader";
          const command = ending("import", () => Promise.resolve(refusal), false);
          const json = yield* captureCli(["--json"], { command });
          const text = yield* captureCli([], { command });
          const error = errorLine(json.stderr);
          const { laws, refused_kind: refusedKind, sources, witness } = error;

          assert.strictEqual(exitCodeOf(json.exit), 1, label);
          assert.strictEqual(exitCodeOf(text.exit), 1, label);
          assert.isTrue(matchesCommittedError(json.stderr), `${label}: ${json.stderr}`);
          assert.strictEqual(error.kind, "import-refused", label);
          assert.deepStrictEqual(error.rules, refusal.rules, label);
          assert.deepStrictEqual(
            Object.fromEntries(
              Object.entries({ laws, refused_kind: refusedKind, sources, witness }).filter(
                ([, value]) => value !== undefined,
              ),
            ),
            expected,
            label,
          );
          assert.include(error.help, help, label);
          assert.include(text.stderr, `= help: ${error.help}`, label);
          assert.deepStrictEqual(
            text.stderr
              .split("\n")
              .filter((line) => line.startsWith("  refused: "))
              .map((line) => line.slice("  refused: ".length).split(",")[0]),
            decided,
            label,
          );
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
});
