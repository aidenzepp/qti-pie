import type { BaseType } from "#pantry/schema/declaration.ts";
import type { expressionKinds } from "#pantry/schema/kinds/asi.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";

/**
 * A base type an expression can have: one of phase-1's eleven declared base types, `any` (the
 * type of `qti-null`, whose NULL is "treated as if it is of any desired base-type"), or `unknown`
 * (a template parameter, or a variable the declaration relations would type).
 */
export type BaseTypeOrAny = (typeof BaseType.handles)[number] | "any" | "unknown";

/**
 * A cardinality an expression can have. `record` is a record container; `unknown` marks a value
 * whose cardinality only a declaration can say, and the cardinality of `qti-null`.
 */
export type Cardinality = "single" | "multiple" | "ordered" | "record" | "unknown";

/**
 * The type the checker assigns an expression: its base type and its cardinality.
 */
export interface EffectiveType {
  readonly baseType: BaseTypeOrAny;
  readonly cardinality: Cardinality;
}

/**
 * The attributes of an expression that its result type depends on, read by the checker from the
 * node or from the declaration the node refers to.
 *
 * `baseType` and `cardinality` are the referenced declaration's (`qti-variable`, `qti-default`,
 * `qti-correct`), `qti-base-value`'s `base-type` or `qti-test-variables`' `base-type`. `name` is
 * the operator name of `qti-math-operator` or `qti-stats-operator`.
 */
export interface ResultAttributes {
  readonly baseType?: BaseTypeOrAny;
  readonly cardinality?: Cardinality;
  readonly name?: string;
}

/**
 * An expression kind: one of the 64 in `expressionKinds` of `kinds/asi.ts`.
 */
export type ExpressionKind = (typeof expressionKinds)[number];

/**
 * A kind's result-type rule: the type of the expression from the types of its operands and its
 * attributes.
 */
type ResultRule = (operands: readonly EffectiveType[], attrs: ResultAttributes) => EffectiveType;

/**
 * The type no rule can say: a template parameter, or a value only a declaration types.
 */
const UNKNOWN: EffectiveType = { baseType: "unknown", cardinality: "unknown" };

/**
 * Construct the single-cardinality type of a base type.
 */
const single = (baseType: BaseTypeOrAny): EffectiveType => ({ baseType, cardinality: "single" });

/**
 * Whether a type is numerical. Only `integer` and `float` are: `duration` is not, since the
 * specification's "numerical base-type" is the word its comparison operators use and
 * `qti-duration-lt` and `qti-duration-gte` take the duration types apart.
 */
export const numerical = (type: EffectiveType): boolean =>
  type.baseType === "integer" || type.baseType === "float";

/**
 * Join two base types. `any` yields to the other side, `unknown` absorbs, equal types stay, and
 * two different concrete types join to `unknown` (the checker refuses the pair separately).
 */
const joinBase = (a: BaseTypeOrAny, b: BaseTypeOrAny): BaseTypeOrAny => {
  if (a === "any") {
    return b;
  }

  if (b === "any") {
    return a;
  }

  return a === b ? a : "unknown";
};

/**
 * Join two effective types: the base types by `joinBase`, and the cardinalities by equality, with
 * `unknown` for two that differ.
 */
export const unify = (a: EffectiveType, b: EffectiveType): EffectiveType => ({
  baseType: joinBase(a.baseType, b.baseType),
  cardinality: a.cardinality === b.cardinality ? a.cardinality : "unknown",
});

/**
 * The base type every operand shares, joined from `any` (no operands, or all NULL).
 */
const sharedBase = (operands: readonly EffectiveType[]): BaseTypeOrAny => {
  let base: BaseTypeOrAny = "any";
  for (const operand of operands) {
    base = joinBase(base, operand.baseType);
  }

  return base;
};

/**
 * The result base type of the numeric aggregates: `integer` when every operand is integer,
 * `unknown` when any operand is, else `float`. A NULL operand (`any`) does not change the answer.
 */
const numericBase = (operands: readonly EffectiveType[]): BaseTypeOrAny => {
  const concrete = operands.filter((operand) => operand.baseType !== "any");
  if (concrete.some((operand) => operand.baseType === "unknown")) {
    return "unknown";
  }

  return concrete.length > 0 && concrete.every((operand) => operand.baseType === "integer")
    ? "integer"
    : "float";
};

/**
 * A rule for a kind whose result is always the given single base type.
 */
const always =
  (baseType: BaseTypeOrAny): ResultRule =>
  () =>
    single(baseType);

/**
 * A rule for a kind that yields one numeric aggregate of its operands.
 */
const numericAggregate: ResultRule = (operands) => single(numericBase(operands));

/**
 * A rule for a kind that takes the declared type from the node or its declaration.
 */
const declared: ResultRule = (_operands, attrs) => ({
  baseType: attrs.baseType ?? "unknown",
  cardinality: attrs.cardinality ?? "unknown",
});

/**
 * A rule for a kind that yields a container of the operands' shared base type.
 */
const containerOf =
  (cardinality: "multiple" | "ordered"): ResultRule =>
  (operands) => ({ baseType: sharedBase(operands), cardinality });

/**
 * A rule for a kind that yields a container of the base type its attribute names.
 */
const attributeContainer: ResultRule = (_operands, attrs) => ({
  baseType: attrs.baseType ?? "unknown",
  cardinality: "multiple",
});

/**
 * A rule for a kind that yields one value of its operand's base type.
 */
const elementOfOperand: ResultRule = (operands) => single(operands[0]?.baseType ?? "unknown");

/**
 * The math-operator names whose result is an integer; every other name yields a float.
 */
const integerMathOperators: ReadonlySet<string> = new Set(["signum", "floor", "ceil"]);

/**
 * The result base type of `qti-math-operator` for an operator name: `integer` for the three
 * integer-valued names, `unknown` when the name is not known, else `float`.
 */
const mathOperatorBase = (name: string | undefined): BaseTypeOrAny => {
  if (name === undefined) {
    return "unknown";
  }

  return integerMathOperators.has(name) ? "integer" : "float";
};

/**
 * The result type of every expression kind of table A, one entry each (`INFO` section 6.9).
 *
 * The test asserts the key set equals the 64 names, so a kind added to the vocabulary without a
 * rule is a failing test, and the record type refuses a missing key at compile time.
 */
export const resultTypes: Readonly<Record<ExpressionKind, ResultRule>> = {
  "qti-and": always("boolean"),
  "qti-any-n": always("boolean"),
  "qti-base-value": (_operands, attrs) => single(attrs.baseType ?? "unknown"),
  "qti-container-size": always("integer"),
  "qti-contains": always("boolean"),
  "qti-correct": declared,
  "qti-custom-operator": () => UNKNOWN,
  "qti-default": declared,
  "qti-delete": (operands) => operands[1] ?? UNKNOWN,
  "qti-divide": always("float"),
  "qti-duration-gte": always("boolean"),
  "qti-duration-lt": always("boolean"),
  "qti-equal": always("boolean"),
  "qti-equal-rounded": always("boolean"),
  "qti-field-value": () => single("unknown"),
  "qti-gcd": always("integer"),
  "qti-gt": always("boolean"),
  "qti-gte": always("boolean"),
  "qti-index": elementOfOperand,
  "qti-inside": always("boolean"),
  "qti-integer-divide": always("integer"),
  "qti-integer-modulus": always("integer"),
  "qti-integer-to-float": always("float"),
  "qti-is-null": always("boolean"),
  "qti-lcm": always("integer"),
  "qti-lt": always("boolean"),
  "qti-lte": always("boolean"),
  "qti-map-response": always("float"),
  "qti-map-response-point": always("float"),
  "qti-match": always("boolean"),
  "qti-math-constant": always("float"),
  "qti-math-operator": (_operands, attrs) => single(mathOperatorBase(attrs.name)),
  "qti-max": numericAggregate,
  "qti-member": always("boolean"),
  "qti-min": numericAggregate,
  "qti-multiple": containerOf("multiple"),
  "qti-not": always("boolean"),
  "qti-null": () => ({ baseType: "any", cardinality: "unknown" }),
  "qti-number-correct": always("integer"),
  "qti-number-incorrect": always("integer"),
  "qti-number-presented": always("integer"),
  "qti-number-responded": always("integer"),
  "qti-number-selected": always("integer"),
  "qti-or": always("boolean"),
  "qti-ordered": containerOf("ordered"),
  "qti-outcome-maximum": attributeContainer,
  "qti-outcome-minimum": attributeContainer,
  "qti-pattern-match": always("boolean"),
  "qti-power": always("float"),
  "qti-product": numericAggregate,
  "qti-random": elementOfOperand,
  "qti-random-float": always("float"),
  "qti-random-integer": always("integer"),
  "qti-repeat": containerOf("ordered"),
  "qti-round": always("integer"),
  "qti-round-to": always("float"),
  "qti-stats-operator": always("float"),
  "qti-string-match": always("boolean"),
  "qti-substring": always("boolean"),
  "qti-subtract": numericAggregate,
  "qti-sum": numericAggregate,
  "qti-test-variables": attributeContainer,
  "qti-truncate": always("integer"),
  "qti-variable": declared,
};

/**
 * Whether a node kind is one of the 64 expression kinds.
 */
const isExpressionKind = (kind: NodeKindHandle): kind is ExpressionKind =>
  Object.hasOwn(resultTypes, kind);

/**
 * Compute the effective type of an expression from its kind, the types of its operands and the
 * attributes its type depends on.
 *
 * Only the expression kinds have a type; any other kind (a rule, a declaration, `xi:include`)
 * answers `unknown` on both axes, and the checker never asks.
 */
export const resultType = (
  kind: NodeKindHandle,
  operands: readonly EffectiveType[],
  attrs: ResultAttributes,
): EffectiveType => (isExpressionKind(kind) ? resultTypes[kind](operands, attrs) : UNKNOWN);
