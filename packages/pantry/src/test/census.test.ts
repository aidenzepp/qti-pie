import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, boolean, element, int, map, subarray } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { census } from "#pantry/test/census.ts";
import type { Census, FunctionKind, LawFamily, MigrationFile } from "#pantry/test/census.ts";

/**
 * The census's zero targets (fin.md §13 and its exit, "the census is a test, and it meets §13's
 * targets"; plan-qti-pie Q6.02), each as the predicate over a census that states it: no enum
 * types; no seeded tables, seed rows or `INSERT INTO`; no validate files, law functions or
 * constraint triggers; no policies (G6); and no two domains with one definition (G6).
 *
 * §13's table count, an estimate below 80, is no target: the committed migration's measured count
 * is asserted instead, one table per stored relation (`census.migration.test.ts`).
 */
const targets = {
  "no enum types": (held: Census) => held.enums === 0,
  "no policies": (held: Census) => held.policies.total === 0,
  "no seeded tables, seed rows or INSERT INTO": (held: Census) =>
    held.seed.folders === 0 && held.seed.inserts === 0 && Object.keys(held.seed.rows).length === 0,
  "no two domains with one definition": (held: Census) =>
    held.domains.distinct === held.domains.total,
  "no validate files, law functions or constraint triggers": (held: Census) =>
    held.laws.validateFiles === 0 && held.functions.law === 0 && held.laws.constraintTriggers === 0,
} as const satisfies Readonly<Record<string, (held: Census) => boolean>>;

/**
 * A census target's name.
 */
type Target = keyof typeof targets;

/**
 * Every target's name, in the order {@link targets} states them.
 */
const targetNames = Object.keys(targets).filter((name): name is Target => name in targets);

/**
 * The targets a census meets.
 *
 * @param held - The census.
 * @returns The names of the targets whose predicate holds of it, in {@link targets}' order.
 */
const metBy = (held: Census): readonly Target[] =>
  targetNames.filter((name) => targets[name](held));

/**
 * One statement form the census counts, as a generated migration holds it. The census parses the
 * printed SQL; the model below counts these values, so the two are separate readings of one
 * migration (a printer and a parser checked against the structure they share).
 */
type Statement = Readonly<{ sql: string }> &
  (
    | Readonly<{ form: "enum"; name: string }>
    | Readonly<{ definition: string; form: "domain"; name: string }>
    | Readonly<{
        columns: readonly string[];
        form: "table";
        keys: readonly (readonly string[])[];
        name: string;
      }>
    | Readonly<{ columns: readonly string[]; form: "foreignKey"; table: string }>
    | Readonly<{ form: "function"; kind: FunctionKind; name: string }>
    | Readonly<{ family: LawFamily; form: "law"; trigger: boolean }>
    | Readonly<{ alwaysTrue: boolean; form: "policy"; table: string }>
    | Readonly<{ form: "view"; table: string }>
    | Readonly<{ form: "insert"; relation: string; tuples: readonly (readonly string[])[] }>
  );

/**
 * A law's name under each family, as the census reads families from names.
 */
const LAW_NAMES: Readonly<Record<LawFamily, string>> = {
  alternatives: "__t_alternatives_node",
  capacity: "__t_capacity_n",
  mirror: "__t_mirror_n",
  other: "__t_key_n",
  selectedSource: "__t_kind_in_t",
};

/**
 * Each function kind's head, as grizzle prints it.
 */
const FUNCTION_HEADS: Readonly<Record<FunctionKind, (name: string) => string>> = {
  constant: (name) =>
    `DO $$\nBEGIN\n  EXECUTE "pg_catalog"."format"('CREATE FUNCTION "qti"."${name}__c"() RETURNS bit varying LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN %L::bit varying'::"pg_catalog"."text", B'10');\nEND\n$$;`,
  decode: (name) =>
    `CREATE FUNCTION "qti"."${name}_name"(code int2) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE\n  RETURN 'x';`,
  law: (name) =>
    `CREATE OR REPLACE FUNCTION "qti"."__law_${name}"() RETURNS "pg_catalog"."trigger"\nLANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;`,
  live: (name) =>
    `CREATE FUNCTION "qti"."__${name}_live_x"() RETURNS bit varying\n  LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN B'11'::bit varying;`,
  names: (name) =>
    `CREATE FUNCTION "qti"."${name}__names"() RETURNS "pg_catalog"."name"[] LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN '{a}'::name[];`,
  other: (name) =>
    `CREATE OR REPLACE FUNCTION "qti"."${name}_refuse"("state" "pg_catalog"."text") RETURNS boolean\nLANGUAGE plpgsql AS $$ BEGIN RETURN true; END $$;`,
  payload: (name) =>
    `CREATE FUNCTION "qti"."${name}__p"() RETURNS "pg_catalog"."text"[] LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN '{a}'::text[];`,
};

/**
 * Tuple text whose quoting the census must see through: a parenthesis, a comma and a doubled quote
 * inside a literal.
 */
const tupleValue = element(["'a'", "'a), (b'", "'it''s (open'", "1"] as const);

const quoted = (columns: readonly string[]): string =>
  columns.map((column) => `"${column}"`).join(", ");

const tableOf =
  (name: string): Gen<Statement> =>
  (source) => {
    const kept = source.draw(subarray(["node", "value", "kind", "at"]));
    const columns = kept.length === 0 ? ["node"] : kept;
    const keys = source.draw(
      array(
        map(int(1, columns.length), (width) => columns.slice(0, width)),
        { max: 3, min: 0 },
      ),
    );
    const lines = [
      ...columns.map((column) => `  "${column}" text NOT NULL`),
      ...keys.map(
        (key, at) =>
          `  CONSTRAINT "k${at}" ${at === 0 ? "PRIMARY KEY" : "UNIQUE"} (${quoted(key)})`,
      ),
    ];

    return {
      columns,
      form: "table",
      keys,
      name,
      sql: `CREATE TABLE "qti"."${name}" (\n${lines.join(",\n")}\n);`,
    };
  };

const lawOf: Gen<Statement> = (source) => {
  const family = source.draw(
    element(["alternatives", "capacity", "mirror", "other", "selectedSource"] as const),
  );
  const trigger = source.draw(boolean);
  const law = LAW_NAMES[family];
  const triggerSql = trigger
    ? `CREATE CONSTRAINT TRIGGER "${law}_t" AFTER INSERT ON "qti"."t" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "qti"."f"();`
    : "";

  return {
    family,
    form: "law",
    sql: `-- Validate law ${law}: its triggers.\n${triggerSql}`,
    trigger,
  };
};

/**
 * One statement and its printed SQL, under a table name that may carry the prefixes and suffixes
 * the census classifies tables by.
 */
const statementOf: Gen<Statement> = (source) => {
  const name = `${source.draw(element(["declared_", "", "x_"] as const))}${source.draw(element(["title", "node", "lexical", "spelling"] as const))}${source.draw(element(["", "_0", "_1"] as const))}`;
  const arms: readonly [Gen<Statement>, ...Gen<Statement>[]] = [
    () => ({ form: "enum", name, sql: `CREATE TYPE "qti"."${name}" AS ENUM ('a', 'b');` }),
    (inner) => {
      const definition = inner.draw(
        element([
          "text CHECK (VALUE <> '')",
          "text CHECK (VALUE ~ '[0-9]+')",
          "int8 CHECK (VALUE >= 0)",
          "bit(5) CHECK (VALUE & B'11000' = VALUE)",
        ] as const),
      );

      return {
        definition,
        form: "domain",
        name,
        sql: `CREATE DOMAIN "qti"."d_${name}" AS ${definition};`,
      };
    },
    tableOf(name),
    (inner) => {
      const columns = [...inner.draw(subarray(["node", "value", "__pred_at_x", "kind"])), "id"];

      return {
        columns,
        form: "foreignKey",
        sql: `ALTER TABLE "qti"."${name}" ADD CONSTRAINT "f_${name}" FOREIGN KEY (${quoted(columns)}) REFERENCES "qti"."other" (${quoted(columns)});`,
        table: name,
      };
    },
    (inner) => {
      const kind = inner.draw(
        element(["constant", "decode", "law", "live", "names", "other", "payload"] as const),
      );

      return { form: "function", kind, name, sql: FUNCTION_HEADS[kind](name) };
    },
    lawOf,
    (inner) => {
      const alwaysTrue = inner.draw(boolean);

      return {
        alwaysTrue,
        form: "policy",
        sql: `CREATE POLICY "p_${name}" ON "qti"."${name}" AS PERMISSIVE FOR ALL TO "r"\n  USING (${alwaysTrue ? "true" : `"value" <> ''`})\n  WITH CHECK (true);`,
        table: name,
      };
    },
    () => ({ form: "view", sql: `CREATE VIEW "qti__author"."${name}" AS SELECT 1;`, table: name }),
    (inner) => {
      const relation = inner.draw(element(["note", "admission_like"] as const));
      const tuples = inner.draw(array(array(tupleValue, { max: 3, min: 1 }), { max: 4, min: 1 }));

      return {
        form: "insert",
        relation,
        sql: `INSERT INTO "qti"."${relation}" ("a") VALUES ${tuples.map((tuple) => `(${tuple.join(", ")})`).join(", ")};`,
        tuples,
      };
    },
  ];

  return source.draw(source.draw(element(arms)));
};

/**
 * A generated migration's files: each statement its own file, a law in a `-validate.sql` file and
 * an insert in a `_seed` folder, as grizzle lays them out.
 */
const filesOf = (statements: readonly Statement[]): readonly MigrationFile[] =>
  statements.map((statement, index) => ({
    file: `${String(index).padStart(2, "0")}-${statement.form === "law" ? "validate" : "structure"}.sql`,
    folder: statement.form === "insert" ? "20260101000001_seed" : "20260101000000_init",
    sql: `${statement.sql}\n`,
  }));

const countOf = <T>(values: readonly T[], keep: (value: T) => boolean): number =>
  values.filter(keep).length;

/**
 * Count each table's members of a list, keyed and ordered by table.
 *
 * @param named - A table name per member.
 * @returns How many members each table has.
 */
const tallied = (named: readonly string[]): Readonly<Record<string, number>> =>
  Object.fromEntries(
    [...new Set(named)]
      .toSorted()
      .map((table) => [table, named.filter((held) => held === table).length]),
  );

/**
 * What the census must report for a generated migration, counted from its statements.
 */
const modelOf = (statements: readonly Statement[]): Census => {
  const pick = <F extends Statement["form"]>(form: F) =>
    statements.filter(
      (statement): statement is Extract<Statement, { form: F }> => statement.form === form,
    );
  const tables = pick("table");
  // A domain's definition is its text after AS through the statement's closing semicolon.
  const definitions = pick("domain").map((domain) => `${domain.definition};`);
  const distinct = [...new Set(definitions)];
  const keys = pick("foreignKey").map((key) => key.columns.length);
  const laws = pick("law");
  const functions = pick("function");
  const rows = new Map<string, number>();
  const byColumns = new Map<number, number>();
  const encoder = new TextEncoder();

  for (const insert of pick("insert")) {
    rows.set(insert.relation, (rows.get(insert.relation) ?? 0) + insert.tuples.length);
  }

  for (const table of tables) {
    byColumns.set(table.columns.length, (byColumns.get(table.columns.length) ?? 0) + 1);
  }

  return {
    domains: {
      bits: countOf(definitions, (definition) => definition.startsWith("bit(")),
      distinct: distinct.length,
      repeatedBytes:
        encoder.encode(definitions.join("")).length - encoder.encode(distinct.join("")).length,
      total: definitions.length,
    },
    enums: pick("enum").length,
    foreignKeys: {
      axes: tallied(
        pick("foreignKey")
          .filter((key) => key.columns.some((column) => column.startsWith("__pred_")))
          .map((key) => key.table),
      ),
      byTable: tallied(pick("foreignKey").map((key) => key.table)),
      composite: countOf(keys, (width) => width > 1),
      total: keys.length,
      widest: Math.max(0, ...keys),
    },
    functions: {
      constant: countOf(functions, (f) => f.kind === "constant"),
      decode: countOf(functions, (f) => f.kind === "decode"),
      law: countOf(functions, (f) => f.kind === "law"),
      live: countOf(functions, (f) => f.kind === "live"),
      names: countOf(functions, (f) => f.kind === "names"),
      other: countOf(functions, (f) => f.kind === "other"),
      payload: countOf(functions, (f) => f.kind === "payload"),
    },
    laws: {
      byFamily: {
        alternatives: countOf(laws, (law) => law.family === "alternatives"),
        capacity: countOf(laws, (law) => law.family === "capacity"),
        mirror: countOf(laws, (law) => law.family === "mirror"),
        other: countOf(laws, (law) => law.family === "other"),
        selectedSource: countOf(laws, (law) => law.family === "selectedSource"),
      },
      constraintTriggers: countOf(laws, (law) => law.trigger),
      total: laws.length,
      validateFiles: laws.length,
    },
    policies: {
      alwaysTrue: countOf(pick("policy"), (policy) => policy.alwaysTrue),
      total: pick("policy").length,
    },
    seed: {
      admission: { inEveryVersion: 0, pairs: 0 },
      folders: pick("insert").length > 0 ? 1 : 0,
      inserts: pick("insert").length,
      rows: Object.fromEntries([...rows].toSorted(([a], [b]) => (a < b ? -1 : 1))),
    },
    tables: {
      byColumns: Object.fromEntries([...byColumns].toSorted(([a], [b]) => a - b)),
      declaredMarkers: countOf(tables, (table) => table.name.startsWith("declared_")),
      lexicalOrSpelling: countOf(
        tables,
        (table) => table.name.endsWith("lexical") || table.name.endsWith("spelling"),
      ),
      optionalValues: countOf(
        tables,
        (table) => table.columns.length === 2 && table.columns.includes("value"),
      ),
      total: tables.length,
    },
    uniques: {
      // A superkey is a key that holds a shorter key of its table: the definition, read off the
      // generated keys rather than the printed constraints.
      superkeys: tables.reduce(
        (sum, table) =>
          sum +
          countOf(table.keys, (key) =>
            table.keys.some(
              (other) => other.length < key.length && other.every((column) => key.includes(column)),
            ),
          ),
        0,
      ),
      total: tables.reduce((sum, table) => sum + table.keys.length, 0),
    },
    views: pick("view").length,
  };
};

/**
 * The targets a generated migration meets, read from its statements rather than its census: a
 * second reading of each target, against which {@link metBy} is checked.
 *
 * @param statements - The migration's statements.
 * @returns The names of the targets it meets, in {@link targets}' order.
 */
const targetsOf = (statements: readonly Statement[]): readonly Target[] => {
  const definitions = statements.flatMap((statement) =>
    statement.form === "domain" ? [`${statement.definition};`] : [],
  );
  const meets: Readonly<Record<Target, boolean>> = {
    "no enum types": statements.every((statement) => statement.form !== "enum"),
    "no policies": statements.every((statement) => statement.form !== "policy"),
    "no seeded tables, seed rows or INSERT INTO": statements.every(
      (statement) => statement.form !== "insert",
    ),
    "no two domains with one definition": new Set(definitions).size === definitions.length,
    // A law is written into a validate file, so a migration holds one exactly when it holds a law.
    "no validate files, law functions or constraint triggers": statements.every(
      (statement) =>
        statement.form !== "law" && !(statement.form === "function" && statement.kind === "law"),
    ),
  };

  return targetNames.filter((name) => meets[name]);
};

/**
 * A migration file creating a roster's names constant.
 */
const created = (name: string): MigrationFile => ({
  file: "02-structure.sql",
  folder: "20260101000000_init",
  sql: `CREATE FUNCTION "qti"."${name}__names"() RETURNS "pg_catalog"."name"[] LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN '{a}'::name[];\n`,
});

/**
 * A later migration's file dropping that constant.
 */
const dropped = (name: string): MigrationFile => ({
  file: "06-publish.sql",
  folder: "20260101000001_later",
  sql: `DROP FUNCTION "qti"."${name}__names"() RESTRICT;\n`,
});

describe("census", () => {
  it.effect("reports for every generated migration the counts of the statements it holds", (ctx) =>
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(10),
          concurrency: 1,
          coverage: required<Statement["form"]>(
            [
              "enum",
              "domain",
              "table",
              "foreignKey",
              "function",
              "law",
              "policy",
              "view",
              "insert",
            ],
            { cases: 300, sense: notesOnly },
          ),
          draw: drawn(array(statementOf, { max: 12, min: 0 })),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "second-implementation",
            name: "the statements' own counts (modelOf), and each target read off the statements (targetsOf)",
          },
          runs: 300,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/test/census",
        },
        (statements, c) =>
          Effect.sync(() => {
            c.noteAll(statements.map((statement) => statement.form));
            assert.deepStrictEqual(census(filesOf(statements)), modelOf(statements));
            assert.deepStrictEqual(
              metBy(census(filesOf(statements))),
              targetsOf(statements),
              "each census target holds exactly when the statements hold none of what it bars",
            );
          }),
      ),
    ),
  );

  it("counts a function a later migration drops no more", () => {
    assert.strictEqual(census([created("a"), created("b"), dropped("a")]).functions.names, 1);
  });
});
