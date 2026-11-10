import { Effect, Path, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import {
  databaseNotChecked,
  dryRunFlag,
  replaceWith,
  requirePackage,
  requireReplaceable,
  yesFlag,
  zipFlag,
} from "#pantry/cli/args.ts";
import { withAuthorApp } from "#pantry/cli/engine.ts";
import { RoundtripDiffers } from "#pantry/cli/errors.ts";
import { emitSuccess, outputMode } from "#pantry/cli/output.ts";
import type { Outcome } from "#pantry/export/compare.ts";

/**
 * The kinds of an entry's outcome, a literal list checked against the exporter's `Outcome`: a kind
 * that list names and `Outcome` lacks fails to compile here, and a kind `Outcome` gains makes the
 * handler's report unassignable to {@link RoundtripData}.
 */
const outcomeKinds = [
  "canonical-equal",
  "byte-identical",
  "differs",
] as const satisfies readonly Outcome["kind"][];

/**
 * How one entry of the export compares with the package: equal as canonical XML, equal byte for
 * byte, or different, with `at` saying where.
 */
const RoundtripOutcome = Schema.Union([
  Schema.Struct({ kind: Schema.Literal(outcomeKinds[0]) }),
  Schema.Struct({ kind: Schema.Literal(outcomeKinds[1]) }),
  Schema.Struct({ at: Schema.String, kind: Schema.Literal(outcomeKinds[2]) }),
]);

/**
 * One entry of the comparison: its path and its outcome.
 */
const RoundtripEntry = Schema.Struct({ outcome: RoundtripOutcome, path: Schema.String });

/**
 * What `roundtrip` prints under `--output jsonl` after its entries: everything but them.
 */
const RoundtripSummary = Schema.Struct({
  differing: Schema.Int,
  export_dir: Schema.String,
  package_id: Schema.String,
});

/**
 * What `roundtrip` returns under `--output json` when it ran: the package, where it was exported,
 * how many entries differ and the comparison of every entry.
 */
const RoundtripReport = Schema.Struct({
  ...RoundtripSummary.fields,
  entries: Schema.Array(RoundtripEntry),
});

/**
 * What `roundtrip --dry-run` returns under `--output json`: what the package holds, where the
 * export would go and whether that replaces something, and that the database did not check it.
 */
const RoundtripPreview = Schema.Struct({
  database_checked: Schema.Literal(false),
  dry_run: Schema.Literal(true),
  export_dir: Schema.String,
  export_dir_action: Schema.Literals(["create", "replace"]),
  package_dir: Schema.String,
  relations: Schema.Int,
  rows: Schema.Int,
});

/**
 * What `roundtrip` returns under `--output json`: its report, or under `--dry-run` what it would
 * do.
 */
export const RoundtripData = Schema.Union([RoundtripReport, RoundtripPreview]);

/**
 * Import the package in `dir`, export it to `work/export/<name of dir>/` (`<name>.zip` under
 * `--zip`), and print how the export compares with the package the import stored.
 *
 * The comparison is the exporter's `compareExported`: the record the import wrote, every entry's
 * bytes as it read them, against the entries the export of the stored package wrote, path by path,
 * so the stored documents are scanned once. An entry is `byte-identical` when its bytes come back
 * exactly, `canonical-equal` when an XML entry's bytes differ but its canonical forms agree, and
 * otherwise differs, `at` saying where: `missing` for an entry the export lacks, `extra` for one
 * only the export writes, `repeated` for a path either side holds twice, or the first differing
 * byte.
 *
 * An export already at `work/export/<name>` needs `--yes`, which replaces it, and the old one goes
 * only once the new export is written and compared.
 *
 * Under `--dry-run` it reads and checks the package, says whether the export would be created or
 * would replace one, and writes nothing. Every refusal of the real run before its first write is
 * raised too: an earlier export without `--yes`, and a protected target.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it, and the
 * importer and the exporter load inside the database's pool (`withAuthorApp`), so neither does a
 * run that cannot reach the database. The import, the export and the comparison share that one
 * pool.
 */
export const roundtripCommand = Command.make(
  "roundtrip",
  { dir: Argument.String("dir"), dryRun: dryRunFlag, yes: yesFlag, zip: zipFlag },
  Effect.fn("cli.roundtrip")(function* roundtripHandler({ dir, dryRun, yes, zip }) {
    const mode = yield* outputMode;

    yield* requirePackage(dir);

    const path = yield* Path.Path;
    const name = path.basename(path.resolve(dir)).replace(/\.zip$/u, "");
    const exportDir = path.join("work", "export", zip ? `${name}.zip` : name);

    const action = yield* requireReplaceable(exportDir, yes);

    if (dryRun) {
      const { previewPackage } = yield* Effect.promise(() => import("#pantry/import/preview.ts"));
      const { relations, rows } = yield* previewPackage(dir);

      yield* emitSuccess(mode, {
        command: "roundtrip",
        data: {
          database_checked: false,
          dry_run: true,
          export_dir: exportDir,
          export_dir_action: action,
          package_dir: dir,
          relations,
          rows,
        },
        dataSchema: RoundtripData,
        ok: true,
        text: `would import ${dir}: ${rows} rows in ${relations} relations, then ${action} ${exportDir}; ${databaseNotChecked}`,
      });

      return;
    }

    const { packageId, report } = yield* withAuthorApp(
      () =>
        Promise.all([
          import("#pantry/import/read.ts"),
          import("#pantry/import/package.ts"),
          import("#pantry/export/package.ts"),
        ]),
      ([{ readPackage }, { importPackage }, { compareExported, exportPackage }]) =>
        Effect.gen(function* roundtripOnPool() {
          const stored = yield* importPackage(yield* readPackage(dir));
          const compared = yield* replaceWith(exportDir, (written) =>
            Effect.flatMap(exportPackage(stored, written), (entries) =>
              compareExported(stored, entries),
            ),
          );

          return { packageId: stored, report: compared };
        }),
    );

    const { renderReport } = yield* Effect.promise(() => import("#pantry/export/compare.ts"));
    const differing = report.filter(({ outcome }) => outcome.kind === "differs").length;

    yield* emitSuccess(mode, {
      command: "roundtrip",
      data: { differing, entries: report, export_dir: exportDir, package_id: packageId },
      dataSchema: RoundtripData,
      ok: differing === 0,
      stream: {
        lineSchema: RoundtripEntry,
        lines: report,
        summary: { differing, export_dir: exportDir, package_id: packageId },
        summarySchema: RoundtripSummary,
      },
      text: renderReport(report),
    });

    if (differing > 0) {
      yield* new RoundtripDiffers({ differing, exportDir });
    }
  }),
).pipe(
  Command.withDescription(
    "Import <dir>, export it to work/export/<name> (<name>.zip under --zip), and compare the export with the package the import stored (writes the database and work/export/<name>; with --dry-run it reads and checks the package, says whether the export would be created or replaced, and writes nothing, and the database's own checks do not run). An export already at work/export/<name> is replaced only with --yes, and the old one goes once the new export is written",
  ),
  Command.withExamples([
    {
      command: "qti roundtrip ./my-package",
      description: "Import a package, export it again and compare the two",
    },
    {
      command: "qti roundtrip --zip ./my-package.zip",
      description: "Do the same with a zipped package, writing the export as a zip file",
    },
    {
      command: "qti roundtrip --dry-run ./my-package",
      description: "Read and check a package and say where the export would go, writing nothing",
    },
    {
      command: "qti roundtrip --output jsonl ./my-package",
      description: "Print one line of JSON per entry, then a summary line",
    },
  ]),
);
