import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { changeSetOf } from "#qti/import/package.ts";
import type { Rows } from "#qti/import/tree.ts";
import * as csmd from "#qti/schema/kinds/csmd.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import { AuthorApp, authorWork } from "#qti/schema/logins.ts";
import { AttributeName, NodeKind } from "#qti/schema/node.ts";
import { Qti, nodeArms } from "#qti/schema/qti.ts";
import { Author, seededNames } from "#qti/schema/roles.ts";
import { admission } from "#qti/schema/seed/admission.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import * as csm from "#qti/schema/csm.ts";
import * as usage from "#qti/schema/usage.ts";

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
 * Every `01-seed.sql` of a migration folder other than this phase's `seed_packaging`.
 */
const earlierSeeds = (): string[] =>
  readdirSync(migrations, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.endsWith("_seed_packaging"))
    .map((entry) => path.join(migrations, entry.name, "01-seed.sql"))
    .filter((file) => existsSync(file));

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

/**
 * The recipe's output: the seed rows of `Admission` and `RootOfType` the earlier folders do not
 * hold.
 */
const recipe = (): string =>
  execFileSync(
    process.execPath,
    [
      "scripts/seed-sql.ts",
      "--only",
      "Admission,RootOfType",
      ...earlierSeeds().flatMap((file) => ["--minus", file]),
    ],
    { encoding: "utf-8" },
  );

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

  it("prints this phase's seed rows from the recipe, as the committed seed_packaging file holds them", () => {
    const printed = recipe();
    const earlier = earlierSeeds()
      .map((file) => readFileSync(file, "utf-8"))
      .join("\n");
    const taken = new Set(tuplesOf(earlier, "admission"));
    const beyond = admission.length - tuplesOf(earlier, "admission").length;
    assert.isAbove(taken.size, 0);
    assert.strictEqual(tuplesOf(printed, "admission").length, beyond);
    assert.strictEqual(tuplesOf(printed, "root_of_type").length, 2);
    assert.strictEqual(tuplesOf(printed, "binding_fit").length, 0);

    const folder = readdirSync(migrations).find((name) => name.endsWith("_seed_packaging"));
    assert.isDefined(folder);

    const committed = readFileSync(path.join(migrations, folder ?? "", "01-seed.sql"), "utf-8");
    for (const table of ["admission", "root_of_type", "binding_fit"]) {
      assert.deepStrictEqual(
        tuplesOf(committed, table).toSorted(),
        tuplesOf(printed, table).toSorted(),
      );
    }
  });

  it("keeps the BindingFit rows as the seed module holds them", () => {
    assert.isAbove(bindingFit.length, 0);

    const earlier = earlierSeeds()
      .map((file) => readFileSync(file, "utf-8"))
      .join("\n");
    assert.strictEqual(tuplesOf(earlier, "binding_fit").length, bindingFit.length);
  });
});
