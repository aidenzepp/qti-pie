/**
 * The members of a package's counted and ordered families whose owner the same import writes no
 * row of.
 *
 * Each import is one ChangeSet, and every owner is immutable, so grizzle appends a family's member
 * only to an owner the ChangeSet inserts: a member whose group key names no owner row is refused on
 * the host, before any statement reaches PostgreSQL ("an insert into X … appending to the owner Y
 * with key (…), which this stratum does not insert", grizzle-engine `write/family/edit.ts`), under
 * no rule of the schema. A row whose key a sentinel fills, such as a document node standing for "no
 * interaction", is how one arises (lane NIL's audit: Site, B5, B6). A package the schema must
 * refuse is refused by its law only where no member is such an orphan.
 */
import { Schema } from "effect";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import type { NodeMember, NodeRoot, PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A family statement as grizzle keeps it: its member relation and the terms of its group key, and
 * its owner, keyed by its primary key, which the group's terms name in order.
 */
const FamilySchema = Schema.Struct({
  family: Schema.Struct({
    source: Schema.Struct({ kind: Schema.String, name: Schema.String }),
    terms: Schema.Array(Schema.String),
  }),
  kind: Schema.Literals(["counted", "ordered"]),
  slots: Schema.Struct({
    owner: Schema.Struct({ name: Schema.String, primaryKey: Schema.Array(Schema.String) }),
  }),
});

/**
 * One family as the check reads it.
 */
interface FamilyAxis {
  readonly member: string;
  readonly owner: string;
  readonly ownerKey: readonly string[];
  readonly terms: readonly string[];
}

/**
 * The schema's counted and ordered families, each over a whole member relation: a family whose
 * member is a selection fails here, since its members are the selection's rows, which this module
 * does not evaluate.
 */
const familyAxes: readonly FamilyAxis[] = Qti.statements.flatMap((statement) => {
  const read = Schema.decodeUnknownOption(FamilySchema)(statement);
  if (read._tag === "None") {
    return [];
  }

  const { family, slots } = read.value;
  if (family.source.kind !== "relation") {
    throw new Error(
      `the family over ${family.source.name} has a ${family.source.kind} as its member, which family-owners.ts reads no rows of`,
    );
  }

  return [
    {
      member: family.source.name,
      owner: slots.owner.name,
      ownerKey: slots.owner.primaryKey,
      terms: family.terms,
    },
  ];
});

/**
 * A key field's value: a text or a closed handle, a natural, or a boolean.
 */
type KeyValue = bigint | boolean | string;

/**
 * The schema of a {@link KeyValue}.
 */
const KeyValueSchema = Schema.Union([Schema.String, Schema.BigInt, Schema.Boolean]);

/**
 * The key grizzle draws a tree's row under, beside its root's fields: its pre-order position
 * `start` and its parent's `start`, the root its own parent at 0.
 */
interface DrawnKey {
  readonly parent: bigint;
  readonly start: bigint;
}

/**
 * A tree's row as grizzle draws it: its own fields but the members it nests, its root's fields
 * `Root`, and its {@link DrawnKey}.
 */
type DrawnRow<Member, Root> = DrawnKey & Omit<Member, "children"> & Root;

/**
 * A tree's rows as grizzle draws them from the nesting its insert writes: each row with its root's
 * root fields, its pre-order position `start` and its parent's `start`, the root its own parent at
 * 0 (`Node (package, path, start)`, `Instance (package, assembly, start)`).
 *
 * @param root - The root row, its members nested under each row's `children`.
 * @param rootFields - The tree's root fields, which the root names and every member copies.
 * @returns The tree's rows in pre-order.
 */
const drawnTree = <Member extends { readonly children: readonly Member[] }, Root>(
  root: Member & Root,
  rootFields: Root,
): readonly DrawnRow<Member, Root>[] => {
  const rows: DrawnRow<Member, Root>[] = [];
  const stack: { readonly node: Member; readonly parent: bigint }[] = [{ node: root, parent: 0n }];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const start = BigInt(rows.length);
    const { children, ...fields } = next.node;
    rows.push({ ...fields, ...rootFields, parent: next.parent, start });
    stack.push(...children.toReversed().map((node) => ({ node, parent: start })));
  }

  return rows;
};

/**
 * Every row of an import's inputs by relation, each tree's nested members flattened in with the key
 * grizzle draws: `Node`'s nodes under `(package, path)` and `Instance`'s instances under
 * `(package, assembly)`, which their inserts carry under each row's `children`; every other
 * relation's rows as its keyed set holds them (`packageFactsOf`).
 *
 * @param inputs - The import's inputs.
 * @returns The rows of each relation.
 */
export const rowsByRelation = (inputs: PackageInputs) => ({
  ...packageFactsOf(inputs),
  Instance: [...inputs.Instance.values()].flatMap((root: InstanceRoot) =>
    drawnTree<InstanceMember, Pick<InstanceRoot, "assembly" | "package">>(root, {
      assembly: root.assembly,
      package: root.package,
    }),
  ),
  Node: [...inputs.Node.values()].flatMap((root: NodeRoot) =>
    drawnTree<NodeMember, Pick<NodeRoot, "package" | "path">>(root, {
      package: root.package,
      path: root.path,
    }),
  ),
});

/**
 * The rows of each relation of an import's inputs as grizzle holds them ({@link rowsByRelation}).
 */
type DrawnInputs = ReturnType<typeof rowsByRelation>;

/**
 * A row of one of the import's inputs: a flat input's as its builder writes it, or a tree's row
 * with the key grizzle draws it under ({@link DrawnRow}).
 */
export type InputRow = DrawnInputs[keyof DrawnInputs][number];

/**
 * Read the text of a row's values at some fields, each a key field's.
 *
 * @param fields - The fields.
 * @returns A reader of a row's text, which fails where the row lacks a field.
 */
const keyTextOf = (fields: readonly string[]) => {
  const decode = Schema.decodeUnknownSync(
    Schema.Struct(Object.fromEntries(fields.map((field) => [field, KeyValueSchema]))),
  );

  return (row: InputRow): string => {
    const read: Readonly<Record<string, KeyValue>> = decode(row);

    return JSON.stringify(fields.map((field) => String(read[field])));
  };
};

/**
 * One member whose group key names no owner row.
 */
interface Orphan {
  readonly key: string;
  readonly member: string;
  readonly owner: string;
}

/**
 * Find every family member of an import's inputs whose group key names no owner row of the same
 * inputs.
 *
 * @param inputs - The import's inputs (`readProgram`'s `inputs`).
 * @returns The orphans, none where every member has its owner.
 */
export const orphansOf = (inputs: PackageInputs): readonly Orphan[] => {
  const byName = new Map<string, readonly InputRow[]>(Object.entries(rowsByRelation(inputs)));

  return familyAxes.flatMap(({ member, owner, ownerKey, terms }) => {
    const ownerText = keyTextOf(ownerKey);
    const memberText = keyTextOf(terms);
    const owners = new Set((byName.get(owner) ?? []).map(ownerText));

    return (byName.get(member) ?? []).flatMap((row) => {
      const key = memberText(row);

      return owners.has(key) ? [] : [{ key, member, owner }];
    });
  });
};
