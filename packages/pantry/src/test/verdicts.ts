import path from "node:path";
import { Array as Arr, Effect, Schema } from "effect";
import { ImportRule, ruleOrder } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";

/**
 * One corpus zip's verdict: the tarball member it came from, whether the importer accepted it, and
 * for a refusal the rules it was refused under, the refusal's own (`ImportRefused.rules`): a set,
 * listed in {@link ruleOrder}. An accepted row names no rule.
 */
export interface VerdictRow {
  readonly file: string;
  readonly rules: readonly Rule[];
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

/**
 * What separates a refusal's rules in the `rule` column: no rule holds it.
 */
const ruleSeparator = "|";

const isRule = Schema.is(ImportRule);

/**
 * Whether `value` holds a character the file's layout reserves: a tab or a line break.
 */
const hasReserved = (value: string): boolean => /[\t\r\n]/u.test(value);

/**
 * Write a row's rules as its `rule` column holds them: joined by {@link ruleSeparator}, empty for
 * none.
 *
 * @param rules - The rules.
 * @returns The column's text.
 */
const ruleColumn = (rules: readonly string[]): string => rules.join(ruleSeparator);

/**
 * Hold rules to the column's one spelling of a set: each a rule of the roster, each once, in
 * {@link ruleOrder}.
 *
 * @param where - What the detail points at, such as `row "a.zip"` or `line 3`.
 * @param named - The rules as the row or line names them.
 * @returns The rules, or {@link VerdictsInvalid} naming the first that breaks the spelling.
 */
const rosterRules = (
  where: string,
  named: readonly string[],
): Effect.Effect<readonly Rule[], VerdictsInvalid> => {
  const rules = named.filter(isRule);
  const unknown = named.find((rule) => !isRule(rule));
  if (unknown !== undefined) {
    return Effect.fail(
      new VerdictsInvalid({
        detail: `The ${where} names "${unknown}", not a rule of the roster. Name the rules the importer refused it under.`,
      }),
    );
  }

  const listed = Arr.sort(Arr.dedupe(rules), ruleOrder);

  // No rule holds the separator, so two listings are one exactly when their columns are.
  return ruleColumn(listed) === ruleColumn(named)
    ? Effect.succeed(listed)
    : Effect.fail(
        new VerdictsInvalid({
          detail: `The ${where} names the rules "${ruleColumn(rules)}", not each once in the roster's order. Write them as "${ruleColumn(listed)}".`,
        }),
      );
};

/**
 * The row for one file, verdict and rules, or {@link VerdictsInvalid} unless they agree: a refusal
 * names one rule of the roster or more, an acceptance none.
 *
 * @param where - What the detail points at, such as `row "a.zip"` or `line 3`.
 */
const toRow = (
  where: string,
  file: string,
  verdict: string,
  named: readonly string[],
): Effect.Effect<VerdictRow, VerdictsInvalid> => {
  if (verdict === "accepted") {
    return named.length === 0
      ? Effect.succeed({ file, rules: [], verdict })
      : Effect.fail(
          new VerdictsInvalid({
            detail: `The ${where} is accepted but names the rule "${ruleColumn(named)}". Leave the rule empty on an accepted row.`,
          }),
        );
  }

  if (verdict === "refused") {
    return named.length === 0
      ? Effect.fail(
          new VerdictsInvalid({
            detail: `The ${where} is refused but its rule is empty. Name the rules the importer refused it under.`,
          }),
        )
      : Effect.map(rosterRules(where, named), (rules) => ({ file, rules, verdict }));
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
 * ended by a line feed; a row's rules are joined by `|`.
 *
 * @param rows - The rows, in any order.
 * @returns The text, or {@link VerdictsInvalid} for a field holding a tab or a line break, a row
 *   that names rules exactly when its verdict is `accepted`, or one whose rules repeat a rule or
 *   stand out of the roster's order.
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

    yield* toRow(where, row.file, row.verdict, row.rules);
  }

  const lines = rows
    .toSorted((a, b) => compareCodeUnits(a.file, b.file))
    .map((row) => `${row.file}\t${row.verdict}\t${ruleColumn(row.rules)}`);

  return [header, ...lines].map((line) => `${line}\n`).join("");
});

/**
 * Parse the verdict file's text back into rows, the inverse of {@link renderVerdicts}.
 *
 * @param text - The file's text.
 * @returns The rows in file order, or {@link VerdictsInvalid} for a missing header or final
 *   newline, a line without exactly three columns, a verdict and rule that disagree, or rules that
 *   repeat a rule or stand out of the roster's order.
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

    rows.push(yield* toRow(where, file, verdict, rule === "" ? [] : rule.split(ruleSeparator)));
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
