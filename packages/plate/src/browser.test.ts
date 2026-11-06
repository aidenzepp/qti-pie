import { assert, describe, it } from "@effect/vitest";
import {
  checkAllowlist,
  readImports,
  resolvePlate,
  sourceModules,
  valueClosure,
} from "#plate/test/imports.ts";

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
 * Whether a path is in the DOM program: a module that runs in a page (`*.dom.ts`) or a test that
 * runs inside one (`*.dom.test.ts`).
 *
 * @param path A path under the package.
 * @returns True for either suffix.
 */
const inDomProgram = (path: string): boolean =>
  path.endsWith(".dom.ts") || path.endsWith(".dom.test.ts");

/**
 * Select the browser modules the scan starts from among some paths: every DOM-program module
 * (`*.dom.ts`) under `src/`, wherever it sits, since each runs in a page; every non-test module
 * under `src/emit/`, `src/interactions/`, `src/engine/`, `src/session/` (but for
 * {@link sessionExclusions}) and `src/form/`; `src/payload.ts` (the OD-6 ruling, rule
 * `e2bd87f2`), `src/render.ts`, `src/responses.ts`, and `src/solution.ts` and `src/navigation.ts`
 * once the paths hold them.
 *
 * An in-page test (`*.dom.test.ts`) is not a root: like a Node test it may import any of `effect`
 * and `@effect/vitest`, and no test reaches a bundle.
 *
 * @param paths Paths under the package.
 * @returns The roots: the matching paths in the order given, then the top-level files.
 */
const selectRoots = (paths: readonly string[]): readonly string[] => [
  ...paths.filter(
    (path) =>
      !path.endsWith(".test.ts") &&
      ((path.startsWith("src/") && path.endsWith(".dom.ts")) ||
        (["src/emit/", "src/interactions/", "src/engine/", "src/session/", "src/form/"].some(
          (directory) => path.startsWith(directory),
        ) &&
          !Object.hasOwn(sessionExclusions, path))),
  ),
  "src/payload.ts",
  "src/render.ts",
  "src/responses.ts",
  ...["src/navigation.ts", "src/solution.ts"].filter((path) => paths.includes(path)),
];

/**
 * The browser modules the scan starts from: {@link selectRoots} over the package's modules.
 */
const roots = selectRoots([...modules.keys()]);

/**
 * The top-level modules (`src/*.ts`, tests aside) that are not roots, each with its reason. Every
 * top-level module is a root or named here, so a new one is classified when it is added.
 */
const notRoots = {
  "src/configuration.ts": "value-imports Schema, Config and Effect to read the configuration",
  "src/control-cap.ts": "reached from the roots, so the scan checks it",
  "src/count-range.ts":
    "the count range the model builder, the structural walk and decodeRedacted read, kept apart from vocabulary.ts so decodeRedacted loads none of its tables",
  "src/index.ts": "the public entry, which re-exports the Schema side beside the browser modules",
  "src/messages.ts": "reached from the roots, so the scan checks it",
  "src/restore.ts": "the Schema side: decodes the stored record through Schema",
  "src/score.ts": "value-imports Schema to decode and encode the stored record",
  "src/vocabulary.ts":
    "the tables the validators, the model builders and the package reader read; no root reaches it, since session/control.ts reads sessionControlDefaults from session/control-defaults.ts, which vocabulary.ts re-exports",
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

/**
 * One import of a DOM-program module (`*.dom.ts`) by a module outside the DOM program.
 */
interface DomImport {
  readonly line: number;
  readonly module: string;
  readonly specifier: string;
}

/**
 * List the imports of DOM-program modules (`*.dom.ts`) that modules outside the DOM program make,
 * type-only declarations and names included. The root program's `exclude` does not stop an import
 * from pulling a DOM module into it, where its DOM names then fail to type-check with no message
 * that says why. A declaration {@link readImports} cannot classify, and a dynamic `import(…)`, are
 * not seen.
 *
 * @param sources The modules' sources, by path under the package (`src/<x>`).
 * @returns Each such import, by module in the order given and then by line.
 */
const domImports = (sources: ReadonlyMap<string, string>): readonly DomImport[] =>
  [...sources].flatMap(([module, source]) =>
    inDomProgram(module)
      ? []
      : readImports(source).imports.flatMap(({ line, specifier }) =>
          (resolvePlate(specifier) ?? "").endsWith(".dom.ts") ? [{ line, module, specifier }] : [],
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
    assert.notIncludeMembers([...roots], Object.keys(sessionExclusions));
  });

  it("classify every top-level module as a root or a named non-root, and take every DOM module but no in-page test as a root", () => {
    const paths = [...modules.keys()];

    assert.deepStrictEqual(unclassified(paths), []);
    assert.includeMembers(nonTest, Object.keys(notRoots));
    assert.deepStrictEqual(unclassified([...paths, "src/unlisted.ts"]), ["src/unlisted.ts"]);
    assert.include(selectRoots([...paths, "src/x.dom.ts"]), "src/x.dom.ts");
    assert.notInclude(selectRoots([...paths, "src/x.dom.test.ts"]), "src/x.dom.test.ts");
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

describe("the DOM program", () => {
  it("has its modules imported by no module outside it, type-only imports included", () => {
    const offender = 'import type { Y } from "#plate/y.dom.ts";\n';

    assert.deepStrictEqual(domImports(modules), []);
    assert.deepStrictEqual(
      domImports(new Map([...modules, ["src/x.ts", offender], ["src/x.dom.test.ts", offender]])),
      [{ line: 1, module: "src/x.ts", specifier: "#plate/y.dom.ts" }],
    );
  });
});
