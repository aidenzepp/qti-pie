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
 * The browser modules the scan starts from: every non-test module under `src/emit/`,
 * `src/interactions/` and `src/engine/`, `src/payload.ts` (the OD-6 ruling, rule `e2bd87f2`), and
 * `src/render.ts`.
 */
const roots = [
  ...nonTest.filter((path) =>
    ["src/emit/", "src/interactions/", "src/engine/"].some((directory) =>
      path.startsWith(directory),
    ),
  ),
  "src/payload.ts",
  "src/render.ts",
];

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

  it("reach model/values.ts and form/encoding.ts, so the walk follows value imports", () => {
    assert.includeMembers([...closure], ["src/model/values.ts", "src/form/encoding.ts"]);
    assert.isAbove(closure.length, roots.length);
  });

  it("throw no bare Error, and the browser closure calls no getOrThrow (rule d772ad5c point 2)", () => {
    const checked = nonTest.filter(
      (path) => !path.startsWith("src/ledger/") && !path.startsWith("src/test/"),
    );

    assert.deepStrictEqual(
      [
        ...linesMatching(
          checked,
          /new (?:Error|RangeError|TypeError)\(|\bextends (?:Error|RangeError|TypeError)\b/u,
        ),
        ...linesMatching(closure, /getOrThrow/u),
      ],
      [],
    );
  });
});
