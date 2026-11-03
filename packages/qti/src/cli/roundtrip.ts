import { Effect, Path, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import {
  replaceWith,
  requirePackage,
  requireReplaceable,
  yesFlag,
  zipFlag,
} from "#qti/cli/args.ts";
import { RoundtripDiffers } from "#qti/cli/errors.ts";
import { emitSuccess, outputMode } from "#qti/cli/output.ts";
import type { Outcome } from "#qti/export/compare.ts";

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
  differing: Schema.Number,
  export_dir: Schema.String,
  package_id: Schema.String,
});

/**
 * What `roundtrip` returns under `--output json`: the package, where it was exported, how many
 * entries differ and the comparison of every entry.
 */
export const RoundtripData = Schema.Struct({
  ...RoundtripSummary.fields,
  entries: Schema.Array(RoundtripEntry),
});

/**
 * Import the package in `dir`, export it to `work/export/<name of dir>/` (`<name>.zip` under
 * `--zip`), and print the comparison.
 *
 * An export already at `work/export/<name>` needs `--yes`, which replaces it, and the old one goes
 * only once the new export is written.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it.
 */
export const roundtripCommand = Command.make(
  "roundtrip",
  { dir: Argument.String("dir"), yes: yesFlag, zip: zipFlag },
  Effect.fn("cli.roundtrip")(function* roundtripHandler({ dir, yes, zip }) {
    const mode = yield* outputMode;

    yield* requirePackage(dir);

    const path = yield* Path.Path;
    const name = path.basename(path.resolve(dir)).replace(/\.zip$/u, "");
    const exportDir = path.join("work", "export", zip ? `${name}.zip` : name);

    yield* requireReplaceable(exportDir, yes);

    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { comparePackage, renderReport } = yield* Effect.promise(
      () => import("#qti/export/compare.ts"),
    );
    const { exportPackage } = yield* Effect.promise(() => import("#qti/export/package.ts"));
    const { importPackage } = yield* Effect.promise(() => import("#qti/import/package.ts"));
    const packageId = yield* importPackage(dir).pipe(Effect.provide(AuthorAppLayer));

    yield* replaceWith(exportDir, (written) =>
      exportPackage(packageId, written).pipe(Effect.provide(AuthorAppLayer)),
    );

    const report = yield* comparePackage(dir, exportDir);
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
    "Import <dir>, export it to work/export/<name> (<name>.zip under --zip), and compare the two (writes the database and work/export/<name>). An export already at work/export/<name> is replaced only with --yes, and the old one goes once the new export is written",
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
      command: "qti roundtrip --output jsonl ./my-package",
      description: "Print one line of JSON per entry, then a summary line",
    },
  ]),
);
