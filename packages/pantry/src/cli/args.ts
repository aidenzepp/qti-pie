import os from "node:os";
import { Config, Effect, FileSystem, Option, Path, Runtime, Schema } from "effect";
import { Flag } from "effect/cli";
import { cliKind, kindExitCode, NotADirectory } from "#pantry/cli/errors.ts";
import type { Kind } from "#pantry/cli/errors.ts";

/**
 * Refuse a path that is not there, or is neither a directory nor a `.zip` file, before anything
 * opens the database.
 *
 * @param source - The path the person named.
 * @returns Nothing; fails with {@link NotADirectory} for a path that is not there or is of another
 *   type, and with the `PlatformError` of any other failure to read it, such as one the person may
 *   not read.
 */
export const requirePackage = Effect.fn("cli.requirePackage")(function* requirePackage(
  source: string,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.stat(source).pipe(
    Effect.catchReason("PlatformError", "NotFound", () => new NotADirectory({ path: source })),
    Effect.filterOrFail(
      (info) => info.type === "Directory" || (info.type === "File" && source.endsWith(".zip")),
      () => new NotADirectory({ path: source }),
    ),
    Effect.asVoid,
  );
});

/**
 * What `--zip`, `--yes` and `--dry-run`, and their variables, are when nothing sets them: off, as
 * each one's help says.
 */
const switchDefault = false;

/**
 * The flag that makes an export a zip file instead of a directory.
 */
export const zipFlag = Flag.Boolean("zip").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_ZIP")),
  Flag.withDefault(switchDefault),
  Flag.withDescription(
    `Write the export as a .zip file, adding .zip to the path when it lacks it [env: QTI_ZIP] [default: ${String(switchDefault)}]`,
  ),
);

/**
 * The flag that lets a command replace something already on disk.
 */
export const yesFlag = Flag.Boolean("yes").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_YES")),
  Flag.withDefault(switchDefault),
  Flag.withDescription(
    `Replace a target that already has something in it [env: QTI_YES] [default: ${String(switchDefault)}]`,
  ),
);

/**
 * The flag that makes a write command show what it would write and write nothing.
 */
export const dryRunFlag = Flag.Boolean("dry-run").pipe(
  Flag.withFallbackConfig(Config.Boolean("QTI_DRY_RUN")),
  Flag.withDefault(switchDefault),
  Flag.withDescription(
    `Show what the command would write, and write nothing [env: QTI_DRY_RUN] [default: ${String(switchDefault)}]`,
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
class TargetProtected extends Schema.TaggedError<TargetProtected>()("TargetProtected", {
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
 * The manifest identifier is not one: no package can hold it, so no export can name a package by
 * it.
 */
class BadIdentifier extends Schema.TaggedError<BadIdentifier>()("BadIdentifier", {
  identifier: Schema.String,
  /**
   * The most UTF-8 bytes a manifest identifier holds.
   */
  maxBytes: Schema.Number,
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
   * The text and what a manifest identifier is.
   */
  override get message(): string {
    return `${JSON.stringify(this.identifier)} is not a manifest identifier. A manifest identifier is the identifier attribute of a package's manifest element, an XML name with no colon and no space (an NCName) of at most ${String(this.maxBytes)} UTF-8 bytes, like MANIFEST-1.`;
  }

  /**
   * What to do about it.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Use the manifest identifier that `qti import` printed.";
  }
}

/**
 * Parse the manifest identifier the person named, once, before anything opens the database: an
 * NCName (`xs:ID`'s lexical space, collapsed, as the import stores it) of at most `identityBytes`
 * UTF-8 bytes, `ManifestIdentifier`'s language (`#pantry/qti/limits.ts`), so every text it accepts
 * is one a package can hold. The grammar and the bound load here, as the
 * engine does in the handler, so the command line's static graph reaches none of it.
 *
 * @param identifier - The identifier the person named.
 * @returns The identifier. Fails with `BadIdentifier` when no package can hold the text.
 */
export const requireIdentifier = Effect.fn("cli.requireIdentifier")(function* requireIdentifier(
  identifier: string,
) {
  const [{ isNcName }, { identityBytes }] = yield* Effect.promise(() =>
    Promise.all([import("#pantry/grammar/domains.ts"), import("#pantry/qti/limits.ts")]),
  );

  if (!isNcName(identifier) || new TextEncoder().encode(identifier).length > identityBytes) {
    return yield* new BadIdentifier({ identifier, maxBytes: identityBytes });
  }

  return identifier;
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
  const parent = yield* fs.realPath(path.dirname(absolute));

  return path.join(parent, path.basename(absolute));
});

/**
 * Whether no replacement may take `target`, which exists: it is the current folder, one of its
 * parents, the home folder, or the filesystem root. A home folder that is not there is judged as
 * `HOME` names it.
 */
const isProtected = Effect.fn("cli.isProtected")(function* isProtected(target: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const here = yield* fs.realPath(process.cwd());
  const home = yield* Config.String("HOME").pipe(Config.withDefault(os.homedir()));
  const homeReal = yield* fs
    .realPath(home)
    .pipe(
      Effect.catchReason("PlatformError", "NotFound", () => Effect.succeed(path.resolve(home))),
    );
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
 * What a write does to its target: `create` it where nothing is, or `replace` what is there, an
 * empty directory, a file or a symlink included.
 */
type TargetAction = "create" | "replace";

/**
 * What a dry run says about the database.
 */
export const databaseNotChecked = "the database's own checks did not run";

/**
 * Decide what writing `target` does, refusing to write over something already on disk unless the
 * person said `--yes`, and refusing the current folder, its parents, the home folder and the
 * filesystem root even then. Removes nothing.
 *
 * Existence decides the action: a target that exists, an empty directory among them, is replaced,
 * because the write takes its place; only where nothing is is it created. An empty directory needs
 * no `--yes`, since nothing in it is lost. Every command that writes a target reports this action.
 *
 * @param target - The directory or file the command will write.
 * @param yes - Whether the person passed `--yes`.
 * @returns The action the write takes; a {@link TargetProtected} or {@link TargetNotEmpty} when it
 *   may not take it.
 */
export const requireReplaceable = Effect.fn("cli.requireReplaceable")(function* requireReplaceable(
  target: string,
  yes: boolean,
) {
  const content = yield* contentOf(target);

  if (content === "nothing") {
    return "create" satisfies TargetAction;
  }

  if (yield* isProtected(target)) {
    return yield* new TargetProtected({ target });
  }

  if (content === "something" && !yes) {
    return yield* new TargetNotEmpty({ target });
  }

  return "replace" satisfies TargetAction;
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
    (staging) =>
      fs.remove(staging, { force: true, recursive: true }).pipe(
        Effect.ignore({
          log: "Warn",
          message: `The staging folder ${staging} could not be removed, so it is left beside the target. Remove it by hand.`,
        }),
      ),
  );
});
