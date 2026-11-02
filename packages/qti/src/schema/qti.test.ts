import { execFileSync } from "node:child_process";
import { assert, describe, it } from "@effect/vitest";
import { inventory } from "#qti/schema/content/xsd-inventory.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Node, NodeKind } from "#qti/schema/node.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Author } from "#qti/schema/roles.ts";
import { admission } from "#qti/schema/seed/admission.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";

/**
 * The relations the migration seeds, which no role writes.
 */
const seeded = new Set([
  "Admission",
  "BindingFit",
  "OperatorArity",
  "OperatorArityMax",
  "ResourceTypeOf",
  "RootOfType",
]);

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

  // Until the content phase's final slice gives the inventory's handles their arms, the check
  // exempts them; it then returns to "every handle but `template` has an arm".
  it("gives every NodeKind handle outside the inventory an arm in the Node alternatives statement", () => {
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
      NodeKind.handles.filter(
        (handle) => !Object.hasOwn(inventory, handle) && !arms.includes(handle),
      ),
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
    const writable = names.filter((name) => !seeded.has(name)).toSorted();
    assert.deepStrictEqual([...Author.write].toSorted(), writable);
  });

  it("prints as many seed tuples as each seed module has rows", () => {
    const sql = execFileSync("node", ["scripts/seed-sql.ts"], { encoding: "utf-8" });
    assert.strictEqual(tuples(sql, "admission"), admission.length);
    assert.strictEqual(tuples(sql, "binding_fit"), bindingFit.length);
    assert.strictEqual(tuples(sql, "resource_type_of"), resourceTypes.length);
    assert.strictEqual(tuples(sql, "root_of_type"), rootOfType.length);
    assert.strictEqual(tuples(sql, "operator_arity"), operatorArity.length);
    assert.strictEqual(tuples(sql, "operator_arity_max"), operatorArityMax.length);
    assert.strictEqual(operatorArity.length, 0);
    assert.strictEqual(operatorArityMax.length, 0);
  });
});
