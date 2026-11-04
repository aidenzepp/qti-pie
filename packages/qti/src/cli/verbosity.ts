/**
 * How much a run says on standard error: the `--quiet` and `--verbose` settings and the minimum log
 * level they choose.
 */
import { Config, Effect, Option, References } from "effect";
import type { LogLevel } from "effect";
import { CliError, Command, Flag, GlobalFlag } from "effect/cli";

/**
 * The `--quiet` / `-q` setting: log nothing, so standard error holds only errors.
 */
export const quietSetting = GlobalFlag.Setting("quiet")({
  flag: Flag.Boolean("quiet").pipe(
    Flag.withAlias("q"),
    Flag.withFallbackConfig(Config.Boolean("QTI_QUIET")),
    Flag.withDefault(false),
    Flag.withDescription("Only print data and errors [env: QTI_QUIET] [default: false]"),
  ),
});

/**
 * The `--verbose` setting: log in full, down to debug lines.
 */
export const verboseSetting = GlobalFlag.Setting("verbose")({
  flag: Flag.Boolean("verbose").pipe(
    Flag.withFallbackConfig(Config.Boolean("QTI_VERBOSE")),
    Flag.withDefault(false),
    Flag.withDescription("Print debug detail as well [env: QTI_VERBOSE] [default: false]"),
  ),
});

/**
 * The two verbosity settings, for the root command's `Command.withGlobalFlags`.
 */
export const verbosityGlobalFlags = [quietSetting, verboseSetting] as const;

/**
 * The minimum log level this run uses. `--log-level` wins when it is given. Otherwise `--quiet`
 * chooses `None` and `--verbose` chooses `Debug`, and with neither the level the run already has
 * stays.
 *
 * Both flags at once fail with a usage error, so a handler fails before it does any work.
 */
export const minimumLogLevel = Effect.gen(function* resolveMinimumLogLevel() {
  // `Command.run` always provides `--log-level`; reading it as an optional service keeps it out of
  // the command's requirements, as `Command.make` does for a handler.
  const given = Option.flatten(yield* Effect.serviceOption(GlobalFlag.LogLevel));

  if (Option.isSome(given)) {
    return given.value;
  }

  const quiet = yield* quietSetting;
  const verbose = yield* verboseSetting;

  if (quiet && verbose) {
    return yield* new CliError.UserError({
      cause: "conflicting verbosity",
      userMessage: "--quiet and --verbose ask for opposite things. Give one of them.",
    });
  }

  if (quiet) {
    return "None" satisfies LogLevel.LogLevel;
  }

  return verbose ? ("Debug" satisfies LogLevel.LogLevel) : yield* References.MinimumLogLevel;
}).pipe(Effect.withSpan("cli.minimumLogLevel"));

/**
 * Run the command's handler, and the subcommand's under it, at the level {@link minimumLogLevel}
 * chooses.
 */
export const withVerbosity = <Name extends string, Input, ContextInput, E, R>(
  self: Command.Command<Name, Input, ContextInput, E, R>,
) => Command.provideEffect(self, References.MinimumLogLevel, minimumLogLevel);
