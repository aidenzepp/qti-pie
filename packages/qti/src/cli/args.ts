/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import os from "node:os";
import { Config, Effect, Exit, FileSystem, Option, Path, Runtime, Schema } from "effect";
import { Flag } from "effect/cli";
import { cliKind, kindExitCode, NotADirectory } from "#qti/cli/errors.ts";
import type { Kind } from "#qti/cli/errors.ts";

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
 * The target already has something in it, or is a place the command never replaces, and `--yes`
 * was not given or cannot lift the refusal.
 */
export class TargetNotEmpty extends Schema.TaggedError<TargetNotEmpty>()("TargetNotEmpty", {
  protects: Schema.optionalKey(Schema.String),
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
   * What is in the way: something already there, or a folder the command never replaces.
   */
  override get message(): string {
    return this.protects === undefined
      ? `${this.target} already has something in it, so nothing was written.`
      : `${this.target} is ${this.protects}, which the command never replaces, so nothing was written.`;
  }

  /**
   * What to do about it.
   */
  get help(): string {
    return this.protects === undefined
      ? "Pass --yes to replace it, or name a new or empty directory."
      : "Name a new or empty directory instead, even with --yes.";
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

const isUuid = Schema.is(Schema.String.check(Schema.isUUID()));

/**
 * Refuse a package id that is not a UUID, before anything opens the database.
 *
 * @param packageId - The id the person named.
 */
export const requirePackageId = Effect.fn("cli.requirePackageId")(function* requirePackageId(
  packageId: string,
) {
  if (!isUuid(packageId)) {
    yield* new BadPackageId({ packageId });
  }
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
 * Name what a target is that no replacement may take: the current folder, one of its parents, the
 * home folder, or the filesystem root. Returns nothing when the target is none of them.
 */
const protectedAs = Effect.fn("cli.protectedAs")(function* protectedAs(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const here = yield* fs.realPath(process.cwd()).pipe(Effect.orElseSucceed(() => process.cwd()));
  const home = yield* Config.String("HOME").pipe(Config.withDefault(os.homedir()));
  const homeReal = yield* fs.realPath(home).pipe(Effect.orElseSucceed(() => path.resolve(home)));
  const place = yield* resolvedTarget(target);

  if (place === path.parse(place).root) {
    return "the filesystem root";
  }

  if (place === homeReal) {
    return "your home folder";
  }

  if (place === here) {
    return "the current folder";
  }

  return here.startsWith(place.endsWith(path.sep) ? place : `${place}${path.sep}`)
    ? "a parent of the current folder"
    : undefined;
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

  const protects = yield* protectedAs(target);

  if (protects !== undefined) {
    yield* new TargetNotEmpty({ protects, target });
  }

  if (content === "something" && !yes) {
    yield* new TargetNotEmpty({ target });
  }
});

/**
 * Write to a sibling of `target`, and only when that succeeds take the place of `target`.
 *
 * `write` runs on `.<name>.qti-<pid>` in the target's folder, which keeps a trailing `.zip` last
 * because the export decides zip or folder by the suffix. When it succeeds, the old target is
 * removed (a symlink as a link, never what it points to) and the sibling is renamed into its
 * place. When it fails, the sibling is removed and the old target is as it was.
 *
 * @param target - The directory or file being replaced.
 * @param write - Writes the new content at the path it is given.
 */
export const replaceWith = Effect.fn("cli.replaceWith")(function* replaceWith<A, E, R>(
  target: string,
  write: (path: string) => Effect.Effect<A, E, R>,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const name = path.basename(target);
  const zip = name.endsWith(".zip");
  const stem = zip ? name.slice(0, -".zip".length) : name;
  const sibling = path.join(
    path.dirname(target),
    `.${stem}.qti-${process.pid}${zip ? ".zip" : ""}`,
  );

  yield* write(sibling).pipe(
    Effect.onExit((exit) =>
      Exit.isSuccess(exit)
        ? Effect.void
        : fs.remove(sibling, { force: true, recursive: true }).pipe(Effect.ignore),
    ),
  );
  yield* fs.remove(target, { force: true, recursive: true });
  yield* fs.rename(sibling, target);
});
