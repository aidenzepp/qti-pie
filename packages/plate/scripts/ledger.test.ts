import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Schema } from "effect";
import { generateFeatures } from "#plate/ledger/features.ts";
import { Ledger } from "#plate/ledger/report.ts";
import { ledgerText } from "#plate/ledger/view.ts";
// oxlint-disable-next-line no-restricted-imports -- the package's `#plate/*` alias maps to `src/` only, so this test reaches the script beside it by its sibling path.
import { buildLedger, findVp, outputNames, summary, testCommand, VerdictEntry } from "./ledger.ts";
// oxlint-disable-next-line no-restricted-imports -- as above: the script's types sit beside it, outside the alias.
import type { LedgerBuild, LedgerOutcome } from "./ledger.ts";

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
 * Write a Vitest JSON report with one test file, {@link testFile}, as `vp test run
 * --reporter=json` writes it.
 *
 * @param tests Each test's full name and state.
 * @returns The report's text.
 */
const report = (tests: readonly { fullName: string; status: string }[]): string =>
  JSON.stringify({
    numFailedTests: tests.filter((test) => test.status === "failed").length,
    testResults: [
      {
        assertionResults: tests.map((test) => ({ ...test, title: test.fullName })),
        name: path.join(scratch, testFile),
        status: "passed",
      },
    ],
  });

/**
 * Prepare an output folder holding a fixture report, as the test run leaves it.
 *
 * @param name The folder's name under {@link scratch}.
 * @param text The report's text.
 * @returns The folder's path.
 */
const outputWith = (name: string, text: string): string => {
  const output = path.join(scratch, name);

  mkdirSync(output, { recursive: true });
  writeFileSync(path.join(output, "vitest.json"), text);

  return output;
};

/**
 * Build the input of one build over the fixtures.
 *
 * @param output The output folder, which holds the fixture report.
 * @param testExit The test run's exit code.
 * @returns The input.
 */
const fixture = (output: string, testExit = 0): LedgerBuild => ({
  claims: [{ id: "I-19", source: "a member-only checklist" }],
  conf: fixtureConf,
  exclusions: [],
  features: generateFeatures(fixtureConf),
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
      const output = outputWith(
        "honest",
        report([
          { fullName: backing, status: "passed" },
          { fullName: posting, status: "passed" },
        ]),
      );
      const outcome = yield* build(fixture(output));

      assertWritten(outcome);
      assert.strictEqual(outcome.exitCode, 0);
      assert.deepStrictEqual(outcome.problems, []);

      const written = decodeLedger(readOutput(output, "ledger.json"));

      assert.deepStrictEqual(written.headlines.basic, honestBasic);
      assert.deepStrictEqual(written, outcome.ledger);
      assert.strictEqual(readOutput(output, "ledger.txt"), ledgerText(written));
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
