import { Effect, FileSystem, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import {
  dryRunFlag,
  replaceWith,
  requirePackageId,
  requireReplaceable,
  yesFlag,
  zipFlag,
} from "#pantry/cli/args.ts";
import { withAuthorApp } from "#pantry/cli/engine.ts";
import { emitSuccess, outputMode } from "#pantry/cli/output.ts";

/**
 * One file `export` wrote: its path inside the package and its size.
 */
const ExportEntry = Schema.Struct({ bytes: Schema.Int, path: Schema.String });

/**
 * What `export` returns under `--output json`: the package, where it was written and every file
 * written, read back from the target.
 */
const ExportWritten = Schema.Struct({
  entries: Schema.Array(ExportEntry),
  package_id: Schema.String,
  target: Schema.String,
});

/**
 * What `export --dry-run` returns under `--output json`: the package, the target, whether the
 * target would be created or replaced, and every file that would be written. Nothing was written.
 */
const ExportPlanned = Schema.Struct({
  dry_run: Schema.Literal(true),
  entries: Schema.Array(ExportEntry),
  package_id: Schema.String,
  target: Schema.String,
  target_action: Schema.Literals(["create", "replace"]),
});

/**
 * What `export` returns under `--output json`: the files it wrote, or under `--dry-run` the files
 * it would write.
 */
export const ExportData = Schema.Union([ExportPlanned, ExportWritten]);

/**
 * Whether the export would create `target` or replace what is there. A symlink counts as there,
 * whatever it points to.
 */
const targetActionOf = Effect.fn("cli.targetActionOf")(function* targetActionOf(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const present = yield* fs.lstat(target).pipe(
    Effect.as(true),
    Effect.catchTag("PlatformError", (error) =>
      error.reason._tag === "NotFound" ? Effect.succeed(false) : Effect.fail(error),
    ),
  );

  return present ? "replace" : "create";
});

/**
 * Write the imported package `packageId` to `dir`, or to a zip file under `--zip`.
 *
 * A target that already has something in it needs `--yes`, which replaces it, files `qti` did not
 * write included. The package id and the target are checked before the database opens. The export
 * is written beside the target first and takes its place only once it is complete, so an export
 * that fails leaves the old target as it was. A symlink target is replaced, never followed.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it, and the
 * exporter loads inside the database's pool (`withAuthorApp`), so neither does a run that cannot
 * reach the database. `exportPackage` returns nothing, so under `--output json` the entries are
 * read back from what it wrote; text mode prints nothing and does not read them.
 *
 * Under `--dry-run` nothing is written and the target is not touched: the entries the export would
 * write are listed with their sizes, and whether the target would be created or replaced. A dry run
 * refuses what the real run would refuse, before it opens the database: a target with something in
 * it without `--yes`, and the folders no export replaces.
 */
export const exportCommand = Command.make(
  "export",
  {
    dir: Argument.String("dir"),
    dryRun: dryRunFlag,
    packageId: Argument.String("package-id"),
    yes: yesFlag,
    zip: zipFlag,
  },
  Effect.fn("cli.export")(function* exportHandler({ dir, dryRun, packageId, yes, zip }) {
    const mode = yield* outputMode;
    const target = zip && !dir.endsWith(".zip") ? `${dir}.zip` : dir;

    const id = yield* requirePackageId(packageId);
    yield* requireReplaceable(target, yes);

    if (dryRun) {
      const planned = yield* withAuthorApp(
        () => import("#pantry/export/package.ts"),
        ({ exportEntries }) => exportEntries(id),
      );
      const entries = planned.map(({ bytes, path }) => ({ bytes: bytes.byteLength, path }));
      const action = yield* targetActionOf(target);
      const lines = entries.map(({ bytes, path }) => `  ${path} (${bytes} bytes)`);

      yield* emitSuccess(mode, {
        command: "export",
        data: {
          dry_run: true,
          entries,
          package_id: packageId,
          target,
          target_action: action,
        },
        dataSchema: ExportData,
        ok: true,
        text: [`would ${action} ${target} with ${entries.length} files:`, ...lines].join("\n"),
      });

      return;
    }

    yield* replaceWith(target, (written) =>
      withAuthorApp(
        () => import("#pantry/export/package.ts"),
        ({ exportPackage }) => exportPackage(id, written),
      ),
    );

    if (mode === "text") {
      return;
    }

    const { listPackage, readEntry } = yield* Effect.promise(
      () => import("#pantry/package/read.ts"),
    );
    const listed = yield* listPackage(target);
    const entries = yield* Effect.all(
      listed.map(({ path }) =>
        readEntry(target, path).pipe(Effect.map((bytes) => ({ bytes: bytes.byteLength, path }))),
      ),
    );

    yield* emitSuccess(mode, {
      command: "export",
      data: { entries, package_id: packageId, target },
      dataSchema: ExportData,
      ok: true,
    });
  }),
).pipe(
  Command.withDescription(
    "Export the package <package-id> to <dir>, or to the zip file <dir>.zip under --zip (writes files; --dry-run lists them, writes nothing and refuses what the real run would refuse). A <dir> that already has something in it needs --yes, which replaces it, and the old one goes only once the new export is written; a symlink is replaced, never followed",
  ),
  Command.withExamples([
    {
      command: "qti export ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "Write an imported package to the folder ./out",
    },
    {
      command: "qti export --zip ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "Write it to the zip file ./out.zip",
    },
    {
      command: "qti export --dry-run ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "List the files it would write, and write nothing",
    },
    {
      command: "qti export --output json ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "Print the files written as one line of JSON",
    },
  ]),
);
