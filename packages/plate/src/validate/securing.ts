/**
 * The securing tables: the part of the QTI XSD's tables that securing an item reads, for the
 * documents a host's content store has already admitted. `checkAdmitted` secures such a document by
 * them, as `check` secures a valid one by the full tables, without loading the full tables.
 *
 * Securing reads two things: E3 keeps an attribute of a QTI-namespace element only where the table
 * that governs it declares the attribute by name, and the structural walk decides which table
 * governs each element, the table of a valid `xsi:type`'s type in place of its name's
 * (`governingTables`). So securing needs each table's declared attributes, with their `use`, and
 * the fields the walk reads ({@link WalkTables}): the children it names, its element wildcard, and
 * for an element whether it is global and its declared types, for a type its base and derivation.
 * It reads no attribute's type, default or wildcard, and no text flag, so the projection drops
 * them.
 *
 * {@link projectSecuringTables} writes the projection of the committed full tables as the committed
 * file, `securing-tables.generated.json`, each namespace, name, attribute and list once, referred
 * to by its index, which keeps the file under 3% of the full tables' size.
 * `src/validate/securing-tables.ts` loads it through {@link expandSecuringTables}. The test proves
 * the committed file is the projection of the committed full tables, and that the expansion holds
 * exactly their securing fields. To regenerate, after the full tables, from the repository root:
 *
 * ```sh
 * node packages/plate/scripts/securing-tables.ts && pnpm exec vp fmt packages/plate/src/validate/securing-tables.generated.json
 * ```
 *
 * @module
 */
import { Array as Arr, Schema } from "effect";
import type {
  AttributeUse,
  ChildName,
  SecuringTables,
  Tables,
  Wildcard as WildcardValue,
} from "#plate/validate/xsd.ts";
import { AttributeTable, Wildcard } from "#plate/validate/xsd.ts";

/**
 * The Schema of an index into one of the file's lists.
 */
const Index = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * The Schema of one element's row: its wildcard, the index of its attribute list and of its
 * children's and declared types' name lists, and whether it is declared globally.
 */
const ElementRow = Schema.Struct({
  anyElement: Schema.optionalKey(Wildcard),
  attributes: Index,
  children: Index,
  global: Schema.Boolean,
  types: Index,
});

/**
 * The Schema of one named type's row: its wildcard, the index of its attribute list and of its
 * children's name list, and its base's name and derivation, or a union with no base.
 */
const TypeRow = Schema.Union([
  Schema.Struct({
    anyElement: Schema.optionalKey(Wildcard),
    attributes: Index,
    base: Index,
    children: Index,
    derivation: Schema.Literals(["extension", "restriction"]),
  }),
  Schema.Struct({
    anyElement: Schema.optionalKey(Wildcard),
    attributes: Index,
    children: Index,
    derivation: Schema.Literal("union"),
  }),
]);

/**
 * The Schema of the committed securing tables file.
 *
 * `namespaces` lists each namespace URI once. `names` lists each element or type name once, its
 * namespace by index, and `attributes` each declared attribute once, its namespace by index, with
 * its `use`. `nameLists` and `attributeLists` list each distinct list of names and of attributes
 * once, by index. `elements` and `types` are keyed as the full tables are, each row naming its
 * lists by index.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `SecuringTablesFile` is the Schema and the type of the file under one name, as `Tables` is.
export const SecuringTablesFile = Schema.Struct({
  attributeLists: Schema.Array(Schema.Array(Index)),
  attributes: Schema.Array(
    Schema.Struct({ local: Schema.String, namespace: Index, use: AttributeTable.fields.use }),
  ),
  elements: Schema.Record(Schema.String, ElementRow),
  nameLists: Schema.Array(Schema.Array(Index)),
  names: Schema.Array(Schema.Struct({ local: Schema.String, namespace: Index })),
  namespaces: Schema.Array(Schema.String),
  types: Schema.Record(Schema.String, TypeRow),
});

/**
 * The committed securing tables file, as {@link SecuringTablesFile} decodes it.
 */
export type SecuringTablesFile = typeof SecuringTablesFile.Type;

/**
 * A list being interned: each value it holds once, by index, in the order first seen.
 */
interface Interning<A> {
  /**
   * Give a value its index, adding it at the end when no value with its key is held yet.
   *
   * @param value The value.
   * @returns Its index.
   */
  readonly indexOf: (value: A) => number;
  /**
   * The values, by index.
   */
  readonly values: readonly A[];
}

/**
 * Start interning a list.
 *
 * @param key The value's identity: two values with the same key share an index.
 * @returns The interning, empty.
 */
const interning = <A>(key: (value: A) => string): Interning<A> => {
  const indices = new Map<string, number>();
  const values: A[] = [];

  return {
    indexOf: (value) => {
      const identity = key(value);
      const known = indices.get(identity);
      if (known !== undefined) {
        return known;
      }

      indices.set(identity, values.length);
      values.push(value);

      return values.length - 1;
    },
    values,
  };
};

/**
 * Keep a table's element wildcard, or nothing when it has none, so an absent wildcard stays an
 * absent key.
 *
 * @param table The table.
 * @param table.anyElement Its element wildcard, if any.
 * @returns The wildcard as a field, or no field.
 */
const wildcardField = ({
  anyElement,
}: {
  readonly anyElement?: WildcardValue;
}): { readonly anyElement?: WildcardValue } => (anyElement === undefined ? {} : { anyElement });

/**
 * Project the full tables onto the securing tables file: every element's and type's declared
 * attributes, with their `use`, and the fields the structural walk reads, each namespace, name,
 * attribute and list written once and referred to by its index, in the order the tables first give
 * it.
 *
 * @param tables The full tables, `tables.generated.json`.
 * @returns The file, ready to write as JSON.
 */
export const projectSecuringTables = (tables: Tables): SecuringTablesFile => {
  const namespaces = interning<string>((namespace) => namespace);
  const names = interning<{ readonly local: string; readonly namespace: number }>(
    ({ local, namespace }) => JSON.stringify([namespace, local]),
  );
  const attributes = interning<SecuringTablesFile["attributes"][number]>(
    ({ local, namespace, use }) => JSON.stringify([namespace, local, use]),
  );
  const nameLists = interning<readonly number[]>((list) => JSON.stringify(list));
  const attributeLists = interning<readonly number[]>((list) => JSON.stringify(list));

  const nameOf = ({ local, namespace }: ChildName): number =>
    names.indexOf({ local, namespace: namespaces.indexOf(namespace) });
  const namesOf = (list: readonly ChildName[]): number => nameLists.indexOf(list.map(nameOf));
  const attributesOf = (list: readonly AttributeUse[]): number =>
    attributeLists.indexOf(
      list.map(({ local, namespace, use }) =>
        attributes.indexOf({ local, namespace: namespaces.indexOf(namespace), use }),
      ),
    );

  const elements = Object.fromEntries(
    Object.entries(tables.elements).map(([local, table]) => [
      local,
      {
        ...wildcardField(table),
        attributes: attributesOf(table.attributes),
        children: namesOf(table.children),
        global: table.global,
        types: namesOf(table.types),
      },
    ]),
  );
  const types = Object.fromEntries(
    Object.entries(tables.types).map(([local, entry]) => [
      local,
      entry.derivation === "union"
        ? {
            ...wildcardField(entry),
            attributes: attributesOf(entry.attributes),
            children: namesOf(entry.children),
            derivation: entry.derivation,
          }
        : {
            ...wildcardField(entry),
            attributes: attributesOf(entry.attributes),
            base: nameOf(entry.base),
            children: namesOf(entry.children),
            derivation: entry.derivation,
          },
    ]),
  );

  return {
    attributeLists: attributeLists.values,
    attributes: attributes.values,
    elements,
    nameLists: nameLists.values,
    names: names.values,
    namespaces: namespaces.values,
    types,
  };
};

/**
 * Expand the securing tables file into the tables securing reads: each index replaced by what it
 * refers to, so each list is one array shared by every row that names it.
 *
 * Every index is in range in a file {@link projectSecuringTables} wrote, which the test proves of
 * the committed file. An index out of range throws, as reading a list past its end is a defect of
 * the file.
 *
 * @param file The file.
 * @returns The securing tables.
 */
export const expandSecuringTables = (file: SecuringTablesFile): SecuringTables => {
  const namespaceAt = (index: number): string => Arr.getUnsafe(file.namespaces, index);
  const names = file.names.map(({ local, namespace }): ChildName => ({
    local,
    namespace: namespaceAt(namespace),
  }));
  const attributes = file.attributes.map(({ local, namespace, use }): AttributeUse => ({
    local,
    namespace: namespaceAt(namespace),
    use,
  }));
  const nameLists = file.nameLists.map((list) => list.map((index) => Arr.getUnsafe(names, index)));
  const attributeLists = file.attributeLists.map((list) =>
    list.map((index) => Arr.getUnsafe(attributes, index)),
  );

  return {
    elements: Object.fromEntries(
      Object.entries(file.elements).map(([local, row]) => [
        local,
        {
          ...wildcardField(row),
          attributes: Arr.getUnsafe(attributeLists, row.attributes),
          children: Arr.getUnsafe(nameLists, row.children),
          global: row.global,
          types: Arr.getUnsafe(nameLists, row.types),
        },
      ]),
    ),
    types: Object.fromEntries(
      Object.entries(file.types).map(([local, row]) => [
        local,
        row.derivation === "union"
          ? {
              ...wildcardField(row),
              attributes: Arr.getUnsafe(attributeLists, row.attributes),
              children: Arr.getUnsafe(nameLists, row.children),
              derivation: row.derivation,
            }
          : {
              ...wildcardField(row),
              attributes: Arr.getUnsafe(attributeLists, row.attributes),
              base: Arr.getUnsafe(names, row.base),
              children: Arr.getUnsafe(nameLists, row.children),
              derivation: row.derivation,
            },
      ]),
    ),
  };
};
