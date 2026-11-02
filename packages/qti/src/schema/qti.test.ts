import { execFileSync } from "node:child_process";
import { assert, describe, it } from "@effect/vitest";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Node, NodeKind } from "#qti/schema/node.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Author, seededNames } from "#qti/schema/roles.ts";
import { admission } from "#qti/schema/seed/admission.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";

/**
 * The relations the migration seeds, which no role writes: the list is `roles.ts`'s.
 */
const seeded: ReadonlySet<string> = new Set(seededNames);

/**
 * The composed schema's relations, rosters aside: those that declare fields.
 */
const stored = () =>
  Object.entries(Qti.relations).flatMap(([name, member]) =>
    "fields" in member ? [[name, member] as const] : [],
  );

/**
 * The tuples one table's INSERT statements hold, counted from the printed SQL.
 */
const tuples = (sql: string, table: string): number => {
  const prefix = `INSERT INTO "qti"."${table}" `;

  return sql
    .split("\n")
    .filter((line) => line.startsWith(prefix))
    .reduce((total, line) => total + line.split("), (").length, 0);
};

describe("qti", () => {
  it("builds the composed schema, the author role and the author login", () => {
    assert.strictEqual(Qti.name, "Qti");
    assert.strictEqual(Author.name, "author");
    assert.strictEqual(AuthorApp.name, "author_app");
    assert.deepStrictEqual(
      AuthorApp.roles.author === undefined ? [] : Object.keys(AuthorApp.roles),
      ["author"],
    );
  });

  it("reports the relation and field counts", () => {
    const relations = stored();
    const fields = relations.reduce(
      (sum, [, member]) => sum + Object.keys(member.fields).length,
      0,
    );
    process.stdout.write(`Qti: ${relations.length} relations, ${fields} fields\n`);
    assert.isAbove(relations.length, 0);
  });

  it("gives every NodeKind handle an arm in the Node alternatives statement", () => {
    const [rule, ...rest] = Qti.statements.filter(
      (statement) => statement.kind === "alternatives" && statement.parent === Node,
    );
    assert.strictEqual(rest.length, 0);
    if (rule?.kind !== "alternatives") {
      assert.fail("no Node alternatives statement");
    }

    assert.strictEqual(rule.roster, NodeKind);

    const arms = Object.keys(rule.arms);
    assert.deepStrictEqual(
      NodeKind.handles.filter((handle) => !arms.includes(handle)),
      [],
    );
    assert.deepStrictEqual(
      arms.filter((arm) => !NodeKind.handles.some((handle) => handle === arm)),
      [],
    );
  });

  it("gives Author every stored relation and writes all but the seeded ones", () => {
    const names = stored().map(([name]) => name);
    for (const name of names) {
      assert.include(Object.keys(Author.relations), name);
    }
    assert.includeMembers(names, [...seededNames]);
    assert.strictEqual(seeded.size, seededNames.length);

    const writable = names.filter((name) => !seeded.has(name)).toSorted();
    assert.deepStrictEqual([...Author.write].toSorted(), writable);
  });

  it("prints one table per seeded relation and as many seed tuples as each seed module has rows", () => {
    const sql = execFileSync("node", ["scripts/seed-sql.ts"], { encoding: "utf-8" });
    const [header = ""] = sql.split("\n", 1);
    assert.strictEqual(
      header.slice(header.indexOf("; ") + 2).split(", ").length,
      seededNames.length,
    );
    assert.strictEqual(tuples(sql, "admission"), admission.length);
    assert.strictEqual(tuples(sql, "binding_fit"), bindingFit.length);
    assert.strictEqual(tuples(sql, "resource_type_of"), resourceTypes.length);
    assert.strictEqual(tuples(sql, "root_of_type"), rootOfType.length);
    assert.strictEqual(tuples(sql, "operator_arity"), operatorArity.length);
    assert.strictEqual(tuples(sql, "operator_arity_max"), operatorArityMax.length);
  });

  it("keeps each arity seed distinct by kind and over NodeKind handles", () => {
    for (const kinds of [
      operatorArity.map((row) => row.kind),
      operatorArityMax.map((row) => row.kind),
    ]) {
      assert.strictEqual(new Set(kinds).size, kinds.length);
      assert.includeMembers([...NodeKind.handles], kinds);
    }
  });
});
