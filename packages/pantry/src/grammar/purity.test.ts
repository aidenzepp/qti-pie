import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * The pure layers, relative to `src`: vocabulary data, the generators and the XDM model. Each is a
 * function of its inputs, so none reaches grizzle or the modules that talk to the database. The one
 * exception is a stage-wide shared file: `install.ts` reads the committed snapshot's codes through
 * `db/codes.ts` and `db/snapshot.ts`, so its rosters are declared in the order grizzle accepts.
 */
const pureLayers = "{vocab,grammar,model}/**/*.ts";

/**
 * The one pure-layer module that imports grizzle: it declares the generators' closed relations to
 * it.
 */
const install = "grammar/install.ts";

/**
 * The modules under `db/` that `install.ts` alone may import: the reader of the committed
 * snapshot's roster codes and the snapshot's path and error it names. Neither reaches the login or
 * the connection.
 */
const committedCodes: readonly string[] = ["#pantry/db/codes.ts", "#pantry/db/snapshot.ts"];

/**
 * The modules outside `src/test/` that import its helpers today: none since the processing
 * fixtures' materializer moved to `src/test/processing-fixtures.ts` (Q5.10). The list only shrinks:
 * a module that starts importing them fails the test until the list says so.
 */
const pending: readonly string[] = [];

/**
 * Collect every module specifier a TypeScript module names: its imports and re-exports, type-only
 * ones included, its bare imports, and its dynamic `import(…)` calls and `import("…")` types.
 *
 * Comments are dropped and string literals kept whole first, so a commented-out import counts for
 * nothing, and a `/*` inside a string hides no code after it.
 *
 * @param source - The text of a TypeScript module.
 * @returns The specifiers, in source order.
 */
const specifiers = (source: string): readonly string[] => {
  const code = source.replaceAll(
    /(?<literal>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu,
    (_text, literal: string | undefined) => literal ?? "",
  );
  const statements = code.matchAll(
    /^[ \t]*(?:import|export)\b(?!\s*\()[^;]*?\bfrom\s*["'](?<from>[^"']+)["']|^[ \t]*import\s*["'](?<bare>[^"']+)["']|\bimport\s*\(\s*["'](?<dynamic>[^"']+)["']/gmu,
  );

  return [...statements].flatMap(({ groups }) =>
    Object.values(groups ?? {}).filter(Predicate.isString),
  );
};

/**
 * List the modules a pattern matches under `src`, tests excluded.
 *
 * @param pattern - A glob relative to `src`.
 * @returns The modules' paths relative to `src`, sorted.
 */
const modules = (pattern: string): readonly string[] =>
  globSync(pattern, { cwd: sourceRoot })
    .filter((file) => !file.endsWith(".test.ts"))
    .toSorted();

/**
 * Find the imports of modules that name a forbidden prefix.
 *
 * @param files - The modules, relative to `src`.
 * @param forbidden - The specifier prefixes the modules must not import.
 * @returns Each offending module and specifier as `module: specifier`, once per pair.
 */
const offences = (files: readonly string[], forbidden: readonly string[]): readonly string[] => [
  ...new Set(
    files.flatMap((file) =>
      specifiers(readFileSync(path.join(sourceRoot, file), "utf-8"))
        .filter((specifier) => forbidden.some((prefix) => specifier.startsWith(prefix)))
        .map((specifier) => `${file}: ${specifier}`),
    ),
  ),
];

/**
 * The law oracle's module, as a test imports it.
 */
const oracleModule = "#pantry/test/oracle.ts";

/**
 * Decide whether a module may import the law oracle: a test named for it, `*.oracle.test.ts` or
 * `*.oracle.db.test.ts`, or a module of the test support under `src/test/`.
 *
 * @param file - The module's path relative to `src`.
 * @returns Whether it may import {@link oracleModule}.
 */
const mayReachOracle = (file: string): boolean =>
  file.endsWith(".test.ts") ? /\.oracle(?:\.db)?\.test\.ts$/u.test(file) : file.startsWith("test/");

describe("specifiers", () => {
  it("counts imports of every form, type-only and dynamic ones included", () => {
    const found = specifiers(
      [
        'import {\n  a,\n  b,\n} from "#pantry/a.ts";',
        'import type { C } from "#pantry/c.ts";',
        'export { d } from "#pantry/d.ts";',
        'export * from "#pantry/e.ts";',
        'import "#pantry/f.ts";',
        'const g = await import("#pantry/g.ts");',
        'type H = import("#pantry/h.ts").H;',
      ].join("\n"),
    );

    assert.deepStrictEqual(found, [
      "#pantry/a.ts",
      "#pantry/c.ts",
      "#pantry/d.ts",
      "#pantry/e.ts",
      "#pantry/f.ts",
      "#pantry/g.ts",
      "#pantry/h.ts",
    ]);
  });

  it("does not count an import inside a comment, nor lose one after a string", () => {
    const found = specifiers(
      [
        '/* import { a } from "#pantry/a.ts"; */',
        '// import "#pantry/b.ts";',
        'const glob = "src/**/*.ts";',
        'export { c } from "#pantry/c.ts";',
      ].join("\n"),
    );

    assert.deepStrictEqual(found, ["#pantry/c.ts"]);
  });
});

describe("the pure layers", () => {
  it("import grizzle only in install.ts", () => {
    const files = modules(pureLayers).filter((file) => file !== install);

    assert.deepStrictEqual(offences(files, ["@bjornpagen/grizzle"]), []);
  });

  it("import no schema, importer or exporter module", () => {
    const forbidden = ["#pantry/qti/", "#pantry/import/", "#pantry/export/"];

    assert.deepStrictEqual(offences(modules(pureLayers), forbidden), []);
  });

  it("import nothing under db/, but install.ts's read of the committed snapshot's codes", () => {
    const files = modules(pureLayers).filter((file) => file !== install);
    const installOffences = offences([install], ["#pantry/db/"]).filter(
      (offence) => !committedCodes.some((specifier) => offence.endsWith(`: ${specifier}`)),
    );

    assert.deepStrictEqual(offences(files, ["#pantry/db/"]), []);
    assert.deepStrictEqual(installOffences, []);
  });
});

describe("the test helpers", () => {
  it("are imported only by tests and by src/test/", () => {
    const files = modules("**/*.ts").filter((file) => !file.startsWith("test/"));

    assert.deepStrictEqual(offences(files, ["#pantry/test/"]), pending);
  });

  // The law oracle is a test's judge, so a test that judges by it says so in its name: it is named
  // `*.oracle.test.ts`, or `*.oracle.db.test.ts` in the database tier. The support under `src/test/`
  // may import it as well: the XDM generator names its laws, so a renamed law breaks the build, and
  // the importer's test locator (`test/locate.ts`) finds the row a refusal breaks by its verdicts.
  // A rule over names, not a list of files, so a lane that adds an oracle test names it and edits
  // nothing here.
  it("reach the law oracle only from tests named for it and from the test support", () => {
    const files = globSync("**/*.ts", { cwd: sourceRoot }).toSorted();

    assert.deepStrictEqual(
      offences(files, [oracleModule]).filter(
        (offence) => !mayReachOracle(offence.split(": ")[0] ?? ""),
      ),
      [],
    );
  });

  it("name the rule's every case: an oracle test, its database tier, the support, and what it refuses", () => {
    // Oracle: the rule as the comment above states it, on the named cases. Live: an oracle test in
    // either tier and a support module; Stale: a test not named for the oracle, as every importer
    // was before the rule; Wild: a module outside `src/test/`, a name with `oracle` in another
    // place, and the packaging tier, which no oracle test is in.
    const cases = [
      ["qti/metadata.oracle.test.ts", true],
      ["import/program.oracle.db.test.ts", true],
      ["test/gen/xdm.ts", true],
      ["test/locate.ts", true],
      ["qti/metadata.test.ts", false],
      ["import/program.db.test.ts", false],
      ["test/oracle.test.ts", false],
      ["test/oracle.rv-h.test.ts", false],
      ["import/refusal.ts", false],
      ["test/oracle-laws.oracle.ts", true],
      ["import/oracle.ts", false],
      ["qti/oracle.test.ts.oracle", false],
      ["import/refusal.oracle.packaging.test.ts", false],
    ] as const;

    assert.deepStrictEqual(
      cases.filter(([file, allowed]) => mayReachOracle(file) !== allowed).map(([file]) => file),
      [],
    );
  });
});
