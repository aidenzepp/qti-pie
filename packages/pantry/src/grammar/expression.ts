/**
 * The closed relations of expressions and response bindings: `OperatorArity`, `BindingFit`,
 * `RecordBindingFit` and `MappableBaseType` (fin.md §17, "qti-pie, erased").
 *
 * Each generator is a function of a composition's rosters. Its rows are stated here once, in the
 * shape the QTI vocabulary states them, and are coded in the code spaces the composition passes,
 * so a row naming a handle the composition has no code for is refused by {@link closed}.
 *
 * None of the four has a version digit, because each holds in 3.0.0 and 3.0.1 alike: the ASI 3.0
 * and 3.0.1 XSDs give the same arity rows, which `expression.test.ts` checks over the pinned XSD
 * cache, and the binding and mapping rules are stated once for both versions.
 */
import { Order } from "effect";
import type { Array as Arr, Result } from "effect";
import { closed, dictionary } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import type { BaseType, TypedCardinality } from "#pantry/schema/declaration.ts";
import type { expressionKinds, kinds } from "#pantry/schema/kinds/asi.ts";

/**
 * A kind of the ASI vocabulary.
 */
type AsiKind = (typeof kinds)[number];

/**
 * An expression kind of the processing vocabulary: one of the 64 kinds `OperatorArity` maps.
 */
type ExpressionKind = (typeof expressionKinds)[number];

/**
 * A base type of a typed variable.
 */
type BaseTypeHandle = (typeof BaseType.handles)[number];

/**
 * A cardinality of a typed variable.
 */
type CardinalityHandle = (typeof TypedCardinality.handles)[number];

/**
 * The code spaces a composition gives the four relations' fields: each roster's handles in code
 * order, so a handle's code is its position.
 */
export interface Rosters {
  readonly baseTypes: readonly string[];
  readonly cardinalities: readonly string[];
  readonly kinds: readonly string[];
}

/**
 * `OperatorArity`: kind → (min, max), the fewest and the most child expressions an expression
 * kind's content admits. A kind with no upper bound has {@link unbounded} as its max.
 */
export type OperatorArity = Closed<
  readonly [Field<"kind", string>],
  readonly [Field<"min", bigint>, Field<"max", bigint>]
>;

/**
 * `BindingFit`: the set of (base type, cardinality, kind) where an interaction of that kind may
 * bind a typed response variable of that base type and cardinality.
 */
export type BindingFit = Closed<
  readonly [Field<"baseType", string>, Field<"cardinality", string>, Field<"kind", string>],
  readonly []
>;

/**
 * `RecordBindingFit`: the set of interaction kinds that may bind a record response variable.
 */
export type RecordBindingFit = Closed<readonly [Field<"kind", string>], readonly []>;

/**
 * `MappableBaseType`: the set of base types a `qti-mapping` may be of.
 */
export type MappableBaseType = Closed<readonly [Field<"baseType", string>], readonly []>;

/**
 * The max of an arity with no upper bound: the largest `int8`, 2⁶³ − 1.
 *
 * It is a value in max's dictionary, not an absence: the bound that bounds nothing, a null object.
 * The arity law `min <= elementChildren <= max` then reads the same for every kind, with no branch
 * for a missing maximum and no NULL, which grizzle's columns cannot hold. A count of child
 * expressions is an `int8` too, so no count exceeds it.
 */
export const unbounded = 9_223_372_036_854_775_807n;

/**
 * The child-expression multiplicity of one expression kind: the least count and the greatest.
 */
interface Arity {
  readonly max: bigint;
  readonly min: bigint;
}

/**
 * The arity of a leaf: it takes no child expression.
 */
const nullary: Arity = { max: 0n, min: 0n };

/**
 * The arity of an operator of exactly one child expression.
 */
const unary: Arity = { max: 1n, min: 1n };

/**
 * The arity of an operator of exactly two child expressions.
 */
const binary: Arity = { max: 2n, min: 2n };

/**
 * The arity of an operator of one child expression or more.
 */
const oneOrMore: Arity = { max: unbounded, min: 1n };

/**
 * The arity of an operator of any number of child expressions, none included.
 */
const zeroOrMore: Arity = { max: unbounded, min: 0n };

/**
 * The arity of each expression kind, as the ASI XSD's content models state it: the sum of the
 * child expressions' `minOccurs`, and the sum of their `maxOccurs` where every child is bounded.
 *
 * The vocabulary deriver reads the same table from the pinned XSD (`node
 * src/vocab/derive/derive.ts arity`), and `expression.test.ts` checks the two agree. The record
 * is total over the expression kinds, so a kind without an arity does not compile.
 */
const arities: Readonly<Record<ExpressionKind, Arity>> = {
  "qti-and": oneOrMore,
  "qti-any-n": oneOrMore,
  "qti-base-value": nullary,
  "qti-container-size": unary,
  "qti-contains": binary,
  "qti-correct": nullary,
  "qti-custom-operator": zeroOrMore,
  "qti-default": nullary,
  "qti-delete": binary,
  "qti-divide": binary,
  "qti-duration-gte": binary,
  "qti-duration-lt": binary,
  "qti-equal": binary,
  "qti-equal-rounded": binary,
  "qti-field-value": unary,
  "qti-gcd": oneOrMore,
  "qti-gt": binary,
  "qti-gte": binary,
  "qti-index": unary,
  "qti-inside": unary,
  "qti-integer-divide": binary,
  "qti-integer-modulus": binary,
  "qti-integer-to-float": unary,
  "qti-is-null": unary,
  "qti-lcm": oneOrMore,
  "qti-lt": binary,
  "qti-lte": binary,
  "qti-map-response": nullary,
  "qti-map-response-point": nullary,
  "qti-match": binary,
  "qti-math-constant": nullary,
  "qti-math-operator": oneOrMore,
  "qti-max": oneOrMore,
  "qti-member": binary,
  "qti-min": oneOrMore,
  "qti-multiple": zeroOrMore,
  "qti-not": unary,
  "qti-null": nullary,
  "qti-number-correct": nullary,
  "qti-number-incorrect": nullary,
  "qti-number-presented": nullary,
  "qti-number-responded": nullary,
  "qti-number-selected": nullary,
  "qti-or": oneOrMore,
  "qti-ordered": zeroOrMore,
  "qti-outcome-maximum": nullary,
  "qti-outcome-minimum": nullary,
  "qti-pattern-match": unary,
  "qti-power": binary,
  "qti-product": oneOrMore,
  "qti-random": unary,
  "qti-random-float": nullary,
  "qti-random-integer": nullary,
  "qti-repeat": oneOrMore,
  "qti-round": unary,
  "qti-round-to": unary,
  "qti-stats-operator": unary,
  "qti-string-match": binary,
  "qti-substring": binary,
  "qti-subtract": binary,
  "qti-sum": oneOrMore,
  "qti-test-variables": nullary,
  "qti-truncate": unary,
  "qti-variable": nullary,
};

/**
 * The rows of `OperatorArity`, one per expression kind.
 */
const arityRows = Object.entries(arities).map(([kind, { max, min }]) => ({ kind, max, min }));

/**
 * The base types and cardinalities an interaction's typed response variable may have: every
 * pairing of one of its base types with one of its cardinalities fits.
 */
interface TypedFit {
  readonly baseTypes: Arr.NonEmptyReadonlyArray<BaseTypeHandle>;
  readonly cardinalities: Arr.NonEmptyReadonlyArray<CardinalityHandle>;
}

/**
 * The typed bindings of each interaction that binds a typed response variable: today's 20 ASI
 * interactions, 40 pairings in all. Each states its base types and cardinalities as one product,
 * as each interaction's binding rule does, and a kind is listed once.
 *
 * `qti-text-entry-interaction` and `qti-extended-text-interaction` may also bind a record. A record
 * has no base type, so that binding is a row of {@link recordFits} instead.
 */
const typedFits = {
  "qti-associate-interaction": { baseTypes: ["pair"], cardinalities: ["single", "multiple"] },
  "qti-choice-interaction": { baseTypes: ["identifier"], cardinalities: ["single", "multiple"] },
  "qti-drawing-interaction": { baseTypes: ["file"], cardinalities: ["single"] },
  "qti-end-attempt-interaction": { baseTypes: ["boolean"], cardinalities: ["single"] },
  "qti-extended-text-interaction": {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "multiple", "ordered"],
  },
  "qti-gap-match-interaction": {
    baseTypes: ["directedPair"],
    cardinalities: ["single", "multiple"],
  },
  "qti-graphic-associate-interaction": {
    baseTypes: ["pair"],
    cardinalities: ["single", "multiple"],
  },
  "qti-graphic-gap-match-interaction": { baseTypes: ["directedPair"], cardinalities: ["multiple"] },
  "qti-graphic-order-interaction": { baseTypes: ["identifier"], cardinalities: ["ordered"] },
  "qti-hotspot-interaction": { baseTypes: ["identifier"], cardinalities: ["single", "multiple"] },
  "qti-hottext-interaction": { baseTypes: ["identifier"], cardinalities: ["single", "multiple"] },
  "qti-inline-choice-interaction": { baseTypes: ["identifier"], cardinalities: ["single"] },
  "qti-match-interaction": { baseTypes: ["directedPair"], cardinalities: ["single", "multiple"] },
  "qti-media-interaction": { baseTypes: ["integer"], cardinalities: ["single"] },
  "qti-order-interaction": { baseTypes: ["identifier"], cardinalities: ["ordered"] },
  "qti-position-object-interaction": {
    baseTypes: ["point"],
    cardinalities: ["single", "multiple"],
  },
  "qti-select-point-interaction": { baseTypes: ["point"], cardinalities: ["single", "multiple"] },
  "qti-slider-interaction": { baseTypes: ["integer", "float"], cardinalities: ["single"] },
  "qti-text-entry-interaction": {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single"],
  },
  "qti-upload-interaction": { baseTypes: ["file"], cardinalities: ["single"] },
} satisfies Readonly<Partial<Record<AsiKind, TypedFit>>>;

/**
 * The rows of `BindingFit`: each interaction's product of base types and cardinalities.
 */
const bindingRows = Object.entries(typedFits).flatMap(
  ([kind, { baseTypes, cardinalities }]: readonly [string, TypedFit]) =>
    baseTypes.flatMap((baseType) =>
      cardinalities.map((cardinality) => ({ baseType, cardinality, kind })),
    ),
);

/**
 * The interactions that may bind a record response variable: text entry and extended text.
 */
const recordFits = [
  "qti-extended-text-interaction",
  "qti-text-entry-interaction",
] as const satisfies readonly AsiKind[];

/**
 * The base types with no map key a mapping could compare, `duration` and `file`. Every other base
 * type is mappable.
 */
const withoutMapKey: ReadonlySet<string> = new Set<BaseTypeHandle>(["duration", "file"]);

/**
 * Generate `OperatorArity` over a composition's kinds: one function, kind → (min, max).
 *
 * Its payload fields, `min` and `max`, are open-typed `int8` fields, each coded by its dictionary:
 * the distinct values the rows hold, ascending, so the dictionary of `max` ends in
 * {@link unbounded}.
 *
 * @param rosters - The composition's rosters.
 * @param rosters.kinds - The `NodeKind` handles in code order.
 * @returns The relation, or the reason it has no constant, such as an expression kind the
 *   composition does not hold.
 */
export const operatorArity = ({
  kinds,
}: Pick<Rosters, "kinds">): Result.Result<OperatorArity, ClosedRelationError> =>
  closed({
    key: [{ name: "kind", values: kinds }],
    name: "OperatorArity",
    payload: [
      {
        name: "min",
        values: dictionary(
          arityRows.map((row) => row.min),
          Order.BigInt,
        ),
      },
      {
        name: "max",
        values: dictionary(
          arityRows.map((row) => row.max),
          Order.BigInt,
        ),
      },
    ],
    rows: arityRows,
  });

/**
 * Generate `BindingFit` over a composition's rosters: a set over base type × cardinality × kind.
 *
 * @param rosters - The composition's rosters.
 * @param rosters.baseTypes - The `BaseType` handles in code order.
 * @param rosters.cardinalities - The typed cardinalities in code order.
 * @param rosters.kinds - The `NodeKind` handles in code order.
 * @returns The relation, or the reason it has no constant, such as an interaction kind the
 *   composition does not hold.
 */
export const bindingFit = ({
  baseTypes,
  cardinalities,
  kinds,
}: Rosters): Result.Result<BindingFit, ClosedRelationError> =>
  closed({
    key: [
      { name: "baseType", values: baseTypes },
      { name: "cardinality", values: cardinalities },
      { name: "kind", values: kinds },
    ],
    name: "BindingFit",
    payload: [],
    rows: bindingRows,
  });

/**
 * Generate `RecordBindingFit` over a composition's kinds: a set over kind.
 *
 * @param rosters - The composition's rosters.
 * @param rosters.kinds - The `NodeKind` handles in code order.
 * @returns The relation, or the reason it has no constant.
 */
export const recordBindingFit = ({
  kinds,
}: Pick<Rosters, "kinds">): Result.Result<RecordBindingFit, ClosedRelationError> =>
  closed({
    key: [{ name: "kind", values: kinds }],
    name: "RecordBindingFit",
    payload: [],
    rows: recordFits.map((kind) => ({ kind })),
  });

/**
 * Generate `MappableBaseType` over a composition's base types: a set over base type, holding
 * every base type that has a map key.
 *
 * @param rosters - The composition's rosters.
 * @param rosters.baseTypes - The `BaseType` handles in code order.
 * @returns The relation, or the reason it has no constant.
 */
export const mappableBaseType = ({
  baseTypes,
}: Pick<Rosters, "baseTypes">): Result.Result<MappableBaseType, ClosedRelationError> =>
  closed({
    key: [{ name: "baseType", values: baseTypes }],
    name: "MappableBaseType",
    payload: [],
    rows: baseTypes
      .filter((baseType) => !withoutMapKey.has(baseType))
      .map((baseType) => ({ baseType })),
  });
