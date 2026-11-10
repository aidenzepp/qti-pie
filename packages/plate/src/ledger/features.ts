/**
 * The features file: the 150 rows of the conformance text's Appendix A, each with its family, its
 * level and its name in words, and the rows the goal excludes.
 *
 * {@link generateFeatures} reads the rows from the 1EdTech QTI 3.0 Conformance and Certification
 * text (`conf.txt`), and `scripts/features.ts` writes its output to `features.generated.json`,
 * which {@link features} loads. The test proves the committed file is what the generator reads
 * today.
 *
 * The test-tag convention: a test that proves an Appendix A feature carries the
 * feature's ID in its title as one or more `[<ID>]` tokens before the description, for example
 * `it.effect("[Q-2] [I-9b] the correct choice scores 1", …)`. An ID matches
 * `[QITSAPM]-[0-9]+[a-z]?`. An untagged test proves nothing for the ledger, and a test of
 * infrastructure that proves no feature carries no tag. M1-R's reporter joins the tags with this
 * file into the ledger.
 *
 * @module
 */
import { Array as Arr, Config, Data, Order, Schema } from "effect";
import committed from "#plate/ledger/features.generated.json" with { type: "json" };

/**
 * The feature families, by the letter an ID starts with: Accessibility, Items, Metadata, Packaging,
 * interactions (Q), Sections and Tests.
 */
export const families = ["A", "I", "M", "P", "Q", "S", "T"] as const;

/**
 * The levels a feature has, from the most to the least required: required at Basic, required at
 * Advanced, required for Elevated Accessibility, or elective.
 */
export const levels = ["basic", "advanced", "elevated", "elective"] as const;

/**
 * A feature ID: its family letter, a hyphen, a number and an optional suffix letter, captured in
 * that order.
 */
const featureId = /^(?<family>[QITSAPM])-(?<number>[0-9]+)(?<suffix>[a-z]?)$/u;

/**
 * The Schema of one row of the features file.
 *
 * `family` is the ID's letter. `level` is the highest level that requires the feature (see
 * {@link generateFeatures}). `elevated` marks a feature the Elevated Accessibility table lists,
 * whatever its level. `name` is Appendix A's feature name, its whitespace collapsed.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Feature` is the Schema and the type of a row under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const Feature = Schema.Struct({
  elevated: Schema.Boolean,
  family: Schema.Literals(families),
  id: Schema.String.check(Schema.isPattern(featureId)),
  level: Schema.Literals(levels),
  name: Schema.String,
});

/**
 * One row of the features file.
 */
export type Feature = typeof Feature.Type;

/**
 * Decode the rows of a features file, throwing on a row that is not a {@link Feature}.
 */
const decodeFeatures = Schema.decodeUnknownSync(Schema.Array(Feature));

/**
 * Where the conformance text is cached: `.cache/gr8des/qti3-text/conf.txt` under `HOME`.
 */
export const confPath = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/qti3-text/conf.txt`),
);

/**
 * The heading every row sits under.
 */
const appendixHeading = "## A. APPENDIX A: QTI 3.0 Feature List";

/**
 * The heading of the Basic and Advanced tables, 3.1.1 to 3.1.6.
 */
const levelsHeading = "### 3.1 1EdTech Levels Certification Requirements";

/**
 * The heading of the Elevated Accessibility table.
 */
const elevatedHeading = "### 3.3 Elevated Accessibility Conformance Requirements";

/**
 * The conformance text lacks a heading the generator reads, a defect of the generator's input that
 * no caller can recover from.
 *
 * It means the text is not the 1EdTech QTI 3.0 Conformance and Certification text the generator was
 * written for, or that text's heading changed. `scripts/features.ts` lets it end the run. It is
 * thrown, never returned.
 */
export class ConformanceHeadingDefect extends Data.TaggedError("ConformanceHeadingDefect")<{
  readonly heading: string;
}> {
  /**
   * The missing heading, and what to change.
   */
  override get message(): string {
    return `The conformance text has no line "${this.heading}". Point the generator at the 1EdTech QTI 3.0 Conformance and Certification text, or update the heading in src/ledger/features.ts.`;
  }
}

/**
 * Measure the level of a Markdown heading line: the number of `#` it opens with, or 0 for any other
 * line.
 *
 * @param line A line of the text.
 * @returns The heading's level, or 0.
 */
const headingLevel = (line: string): number =>
  /^(?<marks>#+) /u.exec(line)?.groups?.["marks"]?.length ?? 0;

/**
 * Take the lines under a heading, up to the next heading of the same or a higher level.
 *
 * @param lines The text's lines.
 * @param heading The whole heading line.
 * @returns The lines after the heading, sub-headings included.
 * @throws {ConformanceHeadingDefect} When the text has no such heading, which means it is not the
 *   conformance text the generator was written for.
 */
const section = (lines: readonly string[], heading: string): readonly string[] => {
  const start = lines.indexOf(heading);

  if (start === -1) {
    throw new ConformanceHeadingDefect({ heading });
  }

  const level = headingLevel(heading);
  const end = lines.findIndex(
    (line, index) => index > start && headingLevel(line) > 0 && headingLevel(line) <= level,
  );

  return lines.slice(start + 1, end === -1 ? lines.length : end);
};

/**
 * Read the cells of every table in a section, in order, each trimmed with its whitespace collapsed.
 *
 * A table is a run of paragraphs that each open with a `|`; the first paragraph that does not ends
 * it. A cell is the text between two `|` markers, or after the last one, and may span lines.
 *
 * @param lines The section's lines.
 * @returns The cells of all its tables.
 */
const cells = (lines: readonly string[]): readonly string[] => {
  const paragraphs = lines
    .join("\n")
    .split(/\n[ \t]*\n/u)
    .map((paragraph) => paragraph.trim());

  return paragraphs
    .filter((paragraph) => paragraph.startsWith("|"))
    .flatMap((paragraph) => paragraph.split("|").slice(1))
    .map((cell) => cell.replaceAll(/\s+/gu, " ").trim());
};

/**
 * Read the rows of a section's tables: each cell that is a feature ID, with the cells after it up
 * to the next ID.
 *
 * @param lines The section's lines.
 * @returns Each row's ID and its other cells, in order.
 */
const rows = (
  lines: readonly string[],
): readonly { readonly id: string; readonly rest: readonly string[] }[] => {
  const all = cells(lines);
  const starts = all.flatMap((cell, index) => (featureId.test(cell) ? [index] : []));

  return starts.map((start, index) => ({
    id: all[start] ?? "",
    rest: all.slice(start + 1, starts[index + 1] ?? all.length),
  }));
};

/**
 * Decide whether a level column's cell requires the feature: it reads `R`, perhaps qualified, as
 * `R (subset)`.
 *
 * @param cell The cell's text.
 * @returns Whether the cell starts with the word `R`.
 */
const isRequired = (cell: string | undefined): boolean => /^R\b/u.test(cell ?? "");

/**
 * The order of feature IDs: by family letter, then by number, then by suffix letter, so `A-2a`
 * comes before `A-10a`.
 */
const idOrder = Order.Tuple([Order.String, Order.Number, Order.String]);

/**
 * Split a feature ID into the parts {@link idOrder} compares.
 *
 * @param id A feature ID.
 * @returns Its family letter, number and suffix letter.
 */
const idParts = (id: string): readonly [string, number, string] => {
  const groups = featureId.exec(id)?.groups ?? {};

  return [groups["family"] ?? "", Number(groups["number"] ?? "0"), groups["suffix"] ?? ""];
};

/**
 * Read the features file's rows from the conformance text.
 *
 * Each row of the tables under Appendix A gives an ID and its name. A feature is `basic` when the
 * 3.1 tables mark it `R` in the Basic column, else `advanced` when they mark it `R` in the Advanced
 * column, else `elevated` when the 3.3 table lists it, else `elective`. It is `elevated: true` when
 * the 3.3 table lists it, whatever its level. The generator finds each table by its heading, never
 * by a line number.
 *
 * @param conf The conformance text, `conf.txt`.
 * @returns One row for each Appendix A ID, sorted by family letter, number and suffix letter.
 * @throws {ConformanceHeadingDefect} When the text lacks a heading the generator reads.
 * @throws {Schema.SchemaError} When a row does not decode as a {@link Feature}.
 */
export const generateFeatures = (conf: string): readonly Feature[] => {
  const lines = conf.split(/\r?\n/u);
  const levelRows = rows(section(lines, levelsHeading));
  const basic = new Set(levelRows.filter((row) => isRequired(row.rest[1])).map((row) => row.id));
  const advanced = new Set(levelRows.filter((row) => isRequired(row.rest[2])).map((row) => row.id));
  const elevated = new Set(rows(section(lines, elevatedHeading)).map((row) => row.id));

  /**
   * Assign a feature ID its level by the rules {@link generateFeatures} states.
   *
   * @param id A feature ID.
   * @returns Its level.
   */
  const levelOf = (id: string): Feature["level"] => {
    if (basic.has(id)) {
      return "basic";
    }

    if (advanced.has(id)) {
      return "advanced";
    }

    return elevated.has(id) ? "elevated" : "elective";
  };

  const generated = rows(section(lines, appendixHeading)).map((row) => ({
    elevated: elevated.has(row.id),
    family: row.id.slice(0, 1),
    id: row.id,
    level: levelOf(row.id),
    name: row.rest[0] ?? "",
  }));

  return decodeFeatures(Arr.sortWith(generated, (row) => idParts(row.id), idOrder));
};

/**
 * The committed features file, `features.generated.json`, decoded.
 *
 * Regenerate it with `node packages/plate/scripts/features.ts && pnpm exec vp fmt
 * packages/plate/src/ledger/features.generated.json` from the repository root.
 */
export const features: readonly Feature[] = decodeFeatures(committed);

/**
 * A row the ledger reports as `excluded`, with the operator-approved reason and where the reason is
 * settled.
 */
export interface Exclusion {
  /**
   * The excluded feature's ID.
   */
  readonly id: string;

  /**
   * Why the row is excluded.
   */
  readonly reason: string;

  /**
   * What settles the reason, in words a reader of the public repository can follow.
   */
  readonly source: string;
}

/**
 * The excluded rows: the two custom interactions, Q-31 (proprietary) and Q-32 (LTI), which the
 * renderer accepts and shows the unsupported notice for but never launches.
 *
 * Launching a custom interaction is outside plate's scope, a decision the operator approved with
 * the renderer's goal, so each reason counts as operator-approved.
 */
export const exclusions: readonly Exclusion[] = ["Q-31", "Q-32"].map((id) => ({
  id,
  reason: "accepted; the launch of a custom interaction is a goal non-goal",
  source:
    "a scope decision: plate accepts custom interactions (Q-31 proprietary, Q-32 LTI) and does not launch them",
}));
