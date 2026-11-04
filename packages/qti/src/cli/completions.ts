import { Console, Effect } from "effect";
import { Argument, Command, Completions } from "effect/cli";

/**
 * The shells a completion script can be written for.
 */
const shells = [
  "bash",
  "zsh",
  "fish",
  "powershell",
] as const satisfies readonly Completions.Shell[];

/**
 * Print the completion script of `root` for one shell: `bash`, `zsh`, `fish` or `powershell`.
 *
 * It reads no configuration and no database. The root arrives through a function so this module
 * never imports the root, which imports it.
 *
 * @param root - The program's root command, read when the command runs.
 */
export const completionsCommand = (root: () => Command.Command.Any) =>
  Command.make(
    "completions",
    { shell: Argument.Literals("shell", shells) },
    Effect.fn("cli.completions")(function* completionsHandler({ shell }) {
      yield* Console.log(Completions.generate("qti", shell, Completions.fromCommand(root())));
    }),
  ).pipe(
    Command.withDescription("Print a shell completion script for qti"),
    Command.withExamples([
      {
        command: "qti completions zsh",
        description: "Print the zsh completion script",
      },
    ]),
  );
