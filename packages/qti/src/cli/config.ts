import { GlobalFlag } from "effect/cli";

/**
 * The built-in global flags the command line runs with, in the order Effect checks them: help,
 * version, completions and log level. There is no wizard: the program never prompts, so `--wizard`
 * is an unrecognized flag.
 */
export const builtIns: readonly GlobalFlag.BuiltIn[] = [
  GlobalFlag.Help,
  GlobalFlag.Version,
  GlobalFlag.Completions,
  GlobalFlag.LogLevel,
];
