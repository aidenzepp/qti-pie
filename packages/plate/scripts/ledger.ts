/**
 * The one command: runs the package's tests and its browser tests, opens every corpus document, and
 * writes the conformance ledger and the per-document verdict report.
 *
 * From the repository root:
 *
 * ```sh
 * pnpm --filter @qti-pie/plate ledger
 * ```
 *
 * `pnpm --filter @qti-pie/plate run ledger` and a bare `node packages/plate/scripts/ledger.ts` run
 * the same steps. In order, it removes the files an earlier run left for it to read; runs the unit
 * tests through `vp test run`, with the `test` script's `TMPDIR` and `NODE_OPTIONS`, writing their
 * JSON report to `vitest.json`; runs the browser tests (`vite.browser.config.ts`) the same way,
 * with the browsers under `HOME`'s `.cache/gr8des/ms-playwright`, writing their JSON report to
 * `browser.json`, while the browser run's setup records its engines and their versions in
 * `browser-run.json`; opens every member of `corpusDocuments` and writes `verdicts.json` and
 * `verdicts.txt`; derives the ledger from both runs' results and the browser-run record, and checks
 * its honesty over those results; writes `ledger.json` and `ledger.txt`; and prints the paths, the
 * headline counts, and each engine's version with its counts. The outputs go to `PLATE_LEDGER_DIR`,
 * `work/ledger` in the package when it is not set. Both runs get `PLATE_REQUIRE_CACHES=1`, whatever
 * the command inherited, so a test whose cache is missing fails instead of being skipped, and the
 * command never passes without every cache the tests read. It exits non-zero when either run
 * failed, a test failed or the honesty check found a problem, after writing what it could; and
 * when a run's report or the browser-run record is missing or unreadable, after writing the
 * verdicts, with a message that names the file.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Config, Console, Effect, Schema } from "effect";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { claims } from "#plate/ledger/claims.ts";
import type { Claim } from "#plate/ledger/claims.ts";
import { ledgerDirectory } from "#plate/ledger/directory.ts";
import { confPath, exclusions, features, levels } from "#plate/ledger/features.ts";
import type { Exclusion, Feature } from "#plate/ledger/features.ts";
import { honesty } from "#plate/ledger/honesty.ts";
import type { HonestyProblem } from "#plate/ledger/honesty.ts";
import { passes, sessionNotes } from "#plate/ledger/passes.ts";
import type { PassRecord, SessionNote } from "#plate/ledger/passes.ts";
import { decodeReport, ledger, Ledger, rowStates, tagsOf } from "#plate/ledger/report.ts";
import type { ReportOutsideRoot, TestResult } from "#plate/ledger/report.ts";
import { BrowserRun, browserRunFile, standsInForSafari } from "#plate/ledger/runs.ts";
import { ledgerText, verdictLines } from "#plate/ledger/view.ts";
import { open } from "#plate/validate/open.ts";
import { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { describeRefusal, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * The package directory, `packages/plate`, which the tests run in and every relative path is read
 * from, wherever the command was started.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..");

/**
 * The folders under the package whose `*.test.ts` files the tests run, as `vite.config.ts`
 * includes them. The browser files under `src`, the Node-driven `*.browser.test.ts` and the in-page
 * `*.dom.test.ts`, which `vite.browser.config.ts` includes, end in `.test.ts` too, so their sources
 * are read beside the unit files'.
 */
const testFolders = ["scripts", "src"] as const;

/**
 * The name of the unit run's JSON report in the output folder.
 */
const unitReport = "vitest.json";

/**
 * The name of the browser run's JSON report in the output folder.
 */
const browserReport = "browser.json";

/**
 * The files the two runs leave in the output folder for the command to read: the unit run's
 * report, the browser run's report, and the browser-run record that the browser run's setup
 * (`src/test/browser-setup.ts`) writes. The command removes them before the runs, so a run that
 * leaves one unwritten is read as missing, never as an earlier run's.
 */
const runFiles = [unitReport, browserReport, browserRunFile] as const;

/**
 * The file names the command writes, in the order it writes them: the verdict report, then the
 * ledger. The test report, `vitest.json`, is the test run's.
 */
export const outputNames = ["verdicts.json", "verdicts.txt", "ledger.json", "ledger.txt"] as const;

/**
 * The flags the `test` script appends to `NODE_OPTIONS`, so the command runs the tests as
 * `pnpm test` does.
 */
const requiredNodeOptions = ["--disable-proto=delete", "--disable-sigusr1"] as const;

/**
 * The conformance text could not be read.
 */
class ConfUnreadable extends Schema.TaggedError<ConfUnreadable>()("ConfUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Fetch the 1EdTech QTI 3.0 Conformance and Certification text there as conf.txt, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * A test file, or a folder that holds test files, could not be read.
 */
class SourceUnreadable extends Schema.TaggedError<SourceUnreadable>()("SourceUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}, which the ledger reads for test titles and the corpus documents a test names. Make it readable and run the command again.`;
  }
}

/**
 * No `vp` was found in `node_modules/.bin` of the package or of a folder above it.
 */
class VpMissing extends Schema.TaggedError<VpMissing>()("VpMissing", { from: Schema.String }) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot find node_modules/.bin/vp in ${this.from} or any folder above it. Run pnpm install --frozen-lockfile in the repository, then run the command again.`;
  }
}

/**
 * The test run could not be started.
 */
class TestRunFailed extends Schema.TaggedError<TestRunFailed>()("TestRunFailed", {
  detail: Schema.String,
  file: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot start the tests with ${this.file}: ${this.detail}. Run pnpm install --frozen-lockfile in the repository, then run the command again.`;
  }
}

/**
 * The test run left no report to read.
 */
class ReportUnreadable extends Schema.TaggedError<ReportUnreadable>()("ReportUnreadable", {
  path: Schema.String,
}) {
  /**
   * What failed, what was kept and what to do about it.
   */
  override get message(): string {
    return `Cannot read the test report ${this.path}; the verdicts were written, the ledger was not. Read the test run's output above, fix what stopped it before it wrote the report, and run the command again.`;
  }
}

/**
 * The browser run left no report, or no browser-run record, that the command can read and decode.
 */
class BrowserOutputUnreadable extends Schema.TaggedError<BrowserOutputUnreadable>()(
  "BrowserOutputUnreadable",
  { path: Schema.String },
) {
  /**
   * What failed, what was kept and what to do about it.
   */
  override get message(): string {
    return `Cannot read ${this.path}, which the browser run writes; the verdicts were written, the ledger was not. If the browser run's output above says an engine's executable is missing, run pnpm --filter @qti-pie/plate browsers; otherwise fix what it reports stopped the run, and run the command again.`;
  }
}

/**
 * An output, or its folder, could not be written.
 */
class OutputUnwritable extends Schema.TaggedError<OutputUnwritable>()("OutputUnwritable", {
  path: Schema.String,
}) {
  /**
   * What failed and what to do about it.
   */
  override get message(): string {
    return `Cannot write ${this.path}. Make its folder writable, or set PLATE_LEDGER_DIR to a writable folder, and run the command again.`;
  }
}

/**
 * The Schema of one document in `verdicts.json`: its path, its verdict, and why. A refused document
 * holds each refusal's rule, sentence, location and detail; an unchecked one each reason and the
 * path it concerns; an accepted one each feature it holds that the renderer does not render. The
 * words are the validator's (OD-4), as in `verdicts.txt`.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `VerdictEntry` is the Schema and the type of an entry under one name, so a decoder of `verdicts.json` and a signature read as one thing.
export const VerdictEntry = Schema.Union([
  Schema.Struct({
    document: Schema.String,
    refusals: Schema.Array(
      Schema.Struct({
        detail: Schema.Record(Schema.String, Schema.String),
        location: Location,
        message: Schema.String,
        rule: RefusalRule,
      }),
    ),
    verdict: Schema.Literal("refused"),
  }),
  Schema.Struct({
    document: Schema.String,
    reasons: Schema.Array(Schema.Struct({ path: Schema.String, reason: Schema.String })),
    verdict: Schema.Literal("unchecked"),
  }),
  Schema.Struct({
    document: Schema.String,
    unsupported: Schema.Array(Schema.Struct({ feature: Schema.String, path: Schema.String })),
    verdict: Schema.Literals(["accepted", "accepted-with-unsupported"]),
  }),
]);

/**
 * One document in `verdicts.json`.
 */
export type VerdictEntry = typeof VerdictEntry.Type;

/**
 * Encode the verdict report as `verdicts.json`'s text.
 */
const encodeVerdicts = Schema.encodeEffect(
  Schema.fromJsonString(Schema.Array(VerdictEntry), { space: 2 }),
);

/**
 * Encode the ledger as `ledger.json`'s text, which `Ledger` decodes.
 */
const encodeLedger = Schema.encodeEffect(Schema.fromJsonString(Ledger, { space: 2 }));

/**
 * Decode `browser-run.json`'s text into the browser-run record.
 */
const decodeRun = Schema.decodeEffect(Schema.fromJsonString(BrowserRun));

/**
 * What one build of the ledger reads: the inputs of `ledger` and `honesty` beside the folder that
 * holds the runs' reports and the browser-run record, and takes the outputs.
 */
export interface LedgerBuild {
  /**
   * The browser run's exit code; anything but 0 makes the command's exit code 1.
   */
  readonly browserExit: number;

  /**
   * The claims, `claims` from `#plate/ledger/claims.ts`.
   */
  readonly claims: readonly Claim[];

  /**
   * The conformance text, `conf.txt`.
   */
  readonly conf: string;

  /**
   * The excluded rows, `exclusions` from `#plate/ledger/features.ts`.
   */
  readonly exclusions: readonly Exclusion[];

  /**
   * The features file's rows, `features` from `#plate/ledger/features.ts`.
   */
  readonly features: readonly Feature[];

  /**
   * The notes on each sitting, `sessionNotes` from `#plate/ledger/passes.ts`, which `ledger.txt`
   * lists after the records.
   */
  readonly notes: readonly SessionNote[];

  /**
   * The folder that holds `vitest.json`, `browser.json` and `browser-run.json`, and receives the
   * four outputs, created when absent.
   */
  readonly output: string;

  /**
   * The records, `passes` from `#plate/ledger/passes.ts`.
   */
  readonly records: readonly PassRecord[];

  /**
   * The package directory the tests ran in, which the report's test files are read relative to.
   */
  readonly root: string;

  /**
   * Each test file's text, keyed by its path relative to {@link LedgerBuild.root}.
   */
  readonly sources: ReadonlyMap<string, string>;

  /**
   * The unit run's exit code; anything but 0 makes the command's exit code 1.
   */
  readonly testExit: number;
}

/**
 * What one build of the ledger found and wrote.
 */
export interface LedgerOutcome {
  /**
   * The browser run's exit code, as the build was given it.
   */
  readonly browserExit: number;

  /**
   * The command's exit code: 0 when both runs exited 0, no reported test failed and the honesty
   * check found nothing; 1 otherwise.
   */
  readonly exitCode: 0 | 1;

  /**
   * The reported tests that failed, the unit run's and then the browser run's, each in its
   * report's order.
   */
  readonly failed: readonly TestResult[];

  /**
   * The ledger derived from the run, as `ledger.json` and `ledger.txt` hold it.
   */
  readonly ledger: Ledger;

  /**
   * The folder the outputs were written to.
   */
  readonly output: string;

  /**
   * What the honesty check found: the static check's problems, then each claim no test tagged
   * with its ID passed in the run, unless the static check already named that claim.
   */
  readonly problems: readonly HonestyProblem[];

  /**
   * The unit run's exit code, as the build was given it.
   */
  readonly testExit: number;

  /**
   * Each corpus document's verdict, in the document set's order.
   */
  readonly verdicts: readonly Verdict[];

  /**
   * The outputs' paths, in the order they were written.
   */
  readonly written: readonly string[];
}

/**
 * Create a folder and the folders above it that do not exist.
 *
 * @param folder The folder.
 * @returns Nothing; {@link OutputUnwritable} when it cannot be created.
 */
const makeDirectory = (folder: string): Effect.Effect<void, OutputUnwritable> =>
  Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: folder }),
    try: () => mkdir(folder, { recursive: true }),
  }).pipe(Effect.asVoid);

/**
 * Write one output.
 *
 * @param file The output's path.
 * @param text Its text.
 * @returns Nothing; {@link OutputUnwritable} when it cannot be written.
 */
const writeOutput = (file: string, text: string): Effect.Effect<void, OutputUnwritable> =>
  Effect.tryPromise({
    catch: () => new OutputUnwritable({ path: file }),
    try: () => writeFile(file, text),
  });

/**
 * Read a file the browser run writes.
 *
 * @param file The file's path.
 * @returns Its text; {@link BrowserOutputUnreadable} when it is missing or cannot be read.
 */
const readBrowserOutput = (file: string): Effect.Effect<string, BrowserOutputUnreadable> =>
  Effect.tryPromise({
    catch: () => new BrowserOutputUnreadable({ path: file }),
    try: () => readFile(file, "utf-8"),
  });

/**
 * Write a verdict as an entry of `verdicts.json`.
 *
 * @param verdict A document's verdict.
 * @returns The entry: the refusals with their sentences, the `unchecked` reasons, or the
 *   unsupported features.
 */
const toEntry = (verdict: Verdict): VerdictEntry => {
  if (verdict.verdict === "refused") {
    return {
      document: verdict.document,
      refusals: verdict.refusals.map((refusal) => ({
        detail: refusal.detail,
        location: refusal.location,
        message: describeRefusal(refusal),
        rule: refusal.rule,
      })),
      verdict: verdict.verdict,
    };
  }

  if (verdict.verdict === "unchecked") {
    return { document: verdict.document, reasons: verdict.reasons, verdict: verdict.verdict };
  }

  return {
    document: verdict.document,
    unsupported: unsupportedFeatures(verdict).map(({ feature, path: at }) => ({
      feature,
      path: at,
    })),
    verdict: verdict.verdict,
  };
};

/**
 * Repeat the claim check over the run: each claim no passing test tagged with its ID backs.
 *
 * @param claimed The claims.
 * @param results The run's results.
 * @param named The claims the static check already found unbacked, which are not repeated.
 * @returns One `unbacked-claim` problem per claim the run did not back.
 */
const unbackedInRun = (
  claimed: readonly Claim[],
  results: readonly TestResult[],
  named: ReadonlySet<string>,
): readonly HonestyProblem[] =>
  claimed
    .filter(
      (claim) =>
        !named.has(claim.id) &&
        !results.some(
          (result) => result.state === "passed" && tagsOf(result.fullName).includes(claim.id),
        ),
    )
    .map((claim) => ({
      detail: `No test tagged [${claim.id}] passed in this run, so nothing backs the claim that makes ${claim.id} limited. Make a test tagged [${claim.id}] pass, or remove the claim from src/ledger/claims.ts.`,
      id: claim.id,
      kind: "unbacked-claim",
    }));

/**
 * Build the ledger from the finished unit and browser runs: open every corpus document and write
 * the verdict report, then read both runs' reports and the browser-run record, derive the ledger
 * from both runs' results and the record, check its honesty, and write the ledger.
 *
 * The corpus is read through `corpusDocuments` and `readCorpusFile`, so `PLATE_CORPUS_DIR` or
 * `HOME` decides it. The verdict report is written before any report is read, so a run that left
 * no report still leaves the verdicts. Nothing is printed and no exit code is set.
 *
 * @param input The inputs, the output folder and the runs' exit codes.
 * @returns What was found and written; {@link ReportUnreadable} when `vitest.json` cannot be read,
 *   `ReportOutsideRoot` or a `SchemaError` when it is not a report of a run in `root`,
 *   {@link BrowserOutputUnreadable} when `browser.json` or `browser-run.json` is missing, cannot
 *   be read or does not decode, `ReportOutsideRoot` when `browser.json` names a file outside
 *   `root`, {@link OutputUnwritable} when an output cannot be written, and the corpus reader's
 *   failures.
 */
export const buildLedger = Effect.fn("buildLedger")(function* buildLedger(
  input: LedgerBuild,
): Effect.fn.Return<
  LedgerOutcome,
  | BrowserOutputUnreadable
  | Config.ConfigError
  | CorpusFileUnreadable
  | CorpusMissing
  | OutputUnwritable
  | ReportOutsideRoot
  | ReportUnreadable
  | Schema.SchemaError
> {
  const written = outputNames.map((name) => path.join(input.output, name));
  const [verdictsJson = "", verdictsTxt = "", ledgerJson = "", ledgerTxt = ""] = written;

  yield* makeDirectory(input.output);

  const members = yield* corpusDocuments;
  // oxlint-disable-next-line unicorn/no-array-method-this-argument -- `Effect.forEach` takes the collection first and the effect per element second; it has no `thisArg`.
  const verdicts = yield* Effect.forEach(members, (member) =>
    readCorpusFile(member).pipe(Effect.flatMap((bytes) => open(member, bytes))),
  );

  yield* writeOutput(verdictsJson, `${yield* encodeVerdicts(verdicts.map(toEntry))}\n`);
  yield* writeOutput(verdictsTxt, verdictLines(verdicts));

  const reportPath = path.join(input.output, unitReport);
  const report = yield* Effect.tryPromise({
    catch: () => new ReportUnreadable({ path: reportPath }),
    try: () => readFile(reportPath, "utf-8"),
  });
  const unitResults = yield* decodeReport(report, input.root);
  const browserPath = path.join(input.output, browserReport);
  const browserResults = yield* readBrowserOutput(browserPath).pipe(
    Effect.flatMap((text) => decodeReport(text, input.root)),
    Effect.catchTag("SchemaError", () =>
      Effect.fail(new BrowserOutputUnreadable({ path: browserPath })),
    ),
  );
  const runPath = path.join(input.output, browserRunFile);
  const run = yield* readBrowserOutput(runPath).pipe(
    Effect.flatMap(decodeRun),
    Effect.catchTag("SchemaError", () =>
      Effect.fail(new BrowserOutputUnreadable({ path: runPath })),
    ),
  );
  const results = [...unitResults, ...browserResults];
  const built = ledger({
    browserRuns: [run],
    claims: input.claims,
    corpus: new Set(members),
    exclusions: input.exclusions,
    features: input.features,
    records: input.records,
    results,
    sources: input.sources,
  });
  const found = honesty({
    claims: input.claims,
    conf: input.conf,
    features: input.features,
    sources: input.sources,
  });
  const problems = [
    ...found,
    ...unbackedInRun(
      input.claims,
      results,
      new Set(found.filter((problem) => problem.kind === "unbacked-claim").map(({ id }) => id)),
    ),
  ];

  yield* writeOutput(ledgerJson, `${yield* encodeLedger(built)}\n`);
  yield* writeOutput(ledgerTxt, ledgerText(built, browserSupport, input.notes));

  const failed = results.filter((result) => result.state === "failed");

  yield* Effect.annotateCurrentSpan({
    "ledger.documents": members.length,
    "ledger.failed": failed.length,
    "ledger.problems": problems.length,
  });

  return {
    browserExit: input.browserExit,
    exitCode:
      input.testExit === 0 &&
      input.browserExit === 0 &&
      failed.length === 0 &&
      problems.length === 0
        ? 0
        : 1,
    failed,
    ledger: built,
    output: input.output,
    problems,
    testExit: input.testExit,
    verdicts,
    written,
  };
});

/**
 * Write a level's name as a heading word.
 *
 * @param level A level.
 * @returns It with a capital first letter.
 */
const levelWord = (level: string): string => `${level.slice(0, 1).toUpperCase()}${level.slice(1)}`;

/**
 * Write what a build wrote and found, the text the command prints: the outputs' paths, the
 * documents by verdict, each level's headline, each engine of the browser run with its version and
 * counts (WebKit's with the sentence that it stands in for Safari), each failed test, each run's
 * exit code when it was not 0, and each honesty problem.
 *
 * @param outcome The build's outcome.
 * @returns The lines, each ending in a line feed.
 */
export const summary = (outcome: LedgerOutcome): string => {
  /**
   * Count the documents with one verdict.
   *
   * @param verdict A verdict.
   * @returns How many documents have it, followed by the verdict.
   */
  const verdictCount = (verdict: Verdict["verdict"]): string =>
    `${String(outcome.verdicts.filter((candidate) => candidate.verdict === verdict).length)} ${verdict}`;

  return [
    "Wrote:",
    ...outcome.written.map((file) => `  ${file}`),
    `Opened ${String(outcome.verdicts.length)} documents: ${(["accepted", "accepted-with-unsupported", "unchecked", "refused"] as const).map(verdictCount).join(", ")}.`,
    ...levels.map(
      (level) =>
        `${levelWord(level)}: ${rowStates.map((state) => `${String(outcome.ledger.headlines[level][state])} ${state}`).join(", ")}`,
    ),
    ...outcome.ledger.browserRuns.map(
      (run) =>
        `Browser run, ${run.engine} ${run.version}: ${String(run.passed)} passed, ${String(run.failed)} failed.${run.engine === "webkit" ? ` ${standsInForSafari}.` : ""}`,
    ),
    ...outcome.failed.map((test) => `Failed: ${test.file} > ${test.fullName}`),
    ...(outcome.testExit === 0
      ? []
      : [
          `The test run exited with code ${String(outcome.testExit)}; read its output above for the failure.`,
        ]),
    ...(outcome.browserExit === 0
      ? []
      : [
          `The browser run exited with code ${String(outcome.browserExit)}; read its output above for the failure.`,
        ]),
    ...outcome.problems.map(
      (problem) => `Honesty, ${problem.kind} ${problem.id}: ${problem.detail}`,
    ),
  ]
    .map((line) => `${line}\n`)
    .join("");
};

/**
 * Print a build's summary and give the command's exit code: the build's own, or 1 after printing
 * the failure's message when a run left no report, or no browser-run record, the build can read.
 * The verdicts are written before either is read, so they survive that failure.
 *
 * @param input The build's input, as {@link buildLedger} takes it.
 * @returns The exit code; the build's other failures.
 */
export const settle = Effect.fn("settle")(function* settle(
  input: LedgerBuild,
): Effect.fn.Return<
  0 | 1,
  | Config.ConfigError
  | CorpusFileUnreadable
  | CorpusMissing
  | OutputUnwritable
  | ReportOutsideRoot
  | Schema.SchemaError
> {
  return yield* buildLedger(input).pipe(
    Effect.flatMap((outcome) => Console.log(summary(outcome)).pipe(Effect.as(outcome.exitCode))),
    Effect.catchTags({
      BrowserOutputUnreadable: (failure) =>
        Console.error(failure.message).pipe(Effect.as(1 as const)),
      ReportUnreadable: (failure) => Console.error(failure.message).pipe(Effect.as(1 as const)),
    }),
  );
});

/**
 * How the command starts a test run, the unit run or the browser run.
 */
export interface TestCommand {
  /**
   * The arguments `vp` runs with.
   */
  readonly args: readonly string[];
  /**
   * The folder the run starts in, the package directory.
   */
  readonly cwd: string;
  /**
   * The child's environment: the command's own, with the `test` script's `TMPDIR` and
   * `NODE_OPTIONS`, `PLATE_REQUIRE_CACHES` at `1`, and for the browser run the browsers' folder and
   * the ledger's.
   */
  readonly environment: Readonly<Record<string, string | undefined>>;
  /**
   * The `vp` executable.
   */
  readonly file: string;
}

/**
 * What a test run's command is built from.
 */
interface CommandInput {
  /**
   * The command's own environment, which the child inherits.
   */
  readonly environment: Readonly<Record<string, string | undefined>>;
  /**
   * `NODE_OPTIONS` as the command received it, possibly empty.
   */
  readonly nodeOptions: string;
  /**
   * The output folder.
   */
  readonly output: string;
  /**
   * The package directory.
   */
  readonly packageDirectory: string;
  /**
   * The `vp` executable, as {@link findVp} gives it.
   */
  readonly vp: string;
}

/**
 * Construct a run's command: `vp test run` with the given leading arguments, the default and JSON
 * reporters and the JSON report at `report` in the output folder, in the package directory, with
 * the `test` script's environment: `TMPDIR` at `work/.vp-tmp` in the package and `NODE_OPTIONS`
 * with `--disable-proto=delete --disable-sigusr1` appended. It also sets `PLATE_REQUIRE_CACHES` to
 * `1`, after the inherited environment so an inherited `0` cannot turn it off: a test whose cache
 * is missing then fails, where under the `test` script it would be skipped.
 *
 * @param input What the command is built from.
 * @param leading The arguments after `test run`, before the reporters.
 * @param report The JSON report's name in the output folder.
 * @returns The command.
 */
const runCommand = (
  input: CommandInput,
  leading: readonly string[],
  report: string,
): TestCommand => ({
  args: [
    "test",
    "run",
    ...leading,
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${path.join(input.output, report)}`,
  ],
  cwd: input.packageDirectory,
  environment: {
    ...input.environment,
    NODE_OPTIONS: [input.nodeOptions.trim(), ...requiredNodeOptions]
      .filter((option) => option !== "")
      .join(" "),
    PLATE_REQUIRE_CACHES: "1",
    TMPDIR: path.join(input.packageDirectory, "work", ".vp-tmp"),
  },
  file: input.vp,
});

/**
 * Construct the unit run's command: `vp test run` with the default and JSON reporters, the JSON
 * report at `vitest.json` in the output folder, in the package directory, with the `test` script's
 * environment: `TMPDIR` at `work/.vp-tmp` in the package and `NODE_OPTIONS` with
 * `--disable-proto=delete --disable-sigusr1` appended. `PLATE_REQUIRE_CACHES` is `1`, so a test
 * whose cache is missing fails instead of being skipped.
 *
 * @param input What the command is built from.
 * @returns The command.
 */
export const testCommand = (input: CommandInput): TestCommand => runCommand(input, [], unitReport);

/**
 * Construct the browser run's command, as the `test:browser` script runs it: the unit run's
 * command with `--config vite.browser.config.ts` and the JSON report at `browser.json`, and in its
 * environment `PLAYWRIGHT_BROWSERS_PATH` at `.cache/gr8des/ms-playwright` under the home folder and
 * `PLATE_LEDGER_DIR` at the output folder, so the browser run's setup writes the browser-run record
 * where the command reads it.
 *
 * @param input What the command is built from.
 * @param input.home The home folder, `HOME`, which holds the browsers' cache.
 * @returns The command.
 */
export const browserCommand = (input: CommandInput & { readonly home: string }): TestCommand => {
  const command = runCommand(input, ["--config", "vite.browser.config.ts"], browserReport);

  return {
    ...command,
    environment: {
      ...command.environment,
      PLATE_LEDGER_DIR: input.output,
      PLAYWRIGHT_BROWSERS_PATH: path.join(input.home, ".cache", "gr8des", "ms-playwright"),
    },
  };
};

/**
 * Find the `vp` that `pnpm` runs for the package: `node_modules/.bin/vp` in the package directory
 * or the nearest folder above it that has one.
 *
 * Pnpm puts the package's `node_modules/.bin` on `PATH` before the workspace root's, and `vp`
 * comes from the root's `vite-plus`, so it is the root's that a package script runs; this search
 * finds the same file, so a bare `node scripts/ledger.ts` runs the tests as `pnpm` does.
 *
 * @param from The folder to start from.
 * @returns The executable's path; {@link VpMissing} when no folder from `from` up has one.
 */
export const findVp = Effect.fn("findVp")(function* findVp(
  from: string,
): Effect.fn.Return<string, VpMissing> {
  let folder = path.resolve(from);

  for (;;) {
    const candidate = path.join(folder, "node_modules", ".bin", "vp");
    const found = yield* Effect.tryPromise(() => access(candidate, constants.X_OK)).pipe(
      Effect.as(true),
      Effect.orElseSucceed(() => false),
    );

    if (found) {
      return candidate;
    }

    const parent = path.dirname(folder);

    if (parent === folder) {
      return yield* new VpMissing({ from });
    }

    folder = parent;
  }
});

/**
 * Run one suite's tests and wait for them to finish, their output going to the command's own.
 *
 * The child is `node:child_process`'s `spawn`, which Effect lifts through `Effect.callback`: the
 * package carries no platform layer for Effect's own child-process module. Interrupting the effect
 * aborts the child through the callback's signal.
 *
 * @param command The command, as {@link testCommand} builds it.
 * @returns The run's exit code, 1 when a signal ended it; {@link TestRunFailed} when it cannot
 *   start.
 */
const runTests = Effect.fn("runTests")(function* runTests(
  command: TestCommand,
): Effect.fn.Return<number, TestRunFailed> {
  yield* Effect.annotateCurrentSpan("ledger.vp", command.file);

  return yield* Effect.callback<number, TestRunFailed>((resume, signal) => {
    const child = spawn(command.file, command.args, {
      cwd: command.cwd,
      env: command.environment,
      signal,
      stdio: "inherit",
    });

    child.once("error", (cause) => {
      resume(Effect.fail(new TestRunFailed({ detail: cause.message, file: command.file })));
    });
    child.once("close", (code) => {
      resume(Effect.succeed(code ?? 1));
    });
  });
});

/**
 * Read every test file under {@link testFolders}.
 *
 * @param root The package directory.
 * @returns Each test file's text, keyed by its path relative to `root` with `/` separators, in
 *   sorted order; {@link SourceUnreadable} when a folder or file cannot be read.
 */
const readSources = Effect.fn("readSources")(function* readSources(
  root: string,
): Effect.fn.Return<ReadonlyMap<string, string>, SourceUnreadable> {
  const files: string[] = [];

  for (const folder of testFolders) {
    const entries = yield* Effect.tryPromise({
      catch: () => new SourceUnreadable({ path: path.join(root, folder) }),
      try: () => readdir(path.join(root, folder), { recursive: true }),
    });

    files.push(
      ...entries
        .filter((entry) => entry.endsWith(".test.ts"))
        .map((entry) => `${folder}/${entry.split(path.sep).join("/")}`),
    );
  }

  const read = yield* Effect.forEach(files.toSorted(), (file) =>
    Effect.tryPromise({
      catch: () => new SourceUnreadable({ path: path.join(root, file) }),
      try: () => readFile(path.join(root, file), "utf-8"),
    }).pipe(Effect.map((text) => [file, text] as const)),
  );

  return new Map(read);
});

/**
 * Read the conformance text from the cache under `HOME`.
 */
const readConf = Effect.gen(function* readConf() {
  const file = yield* confPath;

  return yield* Effect.tryPromise({
    catch: () => new ConfUnreadable({ path: file }),
    try: () => readFile(file, "utf-8"),
  });
});

/**
 * Create the output folder and remove the files an earlier run left in it for the command to
 * read, {@link runFiles}, so this run's files are the only ones it reads.
 *
 * @param output The output folder.
 * @returns Nothing; {@link OutputUnwritable} when the folder cannot be created or a file cannot be
 *   removed.
 */
export const prepareOutput = Effect.fn("prepareOutput")(function* prepareOutput(
  output: string,
): Effect.fn.Return<void, OutputUnwritable> {
  yield* makeDirectory(output);

  for (const name of runFiles) {
    const file = path.join(output, name);

    yield* Effect.tryPromise({
      catch: () => new OutputUnwritable({ path: file }),
      try: () => rm(file, { force: true }),
    });
  }
});

/**
 * The command: read the inputs that do not depend on the runs, run the unit tests and then the
 * browser tests, build the ledger, print what was written and found, and set the exit code.
 */
const program = Effect.gen(function* ledgerCommand() {
  const output = yield* ledgerDirectory;
  const conf = yield* readConf;
  const sources = yield* readSources(packageDirectory);
  const vp = yield* findVp(packageDirectory);
  const home = yield* Config.String("HOME");
  const nodeOptions = yield* Config.String("NODE_OPTIONS").pipe(Config.withDefault(""));
  const input = { environment: process.env, nodeOptions, output, packageDirectory, vp };

  yield* prepareOutput(output);
  yield* makeDirectory(path.join(packageDirectory, "work", ".vp-tmp"));

  const testExit = yield* runTests(testCommand(input));
  const browserExit = yield* runTests(browserCommand({ ...input, home }));
  const exitCode = yield* settle({
    browserExit,
    claims,
    conf,
    exclusions,
    features,
    notes: sessionNotes,
    output,
    records: passes,
    root: packageDirectory,
    sources,
    testExit,
  });

  yield* Effect.sync(() => {
    process.exitCode = exitCode;
  });
}).pipe(Effect.withSpan("ledger"));

if (import.meta.main) {
  await Effect.runPromise(program);
}
