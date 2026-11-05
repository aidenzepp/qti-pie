import { NodeFileSystem } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, boolean, element, int, map, subarray } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { census, censusOf, qtiMigrations } from "#pantry/test/census.ts";
import type { Census, FunctionKind, LawFamily, MigrationFile } from "#pantry/test/census.ts";

/**
 * The census of the committed migrations, as grizzle `48256f8` generates them from the schema the
 * cutover starts from. It is a ratchet: a change that moves a count records the new one here.
 */
const committed: Census = {
  domains: { distinct: 56, repeatedBytes: 184_947, total: 176 },
  enums: 70,
  foreignKeys: { composite: 944, total: 1389, widest: 4 },
  functions: { constant: 0, decode: 0, law: 1168, names: 0, other: 3 },
  laws: {
    byFamily: { alternatives: 19, capacity: 74, mirror: 0, other: 9, selectedSource: 414 },
    constraintTriggers: 1168,
    total: 516,
    validateFiles: 516,
  },
  policies: { alwaysTrue: 847, total: 847 },
  seed: {
    admission: { inEveryVersion: 8830, pairs: 8831 },
    folders: 1,
    inserts: 52,
    rows: {
      admission: 17_661,
      ancestry_step: 18_924,
      attribute_admission: 6788,
      binding_fit: 40,
      mappable_base_type: 9,
      operator_arity: 64,
      operator_arity_max: 50,
      operator_arity_unbounded: 14,
      record_binding_fit: 2,
      resource_type_of: 39,
      root_of_type: 9,
    },
  },
  tables: {
    byColumns: { 1: 234, 2: 344, 3: 103, 4: 96, 5: 42, 6: 24, 7: 13, 8: 1, 9: 1 },
    declaredMarkers: 81,
    lexicalOrSpelling: 2,
    optionalValues: 214,
    total: 858,
  },
  uniques: { superkeys: 105, total: 1072 },
  views: 858,
};

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
    `CREATE FUNCTION "qti"."${name}__c"() RETURNS bit varying LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN B'10'::bit varying;`,
  decode: (name) =>
    `CREATE FUNCTION "qti"."${name}_name"(code int2) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE\n  RETURN 'x';`,
  law: (name) =>
    `CREATE OR REPLACE FUNCTION "qti"."__law_${name}"() RETURNS "pg_catalog"."trigger"\nLANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;`,
  names: (name) =>
    `CREATE FUNCTION "qti"."${name}__names"() RETURNS name[] LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN '{a}'::name[];`,
  other: (name) =>
    `CREATE OR REPLACE FUNCTION "qti"."${name}_refuse"("state" "pg_catalog"."text") RETURNS boolean\nLANGUAGE plpgsql AS $$ BEGIN RETURN true; END $$;`,
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
      const columns = [...inner.draw(subarray(["node", "value", "kind"])), "id"];

      return {
        columns,
        form: "foreignKey",
        sql: `ALTER TABLE "qti"."${name}" ADD CONSTRAINT "f_${name}" FOREIGN KEY (${quoted(columns)}) REFERENCES "qti"."other" (${quoted(columns)});`,
        table: name,
      };
    },
    (inner) => {
      const kind = inner.draw(element(["constant", "decode", "law", "names", "other"] as const));

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

describe("census of migrations/qti", () => {
  it.effect("holds the counts the cutover starts from", () =>
    Effect.gen(function* committedCensus() {
      assert.deepStrictEqual(
        yield* censusOf(qtiMigrations),
        committed,
        "The census of migrations/qti moved. If the change meant to move it, record the new counts in census.test.ts.",
      );
    }).pipe(Effect.provide(NodeFileSystem.layer)),
  );
});

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
      distinct: distinct.length,
      repeatedBytes:
        encoder.encode(definitions.join("")).length - encoder.encode(distinct.join("")).length,
      total: definitions.length,
    },
    enums: pick("enum").length,
    foreignKeys: {
      composite: countOf(keys, (width) => width > 1),
      total: keys.length,
      widest: Math.max(0, ...keys),
    },
    functions: {
      constant: countOf(functions, (f) => f.kind === "constant"),
      decode: countOf(functions, (f) => f.kind === "decode"),
      law: countOf(functions, (f) => f.kind === "law"),
      names: countOf(functions, (f) => f.kind === "names"),
      other: countOf(functions, (f) => f.kind === "other"),
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
          runs: 300,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/test/census",
        },
        (statements, c) =>
          Effect.sync(() => {
            c.noteAll(statements.map((statement) => statement.form));
            assert.deepStrictEqual(census(filesOf(statements)), modelOf(statements));
          }),
      ),
    ),
  );
});
