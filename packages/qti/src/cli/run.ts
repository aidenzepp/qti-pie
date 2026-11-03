import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import { CliConfig, CliOutput, Command } from "effect/cli";
import { builtIns } from "#qti/cli/config.ts";
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
    { disableErrorReporting: true },
  );
};
