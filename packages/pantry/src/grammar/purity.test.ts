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
 * function of its inputs, so none reaches grizzle or the modules that talk to the database.
 */
const pureLayers = "{vocab,grammar,model}/**/*.ts";

/**
 * The one pure-layer module that imports grizzle: it declares the generators' closed relations to
 * it.
 */
const install = "grammar/install.ts";

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
});

describe("the test helpers", () => {
  it("are imported only by tests and by src/test/", () => {
    const files = modules("**/*.ts").filter((file) => !file.startsWith("test/"));

    assert.deepStrictEqual(offences(files, ["#pantry/test/"]), pending);
  });

  // The law oracle is kept (review T9) for the tests that judge by it, for the XDM generator, which
  // names its laws so a renamed law breaks the build, and for the importer's test locator
  // (`test/locate.ts`), which finds the row a refusal breaks by the oracle's verdicts for the tests
  // that import through it. A test judges by it in one of two ways:
  // - by its verdicts and tables (`judge`, `documentBreaches`, `lawsOf`): the XSD differential
  //   (spec-alignment slice A2), the corpus prewitness, the folds' law model, shred's held roots
  //   under a strict wildcard (C13, which a kept root must leave with no law broken), the database
  //   witnesses of `Node` and identity, and the importer's overlays, which read what the oracle
  //   reads;
  // - by its law catalog (`lawNames`, `nodeLawNames`, `ruleOf`, `lawSources`, `contentLawOf`):
  //   each W5 schema module's test checks that every law the module states is an oracle law with
  //   a rule, so a renamed law breaks the build there as well.
  // The list changes only with a reason.
  it("reach the law oracle only from the tests that judge by it, the generator that names its laws and the importer's test locator", () => {
    const files = globSync("**/*.ts", { cwd: sourceRoot }).toSorted();

    assert.deepStrictEqual(offences(files, ["#pantry/test/oracle.ts"]), [
      "import/overlays/interactions.test.ts: #pantry/test/oracle.ts",
      "import/overlays/metadata.test.ts: #pantry/test/oracle.ts",
      "import/refusal.test.ts: #pantry/test/oracle.ts",
      "model/folds.test.ts: #pantry/test/oracle.ts",
      "model/shred.test.ts: #pantry/test/oracle.ts",
      "qti/attributes.test.ts: #pantry/test/oracle.ts",
      "qti/chardata.test.ts: #pantry/test/oracle.ts",
      "qti/declarations.test.ts: #pantry/test/oracle.ts",
      "qti/html.test.ts: #pantry/test/oracle.ts",
      "qti/identity.test.ts: #pantry/test/oracle.ts",
      "qti/interactions.test.ts: #pantry/test/oracle.ts",
      "qti/mapping.test.ts: #pantry/test/oracle.ts",
      "qti/metadata.test.ts: #pantry/test/oracle.ts",
      "qti/node.db.test.ts: #pantry/test/oracle.ts",
      "qti/node.test.ts: #pantry/test/oracle.ts",
      "qti/operators.test.ts: #pantry/test/oracle.ts",
      "qti/package.test.ts: #pantry/test/oracle.ts",
      "qti/quotation.test.ts: #pantry/test/oracle.ts",
      "qti/tests.test.ts: #pantry/test/oracle.ts",
      "test/attribute-order.oracle.test.ts: #pantry/test/oracle.ts",
      "test/gen/xdm.ts: #pantry/test/oracle.ts",
      "test/locate.ts: #pantry/test/oracle.ts",
      "test/oracle-laws.differential.test.ts: #pantry/test/oracle.ts",
      "test/oracle.complete.test.ts: #pantry/test/oracle.ts",
      "test/oracle.keys.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-g.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-h.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-i.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-k.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-m.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-o.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-p.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-q.test.ts: #pantry/test/oracle.ts",
      "test/oracle.rv-x.test.ts: #pantry/test/oracle.ts",
      "test/oracle.test.ts: #pantry/test/oracle.ts",
      "test/prewitness.corpus.test.ts: #pantry/test/oracle.ts",
      "test/xsd.corpus.test.ts: #pantry/test/oracle.ts",
    ]);
  });
});
