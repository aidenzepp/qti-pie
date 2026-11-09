import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { moduleImports } from "#pantry/test/module-imports.ts";
import type { ModuleImport } from "#pantry/test/module-imports.ts";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * A step of the constraint-engine plan's §4
 * (`~/.cache/gr8des/integration/constraint-engine-plan.md`).
 */
type Step = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11" | "S12";

/**
 * Entries grouped by the step of §4 by which each goes, in the plan's order of steps.
 */
type ByStep = readonly (readonly [step: Step, entries: readonly string[]])[];

/**
 * The XML side, the plan's `@qti-pie/filling` (§2.1) at today's paths, as globs relative to `src`:
 * ZIP and XML to typed rows and back, and the command line. It hands the PostgreSQL side a
 * package's rows and gets the scan's rows back.
 *
 * `import/package.ts`, `import/write.ts` and `export/package.ts` stay here, the XML program, the
 * row builders and the export's unshred and zip, once S10 takes out the parts §2.3 keeps:
 * `ingest`, `changeSetOf` with the row type, and the reads. `model/folds.ts`, which §2.1 does not
 * list, is here with the rest of the XDM model: the import's builders and the law oracle both
 * fold with it.
 */
const xmlSide = [
  "cli.ts",
  "cli/*.ts",
  "export/compare.ts",
  "export/package.ts",
  "export/render.ts",
  "import/context.ts",
  "import/fold.ts",
  "import/overlays/*.ts",
  "import/package.ts",
  "import/preview.ts",
  "import/program.ts",
  "import/record.ts",
  "import/roster.ts",
  "import/rules.ts",
  "import/write.ts",
  "model/*.ts",
  "package/read.ts",
  "package/record.ts",
  "package/zip.ts",
];

/**
 * The PostgreSQL side, what pantry keeps (§2.3) at today's paths, as globs relative to `src`: the
 * schema, its roles and logins, the grammar's generators and installed constants, the inventory
 * data and its offline derivers, the database layer, the scan and its paging, and the refusal
 * report with its law catalog.
 *
 * `xml/oracle.ts` is the grammar's own `xmllint` harness, which only tests reach and which imports
 * no module of pantry's.
 */
const databaseSide = [
  "db/*.ts",
  "export/pages.ts",
  "export/scan.ts",
  "grammar/*.ts",
  "import/refusal.ts",
  "package/refusal-origin.ts",
  "qti/*.ts",
  "vocab/**/*.ts",
  "xml/oracle.ts",
];

/**
 * Where the sides meet: the PostgreSQL side's modules the XML side may import, pantry's `exports`
 * of §2.1 at today's paths. They are the schema's builders and this package's own install's schema
 * (`qti/own.ts`, which holds what `qti/schema.ts` held before it built nothing at load), which will
 * hold `PackageRows`, the installed constants and rosters, the inventory data, the scan, and the
 * database layer the command line provides. S10 adds `ingest` when it splits it out of
 * `import/package.ts`. The terms the schema and the row builders both read (`vocab/terms/`) and the
 * representation's stated limits (`qti/limits.ts`) are here too: each builds no relation, so the
 * row builders read them without evaluating the schema.
 *
 * `vocab/open.ts` is not here: S10 splits it into its generator and the reader that shred runs.
 * Nor is `vocab/derive/`, which runs offline.
 */
const handoff = [
  "db/layer.ts",
  "export/scan.ts",
  "grammar/install.ts",
  "qti/limits.ts",
  "qti/own.ts",
  "qti/schema.ts",
  "vocab/inventory/*.ts",
  "vocab/laws.ts",
  "vocab/namespaces.ts",
  "vocab/sequencing.ts",
  "vocab/terms/*.ts",
];

/**
 * The offline derivers, which read the XSDs with crust when `vocab/derive/derive.ts` runs, never on
 * a run-time path. pantry keeps crust for them and for `uriReference` alone (§2.1).
 */
const derivers = ["vocab/derive/*.ts"];

/**
 * The XML readers, which the PostgreSQL side does not import (§2.1: "No run-time import path reads
 * XML").
 */
const xmlReaders = ["@qti-pie/crust", "saxes"];

/**
 * The database driver, which only the PostgreSQL side imports: filling's dependencies are crust,
 * pantry, grizzle, Effect and the Node platform (§2.1).
 */
const databaseDrivers = ["pg"];

/**
 * The PostgreSQL side's one run-time read of an XML reader that the target keeps: a namespace
 * name's pattern is crust's `uriReference`, the one crust's reader holds the name to.
 */
const keptReaderImports: ReadonlySet<string> = new Set(["qti/chardata.ts: @qti-pie/crust/uri.ts"]);

/**
 * The modules on neither side today, each by the step that takes it out of production: none since
 * S1 moved the host judge and the host's reading of grizzle's predicates into `src/test/`. The
 * list only shrinks.
 */
const unsided: ByStep = [];

/**
 * Every crossing today, `module: specifier`, grouped by the step of §4 that removes it at the
 * latest. A step that drops the import sooner drops its entry with it. The list only shrinks: a new
 * crossing fails the test, and so does an entry whose import is gone, until the entry goes too.
 */
const crossings: ByStep = [
  // S3 drops the NCName gate of declarations.ts:219 (B1).
  ["S3", ["import/overlays/declarations.ts: #pantry/grammar/domains.ts"]],
  // S6 makes generated fields of operators.ts:228's collapse (B3) and tests.ts:466's boolean read
  // (B4), each the last read of `grammar/domains.ts` in its overlay.
  [
    "S6",
    [
      "import/overlays/operators.ts: #pantry/grammar/domains.ts",
      "import/overlays/tests.ts: #pantry/grammar/domains.ts",
    ],
  ],
  // S8 makes TableHeader a query over its source (B9), which takes html.ts's NCName gate, its one
  // read of `grammar/domains.ts`.
  ["S8", ["import/overlays/html.ts: #pantry/grammar/domains.ts"]],
  // S10 takes out of each module the code of the other side, which no export can carry across:
  // `ingest` with its login, retries and refusal report out of `import/package.ts`; `changeSetOf`
  // with the author role out of `import/write.ts`, and the row type with its relations into the
  // schema, where the author login's workload reads them; the reader's refusal out of
  // `package/refusal-origin.ts` beside `ruleOfError` in `import/rules.ts`, and the database's
  // refusal an error of its own, so `import/refusal.ts` reads no `ImportRefused` and the command
  // line gets the database's refusal from `ingest` (§2.4); the export's reads out of `export/package.ts`, behind
  // the scan; and crust's reader types out of `vocab/open.ts`, with shred's reader. The plan places
  // neither `export/pages.ts`'s assembly nor `qti/attributes.ts`'s `handlePrefixes`: S10 owes each
  // a side.
  [
    "S10",
    [
      "cli/output.ts: #pantry/package/refusal-origin.ts",
      "cli/refused.ts: #pantry/package/refusal-origin.ts",
      "export/package.ts: #pantry/export/pages.ts",
      "export/package.ts: #pantry/qti/own-login.ts",
      "export/package.ts: #pantry/qti/package.ts",
      "export/pages.ts: #pantry/model/assemble.ts",
      "export/pages.ts: #pantry/model/xdm.ts",
      "export/render.ts: #pantry/export/pages.ts",
      "import/package.ts: #pantry/import/refusal.ts",
      "import/package.ts: #pantry/qti/own-login.ts",
      "import/package.ts: #pantry/qti/package.ts",
      "import/refusal.ts: #pantry/import/rules.ts",
      "import/rules.ts: #pantry/package/refusal-origin.ts",
      "import/write.ts: #pantry/qti/roles.ts",
      "qti/attributes.ts: #pantry/model/xdm.ts",
      "qti/logins.ts: #pantry/import/write.ts",
      "vocab/open.ts: @qti-pie/crust/tree.ts",
    ],
  ],
  // S11 moves the XML side into filling, which then reaches pantry only through its `exports`
  // (§2.1): each read of a schema module other than `qti/schema.ts`, or of a grammar module other
  // than `grammar/install.ts`, goes through one of them. S10's split of `grammar/content.ts`,
  // `grammar/domains.ts`, `grammar/kinds.ts` and `vocab/open.ts` takes some of them out sooner,
  // where only shred's readers were read, and so would a split of `vocab/data-ssml.ts`, whose JSON
  // reader only the data-ssml overlay runs beside the schema's table of members.
  [
    "S11",
    [
      "import/context.ts: #pantry/grammar/compose.ts",
      "import/fold.ts: #pantry/grammar/compose.ts",
      "import/fold.ts: #pantry/grammar/content.ts",
      "import/overlays/catalog.ts: #pantry/grammar/domains.ts",
      "import/overlays/catalog.ts: #pantry/qti/catalog.ts",
      "import/overlays/catalog.ts: #pantry/qti/identity.ts",
      "import/overlays/data-ssml.ts: #pantry/qti/data-ssml.ts",
      "import/overlays/data-ssml.ts: #pantry/vocab/data-ssml.ts",
      "import/overlays/declarations.ts: #pantry/grammar/attributes.ts",
      "import/overlays/declarations.ts: #pantry/grammar/compose.ts",
      "import/overlays/declarations.ts: #pantry/qti/declarations.ts",
      "import/overlays/expressions.ts: #pantry/grammar/domains.ts",
      "import/overlays/expressions.ts: #pantry/grammar/expression.ts",
      "import/overlays/expressions.ts: #pantry/grammar/references.ts",
      "import/overlays/expressions.ts: #pantry/qti/declarations.ts",
      "import/overlays/expressions.ts: #pantry/qti/expressions.ts",
      "import/overlays/expressions.ts: #pantry/qti/tests.ts",
      "import/overlays/html.ts: #pantry/qti/html.ts",
      "import/overlays/identity.ts: #pantry/grammar/domains.ts",
      "import/overlays/identity.ts: #pantry/qti/identity.ts",
      "import/overlays/interactions.ts: #pantry/grammar/domains.ts",
      "import/overlays/interactions.ts: #pantry/qti/declarations.ts",
      "import/overlays/interactions.ts: #pantry/qti/interactions.ts",
      "import/overlays/mapping.ts: #pantry/grammar/domains.ts",
      "import/overlays/mapping.ts: #pantry/qti/mapping.ts",
      "import/overlays/mathml-align.ts: #pantry/grammar/domains.ts",
      "import/overlays/mathml-align.ts: #pantry/qti/mathml-align.ts",
      "import/overlays/mathml-apply.ts: #pantry/grammar/expression.ts",
      "import/overlays/mathml-apply.ts: #pantry/qti/mathml-apply.ts",
      "import/overlays/mathml-cn.ts: #pantry/grammar/domains.ts",
      "import/overlays/mathml-cn.ts: #pantry/grammar/expression.ts",
      "import/overlays/mathml-cn.ts: #pantry/qti/mathml-cn.ts",
      "import/overlays/mathml-share.ts: #pantry/qti/identity.ts",
      "import/overlays/mathml-share.ts: #pantry/qti/mathml-share.ts",
      "import/overlays/mathml-share.ts: #pantry/qti/tests.ts",
      "import/overlays/metadata.ts: #pantry/grammar/attributes.ts",
      "import/overlays/metadata.ts: #pantry/grammar/domains.ts",
      "import/overlays/metadata.ts: #pantry/qti/metadata.ts",
      "import/overlays/operators.ts: #pantry/qti/operators.ts",
      "import/overlays/package.ts: #pantry/grammar/domains.ts",
      "import/overlays/package.ts: #pantry/grammar/references.ts",
      "import/overlays/package.ts: #pantry/qti/package.ts",
      "import/overlays/quotation.ts: #pantry/qti/quotation.ts",
      "import/overlays/tests.ts: #pantry/grammar/compose.ts",
      "import/overlays/tests.ts: #pantry/qti/tests.ts",
      "import/record.ts: #pantry/qti/package.ts",
      "import/write.ts: #pantry/grammar/kinds.ts",
      "import/write.ts: #pantry/qti/attributes.ts",
      "import/write.ts: #pantry/qti/chardata.ts",
      "import/write.ts: #pantry/qti/node.ts",
      "model/assemble.ts: #pantry/grammar/kinds.ts",
      "model/assemble.ts: #pantry/vocab/open.ts",
      "model/composed.ts: #pantry/grammar/attributes.ts",
      "model/composed.ts: #pantry/grammar/compose.ts",
      "model/composed.ts: #pantry/grammar/content.ts",
      "model/composed.ts: #pantry/grammar/domains.ts",
      "model/composed.ts: #pantry/grammar/kinds.ts",
      "model/composed.ts: #pantry/grammar/names.ts",
      "model/composed.ts: #pantry/grammar/xsi.ts",
      "model/folds.ts: #pantry/grammar/ancestry.ts",
      "model/folds.ts: #pantry/grammar/kinds.ts",
      "model/names.ts: #pantry/grammar/kinds.ts",
      "model/shred.ts: #pantry/grammar/domains.ts",
      "model/shred.ts: #pantry/grammar/kinds.ts",
      "model/shred.ts: #pantry/vocab/open.ts",
      "model/xdm.ts: #pantry/grammar/kinds.ts",
      "model/xdm.ts: #pantry/vocab/open.ts",
    ],
  ],
];

/**
 * The two sides, the handoff and the offline derivers as sets of modules relative to `src`.
 */
interface Boundary {
  readonly database: ReadonlySet<string>;
  readonly derivers: ReadonlySet<string>;
  readonly handoff: ReadonlySet<string>;
  readonly xml: ReadonlySet<string>;
}

/**
 * List the modules a glob matches under `src`, tests and the test support under `src/test/`
 * excluded. A test is not held to the boundary: it moves with the module it tests (S11).
 *
 * @param pattern - A glob relative to `src`.
 * @returns The modules' paths relative to `src`, sorted.
 */
const modules = (pattern: string): readonly string[] =>
  globSync(pattern, { cwd: sourceRoot })
    .filter((file) => !file.endsWith(".test.ts") && !file.startsWith("test/"))
    .toSorted();

/**
 * Collect the modules a list of globs matches.
 *
 * @param patterns - Globs relative to `src`.
 * @returns The modules, relative to `src`.
 */
const modulesOf = (patterns: readonly string[]): ReadonlySet<string> =>
  new Set(patterns.flatMap(modules));

/**
 * The boundary over today's tree.
 */
const live: Boundary = {
  database: modulesOf(databaseSide),
  derivers: modulesOf(derivers),
  handoff: modulesOf(handoff),
  xml: modulesOf(xmlSide),
};

/**
 * Decide whether a specifier names a package or one of its subpaths.
 *
 * @param specifier - A module specifier.
 * @param packages - Package names.
 * @returns Whether the specifier is one of the packages or a subpath of one.
 */
const namesPackage = (specifier: string, packages: readonly string[]): boolean =>
  packages.some((name) => specifier === name || specifier.startsWith(`${name}/`));

/**
 * Decide whether one import of a module crosses the boundary. A module of the XML side crosses
 * when it imports a module of pantry's outside the XML side and the handoff, or the database
 * driver. A module of the PostgreSQL side crosses when it imports a module outside its side, an
 * XML reader other than the kept one (unless it is an offline deriver), or a value of an offline
 * deriver, which would put the deriver's reader on a run-time path.
 *
 * @param boundary - The sides.
 * @param file - The importing module, relative to `src`.
 * @param found - One import of it.
 * @returns Whether the import crosses.
 */
const crosses = (boundary: Boundary, file: string, found: ModuleImport): boolean => {
  const { form, specifier } = found;
  const target = specifier.startsWith("#pantry/") ? specifier.slice("#pantry/".length) : undefined;

  if (boundary.xml.has(file)) {
    return target === undefined
      ? namesPackage(specifier, databaseDrivers)
      : !boundary.xml.has(target) && !boundary.handoff.has(target);
  }

  if (target !== undefined) {
    return (
      !boundary.database.has(target) ||
      (boundary.derivers.has(target) && !boundary.derivers.has(file) && form !== "type")
    );
  }

  return (
    namesPackage(specifier, xmlReaders) &&
    !boundary.derivers.has(file) &&
    !keptReaderImports.has(`${file}: ${specifier}`)
  );
};

/**
 * Find every import that crosses the boundary.
 *
 * @param boundary - The sides.
 * @param read - Reads a module's text by its path relative to `src`.
 * @returns Each crossing as `module: specifier`, once per pair, sorted.
 */
const crossingsOf = (boundary: Boundary, read: (file: string) => string): readonly string[] =>
  [
    ...new Set(
      [...boundary.xml, ...boundary.database].flatMap((file) =>
        moduleImports(read(file))
          .filter((found) => crosses(boundary, file, found))
          .map(({ specifier }) => `${file}: ${specifier}`),
      ),
    ),
  ].toSorted();

/**
 * Read a module's text by its path relative to `src`.
 *
 * @param file - The module's path relative to `src`.
 * @returns Its text.
 */
const readSourceModule = (file: string): string =>
  readFileSync(path.join(sourceRoot, file), "utf-8");

/**
 * Flatten entries grouped by step into one sorted list.
 *
 * @param byStep - The entries, by step.
 * @returns Every entry, sorted.
 */
const entriesOf = (byStep: ByStep): readonly string[] =>
  byStep.flatMap(([, entries]) => entries).toSorted();

describe("the boundary between the XML side and the PostgreSQL side", () => {
  it("puts every module outside src/test/ on one side, or lists it as on neither", () => {
    assert.deepStrictEqual(
      [...live.xml].filter((file) => live.database.has(file)),
      [],
    );
    assert.deepStrictEqual(
      modules("**/*.ts").filter((file) => !live.xml.has(file) && !live.database.has(file)),
      entriesOf(unsided),
    );
  });

  it("names live modules: every glob matches one, and the handoff and the derivers are the PostgreSQL side's", () => {
    assert.deepStrictEqual(
      [...xmlSide, ...databaseSide, ...handoff, ...derivers].filter(
        (pattern) => modules(pattern).length === 0,
      ),
      [],
    );
    assert.deepStrictEqual(
      [...live.handoff, ...live.derivers].filter((file) => !live.database.has(file)),
      [],
    );
  });

  it("is crossed only where a step of the plan will remove the crossing", () => {
    assert.deepStrictEqual(
      crossingsOf(live, readSourceModule),
      entriesOf(crossings),
      "A crossing the list lacks breaks the boundary: reach the other side through the handoff. An entry whose import is gone is deleted.",
    );
  });

  it("finds a planted crossing of every kind, and none where the sides meet at the handoff", () => {
    // Oracle: the rule of `crosses` on a planted module graph. Live: the XML side importing the
    // database driver, a PostgreSQL module outside the handoff, and a module on neither side by a
    // dynamic import; the PostgreSQL side importing the XML side by a type-only import, an XML
    // reader, and a value of an offline deriver. Stale: the XML side importing the handoff, its
    // own side, grizzle and crust; the PostgreSQL side importing grizzle, the driver and a
    // deriver's type, the kept `uriReference`, and a deriver reading crust and saxes.
    const planted: Boundary = {
      database: new Set([
        "db/derived.ts",
        "db/scan.ts",
        "db/schema.ts",
        "derive/xsd.ts",
        "qti/chardata.ts",
      ]),
      derivers: new Set(["derive/xsd.ts"]),
      handoff: new Set(["db/scan.ts", "db/schema.ts"]),
      xml: new Set(["xml/rows.ts", "xml/shred.ts"]),
    };
    const sources = new Map([
      [
        "xml/rows.ts",
        [
          'import { Qti } from "#pantry/db/schema.ts";',
          'import { scan } from "#pantry/db/scan.ts";',
          'import { shred } from "#pantry/xml/shred.ts";',
          'import type { Addition } from "@bjornpagen/grizzle";',
          'import { readXml } from "@qti-pie/crust/read.ts";',
          'import { Pool } from "pg";',
          'import { derived } from "#pantry/db/derived.ts";',
          'const judge = await import("#pantry/host/judge.ts");',
        ],
      ],
      [
        "db/schema.ts",
        [
          'import type { Rows } from "#pantry/xml/rows.ts";',
          'import { uriReference } from "@qti-pie/crust/uri.ts";',
          'import type { SourcePath } from "#pantry/derive/xsd.ts";',
          'import { Db } from "@bjornpagen/grizzle";',
        ],
      ],
      [
        "db/scan.ts",
        [
          'import { sources } from "#pantry/derive/xsd.ts";',
          'import { SaxesParser } from "saxes";',
          'import { Pool } from "pg";',
        ],
      ],
      ["qti/chardata.ts", ['import { uriReference } from "@qti-pie/crust/uri.ts";']],
      [
        "derive/xsd.ts",
        [
          'import { SaxesParser } from "saxes";',
          'import { readXml } from "@qti-pie/crust/read.ts";',
        ],
      ],
    ]);

    assert.deepStrictEqual(
      crossingsOf(planted, (file) => (sources.get(file) ?? []).join("\n")),
      [
        "db/scan.ts: #pantry/derive/xsd.ts",
        "db/scan.ts: saxes",
        "db/schema.ts: #pantry/xml/rows.ts",
        "db/schema.ts: @qti-pie/crust/uri.ts",
        "xml/rows.ts: #pantry/db/derived.ts",
        "xml/rows.ts: #pantry/host/judge.ts",
        "xml/rows.ts: pg",
      ],
    );
  });
});
