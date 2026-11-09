/**
 * The mapping overlays' rows (plan §1.7 O5, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/mapping.ts` declares,
 * each relation's rows a keyed set by its element's node.
 *
 * The rows restate what the tree says and nothing else: each overlay's node tuple, its parent, its
 * declaration's `declarationRef` tuple as `#pantry/qti/declarations.ts` derives it, each map
 * entry's `map-key` as written, each key's typed row where its base type has a typed value and
 * the key is of that value's form, its fields the split PostgreSQL generates the value from, and
 * each lookup table's typed attribute values; and, where the declaration has a base type, a
 * mapping's, a map key's and a lookup value's row beside it (a record has none: lane NIL's audit,
 * B12). An integer key and a float key have no typed row: the queries `MapKeyInteger` and
 * `MapKeyFloat` (`#pantry/qti/queries.ts`) read their values from their `MapKeyType` rows. The
 * database proves every one of them (`mappingLaws`), so a row this builder gets wrong is refused,
 * never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { DocumentContext } from "#pantry/import/context.ts";
import { declarationOf, typedCountOf } from "#pantry/import/overlays/declarations.ts";
import type { TypedDeclaration } from "#pantry/import/overlays/declarations.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { lowerAscii } from "#pantry/import/overlays/metadata.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { booleanTrue, collapse } from "#pantry/grammar/domains.ts";
import { Item } from "#pantry/qti/mapping.ts";
import type {
  AreaMapping,
  AreaMappingCardinality,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyDirectedPair,
  MapKeyPair,
  MapKeyPoint,
  MapKeyType,
  Mapping,
  MappingBaseType,
  MappingCardinality,
  LookupTable,
} from "#pantry/qti/mapping.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface MappingIds {
  /**
   * The document's context (spec reading 117), `ownContext` of its document node for a document no
   * site names: an included fragment's nodes take the interaction their includes stand in as their
   * nearest.
   */
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's mapping rows, one keyed set per relation: each map from the text of a row's key,
 * its element's node id, to the row as its writer writes it.
 */
export interface MappingRows {
  readonly AreaMapping: ReadonlyMap<string, Addition<typeof AreaMapping>>;
  readonly AreaMappingCardinality: ReadonlyMap<string, Addition<typeof AreaMappingCardinality>>;
  readonly LookupValue: ReadonlyMap<string, Addition<typeof LookupValue>>;
  readonly LookupValueType: ReadonlyMap<string, Addition<typeof LookupValueType>>;
  readonly MapKey: ReadonlyMap<string, Addition<typeof MapKey>>;
  readonly MapKeyDirectedPair: ReadonlyMap<string, Addition<typeof MapKeyDirectedPair>>;
  readonly MapKeyPair: ReadonlyMap<string, Addition<typeof MapKeyPair>>;
  readonly MapKeyPoint: ReadonlyMap<string, Addition<typeof MapKeyPoint>>;
  readonly MapKeyType: ReadonlyMap<string, Addition<typeof MapKeyType>>;
  readonly Mapping: ReadonlyMap<string, Addition<typeof Mapping>>;
  readonly MappingBaseType: ReadonlyMap<string, Addition<typeof MappingBaseType>>;
  readonly MappingCardinality: ReadonlyMap<string, Addition<typeof MappingCardinality>>;
  readonly LookupTable: ReadonlyMap<string, Addition<typeof LookupTable>>;
  readonly LookupTableCardinality: ReadonlyMap<string, Addition<typeof LookupTableCardinality>>;
}

/**
 * The fields a declared overlay copies from its declaration, `declarationRef`'s less its node and
 * document.
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
 * A pair's or a directed pair's item as `Item`, the type of each item field, holds it.
 */
const pairItem = new RegExp(Item.patterns[0].source, Item.patterns[0].flags);

/**
 * A point key's or a pair key's split: its two items and the whitespace between them.
 */
const twoItems = /^(?<first>[^\t\n\r ]+)(?<gap>[\t\n\r ])(?<second>[^\t\n\r ]+)$/u;

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
 * An integer's split: the sign, the leading zeros, and the magnitude, which holds one digit at
 * least.
 */
const integerParts = /^(?<sign>[+-]?)(?<zeros>0*)(?<digits>0|[1-9][0-9]*)$/u;

/**
 * The parts of one of a point's integers, as {@link MapKeyPoint} holds its first.
 */
type IntegerParts = {
  readonly digits: Addition<typeof MapKeyPoint>["xDigits"];
  readonly sign: Addition<typeof MapKeyPoint>["xSign"];
  readonly zeros: Addition<typeof MapKeyPoint>["xZeros"];
};

/**
 * Whether a text is a sign or none, the language of `MapKeyPoint.xSign`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is `+`, `-` or nothing.
 */
const isSign = (text: string | undefined): text is IntegerParts["sign"] =>
  text === "" || text === "+" || text === "-";

/**
 * Whether a text is a run of zeros, the language of `MapKeyPoint.xZeros`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it holds `0` alone, or nothing.
 */
const isZeros = (text: string | undefined): text is IntegerParts["zeros"] =>
  text !== undefined && /^0*$/u.test(text);

/**
 * Whether a text is an integer's magnitude with no leading zero, the language of
 * `MapKeyPoint.xDigits`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is `0` or starts with a nonzero digit, digits alone.
 */
const isDigits = (text: string | undefined): text is IntegerParts["digits"] =>
  text !== undefined && /^(?:0|[1-9][0-9]*)$/u.test(text);

/**
 * Split one of a point key's integers into the parts PostgreSQL generates its canonical form from:
 * the sign, the leading zeros and the magnitude.
 *
 * @param key - The integer's text.
 * @returns The parts, or none for a text that is no member of `integerKeyPattern`
 *   (`#pantry/qti/mapping.ts`).
 */
export const integerPartsOf = (key: string): IntegerParts | undefined => {
  const groups = integerParts.exec(key)?.groups;
  const sign = groups?.["sign"];
  const zeros = groups?.["zeros"];
  const digits = groups?.["digits"];

  return isSign(sign) && isZeros(zeros) && isDigits(digits) ? { digits, sign, zeros } : undefined;
};

/**
 * The whitespace between a point's or a pair's two items, as `Gap` types it.
 */
type GapText = Addition<typeof MapKeyPair>["gap"];

/**
 * Whether a text is one XML whitespace character, the language of `Gap`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is one space, tab or line end.
 */
const isGap = (text: string | undefined): text is GapText =>
  text === " " || text === "\t" || text === "\n" || text === "\r";

/**
 * Split a key of two items around the whitespace between them.
 *
 * @param key - The key.
 * @returns Its first item, the whitespace and its second item, or none for a key that is not two
 *   items.
 */
const itemsOf = (
  key: string,
): { readonly first: string; readonly gap: GapText; readonly second: string } | undefined => {
  const groups = twoItems.exec(key)?.groups;
  const first = groups?.["first"];
  const gap = groups?.["gap"];
  const second = groups?.["second"];

  return first === undefined || !isGap(gap) || second === undefined
    ? undefined
    : { first, gap, second };
};

/**
 * Split a point map key into the parts PostgreSQL generates its canonical form from: each
 * integer's, as {@link integerPartsOf} splits one, and the whitespace between them.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of `pointKeyPattern`
 *   (`#pantry/qti/mapping.ts`).
 */
export const pointPartsOf = (
  key: string,
): Omit<Addition<typeof MapKeyPoint>, "key" | "mapping" | "node"> | undefined => {
  const items = itemsOf(key);
  const x = items === undefined ? undefined : integerPartsOf(items.first);
  const y = items === undefined ? undefined : integerPartsOf(items.second);
  if (items === undefined || x === undefined || y === undefined) {
    return undefined;
  }

  return {
    gap: items.gap,
    xDigits: x.digits,
    xSign: x.sign,
    xZeros: x.zeros,
    yDigits: y.digits,
    ySign: y.sign,
    yZeros: y.zeros,
  };
};

/**
 * Split a pair map key into the parts PostgreSQL generates its canonical form from: its two items
 * and the whitespace between them.
 *
 * The split is wider than `pairKeyPattern` (`#pantry/qti/mapping.ts`): an item of the split is any
 * run of no XML whitespace, and an `Item` a run of XML `Char`s past U+0020. The two part on the C0
 * control characters an XML 1.1 document writes as character references (`&#x1;`), whose key no
 * typed row holds ({@link typedKeyAdders}), and `Typed_attribute_value` refuses it
 * (`mapping.test.ts`).
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is not two items around one XML whitespace
 * character.
 */
export const pairPartsOf = (
  key: string,
): Omit<Addition<typeof MapKeyPair>, "key" | "mapping" | "node"> | undefined => itemsOf(key);

/**
 * Split a directed pair map key into the parts PostgreSQL generates its canonical form from: its
 * source and target and the whitespace between them, as {@link pairPartsOf} splits a pair key.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is not two items around one XML whitespace
 * character.
 */
export const directedPairPartsOf = (
  key: string,
): Omit<Addition<typeof MapKeyDirectedPair>, "key" | "mapping" | "node"> | undefined => {
  const items = itemsOf(key);

  return items === undefined
    ? undefined
    : { gap: items.gap, source: items.first, target: items.second };
};

/**
 * The typed map keys' rows, one keyed set per relation, by the entry's node.
 */
interface TypedKeys {
  readonly MapKeyDirectedPair: Map<string, Addition<typeof MapKeyDirectedPair>>;
  readonly MapKeyPair: Map<string, Addition<typeof MapKeyPair>>;
  readonly MapKeyPoint: Map<string, Addition<typeof MapKeyPoint>>;
}

/**
 * A map key, its mapping and its entry's node, which each typed row holds.
 */
interface TypedEntry {
  readonly key: string;
  readonly mapping: NodeId;
  readonly node: NodeId;
}

/**
 * Each base type's stored typed key, where it has one: the split of its key into the row's parts,
 * and the relation its row joins, written only where each part is a value of its field's type: a
 * pair's or a directed pair's where both items of its split are `Item`s, and a point's parts typed
 * by their split. These are the keys each typed relation's mirror selects ("Mapping overlay":
 * `pairKeys` and `directedPairKeys` over `pairKeyPattern`, `pointKeys` over `pointKeyPattern`), so
 * a key of no such form has no typed row, and `Typed_attribute_value` alone refuses it on its
 * `MapKeyType` row: a form outside a type's lexical space denotes no value of it (XML Schema Part 2
 * §2.3), as reading 152 reads it for a name. Each of these relations is stored, so the host decides
 * which rows exist and the mirror judges the decision (the constraint-engine plan's B9). A row for
 * every pair split breaks the mirror beside `Typed attribute value`.
 *
 * An integer key and a float key have no typed row: their typed values are the queries
 * `MapKeyInteger` and `MapKeyFloat` (`#pantry/qti/queries.ts`), PostgreSQL's parses of their
 * `MapKeyType` rows' keys, each keyed by a rule over its query.
 */
const typedKeyAdders: Partial<
  Readonly<Record<BaseTypeHandle, (typed: TypedKeys, entry: TypedEntry) => void>>
> = {
  directedPair: (typed, entry) => {
    const directed = directedPairPartsOf(entry.key);
    if (
      directed !== undefined &&
      pairItem.test(directed.source) &&
      pairItem.test(directed.target)
    ) {
      typed.MapKeyDirectedPair.set(entry.node, { ...directed, ...entry });
    }
  },
  pair: (typed, entry) => {
    const pair = pairPartsOf(entry.key);
    if (pair !== undefined && pairItem.test(pair.first) && pairItem.test(pair.second)) {
      typed.MapKeyPair.set(entry.node, { ...pair, ...entry });
    }
  },
  point: (typed, entry) => {
    const point = pointPartsOf(entry.key);
    if (point !== undefined) {
      typed.MapKeyPoint.set(entry.node, { ...point, ...entry });
    }
  },
};

/**
 * Add a map key's typed row, where its base type gives it one and the key is of its form: a point's
 * two integers' signs, zeros and digits, and a pair's or a directed pair's two `Item`s. Every other
 * key has no typed row, and `Typed_attribute_value` refuses it on its `MapKeyType` row.
 *
 * @param typed - The typed rows so far.
 * @param baseType - The key's mapping's base type.
 * @param entry - The key, its mapping and its entry's node.
 * @param entry.key - The key.
 * @param entry.mapping - The mapping's node.
 * @param entry.node - The entry's node.
 */
const addTypedKey = (typed: TypedKeys, baseType: BaseTypeHandle, entry: TypedEntry): void => {
  typedKeyAdders[baseType]?.(typed, entry);
};

/**
 * How a map entry's key is matched: its `case-sensitive` as written (empty where unwritten),
 * `folded` where its mapping is of strings and the value is not true, and `matched`, the key's
 * ASCII lowercase where `folded`.
 *
 * @param baseType - The entry's mapping's base type, none for a record's mapping.
 * @param caseText - The entry's `case-sensitive`, where written.
 * @param key - The entry's `map-key`.
 * @returns The `MapKey` row's matching fields.
 */
const matchingOf = (
  baseType: Option.Option<BaseTypeHandle>,
  caseText: string | undefined,
  key: string,
) => {
  const written = caseText ?? "";
  const folded =
    Option.contains(baseType, "string") && !booleanTrue.some((form) => form === collapse(written));

  return { caseText: written, folded, matched: folded ? lowerAscii(key) : key };
};

/**
 * Build the mapping overlays' rows of one document.
 *
 * A declared overlay copies its parent's declaration fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declarationOf`), and exists below every declaration,
 * whatever its attributes spell (spec readings 157 and 158): a table below no declaration, which
 * the content model never admits, has no row, and its parent's own law refuses it.
 *
 * A map entry's `MapKey` row also holds how its key is matched: its `case-sensitive` as written
 * (empty where unwritten), `folded` where its mapping is of strings and the value is not true, and
 * `matched`, the key's ASCII lowercase where `folded`.
 *
 * A map entry with no `map-key` has no `MapKey` row, and AL3 refuses the element. A key past the
 * key-text bound keeps its `MapKey` row and its typed row, and `MapKey`'s `keyText` refuses it
 * under "Key text bound" (its parts' types bound no length). A typed key has its typed row exactly
 * where it is of its base type's form ({@link typedKeyAdders}); any other key has none, and
 * `Typed_attribute_value` refuses it. A table entry, and a table with a `default-value`, has its
 * `LookupValue` row, with its table's declaration. Each of a mapping, a map key and a lookup value
 * has its row beside its declaration's base type, where the declaration has one, and only there; a
 * record's has none, so its keys and values are read in no base type and have no typed row. Each of
 * a mapping, an area mapping and a lookup table has its row beside its declaration's cardinality,
 * where the declaration has one, and only there (spec reading 158).
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: MappingIds): MappingRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const folds = foldOf(rows.nodes, ids.context);
  const byId = new Map(rows.nodes.map((node) => [node.id, node]));
  const attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>> = new Map(
    [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
      ([node, held]) => [node, new Map(held.map(({ lexical, name }) => [name, lexical]))] as const,
    ),
  );

  const valueOf = (node: NodeId, name: string): string | undefined =>
    attributes.get(node)?.get(name);
  const tupleOf = (node: NodeRow<Composed>) => ({
    document,
    kind: node.kind,
    nearest: foldAt(folds, node.id).nearest,
    node: node.id,
    start: node.start,
    version: node.version,
  });
  // Each declaration, as its rows hold it (`declarationOf`), whatever its identifier, cardinality
  // and base type spell (spec readings 157 and 158): a table hangs below one, and copies it.
  const declarations = new Map(
    rows.nodes.flatMap((node) =>
      Option.toArray(
        declarationOf(node.kind, (name) => Option.fromUndefinedOr(valueOf(node.id, name))),
      ).map((declared): readonly [NodeId, Declared] => [node.id, declared]),
    ),
  );

  const areaMappings = new Map<string, Addition<typeof AreaMapping>>();
  const lookupValues = new Map<string, Addition<typeof LookupValue>>();
  const lookupValueTypes = new Map<string, Addition<typeof LookupValueType>>();
  const mapKeys = new Map<string, Addition<typeof MapKey>>();
  const mapKeyTypes = new Map<string, Addition<typeof MapKeyType>>();
  const mappingBaseTypes = new Map<string, Addition<typeof MappingBaseType>>();
  const typed: TypedKeys = {
    MapKeyDirectedPair: new Map(),
    MapKeyPair: new Map(),
    MapKeyPoint: new Map(),
  };
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
      table.rows.set(node.id, {
        ...tupleOf(node),
        ...copyOf(declaration),
        declaration: node.parent,
      });
      for (const cardinality of Option.toArray(declaration.cardinality)) {
        table.beside.set(node.id, { cardinality, declaration: node.parent, node: node.id });
      }
    }

    for (const baseType of node.kind === "qti-mapping"
      ? Option.toArray(declaration.baseType)
      : []) {
      mappingBaseTypes.set(node.id, { baseType, declaration: node.parent, node: node.id });
    }
  };

  for (const node of rows.nodes) {
    for (const declaration of Option.toArray(Option.fromNullishOr(declarations.get(node.parent)))) {
      addTable(node, declaration);
    }

    const lookupAttribute = lookupAttributeOf.get(node.kind);
    const lookupValue =
      lookupAttribute === undefined ? undefined : valueOf(node.id, lookupAttribute);
    const table = lookupAttribute === "default-value" ? node : byId.get(node.parent);
    const tableDeclaration = table === undefined ? undefined : declarations.get(table.parent);
    if (lookupValue !== undefined && table !== undefined && tableDeclaration !== undefined) {
      lookupValues.set(node.id, {
        ...tupleOf(node),
        baseTypes: typedCountOf(tableDeclaration.baseType),
        declaration: table.parent,
        parent: node.parent,
        value: lookupValue,
      });
      for (const baseType of Option.toArray(tableDeclaration.baseType)) {
        lookupValueTypes.set(node.id, {
          baseType,
          declaration: table.parent,
          node: node.id,
          value: lookupValue,
        });
      }
    }

    const key = node.kind === "qti-map-entry" ? valueOf(node.id, "map-key") : undefined;
    const mapping = byId.get(node.parent);
    const mappingDeclaration = mapping === undefined ? undefined : declarations.get(mapping.parent);
    if (key === undefined || mappingDeclaration === undefined) {
      continue;
    }

    mapKeys.set(node.id, {
      ...tupleOf(node),
      ...matchingOf(mappingDeclaration.baseType, valueOf(node.id, "case-sensitive"), key),
      baseTypes: typedCountOf(mappingDeclaration.baseType),
      key,
      mapping: node.parent,
    });
    for (const baseType of Option.toArray(mappingDeclaration.baseType)) {
      mapKeyTypes.set(node.id, { baseType, key, mapping: node.parent, node: node.id });
      addTypedKey(typed, baseType, { key, mapping: node.parent, node: node.id });
    }
  }

  return {
    ...cardinalities,
    AreaMapping: areaMappings,
    LookupTable: lookupTables,
    LookupValue: lookupValues,
    LookupValueType: lookupValueTypes,
    MapKey: mapKeys,
    ...typed,
    MapKeyType: mapKeyTypes,
    Mapping: mappings,
    MappingBaseType: mappingBaseTypes,
  };
};
