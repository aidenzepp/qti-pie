/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * How the program's failures are told apart: the closed roster of kinds a failure may have, the
 * exit code each kind ends the process with, and {@link describeFailure}, which names the kind of
 * any failure a run ends with.
 */
import { Predicate, Runtime, Schema } from "effect";
import { CliError } from "effect/cli";

/**
 * Every kind a failure of this program has.
 *
 * - Exit 1, refused or the work failed: `import-refused`, `roundtrip-differs`, `target-not-empty`,
 *   `skill-target-outside`, `timeout`, `database`, `not-found`.
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
  | "skill-target-outside"
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
  "skill-target-outside": 1,
  "target-not-empty": 1,
  timeout: 1,
};

/**
 * The key under which an error this program defines names its kind.
 *
 * {@link describeFailure} reads the kind of an error through this symbol and never through a bare
 * `kind` property, which an error from another library could carry for its own reasons.
 */
export const cliKind: unique symbol = Symbol("qti.cli.kind");

/**
 * The tags of grizzle's public errors (`adapter/public/errors.ts`), which {@link describeFailure}
 * maps to `database` without importing grizzle, so the program starts without loading it.
 */
export const grizzleErrorTags: ReadonlySet<string> = new Set([
  "CommitUnknown",
  "CredentialError",
  "ExecutionFailure",
  "OpenError",
  "ReadFailure",
  "StaleSnapshot",
  "TokenError",
  "TransientFailure",
  "TransportFailure",
]);

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
    return `${this.path} is not a directory or a .zip file. Name the directory of an unzipped QTI package, or its .zip file.`;
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
}

/**
 * What kind a failure is, and the exit code that kind ends the process with.
 */
export interface FailureDescription {
  readonly exitCode: number;
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
 * The tags of the failures that mean the local set-up is missing or unreadable: the layer's two
 * (`db/layer.ts`) and Effect's `ConfigError`, which a missing or malformed setting raises. They are
 * matched by tag so this module imports neither the layer nor the engine.
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

  if (tag === "PlatformError") {
    return "io";
  }

  if ((tag !== undefined && configTags.has(tag)) || isCredentialFailure(failure)) {
    return "config";
  }

  return tag !== undefined && grizzleErrorTags.has(tag) ? "database" : "internal";
};

/**
 * The kind of a failure.
 *
 * An error this program defines names its own kind through {@link cliKind}. Every other failure is
 * mapped by what it is, without importing the module that defines it, so the program starts
 * without loading the engine: Effect's CLI errors are `cli-usage`, an `ImportRefused` is
 * `import-refused`, a `PlatformError` is `io`, a missing or unreadable local set-up is `config`
 * and grizzle's other errors are `database`. Anything else, a defect included, is `internal`.
 *
 * @param failure - What a run failed with: the squashed cause of its exit.
 * @returns The kind and the exit code of that kind.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A squashed cause can be any value, and this function is what parses it into a kind.
export const describeFailure = (failure: unknown): FailureDescription => {
  const kind = kindOf(failure);

  return { exitCode: kindExitCode[kind], kind };
};
