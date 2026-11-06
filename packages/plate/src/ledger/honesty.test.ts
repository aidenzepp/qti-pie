import { readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { claims } from "#plate/ledger/claims.ts";
import { confPath, features, generateFeatures } from "#plate/ledger/features.ts";
import { honesty, scanTitles } from "#plate/ledger/honesty.ts";
import type { HonestyInput, ScannedTitle } from "#plate/ledger/honesty.ts";
import { tagsOf } from "#plate/ledger/report.ts";

/**
 * A hand-built conformance text with the three headings the generator reads and two rows, I-19
 * and Q-2, both required at Basic, Q-2 also listed for Elevated Accessibility.
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
  "| Q-2 | Choice Interaction",
  "",
  "## A. APPENDIX A: QTI 3.0 Feature List",
  "",
  "| I-19 | Shared class vocabulary",
  "",
  "| Q-2 | Choice Interaction",
  "",
].join("\n");

/**
 * A test file that tags both fixture rows in tests that run.
 */
const backedSource = [
  'describe("styles.css", () => {',
  '  test.effect("[I-19] [Q-2] names every Choice class", () => Effect.void);',
  "});",
].join("\n");

/**
 * An honest fixture input: the claim on I-19 is backed, every tag names a row, and the features
 * file is the generator's reading of the fixture text.
 */
const honest: HonestyInput = {
  claims: [{ id: "I-19", source: "a member-only checklist" }],
  conf: fixtureConf,
  features: generateFeatures(fixtureConf),
  sources: new Map([["src/styles.test.ts", backedSource]]),
};

/**
 * One line per call shape the package's tests use, with a title on the line after its call,
 * skipped tests, and calls written where no test is: a comment, a string, and around a regular
 * expression and a division.
 */
const callForms = [
  'it("[Q-1] it", () => {});',
  'it.effect("[Q-2] it.effect", () => Effect.void);',
  'describe("[Q-3] describe", () => {',
  '  test.effect("[Q-4] test.effect", () => Effect.void);',
  "});",
  'it.each([["(a)", 1]])("[Q-5] it.each %s", (name) => {});',
  "it.live('[Q-6] it.live', () => Effect.void);",
  "it.effect.each(rows)(`[Q-7] it.effect.each $rule`, (row) => Effect.void);",
  'test("[Q-8] test", () => {});',
  "it.effect(",
  '  "[Q-9] a title on the line after its call",',
  "  () => Effect.void,",
  ");",
  'it.skip("[Q-10] skipped", () => {});',
  'describe.skip("[Q-11] a skipped suite", () => {',
  '  it("[Q-12] inside a skipped suite", () => {});',
  "});",
  'it.todo("[Q-13] to do");',
  '// it("[Q-14] in a comment");',
  'const text = "it(\\"[Q-15] in a string\\")";',
  'const quote = /"/u; it("[Q-16] after a regular expression holding a quote", () => {});',
  'const half = total / 2; it("[Q-17] after a division", () => {});',
].join("\n");

/**
 * Build a scanned title.
 *
 * @param call The call's name.
 * @param line The title's line.
 * @param title The title.
 * @param skipped Whether the test is skipped.
 * @returns The title as the scan gives it.
 */
const scanned = (call: string, line: number, title: string, skipped = false): ScannedTitle => ({
  call,
  line,
  skipped,
  title,
});

/**
 * The package's source directory, `src/`.
 */
const sourceDirectory = fileURLToPath(new URL(".", import.meta.resolve("#plate/index.ts")));

/**
 * Every test file of the package, keyed by its path relative to the package directory.
 */
const packageSources: ReadonlyMap<string, string> = new Map(
  readdirSync(sourceDirectory, { recursive: true })
    .map((entry) => String(entry).split("\\").join("/"))
    .filter((entry) => entry.endsWith(".test.ts"))
    .toSorted()
    .map((entry) => [`src/${entry}`, readFileSync(`${sourceDirectory}${entry}`, "utf-8")]),
);

/**
 * The conformance text, read from the cache under `HOME`.
 */
const confText = Effect.gen(function* readConf() {
  const path = yield* confPath;

  return yield* Effect.tryPromise(() => readFile(path, "utf-8"));
});

describe("ledger/honesty.ts", () => {
  it("finds nothing wrong with an honest input", () => {
    assert.deepStrictEqual(honesty(honest), []);
  });

  it("reports a limited claim no test tags as unbacked-claim, and only that", () => {
    const problems = honesty({
      ...honest,
      sources: new Map([["src/styles.test.ts", 'it("[Q-2] names a Choice class", () => {});']]),
    });

    assert.deepStrictEqual(
      problems.map((problem) => [problem.kind, problem.id]),
      [["unbacked-claim", "I-19"]],
    );
  });

  it("reports a claim whose only tagged test is skipped as unbacked-claim", () => {
    const problems = honesty({
      ...honest,
      sources: new Map([["src/styles.test.ts", backedSource.replace("test.effect", "it.skip")]]),
    });

    assert.deepStrictEqual(
      problems.map((problem) => [problem.kind, problem.id]),
      [["unbacked-claim", "I-19"]],
    );
  });

  it("reports a tag naming an ID the features file lacks as unknown-tag, and only that", () => {
    const sources = new Map([
      ...honest.sources,
      ["src/extra.test.ts", 'it(\n  "[Q-99] a feature Appendix A lacks",\n  () => {},\n);'],
    ]);
    const problems = honesty({ ...honest, sources });

    assert.deepStrictEqual(
      problems.map((problem) => [problem.kind, problem.id]),
      [["unknown-tag", "Q-99"]],
    );
    assert.include(problems[0]?.detail ?? "", "src/extra.test.ts:2");
  });

  it("reports a features file with one name changed as features-drift, and only that", () => {
    const drifted = honest.features.map((row) =>
      row.id === "Q-2" ? { ...row, name: "Choice" } : row,
    );
    const problems = honesty({ ...honest, features: drifted });

    assert.deepStrictEqual(
      problems.map((problem) => [problem.kind, problem.id]),
      [["features-drift", "Q-2"]],
    );
  });

  it("reports a row missing from either side, and rows out of order, as features-drift", () => {
    const [vocabulary, choice] = honest.features;

    assert.isDefined(vocabulary);
    assert.isDefined(choice);

    const driftIds = (rows: HonestyInput["features"]) =>
      honesty({ ...honest, features: rows })
        .filter((problem) => problem.kind === "features-drift")
        .map((problem) => problem.id);

    assert.deepStrictEqual(driftIds([vocabulary]), ["Q-2"]);
    assert.deepStrictEqual(driftIds([vocabulary, choice, { ...choice, id: "Q-3" }]), ["Q-3"]);
    assert.deepStrictEqual(driftIds([choice, vocabulary]), ["Q-2"]);
    assert.deepStrictEqual(driftIds([vocabulary, choice, choice]), ["Q-2"]);
  });

  it("reads the title of every call shape, on the call's line or the next, and nothing else", () => {
    assert.deepStrictEqual(scanTitles(callForms), [
      scanned("it", 1, "[Q-1] it"),
      scanned("it.effect", 2, "[Q-2] it.effect"),
      scanned("describe", 3, "[Q-3] describe"),
      scanned("test.effect", 4, "[Q-4] test.effect"),
      scanned("it.each", 6, "[Q-5] it.each %s"),
      scanned("it.live", 7, "[Q-6] it.live"),
      scanned("it.effect.each", 8, "[Q-7] it.effect.each $rule"),
      scanned("test", 9, "[Q-8] test"),
      scanned("it.effect", 11, "[Q-9] a title on the line after its call"),
      scanned("it.skip", 14, "[Q-10] skipped", true),
      scanned("describe.skip", 15, "[Q-11] a skipped suite", true),
      scanned("it", 16, "[Q-12] inside a skipped suite", true),
      scanned("it.todo", 18, "[Q-13] to do", true),
      scanned("it", 21, "[Q-16] after a regular expression holding a quote"),
      scanned("it", 22, "[Q-17] after a division"),
    ]);
  });

  it("reads every title of src/styles.test.ts that tags I-19, each a test.effect call", () => {
    const source = packageSources.get("src/styles.test.ts") ?? "";
    const tagged = scanTitles(source).filter((title) => tagsOf(title.title).includes("I-19"));

    assert.isAbove(tagged.length, 0);
    assert.strictEqual(tagged.length, source.split("[I-19]").length - 1);
    assert.deepStrictEqual([...new Set(tagged.map((title) => title.call))], ["test.effect"]);
  });

  it("carries no feature tag in its own titles, as an infrastructure test", () => {
    const own = scanTitles(packageSources.get("src/ledger/honesty.test.ts") ?? "");

    assert.isAbove(own.length, 0);
    assert.deepStrictEqual(
      own.flatMap((title) => tagsOf(title.title)),
      [],
    );
  });

  it.effect("finds nothing wrong with the package's own claims, features and tests", () =>
    Effect.gen(function* realCheck() {
      const conf = yield* confText;

      assert.isAbove(packageSources.size, 0);
      assert.deepStrictEqual(honesty({ claims, conf, features, sources: packageSources }), []);
    }),
  );
});
