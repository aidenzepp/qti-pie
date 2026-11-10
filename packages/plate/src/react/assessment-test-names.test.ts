/**
 * The guard that keeps the React test-runner family's retired names out of plate. It reads every
 * `.ts` and `.tsx` file under `src/` and the package README, and fails with the file and line of
 * any retired identifier written as a whole word, and with the path of any file under `src/react/`
 * whose name starts with a retired prefix. The CHANGELOG is not read, since an entry may name what
 * a release renamed.
 *
 * @module
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

/**
 * The React test-runner family's retired identifiers, each with the name that replaced it. Operator
 * ruling 86ad36a1 renamed the family from `Test` to `AssessmentTest`, because in a host app `Test`
 * reads as unit-test tooling. No alias keeps an old name, so any whole-word use is a regression. A
 * later retired name is added here.
 */
const retiredIdentifiers: readonly (readonly [retired: string, replacement: string])[] = [
  ["CreateTestServer", "CreateAssessmentTestServer"],
  ["NoTestProvider", "NoAssessmentTestProvider"],
  ["TestProvider", "AssessmentTestProvider"],
  ["TestProviderProps", "AssessmentTestProviderProps"],
  ["TestServerOptions", "AssessmentTestServerOptions"],
  ["TestSessionState", "AssessmentTestState"],
  ["TestSessionStore", "AssessmentTestStore"],
  ["TestTransport", "AssessmentTestTransport"],
  ["createTestServer", "createAssessmentTestServer"],
  ["useTestSession", "useAssessmentTest"],
];

/**
 * The retired starts of a file name under `src/react/`, each with the start that replaced it. The
 * same ruling retired them, because common test globs catch a `test-*` file.
 */
const retiredReactFilePrefixes: readonly (readonly [retired: string, replacement: string])[] = [
  ["test-provider", "assessment-test-provider"],
  ["test-server", "assessment-test-server"],
  ["test-wire", "assessment-test-wire"],
];

/**
 * Each retired identifier as a pattern that matches it only as a whole word: no identifier
 * character (a letter, a digit, `_` or `$`) on either side. So `AssessmentTestProvider` and the
 * core's `TestSession` do not match.
 */
const retiredPatterns = retiredIdentifiers.map(([retired, replacement]) => ({
  pattern: new RegExp(`(?<![\\w$])${retired}(?![\\w$])`, "u"),
  replacement,
  retired,
}));

/**
 * The package directory, which every path the guard reports is relative to.
 */
const packageDirectory = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Write a path relative to the package, with `/` separators.
 *
 * @param absolute An absolute path inside the package.
 * @returns The path from the package directory.
 */
const packagePath = (absolute: string): string =>
  path.relative(packageDirectory, absolute).split(path.sep).join("/");

/**
 * This file's own path, which the guard skips, since its tables spell every retired name.
 */
const ownPath = packagePath(import.meta.filename);

/**
 * Find the retired identifiers in a file's text, one line of report for each name on each line.
 *
 * @param file The file's path, for the report.
 * @param text The file's text.
 * @returns A line of report for each find, naming the file, the line from 1 and the replacement.
 */
const retiredNamesIn = (file: string, text: string): readonly string[] =>
  text
    .split("\n")
    .flatMap((content, index) =>
      retiredPatterns
        .filter(({ pattern }) => pattern.test(content))
        .map(
          ({ replacement, retired }) =>
            `${file}:${index + 1}: ${retired} is a retired name; write ${replacement} (operator ruling 86ad36a1)`,
        ),
    );

/**
 * Find the retired file names under `src/react/`.
 *
 * @param files Paths relative to the package.
 * @returns A line of report for each file under `src/react/` whose name starts with a retired
 *   prefix, naming the file and the replacement prefix.
 */
const retiredFileNamesIn = (files: readonly string[]): readonly string[] =>
  files
    .filter((file) => file.startsWith("src/react/"))
    .flatMap((file) =>
      retiredReactFilePrefixes
        .filter(([retired]) => path.posix.basename(file).startsWith(retired))
        .map(
          ([retired, replacement]) =>
            `${file}: a file name starting ${retired} is retired; start it ${replacement} (operator ruling 86ad36a1)`,
        ),
    );

/**
 * Every file under `src/`, by its path relative to the package, sorted.
 */
const sourceFiles = Effect.gen(function* sourceFiles() {
  const entries = yield* Effect.tryPromise(() =>
    readdir(path.join(packageDirectory, "src"), { recursive: true, withFileTypes: true }),
  );

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => packagePath(path.join(entry.parentPath, entry.name)))
    .toSorted();
});

describe("the React test-runner family's retired names", () => {
  it("match only as whole words", () => {
    const text = [
      "AssessmentTestTransport, TestSession, $TestTransport and TestTransport_",
      "const transport: TestTransport = fetchTransport(url);",
    ].join("\n");

    assert.deepStrictEqual(retiredNamesIn("src/x.ts", text), [
      "src/x.ts:2: TestTransport is a retired name; write AssessmentTestTransport (operator ruling 86ad36a1)",
    ]);
  });

  it.effect("appear in no source file, no README line and no React file name", () =>
    Effect.gen(function* findRetiredNames() {
      const files = yield* sourceFiles;
      const scanned = [
        ...files.filter((file) => /\.tsx?$/u.test(file) && file !== ownPath),
        "README.md",
      ];
      const found = yield* Effect.forEach(
        scanned,
        (file) =>
          Effect.tryPromise(() => readFile(path.join(packageDirectory, file), "utf-8")).pipe(
            Effect.map((text) => retiredNamesIn(file, text)),
          ),
        { concurrency: 16 },
      );

      assert.include(scanned, "src/react/contract.tsx");
      assert.deepStrictEqual([...found.flat(), ...retiredFileNamesIn(files)], []);
    }),
  );
});
