import { Logger } from "effect";
import { Command } from "effect/cli";
import { exportCommand } from "#qti/cli/export.ts";
import { importCommand } from "#qti/cli/import.ts";
import { roundtripCommand } from "#qti/cli/roundtrip.ts";
import { runMain } from "#qti/cli/run.ts";

/**
 * The command line: `import`, `export` and `roundtrip`.
 */
export const cli = Command.make("qti").pipe(
  Command.withDescription("Import QTI packages into the database and export them back"),
  Command.withSubcommands([importCommand, exportCommand, roundtripCommand]),
  // Log lines are diagnostics: they go to standard error, so standard output carries only the data
  // asked for. The root's handler runs the chosen subcommand's, so this reaches every handler.
  Command.provideSync(Logger.LogToStderr, true),
);

if (import.meta.main) {
  runMain(cli);
}
