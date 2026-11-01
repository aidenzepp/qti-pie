/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, FileSystem, Path, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";

/**
 * The directory the person named is not there, or is not a directory.
 */
class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {
  /**
   * The path and what to do about it.
   */
  override get message(): string {
    return `${this.path} is not a directory. Name the directory of an unzipped QTI package.`;
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
 * Refuse a path that is not a directory, before anything opens the database.
 *
 * @param dir - The path the person named.
 */
const requireDirectory = Effect.fn("cli.requireDirectory")(function* requireDirectory(dir: string) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.stat(dir).pipe(
    Effect.filterOrFail(
      (info) => info.type === "Directory",
      () => new NotADirectory({ path: dir }),
    ),
    Effect.mapError(() => new NotADirectory({ path: dir })),
    Effect.asVoid,
  );
});

/**
 * Import the package in `dir`, then print its id.
 */
const importCommand = Command.make(
  "import",
  { dir: Argument.String("dir") },
  Effect.fn("cli.import")(function* importHandler({ dir }) {
    yield* requireDirectory(dir);
    yield* Console.log(yield* importPackage(dir).pipe(Effect.provide(AuthorAppLayer)));
  }),
).pipe(Command.withDescription("Import the package in <dir> and print its package id"));

/**
 * Write the imported package `packageId` to `dir`.
 */
const exportCommand = Command.make(
  "export",
  { dir: Argument.String("dir"), packageId: Argument.String("package-id") },
  Effect.fn("cli.export")(function* exportHandler({ dir, packageId }) {
    yield* exportPackage(packageId, dir).pipe(Effect.provide(AuthorAppLayer));
  }),
).pipe(Command.withDescription("Export the package <package-id> to <dir>"));

/**
 * Import the package in `dir`, export it to `work/export/<name of dir>/`, and print the comparison.
 */
const roundtripCommand = Command.make(
  "roundtrip",
  { dir: Argument.String("dir") },
  Effect.fn("cli.roundtrip")(function* roundtripHandler({ dir }) {
    yield* requireDirectory(dir);

    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const exportDir = path.join("work", "export", path.basename(path.resolve(dir)));

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
  Command.withDescription("Import <dir>, export it to work/export/<name>, and compare the two"),
);

/**
 * The command line: `import`, `export` and `roundtrip`.
 */
export const cli = Command.make("qti").pipe(
  Command.withDescription("Import QTI packages into the database and export them back"),
  Command.withSubcommands([importCommand, exportCommand, roundtripCommand]),
);

if (import.meta.main) {
  const main = cli.pipe(Command.run({ version: "0.0.0" }), Effect.provide(NodeServices.layer));

  NodeRuntime.runMain(main);
}
