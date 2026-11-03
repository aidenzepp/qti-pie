import { Logger } from "effect";
import { Command } from "effect/cli";
import { kindExitCode } from "#qti/cli/errors.ts";
import type { Kind } from "#qti/cli/errors.ts";
import { exportCommand } from "#qti/cli/export.ts";
import { importCommand } from "#qti/cli/import.ts";
import { outputGlobalFlags } from "#qti/cli/output.ts";
import { roundtripCommand } from "#qti/cli/roundtrip.ts";
import { runMain } from "#qti/cli/run.ts";
import { verbosityGlobalFlags, withVerbosity } from "#qti/cli/verbosity.ts";

/**
 * What each exit code means, in the order the help prints them. Codes 0 and 130 have no kind.
 */
const exitCodeMeanings: readonly { readonly code: number; readonly meaning: string }[] = [
  { code: 0, meaning: "success" },
  { code: 1, meaning: "refused, or the work failed" },
  { code: 2, meaning: "the command line is wrong" },
  { code: 70, meaning: "a defect in qti" },
  { code: 74, meaning: "reading the package or writing the output failed" },
  { code: 78, meaning: "the local set-up is missing or unreadable" },
  { code: 130, meaning: "interrupted" },
];

/**
 * The kinds that end with `code`, from {@link kindExitCode}, so the table cannot drift from it.
 */
const kindsOf = (code: number): readonly Kind[] =>
  Object.keys(kindExitCode)
    .filter((kind): kind is Kind => Object.hasOwn(kindExitCode, kind))
    .filter((kind) => kindExitCode[kind] === code)
    .toSorted();

/**
 * The root's long description: what qti does, what it writes, how it ends and where it reads.
 */
const description = [
  "Import QTI packages into the database and export them back.",
  "",
  "  import and roundtrip write the database; export and roundtrip write files. Nothing else is",
  "  written. Every input is a path, a directory or a .zip file; none is read from standard input.",
  "",
  "  Exit codes:",
  ...exitCodeMeanings.map(({ code, meaning }) => {
    const kinds = kindsOf(code);

    return `    ${String(code).padEnd(4)}${meaning}${kinds.length === 0 ? "" : ` (${kinds.join(", ")})`}`;
  }),
].join("\n");

/**
 * The command line: `import`, `export` and `roundtrip`, each printing text, `json` or `jsonl`.
 */
export const cli = Command.make("qti").pipe(
  Command.withDescription(description),
  Command.withExamples([
    { command: "qti import ./my-package", description: "Import a package into the database" },
    {
      command: "qti export ./out 6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
      description: "Write an imported package back to files",
    },
    {
      command: "qti roundtrip ./my-package",
      description: "Import a package, export it and compare the two",
    },
    {
      command: "qti --output json import ./my-package",
      description: "Print the result as one line of JSON, for a program to read",
    },
  ]),
  Command.withSubcommands([importCommand, exportCommand, roundtripCommand]),
  // `--output`, `--json` and `--jsonl` reach every command; a handler reads the mode it prints in.
  Command.withGlobalFlags(outputGlobalFlags),
  // `--quiet` and `--verbose` choose the minimum log level the chosen handler runs at.
  withVerbosity,
  Command.withGlobalFlags(verbosityGlobalFlags),
  // Log lines are diagnostics: they go to standard error, so standard output carries only the data
  // asked for. The root's handler runs the chosen subcommand's, so this reaches every handler.
  Command.provideSync(Logger.LogToStderr, true),
);

if (import.meta.main) {
  runMain(cli);
}
