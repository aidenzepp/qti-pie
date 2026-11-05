import { NodeFileSystem } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { census, censusOf, qtiMigrations } from "#pantry/test/census.ts";
import type { Census, MigrationFile } from "#pantry/test/census.ts";

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
 * A small init migration in grizzle's printed form, with one statement of each form the census
 * reads: a bookkeeping table it skips, a superkey, a composite key, two domains of one definition,
 * the five function kinds, a narrowing policy beside an always-true one, and two validate files.
 */
const init: readonly MigrationFile[] = [
  {
    file: "01-setup.sql",
    folder: "20260101000000_init",
    sql: `CREATE TYPE "qti"."schema_version" AS ENUM ('3.0.0', '3.0.1');

CREATE DOMAIN "qti"."uri" AS text CONSTRAINT "a" CHECK (VALUE <> '');
CREATE DOMAIN "qti"."href" AS text CONSTRAINT "b" CHECK (VALUE <> '');
CREATE DOMAIN "qti"."digits" AS text CONSTRAINT "a" CHECK (VALUE ~ '[0-9]+');

CREATE OR REPLACE FUNCTION "qti"."__refuse"("state" "pg_catalog"."text") RETURNS boolean
LANGUAGE plpgsql AS $$ BEGIN RETURN true; END $$;

CREATE TABLE "qti"."__ledger" (
  "folder" text NOT NULL,
  CONSTRAINT "__ledger_pk" PRIMARY KEY ("folder")
);

CREATE FUNCTION "qti"."NodeKind__3f9c0a"() RETURNS bit varying LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN B'1110'::bit varying;
CREATE FUNCTION "qti"."node_kind__names__77d2e1"() RETURNS name[] LANGUAGE sql IMMUTABLE PARALLEL SAFE RETURN '{text,ws}'::name[];
CREATE FUNCTION "qti"."node_kind_name"(code int2) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE
  RETURN ("qti"."node_kind__names__77d2e1"())[code + 1]::text;
`,
  },
  {
    file: "02-structure.sql",
    folder: "20260101000000_init",
    sql: `CREATE TABLE "qti"."declared_value" (
  "node" uuid NOT NULL,
  CONSTRAINT "declared_value_pk" PRIMARY KEY ("node")
);

CREATE TABLE "qti"."title" (
  "node" uuid NOT NULL,
  "value" text NOT NULL,
  CONSTRAINT "title_pk" PRIMARY KEY ("node"),
  CONSTRAINT "title_key" UNIQUE ("node", "value")
);

ALTER TABLE "qti"."declared_value" ADD CONSTRAINT "declared_value_fk" FOREIGN KEY ("node") REFERENCES "qti"."title" ("node");
ALTER TABLE "qti"."title" ADD CONSTRAINT "title_fk" FOREIGN KEY ("node", "value") REFERENCES "qti"."title" ("node", "value");
`,
  },
  {
    file: "04-validate.sql",
    folder: "20260101000000_init",
    sql: `-- Validate law __title_kind_in_title_x1: its triggers.

CREATE OR REPLACE FUNCTION "qti"."__law_title_kind_in_title_f1"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;

CREATE CONSTRAINT TRIGGER "__law_title_kind_in_title_t1"
  AFTER INSERT ON "qti"."title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_title_kind_in_title_f1"();
`,
  },
  {
    file: "05-validate.sql",
    folder: "20260101000000_init",
    sql: "-- Validate law __title_alternatives_node_x2: its triggers.\n",
  },
  {
    file: "06-publish.sql",
    folder: "20260101000000_init",
    sql: `CREATE VIEW "qti__author"."title" AS SELECT "node", "value" FROM "qti"."title";

CREATE POLICY "qti__author" ON "qti"."title" AS PERMISSIVE FOR ALL TO "qti__author"
  USING (true)
  WITH CHECK (true);

CREATE POLICY "qti__reader" ON "qti"."title" AS PERMISSIVE FOR SELECT TO "qti__reader"
  USING ("value" <> '');
`,
  },
];

/**
 * A seed migration whose rows hold parentheses inside string literals, a doubled quote among
 * them, and `admission` rows in two versions.
 */
const seed: MigrationFile = {
  file: "01-seed.sql",
  folder: "20260101000001_seed",
  sql: `-- generated: admission 3, note 2
INSERT INTO "qti"."admission" ("version", "parent", "child") VALUES ('3.0.0'::"qti"."schema_version", 'a'::"qti"."node_kind", 'b'::"qti"."node_kind"), ('3.0.1'::"qti"."schema_version", 'a'::"qti"."node_kind", 'b'::"qti"."node_kind"), ('3.0.1'::"qti"."schema_version", 'a'::"qti"."node_kind", 'c'::"qti"."node_kind");
INSERT INTO "qti"."note" ("text") VALUES ('a), (b'), ('it''s (open');
`,
};

describe("census", () => {
  it("counts each statement form it reads", () => {
    assert.deepStrictEqual(census([...init, seed]), {
      domains: { distinct: 2, repeatedBytes: 26, total: 3 },
      enums: 1,
      foreignKeys: { composite: 1, total: 2, widest: 2 },
      functions: { constant: 1, decode: 1, law: 1, names: 1, other: 1 },
      laws: {
        byFamily: { alternatives: 1, capacity: 0, mirror: 0, other: 0, selectedSource: 1 },
        constraintTriggers: 1,
        total: 2,
        validateFiles: 2,
      },
      policies: { alwaysTrue: 1, total: 2 },
      seed: {
        admission: { inEveryVersion: 1, pairs: 2 },
        folders: 1,
        inserts: 2,
        rows: { admission: 3, note: 2 },
      },
      tables: {
        byColumns: { 1: 1, 2: 1 },
        declaredMarkers: 1,
        lexicalOrSpelling: 0,
        optionalValues: 1,
        total: 2,
      },
      uniques: { superkeys: 1, total: 3 },
      views: 1,
    });
  });
});

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
