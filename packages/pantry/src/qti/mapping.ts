/**
 * The response mappings and the lookup tables (plan §1.7 O5; the W5 amendment's C2, C17 and C18,
 * with the tier-1 addendum's G-parse and "Text in keys" and the orchestrator's rulings of
 * 2026-11-06).
 *
 * Each overlay is a flat row keyed by its element's node, copying the node's {@link nodeRef} tuple
 * with its parent under its own name, and naming a node of its own kind:
 *
 * - {@link Mapping} (`qti-mapping`) and {@link AreaMapping} (`qti-area-mapping`), under a response
 *   declaration, and {@link LookupTable} (`qti-match-table` and `qti-interpolation-table`, its
 *   `kind` telling them apart), under an outcome declaration, each copy their declaration's
 *   `declarationRef` tuple, its counts of cardinalities and base types, never either value, and
 *   each has its row beside the declaration's cardinality, where it has one
 *   ({@link MappingCardinality}, {@link AreaMappingCardinality}, {@link LookupTableCardinality}),
 *   the row a law over its cardinality reads (spec reading 158);
 * - {@link MappingBaseType} holds a mapping's declaration's base type, where it has one (a record has
 *   none: lane NIL's audit, B12);
 * - {@link MapKey} (`qti-map-entry`) copies its mapping's `baseTypes` and its `map-key` from
 *   `Attribute` (C18), one row per entry, so two entries with one key are two facts the key law
 *   refuses rather than one fact that set semantics collapses (rows-first §0), and
 *   {@link MapKeyType} holds it beside its mapping's base type, where it has one;
 * - A map key's typed value, where it differs from its lexical form, is no stored row but a query
 *   (`#pantry/qti/queries.ts`): `MapKeyInteger` and `MapKeyFloat` parse an integer's and a float's
 *   key text, and `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair` read a two-item key's items
 *   from {@link MapKeyItems}, the one stored split of a point's, a pair's or a directed pair's key
 *   into its two items, mirrored with the keys of those base types written as two;
 * - {@link LookupValue} copies each table entry's `target-value` and each table's `default-value`
 *   with its table's declaration, and {@link LookupValueType} holds it beside the declaration's
 *   base type, where it has one.
 *
 * The laws, by the rule each states:
 *
 * - **`mapping-base-type`** (reading 78): a mapping is no record's ("cannot be applied to variables
 *   of record cardinality", information model §2.11.1.5), and its base type is in
 *   `MappableBaseType`, so `file` and `duration` are refused; an area mapping is no record's, and
 *   its base type is `point` (information model §5.5, "a mapping from a source set of point
 *   values"). A record has no base type, so its mapping is judged by its cardinality alone, where
 *   the declaration has one: a record declaration holds no mapping and no area mapping.
 * - **Map keys are distinct** (information model §5.88.4 and §7.21: "a set of mapEntries, each of
 *   which maps a single value from the source set onto a single float", so a mapping is a function
 *   of its source value): by their lexical forms, `key(mapping, key)`, and, for the base types
 *   whose values have several spellings, by their typed values, `key(mapping, value)`.
 * - **Lookup tables are of single outcomes** (§4.5.13: a lookup table maps a source value "to a
 *   single outcome value in the declared value set").
 * - **Typed attribute values** (`attribute-lexical`, readings 7 and 8): a map key, a table entry's
 *   target and a table's default are lexical forms of their base type, `BaseTypePattern`'s
 *   (`#pantry/qti/expression-types.ts`, the one source `qti-value` and `qti-base-value` are judged
 *   by), written with no whitespace around them unless the base type is `string`.
 *
 * A string's, identifier's and URI's value is its lexical form, whitespace included (reading 7), so
 * the lexical key is their typed key; a boolean is `true` or `false` alone (reading 34), so it is
 * too. Every check is named by its oracle law with spaces written as underscores.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping | QTI 3.0 information model, §5.88 Mapping}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  generated,
  key,
  mirrors,
  natural,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import {
  BaseType,
  Cardinality,
  DeclarationKind,
  MappableBaseType,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { booleanTrue } from "#pantry/grammar/domains.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import {
  DeclarationBaseType,
  DeclarationCardinality,
  declarationRef,
} from "#pantry/qti/declarations.ts";
import { BaseTypePattern } from "#pantry/qti/expression-types.ts";
import { keyText, keyTextBytes } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * `xs:integer`'s lexical space, an optional sign and digits: the map keys of an integer mapping
 * whose value the query `MapKeyInteger` (`#pantry/qti/queries.ts`) parses. Its language is the
 * integer base type's (reading 45: no integer is too long), inside grizzle's `decimalText`, and
 * `mapping.oracle.test.ts` holds it to the deleted schema's `xsInteger` with JavaScript's engine as
 * the oracle.
 */
export const integerKeyPattern = Compute.pattern("^[+-]?[0-9]+$");

/**
 * A two-item key as an attribute writes it: two runs of characters holding no XML whitespace, and
 * the one whitespace character between them, none around: the keys of a point, pair or directed
 * pair mapping whose split {@link MapKeyItems} holds. Each typed value's query judges its items:
 * a point's are two integers, a pair's and a directed pair's two runs of {@link itemPattern}, and
 * `Typed_attribute_value` judges the key's lexical form.
 */
export const twoItemPattern = Compute.pattern("^[^\\t\\n\\r ]+[\\t\\n\\r ][^\\t\\n\\r ]+$");

/**
 * One item of a pair or a directed pair: a run of XML `Char`s holding no whitespace, its
 * identifier's lexical form `Typed_attribute_value` judges: the items the queries `MapKeyPair`
 * and `MapKeyDirectedPair` (`#pantry/qti/queries.ts`) give a typed value.
 */
export const itemPattern = Compute.pattern(
  "^[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]+$",
);

/**
 * A text with no whitespace before or after it: an XML `Char` other than whitespace at each end,
 * any `Char`s between, or nothing. An attribute's typed value of every base type but `string` is
 * written so (reading 7), since `BaseTypePattern` reads a value as XML Schema's collapse leaves it,
 * outer whitespace absorbed.
 */
export const exactValuePattern = Compute.pattern(
  "^(?:[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}](?:[\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]*[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}])?)?$",
);

/**
 * A mapping's overlay, keyed by its `qti-mapping` node: its {@link nodeRef} tuple, its
 * `declaration` the node's parent, and the declaration's `declarationRef` tuple. The base type its
 * entries' keys are read in is its {@link MappingBaseType}'s, where `baseTypes` is 1.
 */
export const Mapping = relation(
  "Mapping",
  {
    baseTypes: natural,
    cardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A mapping's declaration's base type, keyed by its `qti-mapping` node, where the declaration has
 * one: `declaration`, its {@link Mapping}'s, and `baseType`, the declaration's
 * {@link DeclarationBaseType}'s. A record has none, and its mapping no row.
 */
export const MappingBaseType = relation(
  "MappingBaseType",
  { baseType: closedId(BaseType), declaration: uuid, node: uuid },
  ["node"],
);

/**
 * A map entry's overlay, keyed by its `qti-map-entry` node: its {@link nodeRef} tuple, its
 * `mapping` the node's parent, its mapping's `baseTypes`, and its `map-key` as written.
 *
 * It also holds how the key is matched (reading 98, §7.21.3): `caseText`, the entry's
 * `case-sensitive` as written, empty where it is unwritten; `folded`, whether a response is matched
 * to the key without regard to case, which is where the mapping's base type, its
 * {@link MapKeyType}'s, is `string` and the entry's `case-sensitive` is not true; and `matched`, the
 * key a response meets, the key's ASCII lowercase where `folded` and the key as written otherwise.
 */
export const MapKey = relation(
  "MapKey",
  {
    baseTypes: natural,
    caseText: keyText,
    document: uuid,
    folded: pg.boolean,
    key: keyText,
    kind: closedId(NodeKind),
    mapping: uuid,
    matched: keyText,
    nearest: uuid,
    node: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A map key beside the base type it is read in, keyed by its `qti-map-entry` node, where its
 * mapping's declaration has one: `mapping` and `key`, its {@link MapKey}'s, and `baseType`, its
 * mapping's {@link MappingBaseType}'s. The typed keys and `Typed_attribute_value` read it.
 */
export const MapKeyType = relation(
  "MapKeyType",
  { baseType: closedId(BaseType), key: keyText, mapping: uuid, node: uuid },
  ["node"],
);

/**
 * The one XML whitespace character between a point's or a pair's two items, as `BaseTypePattern`
 * reads them. Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const Gap = str.regex("^[\\t\\n\\r ]$");

/**
 * One of the two runs a two-item key splits into: characters holding no XML whitespace, of at most
 * {@link keyTextBytes} UTF-8 bytes, the most the key it is cut from holds, so a parse of it reads a
 * bounded text. Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const Run = str.bytes(keyTextBytes, str.regex("^[^\\t\\n\\r ]+$"));

/**
 * A two-item map key's split, keyed by its entry's node: its `key`, a point's, a pair's or a
 * directed pair's written as two runs and the one whitespace character between them
 * ({@link twoItemPattern}), its `mapping`, and its `first` run, the `gap` and its `second` run,
 * which the host writes and `E1_derived` proves.
 *
 * The split is the host's because no grizzle `Compute` term splits a text (no substring, split or
 * pattern group at the vendored commit; the gap is reported to grizzle, and the split waits on its
 * text-split term). Every typed value read from the items is the database's: the queries
 * `MapKeyPoint`, `MapKeyPair` and `MapKeyDirectedPair` (`#pantry/qti/queries.ts`) select the
 * items of their base type's form and read the value from them.
 */
export const MapKeyItems = relation.generated(
  "MapKeyItems",
  { first: Run, gap: Gap, key: keyText, mapping: uuid, node: uuid, second: Run },
  ["node"],
  (r) => ({
    ordered: generated(keyText, Compute.concat(Compute.concat(r.first, " "), r.second)),
    unordered: generated(
      keyText,
      Compute.concat(
        Compute.concat(Compute.least(r.first, r.second), " "),
        Compute.greatest(r.first, r.second),
      ),
    ),
  }),
);

/**
 * A lookup table's typed attribute value, keyed by the node that carries it: a
 * `qti-match-table-entry`'s or `qti-interpolation-table-entry`'s `target-value`, or a
 * `qti-match-table`'s or `qti-interpolation-table`'s `default-value`, as written, with its
 * {@link nodeRef} tuple and its table's `declaration` and `baseTypes`, the outcome declaration's.
 *
 * The value is copied (C18) because `Typed_attribute_value` reads it beside its declaration's base
 * type (reading 8), its {@link LookupValueType}'s; it is `keyText`, so a value past the key-text
 * bound is refused under that limit.
 */
export const LookupValue = relation(
  "LookupValue",
  {
    baseTypes: natural,
    declaration: uuid,
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    value: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A lookup table's typed attribute value beside the base type it is read in, keyed by the node that
 * carries it, where its outcome declaration has one: `declaration` and `value`, its
 * {@link LookupValue}'s, and `baseType`, the declaration's {@link DeclarationBaseType}'s.
 */
export const LookupValueType = relation(
  "LookupValueType",
  { baseType: closedId(BaseType), declaration: uuid, node: uuid, value: keyText },
  ["node"],
);

/**
 * An area mapping's overlay, keyed by its `qti-area-mapping` node: its {@link nodeRef} tuple and
 * its declaration's `declarationRef` tuple.
 */
export const AreaMapping = relation(
  "AreaMapping",
  {
    baseTypes: natural,
    cardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A lookup table's overlay, keyed by its node: a `qti-match-table` or a `qti-interpolation-table`,
 * which its {@link nodeRef} tuple's `kind` tells apart, and its outcome declaration's
 * `declarationRef` tuple, whose base type, where it has one, its targets and default value are
 * values of (reading 8).
 * The two tables differ in how their entries' sources match, which no law here reads: only each
 * entry's `target-value` and the table's `default-value` are modeled, so they are one shape.
 */
export const LookupTable = relation(
  "LookupTable",
  {
    baseTypes: natural,
    cardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A mapping beside its declaration's cardinality, keyed by its `qti-mapping` node, where the
 * declaration has one: `declaration`, its {@link Mapping}'s, and `cardinality`, the declaration's
 * `DeclarationCardinality`'s, which `MappableBaseType` holds to no record. A mapping of a
 * declaration with no cardinality has no row, and no law reads a cardinality it does not have
 * (spec reading 158).
 */
export const MappingCardinality = relation(
  "MappingCardinality",
  { cardinality: closedId(Cardinality), declaration: uuid, node: uuid },
  ["node"],
);

/**
 * An area mapping beside its declaration's cardinality, keyed by its `qti-area-mapping` node, where
 * the declaration has one, as {@link MappingCardinality} holds a mapping's: `AreaMapping_base_type`
 * holds it to no record.
 */
export const AreaMappingCardinality = relation(
  "AreaMappingCardinality",
  { cardinality: closedId(Cardinality), declaration: uuid, node: uuid },
  ["node"],
);

/**
 * A lookup table beside its outcome declaration's cardinality, keyed by its node, where the
 * declaration has one, as {@link MappingCardinality} holds a mapping's: `Lookup_table_cardinality`
 * holds it to single.
 */
export const LookupTableCardinality = relation(
  "LookupTableCardinality",
  { cardinality: closedId(Cardinality), declaration: uuid, node: uuid },
  ["node"],
);

/**
 * The kinds of this module's overlays.
 */
type OverlayKind =
  | "qti-area-mapping"
  | "qti-interpolation-table"
  | "qti-map-entry"
  | "qti-mapping"
  | "qti-match-table";

/**
 * Select the nodes of one kind, a constant selection: every containment into it references the one
 * `UNIQUE (id, kind)` on `Node` the document layer's arms share.
 *
 * @param kind - The kind.
 * @returns The selection.
 */
const nodesOf = (kind: OverlayKind) => select(Node, (n) => n.eq(n.kind, kind));

/**
 * The lookup tables' kinds, the kinds {@link LookupTable} holds.
 */
const lookupTableKinds = [
  "qti-interpolation-table",
  "qti-match-table",
] as const satisfies readonly OverlayKind[];

/**
 * The lookup table entries' kinds, each a child of its table.
 */
const lookupEntryKinds = ["qti-interpolation-table-entry", "qti-match-table-entry"] as const;

/**
 * The `map-key` of each `qti-map-entry`: the source of {@link MapKey}'s copy (C18), beside a key
 * over the same selection whose UNIQUE serves the copy's reverse probe, so no index holds the
 * attribute's lexical form (the addendum's "Text in keys"). The key holds already: an element has
 * one attribute of a name (AL2).
 */
const mapKeyAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.name, "map-key"), a.eq(a.kind, "qti-map-entry")),
);

/**
 * The `case-sensitive` of each `qti-map-entry`, the source of {@link MapKey}'s `caseText` copy,
 * beside a key over the same selection whose UNIQUE serves the copy's reverse probe.
 */
const caseAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.name, "case-sensitive"), a.eq(a.kind, "qti-map-entry")),
);

/**
 * The map keys matched without regard to case: each is a string mapping's ({@link stringKeys}).
 */
const foldedKeys = select(MapKey, (k) => k.eq(k.folded, true));

/**
 * The map keys of string mappings, by their {@link MapKeyType}: each is folded unless its entry's
 * `case-sensitive` is true ({@link foldedOrCaseKeys}).
 */
const stringKeys = select(MapKeyType, (k) => k.eq(k.baseType, "string"));

/**
 * The map keys folded or matched by code points because their entry's `case-sensitive` is true: a
 * string mapping's key is one of them, so a key that is neither is of no string mapping.
 */
const foldedOrCaseKeys = select(MapKey, (k) =>
  k.or(k.eq(k.folded, true), k.in(Compute.collapse(k.caseText), booleanTrue)),
);

/**
 * The map keys whose mapping's declaration has a base type: each has its {@link MapKeyType}, and
 * only these do.
 */
const typedMapKeys = select(MapKey, (k) => k.eq(k.baseTypes, 1n));

/**
 * The lookup values whose table's declaration has a base type: each has its
 * {@link LookupValueType}, and only these do.
 */
const typedLookupValues = select(LookupValue, (v) => v.eq(v.baseTypes, 1n));

/**
 * The map keys of point, pair and directed pair mappings written as two items: each has its
 * {@link MapKeyItems} row, and no other key does.
 */
const twoItemKeys = select(MapKeyType, (k) =>
  k.and(
    k.in(k.baseType, ["directedPair", "pair", "point"]),
    Compute.matches(k.key, twoItemPattern),
  ),
);

/**
 * The lookup tables' typed attribute values: each table entry's `target-value` and each table's
 * `default-value`, the source of {@link LookupValue}'s copy, beside its key (C18; AL2 makes it
 * hold).
 */
const lookupAttributes = select(Attribute, (a) =>
  a.or(
    a.and(
      a.eq(a.name, "target-value"),
      a.in(a.kind, ["qti-match-table-entry", "qti-interpolation-table-entry"]),
    ),
    a.and(
      a.eq(a.name, "default-value"),
      a.in(a.kind, ["qti-match-table", "qti-interpolation-table"]),
    ),
  ),
);

/**
 * Every statement over the mappings and lookup tables, each `check` named by its oracle law:
 *
 * - **the overlays:** each copies its node's {@link nodeRef} tuple, its parent under its own name,
 *   and names a node of its kind; a mapping and a map entry exist through the entry's `map-key`
 *   copy (a mapping holds at least one entry, N7), and the area mapping and the two tables through
 *   their kind's selection of `Node`, both ways; the four declared overlays copy their
 *   declaration's `declarationRef` tuple; a mapping's, an area mapping's and a lookup table's row
 *   beside its declaration's cardinality exists exactly where `cardinalities` is 1, copying the
 *   cardinality from the declaration's typed row; a mapping's {@link MappingBaseType}, a map key's
 *   {@link MapKeyType} and a lookup value's {@link LookupValueType} exist exactly where `baseTypes`
 *   is 1, each copying the base type from the declaration's typed row;
 * - **`mapping-base-type`:** a mapping and an area mapping are no record's (`MappableBaseType`,
 *   `AreaMapping_base_type`), judged where the declaration has a cardinality; a mapping's base type
 *   is in `MappableBaseType`, and an area mapping's is `point`, each judged where the declaration
 *   has one;
 * - **map keys:** the entry's mapping's `baseTypes`, its `map-key` copy, the lexical key, a two-item
 *   key's split mirrored with the keys written as two items and `E1_derived` over it, and
 *   `Typed_attribute_value` its lexical form; each typed key is a rule over its query
 *   (`#pantry/qti/queries.ts`);
 * - **`Lookup_table_cardinality`:** a match or interpolation table's outcome is single, judged where
 *   it has a cardinality;
 * - **lookup values:** each copies its node's tuple, its attribute and its table's declaration, and
 *   `Typed_attribute_value` judges it where the declaration has a base type.
 */
export const mappingLawsByName = {
  "AreaMapping base type": [
    check("AreaMapping_base_type", AreaMappingCardinality, (a) => a.ne(a.cardinality, "record")),
    contained(
      on(
        select(AreaMapping, (a) => a.eq(a.baseTypes, 1n)),
        "declaration",
      ),
      on(
        select(DeclarationBaseType, (b) => b.eq(b.baseType, "point")),
        "node",
      ),
    ),
  ],
  "DocumentId key": [
    key(on(mapKeyAttributes, "node")),
    key(on(caseAttributes, "node")),
    key(on(lookupAttributes, "node")),
  ],
  "E1 derived": [
    check("E1_derived", MapKey, (k) =>
      k.or(
        k.and(
          k.eq(k.folded, true),
          k.not(k.in(Compute.collapse(k.caseText), booleanTrue)),
          k.eq(k.matched, Compute.lowerAscii(k.key)),
        ),
        k.and(k.eq(k.folded, false), k.eq(k.matched, k.key)),
      ),
    ),
    contained(on(foldedKeys, "node"), on(stringKeys, "node")),
    contained(on(stringKeys, "node"), on(foldedOrCaseKeys, "node")),
    check("E1_derived", MapKeyItems, (m) =>
      m.eq(m.key, Compute.concat(Compute.concat(m.first, m.gap), m.second)),
    ),
  ],
  "Lookup table cardinality": [
    check("Lookup_table_cardinality", LookupTableCardinality, (t) => t.eq(t.cardinality, "single")),
  ],
  "Map key": [key(on(MapKey, "mapping", "key"))],
  MappableBaseType: [
    check("MappableBaseType", MappingCardinality, (m) => m.ne(m.cardinality, "record")),
    contained(on(MappingBaseType, "baseType"), on(MappableBaseType, "baseType")),
  ],
  "Mapping overlay": [
    contained(
      on(Mapping, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    contained(on(Mapping, "node"), on(nodesOf("qti-mapping"), "id")),
    contained(
      on(Mapping, "declaration", "document", "declarationKind", "cardinalities", "baseTypes"),
      declarationRef,
    ),
    contained(
      on(
        select(Mapping, (m) => m.eq(m.cardinalities, 1n)),
        "node",
      ),
      on(MappingCardinality, "node"),
    ),
    contained(on(MappingCardinality, "node", "declaration"), on(Mapping, "node", "declaration")),
    contained(
      on(MappingCardinality, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    contained(
      on(MapKey, "node", "document", "kind", "start", "nearest", "version", "mapping"),
      nodeRef,
    ),
    contained(
      on(
        select(Mapping, (m) => m.eq(m.baseTypes, 1n)),
        "node",
      ),
      on(MappingBaseType, "node"),
    ),
    contained(
      on(MappingBaseType, "node", "declaration"),
      on(
        select(Mapping, (m) => m.eq(m.baseTypes, 1n)),
        "node",
        "declaration",
      ),
    ),
    contained(
      on(MappingBaseType, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "baseType"),
    ),
    contained(on(MapKey, "node"), on(nodesOf("qti-map-entry"), "id")),
    contained(on(MapKey, "mapping", "baseTypes"), on(Mapping, "node", "baseTypes")),
    contained(on(typedMapKeys, "node"), on(MapKeyType, "node")),
    contained(on(MapKeyType, "node", "mapping", "key"), on(typedMapKeys, "node", "mapping", "key")),
    contained(on(MapKeyType, "mapping", "baseType"), on(MappingBaseType, "node", "baseType")),
    contained(on(mapKeyAttributes, "node", "lexical"), on(MapKey, "node", "key")),
    contained(on(caseAttributes, "node", "lexical"), on(MapKey, "node", "caseText")),
    contained(
      on(
        select(MapKey, (k) => k.ne(k.caseText, "")),
        "node",
      ),
      on(caseAttributes, "node"),
    ),
    mirrors(on(twoItemKeys, "node", "mapping", "key"), on(MapKeyItems, "node", "mapping", "key")),
    contained(
      on(AreaMapping, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    mirrors(on(AreaMapping, "node"), on(nodesOf("qti-area-mapping"), "id")),
    contained(
      on(AreaMapping, "declaration", "document", "declarationKind", "cardinalities", "baseTypes"),
      declarationRef,
    ),
    contained(
      on(
        select(AreaMapping, (a) => a.eq(a.cardinalities, 1n)),
        "node",
      ),
      on(AreaMappingCardinality, "node"),
    ),
    contained(
      on(AreaMappingCardinality, "node", "declaration"),
      on(AreaMapping, "node", "declaration"),
    ),
    contained(
      on(AreaMappingCardinality, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    contained(
      on(LookupTable, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    mirrors(
      on(LookupTable, "node"),
      on(
        select(Node, (n) => n.in(n.kind, lookupTableKinds)),
        "id",
      ),
    ),
    contained(
      on(LookupTable, "declaration", "document", "declarationKind", "cardinalities", "baseTypes"),
      declarationRef,
    ),
    contained(
      on(
        select(LookupTable, (t) => t.eq(t.cardinalities, 1n)),
        "node",
      ),
      on(LookupTableCardinality, "node"),
    ),
    contained(
      on(LookupTableCardinality, "node", "declaration"),
      on(LookupTable, "node", "declaration"),
    ),
    contained(
      on(LookupTableCardinality, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    contained(
      on(LookupValue, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(lookupAttributes, "node", "lexical"), on(LookupValue, "node", "value")),
    contained(on(LookupValue, "node"), on(lookupAttributes, "node")),
    contained(
      on(
        select(LookupValue, (v) => v.in(v.kind, lookupEntryKinds)),
        "parent",
        "baseTypes",
        "declaration",
      ),
      on(LookupTable, "node", "baseTypes", "declaration"),
    ),
    contained(
      on(
        select(LookupValue, (v) => v.in(v.kind, lookupTableKinds)),
        "node",
        "baseTypes",
        "declaration",
      ),
      on(LookupTable, "node", "baseTypes", "declaration"),
    ),
    contained(on(typedLookupValues, "node"), on(LookupValueType, "node")),
    contained(
      on(LookupValueType, "node", "declaration", "value"),
      on(typedLookupValues, "node", "declaration", "value"),
    ),
    contained(
      on(LookupValueType, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "baseType"),
    ),
  ],
  "Typed attribute value": [
    check("Typed_attribute_value", MapKeyType, (k) =>
      k.and(
        Compute.matches(k.key, BaseTypePattern.at("pattern", k.baseType)),
        k.or(k.eq(k.baseType, "string"), Compute.matches(k.key, exactValuePattern)),
      ),
    ),
    check("Typed_attribute_value", LookupValueType, (v) =>
      v.and(
        Compute.matches(v.value, BaseTypePattern.at("pattern", v.baseType)),
        v.or(v.eq(v.baseType, "string"), Compute.matches(v.value, exactValuePattern)),
      ),
    ),
  ],
} as const;

/**
 * {@link mappingLawsByName}'s statements in one list, the module's laws as the schema composes them.
 */
export const mappingLaws = Object.values(mappingLawsByName).flat();
