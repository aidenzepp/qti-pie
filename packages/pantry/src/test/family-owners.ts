/**
 * The members of a package's counted and ordered families whose owner the same import writes no
 * row of.
 *
 * Each import is one ChangeSet, and every owner is immutable, so grizzle appends a family's member
 * only to an owner the ChangeSet inserts: a member whose group key names no owner row is refused on
 * the host, before any statement reaches PostgreSQL ("an insert into X … appending to the owner Y
 * with key (…), which this stratum does not insert", grizzle-engine `write/family/edit.ts`), under
 * no rule of the schema. A row whose key a sentinel fills, such as a nil uuid or a document node
 * standing for "no interaction", is how one arises (lane NIL's audit: Site, B5, B6). A package the
 * schema must refuse is refused by its law only where no member is such an orphan.
 */
import { Schema } from "effect";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import type { NodeMember, PackageInputs } from "#pantry/import/write.ts";
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
export interface FamilyAxis {
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
export const familyAxes: readonly FamilyAxis[] = Qti.statements.flatMap((statement) => {
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
 * A key field's value: a uuid, a text or a closed handle, a natural, or a boolean.
 */
type KeyValue = bigint | boolean | string;

/**
 * The schema of a {@link KeyValue}.
 */
const KeyValueSchema = Schema.Union([Schema.String, Schema.BigInt, Schema.Boolean]);

/**
 * The import's inputs written flat, one keyed set of rows per relation: every input but the two
 * trees, whose inserts nest their members.
 */
type FlatInputs = Omit<PackageInputs, "Instance" | "Node">;

/**
 * A row of one of the import's inputs, as its builder writes it: a flat input's, or a node's or an
 * instance's from inside its tree.
 */
type InputRow =
  | (FlatInputs[keyof FlatInputs] extends ReadonlyMap<string, infer Row> ? Row : never)
  | InstanceMember
  | NodeMember;

/**
 * Every row of an import's inputs by relation, each tree's nested members flattened in: `Node`'s
 * nodes and `Instance`'s instances, which their inserts carry under each row's `children`.
 *
 * @param inputs - The import's inputs.
 * @returns The rows of each relation.
 */
export const rowsByRelation = (inputs: PackageInputs): ReadonlyMap<string, readonly InputRow[]> => {
  const { Instance, Node, ...flat } = inputs;
  const nodes = (node: NodeMember): readonly NodeMember[] => [
    node,
    ...node.children.flatMap(nodes),
  ];
  const instances = (instance: InstanceMember): readonly InstanceMember[] => [
    instance,
    ...instance.children.flatMap(instances),
  ];

  return new Map<string, readonly InputRow[]>([
    ...Object.entries(flat).map(([name, rows]) => [name, [...rows.values()]] as const),
    ["Instance", [...Instance.values()].flatMap(instances)],
    ["Node", [...Node.values()].flatMap(nodes)],
  ]);
};

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
export interface Orphan {
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
  const byName = rowsByRelation(inputs);

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
