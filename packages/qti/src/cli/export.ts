import { Effect } from "effect";
import { Argument, Command } from "effect/cli";
import { zipFlag } from "#qti/cli/args.ts";

/**
 * Write the imported package `packageId` to `dir`, or to a zip file under `--zip`.
 *
 * The engine loads when the handler runs, so `--help` and a usage error never pay for it.
 */
export const exportCommand = Command.make(
  "export",
  { dir: Argument.String("dir"), packageId: Argument.String("package-id"), zip: zipFlag },
  Effect.fn("cli.export")(function* exportHandler({ dir, packageId, zip }) {
    const target = zip && !dir.endsWith(".zip") ? `${dir}.zip` : dir;
    const { AuthorAppLayer } = yield* Effect.promise(() => import("#qti/db/layer.ts"));
    const { exportPackage } = yield* Effect.promise(() => import("#qti/export/package.ts"));

    yield* exportPackage(packageId, target).pipe(Effect.provide(AuthorAppLayer));
  }),
).pipe(
  Command.withDescription(
    "Export the package <package-id> to <dir>, or to the zip file <dir>.zip under --zip",
  ),
);
