import path from "node:path";
import { Effect, Schema } from "effect";
import { ImportRule } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";

/**
 * One corpus zip's verdict: the tarball member it came from, whether the importer accepted it, and
 * for a refusal the rule it was refused under. An accepted row names no rule (the empty string).
 */
export interface VerdictRow {
  readonly file: string;
  readonly rule: Rule | "";
  readonly verdict: "accepted" | "refused";
}

/**
 * A verdict file could not be rendered or parsed.
 *
 * `detail` names the row or line at fault and the law it broke.
 */
export class VerdictsInvalid extends Schema.TaggedError<VerdictsInvalid>()("VerdictsInvalid", {
  detail: Schema.String,
}) {}

/**
 * The header line of the file: the three columns, tab separated.
 */
const header = "file\tverdict\trule";

const isRule = Schema.is(ImportRule);

/**
 * Whether `value` holds a character the file's layout reserves: a tab or a line break.
 */
const hasReserved = (value: string): boolean => /[\t\r\n]/u.test(value);

/**
 * The row for one file, verdict and rule, or {@link VerdictsInvalid} unless they agree: a refusal
 * names a rule of the roster, an acceptance none.
 *
 * @param where - What the detail points at, such as `row "a.zip"` or `line 3`.
 */
const toRow = (
  where: string,
  file: string,
  verdict: string,
  rule: string,
): Effect.Effect<VerdictRow, VerdictsInvalid> => {
  if (verdict === "accepted") {
    return rule === ""
      ? Effect.succeed({ file, rule, verdict })
      : Effect.fail(
          new VerdictsInvalid({
            detail: `The ${where} is accepted but names the rule "${rule}". Leave the rule empty on an accepted row.`,
          }),
        );
  }

  if (verdict === "refused") {
    if (isRule(rule)) {
      return Effect.succeed({ file, rule, verdict });
    }

    const named = rule === "" ? "empty" : `"${rule}", not a rule of the roster`;

    return Effect.fail(
      new VerdictsInvalid({
        detail: `The ${where} is refused but its rule is ${named}. Name the rule the importer refused it under.`,
      }),
    );
  }

  return Effect.fail(
    new VerdictsInvalid({
      detail: `The ${where} has the verdict "${verdict}". Use "accepted" or "refused".`,
    }),
  );
};

/**
 * Order two strings by UTF-16 code unit, the order of the default sort.
 */
const compareCodeUnits = (a: string, b: string): number => {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
};

/**
 * Render rows as the verdict file's text.
 *
 * The text is the header, then one line per row sorted by `file` in code-unit order, every line
 * ended by a line feed.
 *
 * @param rows - The rows, in any order.
 * @returns The text, or {@link VerdictsInvalid} for a field holding a tab or a line break, or a
 *   row whose rule is empty exactly when its verdict is `refused`.
 */
export const renderVerdicts = Effect.fn("verdicts.render")(function* renderVerdicts(
  rows: readonly VerdictRow[],
) {
  for (const row of rows) {
    const where = `row "${row.file}"`;

    if (hasReserved(row.file)) {
      return yield* new VerdictsInvalid({
        detail: `The ${where} holds a tab or a line break, which the file's layout reserves. Remove it from the path.`,
      });
    }

    yield* toRow(where, row.file, row.verdict, row.rule);
  }

  const lines = rows
    .toSorted((a, b) => compareCodeUnits(a.file, b.file))
    .map((row) => `${row.file}\t${row.verdict}\t${row.rule}`);

  return [header, ...lines].map((line) => `${line}\n`).join("");
});

/**
 * Parse the verdict file's text back into rows, the inverse of {@link renderVerdicts}.
 *
 * @param text - The file's text.
 * @returns The rows in file order, or {@link VerdictsInvalid} for a missing header or final
 *   newline, a line without exactly three columns, or a verdict and rule that disagree.
 */
export const parseVerdicts = Effect.fn("verdicts.parse")(function* parseVerdicts(text: string) {
  if (!text.endsWith("\n")) {
    return yield* new VerdictsInvalid({
      detail:
        "The verdict text does not end with a line feed. End every line, the last included, with one.",
    });
  }

  const [first, ...lines] = text.slice(0, -1).split("\n");

  if (first !== header) {
    return yield* new VerdictsInvalid({
      detail: `The first line is "${first}", not the header "${header}". Start the file with the header.`,
    });
  }

  const rows: VerdictRow[] = [];

  for (const [index, line] of lines.entries()) {
    const where = `line ${index + 2}`;
    const columns = line.split("\t");

    if (columns.length !== 3) {
      return yield* new VerdictsInvalid({
        detail: `The ${where} has ${columns.length} columns, not 3. Separate file, verdict and rule with one tab each.`,
      });
    }

    const [file = "", verdict = "", rule = ""] = columns;

    rows.push(yield* toRow(where, file, verdict, rule));
  }

  return rows;
});

/**
 * The path of the verdict file of one corpus tarball.
 *
 * @param tarball - The tarball's path; only its file name counts.
 * @returns `packages/pantry/verdicts/<name without .tar.gz>.tsv`, absolute.
 */
export const verdictsPath = (tarball: string): string =>
  path.resolve(
    import.meta.dirname,
    "../../verdicts",
    `${path.basename(tarball).replace(/\.tar\.gz$/u, "")}.tsv`,
  );
