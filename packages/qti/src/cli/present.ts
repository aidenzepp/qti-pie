import { Cause, Console, Effect, Predicate } from "effect";
import { CliError, CliOutput } from "effect/cli";
import type { HelpDoc } from "effect/cli";
import { describeFailure, kindHelp } from "#qti/cli/errors.ts";
import type { FailureDescription } from "#qti/cli/errors.ts";

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
 * Presents Effect's help, version and usage-error events.
 *
 * Help and version were asked for, so they stay on standard output. A mistyped command is a
 * failure, so it joins the others on standard error: what was wrong, the command's one usage line
 * and the commands that exist, in the shape of {@link printFailures}.
 */
export const presenter: CliOutput.Presenter = {
  present: (event) =>
    event._tag === "InvalidInvocation"
      ? Console.error(
          layOut(
            { help: kindHelp["cli-usage"], kind: "cli-usage" },
            event.errors.map(({ message }) => message).join("\n"),
            [
              `usage: ${event.helpDoc.usage}`,
              ...(validCommands(event.helpDoc).length === 0
                ? []
                : [`commands: ${validCommands(event.helpDoc).join(", ")}`]),
            ],
          ),
        )
      : CliOutput.defaultPresenter.present(event),
};

/**
 * Print how a run failed, and leave the failure as it was.
 *
 * A failure prints as `error[<kind>]:` with its message and `= help:` with what to do next;
 * `Command.run` has already presented a usage error. A defect prints its pretty cause after an
 * `error[internal]:` line, the one case a stack is wanted.
 *
 * @param run - The command line's run.
 * @returns The same run, printing its failure to standard error on the way out.
 */
export const printFailures = <A, E, R>(run: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  run.pipe(
    Effect.tapError((failure) =>
      CliError.isCliError(failure)
        ? Effect.void
        : Console.error(layOut(describeFailure(failure), messageOf(failure))),
    ),
    Effect.tapDefect((defect) =>
      Console.error(
        [
          layOut(
            { help: kindHelp.internal, kind: "internal" },
            "an unexpected failure ended the run.",
          ),
          Cause.pretty(Cause.die(defect)),
        ].join("\n"),
      ),
    ),
  );
