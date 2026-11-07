/**
 * The response mappings and the lookup tables (plan §1.7 O5; the W5 amendment's C2, C17 and C18,
 * with the tier-1 addendum's G-parse and "Text in keys" and the orchestrator's rulings of
 * 2026-11-06).
 *
 * Each overlay is a flat row keyed by its element's node, copying the node's {@link nodeRef} tuple
 * with its parent under its own name, and naming a node of its own kind:
 *
 * - {@link Mapping} (`qti-mapping`) and {@link AreaMapping} (`qti-area-mapping`), under a response
 *   declaration, and {@link MatchTable} (`qti-match-table`) and {@link InterpolationTable}
 *   (`qti-interpolation-table`), under an outcome declaration, each copy their declaration's
 *   `declarationRef` tuple, so the base type and cardinality they are read in are the declaration's
 *   codes (C17's proof is the declaration's own);
 * - {@link MapKey} (`qti-map-entry`) copies its mapping's base type and its `map-key` from
 *   `Attribute` (C18), one row per entry, so two entries with one key are two facts the key law
 *   refuses rather than one fact that set semantics collapses (rows-first §0);
 * - {@link MapKeyInteger}, {@link MapKeyFloat}, {@link MapKeyPoint}, {@link MapKeyPair} and
 *   {@link MapKeyDirectedPair} hold a map key's typed value where it differs from its lexical form,
 *   each a row of its own relation keyed by the entry's node and mirrored with the map keys of its
 *   base type (the addendum's `MapKeyInteger` pattern);
 * - {@link LookupValue} copies each table entry's `target-value` and each table's `default-value`
 *   beside its table's base type.
 *
 * The laws, by the rule each states:
 *
 * - **`mapping-base-type`** (reading 78): a mapping's base type is in `MappableBaseType`, so `file`,
 *   `duration` and a record's `none` are refused; an area mapping's is `point` (information model
 *   §5.5, "a mapping from a source set of point values").
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
import { Attribute } from "#pantry/qti/attributes.ts";
import { declarationRef } from "#pantry/qti/declarations.ts";
import { BaseTypePattern } from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * `xs:integer`'s lexical space, an optional sign and digits: the map keys of an integer mapping
 * whose value {@link MapKeyInteger} holds. Its language is the integer base type's (reading 45: no
 * integer is too long), and `mapping.oracle.test.ts` holds it to the deleted schema's `xsInteger`
 * with JavaScript's engine as the oracle.
 */
export const integerKeyPattern = "^[+-]?[0-9]+$";

/**
 * The most padding zeros a float key's run of them holds where the key has a typed value: one
 * counted repetition, PostgreSQL's `DUPMAX`.
 *
 * Each run is bounded because a key's text sits in a UNIQUE, and grizzle proves the key's cast
 * total only for a pattern whose automaton it can build: at most 2,048 states
 * (`core/limits.ts` `regexDfaMaxStates`; `scalar/regex/inclusion.ts`), and a counted run costs a
 * state a zero. Three runs as long as the key-text bound exceed it, and three of one repetition
 * each stay within it.
 */
export const floatKeyZeros = 255;

/**
 * Grizzle's lexical form of `double precision` (`lexicalForm(pg["double precision"])`), each run
 * of padding zeros written as at most {@link floatKeyZeros}: the map keys of a float mapping whose
 * value {@link MapKeyFloat} holds. `mapping.oracle.test.ts` holds this literal to
 * {@link floatKeyPatternOf} of {@link floatKeyZeros}.
 */
export const floatKeyPattern =
  "^(?:[+-]?(?:0{0,255}(?:0|[1-9][0-9]{0,14})(?:\\.(?:[0-9]{15}0{0,255}|[0-9]{0,14}))?|\\.(?:[0-9]{15}0{0,255}|[0-9]{1,14}))(?:[eE][+-]?0{0,255}(?:0|[1-9][0-9]?|1[0-9]{2}|2[0-8][0-9]|29[0-2]|293))?|-?INF|NaN)$";

/**
 * Write grizzle's `double precision` form with each `0*` bounded to a run of `zeros`, as
 * consecutive repetitions of at most 255, PostgreSQL's `DUPMAX`.
 *
 * @param form - The form, `lexicalForm(pg["double precision"])`.
 * @param zeros - The most padding zeros a run holds.
 * @returns The bounded pattern.
 */
export const floatKeyPatternOf = (form: string, zeros: number): string => {
  const parts: string[] = [];
  for (let left = zeros; left > 0; left -= 255) {
    parts.push(`0{0,${Math.min(left, 255)}}`);
  }

  return form.replaceAll("0*", parts.join(""));
};

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
 * `declaration` the node's parent, and the declaration's `declarationRef` tuple, whose `baseType`
 * its entries' keys are read in.
 */
export const Mapping = relation(
  "Mapping",
  {
    baseType: closedId(BaseType),
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
 * A map entry's overlay, keyed by its `qti-map-entry` node: its {@link nodeRef} tuple, its
 * `mapping` the node's parent, its mapping's base type, and its `map-key` as written.
 *
 * It also holds how the key is matched (reading 98, §7.21.3): `caseText`, the entry's
 * `case-sensitive` as written, empty where it is unwritten; `folded`, whether a response is matched
 * to the key without regard to case, which is where the mapping's base type is `string` and the
 * entry's `case-sensitive` is not true; and `matched`, the key a response meets, the key's ASCII
 * lowercase where `folded` and the key as written otherwise.
 */
export const MapKey = relation(
  "MapKey",
  {
    baseType: closedId(BaseType),
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
 * and `digits`, and `value`, the canonical form XML Schema gives `xs:integer` (no `+`, no leading
 * zero, `0` unsigned), `negative ‖ digits`.
 *
 * Two keys name one integer exactly when their canonical forms are equal, so `key(mapping, value)`
 * is uniqueness by typed value at any length the key text holds (reading 45: an integer has no
 * largest value). A cast would bound it: grizzle's lexical form of `numeric(p, 0)` holds at most
 * 256 digits (`scalar/lexical.ts` `decimalWritable`, `regexMaxRepeat`). Every field is the host's,
 * and `E1_derived` proves the split and the form.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#integer | XML Schema Part 2, §3.3.13 integer}
 */
export const MapKeyInteger = relation(
  "MapKeyInteger",
  {
    digits: Digits,
    key: keyText,
    mapping: uuid,
    negative: Negative,
    node: uuid,
    sign: Sign,
    value: keyText,
    zeros: Zeros,
  },
  ["node"],
);

/**
 * The text type of a float map key that has a typed value: {@link floatKeyPattern}, whose
 * language lies inside grizzle's `double precision` form, so its cast is total.
 */
const FloatKey = str.regex(floatKeyPattern);

/**
 * A float map key's typed value, keyed by its entry's node: `value`, the `double precision` its
 * key names, which the host writes and `E1_derived` proves equal to PostgreSQL's cast of the key.
 * The cast rounds the decimal once to the nearest double, as XML Schema's lexical mapping does
 * (reading 56), so `1`, `1.0` and `10e-1` are one value.
 *
 * The host writes `value` rather than PostgreSQL generating it, because grizzle refuses every
 * addition to a relation one of whose keys reads a generated field: no fact carries the field, so
 * neither its same-key check nor a statement's probe can meet the key
 * (`write/frontend/compile.ts` `refuseGeneratedUnique`; `docs/grizzle-findings.md`, R87). The
 * check holds `value` to the very term the generated column was, so `key(mapping, value)` judges
 * the same values.
 *
 * Only a key of grizzle's form has one: at most 15 significant digits on each side of the point
 * (`DBL_DIG`) and an exponent of at most 293, so the value is finite and nonzero unless it is
 * zero (`scalar/lexical.ts` `doubleForm`), with each run of padding zeros at most
 * {@link floatKeyZeros}. A key outside it, such as reading 56's `1e400`, is distinct from the
 * others by its lexical form alone, a stated limit of grizzle's form and of its automata.
 */
export const MapKeyFloat = relation(
  "MapKeyFloat",
  { key: FloatKey, mapping: uuid, node: uuid, value: pg["double precision"] },
  ["node"],
);

/**
 * A point map key's typed value, keyed by its entry's node: its key split into its two integers'
 * parts, as {@link MapKeyInteger} splits one, and the whitespace between them, and `value`, the
 * two canonical integers with one space between, `xNegative ‖ xDigits ‖ " " ‖ yNegative ‖ yDigits`.
 *
 * A point is "an integer tuple" (information model §8.13), so two keys name one point exactly when
 * their canonical forms are equal, and `key(mapping, value)` is uniqueness by typed value: `1 2`,
 * `01 +2` and `1`, a tab, `2` are one point. Every field is the host's, and `E1_derived` proves the
 * split.
 */
export const MapKeyPoint = relation(
  "MapKeyPoint",
  {
    gap: Gap,
    key: keyText,
    mapping: uuid,
    node: uuid,
    value: keyText,
    xDigits: Digits,
    xNegative: Negative,
    xSign: Sign,
    xZeros: Zeros,
    yDigits: Digits,
    yNegative: Negative,
    ySign: Sign,
    yZeros: Zeros,
  },
  ["node"],
);

/**
 * A pair map key's typed value, keyed by its entry's node: its key split into its two identifiers
 * and the whitespace between them, and `value`, the two in code-point order with one space between.
 *
 * A pair's association "is undirected so (A,B) and (B,A) are equivalent" (information model §8.13),
 * so `key(mapping, value)` is uniqueness by typed value: `A B`, `B A` and `A`, a tab, `B` are one
 * pair. Text compares by code point here, its collation `pg_c_utf8`. Every field is the host's, and
 * `E1_derived` proves the split and the order.
 */
export const MapKeyPair = relation(
  "MapKeyPair",
  {
    first: Item,
    gap: Gap,
    key: keyText,
    mapping: uuid,
    node: uuid,
    second: Item,
    value: keyText,
  },
  ["node"],
);

/**
 * A directed pair map key's typed value, keyed by its entry's node: its key split into its source
 * and target identifiers and the whitespace between them, and `value`, the two in order with one
 * space between.
 *
 * A directed pair's association "is directed so (A,B) and (B,A) are not equivalent" (information
 * model §8.13), so its value keeps the order and reads its whitespace as one space: `A B` and `A`,
 * a tab, `B` are one directed pair, and `B A` another. Every field is the host's, and `E1_derived`
 * proves the split.
 */
export const MapKeyDirectedPair = relation(
  "MapKeyDirectedPair",
  {
    gap: Gap,
    key: keyText,
    mapping: uuid,
    node: uuid,
    source: Item,
    target: Item,
    value: keyText,
  },
  ["node"],
);

/**
 * A lookup table's typed attribute value, keyed by the node that carries it: a
 * `qti-match-table-entry`'s or `qti-interpolation-table-entry`'s `target-value`, or a
 * `qti-match-table`'s or `qti-interpolation-table`'s `default-value`, as written, with its
 * {@link nodeRef} tuple and its table's base type, the outcome declaration's (reading 8).
 *
 * The value is copied (C18) because `Typed_attribute_value` reads it beside its table's base
 * type, which only the table's row holds; it is `keyText`, so a value past the key-text bound is
 * refused under that limit.
 */
export const LookupValue = relation(
  "LookupValue",
  {
    baseType: closedId(BaseType),
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
 * An area mapping's overlay, keyed by its `qti-area-mapping` node: its {@link nodeRef} tuple and
 * its declaration's `declarationRef` tuple.
 */
export const AreaMapping = relation(
  "AreaMapping",
  {
    baseType: closedId(BaseType),
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
 * A match table's overlay, keyed by its `qti-match-table` node: its {@link nodeRef} tuple and its
 * outcome declaration's `declarationRef` tuple, whose base type its targets and default value are
 * values of (reading 8).
 */
export const MatchTable = relation(
  "MatchTable",
  {
    baseType: closedId(BaseType),
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
 * An interpolation table's overlay, keyed by its `qti-interpolation-table` node: its
 * {@link nodeRef} tuple and its outcome declaration's `declarationRef` tuple.
 */
export const InterpolationTable = relation(
  "InterpolationTable",
  {
    baseType: closedId(BaseType),
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
 * The lexical forms of an `xs:boolean` true, collapsed: an entry so written is matched by code
 * points.
 */
export const caseSensitiveTrue = ["true", "1"] as const;

/**
 * The map keys of integer mappings: each has its {@link MapKeyInteger} row, and no other key does.
 */
const integerKeys = select(MapKey, (k) =>
  k.and(k.eq(k.baseType, "integer"), Compute.matches(k.key, integerKeyPattern)),
);

/**
 * The map keys of float mappings in grizzle's form: each has its {@link MapKeyFloat} row, and no
 * other key does.
 */
const floatKeys = select(MapKey, (k) =>
  k.and(k.eq(k.baseType, "float"), Compute.matches(k.key, floatKeyPattern)),
);

/**
 * The map keys of point mappings written as two integers: each has its {@link MapKeyPoint} row,
 * and no other key does.
 */
const pointKeys = select(MapKey, (k) =>
  k.and(k.eq(k.baseType, "point"), Compute.matches(k.key, pointKeyPattern)),
);

/**
 * The map keys of pair mappings written as two items: each has its {@link MapKeyPair} row, and no
 * other key does.
 */
const pairKeys = select(MapKey, (k) =>
  k.and(k.eq(k.baseType, "pair"), Compute.matches(k.key, pairKeyPattern)),
);

/**
 * The map keys of directed pair mappings written as two items: each has its
 * {@link MapKeyDirectedPair} row, and no other key does.
 */
const directedPairKeys = select(MapKey, (k) =>
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
 *   declaration's `declarationRef` tuple;
 * - **`mapping-base-type`:** the containment into `MappableBaseType`, and `AreaMapping_base_type`;
 * - **map keys:** the entry's mapping's base type, its `map-key` copy, the lexical key, each typed
 *   relation mirrored with its keys, `E1_derived` its split or its cast, and its typed key, and
 *   `Typed_attribute_value` its lexical form;
 * - **`Lookup_table_cardinality`:** a match or interpolation table's outcome is single;
 * - **lookup values:** each copies its node's tuple and its attribute, holds its table's base type,
 *   and `Typed_attribute_value` judges it.
 */
export const mappingLawsByName = {
  "AreaMapping base type": [
    check("AreaMapping_base_type", AreaMapping, (a) => a.eq(a.baseType, "point")),
  ],
  "DocumentId key": [
    key(on(mapKeyAttributes, "node")),
    key(on(caseAttributes, "node")),
    key(on(lookupAttributes, "node")),
  ],
  "E1 derived": [
    check("E1_derived", MapKey, (k) => {
      const matchedCase = k.and(
        k.eq(k.baseType, "string"),
        k.not(k.in(Compute.collapse(k.caseText), caseSensitiveTrue)),
      );

      return k.or(
        k.and(k.eq(k.folded, true), matchedCase, k.eq(k.matched, Compute.lowerAscii(k.key))),
        k.and(k.eq(k.folded, false), k.not(matchedCase), k.eq(k.matched, k.key)),
      );
    }),
    check("E1_derived", MapKeyInteger, (m) =>
      m.and(
        m.eq(m.key, Compute.concat(Compute.concat(m.sign, m.zeros), m.digits)),
        m.eq(m.value, Compute.concat(m.negative, m.digits)),
        m.or(
          m.and(m.eq(m.sign, "-"), m.ne(m.digits, "0"), m.eq(m.negative, "-")),
          m.and(m.or(m.ne(m.sign, "-"), m.eq(m.digits, "0")), m.eq(m.negative, "")),
        ),
      ),
    ),
    check("E1_derived", MapKeyFloat, (m) =>
      m.eq(m.value, Compute.cast(m.key, pg["double precision"])),
    ),
    check("E1_derived", MapKeyPoint, (m) =>
      m.and(
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
        m.eq(
          m.value,
          Compute.concat(
            Compute.concat(
              Compute.concat(Compute.concat(m.xNegative, m.xDigits), " "),
              m.yNegative,
            ),
            m.yDigits,
          ),
        ),
        m.or(
          m.and(m.eq(m.xSign, "-"), m.ne(m.xDigits, "0"), m.eq(m.xNegative, "-")),
          m.and(m.or(m.ne(m.xSign, "-"), m.eq(m.xDigits, "0")), m.eq(m.xNegative, "")),
        ),
        m.or(
          m.and(m.eq(m.ySign, "-"), m.ne(m.yDigits, "0"), m.eq(m.yNegative, "-")),
          m.and(m.or(m.ne(m.ySign, "-"), m.eq(m.yDigits, "0")), m.eq(m.yNegative, "")),
        ),
      ),
    ),
    check("E1_derived", MapKeyPair, (m) =>
      m.and(
        m.eq(m.key, Compute.concat(Compute.concat(m.first, m.gap), m.second)),
        m.or(
          m.and(
            m.le(m.first, m.second),
            m.eq(m.value, Compute.concat(Compute.concat(m.first, " "), m.second)),
          ),
          m.and(
            m.gt(m.first, m.second),
            m.eq(m.value, Compute.concat(Compute.concat(m.second, " "), m.first)),
          ),
        ),
      ),
    ),
    check("E1_derived", MapKeyDirectedPair, (m) =>
      m.and(
        m.eq(m.key, Compute.concat(Compute.concat(m.source, m.gap), m.target)),
        m.eq(m.value, Compute.concat(Compute.concat(m.source, " "), m.target)),
      ),
    ),
  ],
  "Lookup table cardinality": [
    check("Lookup_table_cardinality", MatchTable, (t) => t.eq(t.cardinality, "single")),
    check("Lookup_table_cardinality", InterpolationTable, (t) => t.eq(t.cardinality, "single")),
  ],
  "Map key": [
    key(on(MapKey, "mapping", "folded", "matched")),
    key(on(MapKeyInteger, "mapping", "value")),
    key(on(MapKeyFloat, "mapping", "value")),
    key(on(MapKeyPoint, "mapping", "value")),
    key(on(MapKeyPair, "mapping", "value")),
    key(on(MapKeyDirectedPair, "mapping", "value")),
  ],
  MappableBaseType: [contained(on(Mapping, "baseType"), on(MappableBaseType, "baseType"))],
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
        "baseType",
        "cardinality",
      ),
      declarationRef,
    ),
    contained(
      on(MapKey, "node", "document", "kind", "start", "nearest", "version", "mapping"),
      nodeRef,
    ),
    contained(on(MapKey, "node"), on(nodesOf("qti-map-entry"), "id")),
    contained(on(MapKey, "mapping", "baseType"), on(Mapping, "node", "baseType")),
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
        "baseType",
        "cardinality",
      ),
      declarationRef,
    ),
    contained(
      on(MatchTable, "node", "document", "kind", "start", "nearest", "version", "declaration"),
      nodeRef,
    ),
    mirrors(on(MatchTable, "node"), on(nodesOf("qti-match-table"), "id")),
    contained(
      on(
        MatchTable,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
      declarationRef,
    ),
    contained(
      on(
        InterpolationTable,
        "node",
        "document",
        "kind",
        "start",
        "nearest",
        "version",
        "declaration",
      ),
      nodeRef,
    ),
    mirrors(on(InterpolationTable, "node"), on(nodesOf("qti-interpolation-table"), "id")),
    contained(
      on(
        InterpolationTable,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
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
        select(LookupValue, (v) => v.eq(v.kind, "qti-match-table-entry")),
        "parent",
        "baseType",
      ),
      on(MatchTable, "node", "baseType"),
    ),
    contained(
      on(
        select(LookupValue, (v) => v.eq(v.kind, "qti-match-table")),
        "node",
        "baseType",
      ),
      on(MatchTable, "node", "baseType"),
    ),
    contained(
      on(
        select(LookupValue, (v) => v.eq(v.kind, "qti-interpolation-table-entry")),
        "parent",
        "baseType",
      ),
      on(InterpolationTable, "node", "baseType"),
    ),
    contained(
      on(
        select(LookupValue, (v) => v.eq(v.kind, "qti-interpolation-table")),
        "node",
        "baseType",
      ),
      on(InterpolationTable, "node", "baseType"),
    ),
  ],
  "Typed attribute value": [
    check("Typed_attribute_value", MapKey, (k) =>
      k.and(
        Compute.matches(k.key, BaseTypePattern.at("pattern", k.baseType)),
        k.or(k.eq(k.baseType, "string"), Compute.matches(k.key, exactValuePattern)),
      ),
    ),
    check("Typed_attribute_value", LookupValue, (v) =>
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
