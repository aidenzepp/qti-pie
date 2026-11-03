/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * How long a command may run: the `--timeout` setting, the error a run that outlasts it fails with,
 * and the bound the root puts on the chosen handler.
 */
import { Config, Duration, Effect, Option, Predicate, Runtime, Schema } from "effect";
import type { Command as CommandType } from "effect/cli";
import { CliError, Command, Flag, GlobalFlag } from "effect/cli";
import { cliKind, kindExitCode } from "#qti/cli/errors.ts";
import type { Kind } from "#qti/cli/errors.ts";

/**
 * The limit a command has when neither `--timeout` nor `QTI_TIMEOUT` names one. Provisional: the
 * phase freeze checks it against the slowest corpus round trip.
 */
export const defaultTimeout = Duration.minutes(5);

/**
 * The `--timeout` setting: how long a command may run, as a duration such as `30 seconds` or
 * `10 minutes`.
 */
export const timeoutSetting = GlobalFlag.Setting("timeout")({
  flag: Flag.String("timeout").pipe(
    Flag.withSchema(Schema.DurationFromString),
    Flag.filterMap(
      (given) => (Duration.isPositive(given) ? Option.some(given) : Option.none()),
      (given) => `${Duration.format(given)} is not a positive duration`,
    ),
    Flag.withFallbackConfig(Config.schema(Schema.DurationFromString, "QTI_TIMEOUT")),
    Flag.withDefault(defaultTimeout),
    Flag.withMetavar("duration"),
    Flag.withDescription(
      "Stop the command after this long, e.g. '30 seconds' or '10 minutes' [env: QTI_TIMEOUT] [default: 5 minutes]",
    ),
  ),
});

/**
 * The timeout setting, for the root command's `Command.withGlobalFlags`.
 */
export const timeoutGlobalFlags = [timeoutSetting] as const;

/**
 * A command that did not finish inside its `--timeout`, and was stopped.
 *
 * The stop interrupts the handler where it is, so what it had already written stays written. The
 * error never says otherwise, and never says nothing was written.
 */
export class CommandTimedOut extends Schema.TaggedError<CommandTimedOut>()("CommandTimedOut", {
  after: Schema.String,
}) {
  /**
   * This error's kind, `timeout`. A getter, so the kind stays on the prototype and is no field of
   * the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "timeout";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * How long the command had.
   */
  override get message(): string {
    return `The command did not finish within ${this.after} and was stopped.`;
  }

  /**
   * What to try next.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get help(): string {
    return "Give --timeout, or QTI_TIMEOUT, a longer limit, or check that the database cluster answers with `pnpm pg:doctor` in the grizzle clone.";
  }
}

/**
 * Bound the command's handler, and the chosen subcommand's under it, by the `--timeout` setting.
 *
 * Apply it to the command that holds the settings (the root), where it runs the handler `Command`
 * would have run, unchanged, inside `Effect.timeout`. When the limit passes first the handler is
 * interrupted and the run fails with {@link CommandTimedOut}.
 */
export const withTimeout = <Name extends string, Input, ContextInput, E, R>(
  self: CommandType.Command<Name, Input, ContextInput, E, R>,
) => {
  // SAFETY: `Command` has no public way to wrap a handler, but every command it builds carries its
  // handler as `handle(input, commandPath)`, which `Command.run` itself calls with `[name]` for the
  // root. The type is the one `effect/cli`'s internal `CommandInternal.handle` declares.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  const handle = (Predicate.hasProperty(self, "handle") ? self.handle : undefined) as
    | ((
        input: Input,
        commandPath: readonly string[],
      ) => Effect.Effect<void, E | CliError.CliError, R | CommandType.Environment>)
    | undefined;

  return Command.withHandler(
    self,
    Effect.fn("cli.withTimeout")(function* bounded(input: Input) {
      const limit = yield* timeoutSetting;

      if (handle === undefined) {
        return yield* new CliError.ShowHelp({ commandPath: [self.name], errors: [] });
      }

      return yield* handle(input, [self.name]).pipe(
        Effect.timeoutOrElse({
          duration: limit,
          orElse: () => Effect.fail(new CommandTimedOut({ after: Duration.format(limit) })),
        }),
      );
    }),
  );
};
