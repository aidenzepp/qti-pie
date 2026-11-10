import { Array as Arr, Cause, Console, Effect, Option, Predicate, Schema } from "effect";
import type { Types } from "effect";
import { CliError, CliOutput } from "effect/cli";
import type { HelpDoc } from "effect/cli";
import { describeFailure, kindExitCode, kindHelp, namedFailureOf } from "#pantry/cli/errors.ts";
import type { FailureDescription } from "#pantry/cli/errors.ts";
import { ErrorObject } from "#pantry/cli/output.ts";
import type { LawFact, OutputMode } from "#pantry/cli/output.ts";
import { databaseRefusalOf, refusalFieldsOf } from "#pantry/cli/refused.ts";
import type { DatabaseRefusal } from "#pantry/cli/refused.ts";

/**
 * Lay a failure out as supdoc does: its kind and what failed on one line, then what to do next.
 *
 * @param description - The failure's kind and help.
 * @param message - What failed. Lines after the first are indented under the first.
 * @param details - Lines to print between the message and the help, each already labelled.
 * @returns The text to print, without a final line feed.
 */
const layOut = (
  description: Pick<FailureDescription, "help" | "kind">,
  message: string,
  details: readonly string[] = [],
): string =>
  [
    `error[${description.kind}]: ${message.replaceAll("\n", "\n  ")}`,
    ...details.map((detail) => `  ${detail}`),
    `  = help: ${description.help}`,
  ].join("\n");

/**
 * The names of the commands `helpDoc` can run next: its subcommands, taken from the command tree
 * so a command added later joins the list.
 */
const validCommands = (helpDoc: HelpDoc.HelpDoc): readonly string[] =>
  (helpDoc.subcommands ?? []).flatMap(({ commands }) => commands.map(({ name }) => name));

/**
 * The fields of crust's `EncodeError`, which carries no message of its own: the construct that
 * cannot carry a code point in the document's charset, the code point, and the highest one the
 * charset's encoder writes.
 */
const EncodeFields = Schema.Struct({
  _tag: Schema.Literal("EncodeError"),
  codePoint: Schema.Number,
  threshold: Schema.Number,
  where: Schema.String,
});

const encodeFieldsOf = Schema.decodeUnknownOption(EncodeFields);

/**
 * Spell a code point as `U+` and at least four hexadecimal digits.
 */
const codePointText = (codePoint: number): string =>
  `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;

/**
 * The message of a failure: its `message` when it has a non-empty string one, a sentence built
 * from its fields for crust's `EncodeError`, which has none, else the failure as text.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value.
const messageOf = (failure: unknown): string => {
  if (
    Predicate.hasProperty(failure, "message") &&
    Predicate.isString(failure.message) &&
    failure.message !== ""
  ) {
    return failure.message;
  }

  return Option.match(encodeFieldsOf(failure), {
    onNone: () => String(failure),
    onSome: ({ codePoint, threshold, where }) =>
      where === "label"
        ? "The export has no encoder for a document's charset label, so it cannot write the document."
        : `The export cannot write a document's ${where}: it holds ${codePointText(codePoint)}, and the document's charset writes code points up to ${codePointText(threshold)} there.`,
  });
};

/**
 * How this run prints a failure: in which mode, and the name of the command the person ran.
 */
export interface Presentation {
  /**
   * The subcommand the raw arguments name, or the root's name when they name none.
   */
  readonly command: string;
  /**
   * The output mode the run reads before it parses anything.
   */
  readonly mode: OutputMode;
}

/**
 * The root's global flags that take a value, as the command line spells them. The runner's `-v`
 * rewrite and the command lookup both skip the word after one of these.
 */
export const valuedGlobalFlags: readonly string[] = ["--log-level", "--output", "--timeout"];

/**
 * Test whether the argument at `index` is the value of a valued global flag: the word before it is
 * one of {@link valuedGlobalFlags}. The first argument follows no word.
 *
 * @param args - The command line after the program name.
 * @param index - The argument's index.
 * @returns Whether a valued global flag takes it.
 */
export const followsValuedFlag = (args: readonly string[], index: number): boolean =>
  Option.exists(Arr.get(args, index - 1), (previous) => valuedGlobalFlags.includes(previous));

/**
 * The subcommand the arguments name: the first word that is neither a flag nor a flag's value,
 * when it is one of `names`, else `fallback`.
 *
 * @param args - The command line after the program name.
 * @param names - The subcommands the root has.
 * @param fallback - The name to use when the arguments name no subcommand.
 * @returns The subcommand's name or `fallback`.
 */
export const commandOfArguments = (
  args: readonly string[],
  names: readonly string[],
  fallback: string,
): string => {
  const end = args.indexOf("--");
  const before = end === -1 ? args : args.slice(0, end);
  const word = before.find(
    (arg, index) => !arg.startsWith("-") && !followsValuedFlag(before, index),
  );

  return word !== undefined && names.includes(word) ? word : fallback;
};

/**
 * What a usage error is, which `Command.run` presents before any failure reaches the printer.
 */
const usage: FailureDescription = {
  exitCode: kindExitCode["cli-usage"],
  help: kindHelp["cli-usage"],
  kind: "cli-usage",
};

const encodeErrorObject = Schema.encodeSync(Schema.fromJsonString(ErrorObject));

/**
 * What a failure carries besides its kind and message, read from its fields: the tag of a named
 * `internal` failure, and the rules of a refused import, with how grizzle decided its laws, the
 * laws, their sources and the kind of its witness when the database refused it.
 */
interface Facts {
  readonly failure?: string;
  readonly laws?: readonly LawFact[];
  readonly refused_kind?: DatabaseRefusal["kind"];
  readonly rules?: readonly string[];
  readonly sources?: readonly string[];
  readonly witness?: DatabaseRefusal["witness"];
}

/**
 * Read the facts of a failure: its tag when {@link namedFailureOf} names it, and a refused
 * import's rules, decision, laws, sources and witness kind from the refusal's fields, never from
 * its message.
 *
 * @param failure - What a run failed or died with.
 * @returns The facts; none of them for any other failure.
 */
const factsOf = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value.
  failure: unknown,
): Facts => {
  const facts: Types.Mutable<Facts> = {};
  const named = namedFailureOf(failure);
  if (Option.isSome(named)) {
    facts.failure = named.value;
  }

  const fields = refusalFieldsOf(failure);
  if (Option.isNone(fields)) {
    return facts;
  }

  facts.rules = fields.value.rules;
  const database = databaseRefusalOf(fields.value);
  if (Option.isSome(database)) {
    facts.refused_kind = database.value.kind;
    facts.laws = database.value.laws;
    facts.sources = database.value.sources;
    facts.witness = database.value.witness;
  }

  return facts;
};

/**
 * What each way grizzle decides a refusal's laws tells the person about them, so a refusal under
 * several rules never reads as several breaches the database did not report.
 */
const refusedKindText = {
  every: "every law named is broken",
  first: "the laws of the first check the database tried, and the package may break others too",
  some: "at least one law named is broken, and the database does not say which",
} as const satisfies Readonly<Record<DatabaseRefusal["kind"], string>>;

/**
 * Text mode's lines for a failure's facts: the named failure's tag, how grizzle decided a refused
 * import's laws, and each of their sources. The rules and the laws are in the refusal's message
 * already.
 *
 * @param facts - The failure's facts.
 * @returns The labelled lines.
 */
const factLines = (facts: Facts): readonly string[] => [
  ...(facts.failure === undefined ? [] : [`failure: ${facts.failure}`]),
  ...(facts.refused_kind === undefined
    ? []
    : [`refused: ${facts.refused_kind}, ${refusedKindText[facts.refused_kind]}`]),
  ...(facts.sources ?? []).map((source) => `source: ${source}`),
];

/**
 * What to print for a failure: the text shape in `text`, one error object in `json` and `jsonl`.
 *
 * @param shown - The mode and the command's name.
 * @param description - The failure's kind, help and exit code.
 * @param message - What failed, in words.
 * @param details - Text mode's lines between the message and the help, before the facts' own.
 * @param facts - What the failure carries besides its message.
 * @returns The line or lines to print, without a final line feed.
 */
const render = (
  shown: Presentation,
  description: FailureDescription,
  message: string,
  details: readonly string[] = [],
  facts: Facts = {},
): string => {
  if (shown.mode === "text") {
    return layOut(description, message, [...details, ...factLines(facts)]);
  }

  return encodeErrorObject({
    command: shown.command,
    error: true,
    exit_code: description.exitCode,
    help: description.help,
    kind: description.kind,
    message,
    ok: false,
    schema_version: 1,
    ...facts,
  });
};

/**
 * Presents Effect's help, version and usage-error events.
 *
 * Help and version were asked for, so they stay on standard output. A mistyped command is a
 * failure, so it joins the others on standard error: what was wrong, the command's one usage line
 * and the commands that exist, in the shape of {@link printFailures}, or one error object under
 * `json` and `jsonl`.
 *
 * @param shown - The mode and the command's name.
 * @returns The presenter.
 */
export const presenterFor = (shown: Presentation): CliOutput.Presenter => ({
  present: (event) =>
    event._tag === "InvalidInvocation"
      ? Console.error(
          render(shown, usage, event.errors.map(({ message }) => message).join("\n"), [
            `usage: ${event.helpDoc.usage}`,
            ...(validCommands(event.helpDoc).length === 0
              ? []
              : [`commands: ${validCommands(event.helpDoc).join(", ")}`]),
          ]),
        )
      : CliOutput.defaultPresenter.present(event),
});

/**
 * Effect's formatter, except that a handler's own usage failure (the conflicting output modes)
 * prints as every other failure does, in the run's mode.
 *
 * @param shown - The mode and the command's name.
 * @returns The formatter `Command.run` renders such a failure with.
 */
export const formatterFor = (shown: Presentation): CliOutput.Formatter => {
  const base = CliOutput.defaultFormatter();

  return {
    formatCliError: base.formatCliError,
    formatError: (error) => render(shown, describeFailure(error), error.message),
    formatErrors: base.formatErrors,
    formatHelpDoc: base.formatHelpDoc,
    formatVersion: base.formatVersion,
  };
};

/**
 * What to print for a defect: an `error[internal]:` line, then in `text` the defect's pretty
 * cause, the one case a stack is wanted. A defect {@link namedFailureOf} names, such as two of the
 * importer's builders that disagree on a row, prints its own message and help and its tag; any
 * other prints as an unexpected failure, and under `json` its message alone.
 *
 * @param shown - The mode and the command's name.
 * @param defect - What the run died with.
 * @returns The line or lines to print, without a final line feed.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A defect can be any value.
const renderDefect = (shown: Presentation, defect: unknown): string => {
  const trace = Cause.pretty(Cause.die(defect));

  return Option.match(namedFailureOf(defect), {
    onNone: () => {
      const internal: FailureDescription = {
        exitCode: kindExitCode.internal,
        help: kindHelp.internal,
        kind: "internal",
      };

      return shown.mode === "text"
        ? [layOut(internal, "an unexpected failure ended the run."), trace].join("\n")
        : render(shown, internal, `an unexpected failure ended the run: ${messageOf(defect)}`);
    },
    onSome: (tag) => {
      const description = describeFailure(defect);
      const facts: Facts = { failure: tag };

      return shown.mode === "text"
        ? [layOut(description, messageOf(defect), factLines(facts)), trace].join("\n")
        : render(shown, description, messageOf(defect), [], facts);
    },
  });
};

/**
 * Print how a run failed, and leave the failure as it was.
 *
 * A failure prints as `error[<kind>]:` with its message and `= help:` with what to do next, or as
 * one error object under `json` and `jsonl`; `Command.run` has already presented a usage error. A
 * refused import adds where each of its laws is stated, and a named `internal` failure its tag
 * (`factsOf`). A defect prints as {@link renderDefect} lays it out.
 *
 * @param shown - The mode and the command's name.
 * @returns A function from a run to the same run, printing its failure to standard error on the
 *   way out.
 */
export const printFailures =
  (shown: Presentation) =>
  <A, E, R>(run: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    run.pipe(
      Effect.tapError((failure) =>
        CliError.isCliError(failure)
          ? Effect.void
          : Console.error(
              render(shown, describeFailure(failure), messageOf(failure), [], factsOf(failure)),
            ),
      ),
      Effect.tapDefect((defect) => Console.error(renderDefect(shown, defect))),
    );
