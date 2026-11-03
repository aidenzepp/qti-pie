import { Effect, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { zipFlag } from "#qti/cli/args.ts";
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
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it.
 * `exportPackage` returns nothing, so under `--output json` the entries are read back from what it
 * wrote; text mode prints nothing and does not read them.
 */
export const exportCommand = Command.make(
  "export",
  { dir: Argument.String("dir"), packageId: Argument.String("package-id"), zip: zipFlag },
  Effect.fn("cli.export")(function* exportHandler({ dir, packageId, zip }) {
    const mode = yield* outputMode;
    const target = zip && !dir.endsWith(".zip") ? `${dir}.zip` : dir;
    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { exportPackage } = yield* Effect.promise(() => import("#qti/export/package.ts"));

    yield* exportPackage(packageId, target).pipe(Effect.provide(AuthorAppLayer));

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
    "Export the package <package-id> to <dir>, or to the zip file <dir>.zip under --zip (writes files)",
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
