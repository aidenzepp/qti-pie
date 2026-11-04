/**
 * The value sets of a declaration: the `qti-default-value` and `qti-correct-response` elements.
 *
 * A declaration holds at most one default and one correct value set. A set is typed or a record
 * as its declaration is, and a typed set copies the declaration's base type and cardinality so
 * the values it holds can be checked against them. The role is a thin arm of its own for each of
 * the two elements this module owns.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the declaration and processing modules name; the shape here is the typed-or-record choice, not a structure. */
import type { FieldBase, Relation } from "@bjornpagen/grizzle";
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
import * as declaration from "#pantry/schema/declaration.ts";
import * as node from "#pantry/schema/node.ts";
import { RecordFieldIdentifier } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import type { ValueContext } from "#pantry/schema/value-contexts.ts";
import { lexicalOf } from "#pantry/schema/value-contexts.ts";
import { valueArmContracts } from "#pantry/schema/value-contracts.ts";

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

const armContracts = valueArmContracts();

/**
 * The eleven field types of each context: the lexical forms of `value-contexts.ts`, with the
 * context's own contract for each of the eight base types that has one. Each context is spread
 * on its own, so a caller sees that context's contracts and not the union of every context's.
 */
const fieldsByContext = {
  Declared: { ...lexicalOf("Declared"), ...armContracts.Declared },
  InterpolationDefault: {
    ...lexicalOf("InterpolationDefault"),
    ...armContracts.InterpolationDefault,
  },
  InterpolationTarget: { ...lexicalOf("InterpolationTarget"), ...armContracts.InterpolationTarget },
  Literal: { ...lexicalOf("Literal"), ...armContracts.Literal },
  MapKey: { ...lexicalOf("MapKey"), ...armContracts.MapKey },
  MatchDefault: { ...lexicalOf("MatchDefault"), ...armContracts.MatchDefault },
  MatchTarget: { ...lexicalOf("MatchTarget"), ...armContracts.MatchTarget },
  Usage: { ...lexicalOf("Usage"), ...armContracts.Usage },
} satisfies { readonly [Context in ValueContext]: ElevenFields };

/**
 * The field type of each of the eleven base types in a context: the context's contract for each
 * of the eight base types that have one, and the lexical form of `value-contexts.ts` for the
 * boolean, the file and the string.
 */
export const fieldsOf = <const Context extends ValueContext>(
  context: Context,
): (typeof fieldsByContext)[Context] => fieldsByContext[context];

/**
 * The eleven field types of a context, as the arm relations read them.
 */
interface ElevenFields {
  readonly boolean: FieldBase;
  readonly directedPair: FieldBase;
  readonly duration: FieldBase;
  readonly file: FieldBase;
  readonly float: FieldBase;
  readonly identifier: FieldBase;
  readonly integer: FieldBase;
  readonly pair: FieldBase;
  readonly point: FieldBase;
  readonly string: FieldBase;
  readonly uri: FieldBase;
}

/**
 * The eleven arm relations of a prefix over a context's eleven field types, each arm holding its
 * base type's field. `valueArms` states the type each context's arms have.
 */
const armsOf = (prefix: string, fields: ElevenFields) => {
  const arm = <const Name extends string, Value extends FieldBase>(name: Name, value: Value) =>
    relation(`${prefix}${name}`, { id: uuid, value }, ["id"]);

  return {
    boolean: arm("Boolean", fields.boolean),
    directedPair: arm("DirectedPair", fields.directedPair),
    duration: arm("Duration", fields.duration),
    file: arm("File", fields.file),
    float: arm("Float", fields.float),
    identifier: arm("Identifier", fields.identifier),
    integer: arm("Integer", fields.integer),
    pair: arm("Pair", fields.pair),
    point: arm("Point", fields.point),
    string: arm("String", fields.string),
    uri: arm("Uri", fields.uri),
  };
};

/**
 * One arm relation of a prefix: the relation `<prefix><Name>` holding the value of one base type.
 */
type ArmRelation<Prefix extends string, Name extends string, Value> = Relation<
  `${Prefix}${Name}`,
  { readonly id: typeof uuid; readonly value: Value },
  readonly ["id"]
>;

/**
 * The eleven arm relations `valueArms` returns for a prefix and a context, each over the field
 * type the context holds for its base type.
 */
type ArmsOf<Prefix extends string, Context extends ValueContext> = {
  readonly [Name in keyof (typeof fieldsByContext)[Context] as Name]: ArmRelation<
    Prefix,
    Capitalize<Name & string>,
    (typeof fieldsByContext)[Context][Name]
  >;
};

/**
 * The eleven `qti-value` arms of a base type in a context, named `<prefix><BaseType>`. Each holds
 * the value, the concatenation of the element's text children with each tab, line feed and
 * carriage return replaced by a space, which the context's field type for the base type judges.
 * The prefix lets another parent reuse the arms without a name collision.
 */
export const valueArms = <const Prefix extends string, const Context extends ValueContext>(
  prefix: Prefix,
  context: Context,
): ArmsOf<Prefix, Context> =>
  // SAFETY: `armsOf` builds each arm from the field `fieldsByContext` holds for `context` and its base type, under `${prefix}${Name}`; `ArmsOf` states those same names and fields, which a generic call cannot carry through the context lookup.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  armsOf(prefix, fieldsOf(context)) as ArmsOf<Prefix, Context>;

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
  { fieldIdentifier: RecordFieldIdentifier, id: uuid },
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
