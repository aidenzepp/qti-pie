import { GlobalFlag } from "effect/cli";

/**
 * The built-in global flags the command line runs with, in the order Effect checks them: help,
 * version, wizard, completions and log level.
 */
export const builtIns: readonly GlobalFlag.BuiltIn[] = [
  GlobalFlag.Help,
  GlobalFlag.Version,
  GlobalFlag.Wizard,
  GlobalFlag.Completions,
  GlobalFlag.LogLevel,
];
