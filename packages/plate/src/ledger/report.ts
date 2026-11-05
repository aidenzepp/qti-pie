/**
 * The reporter: the conformance ledger as data, derived from the features file, the claims, the
 * records, a Vitest JSON report and the test sources.
 *
 * {@link decodeReport} reads a report that `vp test run --reporter=json` wrote, keeping only each
 * test's full name, the titles of the `describe` blocks around it, its file and its state.
 * {@link ledger} is pure: it takes every input in memory, the test sources as text, and reads no
 * file. A row's state is derived, never written by hand: `excluded` when the features file excludes
 * it, else `limited` when a claim names it, else `covered` when a passing test carries its tag,
 * else `unsupported-with-notice`. Beside the rows, the ledger shows each engine of each browser run
 * with the browser results it passed and failed, and OD-14 (e)'s result in that engine: `passed`
 * only when its control (a) and its proof (b) both passed there.
 *
 * @module
 */
import path from "node:path";
import { Effect, Schema, Tuple } from "effect";
import type { Claim } from "#plate/ledger/claims.ts";
import { families, levels } from "#plate/ledger/features.ts";
import type { Exclusion, Feature } from "#plate/ledger/features.ts";
import { PassRecord, ScreenReaderPass } from "#plate/ledger/passes.ts";
import { BrowserRun, EngineRun } from "#plate/ledger/runs.ts";

/**
 * The states Vitest's JSON report gives a test.
 */
export const testStates = ["disabled", "failed", "passed", "pending", "skipped", "todo"] as const;

/**
 * The Schema of the part of a Vitest JSON report the ledger reads: each file's path and, for each
 * of its tests, the titles of the `describe` blocks around it, the full name and the state. Every
 * other key is ignored.
 */
const VitestReport = Schema.Struct({
  testResults: Schema.Array(
    Schema.Struct({
      assertionResults: Schema.Array(
        Schema.Struct({
          ancestorTitles: Schema.Array(Schema.String),
          fullName: Schema.String,
          status: Schema.Literals(testStates),
        }),
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
   * The titles of the `describe` blocks around the test, the outermost first; empty for a test at
   * its file's top level.
   */
  readonly ancestorTitles: readonly string[];

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
 * @returns Every test's file, `describe` titles, full name and state, in the report's order; a
 *   `SchemaError` when the text is not JSON of a Vitest report's shape, and
 *   {@link ReportOutsideRoot} when a test file lies outside `root`.
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
      results.push({
        ancestorTitles: test.ancestorTitles,
        file,
        fullName: test.fullName,
        state: test.status,
      });
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
 * How a keyboard proof of an interaction is composed: in the dev playground, in the dev playground
 * driven in a browser engine, or in a form the test builds.
 */
export const compositions = [
  "dev playground",
  "dev playground in a browser",
  "test-built form",
] as const;

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
 * The Schema of how one part of OD-14 (e) ended in an engine: its test's state, or `absent` when
 * the engine has no result for it.
 */
const Od14Part = Schema.Literals(["absent", ...testStates]);

/**
 * The Schema of OD-14 (e)'s result in one engine, derived from the browser results: how its control
 * (a) and its proof (b) ended there, and `passed` only when both passed, else `failed`. It is the
 * gate's evidence in place of a sitting's entry (rule c8a113fd).
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Od14Result` is the Schema and the type of a result under one name, so a decoder and a signature read as one thing.
export const Od14Result = Schema.Struct({
  control: Od14Part,
  proof: Od14Part,
  result: Schema.Literals(["failed", "passed"]),
});

/**
 * OD-14 (e)'s result in one engine.
 */
export type Od14Result = typeof Od14Result.Type;

/**
 * The Schema of one engine's entry in a browser run as the ledger shows it: the engine, its
 * version and, on WebKit's entry only, `standsInFor: "Safari"`, as the run recorded them, beside
 * the run's date and Playwright version, how many browser results the engine passed and failed,
 * and OD-14 (e)'s result in it.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `BrowserRunRow` is the Schema and the type of an entry under one name, so a decoder and a signature read as one thing.
export const BrowserRunRow = EngineRun.mapMembers(
  Tuple.map(
    Schema.fieldsAssign({
      date: BrowserRun.fields.date,
      failed: Schema.Int,
      od14: Od14Result,
      passed: Schema.Int,
      playwright: Schema.String,
    }),
  ),
);

/**
 * One engine's entry in a browser run, with its counts.
 */
export type BrowserRunRow = typeof BrowserRunRow.Type;

/**
 * The Schema of the ledger: each engine of each browser run, each level's headline, the records,
 * and one row per feature in the features file's order.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Ledger` is the Schema and the type of the ledger under one name, the interface the phase's slice list fixes, so a decoder of `ledger.json` and a signature read as one thing.
export const Ledger = Schema.Struct({
  browserRuns: Schema.Array(BrowserRunRow),
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
   * The browser runs, as the browser run's setup records each one in `browser-run.json`.
   */
  readonly browserRuns: readonly BrowserRun[];

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
   * The test results, as {@link decodeReport} gives them: the unit run's, and the browser run's
   * beside them.
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
 * Decide whether a test file is a browser file, `src/**\/*.browser.test.ts`, whose cases drive the
 * dev playground in a browser engine.
 *
 * @param file A package-relative test file.
 * @returns Whether it runs in the browser engines.
 */
const isBrowserFile = (file: string): boolean =>
  /^src\/(?:.+\/)?[^/]+\.browser\.test\.ts$/u.test(file);

/**
 * Give how a keyboard proof is composed, by its test file.
 *
 * @param file The proof's package-relative test file.
 * @returns `dev playground` for the playground's test file, `dev playground in a browser` for a
 *   browser file, else `test-built form`.
 */
const compositionOf = (file: string): (typeof compositions)[number] => {
  if (file === playgroundFile) {
    return "dev playground";
  }

  return isBrowserFile(file) ? "dev playground in a browser" : "test-built form";
};

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
  const composed = new Set(keyboard.map((test) => compositionOf(test.file)));
  const columns = {
    composition: compositions.filter((composition) => composed.has(composition)),
    keyboard: keyboard.map((test) => test.fullName),
  };
  const pass = latestPass(id, records);

  return pass === undefined ? columns : { ...columns, screenReaderPass: pass };
};

/**
 * The OD-14 (e) browser file, whose control (a) and proof (b) run in each engine.
 */
const od14File = "src/dev/od14.browser.test.ts";

/**
 * The title of the `describe` block that holds OD-14 (e)'s control and proof inside each engine's.
 */
const od14Suite = "OD-14 (e)";

/**
 * Give how one part of OD-14 (e) ended in an engine.
 *
 * The part's test is in {@link od14File}, under the engine's `describe` and the one titled
 * {@link od14Suite}, and its own title opens with the part's label, as the file registers it, so a
 * test of the same words in another file or outside that `describe` is not the part.
 *
 * @param results The browser results.
 * @param engine The engine.
 * @param label The part's label: `(a)` for the control, `(b)` for the proof.
 * @returns `passed` when the engine has the part's test and it passed, the first other state of
 *   such a test, or `absent` when the engine has none.
 */
const od14Part = (
  results: readonly TestResult[],
  engine: string,
  label: string,
): Od14Result["control"] => {
  const states = results
    .filter(
      (result) =>
        result.file === od14File &&
        result.ancestorTitles.length === 2 &&
        result.ancestorTitles[0] === engine &&
        result.ancestorTitles[1] === od14Suite &&
        result.fullName.startsWith(`${engine} ${od14Suite} ${label} `),
    )
    .map((result) => result.state);

  return states.find((state) => state !== "passed") ?? (states.length === 0 ? "absent" : "passed");
};

/**
 * Give OD-14 (e)'s result in an engine.
 *
 * @param results The browser results.
 * @param engine The engine.
 * @returns How its control (a) and its proof (b) ended there, and `passed` only when both passed.
 */
const od14Of = (results: readonly TestResult[], engine: string): Od14Result => {
  const control = od14Part(results, engine, "(a)");
  const proof = od14Part(results, engine, "(b)");

  return {
    control,
    proof,
    result: control === "passed" && proof === "passed" ? "passed" : "failed",
  };
};

/**
 * Give each engine of each browser run its row: the engine's entry as the run recorded it, the
 * run's date and Playwright version, how many browser results ran in the engine and passed or
 * failed, and OD-14 (e)'s result in it.
 *
 * A browser file registers each case under a `describe` named for its engine (`eachEngine` in
 * `src/test/browsers.ts`), the outermost of the case's `describe` blocks, so a browser result ran
 * in an engine when its first ancestor title is the engine's name. A result in any other file is
 * not a browser result; a skipped or pending one counts as neither passed nor failed.
 *
 * @param runs The browser runs.
 * @param results The test results.
 * @returns One row per engine of each run, in the runs' order and each run's engines' order.
 */
const browserRunRows = (
  runs: readonly BrowserRun[],
  results: readonly TestResult[],
): readonly BrowserRunRow[] => {
  const browserResults = results.filter((result) => isBrowserFile(result.file));

  return runs.flatMap((run) =>
    run.engines.map((engine): BrowserRunRow => {
      const states = browserResults
        .filter((result) => result.ancestorTitles[0] === engine.engine)
        .map((result) => result.state);

      return {
        ...engine,
        date: run.date,
        failed: states.filter((state) => state === "failed").length,
        od14: od14Of(browserResults, engine.engine),
        passed: states.filter((state) => state === "passed").length,
        playwright: run.playwright,
      };
    }),
  );
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
 * latest screen-reader pass that ran. A keyboard proof in a browser file is composed in the dev
 * playground in a browser. Each engine of each browser run counts the browser results it passed
 * and failed, and gives OD-14 (e)'s result in it.
 *
 * @param input The features, exclusions, claims, records, browser runs, results, sources and
 *   corpus.
 * @returns Each engine of each browser run, each level's headline, the records, and one row per
 *   feature in the features file's order.
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
    browserRuns: browserRunRows(input.browserRuns, input.results),
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
