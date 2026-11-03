/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Cause, Console, Effect, FileSystem, Logger, Path, Schema } from "effect";
import { Argument, CliError, CliOutput, Command, Flag } from "effect/cli";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";

/**
 * The path the person named is not there, or is neither a directory nor a `.zip` file.
 */
class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {
  /**
   * The path and what to do about it.
   */
  override get message(): string {
    return `${this.path} is not a directory or a .zip file. Name the directory of an unzipped QTI package, or its .zip file.`;
  }
}

/**
 * A round trip whose export differs from its source in at least one entry.
 */
class RoundtripDiffers extends Schema.TaggedError<RoundtripDiffers>()("RoundtripDiffers", {
  differing: Schema.Number,
  exportDir: Schema.String,
}) {
  /**
   * How many entries differ and where the export is, for comparing by hand.
   */
  override get message(): string {
    return `${this.differing} entries differ between the package and its export in ${this.exportDir}.`;
  }
}

/**
 * Refuse a path that is neither a directory nor a `.zip` file, before anything opens the database.
 *
 * @param source - The path the person named.
 */
const requirePackage = Effect.fn("cli.requirePackage")(function* requirePackage(source: string) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.stat(source).pipe(
    Effect.filterOrFail(
      (info) => info.type === "Directory" || (info.type === "File" && source.endsWith(".zip")),
      () => new NotADirectory({ path: source }),
    ),
    Effect.mapError(() => new NotADirectory({ path: source })),
    Effect.asVoid,
  );
});

/**
 * The flag that makes an export a zip file instead of a directory.
 */
const zipFlag = Flag.Boolean("zip").pipe(
  Flag.withDefault(false),
  Flag.withDescription("Write the export as a .zip file, adding .zip to the path when it lacks it"),
);

/**
 * Import the package in `dir`, a directory or a `.zip` file, then print its id.
 *
 * `importPackage` reads through `listPackage`, which reads a zip as it reads a directory.
 */
const importCommand = Command.make(
  "import",
  { dir: Argument.String("dir") },
  Effect.fn("cli.import")(function* importHandler({ dir }) {
    yield* requirePackage(dir);
    yield* Console.log(yield* importPackage(dir).pipe(Effect.provide(AuthorAppLayer)));
  }),
).pipe(
  Command.withDescription(
    "Import the package in <dir>, a directory or a .zip file, and print its package id",
  ),
);

/**
 * Write the imported package `packageId` to `dir`, or to a zip file under `--zip`.
 */
const exportCommand = Command.make(
  "export",
  { dir: Argument.String("dir"), packageId: Argument.String("package-id"), zip: zipFlag },
  Effect.fn("cli.export")(function* exportHandler({ dir, packageId, zip }) {
    const target = zip && !dir.endsWith(".zip") ? `${dir}.zip` : dir;

    yield* exportPackage(packageId, target).pipe(Effect.provide(AuthorAppLayer));
  }),
).pipe(
  Command.withDescription(
    "Export the package <package-id> to <dir>, or to the zip file <dir>.zip under --zip",
  ),
);

/**
 * Import the package in `dir`, export it to `work/export/<name of dir>/` (`<name>.zip` under
 * `--zip`), and print the comparison.
 */
const roundtripCommand = Command.make(
  "roundtrip",
  { dir: Argument.String("dir"), zip: zipFlag },
  Effect.fn("cli.roundtrip")(function* roundtripHandler({ dir, zip }) {
    yield* requirePackage(dir);

    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const name = path.basename(path.resolve(dir)).replace(/\.zip$/u, "");
    const exportDir = path.join("work", "export", zip ? `${name}.zip` : name);

    yield* fs.remove(exportDir, { force: true, recursive: true });

    const packageId = yield* importPackage(dir).pipe(Effect.provide(AuthorAppLayer));

    yield* exportPackage(packageId, exportDir).pipe(Effect.provide(AuthorAppLayer));

    const report = yield* comparePackage(dir, exportDir);
    const differing = report.filter(({ outcome }) => outcome.kind === "differs").length;

    yield* Console.log(renderReport(report));

    if (differing > 0) {
      yield* new RoundtripDiffers({ differing, exportDir });
    }
  }),
).pipe(
  Command.withDescription(
    "Import <dir>, export it to work/export/<name> (<name>.zip under --zip), and compare the two",
  ),
);

/**
 * The command line: `import`, `export` and `roundtrip`.
 */
export const cli = Command.make("qti").pipe(
  Command.withDescription("Import QTI packages into the database and export them back"),
  Command.withSubcommands([importCommand, exportCommand, roundtripCommand]),
  // Log lines are diagnostics: they go to standard error, so standard output carries only the data
  // asked for. The root's handler runs the chosen subcommand's, so this reaches every handler.
  Command.provideSync(Logger.LogToStderr, true),
);

/**
 * Presents Effect's help, version and usage-error events.
 *
 * Help and version were asked for, so they stay on standard output. A mistyped command's help is a
 * diagnostic, so it joins its errors on standard error.
 */
const presenter: CliOutput.Presenter = {
  present: (event) =>
    event._tag === "InvalidInvocation"
      ? Effect.gen(function* presentInvalidInvocation() {
          const formatter = yield* CliOutput.Formatter;

          yield* Console.error(formatter.formatHelpDoc(event.helpDoc));
          yield* Console.error(formatter.formatErrors(event.errors));
        })
      : CliOutput.defaultPresenter.present(event),
};

if (import.meta.main) {
  const main = cli.pipe(
    Command.run({ version: "0.0.0" }),
    // A refusal prints its message once; `Command.run` has already presented a usage error. A
    // defect keeps its pretty cause, the one case a stack is wanted.
    Effect.tapError((failure) =>
      CliError.isCliError(failure) ? Effect.void : Console.error(failure.message),
    ),
    Effect.tapDefect((defect) => Console.error(Cause.pretty(Cause.die(defect)))),
    Effect.provide(CliOutput.layerPresenter(presenter)),
    Effect.provide(NodeServices.layer),
  );

  NodeRuntime.runMain(main, { disableErrorReporting: true });
}
