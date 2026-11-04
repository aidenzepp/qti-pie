import { Cause, Console, Effect, Predicate, Schema } from "effect";
import { CliError, CliOutput } from "effect/cli";
import type { HelpDoc } from "effect/cli";
import { describeFailure, kindExitCode, kindHelp } from "#pantry/cli/errors.ts";
import type { FailureDescription } from "#pantry/cli/errors.ts";
import { ErrorObject } from "#pantry/cli/output.ts";
import type { OutputMode } from "#pantry/cli/output.ts";

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
 * The message of a failure: its `message` when it has a string one, else the failure as text.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value.
const messageOf = (failure: unknown): string =>
  Predicate.hasProperty(failure, "message") && Predicate.isString(failure.message)
    ? failure.message
    : String(failure);

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
    (arg, index) => !arg.startsWith("-") && !valuedGlobalFlags.includes(before[index - 1] ?? ""),
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
 * What to print for a failure: the text shape in `text`, one error object in `json` and `jsonl`.
 *
 * @param shown - The mode and the command's name.
 * @param description - The failure's kind, help and exit code.
 * @param message - What failed, in words.
 * @param details - Text mode's lines between the message and the help.
 * @param rule - The import rule that refused the package, when one did.
 * @returns The line or lines to print, without a final line feed.
 */
const render = (
  shown: Presentation,
  description: FailureDescription,
  message: string,
  details: readonly string[] = [],
  rule?: string,
): string => {
  if (shown.mode === "text") {
    return layOut(description, message, details);
  }

  const object = {
    command: shown.command,
    error: true,
    exit_code: description.exitCode,
    help: description.help,
    kind: description.kind,
    message,
    ok: false,
    schema_version: 1,
  } as const;

  return encodeErrorObject(rule === undefined ? object : { ...object, rule });
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
 * Print how a run failed, and leave the failure as it was.
 *
 * A failure prints as `error[<kind>]:` with its message and `= help:` with what to do next, or as
 * one error object under `json` and `jsonl`; `Command.run` has already presented a usage error. A
 * defect prints its pretty cause after an `error[internal]:` line, the one case a stack is wanted
 * (under `json` the object carries the defect's message alone).
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
              render(
                shown,
                describeFailure(failure),
                messageOf(failure),
                [],
                Predicate.hasProperty(failure, "rule") && Predicate.isString(failure.rule)
                  ? failure.rule
                  : undefined,
              ),
            ),
      ),
      Effect.tapDefect((defect) => {
        const internal: FailureDescription = {
          exitCode: kindExitCode.internal,
          help: kindHelp.internal,
          kind: "internal",
        };

        return Console.error(
          shown.mode === "text"
            ? [
                layOut(internal, "an unexpected failure ended the run."),
                Cause.pretty(Cause.die(defect)),
              ].join("\n")
            : render(shown, internal, `an unexpected failure ended the run: ${messageOf(defect)}`),
        );
      }),
    );
