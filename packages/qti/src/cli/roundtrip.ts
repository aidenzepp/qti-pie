import { Console, Effect, FileSystem, Path } from "effect";
import { Argument, Command } from "effect/cli";
import { requirePackage, zipFlag } from "#qti/cli/args.ts";
import { RoundtripDiffers } from "#qti/cli/errors.ts";

/**
 * Import the package in `dir`, export it to `work/export/<name of dir>/` (`<name>.zip` under
 * `--zip`), and print the comparison.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it.
 */
export const roundtripCommand = Command.make(
  "roundtrip",
  { dir: Argument.String("dir"), zip: zipFlag },
  Effect.fn("cli.roundtrip")(function* roundtripHandler({ dir, zip }) {
    yield* requirePackage(dir);

    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const name = path.basename(path.resolve(dir)).replace(/\.zip$/u, "");
    const exportDir = path.join("work", "export", zip ? `${name}.zip` : name);

    yield* fs.remove(exportDir, { force: true, recursive: true });

    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { comparePackage, renderReport } = yield* Effect.promise(
      () => import("#qti/export/compare.ts"),
    );
    const { exportPackage } = yield* Effect.promise(() => import("#qti/export/package.ts"));
    const { importPackage } = yield* Effect.promise(() => import("#qti/import/package.ts"));
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
