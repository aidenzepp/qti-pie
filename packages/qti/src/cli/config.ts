import { Effect } from "effect";
import { CliOutput, Flag, GlobalFlag } from "effect/cli";

/**
 * The `--version` built-in with the alias `V`. Effect's own `Version` takes `-v`, which this
 * program gives to `--verbose` (see `rewriteVerbose`), so the runner provides this action in its
 * place.
 */
const version: GlobalFlag.Action<boolean> = GlobalFlag.Action({
  flag: Flag.Boolean("version").pipe(
    Flag.withAlias("V"),
    Flag.withDescription("Show version information"),
    Flag.withDefault(false),
  ),
  run: Effect.fnUntraced(function* showVersion(_, { command, version: number }) {
    const presenter = yield* CliOutput.Presenter;
    yield* presenter.present({ _tag: "Version", name: command.name, version: number });
  }),
});

/**
 * The built-in global flags the command line runs with, in the order Effect checks them: help,
 * version, completions and log level. There is no wizard: the program never prompts, so `--wizard`
 * is an unrecognized flag.
 */
export const builtIns: readonly GlobalFlag.BuiltIn[] = [
  GlobalFlag.Help,
  version,
  GlobalFlag.Completions,
  GlobalFlag.LogLevel,
];
