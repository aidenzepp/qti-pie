/**
 * The value sets of a declaration: the `qti-default-value` and `qti-correct-response` elements.
 *
 * A declaration holds at most one default and one correct value set. A set is typed or a record
 * as its declaration is, and a typed set copies the declaration's base type and cardinality so
 * the values it holds can be checked against them. The role is a thin arm of its own for each of
 * the two elements this module owns.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the declaration and processing modules name; the shape here is the typed-or-record choice, not a structure. */
import type { FieldBase } from "@bjornpagen/grizzle";
import {
  alternatives,
  capacity,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import * as declaration from "#qti/schema/declaration.ts";
import * as node from "#qti/schema/node.ts";
import type { Rule } from "#qti/import/refusal.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * Which element a value set is written as.
 */
export const ValueRole = closed("ValueRole", ["default", "correct"]);

/**
 * The values a declaration starts with, or the values that answer it correctly. Its parent node
 * is the declaration.
 */
export const ValueSet = relation(
  "ValueSet",
  {
    declaration: uuid,
    id: uuid,
    role: closedId(ValueRole),
    shape: closedId(declaration.DeclarationShape),
  },
  ["id"],
);

/**
 * The `interpretation` text of a value set. Its whitespace class is the owner kind's at import,
 * so the type admits every character and the import's typed-copy guard checks the rest.
 */
export const ValueSetInterpretation = relation(
  "ValueSetInterpretation",
  {
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
    valueSet: uuid,
  },
  ["valueSet"],
);

/**
 * A value set of a typed declaration. `declaration`, `baseType` and `cardinality` copy the
 * declaration's.
 */
export const TypedValueSet = relation(
  "TypedValueSet",
  {
    baseType: closedId(declaration.BaseType),
    cardinality: closedId(declaration.TypedCardinality),
    declaration: uuid,
    id: uuid,
  },
  ["id"],
);

/**
 * A value set of a record declaration.
 */
export const RecordValueSet = relation("RecordValueSet", { id: uuid }, ["id"]);

/**
 * The `qti-correct-response` element: a value set of the correct role.
 */
export const CorrectResponseArm = relation("CorrectResponseArm", { id: uuid }, ["id"]);

/**
 * The `qti-default-value` element: a value set of the default role.
 */
export const DefaultValueArm = relation("DefaultValueArm", { id: uuid }, ["id"]);

/**
 * The places a `qti-value`'s text is written as one of the eleven base types, each with the prefix
 * of its arm relations and the refusal rule that judges the text before it is written.
 */
export const valueContexts = [
  { context: "Declared", prefix: "DeclaredValue", rule: "value-lexical" },
  { context: "Literal", prefix: "Literal", rule: "P7" },
  { context: "Usage", prefix: "UsageTypedValue", rule: "usage-typed-value" },
  { context: "MapKey", prefix: "MapEntry", rule: "map-key-lexical" },
  { context: "MatchDefault", prefix: "MatchTableDefaultValue", rule: "attribute-lexical" },
  { context: "MatchTarget", prefix: "MatchTableEntry", rule: "attribute-lexical" },
  {
    context: "InterpolationDefault",
    prefix: "InterpolationTableDefaultValue",
    rule: "attribute-lexical",
  },
  { context: "InterpolationTarget", prefix: "InterpolationTableEntry", rule: "attribute-lexical" },
] as const satisfies readonly { context: string; prefix: string; rule: Rule }[];

/**
 * One of the eight contexts of `valueContexts`.
 */
export type ValueContext = (typeof valueContexts)[number]["context"];

const normalized = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

const double = str.regex(patterns.xsDouble);

const pair = str.regex(patterns.pair);

/**
 * The lexical form of a value of each base type: a duration is a number of seconds, and a string
 * or a file is the text after replacement.
 */
const lexicalForms = {
  boolean: str.regex(patterns.booleanLiteral),
  directedPair: pair,
  duration: double,
  file: normalized,
  float: double,
  identifier: str.regex(patterns.ncName),
  integer: str.regex(patterns.xsInteger),
  pair,
  point: str.regex(patterns.point),
  string: normalized,
  uri: str.regex(patterns.anyUri),
};

const lexicalByContext: Record<ValueContext, typeof lexicalForms> = {
  Declared: lexicalForms,
  InterpolationDefault: lexicalForms,
  InterpolationTarget: lexicalForms,
  Literal: lexicalForms,
  MapKey: lexicalForms,
  MatchDefault: lexicalForms,
  MatchTarget: lexicalForms,
  Usage: lexicalForms,
};

/**
 * The field type of each of the eleven base types in a context.
 */
export const lexicalOf = (context: ValueContext) => lexicalByContext[context];

/**
 * The eleven `qti-value` arms of a base type in a context, named `<prefix><BaseType>`. Each holds
 * the value, the concatenation of the element's text children with each tab, line feed and
 * carriage return replaced by a space, which the context's field type for the base type judges.
 * The prefix lets another parent reuse the arms without a name collision.
 */
export const valueArms = (prefix: string, context: ValueContext) => {
  const arm = <const Name extends string, Value extends FieldBase>(name: Name, value: Value) =>
    relation(`${prefix}${name}`, { id: uuid, value }, ["id"]);
  const lexical = lexicalOf(context);

  return {
    boolean: arm("Boolean", lexical.boolean),
    directedPair: arm("DirectedPair", lexical.directedPair),
    duration: arm("Duration", lexical.duration),
    file: arm("File", lexical.file),
    float: arm("Float", lexical.float),
    identifier: arm("Identifier", lexical.identifier),
    integer: arm("Integer", lexical.integer),
    pair: arm("Pair", lexical.pair),
    point: arm("Point", lexical.point),
    string: arm("String", lexical.string),
    uri: arm("Uri", lexical.uri),
  };
};

const declaredValueArms = valueArms("DeclaredValue", "Declared");

/**
 * One `qti-value` of a value set, at its position. A typed value has the base type of its set;
 * a record value is a field of the record.
 */
export const DeclaredValue = relation(
  "DeclaredValue",
  {
    baseType: closedId(declaration.BaseType),
    id: uuid,
    position: pg.bigint,
    shape: closedId(declaration.DeclarationShape),
    valueSet: uuid,
  },
  ["id"],
);

/**
 * A record value's field: the `field-identifier` of the `qti-value`.
 */
export const RecordField = relation(
  "RecordField",
  { fieldIdentifier: str.regex(patterns.ncName), id: uuid },
  ["id"],
);

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  CorrectResponseArm,
  DeclaredValue,
  DeclaredValueBoolean: declaredValueArms.boolean,
  DeclaredValueDirectedPair: declaredValueArms.directedPair,
  DeclaredValueDuration: declaredValueArms.duration,
  DeclaredValueFile: declaredValueArms.file,
  DeclaredValueFloat: declaredValueArms.float,
  DeclaredValueIdentifier: declaredValueArms.identifier,
  DeclaredValueInteger: declaredValueArms.integer,
  DeclaredValuePair: declaredValueArms.pair,
  DeclaredValuePoint: declaredValueArms.point,
  DeclaredValueString: declaredValueArms.string,
  DeclaredValueUri: declaredValueArms.uri,
  DefaultValueArm,
  RecordField,
  RecordValueSet,
  TypedValueSet,
  ValueRole,
  ValueSet,
  ValueSetInterpretation,
};

/**
 * The element arms of this module, by element name.
 */
export const arms = {
  "qti-correct-response": CorrectResponseArm,
  "qti-default-value": DefaultValueArm,
  "qti-value": DeclaredValue,
};

/**
 * The statements over this module's relations: a declaration has at most one set of each role;
 * a set hangs from its declaration in the tree and copies the declaration's shape; a set is typed
 * or a record, a typed one copying the declaration's base type and cardinality; and a role arm
 * exists exactly for a set of its role. A value hangs from its set in the tree at its position,
 * copies the set's shape, and a typed one holds its set's base type. A single-cardinality set
 * holds exactly one value and every set at least one.
 */
export const rules = [
  key(ValueSet, ["declaration", "role"]),
  contained(on(ValueSet, "id", "declaration"), on(node.Edge, "child", "parent")),
  contained(on(ValueSet, "declaration", "shape"), on(declaration.Declaration, "id", "shape")),
  contained(on(ValueSetInterpretation, "valueSet"), on(ValueSet, "id")),
  alternatives(ValueSet, "shape", declaration.DeclarationShape, {
    record: RecordValueSet,
    typed: TypedValueSet,
  }),
  contained(on(TypedValueSet, "id", "declaration"), on(ValueSet, "id", "declaration")),
  contained(
    on(TypedValueSet, "declaration", "baseType", "cardinality"),
    on(declaration.TypedDeclaration, "id", "baseType", "cardinality"),
  ),
  mirrors(on(CorrectResponseArm, "id"), on(select(ValueSet, { role: "correct" }), "id")),
  mirrors(on(DefaultValueArm, "id"), on(select(ValueSet, { role: "default" }), "id")),
  contained(on(DeclaredValue, "valueSet", "shape"), on(ValueSet, "id", "shape")),
  contained(
    on(DeclaredValue, "id", "valueSet", "position"),
    on(node.Edge, "child", "parent", "position"),
  ),
  contained(
    on(select(DeclaredValue, { shape: "typed" }), "valueSet", "baseType"),
    on(TypedValueSet, "id", "baseType"),
  ),
  alternatives(DeclaredValue, "baseType", declaration.BaseType, declaredValueArms),
  alternatives(DeclaredValue, "shape", declaration.DeclarationShape, { record: RecordField }),
  capacity(on(select(TypedValueSet, { cardinality: "single" }), "id"), {
    from: on(DeclaredValue, "valueSet"),
    within: within(1n, 1n),
  }),
  capacity(on(ValueSet, "id"), { from: on(DeclaredValue, "valueSet"), within: within(1n, "*") }),
] as const;
