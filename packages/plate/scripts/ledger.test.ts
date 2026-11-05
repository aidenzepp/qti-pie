import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Console, Effect, Schema } from "effect";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { generateFeatures } from "#plate/ledger/features.ts";
import type { SessionNote } from "#plate/ledger/passes.ts";
import { Ledger } from "#plate/ledger/report.ts";
import { browserRunFile, standsInForSafari } from "#plate/ledger/runs.ts";
import type { BrowserRun } from "#plate/ledger/runs.ts";
import { ledgerText } from "#plate/ledger/view.ts";
import {
  browserCommand,
  buildLedger,
  findVp,
  outputNames,
  prepareOutput,
  settle,
  summary,
  testCommand,
  VerdictEntry,
} from "#scripts/ledger.ts";
import type { LedgerBuild, LedgerOutcome } from "#scripts/ledger.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files. It stands for the
 * package directory: the fixture report names its test files under it.
 */
const scratch = path.resolve(import.meta.dirname, "..", "work", `ledger-test-${randomUUID()}`);

/**
 * The two-document corpus root under {@link scratch}.
 */
const corpus = path.join(scratch, "corpus");

/**
 * The fixture corpus: a minimal item the validator accepts, and a document that is not
 * well-formed.
 */
const documents: ReadonlyMap<string, string> = new Map([
  [
    "a/accepted.xml",
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p>Hello</p></qti-item-body></qti-assessment-item>',
  ],
  ["b/broken.xml", "<qti-assessment-item>"],
]);

/**
 * A hand-built conformance text with the three headings the generator reads and two rows, I-19
 * and Q-2, both required at Basic.
 */
const fixtureConf = [
  "### 3.1 1EdTech Levels Certification Requirements",
  "",
  "| I-19 | Shared class vocabulary | R | R",
  "",
  "| Q-2 | Choice Interaction | R | R",
  "",
  "### 3.3 Elevated Accessibility Conformance Requirements",
  "",
  "## A. APPENDIX A: QTI 3.0 Feature List",
  "",
  "| I-19 | Shared class vocabulary",
  "",
  "| Q-2 | Choice Interaction",
  "",
].join("\n");

/**
 * The fixture test file, by its path under {@link scratch}: two tagged tests, one naming a corpus
 * document.
 */
const testFile = "src/styles.test.ts";

/**
 * The fixture test file's text: the claim on I-19 is backed in the sources, and the Choice test
 * names `a/accepted.xml`.
 */
const testSource = [
  'describe("styles.css", () => {',
  '  test.effect("[I-19] [Q-2] names every Choice class", () => Effect.void);',
  '  it("[Q-2] posts the choice", () => open("a/accepted.xml"));',
  "});",
].join("\n");

/**
 * The passing title of the test that backs the claim.
 */
const backing = "styles.css [I-19] [Q-2] names every Choice class";

/**
 * The title of the Choice test that posts.
 */
const posting = "styles.css [Q-2] posts the choice";

/**
 * The fixture browser file, by its path under {@link scratch}, which the browser run's report
 * names.
 */
const browserFile = "src/dev/walk.browser.test.ts";

/**
 * One test as a fixture report lists it: the titles of the `describe` blocks around it (none by
 * default), its full name and its state.
 */
interface ReportedTest {
  readonly ancestorTitles?: readonly string[];
  readonly fullName: string;
  readonly status: string;
}

/**
 * Write a Vitest JSON report with one test file, as `vp test run --reporter=json` writes it.
 *
 * @param tests Each test's `describe` titles, full name and state.
 * @param file The test file, by its path under {@link scratch}: {@link testFile} by default.
 * @returns The report's text.
 */
const report = (tests: readonly ReportedTest[], file: string = testFile): string =>
  JSON.stringify({
    numFailedTests: tests.filter((test) => test.status === "failed").length,
    testResults: [
      {
        assertionResults: tests.map((test) => ({
          ancestorTitles: [],
          ...test,
          title: test.fullName,
        })),
        name: path.join(scratch, file),
        status: "passed",
      },
    ],
  });

/**
 * One browser test as a fixture report lists it: under the `describe` named for its engine, as
 * `eachEngine` registers it.
 *
 * @param engine The engine.
 * @param title The test's own title.
 * @param status How it ended.
 * @returns The test.
 */
const inEngine = (engine: string, title: string, status: string): ReportedTest => ({
  ancestorTitles: [engine],
  fullName: `${engine} ${title}`,
  status,
});

/**
 * The browser run's report when each engine passed one untagged test.
 */
const browserPassing = report(
  [
    inEngine("chromium", "answers the item", "passed"),
    inEngine("webkit", "answers the item", "passed"),
  ],
  browserFile,
);

/**
 * The fixture browser-run record: both engines, WebKit standing in for Safari.
 */
const fixtureRun: BrowserRun = {
  date: "2026-11-05T12:00:00Z",
  engines: [
    { engine: "chromium", version: "140.0.7339.16" },
    { engine: "webkit", standsInFor: "Safari", version: "26.0" },
  ],
  playwright: "1.64.1",
};

/**
 * Prepare an output folder holding what the two runs leave: the unit run's report, the browser
 * run's report and the browser-run record.
 *
 * @param name The folder's name under {@link scratch}.
 * @param text The unit run's report, `vitest.json`.
 * @param browser The browser run's report, `browser.json`: {@link browserPassing} by default.
 * @returns The folder's path.
 */
const outputWith = (name: string, text: string, browser: string = browserPassing): string => {
  const output = path.join(scratch, name);

  mkdirSync(output, { recursive: true });
  writeFileSync(path.join(output, "vitest.json"), text);
  writeFileSync(path.join(output, "browser.json"), browser);
  writeFileSync(path.join(output, browserRunFile), JSON.stringify(fixtureRun));

  return output;
};

/**
 * The unit run's report when the claim's test and the Choice test both passed.
 */
const unitPassing = report([
  { fullName: backing, status: "passed" },
  { fullName: posting, status: "passed" },
]);

/**
 * The fixture session notes: one note on one sitting.
 */
const notes: readonly SessionNote[] = [
  { date: "2026-11-05", owner: "operator", text: "A fixture sitting, step 1 only." },
];

/**
 * Build the input of one build over the fixtures.
 *
 * @param output The output folder, which holds the fixture reports and run record.
 * @param testExit The unit run's exit code.
 * @param browserExit The browser run's exit code.
 * @returns The input.
 */
const fixture = (output: string, testExit = 0, browserExit = 0): LedgerBuild => ({
  browserExit,
  claims: [{ id: "I-19", source: "a member-only checklist" }],
  conf: fixtureConf,
  exclusions: [],
  features: generateFeatures(fixtureConf),
  notes,
  output,
  records: [],
  root: scratch,
  sources: new Map([[testFile, testSource]]),
  testExit,
});

/**
 * Run one build over the fixture corpus, through `PLATE_CORPUS_DIR`.
 *
 * @param input The build's input.
 * @returns The build's outcome.
 */
const build = (input: LedgerBuild) =>
  buildLedger(input).pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: corpus }))),
  );

/**
 * Settle one build over the fixture corpus, printing through a console that keeps what it is
 * given.
 *
 * @param input The build's input.
 * @returns The exit code, and what was printed on standard output and on standard error.
 */
const settled = (input: LedgerBuild) =>
  Effect.gen(function* settledBuild() {
    const error: unknown[] = [];
    const log: unknown[] = [];
    const keeping: Console.Console = {
      ...globalThis.console,
      error: (...args: readonly unknown[]) => {
        error.push(...args);
      },
      log: (...args: readonly unknown[]) => {
        log.push(...args);
      },
    };
    const exitCode = yield* settle(input).pipe(
      Effect.provideService(Console.Console, keeping),
      Effect.provide(
        ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: corpus })),
      ),
    );

    return { exitCode, printed: { error, log } };
  });

/**
 * Read one of a build's outputs.
 *
 * @param output The output folder.
 * @param name The output's file name.
 * @returns Its text.
 */
const readOutput = (output: string, name: string): string =>
  readFileSync(path.join(output, name), "utf-8");

/**
 * Decode the ledger a build wrote.
 */
const decodeLedger = Schema.decodeUnknownSync(Schema.fromJsonString(Ledger));

/**
 * Decode the verdicts a build wrote.
 */
const decodeVerdicts = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Array(VerdictEntry)));

/**
 * The basic level's headline when the claim's test passes and nothing fails: I-19 limited, Q-2
 * covered.
 */
const honestBasic = { covered: 1, excluded: 0, limited: 1, "unsupported-with-notice": 0 };

/**
 * Assert that a build wrote all four outputs.
 *
 * @param outcome The build's outcome.
 */
const assertWritten = (outcome: LedgerOutcome): void => {
  assert.deepStrictEqual(
    outcome.written,
    outputNames.map((name) => path.join(outcome.output, name)),
  );

  for (const name of outputNames) {
    assert.isTrue(existsSync(path.join(outcome.output, name)), name);
  }
};

beforeAll(() => {
  for (const [member, text] of documents) {
    mkdirSync(path.dirname(path.join(corpus, member)), { recursive: true });
    writeFileSync(path.join(corpus, member), text);
  }
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("scripts/ledger.ts", () => {
  it.effect("writes the four outputs with the expected headlines, and exits 0", () =>
    Effect.gen(function* honestBuild() {
      const output = outputWith("honest", unitPassing);
      const outcome = yield* build(fixture(output));

      assertWritten(outcome);
      assert.strictEqual(outcome.exitCode, 0);
      assert.deepStrictEqual(outcome.problems, []);

      const written = decodeLedger(readOutput(output, "ledger.json"));

      assert.deepStrictEqual(written.headlines.basic, honestBasic);
      assert.deepStrictEqual(written, outcome.ledger);
      assert.strictEqual(
        readOutput(output, "ledger.txt"),
        ledgerText(written, browserSupport, notes),
      );
      assert.deepStrictEqual(
        written.rows
          .find((row) => row.id === "Q-2")
          ?.proofs.flatMap((proof) => (proof.kind === "fixtures" ? proof.documents : [])),
        ["a/accepted.xml"],
      );

      const verdicts = decodeVerdicts(readOutput(output, "verdicts.json"));

      assert.deepStrictEqual(
        verdicts.map((entry) => [entry.document, entry.verdict]),
        [
          ["a/accepted.xml", "accepted"],
          ["b/broken.xml", "refused"],
        ],
      );
      assert.deepStrictEqual(
        verdicts.flatMap((entry) =>
          entry.verdict === "refused" ? entry.refusals.map((refusal) => refusal.rule) : [],
        ),
        ["not-well-formed"],
      );

      const lines = readOutput(output, "verdicts.txt").split("\n");

      assert.lengthOf(lines, 3);
      assert.strictEqual(
        lines[0],
        "a/accepted.xml | accepted | reason: none | unsupported features: none",
      );
      assert.isTrue(lines[1]?.startsWith("b/broken.xml | refused | reason: not-well-formed: "));
      assert.include(
        summary(outcome),
        "Basic: 1 covered, 0 excluded, 1 limited, 0 unsupported-with-notice",
      );
    }),
  );

  it.effect("writes the build's session notes into ledger.txt", () =>
    Effect.gen(function* notedBuild() {
      const output = outputWith("notes", unitPassing);

      yield* build(fixture(output));

      assert.include(
        readOutput(output, "ledger.txt"),
        "\nSession notes\nDate: 2026-11-05; Owner: operator; Note: A fixture sitting, step 1 only.\n",
      );
    }),
  );

  it.effect("exits non-zero when a test failed, after writing the four outputs", () =>
    Effect.gen(function* failingBuild() {
      const output = outputWith(
        "failing",
        report([
          { fullName: backing, status: "passed" },
          { fullName: posting, status: "failed" },
        ]),
      );
      const outcome = yield* build(fixture(output, 1));

      assertWritten(outcome);
      assert.strictEqual(outcome.exitCode, 1);
      assert.deepStrictEqual(
        outcome.failed.map((test) => test.fullName),
        [posting],
      );
      assert.deepStrictEqual(
        decodeLedger(readOutput(output, "ledger.json")).headlines.basic,
        honestBasic,
      );
      assert.include(summary(outcome), posting);
    }),
  );

  it.effect("exits non-zero when the test run failed though every reported test passed", () =>
    Effect.gen(function* failedRun() {
      const output = outputWith("run", report([{ fullName: backing, status: "passed" }]));
      const outcome = yield* build(fixture(output, 1));

      assertWritten(outcome);
      assert.deepStrictEqual(outcome.failed, []);
      assert.strictEqual(outcome.exitCode, 1);
    }),
  );

  it.effect(
    "repeats the claim check over the run: a claim whose tagged tests all skipped is unbacked",
    () =>
      Effect.gen(function* skippedClaim() {
        const output = outputWith(
          "skipped",
          report([
            { fullName: backing, status: "skipped" },
            { fullName: posting, status: "passed" },
          ]),
        );
        const outcome = yield* build(fixture(output));

        assertWritten(outcome);
        assert.strictEqual(outcome.exitCode, 1);
        assert.deepStrictEqual(
          outcome.problems.map((problem) => [problem.kind, problem.id]),
          [["unbacked-claim", "I-19"]],
        );
      }),
  );

  it.effect(
    "fails with ReportUnreadable after writing the verdicts when the run wrote no report",
    () =>
      Effect.gen(function* noReport() {
        const output = path.join(scratch, "no-report");
        const failure = yield* Effect.flip(build(fixture(output, 1)));

        assert.strictEqual(failure._tag, "ReportUnreadable");
        assert.isTrue(existsSync(path.join(output, "verdicts.json")));
        assert.isTrue(existsSync(path.join(output, "verdicts.txt")));
        assert.isFalse(existsSync(path.join(output, "ledger.json")));
      }),
  );

  it.effect(
    "merges both suites' results and writes each engine's version and counts into ledger.json",
    () =>
      Effect.gen(function* mergedBuild() {
        const output = outputWith(
          "merged",
          unitPassing,
          report(
            [
              inEngine("chromium", "[Q-2] [keyboard] answers the Choice by keys", "passed"),
              inEngine("chromium", "answers the item", "passed"),
              inEngine("webkit", "answers the item", "passed"),
              inEngine("webkit", "reads the item", "skipped"),
            ],
            browserFile,
          ),
        );
        const outcome = yield* build(fixture(output));

        assertWritten(outcome);
        assert.strictEqual(outcome.exitCode, 0);

        const written = decodeLedger(readOutput(output, "ledger.json"));

        assert.deepStrictEqual(written, outcome.ledger);
        assert.deepStrictEqual(written.browserRuns, [
          {
            date: fixtureRun.date,
            engine: "chromium",
            failed: 0,
            od14: { control: "absent", proof: "absent", result: "failed" },
            passed: 2,
            playwright: fixtureRun.playwright,
            version: "140.0.7339.16",
          },
          {
            date: fixtureRun.date,
            engine: "webkit",
            failed: 0,
            od14: { control: "absent", proof: "absent", result: "failed" },
            passed: 1,
            playwright: fixtureRun.playwright,
            standsInFor: "Safari",
            version: "26.0",
          },
        ]);

        const choice = written.rows.find((row) => row.id === "Q-2");

        assert.deepStrictEqual(
          choice?.proofs.map((proof) => proof.file),
          [browserFile, testFile],
        );
        assert.deepStrictEqual(
          choice !== undefined && "interaction" in choice ? choice.interaction.composition : [],
          ["dev playground in a browser"],
        );

        const printed = summary(outcome);

        assert.include(printed, "140.0.7339.16");
        assert.include(printed, "26.0");
        assert.include(printed, standsInForSafari);
      }),
  );

  it.effect("exits non-zero when a browser test failed, and counts it under its engine", () =>
    Effect.gen(function* failingBrowser() {
      const failing = inEngine("webkit", "answers the item", "failed");
      const output = outputWith(
        "browser-failing",
        unitPassing,
        report([inEngine("chromium", "answers the item", "passed"), failing], browserFile),
      );
      const outcome = yield* build(fixture(output, 0, 1));

      assertWritten(outcome);
      assert.strictEqual(outcome.exitCode, 1);
      assert.deepStrictEqual(
        outcome.failed.map((test) => [test.file, test.fullName]),
        [[browserFile, failing.fullName]],
      );
      assert.deepStrictEqual(
        outcome.ledger.browserRuns.map((row) => [row.engine, row.passed, row.failed]),
        [
          ["chromium", 1, 0],
          ["webkit", 0, 1],
        ],
      );
      assert.include(summary(outcome), failing.fullName);
    }),
  );

  it.effect("exits non-zero when the browser run failed though every reported test passed", () =>
    Effect.gen(function* failedBrowserRun() {
      const output = outputWith("browser-run", unitPassing);
      const outcome = yield* build(fixture(output, 0, 1));

      assertWritten(outcome);
      assert.deepStrictEqual(outcome.failed, []);
      assert.strictEqual(outcome.browserExit, 1);
      assert.strictEqual(outcome.exitCode, 1);
    }),
  );

  it.effect("prints the summary and gives the build's exit code", () =>
    Effect.gen(function* settledHonest() {
      const { exitCode, printed } = yield* settled(fixture(outputWith("settled", unitPassing)));

      assert.strictEqual(exitCode, 0);
      assert.lengthOf(printed.log, 1);
      assert.deepStrictEqual(printed.error, []);
    }),
  );

  it.effect(
    "fails with BrowserOutputUnreadable after writing the verdicts when the browser run wrote no report, and exits 1",
    () =>
      Effect.gen(function* noBrowserReport() {
        const output = outputWith("no-browser-report", unitPassing);
        const missing = path.join(output, "browser.json");

        rmSync(missing);

        const failure = yield* Effect.flip(build(fixture(output, 0, 1)));

        assert.strictEqual(failure._tag, "BrowserOutputUnreadable");
        assert.strictEqual(failure._tag === "BrowserOutputUnreadable" ? failure.path : "", missing);
        assert.isTrue(existsSync(path.join(output, "verdicts.json")));
        assert.isTrue(existsSync(path.join(output, "verdicts.txt")));
        assert.isFalse(existsSync(path.join(output, "ledger.json")));

        const { exitCode, printed } = yield* settled(fixture(output, 0, 1));

        assert.strictEqual(exitCode, 1);
        assert.deepStrictEqual(printed.log, []);
        assert.lengthOf(printed.error, 1);
      }),
  );

  it.effect(
    "fails with BrowserOutputUnreadable when the browser-run record is missing or does not decode",
    () =>
      Effect.gen(function* noRunRecord() {
        const cases = [
          ["missing-run", undefined],
          [
            "undecodable-run",
            JSON.stringify({ ...fixtureRun, engines: [{ engine: "webkit", version: "26.0" }] }),
          ],
        ] as const;

        for (const [name, text] of cases) {
          const output = outputWith(name, unitPassing);
          const record = path.join(output, browserRunFile);

          if (text === undefined) {
            rmSync(record);
          } else {
            writeFileSync(record, text);
          }

          const failure = yield* Effect.flip(build(fixture(output)));

          assert.strictEqual(failure._tag, "BrowserOutputUnreadable", name);
          assert.strictEqual(
            failure._tag === "BrowserOutputUnreadable" ? failure.path : "",
            record,
            name,
          );
          assert.isTrue(existsSync(path.join(output, "verdicts.json")), name);
          assert.isFalse(existsSync(path.join(output, "ledger.json")), name);
        }
      }),
  );

  it.effect("removes the files an earlier run left for the command to read, and nothing else", () =>
    Effect.gen(function* prepared() {
      const output = outputWith("prepared", unitPassing);
      const kept = path.join(output, "ledger.json");

      writeFileSync(kept, "{}");
      yield* prepareOutput(output);

      for (const name of ["vitest.json", "browser.json", browserRunFile]) {
        assert.isFalse(existsSync(path.join(output, name)), name);
      }

      assert.isTrue(existsSync(kept));

      yield* prepareOutput(path.join(scratch, "prepared-new"));

      assert.isTrue(existsSync(path.join(scratch, "prepared-new")));
    }),
  );

  it("runs the browser suite with its config, its report under the output folder, and the browsers under HOME", () => {
    const command = browserCommand({
      environment: { HOME: "/home/someone", PLATE_LEDGER_DIR: "elsewhere" },
      home: "/home/someone",
      nodeOptions: "--max-old-space-size=4096",
      output: "/p/work/ledger",
      packageDirectory: "/p",
      vp: "/r/node_modules/.bin/vp",
    });

    assert.deepStrictEqual(command, {
      args: [
        "test",
        "run",
        "--config",
        "vite.browser.config.ts",
        "--reporter=default",
        "--reporter=json",
        "--outputFile.json=/p/work/ledger/browser.json",
      ],
      cwd: "/p",
      environment: {
        HOME: "/home/someone",
        NODE_OPTIONS: "--max-old-space-size=4096 --disable-proto=delete --disable-sigusr1",
        PLATE_LEDGER_DIR: "/p/work/ledger",
        PLAYWRIGHT_BROWSERS_PATH: "/home/someone/.cache/gr8des/ms-playwright",
        TMPDIR: "/p/work/.vp-tmp",
      },
      file: "/r/node_modules/.bin/vp",
    });
  });

  it("runs vp's tests with the test script's environment and the report under the output folder", () => {
    const base = {
      environment: { HOME: "/home/someone", NODE_OPTIONS: "--stale" },
      output: "/p/work/ledger",
      packageDirectory: "/p",
      vp: "/r/node_modules/.bin/vp",
    };
    const command = testCommand({ ...base, nodeOptions: "--max-old-space-size=4096" });

    assert.deepStrictEqual(command, {
      args: [
        "test",
        "run",
        "--reporter=default",
        "--reporter=json",
        "--outputFile.json=/p/work/ledger/vitest.json",
      ],
      cwd: "/p",
      environment: {
        HOME: "/home/someone",
        NODE_OPTIONS: "--max-old-space-size=4096 --disable-proto=delete --disable-sigusr1",
        TMPDIR: "/p/work/.vp-tmp",
      },
      file: "/r/node_modules/.bin/vp",
    });
    assert.strictEqual(
      testCommand({ ...base, nodeOptions: "" }).environment["NODE_OPTIONS"],
      "--disable-proto=delete --disable-sigusr1",
    );
  });

  it.effect("finds the vp that pnpm runs from the package, and fails where none is", () =>
    Effect.gen(function* vp() {
      const found = yield* findVp(path.resolve(import.meta.dirname, ".."));

      assert.isTrue(found.endsWith(path.join("node_modules", ".bin", "vp")));
      assert.isTrue(existsSync(found));

      const failure = yield* Effect.flip(findVp(path.parse(scratch).root));

      assert.strictEqual(failure._tag, "VpMissing");
    }),
  );
});
