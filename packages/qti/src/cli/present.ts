import { Cause, Console, Effect } from "effect";
import { CliError, CliOutput } from "effect/cli";

/**
 * Presents Effect's help, version and usage-error events.
 *
 * Help and version were asked for, so they stay on standard output. A mistyped command's help is a
 * diagnostic, so it joins its errors on standard error.
 */
export const presenter: CliOutput.Presenter = {
  present: (event) =>
    event._tag === "InvalidInvocation"
      ? Effect.gen(function* presentInvalidInvocation() {
          const formatter = yield* CliOutput.Formatter;

          yield* Console.error(formatter.formatHelpDoc(event.helpDoc));
          yield* Console.error(formatter.formatErrors(event.errors));
        })
      : CliOutput.defaultPresenter.present(event),
};

/**
 * Print how a run failed, and leave the failure as it was.
 *
 * A refusal prints its message once; `Command.run` has already presented a usage error. A defect
 * keeps its pretty cause, the one case a stack is wanted.
 *
 * @param run - The command line's run.
 * @returns The same run, printing its failure to standard error on the way out.
 */
export const printFailures = <A, E extends { readonly message: string }, R>(
  run: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> =>
  run.pipe(
    Effect.tapError((failure) =>
      CliError.isCliError(failure) ? Effect.void : Console.error(failure.message),
    ),
    Effect.tapDefect((defect) => Console.error(Cause.pretty(Cause.die(defect)))),
  );
