/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * How the program's failures are told apart: the closed roster of kinds a failure may have, the
 * exit code each kind ends the process with, and {@link describeFailure}, which names the kind of
 * any failure a run ends with.
 */
import { Option, Predicate, Runtime, Schema } from "effect";
import type { Effect } from "effect";
import { CliError } from "effect/cli";
import { refusalFieldsOf, refusedByDatabase } from "#pantry/cli/refused.ts";
import type { RefusalFields } from "#pantry/cli/refused.ts";
import type { exportPackage } from "#pantry/export/package.ts";
import type { OverlayConflict } from "#pantry/import/overlays/index.ts";
import type { importPackage, LocateDisagreement } from "#pantry/import/package.ts";
import type { UnownedLaws } from "#pantry/import/refusal.ts";

/**
 * Every kind a failure of this program has.
 *
 * - Exit 1, refused or the work failed: `import-refused`, `roundtrip-differs`, `target-not-empty`,
 *   `timeout`, `database`, `not-found`.
 * - Exit 2, the command line is wrong: `cli-usage`, `cli-path-missing`, `cli-bad-argument`.
 * - Exit 70, a defect in qti: `internal`.
 * - Exit 74, reading the package or writing the output failed: `io`.
 * - Exit 78, the local set-up is missing or unreadable: `config`.
 */
export type Kind =
  | "cli-bad-argument"
  | "cli-path-missing"
  | "cli-usage"
  | "config"
  | "database"
  | "import-refused"
  | "internal"
  | "io"
  | "not-found"
  | "roundtrip-differs"
  | "target-not-empty"
  | "timeout";

/**
 * The exit code each kind ends the process with. Interrupts exit 130 and success 0; neither has a
 * kind.
 */
export const kindExitCode: Readonly<Record<Kind, number>> = {
  "cli-bad-argument": 2,
  "cli-path-missing": 2,
  "cli-usage": 2,
  config: 78,
  database: 1,
  "import-refused": 1,
  internal: 70,
  io: 74,
  "not-found": 1,
  "roundtrip-differs": 1,
  "target-not-empty": 1,
  timeout: 1,
};

/**
 * What to do next after a failure of each kind, when the failure has no remedy of its own. Every
 * kind has one, so a failure always ends on a next step.
 */
export const kindHelp: Readonly<Record<Kind, string>> = {
  "cli-bad-argument":
    "Check the value against the command's usage: run `qti <command> --help` to see what it accepts.",
  "cli-path-missing":
    "Name the directory of an unzipped QTI package, or its .zip file, that exists.",
  "cli-usage": "Run `qti --help`, or `qti <command> --help`, to see valid usage.",
  config:
    "Start the local database cluster and migrate it, as the project's AGENTS.md describes, then run the command again.",
  database:
    "Check that the local database cluster is running (`pnpm pg start` in the grizzle clone), then run the command again.",
  "import-refused":
    "Fix the package as the message says, then import it again. Nothing was written.",
  internal:
    "This is a defect in qti. Report it with the command you ran and everything it printed.",
  io: "Check that the path exists, is readable or writable, and that the disk has room, then run the command again.",
  "not-found":
    "Use the id that `qti import` printed when it stored the package, in the same database, or import the package again.",
  "roundtrip-differs": "Compare the package with its export by hand to see which entries differ.",
  "target-not-empty": "Choose an empty or new target, or pass --yes to replace what is there.",
  timeout: "Run the command again with a larger --timeout.",
};

/**
 * The key under which an error this program defines names its kind.
 *
 * {@link describeFailure} reads the kind of an error through this symbol and never through a bare
 * `kind` property, which an error from another library could carry for its own reasons.
 */
export const cliKind: unique symbol = Symbol("qti.cli.kind");

/**
 * The tags of grizzle's public errors (`adapter/public/errors.ts`), in a literal list so the named
 * failures below can leave them out by type.
 */
const grizzleTags = [
  "CommitUnknown",
  "CredentialError",
  "ExecutionFailure",
  "OpenError",
  "ReadFailure",
  "StaleSnapshot",
  "TokenError",
  "TransientFailure",
  "TransportFailure",
] as const;

/**
 * The tags of grizzle's public errors (`adapter/public/errors.ts`), which {@link describeFailure}
 * maps to `database` without importing grizzle, so the program starts without loading it, except a
 * program grizzle refused to compile, which is `internal`.
 */
export const grizzleErrorTags: ReadonlySet<string> = new Set(grizzleTags);

/**
 * The tags of the failures {@link describeFailure} maps to a kind of their own: grizzle's, the
 * file system's, a refused import's and an absent package's.
 */
type KindedTag =
  | (typeof grizzleTags)[number]
  | "ImportRefused"
  | "PackageNotFound"
  | "PlatformError";

/**
 * Every other failure the export ends with (`#pantry/export/package.ts`): the database holds the
 * package, but the export cannot rebuild a document of it from its rows (`assemble`'s refusals,
 * `DocumentRowCount`, `XmlVersionUnread`), page through them (grizzle's `CursorError`) or write it
 * in its charset (crust's `EncodeError`). Each is a defect of qti, never of the package.
 */
export type ExportDefectTag = Exclude<
  Effect.Error<ReturnType<typeof exportPackage>>["_tag"],
  KindedTag
>;

/**
 * Every other way the import ends (`#pantry/import/package.ts`): the codec refusing a value the
 * builders wrote (grizzle's `EncodingFailure`), and the three defects it dies with, a locator that
 * finds no breach of the refusal's laws, laws no rule owns, and two builders that disagree on a
 * row. Each is a defect of qti, never of the package.
 */
export type ImportDefectTag =
  | Exclude<Effect.Error<ReturnType<typeof importPackage>>["_tag"], KindedTag>
  | LocateDisagreement["_tag"]
  | OverlayConflict["_tag"]
  | UnownedLaws["_tag"];

/**
 * What to do next after an export that cannot rebuild a package the database holds.
 */
const exportDefectHelp =
  "This is a defect in qti, not in the package: the database holds the package, but the export cannot rebuild it. Nothing was exported, and the target is as it was. Report it with the command you ran and everything it printed.";

/**
 * What to do next after an import that ended on a defect of qti.
 */
const importDefectHelp =
  "This is a defect in qti, not in the package, and nothing was written. Report it with the command you ran and everything it printed.";

/**
 * What to do next after a refusal the database gave, by the kind of its witness: it names the law
 * and where the law is stated, and names the failing row only when its witness holds one, a key
 * grizzle reported or a row a locator found. A refusal that carries no witness kind names no row.
 */
const databaseRefusalHelp = {
  key: "Find what the law describes in the package, at the row the message names, fix it, then import the package again. Nothing was written.",
  row: "Find what the law describes in the package, at the row the message names, fix it, then import the package again. Nothing was written.",
  unreported:
    "The database names no row for this law, so find what the law describes in the package by the law's source, fix it, then import the package again. Nothing was written.",
} as const satisfies Readonly<Record<NonNullable<RefusalFields["witness"]>, string>>;

/**
 * A tag {@link namedFailureOf} names: one of the export's defects or the import's.
 */
type NamedTag = ExportDefectTag | ImportDefectTag;

/**
 * The help of each named failure, by its tag: every export defect's is {@link exportDefectHelp}
 * and every import defect's {@link importDefectHelp}. It is checked against both error unions both
 * ways, so a failure either gains fails to compile here until it is named, and one it loses until
 * its row goes. Each such failure's kind is `internal`, which {@link kindOf} gives any failure no
 * other kind claims, so its exit code is that kind's.
 */
const namedHelp = {
  CursorError: exportDefectHelp,
  DocumentRowCount: exportDefectHelp,
  EncodeError: exportDefectHelp,
  EncodingFailure: importDefectHelp,
  LocateDisagreement: importDefectHelp,
  OverlayConflict: importDefectHelp,
  RootMissing: exportDefectHelp,
  RowMissing: exportDefectHelp,
  RowsOutsideImage: exportDefectHelp,
  UnownedLaws: importDefectHelp,
  XmlVersionUnread: exportDefectHelp,
} as const satisfies Readonly<Record<NamedTag, string>>;

/**
 * Test whether a tag is one {@link namedHelp} names.
 *
 * @param tag - A failure's tag.
 * @returns Whether it is a named failure's.
 */
const isNamedTag = (tag: string): tag is NamedTag => Object.hasOwn(namedHelp, tag);

/**
 * The path the person named is not there, or is neither a directory nor a `.zip` file.
 */
export class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {
  /**
   * This error's kind, `cli-path-missing`. A getter, so the kind stays on the prototype and is no
   * field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "cli-path-missing";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * The path and what to do about it.
   */
  override get message(): string {
    return `${this.path} is not a directory or a .zip file.`;
  }

  /**
   * What to do about it.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Name the directory of an unzipped QTI package, or its .zip file.";
  }
}

/**
 * A round trip whose export differs from its source in at least one entry.
 */
export class RoundtripDiffers extends Schema.TaggedError<RoundtripDiffers>()("RoundtripDiffers", {
  differing: Schema.Number,
  exportDir: Schema.String,
}) {
  /**
   * This error's kind, `roundtrip-differs`. A getter, so the kind stays on the prototype and is no
   * field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "roundtrip-differs";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * How many entries differ and where the export is, for comparing by hand.
   */
  override get message(): string {
    return `${this.differing} entries differ between the package and its export in ${this.exportDir}.`;
  }

  /**
   * How to see which entries differ.
   */
  get help(): string {
    return `Run \`diff -r <dir> ${this.exportDir}\`, with the package you named for <dir>, to see which entries differ.`;
  }
}

/**
 * What kind a failure is, the exit code that kind ends the process with, and what to do next.
 */
export interface FailureDescription {
  readonly exitCode: number;
  readonly help: string;
  readonly kind: Kind;
}

/**
 * Whether `value` names one of the kinds of {@link Kind}.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The value is read off an object of unknown origin, and this is the check that parses it.
const isKind = (value: unknown): value is Kind =>
  Predicate.isString(value) && Object.hasOwn(kindExitCode, value);

/**
 * The `_tag` of a failure, when it carries a string one.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const tagOf = (failure: unknown): string | undefined =>
  Predicate.hasProperty(failure, "_tag") && Predicate.isString(failure._tag)
    ? failure._tag
    : undefined;

/**
 * The tag of a failure qti can name though its kind is `internal`: one of the export's defects or
 * the import's, which a run prints by that tag and with the help of its own.
 *
 * @param failure - What a run failed or died with.
 * @returns The failure's tag, or none for any other failure.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
export const namedFailureOf = (failure: unknown): Option.Option<NamedTag> =>
  Option.filter(Option.fromUndefinedOr(tagOf(failure)), isNamedTag);

/**
 * The tags of the failures that mean the local set-up is missing or unreadable: the layer's two
 * (`db/connection.ts` and `db/layer.ts`) and Effect's `ConfigError`, which a missing or malformed
 * setting raises. They are matched by tag so this module imports neither the layer nor the engine.
 */
const configTags: ReadonlySet<string> = new Set([
  "ClusterConfigError",
  "ConfigError",
  "SnapshotLoadError",
]);

/**
 * Whether `failure` is grizzle's report of a password file that could not be read. grizzle never
 * raises a bare `CredentialError`: an `OpenError` carries it as its `reason`, and a write's failed
 * acquisition is a `TransportFailure` that does.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const isCredentialFailure = (failure: unknown): boolean =>
  (tagOf(failure) === "OpenError" || tagOf(failure) === "TransportFailure") &&
  Predicate.hasProperty(failure, "reason") &&
  tagOf(failure.reason) === "CredentialError";

/**
 * Whether `failure` is grizzle refusing to compile one of qti's programs, before any SQL is sent:
 * an `ExecutionFailure` (a ChangeSet that `db.apply` compiles) or an `OpenError` (the schema and
 * the workload that `DbLayer.make` and `Db.open` compile) whose `reason` is a `CompileError`, such
 * as the `UnsupportedOperation` of a value grizzle's write filler cannot fill. The cause is qti's
 * schema or program, the same for every package, so retrying or checking the cluster cannot help.
 * It is matched by tag, so this module imports neither grizzle nor its engine.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const isUncompiled = (failure: unknown): boolean =>
  (tagOf(failure) === "ExecutionFailure" || tagOf(failure) === "OpenError") &&
  Predicate.hasProperty(failure, "reason") &&
  tagOf(failure.reason) === "CompileError";

/**
 * What to do next after grizzle refused to compile one of qti's programs ({@link isUncompiled}).
 */
const uncompiledHelp =
  "This is a defect in qti, not in the package or the database: grizzle refused to compile qti's program before sending any SQL, so the database is as it was. Report it with the command you ran and everything it printed.";

/**
 * Name the kind of a failure by what it is.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const kindOf = (failure: unknown): Kind => {
  if (Predicate.hasProperty(failure, cliKind)) {
    const own = failure[cliKind];

    return isKind(own) ? own : "internal";
  }

  if (CliError.isCliError(failure)) {
    return "cli-usage";
  }

  const tag = tagOf(failure);

  if (tag === "ImportRefused") {
    return "import-refused";
  }

  if (tag === "PackageNotFound") {
    return "not-found";
  }

  if (tag === "PlatformError") {
    return "io";
  }

  if ((tag !== undefined && configTags.has(tag)) || isCredentialFailure(failure)) {
    return "config";
  }

  if (isUncompiled(failure)) {
    return "internal";
  }

  return tag !== undefined && grizzleErrorTags.has(tag) ? "database" : "internal";
};

/**
 * What to do next: the failure's own `help` when this program defined it and it has one; for a
 * named failure (`namedFailureOf`) the help of its own; for a program grizzle refused to compile
 * (`isUncompiled`), that a defect of qti left the database as it was; for a refusal the database
 * gave, the help of a law's refusal by the kind of its witness; else the help of its kind.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const helpOf = (failure: unknown, kind: Kind): string => {
  if (
    Predicate.hasProperty(failure, cliKind) &&
    Predicate.hasProperty(failure, "help") &&
    Predicate.isString(failure.help) &&
    failure.help !== ""
  ) {
    return failure.help;
  }

  const named = Option.map(namedFailureOf(failure), (tag) => namedHelp[tag]);
  if (Option.isSome(named)) {
    return named.value;
  }

  if (isUncompiled(failure)) {
    return uncompiledHelp;
  }

  return Option.match(Option.filter(refusalFieldsOf(failure), refusedByDatabase), {
    onNone: () => kindHelp[kind],
    onSome: ({ witness }) => databaseRefusalHelp[witness ?? "unreported"],
  });
};

/**
 * The kind of a failure.
 *
 * An error this program defines names its own kind through {@link cliKind}. Every other failure is
 * mapped by what it is, without importing the module that defines it, so the program starts
 * without loading the engine: Effect's CLI errors are `cli-usage`, an `ImportRefused` is
 * `import-refused`, a `PackageNotFound` is `not-found`, a `PlatformError` is `io`, a missing or
 * unreadable local set-up is `config`, a program grizzle refused to compile before sending any SQL
 * is `internal`, and grizzle's other errors are `database`. Anything else, a defect included, is
 * `internal`; the export's and the import's defects that {@link namedFailureOf} names keep that
 * kind, with a help of their own.
 *
 * @param failure - What a run failed with: the squashed cause of its exit.
 * @returns The kind, the exit code of that kind, and what to do next.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A squashed cause can be any value, and this function is what parses it into a kind.
export const describeFailure = (failure: unknown): FailureDescription => {
  const kind = kindOf(failure);

  return { exitCode: kindExitCode[kind], help: helpOf(failure, kind), kind };
};
