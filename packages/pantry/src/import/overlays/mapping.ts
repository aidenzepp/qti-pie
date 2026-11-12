/**
 * The mapping overlays' rows (plan §1.7 O5, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`) and its place in its package, the rows of every
 * relation `#pantry/qti/mapping.ts` declares, each relation's rows a keyed set by its element's
 * place, `(package, path, start)`.
 *
 * The rows restate what the tree says and nothing else: each overlay's node tuple, its parent, its
 * declaration's `declarationRef` tuple as `#pantry/qti/declarations.ts` derives it, each map
 * entry's `map-key` as written, each two-item key's split, and each lookup table's typed
 * attribute values; and, where the declaration has a base type, a mapping's, a map key's and a
 * lookup value's row beside it (a record has none: lane NIL's audit, B12). No key has a typed row:
 * each typed value is a query (`#pantry/qti/queries.ts`) over the `MapKeyType` rows and the
 * splits. The database proves every one of them (`mappingLaws`), so a row this builder gets wrong
 * is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { declarationOf, keyTextOf, typedCountOf } from "#pantry/import/overlays/declarations.ts";
import type { Place, TypedDeclaration } from "#pantry/import/overlays/declarations.ts";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { itemsOf } from "#pantry/import/pieces.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeRow } from "#pantry/model/xdm.ts";
import { booleanTrue, collapse } from "#pantry/grammar/domains.ts";
import type {
  AreaMapping,
  AreaMappingCardinality,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyItems,
  MapKeyType,
  Mapping,
  MappingBaseType,
  MappingCardinality,
  LookupTable,
} from "#pantry/qti/mapping.ts";

/**
 * A document's mapping rows, one keyed set per relation: each map from the text of a row's key,
 * its element's place ({@link keyTextOf}), to the row as its writer writes it.
 */
export interface MappingRows {
  readonly AreaMapping: ReadonlyMap<string, Addition<typeof AreaMapping>>;
  readonly AreaMappingCardinality: ReadonlyMap<string, Addition<typeof AreaMappingCardinality>>;
  readonly LookupValue: ReadonlyMap<string, Addition<typeof LookupValue>>;
  readonly LookupValueType: ReadonlyMap<string, Addition<typeof LookupValueType>>;
  readonly MapKey: ReadonlyMap<string, Addition<typeof MapKey>>;
  readonly MapKeyItems: ReadonlyMap<string, Addition<typeof MapKeyItems>>;
  readonly MapKeyType: ReadonlyMap<string, Addition<typeof MapKeyType>>;
  readonly Mapping: ReadonlyMap<string, Addition<typeof Mapping>>;
  readonly MappingBaseType: ReadonlyMap<string, Addition<typeof MappingBaseType>>;
  readonly MappingCardinality: ReadonlyMap<string, Addition<typeof MappingCardinality>>;
  readonly LookupTable: ReadonlyMap<string, Addition<typeof LookupTable>>;
  readonly LookupTableCardinality: ReadonlyMap<string, Addition<typeof LookupTableCardinality>>;
}

/**
 * The fields a declared overlay copies from its declaration, `declarationRef`'s less its place.
 */
type DeclarationCopy = Pick<
  Addition<typeof Mapping>,
  "baseTypes" | "cardinalities" | "declarationKind"
>;

/**
 * A declaration as a declared overlay reads it: its kind's `DeclarationKind` and its typed
 * attributes.
 */
type Declared = TypedDeclaration & { readonly declarationKind: DeclarationCopy["declarationKind"] };

/**
 * A `BaseType` handle.
 */
type BaseTypeHandle = Addition<typeof MappingBaseType>["baseType"];

/**
 * Read the fields a declared overlay copies from its declaration: its cardinality and its base
 * type only as their counts ({@link typedCountOf}), since a declaration may have neither (lane
 * NIL's audit, B12; spec reading 158), and never its name, which a declaration may lack (spec
 * reading 157).
 *
 * @param declared - The declaration.
 * @returns The copy.
 */
const copyOf = ({ baseType, cardinality, declarationKind }: Declared): DeclarationCopy => ({
  baseTypes: typedCountOf(baseType),
  cardinalities: typedCountOf(cardinality),
  declarationKind,
});

/**
 * The base types whose keys are written as two items: each key of a mapping of one, split into
 * its two items, has its `MapKeyItems` row.
 */
const twoItemBaseTypes: ReadonlySet<string> = new Set(["directedPair", "pair", "point"]);

/**
 * The lookup tables' kinds, each with the attribute whose value it carries: its entries'
 * `target-value` and its own `default-value`.
 */
const lookupAttributeOf: ReadonlyMap<string, string> = new Map([
  ["qti-interpolation-table", "default-value"],
  ["qti-interpolation-table-entry", "target-value"],
  ["qti-match-table", "default-value"],
  ["qti-match-table-entry", "target-value"],
]);

/**
 * How a map entry's key is matched: its `case-sensitive` as written (empty where unwritten), and
 * `folded` where its mapping is of strings and the value is not true. The key a response meets,
 * `matched`, the database derives from them.
 *
 * @param baseType - The entry's mapping's base type, none for a record's mapping.
 * @param caseText - The entry's `case-sensitive`, empty where unwritten.
 * @returns The `MapKey` row's matching fields.
 */
const matchingOf = (baseType: Option.Option<BaseTypeHandle>, caseText = "") => ({
  caseText,
  folded:
    Option.contains(baseType, "string") && !booleanTrue.some((form) => form === collapse(caseText)),
});

/**
 * Build the mapping overlays' rows of one document.
 *
 * A declared overlay copies its parent's declaration fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declarationOf`), and exists below every declaration,
 * whatever its attributes spell (spec readings 157 and 158): a table below no declaration, which
 * the content model never admits, has no row, and its parent's own law refuses it.
 *
 * A map entry's `MapKey` row also holds how its key is matched: its `case-sensitive` as written
 * (empty where unwritten), and `folded` where its mapping is of strings and the value is not true.
 *
 * A map entry with no `map-key` has no `MapKey` row, and AL3 refuses the element. A key past the
 * key-text bound keeps its `MapKey` row and its split, and `MapKey`'s `keyText` refuses it under
 * "Key text bound". A key of a point, pair or directed pair mapping has its `MapKeyItems` row
 * exactly where it is two runs around one whitespace character ({@link itemsOf}); any other has
 * none, and `Typed_attribute_value` refuses it. A table entry, and a table with a `default-value`,
 * has its `LookupValue` row, with its table's declaration. Each of a
 * mapping, a map key and a lookup value has its row beside its declaration's base type, where the
 * declaration has one, and only there; a record's has none, so its keys and values are read in no
 * base type and have no typed row. Each of a mapping, an area mapping and a lookup table has its
 * row beside its declaration's cardinality, where the declaration has one, and only there (spec
 * reading 158).
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @param place - Where the document stands in its package, the key every row holds.
 * @returns Every overlay's rows.
 */
export const rowsOf = (view: DocumentView, place: Place): MappingRows => {
  const { folds, rows } = view;
  const byStart = new Map(rows.nodes.map((node) => [node.start, node]));
  const attributes: ReadonlyMap<bigint, ReadonlyMap<string, string>> = new Map(
    [...Map.groupBy(rows.attributes, ({ start }) => start)].map(
      ([start, held]) =>
        [start, new Map(held.map(({ lexical, name }) => [name, lexical]))] as const,
    ),
  );

  const valueOf = (start: bigint, name: string): string | undefined =>
    attributes.get(start)?.get(name);
  const placeOf = (node: NodeRow<Composed>) => ({
    package: place.package,
    path: place.path,
    start: node.start,
  });
  const tupleOf = (node: NodeRow<Composed>) => ({
    ...placeOf(node),
    kind: node.kind,
    nearest: foldAt(folds, node.start).nearest,
    version: node.version,
  });
  const keyOf = (node: NodeRow<Composed>): string => keyTextOf(place, node.start);
  // Each declaration, as its rows hold it (`declarationOf`), whatever its identifier, cardinality
  // and base type spell (spec readings 157 and 158): a table hangs below one, and copies it.
  const declarations = new Map(
    rows.nodes.flatMap((node) =>
      Option.toArray(
        declarationOf(node.kind, (name) => Option.fromUndefinedOr(valueOf(node.start, name))),
      ).map((declared): readonly [bigint, Declared] => [node.start, declared]),
    ),
  );

  const areaMappings = new Map<string, Addition<typeof AreaMapping>>();
  const lookupValues = new Map<string, Addition<typeof LookupValue>>();
  const lookupValueTypes = new Map<string, Addition<typeof LookupValueType>>();
  const mapKeys = new Map<string, Addition<typeof MapKey>>();
  const mapKeyTypes = new Map<string, Addition<typeof MapKeyType>>();
  const mappingBaseTypes = new Map<string, Addition<typeof MappingBaseType>>();
  const mapKeyItems = new Map<string, Addition<typeof MapKeyItems>>();
  const mappings = new Map<string, Addition<typeof Mapping>>();
  const lookupTables = new Map<string, Addition<typeof LookupTable>>();
  const cardinalities = {
    AreaMappingCardinality: new Map<string, Addition<typeof AreaMappingCardinality>>(),
    LookupTableCardinality: new Map<string, Addition<typeof LookupTableCardinality>>(),
    MappingCardinality: new Map<string, Addition<typeof MappingCardinality>>(),
  };
  // Each table kind's rows, and its rows beside its declaration's cardinality.
  const tables: ReadonlyMap<
    string,
    {
      readonly beside: Map<string, Addition<typeof MappingCardinality>>;
      readonly rows: Map<string, Addition<typeof Mapping>>;
    }
  > = new Map([
    ["qti-area-mapping", { beside: cardinalities.AreaMappingCardinality, rows: areaMappings }],
    [
      "qti-interpolation-table",
      { beside: cardinalities.LookupTableCardinality, rows: lookupTables },
    ],
    ["qti-mapping", { beside: cardinalities.MappingCardinality, rows: mappings }],
    ["qti-match-table", { beside: cardinalities.LookupTableCardinality, rows: lookupTables }],
  ]);
  const addTable = (node: NodeRow<Composed>, declaration: Declared): void => {
    for (const table of Option.toArray(Option.fromUndefinedOr(tables.get(node.kind)))) {
      table.rows.set(keyOf(node), {
        ...tupleOf(node),
        ...copyOf(declaration),
        declaration: node.parent,
      });
      for (const cardinality of Option.toArray(declaration.cardinality)) {
        table.beside.set(keyOf(node), { ...placeOf(node), cardinality, declaration: node.parent });
      }
    }

    for (const baseType of node.kind === "qti-mapping"
      ? Option.toArray(declaration.baseType)
      : []) {
      mappingBaseTypes.set(keyOf(node), { ...placeOf(node), baseType, declaration: node.parent });
    }
  };

  for (const node of rows.nodes) {
    for (const declaration of Option.toArray(Option.fromNullishOr(declarations.get(node.parent)))) {
      addTable(node, declaration);
    }

    const lookupAttribute = lookupAttributeOf.get(node.kind);
    const lookupValue =
      lookupAttribute === undefined ? undefined : valueOf(node.start, lookupAttribute);
    const table = lookupAttribute === "default-value" ? node : byStart.get(node.parent);
    const tableDeclaration = table === undefined ? undefined : declarations.get(table.parent);
    if (lookupValue !== undefined && table !== undefined && tableDeclaration !== undefined) {
      lookupValues.set(keyOf(node), {
        ...tupleOf(node),
        baseTypes: typedCountOf(tableDeclaration.baseType),
        declaration: table.parent,
        parent: node.parent,
        value: lookupValue,
      });
      for (const baseType of Option.toArray(tableDeclaration.baseType)) {
        lookupValueTypes.set(keyOf(node), {
          ...placeOf(node),
          baseType,
          declaration: table.parent,
          value: lookupValue,
        });
      }
    }

    const key = node.kind === "qti-map-entry" ? valueOf(node.start, "map-key") : undefined;
    const mapping = byStart.get(node.parent);
    const mappingDeclaration = mapping === undefined ? undefined : declarations.get(mapping.parent);
    if (key === undefined || mappingDeclaration === undefined) {
      continue;
    }

    mapKeys.set(keyOf(node), {
      ...tupleOf(node),
      ...matchingOf(mappingDeclaration.baseType, valueOf(node.start, "case-sensitive")),
      baseTypes: typedCountOf(mappingDeclaration.baseType),
      key,
      mapping: node.parent,
    });
    for (const baseType of Option.toArray(mappingDeclaration.baseType)) {
      mapKeyTypes.set(keyOf(node), { ...placeOf(node), baseType, key, mapping: node.parent });
      for (const items of twoItemBaseTypes.has(baseType)
        ? Option.toArray(Option.fromUndefinedOr(itemsOf(key)))
        : []) {
        mapKeyItems.set(keyOf(node), { ...placeOf(node), ...items, key, mapping: node.parent });
      }
    }
  }

  return {
    ...cardinalities,
    AreaMapping: areaMappings,
    LookupTable: lookupTables,
    LookupValue: lookupValues,
    LookupValueType: lookupValueTypes,
    MapKey: mapKeys,
    MapKeyItems: mapKeyItems,
    MapKeyType: mapKeyTypes,
    Mapping: mappings,
    MappingBaseType: mappingBaseTypes,
  };
};
