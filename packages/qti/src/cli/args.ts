import { Config, Effect, FileSystem } from "effect";
import { Flag } from "effect/cli";
import { NotADirectory } from "#qti/cli/errors.ts";

/**
 * Refuse a path that is neither a directory nor a `.zip` file, before anything opens the database.
 *
 * @param source - The path the person named.
 */
export const requirePackage = Effect.fn("cli.requirePackage")(function* requirePackage(
  source: string,
) {
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
export const zipFlag = Flag.Boolean("zip").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_ZIP")),
  Flag.withDefault(false),
  Flag.withDescription(
    "Write the export as a .zip file, adding .zip to the path when it lacks it [env: QTI_ZIP] [default: false]",
  ),
);
