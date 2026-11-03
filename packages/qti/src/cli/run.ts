import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Cause, Effect, Exit } from "effect";
import { CliConfig, CliOutput, Command } from "effect/cli";
import { builtIns } from "#qti/cli/config.ts";
import { describeFailure } from "#qti/cli/errors.ts";
import { presenter, printFailures } from "#qti/cli/present.ts";

/**
 * Run `command` on the arguments `Stdio` supplies, with this program's presenter and built-in
 * flags. The process and every in-process test run through here, so both behave as a shell does.
 *
 * @param command - The command line to run.
 * @param config - The version `--version` prints.
 * @returns The run, which still needs the services the command's handlers use.
 */
export const runCli = <Name extends string, Input, ContextInput, E, R>(
  command: Command.Command<Name, Input, ContextInput, E, R>,
  config: { readonly version: string },
) =>
  Command.run(command, config).pipe(
    Effect.provide(CliOutput.layerPresenter(presenter)),
    Effect.provide(CliConfig.layer({ builtIns })),
  );

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
 * Run `command` as the program: print what failed, provide the Node services and end the process
 * with the run's exit code.
 *
 * @param command - The command line to run.
 */
export const runMain = <
  Name extends string,
  Input,
  ContextInput,
  E extends { readonly message: string },
>(
  command: Command.Command<Name, Input, ContextInput, E, NodeServices.NodeServices>,
): void => {
  NodeRuntime.runMain(
    runCli(command, { version: "0.0.0" }).pipe(printFailures, Effect.provide(NodeServices.layer)),
    {
      disableErrorReporting: true,
      teardown: (exit, onExit) => {
        onExit(exitCodeOf(exit));
      },
    },
  );
};
