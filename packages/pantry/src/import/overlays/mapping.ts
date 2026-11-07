/**
 * The mapping overlays' rows (plan §1.7 O5, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/mapping.ts` declares,
 * each relation's rows a keyed set by its element's node.
 *
 * The rows restate what the tree says and nothing else: each overlay's node tuple, its parent, its
 * declaration's `declarationRef` tuple as `#pantry/qti/declarations.ts` derives it, each map
 * entry's `map-key` as written, each key's split where its base type has a typed value, whose
 * value PostgreSQL generates from the split, and each lookup table's typed attribute values; and,
 * where the declaration has a base type, a mapping's, a map key's and a lookup value's row beside
 * it (a record has none: lane NIL's audit, B12). The database proves every one of them
 * (`mappingLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { DocumentContext } from "#pantry/import/context.ts";
import { baseTypesOf, declaredFieldsOf } from "#pantry/import/overlays/declarations.ts";
import type { DeclaredFields } from "#pantry/import/overlays/declarations.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { pairKeyPattern } from "#pantry/qti/mapping.ts";
import { doublePattern } from "#pantry/qti/operators.ts";
import type {
  AreaMapping,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  MapKeyType,
  Mapping,
  MappingBaseType,
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
  readonly LookupValue: ReadonlyMap<string, Addition<typeof LookupValue>>;
  readonly LookupValueType: ReadonlyMap<string, Addition<typeof LookupValueType>>;
  readonly MapKey: ReadonlyMap<string, Addition<typeof MapKey>>;
  readonly MapKeyDirectedPair: ReadonlyMap<string, Addition<typeof MapKeyDirectedPair>>;
  readonly MapKeyFloat: ReadonlyMap<string, Addition<typeof MapKeyFloat>>;
  readonly MapKeyInteger: ReadonlyMap<string, Addition<typeof MapKeyInteger>>;
  readonly MapKeyPair: ReadonlyMap<string, Addition<typeof MapKeyPair>>;
  readonly MapKeyPoint: ReadonlyMap<string, Addition<typeof MapKeyPoint>>;
  readonly MapKeyType: ReadonlyMap<string, Addition<typeof MapKeyType>>;
  readonly Mapping: ReadonlyMap<string, Addition<typeof Mapping>>;
  readonly MappingBaseType: ReadonlyMap<string, Addition<typeof MappingBaseType>>;
  readonly LookupTable: ReadonlyMap<string, Addition<typeof LookupTable>>;
}

/**
 * The fields a declared overlay copies from its declaration, `declarationRef`'s less its node and
 * document.
 */
type DeclarationCopy = Pick<
  Addition<typeof Mapping>,
  "baseTypes" | "cardinality" | "declarationKind" | "identifier"
>;

/**
 * A `BaseType` handle.
 */
type BaseTypeHandle = Addition<typeof MappingBaseType>["baseType"];

/**
 * Read the fields a declared overlay copies from its declaration: its base type only as its count
 * ({@link baseTypesOf}), since a record has none.
 *
 * @param declared - The declaration's fields.
 * @returns The copy.
 */
const copyOf = ({
  baseType,
  cardinality,
  declarationKind,
  identifier,
}: DeclaredFields): DeclarationCopy => ({
  baseTypes: baseTypesOf(baseType),
  cardinality,
  declarationKind,
  identifier,
});

/**
 * The map keys of a float mapping, every one of which holds a typed value (reading 154), as
 * `floatKeys` selects them.
 */
const doubleKey = new RegExp(doublePattern, "u");

/**
 * The map keys of a pair or directed pair mapping that hold a typed value, as `pairKeys` and
 * `directedPairKeys` select them.
 *
 * The test stays beside the split ({@link itemsOf}), which is wider: an item of the split is any
 * run of no XML whitespace, and an item of the pattern a run of XML `Char`s past U+0020. The two
 * part on the C0 control characters an XML 1.1 document writes as character references (`&#x1;`),
 * and on any other character no `Char` is. The integer and point keys need no such test, since
 * their parsers' languages are their patterns' (`mapping.test.ts`).
 */
const pairKey = new RegExp(pairKeyPattern, "u");

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
 * An integer key's split: the sign, the leading zeros, and the magnitude, which holds one digit at
 * least.
 */
const integerParts = /^(?<sign>[+-]?)(?<zeros>0*)(?<digits>0|[1-9][0-9]*)$/u;

/**
 * The parts of an integer map key's split, as {@link MapKeyInteger} holds them.
 */
type IntegerParts = Pick<Addition<typeof MapKeyInteger>, "digits" | "sign" | "zeros">;

/**
 * Whether a text is a sign or none, the language of `MapKeyInteger.sign`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is `+`, `-` or nothing.
 */
const isSign = (text: string | undefined): text is IntegerParts["sign"] =>
  text === "" || text === "+" || text === "-";

/**
 * Whether a text is a run of zeros, the language of `MapKeyInteger.zeros`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it holds `0` alone, or nothing.
 */
const isZeros = (text: string | undefined): text is IntegerParts["zeros"] =>
  text !== undefined && /^0*$/u.test(text);

/**
 * Whether a text is an integer's magnitude with no leading zero, the language of
 * `MapKeyInteger.digits`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is `0` or starts with a nonzero digit, digits alone.
 */
const isDigits = (text: string | undefined): text is IntegerParts["digits"] =>
  text !== undefined && /^(?:0|[1-9][0-9]*)$/u.test(text);

/**
 * Split an integer map key into the parts PostgreSQL generates its canonical form from: the sign,
 * the leading zeros and the magnitude.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of `integerKeyPattern`
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
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of {@link pairKeyPattern}.
 */
export const pairPartsOf = (
  key: string,
): Omit<Addition<typeof MapKeyPair>, "key" | "mapping" | "node"> | undefined => itemsOf(key);

/**
 * Split a directed pair map key into the parts PostgreSQL generates its canonical form from: its
 * source and target and the whitespace between them.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of {@link pairKeyPattern}.
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
  readonly MapKeyFloat: Map<string, Addition<typeof MapKeyFloat>>;
  readonly MapKeyInteger: Map<string, Addition<typeof MapKeyInteger>>;
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
 * Each base type's typed key, where it has one: the parse of its key, which is the one test that
 * the key holds a typed value, and the relation its row joins. A float key's test is its pattern
 * ({@link doubleKey}), since its row holds no split; a pair's is its pattern beside the parse
 * ({@link pairKey}).
 */
const typedKeyAdders: Partial<
  Readonly<Record<BaseTypeHandle, (typed: TypedKeys, entry: TypedEntry) => void>>
> = {
  directedPair: (typed, entry) => {
    const directed = pairKey.test(entry.key) ? directedPairPartsOf(entry.key) : undefined;
    if (directed !== undefined) {
      typed.MapKeyDirectedPair.set(entry.node, { ...directed, ...entry });
    }
  },
  float: (typed, entry) => {
    if (doubleKey.test(entry.key)) {
      typed.MapKeyFloat.set(entry.node, entry);
    }
  },
  integer: (typed, entry) => {
    const integer = integerPartsOf(entry.key);
    if (integer !== undefined) {
      typed.MapKeyInteger.set(entry.node, { ...integer, ...entry });
    }
  },
  pair: (typed, entry) => {
    const pair = pairKey.test(entry.key) ? pairPartsOf(entry.key) : undefined;
    if (pair !== undefined) {
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
 * Add a map key's typed row, where its base type gives it one and its key is of the form the
 * row's mirror selects: an integer's, a float's in `xs:double`'s lexical space, a point's two
 * integers, or a pair's or a directed pair's two items. Every other key has no typed row.
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
 * Build the mapping overlays' rows of one document.
 *
 * A declared overlay copies its parent's declaration fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declaredFieldsOf`), and exists only below a
 * declaration with a `Declaration` row: a table below one with no row, or below no declaration,
 * which the content model never admits, has no row, and its parent's own law refuses it.
 *
 * A map entry with no `map-key` has no `MapKey` row, and AL3 refuses the element. A key past the
 * key-text bound keeps its `MapKey` row and its typed row, whose `keyText` fields alone refuse it
 * (their parts' types bound no length), so it is refused under "Key text bound" only; and a key its
 * base type's typed form does not hold has no typed row, as the typed relations' mirrors select. A
 * table entry, and a table with a `default-value`, has its `LookupValue` row, with its table's
 * declaration. Each of a mapping, a map key and a lookup value has its row beside its declaration's
 * base type, where the declaration has one, and only there; a record's has none, so its keys and
 * values are read in no base type and have no typed row.
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
  // Each declaration with a `Declaration` row, as that row holds it (`declaredFieldsOf`): a
  // table hangs only below one, and copies it; one with no row has no table rows either, as its
  // own law refuses it alone (lane NIL's audit, B11).
  const declarations = new Map(
    rows.nodes.flatMap((node) =>
      Option.toArray(declaredFieldsOf(node.kind, (name) => valueOf(node.id, name))).map(
        (declared): readonly [NodeId, DeclaredFields] => [node.id, declared],
      ),
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
    MapKeyFloat: new Map(),
    MapKeyInteger: new Map(),
    MapKeyPair: new Map(),
    MapKeyPoint: new Map(),
  };
  const mappings = new Map<string, Addition<typeof Mapping>>();
  const lookupTables = new Map<string, Addition<typeof LookupTable>>();

  for (const node of rows.nodes) {
    for (const declaration of Option.toArray(Option.fromNullishOr(declarations.get(node.parent)))) {
      const declared = { ...tupleOf(node), ...copyOf(declaration), declaration: node.parent };
      if (node.kind === "qti-mapping") {
        mappings.set(node.id, declared);
        for (const baseType of Option.toArray(declaration.baseType)) {
          mappingBaseTypes.set(node.id, { baseType, declaration: node.parent, node: node.id });
        }
      } else if (node.kind === "qti-area-mapping") {
        areaMappings.set(node.id, declared);
      } else if (node.kind === "qti-match-table" || node.kind === "qti-interpolation-table") {
        lookupTables.set(node.id, declared);
      }
    }

    const lookupAttribute = lookupAttributeOf.get(node.kind);
    const lookupValue =
      lookupAttribute === undefined ? undefined : valueOf(node.id, lookupAttribute);
    const table = lookupAttribute === "default-value" ? node : byId.get(node.parent);
    const tableDeclaration = table === undefined ? undefined : declarations.get(table.parent);
    if (lookupValue !== undefined && table !== undefined && tableDeclaration !== undefined) {
      lookupValues.set(node.id, {
        ...tupleOf(node),
        baseTypes: baseTypesOf(tableDeclaration.baseType),
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
      baseTypes: baseTypesOf(mappingDeclaration.baseType),
      key,
      mapping: node.parent,
    });
    for (const baseType of Option.toArray(mappingDeclaration.baseType)) {
      mapKeyTypes.set(node.id, { baseType, key, mapping: node.parent, node: node.id });
      addTypedKey(typed, baseType, { key, mapping: node.parent, node: node.id });
    }
  }

  return {
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
