import { Effect, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { databaseNotChecked, dryRunFlag, requirePackage } from "#pantry/cli/args.ts";
import { withAuthorApp } from "#pantry/cli/engine.ts";
import { emitSuccess, outputMode } from "#pantry/cli/output.ts";

/**
 * What `import` returns under `--output json` when it stored a package: its id.
 */
const ImportStored = Schema.Struct({ package_id: Schema.String });

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
 * What `import` returns under `--output json`: the id of the package it stored, or under
 * `--dry-run` what the package holds.
 */
export const ImportData = Schema.Union([ImportStored, ImportPreview]);

/**
 * Import the package in `dir`, a directory or a `.zip` file, then print its id. Under `--dry-run`
 * it reads and checks the package, prints how much it holds and stores nothing.
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

    const packageId = yield* withAuthorApp(
      () => Promise.all([import("#pantry/import/read.ts"), import("#pantry/import/package.ts")]),
      ([{ readPackage }, { importPackage }]) => Effect.flatMap(readPackage(dir), importPackage),
    );

    yield* emitSuccess(mode, {
      command: "import",
      data: { package_id: packageId },
      dataSchema: ImportData,
      ok: true,
      text: packageId,
    });
  }),
).pipe(
  Command.withDescription(
    "Import the package in <dir>, a directory or a .zip file, and print its package id (writes the database; with --dry-run it reads and checks the package, writes nothing, and the database's own checks do not run)",
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
      description: "Print the package id as one line of JSON",
    },
  ]),
);
