import { Effect, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { requirePackage } from "#qti/cli/args.ts";
import { emitSuccess, outputMode } from "#qti/cli/output.ts";

/**
 * What `import` returns under `--output json`: the id of the package it stored.
 */
export const ImportData = Schema.Struct({ package_id: Schema.String });

/**
 * Import the package in `dir`, a directory or a `.zip` file, then print its id.
 *
 * `importPackage` reads through `listPackage`, which reads a zip as it reads a directory. The
 * engine loads when the handler runs, so `--help` and a usage error never pay for it.
 */
export const importCommand = Command.make(
  "import",
  { dir: Argument.String("dir") },
  Effect.fn("cli.import")(function* importHandler({ dir }) {
    const mode = yield* outputMode;

    yield* requirePackage(dir);

    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { importPackage } = yield* Effect.promise(() => import("#qti/import/package.ts"));

    const packageId = yield* importPackage(dir).pipe(Effect.provide(AuthorAppLayer));

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
    "Import the package in <dir>, a directory or a .zip file, and print its package id (writes the database)",
  ),
  Command.withExamples([
    { command: "qti import ./my-package", description: "Import an unzipped package" },
    { command: "qti import ./my-package.zip", description: "Import a zipped package" },
    {
      command: "qti import --output json ./my-package",
      description: "Print the package id as one line of JSON",
    },
  ]),
);
