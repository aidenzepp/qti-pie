import { Effect, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { databaseNotChecked, dryRunFlag, requirePackage } from "#pantry/cli/args.ts";
import { withAuthorApp } from "#pantry/cli/engine.ts";
import { emitSuccess, outputMode } from "#pantry/cli/output.ts";
import type { importPackage } from "#pantry/import/package.ts";

/**
 * What an import's write did: stored the package, or found it stored already, the same bytes under
 * its manifest identifier (`#pantry/import/package.ts` `importPackage`).
 */
type ImportOutcome = Effect.Success<ReturnType<typeof importPackage>>["outcome"];

/**
 * The text each outcome prints after the manifest identifier, checked against the importer's
 * outcomes both ways: an outcome it gains fails to compile here until it is named, and one it loses
 * until its row goes.
 */
const outcomeText = {
  accepted: "imported",
  "no-change": "unchanged",
} as const satisfies Readonly<Record<ImportOutcome, string>>;

/**
 * The importer's outcomes, {@link outcomeText}'s keys, as the literals `--output json` prints.
 */
const importOutcomes = ["accepted", "no-change"] as const satisfies readonly ImportOutcome[];

/**
 * What `import` returns under `--output json` when the database holds the package: its manifest
 * identifier, which names it to `export`, and whether this import stored it (`accepted`) or found
 * it stored already (`no-change`).
 */
const ImportStored = Schema.Struct({
  outcome: Schema.Literals(importOutcomes),
  package: Schema.String,
});

/**
 * What `import --dry-run` returns under `--output json`: what the package holds, and that the
 * database did not check it.
 */
const ImportPreview = Schema.Struct({
  database_checked: Schema.Literal(false),
  dry_run: Schema.Literal(true),
  package_dir: Schema.String,
  relations: Schema.Int,
  rows: Schema.Int,
});

/**
 * What `import` returns under `--output json`: the manifest identifier of the package the database
 * holds and what the import did, or under `--dry-run` what the package holds.
 */
export const ImportData = Schema.Union([ImportStored, ImportPreview]);

/**
 * Import the package in `dir`, a directory or a `.zip` file, then print its manifest identifier and
 * whether it was imported or unchanged. A package the database already holds, the same bytes under
 * its identifier, is unchanged, which is success. A different package under a stored identifier is
 * refused on the package's key, the honest answer until the import replaces it: grizzle's replace
 * by set difference is pending (GRIZZLE-PENDING(WHOLEDEL)), and the outcome it adds joins
 * {@link outcomeText}, which fails to compile until it does. Under `--dry-run` it reads and checks
 * the package, prints how much it holds and stores nothing.
 *
 * A dry run is the import's own read (`previewPackage`): the package read, its documents shredded
 * and every row built, and nothing written. It does not open the database, so the database's laws
 * do not judge the rows: a package it accepts can still be refused by the real import.
 *
 * A refusal prints its rule and explanation, and, when the database gave it, where each of its laws
 * is stated (`#pantry/cli/present.ts`), and the key of the row that broke them where grizzle's
 * witness names one; where it names none, as for a foreign key, the refusal says so.
 *
 * The import reads the package once (`readPackage`), a zip as it reads a directory, then writes
 * what it read (`importPackage`); the dry run reads it the same way. The engine loads when the
 * handler runs, so `--help` and a usage error never pay for
 * it, and the importer loads inside the database's pool (`withAuthorApp`), so neither does a run
 * that cannot reach the database.
 */
export const importCommand = Command.make(
  "import",
  { dir: Argument.String("dir"), dryRun: dryRunFlag },
  Effect.fn("cli.import")(function* importHandler({ dir, dryRun }) {
    const mode = yield* outputMode;

    yield* requirePackage(dir);

    if (dryRun) {
      const { previewPackage } = yield* Effect.promise(() => import("#pantry/import/preview.ts"));
      const { relations, rows } = yield* previewPackage(dir);

      yield* emitSuccess(mode, {
        command: "import",
        data: { database_checked: false, dry_run: true, package_dir: dir, relations, rows },
        dataSchema: ImportData,
        ok: true,
        text: `would import ${dir}: ${rows} rows in ${relations} relations; ${databaseNotChecked}`,
      });

      return;
    }

    const stored = yield* withAuthorApp(
      () =>
        Promise.all([
          import("#pantry/db/layer.ts"),
          import("#pantry/import/read.ts"),
          import("#pantry/import/package.ts"),
        ]),
      ([{ authorDb }, { readPackage }, { importPackage }]) =>
        Effect.gen(function* importOnPool() {
          const db = yield* authorDb;

          return yield* importPackage(db.workload, yield* readPackage(dir));
        }),
    );

    yield* emitSuccess(mode, {
      command: "import",
      data: { outcome: stored.outcome, package: stored.package },
      dataSchema: ImportData,
      ok: true,
      text: `${stored.package}: ${outcomeText[stored.outcome]}`,
    });
  }),
).pipe(
  Command.withDescription(
    "Import the package in <dir>, a directory or a .zip file, and print its manifest identifier, imported or, when the database already holds the same package, unchanged (writes the database; with --dry-run it reads and checks the package, writes nothing, and the database's own checks do not run)",
  ),
  Command.withExamples([
    { command: "qti import ./my-package", description: "Import an unzipped package" },
    { command: "qti import ./my-package.zip", description: "Import a zipped package" },
    {
      command: "qti import --dry-run ./my-package",
      description: "Read and check a package without storing it",
    },
    {
      command: "qti import --output json ./my-package",
      description: "Print the manifest identifier and the outcome as one line of JSON",
    },
  ]),
);
