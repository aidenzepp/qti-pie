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
import { interactionKinds } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { collapse, lowerAscii } from "#pantry/import/overlays/metadata.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { booleanTrue } from "#pantry/grammar/domains.ts";
import {
  floatKeyPattern,
  integerKeyPattern,
  pairKeyPattern,
  pointKeyPattern,
} from "#pantry/qti/mapping.ts";
import type {
  AreaMapping,
  InterpolationTable,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
  MatchTable,
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
  readonly InterpolationTable: ReadonlyMap<string, Addition<typeof InterpolationTable>>;
  readonly LookupValue: ReadonlyMap<string, Addition<typeof LookupValue>>;
  readonly MapKey: ReadonlyMap<string, Addition<typeof MapKey>>;
  readonly MapKeyDirectedPair: ReadonlyMap<string, Addition<typeof MapKeyDirectedPair>>;
  readonly MapKeyFloat: ReadonlyMap<string, Addition<typeof MapKeyFloat>>;
  readonly MapKeyInteger: ReadonlyMap<string, Addition<typeof MapKeyInteger>>;
  readonly MapKeyPair: ReadonlyMap<string, Addition<typeof MapKeyPair>>;
  readonly MapKeyPoint: ReadonlyMap<string, Addition<typeof MapKeyPoint>>;
  readonly Mapping: ReadonlyMap<string, Addition<typeof Mapping>>;
  readonly MatchTable: ReadonlyMap<string, Addition<typeof MatchTable>>;
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
 * A `DeclarationKind` handle.
 */
type DeclarationKindHandle = Addition<typeof Mapping>["declarationKind"];

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The map keys of an integer mapping that hold a typed value, as `integerKeys` selects them.
 */
const integerKey = new RegExp(integerKeyPattern, "u");

/**
 * The map keys of a float mapping that hold a typed value, as `floatKeys` selects them.
 */
const floatKey = new RegExp(floatKeyPattern, "u");

/**
 * The map keys of a point mapping that hold a typed value, as `pointKeys` selects them.
 */
const pointKey = new RegExp(pointKeyPattern, "u");

/**
 * The map keys of a pair or directed pair mapping that hold a typed value, as `pairKeys` and
 * `directedPairKeys` select them.
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
 * @returns The parts, or none for a key that is no member of {@link integerKeyPattern}.
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
 * @returns The parts, or none for a key that is no member of {@link pointKeyPattern}.
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
const addTypedKey = (
  typed: TypedKeys,
  baseType: BaseTypeHandle,
  entry: { readonly key: string; readonly mapping: NodeId; readonly node: NodeId },
): void => {
  const { key, node } = entry;
  const integer = baseType === "integer" && integerKey.test(key) ? integerValueOf(key) : undefined;
  const point = baseType === "point" && pointKey.test(key) ? pointValueOf(key) : undefined;
  const pair = baseType === "pair" && pairKey.test(key) ? pairValueOf(key) : undefined;
  const directed =
    baseType === "directedPair" && pairKey.test(key) ? directedPairValueOf(key) : undefined;

  if (integer !== undefined) {
    typed.MapKeyInteger.set(node, { ...integer, ...entry });
  }

  if (baseType === "float" && floatKey.test(key)) {
    typed.MapKeyFloat.set(node, { ...entry, value: floatValueOf(key) });
  }

  if (point !== undefined) {
    typed.MapKeyPoint.set(node, { ...point, ...entry });
  }

  if (pair !== undefined) {
    typed.MapKeyPair.set(node, { ...pair, ...entry });
  }

  if (directed !== undefined) {
    typed.MapKeyDirectedPair.set(node, { ...directed, ...entry });
  }
};

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * itself; a child of an interaction's is that interaction; every other node's is its parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's own, its context's (spec reading 117); itself where
 *   none is given.
 * @returns Each node's nearest interaction, by its id.
 */
const nearestOf = (
  nodes: readonly NodeRow<Composed>[],
  rootNearest: NodeId | undefined,
): ReadonlyMap<NodeId, NodeId> => {
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();

  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    const parentKind = kinds.get(node.parent) ?? "";
    nearest.set(
      node.id,
      interactions.has(parentKind) ? node.parent : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

/**
 * Build the mapping overlays' rows of one document.
 *
 * A declared overlay copies its parent's declaration fields as `Declaration`'s builder writes them
 * (`#pantry/import/overlays/declarations.ts` `declaredFieldsOf`). A parent that is no declaration,
 * which the content model never admits, takes the response declaration's kind, so the copy is one
 * no `Declaration` row holds, and the database refuses it.
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
  const nearest = nearestOf(rows.nodes, ids.context?.nearest);
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
    nearest: nearest.get(node.id) ?? document,
    node: node.id,
    start: node.start,
    version: node.version,
  });
  const declarationOf = (node: NodeRow<Composed>): DeclarationCopy => {
    const { declarationKind, ...fields } = declaredFieldsOf(
      byId.get(node.parent)?.kind ?? "",
      (name) => valueOf(node.parent, name),
    );

    return {
      ...fields,
      declarationKind: Option.getOrElse(
        declarationKind,
        (): DeclarationKindHandle => "qti-response-declaration",
      ),
    };
  };

  const areaMappings = new Map<string, Addition<typeof AreaMapping>>();
  const interpolationTables = new Map<string, Addition<typeof InterpolationTable>>();
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
  const matchTables = new Map<string, Addition<typeof MatchTable>>();

  for (const node of rows.nodes) {
    const declared = () => ({
      ...tupleOf(node),
      ...declarationOf(node),
      declaration: node.parent,
    });

    if (node.kind === "qti-mapping") {
      mappings.set(node.id, declared());
    } else if (node.kind === "qti-area-mapping") {
      areaMappings.set(node.id, declared());
    } else if (node.kind === "qti-match-table") {
      matchTables.set(node.id, declared());
    } else if (node.kind === "qti-interpolation-table") {
      interpolationTables.set(node.id, declared());
    }

    const lookupAttribute = lookupAttributeOf.get(node.kind);
    const lookupValue =
      lookupAttribute === undefined ? undefined : valueOf(node.id, lookupAttribute);
    const table = lookupAttribute === "default-value" ? node : byId.get(node.parent);
    if (lookupValue !== undefined && table !== undefined) {
      lookupValues.set(node.id, {
        ...tupleOf(node),
        baseType: declarationOf(table).baseType,
        parent: node.parent,
        value: lookupValue,
      });
    }

    const key = node.kind === "qti-map-entry" ? valueOf(node.id, "map-key") : undefined;
    const mapping = byId.get(node.parent);
    if (key === undefined || mapping === undefined) {
      continue;
    }

    const { baseType } = declarationOf(mapping);
    const caseText = valueOf(node.id, "case-sensitive") ?? "";
    const folded =
      baseType === "string" && !booleanTrue.some((form) => form === collapse(caseText));
    mapKeys.set(node.id, {
      ...tupleOf(node),
      baseType,
      caseText,
      folded,
      key,
      mapping: node.parent,
      matched: folded ? lowerAscii(key) : key,
    });

    addTypedKey(typed, baseType, { key, mapping: node.parent, node: node.id });
  }

  return {
    AreaMapping: areaMappings,
    InterpolationTable: interpolationTables,
    LookupValue: lookupValues,
    MapKey: mapKeys,
    ...typed,
    Mapping: mappings,
    MatchTable: matchTables,
  };
};
