/**
 * Variable declarations and their values: the O2 overlays (plan §1.7; the W5 amendment's C17, C18
 * and D entry for Q5.08; the tier-1 addendum's G-match, G-parse and "Text in keys").
 *
 * Each overlay is a flat row keyed by its element's node. It copies its node's `nodeRef` tuple and
 * takes each attribute value it compares from `Attribute`, beside the key over that attribute's
 * selection that keeps its lexical form out of every index (C18):
 *
 * - {@link Declaration}, one per `qti-{response,outcome,template,context}-declaration`: its
 *   identifier, its kind as a `DeclarationKind`, and its base type and cardinality as the codes
 *   their lexical forms spell (C17). Every containment into it targets {@link declarationRef}.
 * - {@link DeclarationBaseType}, a declaration's `base-type`, where it writes one.
 * - {@link ValueSet}, one per `qti-default-value` and `qti-correct-response` of a declaration: its
 *   declaration's types, and its count of values, `Node.elementChildren`.
 * - {@link Value}, one per `qti-value` of a value set: its text, Node's string value of it, and its
 *   set's base type and cardinality.
 * - {@link ValueBaseType}, a value's own `base-type`, where it writes one that spells a code: the
 *   base type a record's field's text is read in.
 * - {@link RecordField}, one per `qti-value` of a value set that writes both a `field-identifier` and
 *   a `base-type`, a counted member of its set.
 * - {@link MasteryValue}, {@link NormalMinimum} and {@link NormalMaximum}, an outcome declaration's
 *   `mastery-value`, `normal-minimum` and `normal-maximum`, each where it writes it, and
 *   {@link MasteryFloor} and {@link MasteryCeiling}, each pair of them `Mastery_range` compares as
 *   `xs:double` values, where it writes both.
 *
 * No field stands for an attribute its element does not write: a value that may be missing is a row
 * of its own relation, written only where it is (AGENTS.md, Schema intent). One sentinel is left,
 * a record's base type `none`, which {@link declarationRef} copies into every row that names a
 * declaration (lane NIL's audit, B12).
 *
 * An identifier's types (`IdentifierDType`, `UniqueIdentifierDType`) collapse whitespace, so the
 * declared name is the lexical form without its outer whitespace (XML Schema Part 2, §4.3.6;
 * spec reading 7: "An attribute the XSD itself types ... is read as the XSD reads it, outer
 * whitespace collapsed"). Each identifier is written as three pieces, `lead`, the name and
 * `trail`, which `E1_derived` proves concatenate to the copied lexical form, as `Idref`'s pieces
 * do. `base-type` and `cardinality` restrict `xs:string`, whose whitespace is preserved, so their
 * codes are proved against the lexical form as written.
 *
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores, since a check's name is an identifier; no law name holds an underscore.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Variables | QTI 3.0 information model, §2.2.2 Item Variables}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  key,
  lexicalForm,
  natural,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  BaseType,
  BaseTypeLexical,
  BuiltInVariable,
  Cardinality,
  CardinalityLexical,
  DeclarationKind,
  Declares,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { BaseTypePattern, unjudgedBaseTypes } from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";

/**
 * XML whitespace `S`, possibly none: what an identifier's lexical form holds around its name.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const Space = str.regex("^[\\t\\n\\r ]*$");

/**
 * A run of characters holding no XML whitespace: a collapsed identifier, which `E1_derived` holds
 * each written name to, so its pieces are its lexical form's outer whitespace and nothing more.
 * That it is an NCName follows from AL1's lexical half, since the pieces concatenate to the lexical
 * form.
 */
const nonSpacePattern = "^[^\\t\\n\\r ]+$";

/**
 * The kinds that declare a variable: the `NodeKind` handles that are `DeclarationKind` handles too
 * (`references.ts`: the four kinds that declare `cardinality`, each its own declaration kind).
 */
export const declarationKinds = NodeKind.handles.filter((kind) =>
  DeclarationKind.handles.some((declared) => declared === kind),
);

/**
 * The kinds that hold a declaration's values: its default (any declaration's) and its correct
 * response (a response declaration's), each of one or more `qti-value` children.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_DefaultValue | QTI 3.0 information model, §5.41 DefaultValue}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_CorrectResponse | QTI 3.0 information model, §5.35 CorrectResponse}
 */
export const valueSetKinds = ["qti-default-value", "qti-correct-response"] as const;

/**
 * The built-in session variables, which "are declared implicitly and must not be declared"
 * (information model §2.2.2): every built-in but a context variable, `numAttempts` and `duration`
 * (§2.2.2.2: "must not appear in a 'response declaration'") and `completionStatus` (§2.2.2.3:
 * "must not appear in an outcome declaration"), the reserved identifiers of tables 4.5.1, 5.115.1
 * and 5.151.1 ("The identifiers of the built-in session variables are reserved. They are
 * completionStatus, numAttempts and duration"). Spec reading 72: the name is spelled exactly, with
 * no alias, so `completion_status` is an ordinary identifier. Each name is read once, though
 * `BuiltInVariable` holds `duration` under an item's roots and a test's alike.
 *
 * The built-in context variable `QTI_CONTEXT` is no session variable: the implementation guide
 * declares it explicitly, "an explicit (though unnecessary) qti-context-declaration of QTI_CONTEXT"
 * (§3.7.11), so {@link contextVariable} holds its declaration to its built-in type instead.
 */
export const sessionVariables = [
  ...new Set(
    BuiltInVariable.rows
      .filter(({ declaration }) => declaration !== "qti-context-declaration")
      .map(({ variable }) => variable),
  ),
];

/**
 * A name the specification types wherever it is declared: the declaration kind a declaration of the
 * name must be, and the base type it must have.
 */
interface ReservedBaseType {
  readonly baseType: (typeof BaseType.handles)[number];
  readonly identifier: string;
  readonly kind: (typeof DeclarationKind.handles)[number];
}

/**
 * The outcome names the specification types (information model §2.2.2.3, Outcomes Variable:
 * "SCORE MUST be a float", "MAXSCORE MUST be a float", "PASSED MUST be a boolean"). An outcome of
 * another name is untyped by them.
 */
export const reservedBaseTypes: readonly ReservedBaseType[] = [
  { baseType: "float", identifier: "SCORE", kind: "qti-outcome-declaration" },
  { baseType: "float", identifier: "MAXSCORE", kind: "qti-outcome-declaration" },
  { baseType: "boolean", identifier: "PASSED", kind: "qti-outcome-declaration" },
];

/**
 * The built-in context variable, which may be declared only as the context record it is built in as
 * (information model §2.2.2.1: "There is one built-in context variable: 'QTI_CONTEXT', which has
 * record cardinality"; the implementation guide's "explicit (though unnecessary)
 * qti-context-declaration of QTI_CONTEXT", §3.7.11). A declaration of another kind or cardinality
 * would make one identifier name two variables, which spec reading 74 refuses.
 */
export const contextVariable = {
  cardinality: "record",
  identifier: "QTI_CONTEXT",
  kind: "qti-context-declaration",
} as const satisfies {
  readonly cardinality: (typeof Cardinality.handles)[number];
  readonly identifier: string;
  readonly kind: (typeof DeclarationKind.handles)[number];
};

/**
 * A variable a document declares, keyed by its declaration element's node: one whose `identifier`
 * and `cardinality` are written and spell a name and a handle, and whose `base-type`, where
 * written, spells one. Any other declaration has no row (lane NIL's audit, B10 and B11).
 *
 * Its fields, every one written by the host but the counts:
 *
 * - The node's {@link nodeRef} tuple: `node`, `document`, `kind`, `start`, `nearest`, `version` and
 *   `parent`;
 * - `declarationKind`, its kind as a `DeclarationKind`, `Declares` of `kind`;
 * - `identifier`, the declared name, its `identifier` attribute's lexical form without its outer
 *   whitespace; `identifierLexical`, that lexical form as written (C18's copy); and
 *   `identifierLead` and `identifierTrail`, the whitespace written around the name;
 * - `baseType`, the `BaseType` its {@link DeclarationBaseType} holds, and `none`, a record's, where
 *   it has none: the one field that stands for an unwritten attribute, since {@link declarationRef}
 *   copies it into every row that names the declaration (lane NIL's audit, B12, open);
 * - `cardinality`, the `Cardinality` its `cardinality` spells, and `cardinalityLexical`;
 * - `masteries`, `minimums` and `maximums`, drawn: its counts of {@link MasteryValue},
 *   {@link NormalMinimum} and {@link NormalMaximum} rows, 1 where it writes the attribute and 0
 *   where it does not.
 *
 * Copied text is `keyText` (`#pantry/qti/limits.ts`): an identifier and each copy sit in a key or a
 * containment's index.
 */
export const Declaration = relation(
  "Declaration",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    cardinalityLexical: keyText,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    identifierLead: Space,
    identifierLexical: keyText,
    identifierTrail: Space,
    kind: closedId(NodeKind),
    masteries: drawn(natural),
    maximums: drawn(natural),
    minimums: drawn(natural),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A declaration's `base-type`, keyed by its node, where it writes one: `baseTypeLexical`, its
 * lexical form as written (C18's copy), and `baseType`, the `BaseType` that form spells (C17),
 * which its {@link Declaration} holds. A record writes none ("Variables with record cardinality
 * have no base-type", QTI 3.0 information model, tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3), and
 * has no row.
 */
export const DeclarationBaseType = relation(
  "DeclarationBaseType",
  { baseType: closedId(BaseType), baseTypeLexical: keyText, node: uuid },
  ["node"],
);

/**
 * The one tuple of a declaration every containment into `Declaration` targets, as `nodeRef` is
 * Node's (C18; the orchestrator's ruling of 2026-11-06): its node, document, identifier,
 * declaration kind, base type and cardinality. A row that references a declaration by identifier
 * and one that hangs from it by node copy the fields they lack, so `Declaration` carries one
 * superkey UNIQUE for them all.
 */
export const declarationRef = on(
  Declaration,
  "node",
  "document",
  "identifier",
  "declarationKind",
  "baseType",
  "cardinality",
);

/**
 * A declaration's default or correct values, keyed by its `qti-default-value` or
 * `qti-correct-response` node, whose `parent` is the declaration.
 *
 * Its fields, every one written by the host but `fields`:
 *
 * - The node's {@link nodeRef} tuple;
 * - `identifier`, `declarationKind`, `baseType` and `cardinality`, its declaration's, copied through
 *   {@link declarationRef};
 * - `elements` and `elementChildren`, its node's element rank and element children, copied through
 *   `nodeCounts`: its children are its `qti-value`s alone (`CorrectResponseDType`,
 *   `DefaultValueDType`), so `elementChildren` is its number of values;
 * - `fields`, drawn: its {@link RecordField} members' count.
 */
export const ValueSet = relation(
  "ValueSet",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    elementChildren: natural,
    elements: natural,
    fields: drawn(natural),
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One value of a value set, keyed by its `qti-value` node, whose `parent` is the set.
 *
 * Its fields, every one written by the host:
 *
 * - The node's {@link nodeRef} tuple;
 * - `text`, its node's string value, the concatenation of its character data (Q5.03's fold over
 *   `copiedTextKinds`), copied from `Node`;
 * - `baseType` and `cardinality`, its set's: the base type its text is read in, but in a record's
 *   set, whose `none` reads nothing, where a field's text is read in its own {@link ValueBaseType}
 *   (information model §7.46, Value: "The base-type is defined by the 'base-type' attribute of the
 *   declaration except in the case of variables with record cardinality").
 */
export const Value = relation(
  "Value",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    text: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A value's own `base-type`, keyed by its `qti-value` node, where it writes one that spells a code:
 * `baseTypeLexical`, its lexical form as written, `baseType`, the `BaseType` that form spells
 * (C17), and its {@link Value}'s `text` and `cardinality`, its set's. A record's field's text is
 * read in it (information model §7.46.2, Value's base-type: "This characteristic is only used for
 * specifying the base-type of a value that forms part of a record"); any other value's is read in
 * its set's, and `Value_cardinality` refuses the attribute there.
 *
 * A `base-type` written as no code has no row, and its value domain refuses it alone (the
 * orchestrator's ruling of 2026-11-06: one cause is refused under one rule).
 */
export const ValueBaseType = relation(
  "ValueBaseType",
  {
    baseType: closedId(BaseType),
    baseTypeLexical: keyText,
    cardinality: closedId(Cardinality),
    node: uuid,
    text: keyText,
  },
  ["node"],
);

/**
 * One field of a record's value, keyed by its `qti-value` node, whose `parent` is its set: "a set
 * of independent values each identified by its own identifier and having its own base-type"
 * (information model §8.16, CardinalityEnum, `record`). A value has one where it writes both a
 * `field-identifier` and a `base-type`, whatever its set; `Value_cardinality` holds a record's set
 * to its fields and every other set to none.
 *
 * Its fields, every one written by the host:
 *
 * - The node's {@link nodeRef} tuple;
 * - `identifier`, `identifierLexical`, `identifierLead` and `identifierTrail`, its
 *   `field-identifier`'s name and pieces, as {@link Declaration}'s identifier is written;
 * - `baseTypeLexical`, its `base-type`'s lexical form, whose code, where it spells one, is its
 *   {@link ValueBaseType}'s.
 */
export const RecordField = relation(
  "RecordField",
  {
    baseTypeLexical: keyText,
    document: uuid,
    identifier: keyText,
    identifierLead: Space,
    identifierLexical: keyText,
    identifierTrail: Space,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An outcome declaration's `mastery-value`, keyed by its node, where it writes one: its lexical
 * form, a counted member of its {@link Declaration}.
 */
export const MasteryValue = relation("MasteryValue", { lexical: keyText, node: uuid }, ["node"]);

/**
 * An outcome declaration's `normal-minimum`, keyed by its node, where it writes one, as
 * {@link MasteryValue} is its mastery value.
 */
export const NormalMinimum = relation("NormalMinimum", { lexical: keyText, node: uuid }, ["node"]);

/**
 * An outcome declaration's `normal-maximum`, keyed by its node, where it writes one, as
 * {@link MasteryValue} is its mastery value.
 */
export const NormalMaximum = relation("NormalMaximum", { lexical: keyText, node: uuid }, ["node"]);

/**
 * An outcome declaration that writes both a `normal-minimum` and a `mastery-value`, keyed by its
 * node: the two lexical forms, copied from its {@link NormalMinimum} and {@link MasteryValue},
 * which `Mastery_range` orders (spec reading 9: "each pair judged where both are written").
 */
export const MasteryFloor = relation(
  "MasteryFloor",
  { masteryValue: keyText, node: uuid, normalMinimum: keyText },
  ["node"],
);

/**
 * An outcome declaration that writes both a `mastery-value` and a `normal-maximum`, keyed by its
 * node, as {@link MasteryFloor} holds the other pair.
 */
export const MasteryCeiling = relation(
  "MasteryCeiling",
  { masteryValue: keyText, node: uuid, normalMaximum: keyText },
  ["node"],
);

/**
 * Each record value set's fields, counted by `ValueSet.fields`: a flat row whose group, its
 * `parent`, names its set.
 */
export const recordFieldFamily = counted(on(RecordField, "parent"), fin(ValueSet, "fields"));

/**
 * Each outcome declaration's mastery value, counted by `Declaration.masteries`: one row or none.
 */
export const masteryValueFamily = counted(on(MasteryValue, "node"), fin(Declaration, "masteries"));

/**
 * Each outcome declaration's normal minimum, counted by `Declaration.minimums`: one row or none.
 */
export const normalMinimumFamily = counted(on(NormalMinimum, "node"), fin(Declaration, "minimums"));

/**
 * Each outcome declaration's normal maximum, counted by `Declaration.maximums`: one row or none.
 */
export const normalMaximumFamily = counted(on(NormalMaximum, "node"), fin(Declaration, "maximums"));

/**
 * Select the attributes of one name on elements of some kinds: the source of an overlay's copy
 * (C18), with the key over it that serves the copy's reverse probe, so no index holds
 * `Attribute.lexical` (the tier-1 addendum's "Text in keys"). The key holds already, since an
 * element has one attribute of a name (AL2).
 *
 * @param name - The attribute's name.
 * @param kinds - The elements' kinds.
 * @returns The selection.
 */
const attributesOf = (
  name:
    | "base-type"
    | "cardinality"
    | "field-identifier"
    | "identifier"
    | "mastery-value"
    | "normal-maximum"
    | "normal-minimum",
  kinds: readonly (typeof NodeKind.handles)[number][],
) => select(Attribute, (a) => a.and(a.eq(a.name, name), a.in(a.kind, kinds)));

/**
 * The `identifier` of each declaration.
 */
const identifiers = attributesOf("identifier", declarationKinds);

/**
 * The `base-type` of each declaration that writes one.
 */
const baseTypes = attributesOf("base-type", declarationKinds);

/**
 * The `cardinality` of each declaration.
 */
const cardinalities = attributesOf("cardinality", declarationKinds);

/**
 * The `field-identifier` of each value that writes one, a record's field.
 */
const fieldIdentifiers = attributesOf("field-identifier", ["qti-value"]);

/**
 * The `base-type` of each value that writes one, a record's field.
 */
const fieldBaseTypes = attributesOf("base-type", ["qti-value"]);

/**
 * The `base-type` of each value that writes one spelling a code: the attributes each of which has
 * its {@link ValueBaseType}. A form that spells none is its value domain's alone.
 */
const spelledFieldBaseTypes = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "base-type"),
    a.eq(a.kind, "qti-value"),
    a.in(
      a.lexical,
      BaseTypeLexical.rows.map(({ lexical }) => lexical),
    ),
  ),
);

/**
 * An outcome declaration's attribute that bounds or places its value on its normal scale.
 *
 * @param name - The attribute's name.
 * @returns Its selection.
 */
const scaleAttributes = (name: "mastery-value" | "normal-maximum" | "normal-minimum") =>
  attributesOf(name, ["qti-outcome-declaration"]);

/**
 * The `mastery-value` of each outcome declaration that writes one.
 */
const masteryValues = scaleAttributes("mastery-value");

/**
 * The `normal-minimum` of each outcome declaration that writes one.
 */
const normalMinimums = scaleAttributes("normal-minimum");

/**
 * The `normal-maximum` of each outcome declaration that writes one.
 */
const normalMaximums = scaleAttributes("normal-maximum");

/**
 * A `Declaration` row as a row check reads it.
 */
type DeclarationRow = RowScalars<typeof Declaration>;

/**
 * A `RecordField` row as a row check reads it.
 */
type RecordFieldRow = RowScalars<typeof RecordField>;

/**
 * A `Value` row as a row check reads it.
 */
type ValueRow = RowScalars<typeof Value>;

/**
 * A `ValueBaseType` row as a row check reads it.
 */
type ValueBaseTypeRow = RowScalars<typeof ValueBaseType>;

/**
 * A `MasteryFloor` row as a row check reads it.
 */
type MasteryFloorRow = RowScalars<typeof MasteryFloor>;

/**
 * A `MasteryCeiling` row as a row check reads it.
 */
type MasteryCeilingRow = RowScalars<typeof MasteryCeiling>;

/**
 * State that a declaration's identifier is the collapsed form of its lexical form: the pieces
 * concatenate to it, and the name holds no whitespace, so the pieces hold all of it.
 *
 * @param d - The row.
 * @returns The predicate.
 */
const collapsedDeclared = (d: DeclarationRow) =>
  d.and(
    d.eq(
      d.identifierLexical,
      Compute.concat(Compute.concat(d.identifierLead, d.identifier), d.identifierTrail),
    ),
    Compute.matches(d.identifier, nonSpacePattern),
  );

/**
 * State that a record field's identifier is the collapsed form of its lexical form, as
 * {@link collapsedDeclared} states a declaration's.
 *
 * @param f - The row.
 * @returns The predicate.
 */
const collapsedField = (f: RecordFieldRow) =>
  f.and(
    f.eq(
      f.identifierLexical,
      Compute.concat(Compute.concat(f.identifierLead, f.identifier), f.identifierTrail),
    ),
    Compute.matches(f.identifier, nonSpacePattern),
  );

/**
 * State that a declaration of a typed outcome name has the declaration kind and base type the
 * specification gives it, or names another identifier.
 *
 * @param d - The row.
 * @param reserved - The typed name.
 * @returns The predicate.
 */
const keepsReservedBaseType = (d: DeclarationRow, reserved: ReservedBaseType) =>
  d.or(
    d.ne(d.declarationKind, reserved.kind),
    d.ne(d.identifier, reserved.identifier),
    d.eq(d.baseType, reserved.baseType),
  );

/**
 * The typed-value patterns, stated once in `#pantry/qti/expression-types.ts` as `BaseTypePattern`'s
 * rows and re-exported here under their names: the base types a value domain judges
 * (`domainValues`), boolean's, point's and the pairs' own patterns, and the base types every text
 * is a value of (`unjudgedBaseTypes`).
 */
export {
  booleanValuePattern,
  domainValues,
  pairValuePattern,
  pointValuePattern,
  unjudgedBaseTypes,
} from "#pantry/qti/expression-types.ts";

/**
 * State `Typed_value` over a value set's value: its text is a lexical form of its set's base type,
 * by `BaseTypePattern`, the one pattern per base type that a base value's text and a map key are
 * judged by too; every text of a base type of `unjudgedBaseTypes` is one, so it is matched against
 * nothing. A record's set has the base type `none`, an unjudged one: a field's text is judged by
 * {@link fieldValueCheck}.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const valueCheck = (v: ValueRow) =>
  v.or(
    v.in(v.baseType, unjudgedBaseTypes),
    Compute.matches(v.text, BaseTypePattern.at("pattern", v.baseType)),
  );

/**
 * State `Typed_value` over a value's own base type: in a record's set, the field's text is a
 * lexical form of it, as {@link valueCheck} judges a set's; in any other set, the value's text is
 * judged by its set's.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const fieldValueCheck = (b: ValueBaseTypeRow) =>
  b.or(
    b.ne(b.cardinality, "record"),
    b.in(b.baseType, unjudgedBaseTypes),
    Compute.matches(b.text, BaseTypePattern.at("pattern", b.baseType)),
  );

/**
 * The lexical form of an `xs:double` that `Compute.cast` reads exactly: XML Schema's, cut to the
 * values a double precision holds (grizzle's `lexicalForm`), with no outer whitespace.
 */
const doubleForm = lexicalForm(pg["double precision"]);

/**
 * State `Mastery_range` over a normal minimum and a mastery value both written (reading 9): the
 * minimum is no greater than the mastery value, `NaN` ordered against nothing, and a form outside
 * {@link doubleForm} read as the bound that holds the order, so it is not judged (a recorded
 * limit).
 *
 * @param r - The row.
 * @returns The predicate.
 */
const floorCheck = (r: MasteryFloorRow) =>
  r.or(
    r.eq(r.normalMinimum, "NaN"),
    r.eq(r.masteryValue, "NaN"),
    r.le(
      Compute.when(
        Compute.matches(r.normalMinimum, doubleForm),
        (low) => Compute.cast(low, pg["double precision"]),
        Number.NEGATIVE_INFINITY,
      ),
      Compute.when(
        Compute.matches(r.masteryValue, doubleForm),
        (mastery) => Compute.cast(mastery, pg["double precision"]),
        Number.POSITIVE_INFINITY,
      ),
    ),
  );

/**
 * State `Mastery_range` over a mastery value and a normal maximum both written, as
 * {@link floorCheck} states the other pair.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const ceilingCheck = (r: MasteryCeilingRow) =>
  r.or(
    r.eq(r.masteryValue, "NaN"),
    r.eq(r.normalMaximum, "NaN"),
    r.le(
      Compute.when(
        Compute.matches(r.masteryValue, doubleForm),
        (mastery) => Compute.cast(mastery, pg["double precision"]),
        Number.NEGATIVE_INFINITY,
      ),
      Compute.when(
        Compute.matches(r.normalMaximum, doubleForm),
        (high) => Compute.cast(high, pg["double precision"]),
        Number.POSITIVE_INFINITY,
      ),
    ),
  );

/**
 * Every statement over the O2 overlays, each `check` named by its oracle law:
 *
 * - **the copies (C18):** each overlay copies its node's {@link nodeRef} tuple; `Declaration` its
 *   `identifier` and `cardinality`, {@link DeclarationBaseType} its `base-type`, a value set its
 *   declaration's, a value its text and its set's types, {@link ValueBaseType} a value's own
 *   `base-type` that spells a code, a record field its `field-identifier` and `base-type`, and each
 *   scale row its attribute. Each optional attribute's copy has a reverse containment, so a row
 *   holds a lexical form exactly where its element writes one.
 * - **existence:** a declaration has its row exactly where it writes its required `identifier` and
 *   `cardinality`, through each one's copy and its reverse, and `E1_derived` holds each code to the
 *   one its lexical form spells; one that writes either none, or one that spells nothing, has no
 *   row, and AL3 or the attribute's value domain refuses it alone (lane NIL's audit, B10 and B11: a
 *   missing value is a row of its own relation, never a sentinel; its copies refuse it too, after
 *   them). Every value set and value of a declaration with a row has its row through a containment
 *   from `Node`, every record value its field (`Value_cardinality`), and every outcome declaration
 *   that writes both ends of a pair of its scale its {@link MasteryFloor} or
 *   {@link MasteryCeiling}, through its counts.
 * - **E1 (C17), `E1_derived`:** a declaration's kind is its `Declares` kind; each code is the one its
 *   lexical form spells (`<Roster>Lexical`), a declaration's base type its
 *   {@link DeclarationBaseType}'s, and `none` exactly where it has none; each identifier is its
 *   lexical form collapsed.
 * - **`Declaration key`** (spec reading 74): `key(document, identifier)`.
 * - **`Declaration not reserved`** (reading 72): no declaration names a built-in session variable, in
 *   any document, an item's, a test's or a section's alike, since every declaration element has its
 *   row whatever its root (information model tables 4.5.1, 5.115.1 and 5.151.1).
 * - **`Reserved type`**: SCORE, MAXSCORE, PASSED and QTI_CONTEXT keep their specified types.
 * - **`Declaration base type`**: a record has no base type, and every other variable has one.
 * - **`Value cardinality`**: a single variable's value set holds one value, and a record's set holds
 *   only fields, one per value, distinct by identifier (`Record field key`); a value writes a
 *   `field-identifier` or a `base-type` only as a field.
 * - **`Typed value`** (C1, G-match): each value's text is a lexical form of its base type, its set's
 *   or, a record's field's, its own.
 * - **`Mastery range`** (C2, G-parse): the mastery value lies in the normal range, each pair judged
 *   where both are written.
 */
export const declarationLawsByName = {
  "Declaration base type": [
    check("Declaration_base_type", Declaration, (d) =>
      d.or(
        d.and(d.eq(d.cardinality, "record"), d.eq(d.baseType, "none")),
        d.and(d.ne(d.cardinality, "record"), d.ne(d.baseType, "none")),
      ),
    ),
  ],
  "Declaration key": [key(on(Declaration, "document", "identifier"))],
  "Declaration not reserved": [
    check("Declaration_not_reserved", Declaration, (d) =>
      d.not(d.in(d.identifier, sessionVariables)),
    ),
  ],
  "Declaration overlay": [
    contained(
      on(Declaration, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(identifiers, "node", "lexical"), on(Declaration, "node", "identifierLexical")),
    contained(on(Declaration, "node"), on(identifiers, "node")),
    contained(on(cardinalities, "node", "lexical"), on(Declaration, "node", "cardinalityLexical")),
    contained(on(Declaration, "node"), on(cardinalities, "node")),
    contained(on(baseTypes, "node", "lexical"), on(DeclarationBaseType, "node", "baseTypeLexical")),
    contained(on(DeclarationBaseType, "node"), on(baseTypes, "node")),
    contained(on(DeclarationBaseType, "node", "baseType"), on(Declaration, "node", "baseType")),
    contained(
      on(ValueSet, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) =>
          n.and(n.in(n.kind, valueSetKinds), n.in(n.parentKind, declarationKinds)),
        ),
        "id",
      ),
      on(ValueSet, "node"),
    ),
    contained(
      on(
        ValueSet,
        "parent",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
      declarationRef,
    ),
    contained(
      on(Value, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) => n.and(n.eq(n.kind, "qti-value"), n.in(n.parentKind, valueSetKinds))),
        "id",
      ),
      on(Value, "node"),
    ),
    contained(on(Value, "node", "text"), on(Node, "id", "stringValue")),
    contained(
      on(Value, "parent", "baseType", "cardinality"),
      on(ValueSet, "node", "baseType", "cardinality"),
    ),
    contained(
      on(spelledFieldBaseTypes, "node", "lexical"),
      on(ValueBaseType, "node", "baseTypeLexical"),
    ),
    contained(on(ValueBaseType, "node"), on(fieldBaseTypes, "node")),
    contained(
      on(ValueBaseType, "node", "text", "cardinality"),
      on(Value, "node", "text", "cardinality"),
    ),
    contained(
      on(RecordField, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    masteryValueFamily,
    contained(on(masteryValues, "node", "lexical"), on(MasteryValue, "node", "lexical")),
    contained(on(MasteryValue, "node"), on(masteryValues, "node")),
    normalMinimumFamily,
    contained(on(normalMinimums, "node", "lexical"), on(NormalMinimum, "node", "lexical")),
    contained(on(NormalMinimum, "node"), on(normalMinimums, "node")),
    normalMaximumFamily,
    contained(on(normalMaximums, "node", "lexical"), on(NormalMaximum, "node", "lexical")),
    contained(on(NormalMaximum, "node"), on(normalMaximums, "node")),
    contained(
      on(
        select(Declaration, (d) => d.and(d.eq(d.minimums, 1n), d.eq(d.masteries, 1n))),
        "node",
      ),
      on(MasteryFloor, "node"),
    ),
    contained(on(MasteryFloor, "node", "normalMinimum"), on(NormalMinimum, "node", "lexical")),
    contained(on(MasteryFloor, "node", "masteryValue"), on(MasteryValue, "node", "lexical")),
    contained(
      on(
        select(Declaration, (d) => d.and(d.eq(d.masteries, 1n), d.eq(d.maximums, 1n))),
        "node",
      ),
      on(MasteryCeiling, "node"),
    ),
    contained(on(MasteryCeiling, "node", "masteryValue"), on(MasteryValue, "node", "lexical")),
    contained(on(MasteryCeiling, "node", "normalMaximum"), on(NormalMaximum, "node", "lexical")),
  ],
  "DocumentId key": [
    key(on(identifiers, "node")),
    key(on(cardinalities, "node")),
    key(on(baseTypes, "node")),
    key(on(fieldIdentifiers, "node")),
    key(on(fieldBaseTypes, "node")),
    key(on(masteryValues, "node")),
    key(on(normalMinimums, "node")),
    key(on(normalMaximums, "node")),
  ],
  "E1 derived": [
    contained(on(Declaration, "kind", "declarationKind"), on(Declares, "kind", "declaration")),
    check("E1_derived", Declaration, (d) =>
      d.and(
        collapsedDeclared(d),
        d.eq(CardinalityLexical.at("lexical", d.cardinality), d.cardinalityLexical),
      ),
    ),
    contained(
      on(
        select(Declaration, (d) => d.ne(d.baseType, "none")),
        "node",
        "baseType",
      ),
      on(DeclarationBaseType, "node", "baseType"),
    ),
    check("E1_derived", DeclarationBaseType, (b) =>
      b.eq(BaseTypeLexical.at("lexical", b.baseType), b.baseTypeLexical),
    ),
    check("E1_derived", ValueBaseType, (b) =>
      b.eq(BaseTypeLexical.at("lexical", b.baseType), b.baseTypeLexical),
    ),
    check("E1_derived", RecordField, collapsedField),
  ],
  "Mastery range": [
    check("Mastery_range", MasteryFloor, floorCheck),
    check("Mastery_range", MasteryCeiling, ceilingCheck),
  ],
  "Record field key": [key(on(RecordField, "parent", "identifier"))],
  "Reserved type": [
    check("Reserved_type", Declaration, (d) =>
      d.and(
        ...reservedBaseTypes.map((reserved) => keepsReservedBaseType(d, reserved)),
        d.or(
          d.ne(d.identifier, contextVariable.identifier),
          d.and(
            d.eq(d.declarationKind, contextVariable.kind),
            d.eq(d.cardinality, contextVariable.cardinality),
          ),
        ),
      ),
    ),
  ],
  "Typed value": [
    check("Typed_value", Value, valueCheck),
    check("Typed_value", ValueBaseType, fieldValueCheck),
  ],
  "Value cardinality": [
    contained(on(ValueSet, "node", "elements", "elementChildren"), nodeCounts),
    recordFieldFamily,
    check("Value_cardinality", ValueSet, (s) =>
      s.and(
        s.or(s.ne(s.cardinality, "single"), s.eq(s.elementChildren, 1n)),
        s.or(
          s.and(s.eq(s.cardinality, "record"), s.eq(s.fields, s.elementChildren)),
          s.and(s.ne(s.cardinality, "record"), s.eq(s.fields, 0n)),
        ),
      ),
    ),
    contained(
      on(fieldIdentifiers, "node", "lexical"),
      on(RecordField, "node", "identifierLexical"),
    ),
    contained(on(RecordField, "node"), on(fieldIdentifiers, "node")),
    contained(on(fieldBaseTypes, "node", "lexical"), on(RecordField, "node", "baseTypeLexical")),
    contained(on(RecordField, "node"), on(fieldBaseTypes, "node")),
  ],
} as const;

/**
 * {@link declarationLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const declarationLaws = Object.values(declarationLawsByName).flat();
