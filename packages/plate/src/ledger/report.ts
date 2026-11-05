/**
 * The reporter: the conformance ledger as data, derived from the features file, the claims, the
 * records, a Vitest JSON report and the test sources.
 *
 * {@link decodeReport} reads a report that `vp test run --reporter=json` wrote, keeping only each
 * test's full name, file and state. {@link ledger} is pure: it takes every input in memory, the test
 * sources as text, and reads no file. A row's state is derived, never written by hand: `excluded`
 * when the features file excludes it, else `limited` when a claim names it, else `covered` when a
 * passing test carries its tag, else `unsupported-with-notice`.
 *
 * @module
 */
import path from "node:path";
import { Effect, Schema } from "effect";
import type { Claim } from "#plate/ledger/claims.ts";
import { families, levels } from "#plate/ledger/features.ts";
import type { Exclusion, Feature } from "#plate/ledger/features.ts";
import { PassRecord, ScreenReaderPass } from "#plate/ledger/passes.ts";

/**
 * The states Vitest's JSON report gives a test.
 */
export const testStates = ["disabled", "failed", "passed", "pending", "skipped", "todo"] as const;

/**
 * The Schema of the part of a Vitest JSON report the ledger reads: each file's path and, for each
 * of its tests, the full name and state. Every other key is ignored.
 */
const VitestReport = Schema.Struct({
  testResults: Schema.Array(
    Schema.Struct({
      assertionResults: Schema.Array(
        Schema.Struct({ fullName: Schema.String, status: Schema.Literals(testStates) }),
      ),
      name: Schema.String,
    }),
  ),
});

/**
 * One test's result, as the ledger reads it.
 */
export interface TestResult {
  /**
   * The test file's path relative to the package directory, with `/` separators, such as
   * `src/validate/open.test.ts`.
   */
  readonly file: string;

  /**
   * The test's title after the titles of the `describe` blocks around it, joined by spaces.
   */
  readonly fullName: string;

  /**
   * How the test ended.
   */
  readonly state: (typeof testStates)[number];
}

/**
 * The failure of a report that names a test file outside the package directory it was decoded
 * against.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class ReportOutsideRoot extends Schema.TaggedError<ReportOutsideRoot>()(
  "ReportOutsideRoot",
  { file: Schema.String, root: Schema.String },
) {
  /**
   * The file and the directory it lies outside, and what to change.
   */
  override get message(): string {
    return `The report names ${this.file}, outside the package directory ${this.root}. Decode the report against the directory Vitest ran in.`;
  }
}

/**
 * Decode the text of a Vitest JSON report.
 */
const decodeVitestReport = Schema.decodeUnknownEffect(Schema.fromJsonString(VitestReport));

/**
 * Decode a Vitest JSON report into the results the ledger reads.
 *
 * @param text The report's text, as `vp test run --reporter=json` wrote it.
 * @param root The package directory Vitest ran in, which every test file's path is made relative
 *   to.
 * @returns Every test's file, full name and state, in the report's order; a `SchemaError` when the
 *   text is not JSON of a Vitest report's shape, and {@link ReportOutsideRoot} when a test file
 *   lies outside `root`.
 */
export const decodeReport = Effect.fn("decodeReport")(function* decodeReport(
  text: string,
  root: string,
): Effect.fn.Return<readonly TestResult[], ReportOutsideRoot | Schema.SchemaError> {
  const report = yield* decodeVitestReport(text);
  const results: TestResult[] = [];

  for (const testFile of report.testResults) {
    const relative = path.relative(root, testFile.name);

    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      return yield* new ReportOutsideRoot({ file: testFile.name, root });
    }

    const file = relative.split(path.sep).join("/");

    for (const test of testFile.assertionResults) {
      results.push({ file, fullName: test.fullName, state: test.status });
    }
  }

  return results;
});

/**
 * The states a row of the ledger can have.
 */
export const rowStates = ["covered", "excluded", "limited", "unsupported-with-notice"] as const;

/**
 * A row's state: `excluded`, `limited`, `covered` or `unsupported-with-notice`, derived in that
 * order of precedence.
 */
export type RowState = (typeof rowStates)[number];

/**
 * How a keyboard proof of an interaction is composed: in the dev playground, or in a form the test
 * builds.
 */
export const compositions = ["dev playground", "test-built form"] as const;

/**
 * The Schema of one test file among a row's proofs: the titles of its passing tests that carry the
 * row's tag, and the fixture documents the file names. A sweep file (`src/corpus.*.test.ts`) names
 * none: it proves over every corpus document.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ProofFile` is the Schema and the type of a proof under one name, so a decoder and a signature read as one thing.
export const ProofFile = Schema.Union([
  Schema.Struct({
    documents: Schema.Array(Schema.String),
    file: Schema.String,
    kind: Schema.Literal("fixtures"),
    tests: Schema.Array(Schema.String),
  }),
  Schema.Struct({
    file: Schema.String,
    kind: Schema.Literal("sweep"),
    tests: Schema.Array(Schema.String),
  }),
]);

/**
 * One test file among a row's proofs.
 */
export type ProofFile = typeof ProofFile.Type;

/**
 * The Schema of the columns only an interaction (Q) row has.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `InteractionColumns` is the Schema and the type of the columns under one name, so a decoder and a signature read as one thing.
export const InteractionColumns = Schema.Struct({
  composition: Schema.Array(Schema.Literals(compositions)),
  keyboard: Schema.Array(Schema.String),
  screenReaderPass: Schema.optionalKey(ScreenReaderPass),
});

/**
 * The columns only an interaction (Q) row has: how its keyboard proofs are composed, their titles,
 * and the latest screen-reader pass that covered it, `passed` or `failed`, absent when none is
 * recorded. An open entry, `not-observed`, is never that pass.
 */
export type InteractionColumns = typeof InteractionColumns.Type;

/**
 * The fields every row holds, whatever its state.
 */
const rowFields = {
  family: Schema.Literals(families),
  id: Schema.String,
  interaction: Schema.optionalKey(InteractionColumns),
  level: Schema.Literals(levels),
  name: Schema.String,
  proofs: Schema.Array(ProofFile),
  renders: Schema.Boolean,
  validates: Schema.Boolean,
};

/**
 * The Schema of one row of the ledger. An `excluded` row holds the exclusion's reason and source;
 * a `limited` row holds its claim's source.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `LedgerRow` is the Schema and the type of a row under one name, so a decoder and a signature read as one thing.
export const LedgerRow = Schema.Union([
  Schema.Struct({ ...rowFields, state: Schema.Literals(["covered", "unsupported-with-notice"]) }),
  Schema.Struct({
    ...rowFields,
    reason: Schema.String,
    source: Schema.String,
    state: Schema.Literal("excluded"),
  }),
  Schema.Struct({ ...rowFields, source: Schema.String, state: Schema.Literal("limited") }),
]);

/**
 * One row of the ledger.
 */
export type LedgerRow = typeof LedgerRow.Type;

/**
 * The Schema of a level's headline: how many of its rows have each state.
 */
const StateCounts = Schema.Struct({
  covered: Schema.Int,
  excluded: Schema.Int,
  limited: Schema.Int,
  "unsupported-with-notice": Schema.Int,
});

/**
 * The Schema of the ledger: each level's headline, the records, and one row per feature in the
 * features file's order.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Ledger` is the Schema and the type of the ledger under one name, the interface the phase's slice list fixes, so a decoder of `ledger.json` and a signature read as one thing.
export const Ledger = Schema.Struct({
  headlines: Schema.Struct({
    advanced: StateCounts,
    basic: StateCounts,
    elective: StateCounts,
    elevated: StateCounts,
  }),
  records: Schema.Array(PassRecord),
  rows: Schema.Array(LedgerRow),
});

/**
 * The ledger as data.
 */
export type Ledger = typeof Ledger.Type;

/**
 * What {@link ledger} derives the ledger from.
 */
export interface LedgerInput {
  /**
   * The claims, `claims` from `#plate/ledger/claims.ts`.
   */
  readonly claims: readonly Claim[];

  /**
   * The corpus documents, as corpus-relative paths: a string literal in a test file names a fixture
   * document when it is one of them.
   */
  readonly corpus: ReadonlySet<string>;

  /**
   * The excluded rows, `exclusions` from `#plate/ledger/features.ts`.
   */
  readonly exclusions: readonly Exclusion[];

  /**
   * The features file's rows, `features` from `#plate/ledger/features.ts`.
   */
  readonly features: readonly Feature[];

  /**
   * The records, `passes` from `#plate/ledger/passes.ts`.
   */
  readonly records: readonly PassRecord[];

  /**
   * The test results, as {@link decodeReport} gives them.
   */
  readonly results: readonly TestResult[];

  /**
   * Each test file's text, keyed by its path relative to the package directory, as
   * {@link TestResult.file} gives it.
   */
  readonly sources: ReadonlyMap<string, string>;
}

/**
 * A feature tag in a test's title: `[<ID>]`, the ID a family letter, a number and an optional
 * suffix letter. `[keyboard]` is not one.
 */
const featureTag = /\[(?<id>[QITSAPM]-[0-9]+[a-z]?)\]/gu;

/**
 * The token that marks a keyboard-only completion test.
 */
const keyboardToken = "[keyboard]";

/**
 * Read the feature IDs a test's title tags.
 *
 * @param title A test's title or full name.
 * @returns Each ID its `[<ID>]` tokens name, in order.
 */
export const tagsOf = (title: string): readonly string[] =>
  Array.from(title.matchAll(featureTag), (match) => match.groups?.["id"] ?? "");

/**
 * Decide whether a test file is a corpus sweep, `src/corpus.*.test.ts`.
 *
 * @param file A package-relative test file.
 * @returns Whether it sweeps the corpus.
 */
const isSweep = (file: string): boolean => /^src\/corpus\.[^/]+\.test\.ts$/u.test(file);

/**
 * The test files outside `src/emit/` and `src/interactions/` whose tests render.
 */
const renderingFiles = new Set([
  "src/render.test.ts",
  "src/vertical.test.ts",
  "src/witness.test.ts",
]);

/**
 * Decide whether a passing tagged test in a file proves its feature renders.
 *
 * @param file A package-relative test file.
 * @returns Whether the file renders: under `src/emit/` or `src/interactions/`, one of
 *   {@link renderingFiles}, or a sweep.
 */
const renders = (file: string): boolean =>
  file.startsWith("src/emit/") ||
  file.startsWith("src/interactions/") ||
  renderingFiles.has(file) ||
  isSweep(file);

/**
 * The test file of the dev playground, whose keyboard proofs are composed in the playground.
 */
const playgroundFile = "src/dev/page.test.ts";

/**
 * A string literal without whitespace, quotes or escapes: the shape a corpus-relative path is
 * written in.
 */
const pathLiteral = /(?<quote>["'`])(?<text>[^"'`\s\\]+)\k<quote>/gu;

/**
 * Read the corpus documents a test file names: every string literal in it that is a corpus path.
 *
 * @param source The test file's text; empty when the caller passed none.
 * @param corpus The corpus documents.
 * @returns The documents it names, each once, sorted.
 */
const documentsNamed = (source: string, corpus: ReadonlySet<string>): readonly string[] =>
  [
    ...new Set(
      Array.from(source.matchAll(pathLiteral), (match) => match.groups?.["text"] ?? "").filter(
        (text) => corpus.has(text),
      ),
    ),
  ].toSorted();

/**
 * A passing test, with the tags its full name carries.
 */
interface Passing extends TestResult {
  /**
   * Whether the test carries `[keyboard]`.
   */
  readonly keyboard: boolean;

  /**
   * The feature IDs it tags.
   */
  readonly tags: ReadonlySet<string>;
}

/**
 * Group a row's passing tagged tests by file into its proofs.
 *
 * @param proven The row's passing tagged tests.
 * @param documentsOf The corpus documents a non-sweep file names.
 * @returns One proof per file, sorted by path, each test in the report's order.
 */
const proofsOf = (
  proven: readonly Passing[],
  documentsOf: (file: string) => readonly string[],
): readonly ProofFile[] =>
  [...new Set(proven.map((test) => test.file))].toSorted().map((file) => {
    const tests = proven.filter((test) => test.file === file).map((test) => test.fullName);

    return isSweep(file)
      ? { file, kind: "sweep", tests }
      : { documents: documentsOf(file), file, kind: "fixtures", tests };
  });

/**
 * Find the latest recorded screen-reader pass that covered an interaction.
 *
 * Only a pass that ran counts: an open entry, `not-observed`, records a check a sitting left for a
 * later one, so it never replaces a `passed` or `failed` pass, and an interaction whose only
 * entries are open has no pass.
 *
 * @param id The interaction's feature ID.
 * @param records The records.
 * @returns The `passed` or `failed` pass with the latest date; of two on one date, the one recorded
 *   later. `undefined` when none that ran covered it.
 */
const latestPass = (id: string, records: readonly PassRecord[]): ScreenReaderPass | undefined => {
  let latest: ScreenReaderPass | undefined;

  for (const record of records) {
    if (
      record.kind === "screen-reader-pass" &&
      record.result !== "not-observed" &&
      record.interactions.includes(id) &&
      (latest === undefined || Date.parse(record.date) >= Date.parse(latest.date))
    ) {
      latest = record;
    }
  }

  return latest;
};

/**
 * Build an interaction row's own columns.
 *
 * @param id The interaction's feature ID.
 * @param proven Its passing tagged tests.
 * @param records The records.
 * @returns Its keyboard proofs' titles and composition, and its latest screen-reader pass.
 */
const interactionColumns = (
  id: string,
  proven: readonly Passing[],
  records: readonly PassRecord[],
): InteractionColumns => {
  const keyboard = proven.filter((test) => test.keyboard);
  const composed = new Set(
    keyboard.map((test) => (test.file === playgroundFile ? "dev playground" : "test-built form")),
  );
  const columns = {
    composition: compositions.filter((composition) => composed.has(composition)),
    keyboard: keyboard.map((test) => test.fullName),
  };
  const pass = latestPass(id, records);

  return pass === undefined ? columns : { ...columns, screenReaderPass: pass };
};

/**
 * Derive the ledger.
 *
 * A row is `excluded` when `exclusions` names it, else `limited` when a claim names it, else
 * `covered` when a passing test carries its tag, else `unsupported-with-notice`. Its proofs are its
 * passing tagged tests, grouped by file, with the corpus documents each file names. Validates is
 * yes when a proof lives under `src/validate/`; Renders when one lives under `src/emit/` or
 * `src/interactions/`, in `src/render.test.ts`, `src/vertical.test.ts` or `src/witness.test.ts`, or
 * in a sweep. An interaction (Q) row also lists its keyboard proofs, their composition and its
 * latest screen-reader pass that ran.
 *
 * @param input The features, exclusions, claims, records, results, sources and corpus.
 * @returns Each level's headline, the records, and one row per feature in the features file's
 *   order.
 */
export const ledger = (input: LedgerInput): Ledger => {
  const passing: readonly Passing[] = input.results
    .filter((result) => result.state === "passed")
    .map((result) => ({
      ...result,
      keyboard: result.fullName.includes(keyboardToken),
      tags: new Set(tagsOf(result.fullName)),
    }));
  const named = new Map<string, readonly string[]>();

  /**
   * Read, once per file, the corpus documents a test file names.
   *
   * @param file A package-relative test file.
   * @returns The documents it names.
   */
  const documentsOf = (file: string): readonly string[] => {
    const known = named.get(file) ?? documentsNamed(input.sources.get(file) ?? "", input.corpus);

    named.set(file, known);

    return known;
  };

  const rows = input.features.map((feature): LedgerRow => {
    const proven = passing.filter((test) => test.tags.has(feature.id));
    const common = {
      family: feature.family,
      id: feature.id,
      level: feature.level,
      name: feature.name,
      proofs: proofsOf(proven, documentsOf),
      renders: proven.some((test) => renders(test.file)),
      validates: proven.some((test) => test.file.startsWith("src/validate/")),
    };
    const fields =
      feature.family === "Q"
        ? { ...common, interaction: interactionColumns(feature.id, proven, input.records) }
        : common;
    const exclusion = input.exclusions.find((candidate) => candidate.id === feature.id);

    if (exclusion !== undefined) {
      return {
        ...fields,
        reason: exclusion.reason,
        source: exclusion.source,
        state: "excluded",
      };
    }

    const claim = input.claims.find((candidate) => candidate.id === feature.id);

    if (claim !== undefined) {
      return { ...fields, source: claim.source, state: "limited" };
    }

    return { ...fields, state: proven.length > 0 ? "covered" : "unsupported-with-notice" };
  });

  /**
   * Count a level's rows by state.
   *
   * @param level A level.
   * @returns How many of its rows have each state.
   */
  const headline = (level: Feature["level"]): Record<RowState, number> => {
    const states = rows.filter((row) => row.level === level).map((row) => row.state);

    /**
     * Count the level's rows in one state.
     *
     * @param state A row state.
     * @returns How many of the level's rows have it.
     */
    const count = (state: RowState): number =>
      states.filter((candidate) => candidate === state).length;

    return {
      covered: count("covered"),
      excluded: count("excluded"),
      limited: count("limited"),
      "unsupported-with-notice": count("unsupported-with-notice"),
    };
  };

  return {
    headlines: {
      advanced: headline("advanced"),
      basic: headline("basic"),
      elective: headline("elective"),
      elevated: headline("elevated"),
    },
    records: input.records,
    rows,
  };
};
