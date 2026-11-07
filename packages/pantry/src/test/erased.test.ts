/**
 * The erased inventory (plan-qti-pie §2.3, Q6.03): every name, import path and shorthand of the
 * surface the rows-first cutover deleted has no occurrence left in the package's source, scripts
 * or grizzle configuration.
 *
 * Each pattern of §2.3 is one {@link Erasure}. Most are read as written, since nothing current
 * spells them. Three are scoped to the deleted surface, as the swarm ledger's Q6.03 note rules,
 * because their bare words name current things too:
 *
 * - `Declared…` and the old seeded relations' names are erased as the names of stored relations,
 *   `relation("…")`. `DeclaredText` and `DeclaredTypeText` (`grammar/attributes.ts`) and
 *   `DeclaredVariable` (`import/overlays/interactions.ts`) are other things, and
 *   `closed.relation("OperatorArity", …)` and its neighbours are the closed relations that replace
 *   the seeded ones.
 * - `within` and `ref` are erased as grizzle's old API, a name imported from `@bjornpagen/grizzle`.
 *   `ref(` is the vocabulary IR's type-reference helper (`vocab/inventory/attributes.ts`, which
 *   `vocab/derive/declarations.ts` emits), `within(` is a facets test's own helper, and
 *   `Compute.within` is grizzle's current guard.
 */
import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The package's root, `packages/pantry`.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * This file, which spells every pattern it searches for.
 */
const self = path.relative(packageRoot, import.meta.filename);

/**
 * The files searched, relative to {@link packageRoot}: every file under `src` and `scripts`, and
 * `grizzle.config.ts`, but this one.
 */
const searchedFiles: readonly string[] = [
  ...globSync(["src/**/*", "scripts/**/*"], { cwd: packageRoot, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(packageRoot, path.join(entry.parentPath, entry.name))),
  "grizzle.config.ts",
]
  .filter((file) => file !== self)
  .toSorted();

/**
 * One pattern of §2.3: its text as the plan writes it, what of the deleted surface it erases, how
 * it finds an occurrence, a witness of the deleted surface it must find, and the current spellings
 * it must not.
 */
interface Erasure {
  readonly erases: string;
  readonly find: (text: string) => readonly string[];
  readonly kept: readonly string[];
  readonly pattern: string;
  readonly witness: string;
}

/**
 * Find a pattern's occurrences in a text.
 *
 * @param pattern - The pattern, without the global flag.
 * @returns A finder of each match's text.
 */
const matching =
  (pattern: RegExp) =>
  (text: string): readonly string[] =>
    [...text.matchAll(new RegExp(pattern.source, `${pattern.flags}g`))].map(([match]) => match);

/**
 * A stored relation declared under one of the names: `relation(` or `relation.generated(` not
 * preceded by `closed.`, its name the first argument.
 *
 * @param names - The names, as an alternation.
 * @returns The finder.
 */
const storedRelationNamed = (names: string) =>
  matching(new RegExp(`(?<![\\w.])relation(?:\\.generated)?\\(\\s*"(?:${names})"`, "u"));

/**
 * The names a module imports from grizzle by name, each without its `type` modifier or alias.
 *
 * @param text - The module's text.
 * @returns The imported names, in order.
 */
const grizzleImports = (text: string): readonly string[] =>
  [
    ...text.matchAll(
      /\bimport\s+(?:type\s+)?\{(?<names>[^}]*)\}\s*from\s*["']@bjornpagen\/grizzle(?:\/[^"']*)?["']/gu,
    ),
  ].flatMap(({ groups }) =>
    (groups?.["names"] ?? "")
      .split(",")
      .map((name) =>
        name
          .trim()
          .replace(/^type\s+/u, "")
          .replace(/\s+as\s+\w+$/u, ""),
      )
      .filter((name) => name !== ""),
  );

/**
 * A name of grizzle's old API imported from `@bjornpagen/grizzle`.
 *
 * @param name - The old name.
 * @returns The finder.
 */
const importedFromGrizzle =
  (name: string) =>
  (text: string): readonly string[] =>
    grizzleImports(text).filter((imported) => imported === name);

/**
 * Every pattern of §2.3, in the plan's order.
 */
const erasures: readonly Erasure[] = [
  {
    erases: "the edge relation",
    find: matching(/\bEdge\b/u),
    kept: ["const edges = 3;"],
    pattern: "\\bEdge\\b",
    witness: "export const Edge = relation(",
  },
  {
    erases: "the tree's root arm",
    find: matching(/TreeRoot/u),
    kept: [],
    pattern: "TreeRoot",
    witness: "on(TreeRoot, ",
  },
  {
    erases: "the tree's misc arm",
    find: matching(/TreeMisc/u),
    kept: [],
    pattern: "TreeMisc",
    witness: "on(TreeMisc, ",
  },
  {
    erases: "the declared-marker relations, as stored relations' names",
    find: storedRelationNamed("Declared[A-Z]\\w*"),
    kept: [
      "export interface DeclaredText {",
      "readonly typeTexts: readonly DeclaredTypeText[];",
      "interface DeclaredVariable {",
    ],
    pattern: "\\bDeclared[A-Z]\\w*",
    witness: 'export const DeclaredRequired = relation("DeclaredRequired", {',
  },
  {
    erases: "the attribute's lexical-form relation",
    find: matching(/AttributeLexical/u),
    kept: ["AttributeGrammar"],
    pattern: "AttributeLexical",
    witness: "four `AttributeLexical` rows",
  },
  {
    erases: "the attribute's spelling relation",
    find: matching(/AttributeSpelling/u),
    kept: [],
    pattern: "AttributeSpelling",
    witness: "on(AttributeSpelling, ",
  },
  {
    erases: "the ancestry's step relation",
    find: matching(/AncestryStep/u),
    kept: ["parentAncestry"],
    pattern: "AncestryStep",
    witness: "AncestryStep",
  },
  {
    erases: "the seed's name list",
    find: matching(/seededNames/u),
    kept: [],
    pattern: "seededNames",
    witness: "seededNames",
  },
  {
    erases: "the seed's SQL writer",
    find: matching(/seed-sql/u),
    kept: [],
    pattern: "seed-sql",
    witness: "scripts/seed-sql.ts",
  },
  {
    erases: "the operator arity's maximum relation",
    find: matching(/OperatorArityMax/u),
    kept: ["OperatorArity"],
    pattern: "OperatorArityMax",
    witness: "OperatorArityMax",
  },
  {
    erases: "the operator arity's unbounded relation",
    find: matching(/OperatorArityUnbounded/u),
    kept: [],
    pattern: "OperatorArityUnbounded",
    witness: "OperatorArityUnbounded",
  },
  {
    erases: "the operator arity's seeded table",
    find: matching(/operator_arity/u),
    kept: [],
    pattern: "operator_arity",
    witness: '"qti"."operator_arity"',
  },
  {
    erases: "the seeded relations the closed ones replace, as stored relations' names",
    find: storedRelationNamed(
      "Admission|AttributeAdmission|BindingFit|RecordBindingFit|MappableBaseType|ResourceTypeOf|RootOfType|OperatorArity",
    ),
    kept: ['export const OperatorArity = closed.relation(\n  "OperatorArity",'],
    pattern:
      'relation\\("(Admission|AttributeAdmission|BindingFit|RecordBindingFit|MappableBaseType|ResourceTypeOf|RootOfType|OperatorArity)"',
    witness: 'export const OperatorArity = relation("OperatorArity", {',
  },
  {
    erases: "grizzle's old capacity statement",
    find: matching(/\bcapacity\(/u),
    kept: ["Compute.cardinality("],
    pattern: "\\bcapacity\\(",
    witness: 'capacity(on(Node, "parent"), 1n)',
  },
  {
    erases: "grizzle's old within statement, as a grizzle import",
    find: importedFromGrizzle("within"),
    kept: [
      'within("length", (size, held) => size === held)(n)',
      "Compute.within(x, 0n, 9n)",
      'import { Compute } from "@bjornpagen/grizzle";',
    ],
    pattern: "\\bwithin\\(",
    witness: 'import { key, within } from "@bjornpagen/grizzle";',
  },
  {
    erases: "grizzle's old weigh statement",
    find: matching(/\bweigh\(/u),
    kept: ["weight("],
    pattern: "\\bweigh\\(",
    witness: 'weigh(on(Node, "kind"))',
  },
  {
    erases: "grizzle's old ref term, as a grizzle import",
    find: importedFromGrizzle("ref"),
    kept: ['ref("xs:string")', 'import { relation, type RowScalars } from "@bjornpagen/grizzle";'],
    pattern: "\\bref\\(",
    witness: 'import {\n  key,\n  type ref,\n} from "@bjornpagen/grizzle";',
  },
  {
    erases: "the literal-record shorthand of select",
    find: matching(/select\([^,()]+,\s*\{/u),
    kept: ['select(Node, (n) => n.eq(n.kind, "lom:lom"))'],
    pattern: "select\\([^,()]+,\\s*\\{",
    witness: 'select(Node, { kind: "lom:lom" })',
  },
  {
    erases: "the node's arm list",
    find: matching(/nodeArms/u),
    kept: [],
    pattern: "nodeArms",
    witness: "nodeArms",
  },
  {
    erases: "an exported arm list",
    find: matching(/export const arms/u),
    kept: ["const arms = ["],
    pattern: "export const arms",
    witness: "export const arms = [",
  },
  {
    erases: "the attribute homes",
    find: matching(/attribute-homes/u),
    kept: [],
    pattern: "attribute-homes",
    witness: "attribute-homes.ts",
  },
  {
    erases: "a position stored as a bigint",
    find: matching(/position: pg\.bigint/u),
    kept: ["position: closedId(Position)"],
    pattern: "position: pg\\.bigint",
    witness: "position: pg.bigint,",
  },
  {
    erases: "the old schema's modules",
    find: matching(/#pantry\/schema\//u),
    kept: ["#pantry/qti/schema.ts"],
    pattern: "#pantry/schema/",
    witness: 'from "#pantry/schema/kinds/asi.ts"',
  },
  {
    erases: "the importer's guards",
    find: matching(/#pantry\/import\/guards/u),
    kept: ["src/test/fixtures/processing/guards/README.md"],
    pattern: "#pantry/import/guards",
    witness: 'from "#pantry/import/guards.ts"',
  },
  {
    erases: "the guards' refusal",
    find: matching(/GuardRefusal/u),
    kept: [],
    pattern: "GuardRefusal",
    witness: "GuardRefusal",
  },
  {
    erases: "the old processing modules",
    find: matching(/#pantry\/processing\//u),
    kept: ["#pantry/test/processing-fixtures.ts"],
    pattern: "#pantry/processing/",
    witness: 'from "#pantry/processing/rules.ts"',
  },
];

describe("the erased inventory (plan-qti-pie §2.3)", () => {
  it("finds each pattern's witness of the deleted surface, and none of the current spellings it keeps", () => {
    // Oracle: the specification as a checker, §2.3's patterns, each held to one sample of the
    // surface it erases and to the current spellings the ledger's Q6.03 note keeps.
    // Bound: every pattern of §2.3, 26.
    assert.strictEqual(erasures.length, 26);
    for (const { find, kept, pattern, witness } of erasures) {
      assert.isNotEmpty(find(witness), `${pattern} finds its witness`);
      assert.deepStrictEqual(
        kept.flatMap((text) => find(text)),
        [],
        `${pattern} keeps the current spellings`,
      );
    }
  });

  it("holds no occurrence of any pattern in the package's source, scripts or grizzle configuration", () => {
    // Oracle: the specification as a checker, §2.3: every pattern reaches 0 over
    // packages/pantry/{src,scripts,grizzle.config.ts}, this file excluded.
    // Bound: every file under src and scripts, and grizzle.config.ts.
    assert.include(searchedFiles, "grizzle.config.ts");
    assert.include(searchedFiles, "src/qti/schema.ts");

    const texts = searchedFiles.map((file) => ({
      file,
      text: readFileSync(path.join(packageRoot, file), "utf-8"),
    }));
    const found = Object.fromEntries(
      erasures.map(({ find, pattern }) => [
        pattern,
        texts.flatMap(({ file, text }) => find(text).map((match) => `${file}: ${match}`)),
      ]),
    );

    assert.deepStrictEqual(found, Object.fromEntries(erasures.map(({ pattern }) => [pattern, []])));
  });
});
