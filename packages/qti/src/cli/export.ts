import { Effect, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import {
  replaceWith,
  requirePackageId,
  requireReplaceable,
  yesFlag,
  zipFlag,
} from "#qti/cli/args.ts";
import { emitSuccess, outputMode } from "#qti/cli/output.ts";

/**
 * One file `export` wrote: its path inside the package and its size.
 */
const ExportEntry = Schema.Struct({ bytes: Schema.Number, path: Schema.String });

/**
 * What `export` returns under `--output json`: the package, where it was written and every file
 * written, read back from the target.
 */
export const ExportData = Schema.Struct({
  entries: Schema.Array(ExportEntry),
  package_id: Schema.String,
  target: Schema.String,
});

/**
 * Write the imported package `packageId` to `dir`, or to a zip file under `--zip`.
 *
 * A target that already has something in it needs `--yes`, which replaces it, files `qti` did not
 * write included. The package id and the target are checked before the database opens. The export
 * is written beside the target first and takes its place only once it is complete, so an export
 * that fails leaves the old target as it was. A symlink target is replaced, never followed.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it.
 * `exportPackage` returns nothing, so under `--output json` the entries are read back from what it
 * wrote; text mode prints nothing and does not read them.
 */
export const exportCommand = Command.make(
  "export",
  {
    dir: Argument.String("dir"),
    packageId: Argument.String("package-id"),
    yes: yesFlag,
    zip: zipFlag,
  },
  Effect.fn("cli.export")(function* exportHandler({ dir, packageId, yes, zip }) {
    const mode = yield* outputMode;
    const target = zip && !dir.endsWith(".zip") ? `${dir}.zip` : dir;

    yield* requirePackageId(packageId);
    yield* requireReplaceable(target, yes);

    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { exportPackage } = yield* Effect.promise(() => import("#qti/export/package.ts"));

    yield* replaceWith(target, (written) =>
      exportPackage(packageId, written).pipe(Effect.provide(AuthorAppLayer)),
    );

    if (mode === "text") {
      return;
    }

    const { listPackage, readEntry } = yield* Effect.promise(() => import("#qti/package/read.ts"));
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
    "Export the package <package-id> to <dir>, or to the zip file <dir>.zip under --zip (writes files). A <dir> that already has something in it needs --yes, which replaces it, and the old one goes only once the new export is written; a symlink is replaced, never followed",
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
      command: "qti export --output json ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "Print the files written as one line of JSON",
    },
  ]),
);
