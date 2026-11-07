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
 *   `declarationRef` tuple, so the cardinality they are read in is the declaration's code (C17's
 *   proof is the declaration's own), and whether it has a base type, `baseTypes`;
 * - {@link MappingBaseType} holds a mapping's declaration's base type, where it has one (a record has
 *   none: lane NIL's audit, B12);
 * - {@link MapKey} (`qti-map-entry`) copies its mapping's `baseTypes` and its `map-key` from
 *   `Attribute` (C18), one row per entry, so two entries with one key are two facts the key law
 *   refuses rather than one fact that set semantics collapses (rows-first §0), and
 *   {@link MapKeyType} holds it beside its mapping's base type, where it has one;
 * - {@link MapKeyInteger}, {@link MapKeyFloat}, {@link MapKeyPoint}, {@link MapKeyPair} and
 *   {@link MapKeyDirectedPair} hold a map key's typed value where it differs from its lexical form,
 *   each a row of its own relation keyed by the entry's node and mirrored with the map keys of its
 *   base type (the addendum's `MapKeyInteger` pattern), its `value` a field PostgreSQL generates
 *   from the key's text;
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
 *   values"). A record has no base type, so its mapping is judged by its cardinality alone.
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
import { DeclarationBaseType, declarationRef } from "#pantry/qti/declarations.ts";
import { BaseTypePattern } from "#pantry/qti/expression-types.ts";
import { keyText, keyTextBytes } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { doublePattern } from "#pantry/qti/operators.ts";

/**
 * `xs:integer`'s lexical space, an optional sign and digits: the map keys of an integer mapping
 * whose value {@link MapKeyInteger} holds. Its language is the integer base type's (reading 45: no
 * integer is too long), and `mapping.oracle.test.ts` holds it to the deleted schema's `xsInteger`
 * with JavaScript's engine as the oracle.
 */
export const integerKeyPattern = "^[+-]?[0-9]+$";

/**
 * A point's lexical form as an attribute writes it: two integers and the one whitespace character
 * between them, as `BaseTypePattern`'s point row reads it, none around (reading 7): the map keys of
 * a point mapping whose value {@link MapKeyPoint} holds.
 */
export const pointKeyPattern = "^[+-]?[0-9]+[\\t\\n\\r ][+-]?[0-9]+$";

/**
 * A pair's or a directed pair's lexical form as an attribute writes it: two runs of non-space
 * `Char`s and the one whitespace character between them, none around: the map keys whose value
 * {@link MapKeyPair} or {@link MapKeyDirectedPair} holds. That each run is an identifier is
 * `Typed_attribute_value`'s to judge.
 */
export const pairKeyPattern =
  "^[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]+[\\t\\n\\r ][\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]+$";

/**
 * A text with no whitespace before or after it: an XML `Char` other than whitespace at each end,
 * any `Char`s between, or nothing. An attribute's typed value of every base type but `string` is
 * written so (reading 7), since `BaseTypePattern` reads a value as XML Schema's collapse leaves it,
 * outer whitespace absorbed.
 */
export const exactValuePattern =
  "^(?:[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}](?:[\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]*[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}])?)?$";

/**
 * A mapping's overlay, keyed by its `qti-mapping` node: its {@link nodeRef} tuple, its
 * `declaration` the node's parent, and the declaration's `declarationRef` tuple. The base type its
 * entries' keys are read in is its {@link MappingBaseType}'s, where `baseTypes` is 1.
 */
export const Mapping = relation(
  "Mapping",
  {
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
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
 * An optional sign, as an integer's lexical form begins. Exported for `src/import/refusal.ts`,
 * which names its pattern law.
 */
export const Sign = str.regex("^[+-]?$");

/**
 * The leading zeros of an integer's lexical form. Exported for `src/import/refusal.ts`, which
 * names its pattern law.
 */
export const Zeros = str.regex("^0*$");

/**
 * An integer's magnitude with no leading zero: `0`, or a nonzero digit and any digits. Exported for
 * `src/import/refusal.ts`, which names its pattern law.
 */
export const Digits = str.regex("^(?:0|[1-9][0-9]*)$");

/**
 * The sign of an integer's canonical form: `-` for a negative value, empty otherwise. Exported for
 * `src/import/refusal.ts`, which names its pattern law.
 */
export const Negative = str.regex("^-?$");

/**
 * The one XML whitespace character between a point's or a pair's two items, as `BaseTypePattern`
 * reads them. Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const Gap = str.regex("^[\\t\\n\\r ]$");

/**
 * One item of a pair or a directed pair: a run of XML `Char`s holding no whitespace, its
 * identifier's lexical form `Typed_attribute_value` judges. Exported for `src/import/refusal.ts`,
 * which names its pattern law.
 */
export const Item = str.regex("^[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]+$");

/**
 * An integer map key's typed value, keyed by its entry's node: its key split into `sign`, `zeros`
 * and `digits`, which the host writes and `E1_derived` proves, and two fields PostgreSQL generates
 * from them: `negative`, `-` for a negative integer and empty otherwise, and `value`, the canonical
 * form XML Schema gives `xs:integer` (no `+`, no leading zero, `0` unsigned), `negative ‖ digits`.
 *
 * Two keys name one integer exactly when their canonical forms are equal, so `key(mapping, value)`
 * is uniqueness by typed value at any length the key text holds (reading 45: an integer has no
 * largest value), compared by the write's own statement at the value PostgreSQL stores. A cast
 * would bound it: grizzle's lexical form of `numeric(p, 0)` holds at most 256 digits
 * (`scalar/lexical.ts` `decimalWritable`, `regexMaxRepeat`).
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#integer | XML Schema Part 2, §3.3.13 integer}
 */
export const MapKeyInteger = relation.generated(
  "MapKeyInteger",
  { digits: Digits, key: keyText, mapping: uuid, node: uuid, sign: Sign, zeros: Zeros },
  ["node"],
  (r) => {
    const negative = Compute.cond(
      Compute.and(Compute.eq(r.sign, "-"), Compute.ne(r.digits, "0")),
      Compute.literal(Negative, "-"),
      "",
    );

    return {
      negative: generated(Negative, negative),
      value: generated(keyText, Compute.concat(negative, r.digits)),
    };
  },
);

/**
 * The text type of a float map key: `xs:double`'s lexical space as an attribute writes it
 * (`doublePattern` of `#pantry/qti/operators.ts`, XML Schema 1.0's, reading 71's edition, so `+INF`
 * is outside it), every key of which has the value {@link MapKeyFloat} holds (reading 154), and
 * whose language lies inside grizzle's `doubleText`, so `Compute.parseDouble` reads it total; of at
 * most {@link keyTextBytes} UTF-8 bytes, as the {@link MapKeyType} copy it mirrors is, since the
 * key sits in the mirror's UNIQUE. Exported for `src/import/refusal.ts`, which names its pattern
 * law.
 */
export const FloatKey = str.bytes(keyTextBytes, str.regex(doublePattern));

/**
 * A float map key's typed value, keyed by its entry's node: `value`, the double its key names,
 * which PostgreSQL generates by grizzle's `Compute.parseDouble`, XML Schema 1.1's doubleLexicalMap
 * (Part 2 §3.3.5.2, reading 144): the decimal rounded once to the nearest double, ties to even, of
 * any digits and any exponent, an infinity of its sign at or past the overflow threshold and a zero
 * of its sign at or below half the least subnormal.
 *
 * Every key of a float mapping in the lexical space has one (reading 154), so `key(mapping, value)`
 * compares every float key by its value: `1`, `1.0` and `10e-1` are one value, `1e400`, `2e400`
 * and `INF` another, and `0`, `-0` and `1e-400` a third. PostgreSQL's `float8` equality, which the
 * key's UNIQUE compares by, holds -0 equal to 0 and NaN equal to NaN, as an identity constraint
 * compares two keys "equal or identical" (XML Schema 1.1 Part 1 §3.11.4).
 */
export const MapKeyFloat = relation.generated(
  "MapKeyFloat",
  { key: FloatKey, mapping: uuid, node: uuid },
  ["node"],
  (r) => ({
    value: generated(pg["double precision"], Compute.parseDouble(r.key)),
  }),
);

/**
 * A point map key's typed value, keyed by its entry's node: its key split into its two integers'
 * parts, as {@link MapKeyInteger} splits one, and the whitespace between them, which the host
 * writes and `E1_derived` proves, and three fields PostgreSQL generates from them: `xNegative` and
 * `yNegative`, each integer's canonical sign, and `value`, the two canonical integers with one
 * space between, `xNegative ‖ xDigits ‖ " " ‖ yNegative ‖ yDigits`.
 *
 * A point is "an integer tuple" (information model §8.13), so two keys name one point exactly when
 * their canonical forms are equal, and `key(mapping, value)` is uniqueness by typed value: `1 2`,
 * `01 +2` and `1`, a tab, `2` are one point.
 */
export const MapKeyPoint = relation.generated(
  "MapKeyPoint",
  {
    gap: Gap,
    key: keyText,
    mapping: uuid,
    node: uuid,
    xDigits: Digits,
    xSign: Sign,
    xZeros: Zeros,
    yDigits: Digits,
    ySign: Sign,
    yZeros: Zeros,
  },
  ["node"],
  (r) => {
    const xNegative = Compute.cond(
      Compute.and(Compute.eq(r.xSign, "-"), Compute.ne(r.xDigits, "0")),
      Compute.literal(Negative, "-"),
      "",
    );
    const yNegative = Compute.cond(
      Compute.and(Compute.eq(r.ySign, "-"), Compute.ne(r.yDigits, "0")),
      Compute.literal(Negative, "-"),
      "",
    );

    return {
      value: generated(
        keyText,
        Compute.concat(
          Compute.concat(Compute.concat(Compute.concat(xNegative, r.xDigits), " "), yNegative),
          r.yDigits,
        ),
      ),
      xNegative: generated(Negative, xNegative),
      yNegative: generated(Negative, yNegative),
    };
  },
);

/**
 * A pair map key's typed value, keyed by its entry's node: its key split into its two identifiers
 * and the whitespace between them, which the host writes and `E1_derived` proves, and `value`,
 * which PostgreSQL generates from them: the two in code-point order with one space between.
 *
 * A pair's association "is undirected so (A,B) and (B,A) are equivalent" (information model §8.13),
 * so `key(mapping, value)` is uniqueness by typed value: `A B`, `B A` and `A`, a tab, `B` are one
 * pair. Text compares by code point here, its collation `pg_c_utf8`.
 */
export const MapKeyPair = relation.generated(
  "MapKeyPair",
  { first: Item, gap: Gap, key: keyText, mapping: uuid, node: uuid, second: Item },
  ["node"],
  (r) => ({
    value: generated(
      keyText,
      Compute.cond(
        Compute.le(r.first, r.second),
        Compute.concat(Compute.concat(r.first, " "), r.second),
        Compute.concat(Compute.concat(r.second, " "), r.first),
      ),
    ),
  }),
);

/**
 * A directed pair map key's typed value, keyed by its entry's node: its key split into its source
 * and target identifiers and the whitespace between them, which the host writes and `E1_derived`
 * proves, and `value`, which PostgreSQL generates from them: the two in order with one space
 * between.
 *
 * A directed pair's association "is directed so (A,B) and (B,A) are not equivalent" (information
 * model §8.13), so its value keeps the order and reads its whitespace as one space: `A B` and `A`,
 * a tab, `B` are one directed pair, and `B A` another.
 */
export const MapKeyDirectedPair = relation.generated(
  "MapKeyDirectedPair",
  { gap: Gap, key: keyText, mapping: uuid, node: uuid, source: Item, target: Item },
  ["node"],
  (r) => ({
    value: generated(keyText, Compute.concat(Compute.concat(r.source, " "), r.target)),
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
    cardinality: closedId(Cardinality),
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
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
    cardinality: closedId(Cardinality),
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
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
 * The map keys of integer mappings: each has its {@link MapKeyInteger} row, and no other key does.
 */
const integerKeys = select(MapKeyType, (k) =>
  k.and(k.eq(k.baseType, "integer"), Compute.matches(k.key, integerKeyPattern)),
);

/**
 * The map keys of float mappings in `xs:double`'s lexical space: each has its {@link MapKeyFloat}
 * row, and no other key does.
 */
const floatKeys = select(MapKeyType, (k) =>
  k.and(k.eq(k.baseType, "float"), Compute.matches(k.key, doublePattern)),
);

/**
 * The map keys of point mappings written as two integers: each has its {@link MapKeyPoint} row,
 * and no other key does.
 */
const pointKeys = select(MapKeyType, (k) =>
  k.and(k.eq(k.baseType, "point"), Compute.matches(k.key, pointKeyPattern)),
);

/**
 * The map keys of pair mappings written as two items: each has its {@link MapKeyPair} row, and no
 * other key does.
 */
const pairKeys = select(MapKeyType, (k) =>
  k.and(k.eq(k.baseType, "pair"), Compute.matches(k.key, pairKeyPattern)),
);

/**
 * The map keys of directed pair mappings written as two items: each has its
 * {@link MapKeyDirectedPair} row, and no other key does.
 */
const directedPairKeys = select(MapKeyType, (k) =>
  k.and(k.eq(k.baseType, "directedPair"), Compute.matches(k.key, pairKeyPattern)),
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
 *   declaration's `declarationRef` tuple; a mapping's {@link MappingBaseType}, a map key's
 *   {@link MapKeyType} and a lookup value's {@link LookupValueType} exist exactly where `baseTypes`
 *   is 1, each copying the base type from the declaration's typed row;
 * - **`mapping-base-type`:** a mapping and an area mapping are no record's (`MappableBaseType`,
 *   `AreaMapping_base_type`), a mapping's base type is in `MappableBaseType`, and an area mapping's
 *   is `point`, each judged where the declaration has one;
 * - **map keys:** the entry's mapping's `baseTypes`, its `map-key` copy, the lexical key, each typed
 *   relation mirrored with its typed keys, `E1_derived` its split, and its typed key over the value
 *   PostgreSQL generates, and `Typed_attribute_value` its lexical form;
 * - **`Lookup_table_cardinality`:** a match or interpolation table's outcome is single;
 * - **lookup values:** each copies its node's tuple, its attribute and its table's declaration, and
 *   `Typed_attribute_value` judges it where the declaration has a base type.
 */
export const mappingLawsByName = {
  "AreaMapping base type": [
    check("AreaMapping_base_type", AreaMapping, (a) => a.ne(a.cardinality, "record")),
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
    check("E1_derived", MapKeyInteger, (m) =>
      m.eq(m.key, Compute.concat(Compute.concat(m.sign, m.zeros), m.digits)),
    ),
    check("E1_derived", MapKeyPoint, (m) =>
      m.eq(
        m.key,
        Compute.concat(
          Compute.concat(
            Compute.concat(
              Compute.concat(Compute.concat(Compute.concat(m.xSign, m.xZeros), m.xDigits), m.gap),
              m.ySign,
            ),
            m.yZeros,
          ),
          m.yDigits,
        ),
      ),
    ),
    check("E1_derived", MapKeyPair, (m) =>
      m.eq(m.key, Compute.concat(Compute.concat(m.first, m.gap), m.second)),
    ),
    check("E1_derived", MapKeyDirectedPair, (m) =>
      m.eq(m.key, Compute.concat(Compute.concat(m.source, m.gap), m.target)),
    ),
  ],
  "Lookup table cardinality": [
    check("Lookup_table_cardinality", LookupTable, (t) => t.eq(t.cardinality, "single")),
  ],
  "Map key": [
    key(on(MapKey, "mapping", "folded", "key")),
    key(on(MapKeyInteger, "mapping", "value")),
    key(on(MapKeyFloat, "mapping", "value")),
    key(on(MapKeyPoint, "mapping", "value")),
    key(on(MapKeyPair, "mapping", "value")),
    key(on(MapKeyDirectedPair, "mapping", "value")),
  ],
  MappableBaseType: [
    check("MappableBaseType", Mapping, (m) => m.ne(m.cardinality, "record")),
    contained(on(MappingBaseType, "baseType"), on(MappableBaseType, "baseType")),
  ],
  "Mapping overlay": [
    contained(
      on(Mapping, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    contained(on(Mapping, "node"), on(nodesOf("qti-mapping"), "id")),
    contained(
      on(
        Mapping,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "cardinality",
        "baseTypes",
      ),
      declarationRef,
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
    mirrors(on(integerKeys, "node", "mapping", "key"), on(MapKeyInteger, "node", "mapping", "key")),
    mirrors(on(floatKeys, "node", "mapping", "key"), on(MapKeyFloat, "node", "mapping", "key")),
    mirrors(on(pointKeys, "node", "mapping", "key"), on(MapKeyPoint, "node", "mapping", "key")),
    mirrors(on(pairKeys, "node", "mapping", "key"), on(MapKeyPair, "node", "mapping", "key")),
    mirrors(
      on(directedPairKeys, "node", "mapping", "key"),
      on(MapKeyDirectedPair, "node", "mapping", "key"),
    ),
    contained(
      on(AreaMapping, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    mirrors(on(AreaMapping, "node"), on(nodesOf("qti-area-mapping"), "id")),
    contained(
      on(
        AreaMapping,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "cardinality",
        "baseTypes",
      ),
      declarationRef,
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
      on(
        LookupTable,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "cardinality",
        "baseTypes",
      ),
      declarationRef,
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
