import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Cause, Effect, Exit, Option, Stdio } from "effect";
import { CliConfig, CliOutput, Command } from "effect/cli";
import { builtIns } from "#qti/cli/config.ts";
import { describeFailure, kindExitCode } from "#qti/cli/errors.ts";
import { modeOfArguments, modeOfEnvironment } from "#qti/cli/output.ts";
import { commandOfArguments, formatterFor, presenterFor, printFailures } from "#qti/cli/present.ts";

/**
 * Run `command` on the arguments `Stdio` supplies, with this program's presenter and built-in
 * flags, printing what failed. The process and every in-process test run through here, so both
 * behave as a shell does.
 *
 * @param command - The command line to run.
 * @param config - The version `--version` prints.
 * @returns The run, which still needs the services the command's handlers use.
 */
export const runCli = <Name extends string, Input, ContextInput, E, R>(
  command: Command.Command<Name, Input, ContextInput, E, R>,
  config: { readonly version: string },
) =>
  Effect.gen(function* runWithMode() {
    // The mode is read from the raw arguments before `Command.run` parses them, so a parse error
    // under `--json` is JSON too.
    const args = yield* (yield* Stdio.Stdio).args;
    const shown = {
      command: commandOfArguments(
        args,
        command.subcommands.flatMap(({ commands }) => commands.map(({ name }) => name)),
        command.name,
      ),
      mode:
        modeOfArguments(args) ?? Option.getOrElse(yield* modeOfEnvironment, () => "text" as const),
    } as const;

    return yield* Command.run(command, config).pipe(
      printFailures(shown),
      Effect.provide(CliOutput.layerPresenter(presenterFor(shown))),
      Effect.provide(CliOutput.layer(formatterFor(shown))),
      Effect.provide(CliConfig.layer({ builtIns })),
    );
  });

/**
 * The exit code a run ends the process with: 0 for success, 130 when it was only interrupted, and
 * otherwise the code of the kind of its failure.
 *
 * @param exit - How the run ended.
 * @returns The process exit code.
 */
export const exitCodeOf = (exit: Exit.Exit<unknown, unknown>): number => {
  if (Exit.isSuccess(exit)) {
    return 0;
  }

  return Cause.hasInterruptsOnly(exit.cause)
    ? 130
    : describeFailure(Cause.squash(exit.cause)).exitCode;
};

/**
 * End the process when standard output fails, as a shell pipeline expects: a reader that closed
 * early (`qti … | head`) is not an error, so the process exits 0 and says nothing, and any other
 * failure is written once to standard error and exits with the code of the `io` kind.
 *
 * @param error - The error standard output emitted.
 */
const endOnStdoutError = (error: NodeJS.ErrnoException): never => {
  if (error.code === "EPIPE") {
    process.exit(0);
  }

  process.stderr.write(`error[io]: cannot write to standard output: ${error.message}\n`);
  process.exit(kindExitCode.io);
};

/**
 * Run `command` as the program: provide the Node services and end the process with the run's exit
 * code. A closed standard output ends the run quietly (see
 * {@link endOnStdoutError}).
 *
 * @param command - The command line to run.
 */
export const runMain = <Name extends string, Input, ContextInput, E>(
  command: Command.Command<Name, Input, ContextInput, E, NodeServices.NodeServices>,
): void => {
  process.stdout.on("error", endOnStdoutError);
  NodeRuntime.runMain(
    runCli(command, { version: "0.0.0" }).pipe(Effect.provide(NodeServices.layer)),
    {
      disableErrorReporting: true,
      teardown: (exit, onExit) => {
        onExit(exitCodeOf(exit));
      },
    },
  );
};
