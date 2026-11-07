/**
 * The mapping overlays' rows (plan §1.7 O5, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/mapping.ts` declares,
 * each relation's rows a keyed set by its element's node.
 *
 * The rows restate what the tree says and nothing else: each overlay's node tuple, its parent, its
 * declaration's `declarationRef` tuple as `#pantry/qti/declarations.ts` derives it, each map
 * entry's `map-key` as written, each key's typed value where its base type has one, and each
 * lookup table's typed attribute values beside its base type. The database proves every one of
 * them (`mappingLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { DocumentContext } from "#pantry/import/context.ts";
import { declaredFieldsOf } from "#pantry/import/overlays/declarations.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { lowerAscii } from "#pantry/import/overlays/metadata.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { booleanTrue, collapse } from "#pantry/grammar/domains.ts";
import { floatKeyPattern, pairKeyPattern } from "#pantry/qti/mapping.ts";
import type {
  AreaMapping,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
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
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's mapping rows, one keyed set per relation: each map from the text of a row's key,
 * its element's node id, to the row as its writer writes it.
 */
export interface MappingRows {
  readonly AreaMapping: ReadonlyMap<string, Addition<typeof AreaMapping>>;
  readonly LookupValue: ReadonlyMap<string, Addition<typeof LookupValue>>;
  readonly MapKey: ReadonlyMap<string, Addition<typeof MapKey>>;
  readonly MapKeyDirectedPair: ReadonlyMap<string, Addition<typeof MapKeyDirectedPair>>;
  readonly MapKeyFloat: ReadonlyMap<string, Addition<typeof MapKeyFloat>>;
  readonly MapKeyInteger: ReadonlyMap<string, Addition<typeof MapKeyInteger>>;
  readonly MapKeyPair: ReadonlyMap<string, Addition<typeof MapKeyPair>>;
  readonly MapKeyPoint: ReadonlyMap<string, Addition<typeof MapKeyPoint>>;
  readonly Mapping: ReadonlyMap<string, Addition<typeof Mapping>>;
  readonly LookupTable: ReadonlyMap<string, Addition<typeof LookupTable>>;
}

/**
 * The fields a declared overlay copies from its declaration, `declarationRef`'s less its node and
 * document.
 */
type DeclarationCopy = Pick<
  Addition<typeof Mapping>,
  "baseType" | "cardinality" | "declarationKind" | "identifier"
>;

/**
 * A `BaseType` handle.
 */
type BaseTypeHandle = Addition<typeof Mapping>["baseType"];

/**
 * The map keys of a float mapping that hold a typed value, as `floatKeys` selects them.
 */
const floatKey = new RegExp(floatKeyPattern, "u");

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
 * The parts of an integer map key's typed value, as {@link MapKeyInteger} holds them.
 */
type IntegerParts = Pick<
  Addition<typeof MapKeyInteger>,
  "digits" | "negative" | "sign" | "value" | "zeros"
>;

/**
 * Whether a text is a run of zeros, the language of `MapKeyInteger.zeros`.
 *
 * @param text - The text.
 * @returns Whether it holds `0` alone, or nothing.
 */
const isZeros = (text: string): text is IntegerParts["zeros"] => /^0*$/u.test(text);

/**
 * Whether a text is an integer's magnitude with no leading zero, the language of
 * `MapKeyInteger.digits`.
 *
 * @param text - The text.
 * @returns Whether it is `0` or starts with a nonzero digit, digits alone.
 */
const isDigits = (text: string): text is IntegerParts["digits"] =>
  /^(?:0|[1-9][0-9]*)$/u.test(text);

/**
 * The float map keys of grizzle's form that name their double: PostgreSQL's cast reads them, and
 * JavaScript's `Number` reads none of them as that double.
 */
const namedFloats: ReadonlyMap<string, number> = new Map([
  ["-INF", Number.NEGATIVE_INFINITY],
  ["INF", Number.POSITIVE_INFINITY],
  ["NaN", Number.NaN],
]);

/**
 * Read a float map key of grizzle's `double precision` form as the double PostgreSQL's cast reads
 * it, the value `E1_derived` holds `MapKeyFloat.value` to: `INF`, `-INF` and `NaN` by name, which
 * the cast reads and JavaScript's `Number` does not, and every other key by `Number`, which reads
 * the form's sign, point, exponent and padding zeros as the cast does and rounds the decimal to the
 * nearest double.
 *
 * ECMAScript requires that rounding only for up to 20 significant digits (§7.1.4.1.1,
 * RoundMVResult), and the form admits 30; V8, which Node runs, rounds every decimal correctly, as
 * PostgreSQL's `strtod` does. Were an engine to round otherwise, `E1_derived` would refuse the row
 * rather than store a wrong value.
 *
 * @param key - A member of {@link floatKeyPattern}.
 * @returns Its double.
 * @see {@link https://tc39.es/ecma262/#sec-roundmvresult | ECMAScript, RoundMVResult}
 */
export const floatValueOf = (key: string): number => namedFloats.get(key) ?? Number(key);

/**
 * Split an integer map key into its typed value's parts: the sign, the leading zeros, the
 * magnitude, and its canonical form's sign, so `negative ‖ digits` is the canonical form XML
 * Schema gives the integer.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of `integerKeyPattern`
 *   (`#pantry/qti/mapping.ts`).
 */
export const integerValueOf = (key: string): IntegerParts | undefined => {
  const groups = integerParts.exec(key)?.groups;
  const zeros = groups?.["zeros"] ?? "";
  const digits = groups?.["digits"] ?? "";
  if (groups === undefined || !isZeros(zeros) || !isDigits(digits)) {
    return undefined;
  }

  const signs = { "": "", "+": "+", "-": "-" } as const;
  const sign = groups["sign"] === "-" || groups["sign"] === "+" ? signs[groups["sign"]] : signs[""];
  const negative = sign === "-" && digits !== "0" ? "-" : "";

  return { digits, negative, sign, value: `${negative}${digits}`, zeros };
};

/**
 * The whitespace between a point's or a pair's two items, as `Gap` types it.
 */
type GapText = Addition<typeof MapKeyPair>["gap"];

/**
 * Whether a text is one XML whitespace character, the language of `Gap`.
 *
 * @param text - The text.
 * @returns Whether it is one space, tab or line end.
 */
const isGap = (text: string): text is GapText => /^[\t\n\r ]$/u.test(text);

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
  const gap = groups?.["gap"] ?? "";
  const second = groups?.["second"];

  return first === undefined || !isGap(gap) || second === undefined
    ? undefined
    : { first, gap, second };
};

/**
 * Split a point map key into its typed value's parts: each integer's, as {@link integerValueOf}
 * splits one, the whitespace between them, and its canonical form, the two canonical integers with
 * one space between.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of `pointKeyPattern`
 *   (`#pantry/qti/mapping.ts`).
 */
export const pointValueOf = (
  key: string,
): Omit<Addition<typeof MapKeyPoint>, "key" | "mapping" | "node"> | undefined => {
  const items = itemsOf(key);
  const x = items === undefined ? undefined : integerValueOf(items.first);
  const y = items === undefined ? undefined : integerValueOf(items.second);
  if (items === undefined || x === undefined || y === undefined) {
    return undefined;
  }

  return {
    gap: items.gap,
    value: `${x.value} ${y.value}`,
    xDigits: x.digits,
    xNegative: x.negative,
    xSign: x.sign,
    xZeros: x.zeros,
    yDigits: y.digits,
    yNegative: y.negative,
    ySign: y.sign,
    yZeros: y.zeros,
  };
};

/**
 * Compare two texts by their code points, as PostgreSQL's `pg_c_utf8` collation orders a key's
 * text: JavaScript's `<` compares UTF-16 code units, which order a supplementary character below
 * U+E000 to U+FFFF.
 *
 * @param left - The first text.
 * @param right - The second.
 * @returns Whether the first sorts at or before the second.
 */
const atOrBefore = (left: string, right: string): boolean => {
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const a = left.codePointAt(i) ?? 0;
    const b = right.codePointAt(j) ?? 0;
    if (a !== b) {
      return a < b;
    }

    i += a > 0xff_ff ? 2 : 1;
    j += b > 0xff_ff ? 2 : 1;
  }

  return i >= left.length;
};

/**
 * Split a pair map key into its typed value's parts: its two items, the whitespace between them,
 * and its canonical form, the two in code-point order with one space between, since a pair is
 * undirected.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of {@link pairKeyPattern}.
 */
export const pairValueOf = (
  key: string,
): Omit<Addition<typeof MapKeyPair>, "key" | "mapping" | "node"> | undefined => {
  const items = itemsOf(key);
  if (items === undefined) {
    return undefined;
  }

  const { first, gap, second } = items;

  return {
    first,
    gap,
    second,
    value: atOrBefore(first, second) ? `${first} ${second}` : `${second} ${first}`,
  };
};

/**
 * Split a directed pair map key into its typed value's parts: its source and target, the
 * whitespace between them, and its canonical form, the two in order with one space between.
 *
 * @param key - The key.
 * @returns The parts, or none for a key that is no member of {@link pairKeyPattern}.
 */
export const directedPairValueOf = (
  key: string,
): Omit<Addition<typeof MapKeyDirectedPair>, "key" | "mapping" | "node"> | undefined => {
  const items = itemsOf(key);

  return items === undefined
    ? undefined
    : {
        gap: items.gap,
        source: items.first,
        target: items.second,
        value: `${items.first} ${items.second}`,
      };
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
 * the key holds a typed value, and the relation its row joins. A float key's test is its pattern,
 * since `Number` reads every text; a pair's is its pattern beside the parse ({@link pairKey}).
 */
const typedKeyAdders: Partial<
  Readonly<Record<BaseTypeHandle, (typed: TypedKeys, entry: TypedEntry) => void>>
> = {
  directedPair: (typed, entry) => {
    const directed = pairKey.test(entry.key) ? directedPairValueOf(entry.key) : undefined;
    if (directed !== undefined) {
      typed.MapKeyDirectedPair.set(entry.node, { ...directed, ...entry });
    }
  },
  float: (typed, entry) => {
    if (floatKey.test(entry.key)) {
      typed.MapKeyFloat.set(entry.node, { ...entry, value: floatValueOf(entry.key) });
    }
  },
  integer: (typed, entry) => {
    const integer = integerValueOf(entry.key);
    if (integer !== undefined) {
      typed.MapKeyInteger.set(entry.node, { ...integer, ...entry });
    }
  },
  pair: (typed, entry) => {
    const pair = pairKey.test(entry.key) ? pairValueOf(entry.key) : undefined;
    if (pair !== undefined) {
      typed.MapKeyPair.set(entry.node, { ...pair, ...entry });
    }
  },
  point: (typed, entry) => {
    const point = pointValueOf(entry.key);
    if (point !== undefined) {
      typed.MapKeyPoint.set(entry.node, { ...point, ...entry });
    }
  },
};

/**
 * Add a map key's typed row, where its base type gives it one and its key is of the form the
 * row's mirror selects: an integer's, a float of grizzle's double form, a point's two integers, or
 * a pair's or a directed pair's two items. Every other key has no typed row.
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
 * @param baseType - The entry's mapping's base type.
 * @param caseText - The entry's `case-sensitive`, where written.
 * @param key - The entry's `map-key`.
 * @returns The `MapKey` row's matching fields.
 */
const matchingOf = (baseType: BaseTypeHandle, caseText: string | undefined, key: string) => {
  const written = caseText ?? "";
  const folded = baseType === "string" && !booleanTrue.some((form) => form === collapse(written));

  return { caseText: written, folded, matched: folded ? lowerAscii(key) : key };
};

/**
 * Build the mapping overlays' rows of one document.
 *
 * A declared overlay copies its parent's declaration fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declaredFieldsOf`), and exists only below a
 * declaration with a `Declaration` row: a table below one with no row, or below no declaration,
 * which the content model never admits, has no row, and its parent's own law refuses it.
 *
 * A map entry's `MapKey` row also holds how its key is matched: its `case-sensitive` as written
 * (empty where unwritten), `folded` where its mapping is of strings and the value is not true, and
 * `matched`, the key's ASCII lowercase where `folded`.
 *
 * A map entry with no `map-key` has no `MapKey` row, and AL3 refuses the element. A key past the
 * key-text bound keeps its `MapKey` row and its typed row, whose `keyText` fields alone refuse it
 * (their parts' types bound no length), so it is refused under "Key text bound" only; and a key its
 * base type's typed form does not hold has no typed row, as the typed relations' mirrors select. A
 * table entry, and a table with a `default-value`, has its `LookupValue` row, its base type its
 * table's declaration's.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: MappingIds): MappingRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const folds = foldOf(rows.nodes, ids.context ?? ownContext(rows.document.node));
  const byId = new Map(rows.nodes.map((node) => [node.id, node]));
  const attributes = new Map<NodeId, Map<string, string>>();
  for (const { lexical, name, node } of rows.attributes) {
    const named = attributes.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    attributes.set(node, named);
  }

  const valueOf = (node: NodeId, name: string): string | undefined =>
    attributes.get(node)?.get(name);
  const tupleOf = (node: NodeRow<Composed>) => ({
    document,
    kind: node.kind,
    nearest: folds.get(node.id)?.nearest ?? document,
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
        (declared): readonly [NodeId, DeclarationCopy] => [node.id, declared],
      ),
    ),
  );

  const areaMappings = new Map<string, Addition<typeof AreaMapping>>();
  const lookupValues = new Map<string, Addition<typeof LookupValue>>();
  const mapKeys = new Map<string, Addition<typeof MapKey>>();
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
      const declared = { ...tupleOf(node), ...declaration, declaration: node.parent };
      if (node.kind === "qti-mapping") {
        mappings.set(node.id, declared);
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
    if (lookupValue !== undefined && tableDeclaration !== undefined) {
      lookupValues.set(node.id, {
        ...tupleOf(node),
        baseType: tableDeclaration.baseType,
        parent: node.parent,
        value: lookupValue,
      });
    }

    const key = node.kind === "qti-map-entry" ? valueOf(node.id, "map-key") : undefined;
    const mapping = byId.get(node.parent);
    const mappingDeclaration = mapping === undefined ? undefined : declarations.get(mapping.parent);
    if (key === undefined || mappingDeclaration === undefined) {
      continue;
    }

    const { baseType } = mappingDeclaration;
    mapKeys.set(node.id, {
      ...tupleOf(node),
      ...matchingOf(baseType, valueOf(node.id, "case-sensitive"), key),
      baseType,
      key,
      mapping: node.parent,
    });

    addTypedKey(typed, baseType, { key, mapping: node.parent, node: node.id });
  }

  return {
    AreaMapping: areaMappings,
    LookupTable: lookupTables,
    LookupValue: lookupValues,
    MapKey: mapKeys,
    ...typed,
    Mapping: mappings,
  };
};
