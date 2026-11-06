/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import os from "node:os";
import { Config, Effect, FileSystem, Option, Path, Runtime, Schema } from "effect";
import { Flag } from "effect/cli";
import { cliKind, kindExitCode, NotADirectory } from "#pantry/cli/errors.ts";
import type { Kind } from "#pantry/cli/errors.ts";

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

/**
 * The flag that lets a command replace something already on disk.
 */
export const yesFlag = Flag.Boolean("yes").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_YES")),
  Flag.withDefault(false),
  Flag.withDescription(
    "Replace a target that already has something in it [env: QTI_YES] [default: false]",
  ),
);

/**
 * The flag that makes a write command show what it would write and write nothing.
 */
export const dryRunFlag = Flag.Boolean("dry-run").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_DRY_RUN")),
  Flag.withDefault(false),
  Flag.withDescription(
    "Show what the command would write, and write nothing [env: QTI_DRY_RUN] [default: false]",
  ),
);

/**
 * The target already has something in it, and `--yes` was not given.
 */
export class TargetNotEmpty extends Schema.TaggedError<TargetNotEmpty>()("TargetNotEmpty", {
  target: Schema.String,
}) {
  /**
   * This error's kind, `target-not-empty`. A getter, so the kind stays on the prototype and is no
   * field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "target-not-empty";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * What is in the way.
   */
  override get message(): string {
    return `${this.target} already has something in it, so nothing was written.`;
  }

  /**
   * What to do about it.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Pass --yes to replace it, or name a new or empty directory.";
  }
}

/**
 * The target is the folder the person is in, a folder above it, their home folder or the
 * filesystem root, which no command replaces, `--yes` or not.
 */
export class TargetProtected extends Schema.TaggedError<TargetProtected>()("TargetProtected", {
  target: Schema.String,
}) {
  /**
   * This error's kind, `cli-bad-argument`. A getter, so the kind stays on the prototype and is no
   * field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "cli-bad-argument";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * The target and what the command never replaces.
   */
  override get message(): string {
    return `${this.target} is the folder you are in, a folder above it, your home folder or the root. The command never replaces those, so nothing was written.`;
  }

  /**
   * What to do about it.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Name a new or empty directory instead, even with --yes.";
  }
}

/**
 * The package id is not a UUID.
 */
export class BadPackageId extends Schema.TaggedError<BadPackageId>()("BadPackageId", {
  packageId: Schema.String,
}) {
  /**
   * This error's kind, `cli-bad-argument`. A getter, so the kind stays on the prototype and is no
   * field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "cli-bad-argument";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * The id and what an id looks like.
   */
  override get message(): string {
    return `${this.packageId} is not a package id. A package id is a UUID, like 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40.`;
  }

  /**
   * What to do about it.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Use the id that `qti import` printed.";
  }
}

/**
 * Parse the package id the person named, once, before anything opens the database. The engine
 * loads here, as it does in the handler, so the command line's static graph reaches none of it.
 *
 * @param packageId - The id the person named.
 * @returns The id as a `Uuid`. Fails with `BadPackageId` when the text is not a UUID.
 */
export const requirePackageId = Effect.fn("cli.requirePackageId")(function* requirePackageId(
  packageId: string,
) {
  const { Uuid } = yield* Effect.promise(() => import("@bjornpagen/grizzle"));
  const id = Uuid.parse(packageId);

  if (!id.ok) {
    return yield* new BadPackageId({ packageId });
  }

  return id.value;
});

/**
 * The folder `target` would be written into, with symlinks in its parents resolved, so a path that
 * reaches the current folder by another route is still recognised. The last name is kept, so a
 * target that is itself a symlink is judged as the link and never as what it points to.
 */
const resolvedTarget = Effect.fn("cli.resolvedTarget")(function* resolvedTarget(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const absolute = path.resolve(target);
  const parent = yield* fs
    .realPath(path.dirname(absolute))
    .pipe(Effect.orElseSucceed(() => path.dirname(absolute)));

  return path.join(parent, path.basename(absolute));
});

/**
 * Whether no replacement may take `target`: it is the current folder, one of its parents, the home
 * folder, or the filesystem root.
 */
const isProtected = Effect.fn("cli.isProtected")(function* isProtected(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const here = yield* fs.realPath(process.cwd()).pipe(Effect.orElseSucceed(() => process.cwd()));
  const home = yield* Config.String("HOME").pipe(Config.withDefault(os.homedir()));
  const homeReal = yield* fs.realPath(home).pipe(Effect.orElseSucceed(() => path.resolve(home)));
  const place = yield* resolvedTarget(target);

  return (
    place === path.parse(place).root ||
    place === homeReal ||
    here === place ||
    here.startsWith(place.endsWith(path.sep) ? place : `${place}${path.sep}`)
  );
});

/**
 * What is at `target`: nothing, an empty directory, or something (a directory with an entry, a
 * file, or a symlink, which counts as present whatever it points to).
 */
const contentOf = Effect.fn("cli.contentOf")(function* contentOf(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const info = yield* fs.lstat(target).pipe(
    Effect.map(Option.some),
    Effect.catchTag("PlatformError", (error) =>
      error.reason._tag === "NotFound" ? Effect.succeed(Option.none()) : Effect.fail(error),
    ),
  );

  if (Option.isNone(info)) {
    return "nothing";
  }

  return info.value.type === "Directory" && (yield* fs.readDirectory(target)).length === 0
    ? "empty"
    : "something";
});

/**
 * Whether writing to `target` would replace something: it holds an entry, or is a file or a link.
 * An absent target and an empty directory are created into.
 */
export const wouldReplace = Effect.fn("cli.wouldReplace")(function* wouldReplace(target: string) {
  return (yield* contentOf(target)) === "something";
});

/**
 * What a dry run says about the database.
 */
export const databaseNotChecked = "the database's own checks did not run";

/**
 * Refuse to write over something already on disk unless the person said `--yes`, and refuse the
 * current folder, its parents, the home folder and the filesystem root even then. Removes nothing.
 *
 * @param target - The directory or file the command will write.
 * @param yes - Whether the person passed `--yes`.
 */
export const requireReplaceable = Effect.fn("cli.requireReplaceable")(function* requireReplaceable(
  target: string,
  yes: boolean,
) {
  const content = yield* contentOf(target);

  if (content === "nothing") {
    return;
  }

  if (yield* isProtected(target)) {
    yield* new TargetProtected({ target });
  }

  if (content === "something" && !yes) {
    yield* new TargetNotEmpty({ target });
  }
});

/**
 * Write to a private staging folder beside `target`, and only when that succeeds take the place
 * of `target`.
 *
 * The target is resolved to an absolute path first. `write` runs on `<staging>/<name>`, where the
 * staging folder is made fresh beside the target (random name, owner-only), so nothing a
 * process left at a guessable name is ever followed, and the name keeps a trailing `.zip` last
 * because the export decides zip or folder by the suffix. When `write` succeeds, the old target is
 * removed (a symlink as a link, never what it points to) and the written item is renamed onto its
 * place. The staging folder is removed on every exit, so a failure, a defect or an interruption
 * leaves the old target as it was.
 *
 * @param target - The directory or file being replaced.
 * @param write - Writes the new content at the path it is given.
 * @returns What `write` returns, once its content has taken the target's place.
 */
export const replaceWith = Effect.fn("cli.replaceWith")(function* replaceWith<A, E, R>(
  target: string,
  write: (path: string) => Effect.Effect<A, E, R>,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const absolute = path.resolve(target);
  const folder = path.dirname(absolute);
  const name = path.basename(absolute);

  yield* fs.makeDirectory(folder, { recursive: true });

  return yield* Effect.acquireUseRelease(
    fs.makeTempDirectory({ directory: folder, prefix: `.${name}.qti-` }),
    (staging) =>
      Effect.gen(function* swap() {
        const written = path.join(staging, name);
        const result = yield* write(written);

        yield* fs.remove(absolute, { force: true, recursive: true });
        yield* fs.rename(written, absolute);

        return result;
      }),
    (staging) => fs.remove(staging, { force: true, recursive: true }).pipe(Effect.ignore),
  );
});
