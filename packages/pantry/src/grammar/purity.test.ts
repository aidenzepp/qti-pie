import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { moduleImports } from "#pantry/test/module-imports.ts";

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
 * Collect every module specifier a TypeScript module names, through the one reader of a module's
 * imports (`#pantry/test/module-imports.ts`): its imports and re-exports, type-only ones included,
 * its bare imports, and its dynamic `import(…)` calls and `import("…")` types.
 *
 * @param source - The text of a TypeScript module.
 * @returns The specifiers, in source order.
 */
const specifiers = (source: string): readonly string[] =>
  moduleImports(source).map(({ specifier }) => specifier);

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
 * Collect the module specifiers a TypeScript module's values come from: {@link specifiers}, less
 * the statements that are wholly `import type` or `export type`, which bring no value in.
 *
 * @param source - The text of a TypeScript module.
 * @returns The specifiers, in source order.
 */
const valueSpecifiers = (source: string): readonly string[] =>
  moduleImports(source).flatMap(({ form, specifier }) => (form === "type" ? [] : [specifier]));

/**
 * The prefix of the modules the law oracle is made of when it reaches them: the test support,
 * which holds the host's reading of grizzle's predicates (`#pantry/test/predicates.ts`) that the
 * oracle's key copies and the tests' host judge share, and which states no law and reads no schema
 * of its own, so a statement read it gained would be the oracle's.
 */
const oraclePrefix = "#pantry/test/";

/**
 * The modules the law oracle is made of: {@link oracleModule} and every module under
 * {@link oraclePrefix} it reaches through a static or dynamic import, relative to `src`.
 *
 * @param read - Reads a module's text by its path relative to `src`.
 * @returns The modules, sorted.
 */
const oracleModules = (read: (file: string) => string): readonly string[] => {
  const seen = new Set<string>();
  const unread = [oracleModule];
  while (unread.length > 0) {
    const file = (unread.pop() ?? oracleModule).slice("#pantry/".length);
    if (!seen.has(file)) {
      seen.add(file);
      unread.push(...specifiers(read(file)).filter((next) => next.startsWith(oraclePrefix)));
    }
  }

  return [...seen].toSorted();
};

/**
 * The prefixes of the modules that state the schema's laws or the importer's and exporter's
 * judgments, and grizzle, which builds statements: the law oracle reads none of their values, so
 * it never decides a breach by a selection or a check the schema states. `vocab/` holds judgments
 * as well as data (the importer's `data-ssml` check among them), so its prefix is forbidden and its
 * data modules are listed one by one ({@link oracleDataModules}), beside the stated bounds of
 * `#pantry/qti/limits.ts`.
 */
const oracleForbidden = [
  "#pantry/qti/",
  "#pantry/import/",
  "#pantry/export/",
  "#pantry/db/",
  "#pantry/vocab/",
  "@bjornpagen/grizzle",
];

/**
 * The modules under {@link oracleForbidden}'s prefixes that hold data and no statement, which the
 * oracle may read:
 *
 * - `#pantry/qti/limits.ts` holds the bounds a key's text and a name are held to.
 * - `#pantry/vocab/laws.ts` is the law catalog, where a law's rule and source live.
 * - `#pantry/vocab/namespaces.ts` holds the namespace names.
 * - `#pantry/vocab/inventory/attributes.ts` is the XSD inventory of attribute declarations.
 * - `#pantry/vocab/derive/domains.ts` holds XML Schema's built-in domains, the grammar's data.
 */
const oracleDataModules: ReadonlySet<string> = new Set([
  "#pantry/qti/limits.ts",
  "#pantry/vocab/derive/domains.ts",
  "#pantry/vocab/inventory/attributes.ts",
  "#pantry/vocab/laws.ts",
  "#pantry/vocab/namespaces.ts",
]);

/**
 * The oracle's reads of a statement module today, each `module: specifier`. The list only shrinks:
 * a module of the oracle that starts reading one fails the test, and one that stops fails it until
 * its entry goes.
 *
 * - `test/key-copies.ts` reads the composed `Qti` to find the fields a key text is written into.
 * - `test/oracle.ts` reads `splicingParents` from `#pantry/qti/tests.ts`, the kinds whose include
 *   splices its document.
 *
 * Each affects a judgment, so a defect in it would be the schema's and the oracle's alike, and no
 * differential would see it: each is owed a derivation of the oracle's own, held equal to the
 * schema's by a test, and its entry goes in the same commit. Only metadata is shared, through the
 * law catalog.
 *
 * - `test/oracle.ts` reads `dataName` and `typeAvailable` from `#pantry/vocab/open.ts`. `dataName` is
 *   the regular expression the database check `AL4_data_name` states, and `typeAvailable` seeds the
 *   grammar's `TypeAvailable` rows, so both judges share them. Like the key-copies entry, it is
 *   owed an oracle-side derivation.
 */
const oracleStatementReads: readonly string[] = [
  "test/key-copies.ts: #pantry/qti/schema.ts",
  "test/oracle.ts: #pantry/vocab/open.ts",
];

/**
 * Read a module's text by its path relative to `src`.
 *
 * @param file - The module's path relative to `src`.
 * @returns Its text.
 */
const readSourceModule = (file: string): string =>
  readFileSync(path.join(sourceRoot, file), "utf-8");

/**
 * Find the law oracle's reads of a statement module: each value import of one of its modules that
 * names an {@link oracleForbidden} prefix and is no {@link oracleDataModules} module.
 *
 * @param read - Reads a module's text by its path relative to `src`.
 * @returns Each read as `module: specifier`, sorted.
 */
const statementReads = (read: (file: string) => string): readonly string[] =>
  [
    ...new Set(
      oracleModules(read).flatMap((file) =>
        valueSpecifiers(read(file))
          .filter(
            (specifier) =>
              oracleForbidden.some((prefix) => specifier.startsWith(prefix)) &&
              !oracleDataModules.has(specifier),
          )
          .map((specifier) => `${file}: ${specifier}`),
      ),
    ),
  ].toSorted();

/**
 * Decide whether a module may import the law oracle: a test named for it, `*.oracle.test.ts` or
 * `*.oracle.db.test.ts`, or a module of the test support under `src/test/`.
 *
 * @param file - The module's path relative to `src`.
 * @returns Whether it may import {@link oracleModule}.
 */
const mayReachOracle = (file: string): boolean =>
  file.endsWith(".test.ts") ? /\.oracle(?:\.db)?\.test\.ts$/u.test(file) : file.startsWith("test/");

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
  // `test/oracle-verdict.ts` predicts the verdict an import test holds the database's to.
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

  it("leave the law oracle reading no statement of the schema, the importer or grizzle", () => {
    assert.deepStrictEqual(statementReads(readSourceModule), oracleStatementReads);
  });

  it("find a law of the oracle that reads a schema statement, and no type import or data module", () => {
    // Oracle: the rule above on a planted module graph. Live: the oracle's own module, a law module
    // it reaches and the host predicates it reaches, each reading a schema statement, one of them by
    // a dynamic import. Stale: a type-only import of a schema module and of grizzle, a read of the
    // data module, and of the law catalog. Wild: a module the oracle does not reach, which reads a
    // statement and is no part of it.
    const planted = new Map([
      ["test/elsewhere.ts", 'import { Qti } from "#pantry/qti/schema.ts";'],
      [
        "test/predicates.ts",
        [
          'import type { LawSide } from "@bjornpagen/grizzle";',
          'import { Qti } from "#pantry/qti/schema.ts";',
        ].join("\n"),
      ],
      [
        "test/oracle-laws.ts",
        [
          'import type { Interaction } from "#pantry/qti/interactions.ts";',
          'import { keyTextBytes } from "#pantry/qti/limits.ts";',
          'import { lawTable } from "#pantry/vocab/laws.ts";',
          'import { dataSsmlFaultIn } from "#pantry/vocab/data-ssml.ts";',
          'const { itemInstances } = await import("#pantry/qti/tests.ts");',
        ].join("\n"),
      ],
      [
        "test/oracle.ts",
        [
          'import { addedLaws } from "#pantry/test/oracle-laws.ts";',
          'import { datumText } from "#pantry/test/predicates.ts";',
          'import { Node } from "#pantry/qti/node.ts";',
          'import { select } from "@bjornpagen/grizzle";',
        ].join("\n"),
      ],
    ]);

    assert.deepStrictEqual(
      statementReads((file) => planted.get(file) ?? ""),
      [
        "test/oracle-laws.ts: #pantry/qti/tests.ts",
        "test/oracle-laws.ts: #pantry/vocab/data-ssml.ts",
        "test/oracle.ts: #pantry/qti/node.ts",
        "test/oracle.ts: @bjornpagen/grizzle",
        "test/predicates.ts: #pantry/qti/schema.ts",
      ],
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
      ["test/oracle-verdict.ts", true],
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
