import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { changeSetOf } from "#pantry/import/package.ts";
import type { Rows } from "#pantry/import/tree.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import { AuthorApp, authorWork } from "#pantry/schema/logins.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import { Qti, nodeArms } from "#pantry/schema/qti.ts";
import { Author, seededNames } from "#pantry/schema/roles.ts";
import { bindingFit } from "#pantry/schema/seed/binding-fit.ts";
import * as csm from "#pantry/schema/csm.ts";
import * as usage from "#pantry/schema/usage.ts";
import { printSeed } from "#pantry/test/seed.ts";
import { seedPrintTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The part of a ChangeSet's description the test reads: each stratum's members by operation and
 * relation name.
 */
const Description = Schema.Struct({
  strata: Schema.Array(
    Schema.Struct({
      members: Schema.Array(Schema.Struct({ op: Schema.String, relation: Schema.String })),
    }),
  ),
});

const migrations = path.join(import.meta.dirname, "../../migrations/qti");

/**
 * The relations the migration seeds or a roster stands for, which no role writes.
 */
const seeded: ReadonlySet<string> = new Set(seededNames);

/**
 * The composed schema's stored relations, rosters aside: those that declare fields.
 */
const stored = () =>
  Object.entries(Qti.relations).flatMap(([name, member]) =>
    "fields" in member ? [[name, member] as const] : [],
  );

/**
 * The migration folder whose name ends `suffix`: the history holds exactly one.
 */
const folderEnding = (suffix: string): string => {
  const folders = readdirSync(migrations, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(suffix))
    .map((entry) => path.join(migrations, entry.name));
  assert.strictEqual(folders.length, 1);

  return folders[0] ?? "";
};

/**
 * The `01-seed.sql` of the one `seed` migration folder, which holds the seed rows of the first
 * history. The `seed_wildcard` folder is excluded by its name: `_seed` does not end
 * `_seed_wildcard`.
 */
const committedSeed = (): string =>
  readFileSync(path.join(folderEnding("_seed"), "01-seed.sql"), "utf-8");

/**
 * The `01-seed.sql` of every migration folder whose name ends `_seed` or `_seed_wildcard`, in
 * folder order.
 */
const seedFiles = (): string[] =>
  readdirSync(migrations, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        (entry.name.endsWith("_seed") || entry.name.endsWith("_seed_wildcard")),
    )
    .map((entry) => readFileSync(path.join(migrations, entry.name, "01-seed.sql"), "utf-8"));

/**
 * Every row an INSERT statement of the SQL holds, one string per row (the statement's head and the
 * row's tuple), so batching and comments do not matter.
 */
const insertRows = (sql: string): string[] =>
  sql
    .split("\n")
    .filter((line) => line.startsWith("INSERT INTO "))
    .flatMap((line) => {
      const values = line.indexOf(" VALUES (") + " VALUES (".length;

      return line
        .slice(values, -2)
        .split("), (")
        .map((tuple) => `${line.slice(0, values)}${tuple})`);
    });

/**
 * The tuples one table's INSERT statements hold, as strings.
 */
const tuplesOf = (sql: string, table: string): string[] => {
  const prefix = `INSERT INTO "qti"."${table}" `;

  return sql
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .flatMap((line) =>
      line.slice(line.indexOf(" VALUES (") + " VALUES (".length, -2).split("), ("),
    );
};

describe("qti packaging composition", () => {
  it("holds every csmd and ud handle in the rosters", () => {
    assert.deepStrictEqual(
      [...csmd.kinds, ...ud.kinds].filter((handle) => !NodeKind.handles.some((h) => h === handle)),
      [],
    );
    assert.deepStrictEqual(
      [...csmd.attributes, ...ud.attributes].filter(
        (name) => !AttributeName.handles.some((h) => h === name),
      ),
      [],
    );
  });

  it("composes every relation of csm.ts and usage.ts", () => {
    const composed = Object.keys(Qti.relations);
    assert.deepStrictEqual(
      [...Object.keys(csm.relations), ...Object.keys(usage.relations)].filter(
        (name) => !composed.includes(name),
      ),
      [],
    );
  });

  it("composes the statements and the Node arms of csm.ts and usage.ts", () => {
    for (const statement of [...csm.rules, ...usage.rules]) {
      assert.include(Qti.statements, statement);
    }

    const composed = new Map<string, unknown>(Object.entries(nodeArms));
    for (const [handle, arm] of [...Object.entries(csm.arms), ...Object.entries(usage.arms)]) {
      assert.strictEqual(composed.get(handle), arm);
    }
  });

  it("gives Author a write list covering every stored relation but the seeded ones", () => {
    const written = stored()
      .map(([name]) => name)
      .filter((name) => !seeded.has(name))
      .toSorted();
    assert.deepStrictEqual([...Author.write].toSorted(), written);

    const names = new Set(stored().map(([name]) => name));
    for (const name of [...Object.keys(csm.relations), ...Object.keys(usage.relations)]) {
      if (names.has(name)) {
        assert.include(Author.write, name);
      }
    }
  });

  it("declares the export workload alone, so the import call inserts every relation its rows hold", () => {
    assert.deepStrictEqual(AuthorApp.workload, [authorWork]);

    const written = stored().filter(([name]) => !seeded.has(name));
    const rows: Rows = new Map(written.map(([, relation]) => [relation, [{}]]));
    const changes = changeSetOf(rows);
    const described: unknown = "desc" in changes ? changes.desc : undefined;
    const { strata } = Schema.decodeUnknownSync(Description)(described);
    assert.deepStrictEqual(
      strata
        .flatMap((stratum) => stratum.members)
        .filter((member) => member.op === "insert")
        .map((member) => member.relation)
        .toSorted(),
      written.map(([, relation]) => relation.name).toSorted(),
    );
  });

  it(
    "holds exactly the full seed the recipe prints, split between the seed folder and seed_wildcard",
    () => {
      const committed = seedFiles().flatMap(insertRows);

      assert.strictEqual(new Set(committed).size, committed.length);
      assert.deepStrictEqual(committed.toSorted(), insertRows(printSeed([])).toSorted());
    },
    seedPrintTestTimeoutMs,
  );

  it("keeps the BindingFit rows as the seed module holds them", () => {
    assert.isAbove(bindingFit.length, 0);
    assert.strictEqual(tuplesOf(committedSeed(), "binding_fit").length, bindingFit.length);
  });
});
