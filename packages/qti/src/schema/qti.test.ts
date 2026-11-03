import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inventory } from "#qti/schema/content/xsd-inventory.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as xi from "#qti/schema/kinds/xi.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Ancestry, Node, NodeKind } from "#qti/schema/node.ts";
import { Qti, nodeArms } from "#qti/schema/qti.ts";
import { Author, seededNames } from "#qti/schema/roles.ts";
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
 * The single-row statements of one table, one per printed tuple, whichever batch holds it.
 */
const rowsOf = (lines: readonly string[], table: string): readonly string[] =>
  linesOf(lines, table).flatMap((line) => {
    const at = line.indexOf(" VALUES ") + " VALUES ".length;

    return line
      .slice(at + 1, -2)
      .split("), (")
      .map((tuple) => `${line.slice(0, at)}(${tuple});`);
  });

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

/**
 * The `mirrors` laws that state a `Node` selection's identity as an arm's, one per `NodeKind`
 * handle, as `[handle, arm]` pairs in statement order.
 */
const nodeArmLaws = (): [string, unknown][] =>
  Qti.statements.flatMap((statement) => {
    if (statement.kind !== "mirrors") {
      return [];
    }

    const { left, right } = statement;
    const source: unknown = left.source;
    if (
      !Predicate.hasProperty(source, "relation") ||
      source.relation !== Node ||
      !Predicate.hasProperty(source, "bindings") ||
      !Predicate.hasProperty(source.bindings, "kind") ||
      !Predicate.isString(source.bindings.kind) ||
      left.fields.length !== 1 ||
      left.fields[0] !== "id" ||
      right.fields.length !== 1 ||
      right.fields[0] !== "id"
    ) {
      return [];
    }

    return [[source.bindings.kind, right.source]];
  });

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

  it("states one mirrors law from each NodeKind handle's Node selection into its arm", () => {
    const laws = nodeArmLaws();
    assert.deepStrictEqual(laws.map(([handle]) => handle).toSorted(), NodeKind.handles.toSorted());
    assert.strictEqual(laws.length, NodeKind.handles.length);
  });

  it("gives each Node arm one NodeKind handle", () => {
    const handlesByArm = new Map<unknown, string[]>();
    for (const [handle, arm] of nodeArmLaws()) {
      handlesByArm.set(arm, [...(handlesByArm.get(arm) ?? []), handle]);
    }

    assert.deepStrictEqual(
      [...handlesByArm.values()].filter((handles) => handles.length > 1),
      [],
    );
    assert.strictEqual(handlesByArm.size, NodeKind.handles.length);

    const armOfHandle = new Map<string, unknown>(Object.entries(nodeArms));
    for (const [handle, arm] of nodeArmLaws()) {
      assert.strictEqual(arm, armOfHandle.get(handle));
    }
  });

  it("binds Node.kind to NodeKind and states no Node alternatives", () => {
    const bindings = Qti.statements.filter((statement) => {
      if (statement.kind !== "contained") {
        return false;
      }

      const { left, right } = statement;
      const from: unknown = left.source;
      const into: unknown = right.source;

      return (
        from === Node &&
        left.fields.length === 1 &&
        left.fields[0] === "kind" &&
        into === NodeKind &&
        right.fields.length === 1 &&
        right.fields[0] === "id"
      );
    });
    assert.strictEqual(bindings.length, 1);
    assert.deepStrictEqual(
      Qti.statements.filter((statement) => {
        const parent: unknown = statement.kind === "alternatives" ? statement.parent : undefined;

        return parent === Node;
      }),
      [],
    );
  });

  it("composes the Admission rows of p, div, qti-item-body and qti-modal-feedback per host", () => {
    for (const host of ["p", "div", "qti-item-body", "qti-modal-feedback"]) {
      for (const version of ["3.0.0", "3.0.1"]) {
        const included = xi.admission
          .filter((row) => row.parent === host && row.version === version)
          .map((row) => row.child);
        const expected = [...modelOf(host), ...included].toSorted();
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
    assert.includeMembers(names, [...seededNames]);
    assert.strictEqual(seeded.size, seededNames.length);

    const writable = names.filter((name) => !seeded.has(name)).toSorted();
    assert.deepStrictEqual([...Author.write].toSorted(), writable);
  });

  it("prints one table per seeded relation and as many seed tuples as each seed module has rows", () => {
    const sql = execFileSync("node", ["scripts/seed-sql.ts"], {
      encoding: "utf-8",
      maxBuffer: SEED_BUFFER,
    });
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

  it("prints as many tuples as each of the four content seed tables has rows, 1,000 to a statement, and only the named ones", () => {
    const lines = printed([
      "--only",
      "AttributeAdmission,AncestryStep,MappableBaseType,RecordBindingFit",
    ]);
    const expected = [
      ["attribute_admission", attributeAdmission.length],
      ["ancestry_step", ancestryStep.length],
      ["mappable_base_type", 9],
      ["record_binding_fit", 2],
    ] as const;
    assert.strictEqual(mappableBaseType.length, 9);
    assert.strictEqual(recordBindingFit.length, 2);
    for (const [table, rows] of expected) {
      const statements = linesOf(lines, table);
      assert.strictEqual(rowsOf(lines, table).length, rows);
      assert.strictEqual(statements.length, Math.ceil(rows / 1000));
      for (const statement of statements) {
        assert.isAtMost(tuples(statement, table), 1000);
      }
    }
    assert.strictEqual(linesOf(lines, "admission").length, 0);
    assert.strictEqual(
      lines.length,
      expected.reduce((total, [, rows]) => total + Math.ceil(rows / 1000), 0),
    );
  });

  it("omits the rows of a subtracted file, whether it holds them batched or one to a statement", () => {
    const all = rowsOf(printed(["--only", "Admission"]), "admission");
    assert.strictEqual(all.length, admission.length);

    const ten = all.slice(0, 10);
    const file = nodePath.join(scratch, "batched.sql");
    writeFileSync(file, `-- a comment\n${batched(ten)}\n`);

    const single = nodePath.join(scratch, "single.sql");
    writeFileSync(single, `${ten.join("\n")}\n`);

    for (const target of [file, single]) {
      const rest = rowsOf(printed(["--only", "Admission", "--minus", target]), "admission");
      assert.strictEqual(rest.length, admission.length - 10);
      assert.deepStrictEqual(rest, all.slice(10));
    }
  });

  it("subtracts every 01-seed.sql beneath a directory, and every repeated path", () => {
    const all = rowsOf(printed(["--only", "Admission"]), "admission");
    const folder = nodePath.join(scratch, "tree", "20260101000000_seed");
    mkdirSync(folder, { recursive: true });
    writeFileSync(nodePath.join(folder, "01-seed.sql"), `${batched(all.slice(0, 3))}\n`);
    writeFileSync(nodePath.join(folder, "02-other.sql"), `${batched(all.slice(3, 6))}\n`);

    const second = nodePath.join(scratch, "second.sql");
    writeFileSync(second, `${batched(all.slice(6, 8))}\n`);

    const rest = rowsOf(
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
