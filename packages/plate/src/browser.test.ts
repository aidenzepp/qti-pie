import { assert, describe, it } from "@effect/vitest";
import { checkAllowlist, sourceModules, valueClosure } from "#plate/test/imports.ts";

/**
 * The package's sources, tests included, by path under the package.
 */
const modules = sourceModules();

/**
 * The paths of the package's non-test modules.
 */
const nonTest = [...modules.keys()].filter((path) => !path.endsWith(".test.ts"));

/**
 * The modules under `src/session/` that are not browser modules, each with its reason. Every other
 * non-test module under `src/session/` is a root.
 */
const sessionExclusions = {
  "src/session/advance.ts":
    "calls score, which decodes the stored record through Schema (the want d1d70ac8)",
  "src/session/submit.ts":
    "calls score, which decodes the stored record through Schema (the want d1d70ac8)",
} satisfies Readonly<Record<string, string>>;

/**
 * The browser modules the scan starts from: every non-test module under `src/emit/`,
 * `src/interactions/`, `src/engine/`, `src/session/` (but for {@link sessionExclusions}) and
 * `src/form/`, `src/payload.ts` (the OD-6 ruling, rule `e2bd87f2`), `src/render.ts`,
 * `src/responses.ts`, and `src/solution.ts` and `src/navigation.ts` once the package holds them.
 */
const roots = [
  ...nonTest.filter(
    (path) =>
      ["src/emit/", "src/interactions/", "src/engine/", "src/session/", "src/form/"].some(
        (directory) => path.startsWith(directory),
      ) && !Object.hasOwn(sessionExclusions, path),
  ),
  "src/payload.ts",
  "src/render.ts",
  "src/responses.ts",
  ...["src/navigation.ts", "src/solution.ts"].filter((path) => modules.has(path)),
];

/**
 * The top-level modules (`src/*.ts`, tests aside) that are not roots, each with its reason. Every
 * top-level module is a root or named here, so a new one is classified when it is added.
 */
const notRoots = {
  "src/configuration.ts": "value-imports Schema, Config and Effect to read the configuration",
  "src/control-cap.ts": "reached from the roots, so the scan checks it",
  "src/index.ts": "the public entry, which re-exports the Schema side beside the browser modules",
  "src/messages.ts": "reached from the roots, so the scan checks it",
  "src/restore.ts": "the Schema side: decodes the stored record through Schema",
  "src/score.ts": "value-imports Schema to decode and encode the stored record",
  "src/vocabulary.ts":
    "the tables the validators and the model builder read; the roots import its types only, and control-cap.ts holds the one value they need",
} satisfies Readonly<Record<string, string>>;

/**
 * List the top-level modules among some paths that are neither a root nor named in
 * {@link notRoots}.
 *
 * @param paths Paths under the package.
 * @returns The unclassified top-level non-test modules, in the order given.
 */
const unclassified = (paths: readonly string[]): readonly string[] =>
  paths.filter(
    (path) =>
      /^src\/[^/]+\.ts$/u.test(path) &&
      !path.endsWith(".test.ts") &&
      !roots.includes(path) &&
      !Object.hasOwn(notRoots, path),
  );

/**
 * Every module the browser modules reach through value imports.
 */
const closure = valueClosure(modules, roots);

/**
 * A line whose first non-blank characters open or continue a comment.
 */
const commentLine = /^\s*(?:\*|\/\*|\/\/)/u;

/**
 * The lines of some modules that match a pattern and are not comment lines.
 *
 * @param paths The modules, by path under the package.
 * @param pattern The pattern.
 * @returns Each matching line as `<path>:<line>: <text>`.
 */
const linesMatching = (paths: readonly string[], pattern: RegExp): readonly string[] =>
  paths.flatMap((path) =>
    (modules.get(path) ?? "")
      .split("\n")
      .flatMap((line, index) =>
        pattern.test(line) && !commentLine.test(line)
          ? [`${path}:${index + 1}: ${line.trim()}`]
          : [],
      ),
  );

describe("the browser modules", () => {
  it("value-import from effect only Option, Array, pipe, Data and Result, and no other package", () => {
    assert.deepStrictEqual(checkAllowlist(modules, roots), []);
  });

  it("reach model/values.ts and control-cap.ts, which are not roots, so the walk follows value imports", () => {
    assert.includeMembers([...closure], ["src/model/values.ts", "src/control-cap.ts"]);
    assert.isAbove(closure.length, roots.length);
  });

  it("include src/session/ and src/form/, but for the two session modules that call score", () => {
    assert.include(roots, "src/session/session.ts");
    assert.include(roots, "src/form/encoding.ts");
    assert.sameMembers(Object.keys(sessionExclusions), [
      "src/session/advance.ts",
      "src/session/submit.ts",
    ]);
    assert.notIncludeMembers(roots, Object.keys(sessionExclusions));
  });

  it("classify every top-level module as a root or a named non-root", () => {
    assert.deepStrictEqual(unclassified([...modules.keys()]), []);
    assert.includeMembers(nonTest, Object.keys(notRoots));
    assert.deepStrictEqual(unclassified([...modules.keys(), "src/unlisted.ts"]), [
      "src/unlisted.ts",
    ]);
  });

  it("throw no bare Error, and the browser closure calls no getOrThrow (rule d772ad5c point 2)", () => {
    assert.deepStrictEqual(
      [
        ...linesMatching(
          nonTest,
          /new (?:Error|RangeError|TypeError)\(|\bextends (?:Error|RangeError|TypeError)\b/u,
        ),
        ...linesMatching(closure, /getOrThrow/u),
      ],
      [],
    );
  });
});
