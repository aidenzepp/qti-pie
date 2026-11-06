import { assert, describe, it } from "@effect/vitest";
import { Effect, Result, Schema } from "effect";
import { claims } from "#plate/ledger/claims.ts";
import { exclusions, features, levels } from "#plate/ledger/features.ts";
import { ManualCheck, PassRecord } from "#plate/ledger/passes.ts";
import type { ScreenReaderPass } from "#plate/ledger/passes.ts";
import { decodeReport, ledger } from "#plate/ledger/report.ts";
import type { Ledger, LedgerRow, ProofFile, TestResult } from "#plate/ledger/report.ts";
import { standsInForSafari } from "#plate/ledger/runs.ts";
import type { BrowserRun } from "#plate/ledger/runs.ts";

/**
 * The package directory the fixture report says Vitest ran in.
 */
const root = "/work/plate";

/**
 * Build one test's entry as Vitest's JSON reporter writes it, with the keys the ledger ignores.
 *
 * @param fullName The test's full name.
 * @param status How it ended.
 * @returns The entry.
 */
const assertion = (fullName: string, status: string) => ({
  ancestorTitles: [],
  benchmarks: [],
  duration: 1,
  failureMessages: [],
  fullName,
  meta: {},
  status,
  tags: [],
  title: fullName,
});

/**
 * Build one test file's entry as Vitest's JSON reporter writes it.
 *
 * @param file The file's path under the package directory.
 * @param tests Each test's full name and status.
 * @returns The entry.
 */
const testFile = (file: string, tests: readonly (readonly [string, string])[]) => ({
  assertionResults: tests.map(([fullName, status]) => assertion(fullName, status)),
  endTime: 2,
  message: "",
  name: `${root}/${file}`,
  startTime: 1,
  status: "passed",
});

/**
 * The fixture tests, by file, as the report lists them.
 */
const fixtureFiles = [
  testFile("src/validate/open.test.ts", [
    ["validate/open.ts [Q-2] a Choice item is accepted", "passed"],
    ["validate/open.ts BG007 is accepted, the positive control", "passed"],
  ]),
  testFile("src/validate/rules.test.ts", [
    ["validate/rules.ts [I-2] an outcome declaration is checked", "passed"],
  ]),
  testFile("src/interactions/choice.test.ts", [
    ["interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard", "passed"],
    ["interactions/choice.ts [Q-20] a Text Entry takes text", "failed"],
    ["interactions/choice.ts [Q-5] an Extended Text takes text", "skipped"],
  ]),
  testFile("src/dev/page.test.ts", [
    ["dev/page.ts [Q-2] [keyboard] BG007 completes in the playground", "passed"],
    ["dev/page.ts [Q-31] a custom interaction shows the notice", "passed"],
  ]),
  testFile("src/styles.test.ts", [["styles.css [I-19] the vocabulary classes apply", "passed"]]),
  testFile("src/corpus.render.test.ts", [["[I-7] [I-8] every document renders", "passed"]]),
  testFile("src/render.test.ts", [["render.ts [I-1] a response declaration renders", "passed"]]),
  testFile("src/emit/maths.test.ts", [["emit/maths.ts [I-18] MathML is emitted", "passed"]]),
  testFile("src/score.test.ts", [["score.ts [I-9b] match_correct scores 1", "passed"]]),
];

/**
 * The fixture report's text.
 */
const reportText = JSON.stringify({
  numFailedTests: 1,
  numPassedTests: 11,
  numPendingTests: 1,
  numTotalTests: 13,
  startTime: 0,
  success: false,
  testResults: fixtureFiles,
});

/**
 * The fixture corpus: the corpus-relative paths a test file's string literal can name.
 */
const corpus = new Set([
  "QTI3_BPIG_Examples/items/BG007.xml",
  "QTI3_BPIG_Examples/items/BG010.xml",
  "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  "qtiv3-examples/CAT/test.xml",
]);

/**
 * The fixture test sources, as text, by file.
 */
const sources = new Map([
  [
    "src/validate/open.test.ts",
    [
      `// The reader doesn't open "large.xml" from the corpus: it is built here.`,
      `const location = "QTI3_BPIG_Examples/items/BG007.xml";`,
      `const cat = 'qtiv3-examples/CAT/test.xml';`,
      `const verdict = open("large.xml", bytes);`,
    ].join("\n"),
  ],
  [
    "src/dev/page.test.ts",
    [
      `const paths = { bg010: "QTI3_BPIG_Examples/items/BG010.xml" };`,
      `const asset = "/assets/QTI3_BPIG_Examples/items/images/airplane.png";`,
    ].join("\n"),
  ],
  [
    "src/interactions/choice.test.ts",
    "const item = `QTI3_BeginnersGuide_Examples/items/BG011.xml`;",
  ],
  ["src/corpus.render.test.ts", `const control = "QTI3_BPIG_Examples/items/BG007.xml";`],
]);

/**
 * The fields every fixture record shares.
 */
const recorded = {
  browser: "Safari",
  browserVersion: "26.1",
  item: "QTI3_BPIG_Examples/items/BG007.xml",
  macosVersion: "27.2",
  notes: "",
  owner: "operator",
  reader: "VoiceOver",
  readerVersion: "27.2",
} as const;

/**
 * The older screen-reader pass over the Choice, with JavaScript off.
 */
const earlierPass: ScreenReaderPass = {
  ...recorded,
  date: "2026-11-05",
  interactions: ["Q-2"],
  javascript: "off",
  kind: "screen-reader-pass",
  result: "passed",
};

/**
 * The later screen-reader pass over the Choice and the Text Entry, with JavaScript on.
 */
const laterPass: ScreenReaderPass = {
  ...recorded,
  date: "2026-11-06T10:30:00Z",
  interactions: ["Q-20", "Q-2"],
  javascript: "on",
  kind: "screen-reader-pass",
  result: "failed",
};

/**
 * The fixture records: two passes, an OD-14 (e) entry of each control, and NVDA unavailable.
 */
const records: readonly PassRecord[] = [
  laterPass,
  earlierPass,
  {
    ...recorded,
    check: "OD-14 (e)",
    control: "ran",
    date: "2026-11-05",
    javascript: "on",
    kind: "manual-check",
    reader: "none",
    readerVersion: "none",
    result: "passed",
  },
  {
    ...recorded,
    check: "OD-14 (e)",
    control: "did-not-run",
    date: "2026-11-04",
    javascript: "on",
    kind: "manual-check",
    reader: "none",
    readerVersion: "none",
    result: "not-observed",
  },
  {
    ...recorded,
    date: "2026-11-05",
    javascript: "off",
    kind: "unavailable-reader",
    reader: "NVDA",
    readerVersion: "none",
    result: "unavailable",
  },
];

/**
 * The ledger over the fixture report, the real features, exclusions and claims, and the fixture
 * records, sources and corpus.
 */
const fixtureLedger = decodeReport(reportText, root).pipe(
  Effect.map((results) =>
    ledger({ browserRuns: [], claims, corpus, exclusions, features, records, results, sources }),
  ),
);

/**
 * Derive the ledger over the fixture report with records added after the fixture's.
 *
 * @param added The records recorded after the fixture's.
 * @returns The ledger.
 */
const ledgerWith = (added: readonly PassRecord[]) =>
  decodeReport(reportText, root).pipe(
    Effect.map((results) =>
      ledger({
        browserRuns: [],
        claims,
        corpus,
        exclusions,
        features,
        records: [...records, ...added],
        results,
        sources,
      }),
    ),
  );

/**
 * An open screen-reader entry over the Choice and the Extended Text, recorded after every fixture
 * pass and dated later: a check a sitting left for a later one.
 */
const openPass: ScreenReaderPass = {
  ...recorded,
  date: "2026-11-07",
  interactions: ["Q-2", "Q-5"],
  javascript: "on",
  kind: "screen-reader-pass",
  notes: "not run in the first sitting (2026-11-05)",
  result: "not-observed",
};

/**
 * The fixture browser file, whose cases run once in each engine under a `describe` named for it.
 */
const walkFile = "src/dev/walk.browser.test.ts";

/**
 * Build one browser test's entry as Vitest's JSON reporter writes it: its title under the engine's
 * `describe` and the walk's.
 *
 * @param engine The engine whose `describe` holds the test.
 * @param title The test's own title.
 * @param status How it ended.
 * @returns The entry.
 */
const browserAssertion = (engine: string, title: string, status: string) => ({
  ...assertion(`${engine} the walk ${title}`, status),
  ancestorTitles: [engine, "the walk"],
  title,
});

/**
 * The fixture browser report's text: in each engine, a Choice walked by keys alone that passed and
 * a Text Entry walked by keys alone that failed.
 */
const browserReportText = JSON.stringify({
  testResults: [
    {
      ...testFile(walkFile, []),
      assertionResults: ["chromium", "webkit"].flatMap((engine) => [
        browserAssertion(engine, "[Q-2] [keyboard] BG007 by keys alone scores 1", "passed"),
        browserAssertion(engine, "[Q-20] [keyboard] a Text Entry by keys alone scores 1", "failed"),
      ]),
    },
  ],
});

/**
 * The fixture browser run: Chromium, and WebKit standing in for Safari.
 */
const browserRun: BrowserRun = {
  date: "2026-11-05T18:57:26.239Z",
  engines: [
    { engine: "chromium", version: "156.0.8078.4" },
    { engine: "webkit", standsInFor: "Safari", version: "27.2" },
  ],
  playwright: "1.64.1",
};

/**
 * A unit test outside the browser files under a `describe` named for an engine: it is not a browser
 * result, so no engine counts it.
 */
const engineNamedUnitTest: TestResult = {
  ancestorTitles: ["chromium"],
  file: "src/test/browsers.test.ts",
  fullName: "chromium is the first engine name",
  state: "passed",
};

/**
 * The ledger over the fixture report and the fixture browser report, with the fixture browser run.
 */
const browserLedger = Effect.all([
  decodeReport(reportText, root),
  decodeReport(browserReportText, root),
]).pipe(
  Effect.map(([units, browsers]) =>
    ledger({
      browserRuns: [browserRun],
      claims,
      corpus,
      exclusions,
      features,
      records,
      results: [...units, engineNamedUnitTest, ...browsers],
      sources,
    }),
  ),
);

/**
 * The OD-14 (e) browser file, whose control (a) and proof (b) run in each engine.
 */
const od14File = "src/dev/od14.browser.test.ts";

/**
 * Build one OD-14 (e) result as the reporter reads it: under the engine's `describe` and the one
 * named `OD-14 (e)`, as the browser file registers it.
 *
 * @param engine The engine.
 * @param title The test's own title.
 * @param state How it ended.
 * @param file The test file; the OD-14 (e) file when absent.
 * @returns The result.
 */
const od14Result = (
  engine: string,
  title: string,
  state: TestResult["state"],
  file = od14File,
): TestResult => ({
  ancestorTitles: [engine, "OD-14 (e)"],
  file,
  fullName: `${engine} OD-14 (e) ${title}`,
  state,
});

/**
 * The in-page test file, whose cases run inside each engine's page under Vitest's browser mode.
 */
const inPageFile = "src/test/page.dom.test.ts";

/**
 * Build one in-page result as the reporter reads it: under the `describe` named for the engine
 * alone, as an in-page file registers its cases through `describe(server.browser, …)`.
 *
 * @param engine The engine.
 * @param title The test's own title.
 * @param state How it ended.
 * @returns The result.
 */
const inPageResult = (engine: string, title: string, state: TestResult["state"]): TestResult => ({
  ancestorTitles: [engine],
  file: inPageFile,
  fullName: `${engine} ${title}`,
  state,
});

/**
 * Derive a ledger over the fixture browser run from browser results alone.
 *
 * @param results The browser results.
 * @returns The ledger.
 */
const runLedger = (results: readonly TestResult[]): Ledger =>
  ledger({
    browserRuns: [browserRun],
    claims,
    corpus,
    exclusions,
    features,
    records,
    results,
    sources,
  });

/**
 * List each engine of a ledger's browser runs with how many browser results it passed and failed.
 *
 * @param built The ledger.
 * @returns Each engine's name, passed count and failed count, in the runs' order.
 */
const engineCounts = (built: Ledger) =>
  built.browserRuns.map((run) => [run.engine, run.passed, run.failed] as const);

/**
 * Find a row of the ledger by its ID.
 *
 * @param built The ledger.
 * @param id The row's ID.
 * @returns The row; the test fails when there is none.
 */
const rowOf = (built: Ledger, id: string): LedgerRow => {
  const row = built.rows.find((candidate) => candidate.id === id);
  assert.isDefined(row, id);

  return row;
};

/**
 * Give a row's test files with the fixture documents each names, or `sweep` for a sweep file.
 *
 * @param proofs The row's proofs.
 * @returns Each file's path and what it names.
 */
const namedBy = (proofs: readonly ProofFile[]) =>
  proofs.map((proof) => [proof.file, proof.kind === "sweep" ? "sweep" : proof.documents]);

describe("ledger/report.ts", () => {
  it.effect(
    "the decoder reads each test's file, full name, ancestor titles and state, and nothing else",
    () =>
      Effect.gen(function* decodeFixture() {
        const results = yield* decodeReport(reportText, root);

        assert.lengthOf(results, 13);
        assert.deepStrictEqual(results[0], {
          ancestorTitles: [],
          file: "src/validate/open.test.ts",
          fullName: "validate/open.ts [Q-2] a Choice item is accepted",
          state: "passed",
        });
        assert.deepStrictEqual(
          results.map((result) => result.state),
          [
            "passed",
            "passed",
            "passed",
            "passed",
            "failed",
            "skipped",
            "passed",
            "passed",
            "passed",
            "passed",
            "passed",
            "passed",
            "passed",
          ],
        );
      }),
  );

  it.effect("the decoder refuses a test file outside the package directory", () =>
    Effect.gen(function* decodeOutside() {
      const refusal = yield* Effect.flip(decodeReport(reportText, "/elsewhere"));

      assert.propertyVal(refusal, "_tag", "ReportOutsideRoot");
      assert.propertyVal(refusal, "root", "/elsewhere");
    }),
  );

  it.effect("the decoder refuses text that is not a Vitest report", () =>
    Effect.gen(function* decodeNotAReport() {
      const refusal = yield* Effect.flip(decodeReport(`{"testResults": 1}`, root));

      assert.propertyVal(refusal, "_tag", "SchemaError");
    }),
  );

  it.effect("a row with a passing tagged test is covered", () =>
    Effect.gen(function* covered() {
      const built = yield* fixtureLedger;

      for (const id of ["Q-2", "I-1", "I-2", "I-7", "I-8", "I-9b", "I-18"]) {
        assert.strictEqual(rowOf(built, id).state, "covered", id);
      }
    }),
  );

  it.effect("a row whose only tagged test failed or was skipped is not covered", () =>
    Effect.gen(function* notCovered() {
      const built = yield* fixtureLedger;

      assert.strictEqual(rowOf(built, "Q-20").state, "unsupported-with-notice");
      assert.strictEqual(rowOf(built, "Q-5").state, "unsupported-with-notice");
      assert.deepStrictEqual(rowOf(built, "Q-20").proofs, []);
    }),
  );

  it.effect("an excluded row stays excluded though a passing test carries its tag", () =>
    Effect.gen(function* excluded() {
      const row = rowOf(yield* fixtureLedger, "Q-31");
      const exclusion = exclusions.find((candidate) => candidate.id === "Q-31");

      assert.isDefined(exclusion);
      assert.strictEqual(row.state, "excluded");
      assert.propertyVal(row, "reason", exclusion.reason);
      assert.propertyVal(row, "source", exclusion.source);
      assert.strictEqual(rowOf(yield* fixtureLedger, "Q-32").state, "excluded");
    }),
  );

  it.effect("I-19 with a passing tagged test is limited, with its claim's source", () =>
    Effect.gen(function* limited() {
      const row = rowOf(yield* fixtureLedger, "I-19");

      assert.strictEqual(row.state, "limited");
      assert.propertyVal(
        row,
        "source",
        "the Basic subset of the shared vocabulary is fixed by the certification checklists, which are member-only (reading I-8.1)",
      );
      assert.deepStrictEqual(namedBy(row.proofs), [["src/styles.test.ts", []]]);
    }),
  );

  it.effect("a row no test carries is unsupported-with-notice", () =>
    Effect.gen(function* none() {
      const row = rowOf(yield* fixtureLedger, "A-1");

      assert.strictEqual(row.state, "unsupported-with-notice");
      assert.deepStrictEqual(row.proofs, []);
      assert.isFalse(row.validates);
      assert.isFalse(row.renders);
    }),
  );

  it.effect("Validates is yes for a passing tagged test under src/validate/, and only then", () =>
    Effect.gen(function* validates() {
      const built = yield* fixtureLedger;

      assert.isTrue(rowOf(built, "Q-2").validates);
      assert.isTrue(rowOf(built, "I-2").validates);
      assert.isFalse(rowOf(built, "I-1").validates);
      assert.isFalse(rowOf(built, "I-9b").validates);
    }),
  );

  it.effect(
    "Renders is yes under src/emit/ or src/interactions/, in render.test.ts or a sweep",
    () =>
      Effect.gen(function* renders() {
        const built = yield* fixtureLedger;

        assert.isTrue(rowOf(built, "I-18").renders, "src/emit/");
        assert.isTrue(rowOf(built, "Q-2").renders, "src/interactions/");
        assert.isTrue(rowOf(built, "I-1").renders, "src/render.test.ts");
        assert.isTrue(rowOf(built, "I-7").renders, "a sweep file");
        assert.isFalse(rowOf(built, "I-2").renders, "src/validate/");
        assert.isFalse(rowOf(built, "I-9b").renders, "src/score.test.ts");
      }),
  );

  it.effect("Keyboard lists the passing tagged tests that carry the keyboard token", () =>
    Effect.gen(function* keyboard() {
      const built = yield* fixtureLedger;

      assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.keyboard, [
        "interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard",
        "dev/page.ts [Q-2] [keyboard] BG007 completes in the playground",
      ]);
      assert.deepStrictEqual(rowOf(built, "Q-5").interaction?.keyboard, []);
      assert.notProperty(rowOf(built, "I-7"), "interaction");
    }),
  );

  it.effect("Screen-reader pass is the latest record whose interactions include the ID", () =>
    Effect.gen(function* screenReader() {
      const built = yield* fixtureLedger;

      assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.screenReaderPass, laterPass);
      assert.deepStrictEqual(rowOf(built, "Q-20").interaction?.screenReaderPass, laterPass);
      assert.notProperty(rowOf(built, "Q-5").interaction, "screenReaderPass");
    }),
  );

  it.effect("an open, not-observed entry never replaces a recorded pass, though it is later", () =>
    Effect.gen(function* openNeverReplaces() {
      const built = yield* ledgerWith([openPass]);

      assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.screenReaderPass, laterPass);
      assert.deepStrictEqual(built.records.at(-1), openPass);
    }),
  );

  it.effect("an interaction whose only screen-reader entries are not-observed has no pass", () =>
    Effect.gen(function* onlyOpen() {
      const built = yield* ledgerWith([openPass, { ...openPass, interactions: ["Q-5"] }]);

      assert.notProperty(rowOf(built, "Q-5").interaction, "screenReaderPass");
    }),
  );

  it("a screen-reader pass, a keyboard walk-through and the M1 walk-through admit not-observed", () => {
    const open = { ...recorded, date: "2026-11-05", javascript: "on", result: "not-observed" };

    assert.isTrue(Result.isSuccess(Schema.decodeUnknownResult(PassRecord)(openPass)));
    for (const check of ["keyboard-walk-through", "M1 walk-through"]) {
      const entry = { ...open, check, kind: "manual-check", reader: "none", readerVersion: "none" };

      assert.isTrue(Result.isSuccess(Schema.decodeUnknownResult(ManualCheck)(entry)), check);
    }
    assert.isTrue(
      Result.isFailure(
        Schema.decodeUnknownResult(ManualCheck)({
          ...open,
          check: "M1 walk-through",
          kind: "manual-check",
          result: "unavailable",
        }),
      ),
    );
  });

  it.effect("Composition names the dev playground and the test-built form of keyboard proofs", () =>
    Effect.gen(function* composition() {
      const built = yield* fixtureLedger;

      assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.composition, [
        "dev playground",
        "test-built form",
      ]);
      assert.deepStrictEqual(rowOf(built, "Q-31").interaction?.composition, []);
    }),
  );

  it.effect(
    "a passing Q-2 keyboard test in a browser file gives Q-2 the composition dev playground in a browser",
    () =>
      Effect.gen(function* browserComposition() {
        const built = yield* browserLedger;

        assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.composition, [
          "dev playground",
          "dev playground in a browser",
          "test-built form",
        ]);
        assert.deepStrictEqual(rowOf(built, "Q-2").interaction?.keyboard, [
          "interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard",
          "dev/page.ts [Q-2] [keyboard] BG007 completes in the playground",
          "chromium the walk [Q-2] [keyboard] BG007 by keys alone scores 1",
          "webkit the walk [Q-2] [keyboard] BG007 by keys alone scores 1",
        ]);
      }),
  );

  it.effect("a failing browser test backs no row", () =>
    Effect.gen(function* browserFailure() {
      const row = rowOf(yield* browserLedger, "Q-20");

      assert.strictEqual(row.state, "unsupported-with-notice");
      assert.deepStrictEqual(row.proofs, []);
      assert.deepStrictEqual(row.interaction?.keyboard, []);
      assert.deepStrictEqual(row.interaction?.composition, []);
    }),
  );

  it.effect(
    "each engine of a browser run counts its passed and failed browser results, WebKit standing in for Safari",
    () =>
      Effect.gen(function* browserCounts() {
        const built = yield* browserLedger;
        const common = {
          date: browserRun.date,
          failed: 1,
          od14: { control: "absent", proof: "absent", result: "failed" },
          passed: 1,
          playwright: "1.64.1",
        } as const;

        assert.deepStrictEqual(built.browserRuns, [
          { ...common, engine: "chromium", version: "156.0.8078.4" },
          { ...common, engine: "webkit", standsInFor: "Safari", version: "27.2" },
        ]);
        assert.strictEqual(standsInForSafari, "WebKit stands in for Safari until safaridriver");
      }),
  );

  it.effect(
    "each engine of a browser run counts its in-page results beside its Node-driven browser results",
    () =>
      Effect.gen(function* inPageCounts() {
        const browsers = yield* decodeReport(browserReportText, root);
        const inPage = browserRun.engines.map(({ engine }) =>
          inPageResult(engine, "has the DOM that Node lacks", "passed"),
        );

        assert.deepStrictEqual(
          engineCounts(runLedger([...browsers, ...inPage])),
          engineCounts(runLedger(browsers)).map(
            ([engine, passed, failed]) => [engine, passed + 1, failed] as const,
          ),
        );
      }),
  );

  it("each engine's OD-14 (e) result is passed only when its control (a) and its proof (b) both passed in it", () => {
    const built = runLedger([
      od14Result("chromium", "(a) the control: each probe document runs its script", "passed"),
      od14Result("chromium", "(b) the proof: embedded, neither document runs its script", "passed"),
      od14Result("webkit", "(a) the control: each probe document runs its script", "passed"),
      od14Result("webkit", "(b) the proof: embedded, neither document runs its script", "failed"),
    ]);

    assert.deepStrictEqual(
      built.browserRuns.map((run) => [run.engine, run.od14]),
      [
        ["chromium", { control: "passed", proof: "passed", result: "passed" }],
        ["webkit", { control: "passed", proof: "failed", result: "failed" }],
      ],
    );
  });

  it("an engine without both OD-14 (e) parts has failed it, naming the part that has no result", () => {
    const built = runLedger([
      od14Result("chromium", "(a) the control: each probe document runs its script", "passed"),
      od14Result("webkit", "(a) the control: each probe document runs its script", "skipped"),
      od14Result(
        "webkit",
        "(b) the proof: in another file",
        "passed",
        "src/dev/walk.browser.test.ts",
      ),
      {
        ancestorTitles: ["webkit"],
        file: od14File,
        fullName: "webkit (b) the proof: outside the OD-14 (e) describe",
        state: "passed",
      },
    ]);

    assert.deepStrictEqual(
      built.browserRuns.map((run) => [run.engine, run.od14]),
      [
        ["chromium", { control: "passed", proof: "absent", result: "failed" }],
        ["webkit", { control: "skipped", proof: "absent", result: "failed" }],
      ],
    );
  });

  it.effect("a ledger with no browser run records none", () =>
    Effect.gen(function* noBrowserRun() {
      assert.deepStrictEqual((yield* fixtureLedger).browserRuns, []);
    }),
  );

  it.effect("the proofs list the passing tagged tests and the corpus paths their files name", () =>
    Effect.gen(function* proofs() {
      const built = yield* fixtureLedger;

      assert.deepStrictEqual(namedBy(rowOf(built, "Q-2").proofs), [
        ["src/dev/page.test.ts", ["QTI3_BPIG_Examples/items/BG010.xml"]],
        ["src/interactions/choice.test.ts", ["QTI3_BeginnersGuide_Examples/items/BG011.xml"]],
        [
          "src/validate/open.test.ts",
          ["QTI3_BPIG_Examples/items/BG007.xml", "qtiv3-examples/CAT/test.xml"],
        ],
      ]);
      assert.deepStrictEqual(
        rowOf(built, "Q-2").proofs.map((proof) => proof.tests),
        [
          ["dev/page.ts [Q-2] [keyboard] BG007 completes in the playground"],
          ["interactions/choice.ts [Q-2] [keyboard] a Choice completes by keyboard"],
          ["validate/open.ts [Q-2] a Choice item is accepted"],
        ],
      );
      assert.deepStrictEqual(namedBy(rowOf(built, "I-7").proofs), [
        ["src/corpus.render.test.ts", "sweep"],
      ]);
    }),
  );

  it.effect("the headlines count each level's rows by state", () =>
    Effect.gen(function* headlines() {
      const built = yield* fixtureLedger;

      assert.deepStrictEqual(built.headlines, {
        advanced: { covered: 1, excluded: 0, limited: 1, "unsupported-with-notice": 28 },
        basic: { covered: 6, excluded: 0, limited: 1, "unsupported-with-notice": 11 },
        elective: { covered: 0, excluded: 2, limited: 0, "unsupported-with-notice": 88 },
        elevated: { covered: 0, excluded: 0, limited: 0, "unsupported-with-notice": 12 },
      });

      for (const level of levels) {
        const counts = Object.values(built.headlines[level]).reduce((sum, count) => sum + count);

        assert.strictEqual(counts, features.filter((row) => row.level === level).length, level);
      }
    }),
  );

  it.effect("each of the 150 IDs appears once, in the features file's order", () =>
    Effect.gen(function* everyId() {
      const built = yield* fixtureLedger;
      const ids = built.rows.map((row) => row.id);

      assert.lengthOf(ids, 150);
      assert.strictEqual(new Set(ids).size, 150);
      assert.deepStrictEqual(
        ids,
        features.map((row) => row.id),
      );
    }),
  );

  it.effect("a record's JavaScript state and an OD-14 (e) entry's control reach the ledger", () =>
    Effect.gen(function* recordsReach() {
      const built = yield* fixtureLedger;
      const controls = built.records.flatMap((record) =>
        record.kind === "manual-check" && record.check === "OD-14 (e)"
          ? [[record.control, record.result]]
          : [],
      );

      assert.deepStrictEqual(built.records, records);
      assert.deepStrictEqual(controls, [
        ["ran", "passed"],
        ["did-not-run", "not-observed"],
      ]);
      assert.strictEqual(rowOf(built, "Q-2").interaction?.screenReaderPass?.javascript, "on");
      assert.deepStrictEqual(
        built.records.map((record) => record.javascript),
        ["on", "off", "on", "on", "off"],
      );
    }),
  );

  it("an OD-14 (e) entry admits no pass without its control", () => {
    const refused = {
      ...recorded,
      check: "OD-14 (e)",
      control: "did-not-run",
      date: "2026-11-05",
      javascript: "on",
      kind: "manual-check",
      result: "passed",
    } as const;
    // @ts-expect-error -- an OD-14 (e) entry whose control did not run is `not-observed`, never `passed`.
    const typed: ManualCheck = refused;

    assert.isTrue(Result.isFailure(Schema.decodeUnknownResult(ManualCheck)(typed)));
  });
});
