/**
 * Variable declarations and their values: the O2 overlays (plan §1.7; the W5 amendment's C17, C18
 * and D entry for Q5.08; the tier-1 addendum's G-match, G-parse and "Text in keys").
 *
 * Each overlay is a flat row keyed by its element's node. It copies its node's `nodeRef` tuple and
 * takes each attribute value it compares from `Attribute`, beside the key over that attribute's
 * selection that keeps its lexical form out of every index (C18):
 *
 * - {@link Declaration}, one per `qti-{response,outcome,template,context}-declaration`: its kind as a
 *   `DeclarationKind`, and its counts of the typed rows below. Every row that hangs from a
 *   declaration copies {@link declarationRef}.
 * - {@link DeclarationCardinality}, a declaration's `cardinality`, where it spells a code (C17), a
 *   counted member of its {@link Declaration}.
 * - {@link DeclarationBaseType}, a declaration's `base-type`, where it spells a code, a counted
 *   member of its {@link Declaration}.
 * - {@link DeclarationIdentifier}, a declaration's `identifier`, where it names something: the one
 *   row a binding, a reference and a choice's name resolve against by name, through
 *   {@link declarationIdentifierRef}, whatever the declaration's cardinality spells (spec reading
 *   159).
 * - {@link DeclarationName}, a declaration's name beside its cardinality, where it has both: the row
 *   `Reserved type` judges a typed name's cardinality on.
 * - {@link ValueSet}, one per `qti-default-value` and `qti-correct-response` of a declaration: its
 *   declaration's {@link declarationRef} tuple, and its count of values, `Node.elementChildren`;
 *   and {@link ValueSetCardinality}, a set beside its declaration's cardinality, where it has one.
 * - {@link Value}, one per `qti-value` of a value set: its text, Node's string value of it, and its
 *   set's declaration and counts.
 * - {@link TypedValue}, a value's text beside its declaration's base type and cardinality, where its
 *   declaration has both: the base type a value of a set that is no record's is read in.
 * - {@link ValueBaseType}, a value's own `base-type`, where it writes one that spells a code, and
 *   {@link FieldValue}, its text beside that base type and its declaration's cardinality, where the
 *   declaration has one: the base type a record's field's text is read in.
 * - {@link RecordField}, one per `qti-value` of a value set that writes both a `field-identifier` and
 *   a `base-type`, a counted member of its set.
 * - {@link RecordFieldName}, a record field's name, where its `field-identifier` names something.
 * - {@link MasteryValue} and {@link NormalMaximum}, an outcome declaration's `mastery-value` and
 *   `normal-maximum`, each where it writes it; {@link NormalMinimum}, its `normal-minimum` where it
 *   writes one, and else its version's XSD default where the version states one (spec reading 149);
 *   and {@link MasteryFloor} and {@link MasteryCeiling}, each pair of them `Mastery_range` compares
 *   as `xs:double` values, where it has both.
 *
 * No field stands for an attribute its element does not write: a value that may be missing is a row
 * of its own relation, written only where it is (AGENTS.md, Schema intent). A record has no base
 * type, so it has no {@link DeclarationBaseType}, and every row that names a declaration copies its
 * count of them, `baseTypes`, never a base type: a row that reads the base type reads the typed
 * row, which exists only where the declaration has one (lane NIL's audit, B12). Its cardinality is
 * held the same way, as its count of {@link DeclarationCardinality} rows, `cardinalities`.
 *
 * A declaration has its row, and every row below it, whatever its identifier, cardinality and base
 * type spell (spec readings 157 and 158): each that is unwritten, or spells nothing, is the absence
 * of its typed row alone ({@link DeclarationIdentifier}, {@link DeclarationCardinality},
 * {@link DeclarationBaseType}), so AL3 or its value domain refuses it alone, and every law that
 * reads it judges only the declarations that have it, while every other law judges them all.
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
  constant,
  contained,
  counted,
  drawn,
  fin,
  key,
  natural,
  on,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { Option } from "effect";
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
import { ncNamePattern } from "#pantry/grammar/domains.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import {
  BaseTypePattern,
  unjudgedBaseTypes,
  ValueBase,
  ValueBaseOf,
} from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { doublePattern } from "#pantry/qti/operators.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";
import type { SchemaVersion as Version } from "#pantry/grammar/kinds.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * A collapsed identifier that names something: an NCName (`ncNamePattern`), `IdentifierDType`'s
 * lexical space, which `E1_derived` holds each written name to, so its pieces are its lexical
 * form's outer whitespace and nothing more.
 */
const namePattern = `^${ncNamePattern}$`;

/**
 * A lexical form that names something once collapsed: an NCName with XML whitespace around it,
 * which collapsing strips. Any other form names nothing, and its value domain refuses it alone
 * (spec reading 152).
 */
const namingPattern = `^[\\t\\n\\r ]*${ncNamePattern}[\\t\\n\\r ]*$`;

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
 * A variable a document declares, keyed by its declaration element's node: every declaration has
 * one, whatever its identifier, cardinality and base type spell. None of the three is a field of
 * it: each is a row of its own, {@link DeclarationIdentifier}, {@link DeclarationCardinality} and
 * {@link DeclarationBaseType}, written only where it names or spells something, so one that is
 * unwritten or spells nothing is refused by AL3 or its value domain alone, and the declaration's
 * values, mapping and tables are judged as any other's (spec readings 157 and 158).
 *
 * Its fields, every one written by the host but the counts:
 *
 * - The node's {@link nodeRef} tuple: `node`, `document`, `kind`, `start`, `nearest`, `version` and
 *   `parent`;
 * - `declarationKind`, its kind as a `DeclarationKind`, `Declares` of `kind`;
 * - `cardinalities` and `baseTypes`, drawn: its counts of {@link DeclarationCardinality} and
 *   {@link DeclarationBaseType} rows, each 1 where its attribute spells a code and 0 where it does
 *   not, a record's base type among them (lane NIL's audit, B12);
 * - `masteries`, `minimums` and `maximums`, drawn: its counts of {@link MasteryValue},
 *   {@link NormalMinimum} and {@link NormalMaximum} rows, 1 where it has the value and 0 where it
 *   does not: a mastery value or a normal maximum where it writes one, and a normal minimum where
 *   it writes one or its version's XSD defaults it (spec reading 149).
 */
export const Declaration = relation(
  "Declaration",
  {
    baseTypes: drawn(natural),
    cardinalities: drawn(natural),
    declarationKind: closedId(DeclarationKind),
    document: uuid,
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
 * A declaration's `cardinality`, keyed by its node, where it spells a code, a counted member of its
 * {@link Declaration}: `cardinalityLexical`, its lexical form as written (C18's copy), and
 * `cardinality`, the `Cardinality` that form spells (C17).
 *
 * It is the one row a declaration's cardinality is read from: every row that names a declaration
 * copies whether it has one (`cardinalities`), and one that reads the cardinality copies it from
 * here, so only where it is. A `cardinality` that is unwritten or spells nothing, a padded form
 * among them, since the attribute restricts `xs:string`, has no row, and AL3 or its value domain
 * refuses it alone (spec reading 158).
 *
 * Copied text is `keyText` (`#pantry/qti/limits.ts`): each copy sits in a containment's index.
 */
export const DeclarationCardinality = relation(
  "DeclarationCardinality",
  { cardinality: closedId(Cardinality), cardinalityLexical: keyText, node: uuid },
  ["node"],
);

/**
 * A declaration's `base-type`, keyed by its node, where it spells a code, a counted member of its
 * {@link Declaration}: `baseTypeLexical`, its lexical form as written (C18's copy), `baseType`, the
 * `BaseType` that form spells (C17), and `valueBase`, that code as an expression's type
 * (`ValueBaseOf`). A record writes none ("Variables with record cardinality have no base-type",
 * QTI 3.0 information model, tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3), and has no row; nor has a
 * declaration whose `base-type` spells nothing, which its value domain refuses alone (spec reading
 * 158).
 *
 * It is the one row a declaration's base type is read from: every row that names a declaration
 * copies whether it has one (`baseTypes`), and one that reads the type copies it from here, so
 * only where it is.
 */
export const DeclarationBaseType = relation(
  "DeclarationBaseType",
  {
    baseType: closedId(BaseType),
    baseTypeLexical: keyText,
    node: uuid,
    valueBase: closedId(ValueBase),
  },
  ["node"],
);

/**
 * A declaration's `identifier`, keyed by its node, where it names something once collapsed, an
 * NCName: `identifier`, the lexical form without its outer whitespace, and `identifierLead` and
 * `identifierTrail`, the whitespace written around it, which `E1_derived` proves concatenate to
 * `identifierLexical`, the lexical form as written (C18's copy), as {@link RecordFieldName} holds a
 * field's; and its {@link Declaration}'s {@link declarationRef} tuple. The laws over a declared
 * name read it: `Declaration key`, `Declaration not reserved` and `Reserved type`.
 *
 * An `identifier` that is unwritten, or no NCName once collapsed, whitespace alone among them,
 * names nothing, so it has no row, and AL3 or its value domain (`IdentifierDType`, an `xs:NCName`)
 * refuses it alone (spec readings 152 and 157): a missing value is a row of its own relation,
 * never a sentinel, so the declaration's row and every row below it hold without a name, and no
 * reference resolves to it.
 */
export const DeclarationIdentifier = relation(
  "DeclarationIdentifier",
  {
    baseTypes: natural,
    cardinalities: natural,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    identifierLead: Space,
    identifierLexical: keyText,
    identifierTrail: Space,
    node: uuid,
  },
  ["node"],
);

/**
 * A declared name beside its cardinality, keyed by its declaration's node, where the declaration
 * has both a name and a cardinality: its {@link DeclarationIdentifier}'s `identifier`, document,
 * declaration kind and count of base types, and its {@link DeclarationCardinality}'s
 * `cardinality`, which `Reserved type` reads beside the name (a typed outcome name is no record,
 * and QTI_CONTEXT is one).
 *
 * A named declaration whose cardinality is unwritten or spells nothing has no row, so no law reads
 * a cardinality it does not have, and AL3 or its value domain refuses it alone (spec reading 158);
 * a reference still resolves to it, through {@link declarationIdentifierRef} (spec reading 159).
 * Its base type is no field: a record has none, and a declaration whose base type spells nothing
 * has none either, so a law reads it from {@link DeclarationBaseType}, where `baseTypes` is 1.
 */
export const DeclarationName = relation(
  "DeclarationName",
  {
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    node: uuid,
  },
  ["node"],
);

/**
 * The one tuple of a declaration every row that hangs from it by node copies, as `nodeRef` is
 * Node's (C18; the orchestrator's ruling of 2026-11-06): its node, document, declaration kind,
 * and counts of cardinalities and base types, so `Declaration` carries one superkey UNIQUE for them
 * all. Neither the cardinality nor the base type is a field of it: a declaration may have neither,
 * so a row that reads one reads {@link DeclarationCardinality} or {@link DeclarationBaseType},
 * where its count is 1 (lane NIL's audit, B12; spec reading 158). Its name is no field of it
 * either, since a declaration may have none: {@link DeclarationIdentifier} copies this tuple.
 */
export const declarationRef = on(
  Declaration,
  "node",
  "document",
  "declarationKind",
  "cardinalities",
  "baseTypes",
);

/**
 * The one tuple of a named declaration every row that resolves a name to its declaration copies,
 * whatever the declaration's cardinality spells: its node, document, name, declaration kind, and
 * counts of cardinalities and base types, so `DeclarationIdentifier` carries one superkey UNIQUE
 * for them all ({@link DeclarationName} copies it too). Neither the cardinality nor the base type
 * is a field of it: a law over the named declaration's cardinality reads a row of the resolving
 * row's own, copied from {@link DeclarationCardinality} only where `cardinalities` is 1, and one
 * over its base type reads {@link DeclarationBaseType} where `baseTypes` is 1. A declaration whose
 * identifier names nothing has no row here, and nothing resolves to it (spec readings 157 and 159).
 */
export const declarationIdentifierRef = on(
  DeclarationIdentifier,
  "node",
  "document",
  "identifier",
  "declarationKind",
  "cardinalities",
  "baseTypes",
);

/**
 * A declaration's default or correct values, keyed by its `qti-default-value` or
 * `qti-correct-response` node, whose `parent` is the declaration.
 *
 * Its fields, every one written by the host but `fields`:
 *
 * - The node's {@link nodeRef} tuple;
 * - `declarationKind`, `cardinalities` and `baseTypes`, its declaration's, copied through
 *   {@link declarationRef};
 * - `elements` and `elementChildren`, its node's element rank and element children, copied through
 *   `nodeCounts`: its children are its `qti-value`s alone (`CorrectResponseDType`,
 *   `DefaultValueDType`), so `elementChildren` is its number of values;
 * - `fields`, drawn: its {@link RecordField} members' count.
 */
export const ValueSet = relation(
  "ValueSet",
  {
    baseTypes: natural,
    cardinalities: natural,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    elementChildren: natural,
    elements: natural,
    fields: drawn(natural),
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
 * A value set beside its declaration's cardinality, keyed by its node, where the declaration has
 * one: `declaration`, the set's parent, `cardinality`, its {@link DeclarationCardinality}'s, and
 * `elementChildren` and `fields`, its {@link ValueSet}'s counts of values and of fields, which
 * `Value_cardinality` holds to the cardinality. A set of a declaration with no cardinality has no
 * row, and no law reads a cardinality it does not have (spec reading 158).
 */
export const ValueSetCardinality = relation(
  "ValueSetCardinality",
  {
    cardinality: closedId(Cardinality),
    declaration: uuid,
    elementChildren: natural,
    fields: natural,
    node: uuid,
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
 * - `cardinalities` and `baseTypes`, its set's, and `declaration`, its set's parent: where its
 *   declaration has both a cardinality and a base type, its text is read beside them, its
 *   {@link TypedValue}, in that base type unless the declaration is a record; a record's field's
 *   text is read in its own base type, its {@link FieldValue}'s (information model §7.46, Value:
 *   "The base-type is defined by the 'base-type' attribute of the declaration except in the case of
 *   variables with record cardinality").
 */
export const Value = relation(
  "Value",
  {
    baseTypes: natural,
    cardinalities: natural,
    declaration: uuid,
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
 * A value's text beside its declaration's base type and cardinality, keyed by its `qti-value` node,
 * where its declaration has both: `text` and `declaration`, its {@link Value}'s, `baseType`, its
 * declaration's {@link DeclarationBaseType}'s, and `cardinality`, its
 * {@link DeclarationCardinality}'s. `Typed_value` reads the text in the base type unless the
 * cardinality is `record`, whose value is a field read in its own base type ({@link FieldValue}).
 * A declaration with no base type gives its values none to be read in, and one with no
 * cardinality none to tell a record's from another's.
 */
export const TypedValue = relation(
  "TypedValue",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: uuid,
    node: uuid,
    text: keyText,
  },
  ["node"],
);

/**
 * A value's own `base-type`, keyed by its `qti-value` node, where it writes one that spells a code:
 * `baseTypeLexical`, its lexical form as written, `baseType`, the `BaseType` that form spells
 * (C17), and `cardinalities`, its {@link Value}'s. A record's field's text is read in it
 * (information model §7.46.2, Value's base-type: "This characteristic is only used for specifying
 * the base-type of a value that forms part of a record"), through its {@link FieldValue}; any other
 * value's is read in its declaration's, and `Value_cardinality` refuses the attribute there.
 *
 * A `base-type` written as no code has no row, and its value domain refuses it alone (the
 * orchestrator's ruling of 2026-11-06: one cause is refused under one rule).
 */
export const ValueBaseType = relation(
  "ValueBaseType",
  {
    baseType: closedId(BaseType),
    baseTypeLexical: keyText,
    cardinalities: natural,
    node: uuid,
  },
  ["node"],
);

/**
 * A value's text beside its own base type and its declaration's cardinality, keyed by its
 * `qti-value` node, where it has a {@link ValueBaseType} and its declaration a cardinality: `text`
 * and `declaration`, its {@link Value}'s, `baseType`, its {@link ValueBaseType}'s, and
 * `cardinality`, its declaration's {@link DeclarationCardinality}'s. `Typed_value` reads a record's
 * field's text in its own base type; any other value's is read in its declaration's
 * ({@link TypedValue}).
 */
export const FieldValue = relation(
  "FieldValue",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: uuid,
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
 * - `identifierLexical`, its `field-identifier`'s lexical form as written, whose name, where it names
 *   one, is its {@link RecordFieldName}'s;
 * - `baseTypeLexical`, its `base-type`'s lexical form, whose code, where it spells one, is its
 *   {@link ValueBaseType}'s.
 */
export const RecordField = relation(
  "RecordField",
  {
    baseTypeLexical: keyText,
    document: uuid,
    identifierLexical: keyText,
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
 * A record field's name, keyed by its `qti-value` node, where its `field-identifier` names
 * something once collapsed: `identifier`, the lexical form without its outer whitespace, and
 * `identifierLead` and `identifierTrail`, the whitespace written around it, as
 * {@link DeclarationIdentifier}'s is written, with the {@link RecordField}'s `parent` and
 * `identifierLexical` it is copied from. `Record field key` compares fields by it.
 *
 * A `field-identifier` that is no NCName once collapsed, whitespace alone among them, or none at
 * all, names no field, so it has no row, and its value domain (`IdentifierDType`, an `xs:NCName`)
 * or AL3 refuses it alone (spec reading 152): a missing
 * value is a row of its own relation, never a sentinel (lane NIL's audit, B10; the orchestrator's
 * ruling of 2026-11-06: one cause is refused under one rule).
 */
export const RecordFieldName = relation(
  "RecordFieldName",
  {
    identifier: keyText,
    identifierLead: Space,
    identifierLexical: keyText,
    identifierTrail: Space,
    node: uuid,
    parent: uuid,
  },
  ["node"],
);

/**
 * An outcome declaration's `mastery-value`, keyed by its node, where it writes one: its lexical
 * form, a counted member of its {@link Declaration}.
 */
export const MasteryValue = relation("MasteryValue", { lexical: keyText, node: uuid }, ["node"]);

/**
 * The `normal-minimum` an outcome declaration has, by its version, where the version's XSD states a
 * default (spec reading 149): QTI 3.0.1's `default="0.0"` (`imsqti_asiv3p0p1_v1p0.xsd` line 30137;
 * information model §4.5.8, "Default = "0.0"" and "It is set to 0 by default"). QTI 3.0 states none
 * (`imsqti_asiv3p0_v1p0.xsd` line 29989, and its §4.5.8), so a 3.0.0 declaration that writes no
 * `normal-minimum` has no normal minimum. Read from the inventory's leaf, the one statement of the
 * XSD's defaults.
 */
export const normalMinimumDefaults: ReadonlyMap<Version, string> = new Map(
  attributeDeclarations.flatMap(({ default: stated, kind, name, versions }) =>
    kind === "qti-outcome-declaration" && name === "normal-minimum"
      ? Option.toArray(stated).flatMap((value) =>
          versions.map((version) => [version, value] as const),
        )
      : [],
  ),
);

/**
 * An outcome declaration's normal minimum, keyed by its node, where it has one (spec reading 149):
 * `lexical`, its `normal-minimum` as written where `written`, and else its version's default
 * ({@link normalMinimumDefaults}), which `E1_derived` proves; `version`, its declaration's. A
 * counted member of its {@link Declaration}.
 */
export const NormalMinimum = relation(
  "NormalMinimum",
  { lexical: keyText, node: uuid, version: closedId(SchemaVersion), written: pg.boolean },
  ["node"],
);

/**
 * An outcome declaration's `normal-maximum`, keyed by its node, where it writes one, as
 * {@link MasteryValue} is its mastery value.
 */
export const NormalMaximum = relation("NormalMaximum", { lexical: keyText, node: uuid }, ["node"]);

/**
 * An outcome declaration that has both a normal minimum, written or its version's default, and a
 * `mastery-value`, keyed by its node: the two lexical forms, copied from its {@link NormalMinimum}
 * and {@link MasteryValue}, which `Mastery_range` orders (spec readings 9 and 149: each pair judged
 * where both have a value).
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
 * Each declaration's cardinality, counted by `Declaration.cardinalities`: one row, or none where
 * its `cardinality` is unwritten or spells nothing.
 */
export const declarationCardinalityFamily = counted(
  on(DeclarationCardinality, "node"),
  fin(Declaration, "cardinalities"),
);

/**
 * Each declaration's base type, counted by `Declaration.baseTypes`: one row, or none where its
 * `base-type` is unwritten, a record's, or spells nothing.
 */
export const declarationBaseTypeFamily = counted(
  on(DeclarationBaseType, "node"),
  fin(Declaration, "baseTypes"),
);

/**
 * Each outcome declaration's mastery value, counted by `Declaration.masteries`: one row or none.
 */
export const masteryValueFamily = counted(on(MasteryValue, "node"), fin(Declaration, "masteries"));

/**
 * Each outcome declaration's normal minimum, written or its version's default, counted by
 * `Declaration.minimums`: one row or none.
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
    | "mastery-value"
    | "normal-maximum"
    | "normal-minimum",
  kinds: readonly (typeof NodeKind.handles)[number][],
) => select(Attribute, (a) => a.and(a.eq(a.name, name), a.in(a.kind, kinds)));

/**
 * The `identifier` of each declaration that names something once collapsed ({@link namingPattern}):
 * each such declaration's, and only theirs, is copied into its {@link DeclarationIdentifier}. Any
 * other identifier names nothing, and its value domain refuses it alone (spec readings 152 and
 * 157).
 */
const identifiers = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "identifier"),
    a.in(a.kind, declarationKinds),
    Compute.matches(a.lexical, namingPattern),
  ),
);

/**
 * The `base-type` of each declaration that writes one.
 */
const baseTypes = attributesOf("base-type", declarationKinds);

/**
 * The `cardinality` of each declaration that writes one.
 */
const cardinalities = attributesOf("cardinality", declarationKinds);

/**
 * The attributes of one name on the declarations whose lexical form spells a code of a roster:
 * the attributes each of which has its typed row. A form that spells none, a padded one among
 * them, since `base-type` and `cardinality` restrict `xs:string`, is its value domain's alone
 * (spec reading 158).
 *
 * @param name - The attribute's name.
 * @param lexicals - The roster's lexical forms.
 * @returns The selection.
 */
const spelledAttributesOf = (name: "base-type" | "cardinality", lexicals: readonly string[]) =>
  select(Attribute, (a) =>
    a.and(a.eq(a.name, name), a.in(a.kind, declarationKinds), a.in(a.lexical, lexicals)),
  );

/**
 * The `base-type` of each declaration that writes one spelling a code: each has its
 * {@link DeclarationBaseType}.
 */
const spelledBaseTypes = spelledAttributesOf(
  "base-type",
  BaseTypeLexical.rows.map(({ lexical }) => lexical),
);

/**
 * The `cardinality` of each declaration that writes one spelling a code: each has its
 * {@link DeclarationCardinality}.
 */
const spelledCardinalities = spelledAttributesOf(
  "cardinality",
  CardinalityLexical.rows.map(({ lexical }) => lexical),
);

/**
 * The declarations of a record: each's {@link DeclarationCardinality} that is `record`, which has
 * no base type. A declaration with no cardinality is no record and no other variable.
 */
const recordDeclarations = select(DeclarationCardinality, (c) => c.eq(c.cardinality, "record"));

/**
 * The declarations whose cardinality is other than a record's: each's {@link DeclarationCardinality}
 * that is not `record`, every one of which has a base type.
 */
const nonRecordDeclarations = select(DeclarationCardinality, (c) => c.ne(c.cardinality, "record"));

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
 * The record fields whose `field-identifier` names something once collapsed ({@link
 * namingPattern}): the fields each of which has its {@link RecordFieldName}. Any other form is its
 * value domain's alone.
 */
const namedFields = select(RecordField, (f) => Compute.matches(f.identifierLexical, namingPattern));

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
 * The normal minimums each outcome declaration writes: the {@link NormalMinimum} rows that copy
 * a `normal-minimum` attribute, which a default does not.
 */
const writtenMinimums = select(NormalMinimum, (n) => n.eq(n.written, true));

/**
 * The `normal-maximum` of each outcome declaration that writes one.
 */
const normalMaximums = scaleAttributes("normal-maximum");

/**
 * A `DeclarationIdentifier` row as a row check reads it.
 */
type DeclarationIdentifierRow = RowScalars<typeof DeclarationIdentifier>;

/**
 * A `DeclarationName` row as a row check reads it.
 */
type DeclarationNameRow = RowScalars<typeof DeclarationName>;

/**
 * A `RecordFieldName` row as a row check reads it.
 */
type RecordFieldNameRow = RowScalars<typeof RecordFieldName>;

/**
 * A `TypedValue` row as a row check reads it.
 */
type TypedValueRow = RowScalars<typeof TypedValue>;

/**
 * A `FieldValue` row as a row check reads it.
 */
type FieldValueRow = RowScalars<typeof FieldValue>;

/**
 * A `MasteryFloor` row as a row check reads it.
 */
type MasteryFloorRow = RowScalars<typeof MasteryFloor>;

/**
 * A `MasteryCeiling` row as a row check reads it.
 */
type MasteryCeilingRow = RowScalars<typeof MasteryCeiling>;

/**
 * State that a declaration's name is the collapsed form of its lexical form: the pieces
 * concatenate to it, and the name holds no whitespace, so the pieces hold all of it.
 *
 * @param d - The row.
 * @returns The predicate.
 */
const collapsedDeclared = (d: DeclarationIdentifierRow) =>
  d.and(
    d.eq(
      d.identifierLexical,
      Compute.concat(Compute.concat(d.identifierLead, d.identifier), d.identifierTrail),
    ),
    Compute.matches(d.identifier, namePattern),
  );

/**
 * State that a record field's name is the collapsed form of its lexical form, as
 * {@link collapsedDeclared} states a declaration's.
 *
 * @param f - The row.
 * @returns The predicate.
 */
const collapsedField = (f: RecordFieldNameRow) =>
  f.and(
    f.eq(
      f.identifierLexical,
      Compute.concat(Compute.concat(f.identifierLead, f.identifier), f.identifierTrail),
    ),
    Compute.matches(f.identifier, namePattern),
  );

/**
 * State that a declaration of a typed outcome name is no record, which has no base type, or names
 * another identifier: the law over the name's whole value, judged by its cardinality alone, where
 * it has one. Its base type, where it has one, is judged against the type the specification gives
 * it by {@link reservedBaseTypeLaws}, whatever its cardinality.
 *
 * @param d - The row.
 * @param reserved - The typed name.
 * @returns The predicate.
 */
const reservedNotRecord = (d: DeclarationNameRow, reserved: ReservedBaseType) =>
  d.or(
    d.ne(d.declarationKind, reserved.kind),
    d.ne(d.identifier, reserved.identifier),
    d.ne(d.cardinality, "record"),
  );

/**
 * State that a declaration of each typed outcome name that has a base type has the one the
 * specification gives it: its {@link DeclarationBaseType} is that type's. A declaration of the name
 * with no base type is a record, which {@link reservedNotRecord} refuses, or one `Declaration base
 * type` refuses alone.
 */
const reservedBaseTypeLaws = reservedBaseTypes.map((reserved) =>
  contained(
    on(
      select(DeclarationIdentifier, (d) =>
        d.and(
          d.eq(d.declarationKind, reserved.kind),
          d.eq(d.identifier, reserved.identifier),
          d.eq(d.baseTypes, 1n),
        ),
      ),
      "node",
    ),
    on(
      select(DeclarationBaseType, (b) => b.eq(b.baseType, reserved.baseType)),
      "node",
    ),
  ),
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
 * State `Typed_value` over a value of a set that is no record's: its text is a lexical form of its
 * declaration's base type, by `BaseTypePattern`, the one pattern per base type that a base value's
 * text and a map key are judged by too; every text of a base type of `unjudgedBaseTypes` is one, so
 * it is matched against nothing. A record's value is a field, whose text {@link fieldValueCheck}
 * judges.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const valueCheck = (v: TypedValueRow) =>
  v.or(
    v.eq(v.cardinality, "record"),
    v.in(v.baseType, unjudgedBaseTypes),
    Compute.matches(v.text, BaseTypePattern.at("pattern", v.baseType)),
  );

/**
 * State `Typed_value` over a value's own base type: in a record's set, the field's text is a
 * lexical form of it, as {@link valueCheck} judges a declared value's; in any other set, the
 * value's text is judged in its declaration's.
 *
 * @param f - The row.
 * @returns The predicate.
 */
const fieldValueCheck = (f: FieldValueRow) =>
  f.or(
    f.ne(f.cardinality, "record"),
    f.in(f.baseType, unjudgedBaseTypes),
    Compute.matches(f.text, BaseTypePattern.at("pattern", f.baseType)),
  );

/**
 * The values of a declaration that has both a base type and a cardinality: each has its
 * {@link TypedValue}.
 */
const typedValues = select(Value, (v) => v.and(v.eq(v.baseTypes, 1n), v.eq(v.cardinalities, 1n)));

/**
 * The values that write a base type spelling a code, of a declaration that has a cardinality:
 * each has its {@link FieldValue}.
 */
const fieldValues = select(ValueBaseType, (b) => b.eq(b.cardinalities, 1n));

/**
 * State `Mastery_range` over a mastery value written and a normal minimum, written or its version's
 * default (readings 9 and 149): the minimum is no greater than the mastery value. Each lexical form
 * in `xs:double`'s lexical space (`doublePattern` of `#pantry/qti/operators.ts`, XML Schema 1.0's,
 * reading 71's edition) is read as the double grizzle's `Compute.parseDouble` maps it to, XML
 * Schema 1.1's doubleLexicalMap (Part 2 §3.3.5.2, reading 144), of any digits and any exponent.
 * `NaN` is ordered against nothing. A form outside the lexical space stands as the end of the order
 * that holds it, so the pair is not judged: a form that is no `xs:double` has no value, which its
 * value domain alone refuses; and a form with outer whitespace, which `xs:double`'s whiteSpace
 * collapses (XML Schema Part 2 §4.3.6), is not read, a stated limit while grizzle's
 * `Compute.matches` guard proves nothing of a `Compute.collapse` subject in its branch.
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
        Compute.matches(r.normalMinimum, doublePattern),
        (low) => Compute.parseDouble(low),
        Number.NEGATIVE_INFINITY,
      ),
      Compute.when(
        Compute.matches(r.masteryValue, doublePattern),
        (mastery) => Compute.parseDouble(mastery),
        Number.POSITIVE_INFINITY,
      ),
    ),
  );

/**
 * State `Mastery_range` over a mastery value and a normal maximum both written, each read as
 * {@link floorCheck} reads the other pair.
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
        Compute.matches(r.masteryValue, doublePattern),
        (mastery) => Compute.parseDouble(mastery),
        Number.NEGATIVE_INFINITY,
      ),
      Compute.when(
        Compute.matches(r.normalMaximum, doublePattern),
        (high) => Compute.parseDouble(high),
        Number.POSITIVE_INFINITY,
      ),
    ),
  );

/**
 * Every statement over the O2 overlays, each `check` named by its oracle law:
 *
 * - **the copies (C18):** each overlay copies its node's {@link nodeRef} tuple;
 *   {@link DeclarationCardinality} its `cardinality` and {@link DeclarationBaseType} its
 *   `base-type`, each where it spells a code, {@link DeclarationIdentifier} its `identifier` where
 *   that names something and its declaration's {@link declarationRef} tuple,
 *   {@link DeclarationName} its identifier's name and its cardinality, a value set its
 *   declaration's, {@link ValueSetCardinality} its set's counts and its declaration's cardinality,
 *   a value its text and its set's, {@link TypedValue} a value's text and its declaration's base
 *   type and cardinality, {@link ValueBaseType} a value's own `base-type` that spells a code,
 *   {@link FieldValue} a value's text, its own base type and its declaration's cardinality, a
 *   record field its `field-identifier` and `base-type`, {@link RecordFieldName} its field's
 *   `field-identifier` where that names something, and each scale row its attribute. Each optional
 *   attribute's copy has a reverse containment, so a row holds a lexical form exactly where its
 *   element writes one; a normal minimum's, over its `written` rows, since an outcome declaration
 *   of a version whose XSD defaults it has its row whether it writes it or not (reading 149).
 * - **existence:** every declaration element has its row, through a containment from `Node`, whatever
 *   its attributes spell (spec readings 157 and 158). It has its cardinality, its base type and its
 *   identifier each exactly where that attribute spells a code or names something, through the
 *   attribute's copy and its reverse, its cardinality and base type counted; one that is unwritten
 *   or spells nothing has no row, and AL3 or the attribute's value domain refuses it alone (lane
 *   NIL's audit, B11: a missing value is a row of its own relation, never a sentinel). A
 *   declaration has its {@link DeclarationName} exactly where it has both a name and a cardinality.
 *   Every value set and value of a declaration has its row through a containment from `Node`, each
 *   set and value of a declaration with a cardinality its typed row through its count, every record
 *   value its field (`Value_cardinality`), every field whose `field-identifier` names something its
 *   name, through {@link namedFields}, and every outcome declaration of a version that defaults its
 *   normal minimum its {@link NormalMinimum}, and every outcome declaration that has both ends of a
 *   pair of its scale its {@link MasteryFloor} or {@link MasteryCeiling}, through its counts. A
 *   field whose `field-identifier` is whitespace alone has no name, and its value domain refuses it
 *   alone.
 * - **E1 (C17), `E1_derived`:** a declaration's kind is its `Declares` kind; each code is the one its
 *   lexical form spells (`<Roster>Lexical`), and a base type's expression type its `ValueBaseOf`
 *   image; each name is its lexical form collapsed; a normal minimum not written is its version's
 *   default.
 * - **`Declaration key`** (spec reading 74): `key(document, identifier)` over the identifiers.
 * - **`Declaration not reserved`** (reading 72): no declaration names a built-in session variable, in
 *   any document, an item's, a test's or a section's alike, since every named declaration element
 *   has its identifier whatever its root (information model tables 4.5.1, 5.115.1 and 5.151.1).
 * - **`Reserved type`**: SCORE, MAXSCORE, PASSED and QTI_CONTEXT keep their specified types: a typed
 *   name has its type where it has a base type, QTI_CONTEXT is declared as a context, and, where it
 *   has a cardinality, a typed outcome name is no record and QTI_CONTEXT is one.
 * - **`Declaration base type`**: a record has no base type, and every declaration of another
 *   cardinality writes one; one that spells nothing is its value domain's alone (spec reading
 *   158).
 * - **`Value cardinality`**: a single variable's value set holds one value, and a record's set holds
 *   only fields, one per value, distinct by name (`Record field key`, over
 *   {@link RecordFieldName}); a value writes a `field-identifier` or a `base-type` only as a field,
 *   both or neither, whatever its declaration's cardinality.
 * - **`Typed value`** (C1, G-match): each value's text is a lexical form of its base type: its
 *   declaration's ({@link TypedValue}) or, a record's field's, its own ({@link FieldValue}).
 * - **`Mastery range`** (C2, G-parse): the mastery value lies in the normal range, each pair judged
 *   where both have a value: written, or a normal minimum's version default (reading 149).
 */
export const declarationLawsByName = {
  "Declaration base type": [
    contained(
      on(recordDeclarations, "node"),
      on(
        select(Declaration, (d) => d.eq(d.baseTypes, 0n)),
        "node",
      ),
    ),
    contained(on(nonRecordDeclarations, "node"), on(baseTypes, "node")),
  ],
  "Declaration key": [key(on(DeclarationIdentifier, "document", "identifier"))],
  "Declaration not reserved": [
    check("Declaration_not_reserved", DeclarationIdentifier, (d) =>
      d.not(d.in(d.identifier, sessionVariables)),
    ),
  ],
  "Declaration overlay": [
    contained(
      on(Declaration, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) => n.in(n.kind, declarationKinds)),
        "id",
      ),
      on(Declaration, "node"),
    ),
    contained(
      on(spelledCardinalities, "node", "lexical"),
      on(DeclarationCardinality, "node", "cardinalityLexical"),
    ),
    contained(on(DeclarationCardinality, "node"), on(cardinalities, "node")),
    declarationCardinalityFamily,
    contained(
      on(spelledBaseTypes, "node", "lexical"),
      on(DeclarationBaseType, "node", "baseTypeLexical"),
    ),
    contained(on(DeclarationBaseType, "node"), on(baseTypes, "node")),
    declarationBaseTypeFamily,
    contained(
      on(identifiers, "node", "lexical"),
      on(DeclarationIdentifier, "node", "identifierLexical"),
    ),
    contained(on(DeclarationIdentifier, "node"), on(identifiers, "node")),
    contained(
      on(
        DeclarationIdentifier,
        "node",
        "document",
        "declarationKind",
        "cardinalities",
        "baseTypes",
      ),
      declarationRef,
    ),
    contained(
      on(
        select(DeclarationIdentifier, (d) => d.eq(d.cardinalities, 1n)),
        "node",
      ),
      on(DeclarationName, "node"),
    ),
    contained(
      on(
        DeclarationName,
        "node",
        "document",
        "identifier",
        "declarationKind",
        constant(1n),
        "baseTypes",
      ),
      declarationIdentifierRef,
    ),
    contained(
      on(DeclarationName, "node", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
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
      on(ValueSet, "parent", "document", "declarationKind", "cardinalities", "baseTypes"),
      declarationRef,
    ),
    contained(
      on(
        select(ValueSet, (s) => s.eq(s.cardinalities, 1n)),
        "node",
      ),
      on(ValueSetCardinality, "node"),
    ),
    contained(
      on(ValueSetCardinality, "node", "declaration", "elementChildren", "fields"),
      on(ValueSet, "node", "parent", "elementChildren", "fields"),
    ),
    contained(
      on(ValueSetCardinality, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
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
      on(Value, "parent", "cardinalities", "baseTypes", "declaration"),
      on(ValueSet, "node", "cardinalities", "baseTypes", "parent"),
    ),
    contained(on(typedValues, "node"), on(TypedValue, "node")),
    contained(
      on(TypedValue, "node", "declaration", "text"),
      on(Value, "node", "declaration", "text"),
    ),
    contained(
      on(TypedValue, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "baseType"),
    ),
    contained(
      on(TypedValue, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    contained(
      on(spelledFieldBaseTypes, "node", "lexical"),
      on(ValueBaseType, "node", "baseTypeLexical"),
    ),
    contained(on(ValueBaseType, "node"), on(fieldBaseTypes, "node")),
    contained(on(ValueBaseType, "node", "cardinalities"), on(Value, "node", "cardinalities")),
    contained(on(fieldValues, "node"), on(FieldValue, "node")),
    contained(
      on(FieldValue, "node", "declaration", "text"),
      on(Value, "node", "declaration", "text"),
    ),
    contained(on(FieldValue, "node", "baseType"), on(ValueBaseType, "node", "baseType")),
    contained(
      on(FieldValue, "declaration", "cardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    contained(
      on(RecordField, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(RecordFieldName, "node", "parent", "identifierLexical"),
      on(RecordField, "node", "parent", "identifierLexical"),
    ),
    contained(
      on(namedFields, "node", "identifierLexical"),
      on(RecordFieldName, "node", "identifierLexical"),
    ),
    masteryValueFamily,
    contained(on(masteryValues, "node", "lexical"), on(MasteryValue, "node", "lexical")),
    contained(on(MasteryValue, "node"), on(masteryValues, "node")),
    normalMinimumFamily,
    contained(on(NormalMinimum, "node", "version"), on(Declaration, "node", "version")),
    contained(on(normalMinimums, "node", "lexical"), on(writtenMinimums, "node", "lexical")),
    contained(on(writtenMinimums, "node"), on(normalMinimums, "node")),
    contained(
      on(
        select(Declaration, (d) =>
          d.and(
            d.eq(d.kind, "qti-outcome-declaration"),
            d.in(d.version, [...normalMinimumDefaults.keys()]),
          ),
        ),
        "node",
      ),
      on(NormalMinimum, "node"),
    ),
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
    check("E1_derived", DeclarationCardinality, (c) =>
      c.eq(CardinalityLexical.at("lexical", c.cardinality), c.cardinalityLexical),
    ),
    check("E1_derived", DeclarationIdentifier, collapsedDeclared),
    check("E1_derived", DeclarationBaseType, (b) =>
      b.and(
        b.eq(BaseTypeLexical.at("lexical", b.baseType), b.baseTypeLexical),
        b.eq(ValueBaseOf.at("value", b.baseType), b.valueBase),
      ),
    ),
    check("E1_derived", ValueBaseType, (b) =>
      b.eq(BaseTypeLexical.at("lexical", b.baseType), b.baseTypeLexical),
    ),
    check("E1_derived", RecordFieldName, collapsedField),
    check("E1_derived", NormalMinimum, (n) =>
      n.or(
        n.eq(n.written, true),
        ...[...normalMinimumDefaults].map(([version, lexical]) =>
          n.and(n.eq(n.version, version), n.eq(n.lexical, lexical)),
        ),
      ),
    ),
  ],
  "Mastery range": [
    check("Mastery_range", MasteryFloor, floorCheck),
    check("Mastery_range", MasteryCeiling, ceilingCheck),
  ],
  "Record field key": [key(on(RecordFieldName, "parent", "identifier"))],
  "Reserved type": [
    ...reservedBaseTypeLaws,
    check("Reserved_type", DeclarationIdentifier, (d) =>
      d.or(
        d.ne(d.identifier, contextVariable.identifier),
        d.eq(d.declarationKind, contextVariable.kind),
      ),
    ),
    check("Reserved_type", DeclarationName, (d) =>
      d.and(
        ...reservedBaseTypes.map((reserved) => reservedNotRecord(d, reserved)),
        d.or(
          d.ne(d.identifier, contextVariable.identifier),
          d.eq(d.cardinality, contextVariable.cardinality),
        ),
      ),
    ),
  ],
  "Typed value": [
    check("Typed_value", TypedValue, valueCheck),
    check("Typed_value", FieldValue, fieldValueCheck),
  ],
  "Value cardinality": [
    contained(on(ValueSet, "node", "elements", "elementChildren"), nodeCounts),
    recordFieldFamily,
    check("Value_cardinality", ValueSetCardinality, (s) =>
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
