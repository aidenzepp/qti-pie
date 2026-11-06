import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression, IntegerOrRef } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, scopeOf } from "#plate/test/processing.ts";

/**
 * A boolean operand's truth: true, false, or `null` for NULL.
 */
type Truth = boolean | null;

/**
 * The single boolean NULL.
 */
const unknown: Value = nullOf("boolean", "single");

/**
 * Construct the value of a truth: a single boolean, or the boolean NULL.
 *
 * @param held The truth.
 * @returns The value.
 */
const valueOf = (held: Truth): Value =>
  held === null
    ? unknown
    : {
        baseType: "boolean",
        cardinality: "single",
        values: [{ baseType: "boolean", value: held }],
      };

/**
 * Construct the `qti-base-value` operand of a truth.
 *
 * @param held The truth.
 * @returns The operand.
 */
const operandOf = (held: Truth): Expression => ({
  kind: "base-value",
  operands: [],
  value: valueOf(held),
});

/**
 * Construct the `qti-base-value` operand of each truth, in order.
 *
 * @param truths The truths, one or more.
 * @returns The operands.
 */
const operandsOf = ([first, ...rest]: readonly [Truth, ...Truth[]]): [
  Expression,
  ...Expression[],
] => [operandOf(first), ...rest.map((held) => operandOf(held))];

/**
 * Construct an integer literal of an attribute that may name a variable.
 *
 * @param value The integer.
 * @returns The literal.
 */
const literal = (value: bigint): IntegerOrRef => ({ _tag: "literal", value });

/**
 * Construct a reference to a variable from an attribute that may name one.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const ref = (identifier: string): IntegerOrRef => ({ _tag: "ref", identifier });

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Give the value of a logic expression through the engine's dispatcher, after checking that it
 * succeeded and holds the type its kind's rule gives over single boolean operands (the family's
 * type invariant).
 *
 * @param expression The expression, every operand a single boolean or its NULL.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const evaluated = (expression: Expression, variables: Variables = none): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, variables));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  assertKindType(
    value,
    expression.kind,
    expression.operands.map(() => ({ baseType: "boolean", cardinality: "single" })),
  );

  return value;
};

/**
 * Construct a `qti-and` of truths.
 *
 * @param truths Its operands' truths, one or more.
 * @returns The expression.
 */
const andOf = (truths: readonly [Truth, ...Truth[]]): Expression => ({
  kind: "and",
  operands: operandsOf(truths),
});

/**
 * Construct a `qti-or` of truths.
 *
 * @param truths Its operands' truths, one or more.
 * @returns The expression.
 */
const orOf = (truths: readonly [Truth, ...Truth[]]): Expression => ({
  kind: "or",
  operands: operandsOf(truths),
});

/**
 * Construct a `qti-not` of a truth.
 *
 * @param held Its operand's truth.
 * @returns The expression.
 */
const notOf = (held: Truth): Expression => ({ kind: "not", operands: [operandOf(held)] });

/**
 * Construct a `qti-any-n` of truths.
 *
 * @param min Its `min`.
 * @param max Its `max`.
 * @param truths Its operands' truths, one or more.
 * @returns The expression.
 */
const anyNOf = (
  min: IntegerOrRef,
  max: IntegerOrRef,
  truths: readonly [Truth, ...Truth[]],
): Expression => ({ kind: "any-n", max, min, operands: operandsOf(truths) });

describe("the logic family's evaluators", () => {
  it("[I-9a] qti-any-n with min 3 and max 4 gives NULL for {T,T,F,NULL}, false for {T,F,F,NULL} and true for {T,T,T,NULL} (R§6.3)", () => {
    const [min, max] = [literal(3n), literal(4n)];

    assert.deepStrictEqual(evaluated(anyNOf(min, max, [true, true, false, null])), unknown);
    assert.deepStrictEqual(evaluated(anyNOf(min, max, [true, false, false, null])), valueOf(false));
    assert.deepStrictEqual(evaluated(anyNOf(min, max, [true, true, true, null])), valueOf(true));
  });

  it("[I-9a] qti-any-n gives false when more operands are true than max, NULLs notwithstanding", () => {
    assert.deepStrictEqual(
      evaluated(anyNOf(literal(1n), literal(2n), [true, true, true, null])),
      valueOf(false),
    );
  });

  it("[I-9a] qti-and gives false for a NULL beside a false, NULL for a NULL beside trues, and true when all are true", () => {
    assert.deepStrictEqual(evaluated(andOf([null, false, true])), valueOf(false));
    assert.deepStrictEqual(evaluated(andOf([true, null, true])), unknown);
    assert.deepStrictEqual(evaluated(andOf([true, true])), valueOf(true));
  });

  it("[I-9a] qti-or gives true for a NULL beside a true, NULL for a NULL beside falses, and false when all are false", () => {
    assert.deepStrictEqual(evaluated(orOf([false, null, true])), valueOf(true));
    assert.deepStrictEqual(evaluated(orOf([false, null])), unknown);
    assert.deepStrictEqual(evaluated(orOf([false, false])), valueOf(false));
  });

  it("[I-9a] qti-not gives the negation of its operand, and NULL for NULL", () => {
    assert.deepStrictEqual(evaluated(notOf(true)), valueOf(false));
    assert.deepStrictEqual(evaluated(notOf(false)), valueOf(true));
    assert.deepStrictEqual(evaluated(notOf(null)), unknown);
  });

  it("[I-9a] qti-any-n reads a min and a max that name integer variables, and gives NULL when one holds NULL", () => {
    const variables: Variables = {
      outcomes: { MAX: integer(2n), MIN: integer(1n), UNSET: nullOf("integer", "single") },
      responses: {},
    };
    const truths: readonly [Truth, ...Truth[]] = [true, false, false];

    assert.deepStrictEqual(
      evaluated(anyNOf(ref("MIN"), ref("MAX"), truths), variables),
      valueOf(true),
    );
    assert.deepStrictEqual(
      evaluated(anyNOf(ref("MAX"), ref("MAX"), truths), variables),
      valueOf(false),
    );
    assert.deepStrictEqual(
      evaluated(anyNOf(ref("UNSET"), literal(2n), truths), variables),
      unknown,
    );
    assert.deepStrictEqual(
      evaluated(anyNOf(literal(1n), ref("UNSET"), truths), variables),
      unknown,
    );
  });
});
