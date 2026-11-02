import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inventory } from "#qti/schema/content/xsd-inventory.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as html from "#qti/schema/kinds/html.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Ancestry, Node, NodeKind } from "#qti/schema/node.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Author } from "#qti/schema/roles.ts";
import {
  admission,
  ancestryStep,
  attributeAdmission,
  registries,
} from "#qti/schema/seed/admission.ts";
import { KindEnters, reachable } from "#qti/schema/seed/ancestry.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import { mappableBaseType } from "#qti/schema/seed/mappable-base-type.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import { recordBindingFit } from "#qti/schema/seed/record-binding-fit.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";

/**
 * The relations the migration seeds, which no role writes.
 */
const seeded = new Set([
  "Admission",
  "AncestryStep",
  "AttributeAdmission",
  "BindingFit",
  "MappableBaseType",
  "OperatorArity",
  "OperatorArityMax",
  "RecordBindingFit",
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

/**
 * The most the printed seed may hold: the default 1 MB buffer is smaller than the seed.
 */
const SEED_BUFFER = 256 * 1024 * 1024;

/**
 * The INSERT lines `scripts/seed-sql.ts` prints for the arguments, with the lines of one table.
 */
const printed = (args: readonly string[]): readonly string[] =>
  execFileSync("node", ["scripts/seed-sql.ts", ...args], {
    encoding: "utf-8",
    maxBuffer: SEED_BUFFER,
  })
    .split("\n")
    .filter((line) => line.startsWith("INSERT INTO "));

const linesOf = (lines: readonly string[], table: string): readonly string[] =>
  lines.filter((line) => line.startsWith(`INSERT INTO "qti"."${table}" `));

/**
 * One statement holding every row of the given single-row statements of one table, in the batched
 * form `p1-46` prints.
 */
const batched = (rows: readonly string[]): string => {
  const [head = ""] = (rows[0] ?? "").split(" VALUES ");
  const values = rows.map((row) => row.slice(row.indexOf(" VALUES ") + 8, -1));

  return `${head} VALUES ${values.join(", ")};`;
};

/**
 * Whether the attribute admission holds the pair.
 */
const has = (kind: string, attribute: string): boolean =>
  attributeAdmission.some((row) => row.kind === kind && row.attribute === attribute);

/**
 * The kinds the ancestry steps seed at one ancestry.
 */
const kindsAt = (ancestry: string): ReadonlySet<string> =>
  new Set(ancestryStep.filter((row) => row.ancestry === ancestry).map((row) => row.kind));

const scratch = mkdtempSync(nodePath.join(process.cwd(), "work", "seed-minus-"));

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

/**
 * The children a host's content model names, as inventory handles, and the content kinds around
 * them: text and entityRef for a mixed host, ws for a host with children, comment and pi for all.
 */
const modelOf = (host: string): ReadonlySet<string> => {
  const entry = inventory[host];
  if (entry === undefined) {
    assert.fail(`no inventory entry for ${host}`);
  }

  const named = entry.children
    .map((child) =>
      host === "qti-modal-feedback" && child.name === "qti-content-body"
        ? "qti-content-body.modal"
        : child.name,
    )
    .filter((name) => Object.hasOwn(inventory, name));

  return new Set([
    ...named,
    ...(entry.mixed ? ["text", "entityRef"] : []),
    ...(entry.mixed || named.length > 0 ? ["ws"] : []),
    "comment",
    "pi",
  ]);
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

  it("gives each Node arm one NodeKind handle", () => {
    const rule = Qti.statements.find(
      (statement) => statement.kind === "alternatives" && statement.parent === Node,
    );
    if (rule?.kind !== "alternatives") {
      assert.fail("no Node alternatives statement");
    }

    const handlesByArm = new Map<object, string[]>();
    for (const [handle, member] of Object.entries(rule.arms)) {
      if (!Predicate.isObject(member)) {
        assert.fail(`the arm of ${handle} is not a relation`);
      }

      handlesByArm.set(member, [...(handlesByArm.get(member) ?? []), handle]);
    }

    assert.deepStrictEqual(
      [...handlesByArm.values()].filter((handles) => handles.length > 1),
      [],
    );
    assert.strictEqual(handlesByArm.size, NodeKind.handles.length);
  });

  it("composes the Admission rows of p, div, qti-item-body and qti-modal-feedback per host", () => {
    for (const host of ["p", "div", "qti-item-body", "qti-modal-feedback"]) {
      const expected = [...modelOf(host)].toSorted();
      for (const version of ["3.0.0", "3.0.1"]) {
        const rows = admission
          .filter((row) => row.parent === host && row.version === version)
          .map((row) => row.child)
          .toSorted();
        assert.deepStrictEqual(rows, expected, `${version}: ${host}`);
      }
    }
  });

  it("closes the Ancestry roster over the composed admission rows and KindEnters", () => {
    const closure = reachable(admission, KindEnters).map((flags) =>
      flags.length === 0 ? "root" : flags.join("."),
    );
    assert.deepStrictEqual([...closure].toSorted(), [...Ancestry.handles].toSorted());
  });

  it("steps every NodeKind handle, and only those, in the ancestry steps", () => {
    assert.deepStrictEqual(
      [...new Set(ancestryStep.map((row) => row.kind))].toSorted(),
      [...NodeKind.handles].toSorted(),
    );
  });

  it("seeds each handle's attribute admission from its registry row", () => {
    const registry = new Map(registries.flatMap((entries) => Object.entries(entries)));
    for (const handle of NodeKind.handles) {
      const admitted = attributeAdmission
        .filter((row) => row.kind === handle)
        .map((row) => row.attribute)
        .toSorted();
      const declared = [...new Set(registry.get(handle)?.attributes)].toSorted();
      assert.deepStrictEqual(admitted, declared, handle);
    }
  });

  it("gives the inventory an entry for every ASI and HTML kind and names only NodeKind handles", () => {
    for (const handle of [...asi.kinds, ...html.kinds]) {
      assert.isTrue(Object.hasOwn(inventory, handle), `inventory lacks ${handle}`);
    }

    assert.deepStrictEqual(
      Object.keys(inventory).filter((handle) => !NodeKind.handles.some((kind) => kind === handle)),
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
    const sql = execFileSync("node", ["scripts/seed-sql.ts"], {
      encoding: "utf-8",
      maxBuffer: SEED_BUFFER,
    });
    assert.strictEqual(tuples(sql, "admission"), admission.length);
    assert.strictEqual(tuples(sql, "binding_fit"), bindingFit.length);
    assert.strictEqual(tuples(sql, "resource_type_of"), resourceTypes.length);
    assert.strictEqual(tuples(sql, "root_of_type"), rootOfType.length);
    assert.strictEqual(tuples(sql, "operator_arity"), operatorArity.length);
    assert.strictEqual(tuples(sql, "operator_arity_max"), operatorArityMax.length);
    assert.strictEqual(operatorArity.length, 0);
    assert.strictEqual(operatorArityMax.length, 0);
  });

  it("prints one INSERT line per row of the four content seed tables, and only the named ones", () => {
    const lines = printed([
      "--only",
      "AttributeAdmission,AncestryStep,MappableBaseType,RecordBindingFit",
    ]);
    assert.strictEqual(linesOf(lines, "attribute_admission").length, attributeAdmission.length);
    assert.strictEqual(linesOf(lines, "ancestry_step").length, ancestryStep.length);
    assert.strictEqual(linesOf(lines, "mappable_base_type").length, 9);
    assert.strictEqual(mappableBaseType.length, 9);
    assert.strictEqual(linesOf(lines, "record_binding_fit").length, 2);
    assert.strictEqual(recordBindingFit.length, 2);
    assert.strictEqual(linesOf(lines, "admission").length, 0);
    assert.strictEqual(lines.length, attributeAdmission.length + ancestryStep.length + 11);
  });

  it("omits the rows of a subtracted file, whether it holds them batched or one to a statement", () => {
    const all = linesOf(printed(["--only", "Admission"]), "admission");
    assert.strictEqual(all.length, admission.length);

    const ten = all.slice(0, 10);
    const file = nodePath.join(scratch, "batched.sql");
    writeFileSync(file, `-- a comment\n${batched(ten)}\n`);

    const single = nodePath.join(scratch, "single.sql");
    writeFileSync(single, `${ten.join("\n")}\n`);

    for (const target of [file, single]) {
      const rest = linesOf(printed(["--only", "Admission", "--minus", target]), "admission");
      assert.strictEqual(rest.length, admission.length - 10);
      assert.deepStrictEqual(rest, all.slice(10));
    }
  });

  it("subtracts every 01-seed.sql beneath a directory, and every repeated path", () => {
    const all = linesOf(printed(["--only", "Admission"]), "admission");
    const folder = nodePath.join(scratch, "tree", "20260101000000_seed");
    mkdirSync(folder, { recursive: true });
    writeFileSync(nodePath.join(folder, "01-seed.sql"), `${batched(all.slice(0, 3))}\n`);
    writeFileSync(nodePath.join(folder, "02-other.sql"), `${batched(all.slice(3, 6))}\n`);

    const second = nodePath.join(scratch, "second.sql");
    writeFileSync(second, `${batched(all.slice(6, 8))}\n`);

    const rest = linesOf(
      printed([
        "--only",
        "Admission",
        "--minus",
        nodePath.join(scratch, "tree"),
        "--minus",
        second,
      ]),
      "admission",
    );
    assert.deepStrictEqual(rest, [...all.slice(3, 6), ...all.slice(8)]);
  });

  it("seeds the attribute admission and the ancestry steps from the composed registries", () => {
    assert.isTrue(has("lom:string", "xml:lang"));
    assert.isTrue(has("qti-assessment-item", "label"));
    assert.isFalse(has("p", "shuffle"));

    // Every handle sits at some ancestry; at `root` all but the eight kinds that occur only inside
    // an interaction: `qti-gap` is banned there and the rest would step to a `choice` ancestry
    // that holds no `int`, which `ancestryStepRows` leaves without a row.
    const anywhere = new Set(ancestryStep.map((row) => row.kind));
    assert.deepStrictEqual(
      NodeKind.handles.filter((handle) => !anywhere.has(handle)),
      [],
    );
    assert.deepStrictEqual(
      NodeKind.handles.filter((handle) => !kindsAt("root").has(handle)),
      [
        "qti-prompt",
        "qti-simple-choice",
        "qti-gap",
        "qti-gap-img",
        "qti-gap-text",
        "qti-inline-choice",
        "qti-label",
        "qti-simple-associable-choice",
      ],
    );
  });
});
