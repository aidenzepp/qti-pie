import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import {
  acos,
  asin,
  atan,
  atan2,
  cos,
  cosh,
  exp,
  log,
  log10,
  pow,
  sin,
  sinh,
  tan,
  tanh,
} from "#plate/engine/math.ts";
import type { Expression, ExpressionType, ResultAttributes } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, operandOf, scopeOf } from "#plate/test/processing.ts";

/**
 * A `qti-math-operator`'s name.
 */
type MathOperatorName = Extract<Expression, { readonly kind: "math-operator" }>["name"];

/**
 * A `qti-stats-operator`'s name.
 */
type StatsOperatorName = Extract<Expression, { readonly kind: "stats-operator" }>["name"];

/**
 * The single float NULL.
 */
const floatNull: Value = nullOf("float", "single");

/**
 * The single integer NULL.
 */
const integerNull: Value = nullOf("integer", "single");

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Construct a container of floats.
 *
 * @param cardinality The container's cardinality.
 * @param members Its members, none for its NULL.
 * @returns The value.
 */
const floats = (cardinality: "multiple" | "ordered", members: readonly number[]): Value => ({
  baseType: "float",
  cardinality,
  values: members.map((value) => ({ baseType: "float", value })),
});

/**
 * Construct a container of integers.
 *
 * @param cardinality The container's cardinality.
 * @param members Its members.
 * @returns The value.
 */
const integers = (cardinality: "multiple" | "ordered", members: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality,
  values: members.map((value) => ({ baseType: "integer", value })),
});

/**
 * Give a value's type, as an operand of that value has it.
 *
 * @param value The value.
 * @returns Its base type and cardinality.
 */
const typeOf = (value: Value): ExpressionType => ({
  baseType: value.baseType,
  cardinality: value.cardinality,
});

/**
 * Give the value of an expression through the engine's dispatcher, after checking that it
 * succeeded and holds the type its kind's rule gives over its operands' types (the family's type
 * invariant).
 *
 * @param expression The expression, each operand a `qti-base-value` of one of `values`.
 * @param values The values its operands give, in order.
 * @param attributes Its result attributes: the operator name of a `qti-math-operator` or a
 *   `qti-stats-operator`.
 * @returns Its value.
 */
const evaluated = (
  expression: Expression,
  values: readonly Value[],
  attributes: ResultAttributes = {},
): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, none));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  assertKindType(value, expression.kind, values.map(typeOf), attributes);

  return value;
};

/**
 * Give the value of a `qti-math-operator` over operands that give values.
 *
 * @param name Its name.
 * @param values The values its operands give, one or more.
 * @returns Its value.
 */
const mathOperator = (name: MathOperatorName, values: readonly [Value, ...Value[]]): Value => {
  const [first, ...rest] = values;

  return evaluated(
    {
      kind: "math-operator",
      name,
      operands: [operandOf(first), ...rest.map((value) => operandOf(value))],
    },
    values,
    { name },
  );
};

/**
 * Give the value of a `qti-math-operator` of one float.
 *
 * @param name Its name.
 * @param x The float.
 * @returns Its value.
 */
const ofFloat = (name: MathOperatorName, x: number): Value => mathOperator(name, [float(x)]);

/**
 * Give the value of a `qti-stats-operator` over an operand that gives a value.
 *
 * @param name Its name.
 * @param value The value its operand gives.
 * @returns Its value.
 */
const statsOperator = (name: StatsOperatorName, value: Value): Value =>
  evaluated({ kind: "stats-operator", name, operands: [operandOf(value)] }, [value], { name });

/**
 * Give the value of a `qti-power` over two operands that give values.
 *
 * @param base The value its first operand gives.
 * @param exponent The value its second operand gives.
 * @returns Its value.
 */
const power = (base: Value, exponent: Value): Value =>
  evaluated({ kind: "power", operands: [operandOf(base), operandOf(exponent)] }, [base, exponent]);

describe("the functions family's evaluators", () => {
  it("[I-9a] qti-math-operator's twelve names of one argument that read math.ts give math.ts's result (log is log10, ln is log)", () => {
    const direct: readonly (readonly [MathOperatorName, (x: number) => number])[] = [
      ["sin", sin],
      ["cos", cos],
      ["tan", tan],
      ["asin", asin],
      ["acos", acos],
      ["atan", atan],
      ["sinh", sinh],
      ["cosh", cosh],
      ["tanh", tanh],
      ["exp", exp],
      ["log", log10],
      ["ln", log],
    ];

    for (const [name, f] of direct) {
      for (const x of [0.5, 0.25, 0.875]) {
        assert.deepStrictEqual(ofFloat(name, x), float(f(x)), `${name}(${x})`);
      }
    }
  });

  it("[I-9a] qti-math-operator atan2 gives math.ts's atan2 of its first operand over its second", () => {
    assert.deepStrictEqual(
      mathOperator("atan2", [float(0.5), float(-0.25)]),
      float(atan2(0.5, -0.25)),
    );
    assert.deepStrictEqual(mathOperator("atan2", [integer(-3n), float(4)]), float(atan2(-3, 4)));
  });

  it("[I-9a] qti-math-operator takes an integer operand as a float", () => {
    assert.deepStrictEqual(mathOperator("sin", [integer(1n)]), float(sin(1)));
    assert.deepStrictEqual(mathOperator("log", [integer(1000n)]), float(3));
    assert.deepStrictEqual(mathOperator("abs", [integer(-3n)]), float(3));
  });

  it("[I-9a] qti-math-operator sec, csc, cot, sech, csch and coth are 1 / f: NULL for a NaN argument or an f of ±0, a zero for an f of ±INF (R§6.8)", () => {
    const reciprocals: readonly (readonly [MathOperatorName, (x: number) => number])[] = [
      ["sec", cos],
      ["csc", sin],
      ["cot", tan],
      ["sech", cosh],
      ["csch", sinh],
      ["coth", tanh],
    ];

    for (const [name, f] of reciprocals) {
      assert.deepStrictEqual(ofFloat(name, 0.5), float(1 / f(0.5)), `${name}(0.5)`);
      assert.deepStrictEqual(ofFloat(name, Number.NaN), floatNull, `${name}(NaN)`);
    }

    for (const name of ["csc", "cot", "csch", "coth"] as const) {
      assert.deepStrictEqual(ofFloat(name, 0), floatNull, `${name}(0)`);
      assert.deepStrictEqual(ofFloat(name, -0), floatNull, `${name}(-0)`);
    }

    assert.deepStrictEqual(ofFloat("sec", 0), float(1));
    assert.deepStrictEqual(ofFloat("sech", Number.POSITIVE_INFINITY), float(0));
    assert.deepStrictEqual(ofFloat("sech", Number.NEGATIVE_INFINITY), float(0));
    assert.deepStrictEqual(ofFloat("csch", Number.POSITIVE_INFINITY), float(0));
    assert.deepStrictEqual(ofFloat("csch", Number.NEGATIVE_INFINITY), float(-0));
  });

  it("[I-9a] qti-math-operator asec, acsc and acot read acos, asin and atan of 1 / x: NULL for asec and acsc of an argument below 1 in magnitude (R§6.8)", () => {
    assert.deepStrictEqual(ofFloat("asec", 2), float(acos(0.5)));
    assert.deepStrictEqual(ofFloat("acsc", -2), float(asin(-0.5)));
    assert.deepStrictEqual(ofFloat("acot", 2), float(atan(0.5)));
    assert.deepStrictEqual(ofFloat("acot", -2), float(atan(-0.5)));
    assert.deepStrictEqual(ofFloat("acot", 0), float(Math.PI / 2));
    for (const name of ["asec", "acsc"] as const) {
      for (const x of [0.5, -0.5, 0, Number.NaN]) {
        assert.deepStrictEqual(ofFloat(name, x), floatNull, `${name}(${x})`);
      }
    }
  });

  it("[I-9a] qti-math-operator asin, acos and atan: NULL outside [-1, 1] for asin and acos, 0 at 0 for asin and atan (R§6.8)", () => {
    assert.deepStrictEqual(ofFloat("asin", 2), floatNull);
    assert.deepStrictEqual(ofFloat("asin", -1.5), floatNull);
    assert.deepStrictEqual(ofFloat("acos", 2), floatNull);
    assert.deepStrictEqual(ofFloat("acos", -1.5), floatNull);
    assert.deepStrictEqual(ofFloat("asin", 0), float(0));
    assert.deepStrictEqual(ofFloat("atan", 0), float(0));
    assert.deepStrictEqual(ofFloat("acos", -1), float(Math.PI));
  });

  it("[I-9a] qti-math-operator atan2 gives the information model's special cases, and NULL when either argument is NaN (R§6.8)", () => {
    const pi = Math.PI;
    const inf = Number.POSITIVE_INFINITY;
    const cases: readonly (readonly [number, number, Value])[] = [
      [Number.NaN, 1, floatNull],
      [1, Number.NaN, floatNull],
      [0, 1, float(0)],
      [1, inf, float(0)],
      [-0, 1, float(-0)],
      [-1, inf, float(-0)],
      [0, -1, float(pi)],
      [1, -inf, float(pi)],
      [-0, -1, float(-pi)],
      [-1, -inf, float(-pi)],
      [1, 0, float(pi / 2)],
      [1, -0, float(pi / 2)],
      [inf, 1, float(pi / 2)],
      [-1, 0, float(-pi / 2)],
      [-1, -0, float(-pi / 2)],
      [-inf, 1, float(-pi / 2)],
      [inf, inf, float(pi / 4)],
      [inf, -inf, float((3 * pi) / 4)],
      [-inf, inf, float(-pi / 4)],
      [-inf, -inf, float(-(3 * pi) / 4)],
    ];

    for (const [y, x, expected] of cases) {
      assert.deepStrictEqual(
        mathOperator("atan2", [float(y), float(x)]),
        expected,
        `atan2(${y}, ${x})`,
      );
    }
  });

  it("[I-9a] qti-math-operator sinh, cosh and tanh keep their infinities and signed zeros (R§6.8)", () => {
    const inf = Number.POSITIVE_INFINITY;

    assert.deepStrictEqual(ofFloat("sinh", inf), float(inf));
    assert.deepStrictEqual(ofFloat("sinh", -inf), float(-inf));
    assert.deepStrictEqual(ofFloat("sinh", 0), float(0));
    assert.deepStrictEqual(ofFloat("cosh", 0), float(1));
    assert.deepStrictEqual(ofFloat("cosh", inf), float(inf));
    assert.deepStrictEqual(ofFloat("cosh", -inf), float(inf));
    assert.deepStrictEqual(ofFloat("tanh", 0), float(0));
    assert.deepStrictEqual(ofFloat("tanh", -0), float(-0));
    assert.deepStrictEqual(ofFloat("tanh", inf), float(1));
    assert.deepStrictEqual(ofFloat("tanh", -inf), float(-1));
  });

  it("[I-9a] qti-math-operator log and ln give -INF at ±0, INF at INF and NULL below 0; exp gives 0 at -INF, INF at INF and NULL at NaN (R§6.8, 9.22)", () => {
    const inf = Number.POSITIVE_INFINITY;

    for (const name of ["log", "ln"] as const) {
      assert.deepStrictEqual(ofFloat(name, 0), float(-inf), `${name}(0)`);
      assert.deepStrictEqual(ofFloat(name, -0), float(-inf), `${name}(-0)`);
      assert.deepStrictEqual(ofFloat(name, inf), float(inf), `${name}(INF)`);
      assert.deepStrictEqual(ofFloat(name, -1), floatNull, `${name}(-1)`);
    }

    assert.deepStrictEqual(ofFloat("log", 1000), float(3));
    assert.deepStrictEqual(ofFloat("exp", -inf), float(0));
    assert.deepStrictEqual(ofFloat("exp", inf), float(inf));
    assert.deepStrictEqual(ofFloat("exp", Number.NaN), floatNull);
  });

  it("[I-9a] qti-math-operator abs gives 0 at ±0, INF at ±INF and NULL at NaN (R§6.8)", () => {
    assert.deepStrictEqual(ofFloat("abs", -2.5), float(2.5));
    assert.deepStrictEqual(ofFloat("abs", -0), float(0));
    assert.deepStrictEqual(
      ofFloat("abs", Number.NEGATIVE_INFINITY),
      float(Number.POSITIVE_INFINITY),
    );
    assert.deepStrictEqual(ofFloat("abs", Number.NaN), floatNull);
  });

  it("[I-9a] qti-math-operator signum gives an integer: -1, 0 or 1, 0 at ±0, ±1 at ±INF and NULL at NaN (R§6.8, 9.10)", () => {
    assert.deepStrictEqual(ofFloat("signum", -2.5), integer(-1n));
    assert.deepStrictEqual(ofFloat("signum", 0.25), integer(1n));
    assert.deepStrictEqual(ofFloat("signum", 0), integer(0n));
    assert.deepStrictEqual(ofFloat("signum", -0), integer(0n));
    assert.deepStrictEqual(ofFloat("signum", Number.POSITIVE_INFINITY), integer(1n));
    assert.deepStrictEqual(ofFloat("signum", Number.NEGATIVE_INFINITY), integer(-1n));
    assert.deepStrictEqual(ofFloat("signum", Number.NaN), integerNull);
    assert.deepStrictEqual(mathOperator("signum", [integer(-7n)]), integer(-1n));
    assert.deepStrictEqual(mathOperator("signum", [integer(0n)]), integer(0n));
    assert.deepStrictEqual(mathOperator("signum", [integer(2n ** 70n)]), integer(1n));
  });

  it("[I-9a] qti-math-operator floor and ceil give an exact integer, the integer an integer operand holds, and NULL at ±INF and NaN (R§6.8, 9.10)", () => {
    const huge = 1e300;

    assert.deepStrictEqual(ofFloat("floor", -2.5), integer(-3n));
    assert.deepStrictEqual(ofFloat("ceil", -2.5), integer(-2n));
    assert.deepStrictEqual(ofFloat("floor", 2.5), integer(2n));
    assert.deepStrictEqual(ofFloat("ceil", 2.5), integer(3n));
    assert.deepStrictEqual(ofFloat("floor", huge), integer(BigInt(huge)));
    assert.deepStrictEqual(
      mathOperator("floor", [integer(2n ** 60n + 1n)]),
      integer(2n ** 60n + 1n),
    );
    assert.deepStrictEqual(mathOperator("ceil", [integer(-7n)]), integer(-7n));
    for (const name of ["floor", "ceil"] as const) {
      for (const x of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN]) {
        assert.deepStrictEqual(ofFloat(name, x), integerNull, `${name}(${x})`);
      }
    }
  });

  it("[I-9a] qti-math-operator toDegrees and toRadians multiply by one constant, 180 / π or π / 180 from Math.PI's double, keep ±INF and give NULL at NaN (R§6.8)", () => {
    const inf = Number.POSITIVE_INFINITY;

    assert.deepStrictEqual(ofFloat("toDegrees", Math.PI), float(180));
    assert.deepStrictEqual(ofFloat("toRadians", 180), float(Math.PI));
    assert.deepStrictEqual(ofFloat("toDegrees", 1), float(180 / Math.PI));
    assert.deepStrictEqual(ofFloat("toRadians", 1), float(Math.PI / 180));
    assert.deepStrictEqual(ofFloat("toDegrees", 1), float(57.29577951308232));
    assert.deepStrictEqual(ofFloat("toRadians", 1), float(0.017453292519943295));
    for (const name of ["toDegrees", "toRadians"] as const) {
      assert.deepStrictEqual(ofFloat(name, inf), float(inf), `${name}(INF)`);
      assert.deepStrictEqual(ofFloat(name, -inf), float(-inf), `${name}(-INF)`);
      assert.deepStrictEqual(ofFloat(name, Number.NaN), floatNull, `${name}(NaN)`);
    }
  });

  it("[I-9a] qti-math-operator toDegrees and toRadians overflow only when the true result does (R§6.8)", () => {
    const inf = Number.POSITIVE_INFINITY;

    assert.deepStrictEqual(ofFloat("toRadians", 1e308), float(1.7453292519943295e306));
    assert.deepStrictEqual(ofFloat("toRadians", -1e308), float(-1.7453292519943295e306));
    assert.deepStrictEqual(ofFloat("toRadians", Number.MAX_VALUE), float(3.1375664143845866e306));
    assert.deepStrictEqual(ofFloat("toDegrees", 2e306), float(1.1459155902616465e308));
    assert.deepStrictEqual(ofFloat("toDegrees", -2e306), float(-1.1459155902616465e308));
    assert.deepStrictEqual(ofFloat("toDegrees", 4e306), float(inf));
    assert.deepStrictEqual(ofFloat("toDegrees", -4e306), float(-inf));
  });

  it("[I-9a] qti-math-operator gives its type's NULL for a NULL operand", () => {
    assert.deepStrictEqual(mathOperator("sin", [floatNull]), floatNull);
    assert.deepStrictEqual(mathOperator("floor", [floatNull]), integerNull);
    assert.deepStrictEqual(mathOperator("atan2", [float(1), integerNull]), floatNull);
  });

  it("[I-9a] qti-math-operator gives NULL, never a failure, when its operand count is not its name's: two for atan2, one for every other (9.22)", () => {
    assert.deepStrictEqual(mathOperator("sin", [float(1), float(2)]), floatNull);
    assert.deepStrictEqual(mathOperator("atan2", [float(1)]), floatNull);
    assert.deepStrictEqual(mathOperator("atan2", [float(1), float(2), float(3)]), floatNull);
    assert.deepStrictEqual(mathOperator("floor", [float(1), float(2)]), integerNull);
  });

  it("[I-9a] qti-math-constant gives the doubles of pi and e", () => {
    assert.deepStrictEqual(
      evaluated({ kind: "math-constant", name: "pi", operands: [] }, []),
      float(Math.PI),
    );
    assert.deepStrictEqual(
      evaluated({ kind: "math-constant", name: "e", operands: [] }, []),
      float(Math.E),
    );
  });

  it("[I-9a] qti-stats-operator gives the mean, the sample statistics with n - 1 and the population statistics with n (9.20)", () => {
    const sample = floats("multiple", [2, 4, 4, 4, 5, 5, 7, 9]);

    assert.deepStrictEqual(statsOperator("mean", sample), float(5));
    assert.deepStrictEqual(statsOperator("popVariance", sample), float(4));
    assert.deepStrictEqual(statsOperator("popSD", sample), float(2));
    assert.deepStrictEqual(statsOperator("sampleVariance", sample), float(32 / 7));
    assert.deepStrictEqual(statsOperator("sampleSD", sample), float(Math.sqrt(32 / 7)));

    const counted = integers("ordered", [1n, 2n, 3n, 4n]);

    assert.deepStrictEqual(statsOperator("mean", counted), float(2.5));
    assert.deepStrictEqual(statsOperator("sampleVariance", counted), float(5 / 3));
    assert.deepStrictEqual(statsOperator("popVariance", counted), float(1.25));
  });

  it("[I-9a] qti-stats-operator of a container of one gives its member as the mean and NULL for the four spreads (9.20)", () => {
    const one = floats("multiple", [3.5]);

    assert.deepStrictEqual(statsOperator("mean", one), float(3.5));
    for (const name of ["sampleVariance", "sampleSD", "popVariance", "popSD"] as const) {
      assert.deepStrictEqual(statsOperator(name, one), floatNull, name);
    }
  });

  it("[I-9a] qti-stats-operator gives NULL for a NULL container and for a NaN statistic, and keeps an infinite mean", () => {
    const inf = Number.POSITIVE_INFINITY;

    for (const name of ["mean", "sampleVariance", "sampleSD", "popVariance", "popSD"] as const) {
      assert.deepStrictEqual(statsOperator(name, floats("ordered", [])), floatNull, name);
    }

    assert.deepStrictEqual(statsOperator("mean", floats("multiple", [inf, -inf])), floatNull);
    assert.deepStrictEqual(statsOperator("popVariance", floats("multiple", [inf, 1])), floatNull);
    assert.deepStrictEqual(statsOperator("mean", floats("multiple", [inf, 1])), float(inf));
  });

  it("[I-9a] qti-stats-operator's sums never overflow when its statistic does not: [1e308, 1e308]'s mean is 1e308 and its spreads 0 (9.20)", () => {
    const twice = floats("multiple", [1e308, 1e308]);

    assert.deepStrictEqual(statsOperator("mean", twice), float(1e308));
    for (const name of ["sampleVariance", "sampleSD", "popVariance", "popSD"] as const) {
      assert.deepStrictEqual(statsOperator(name, twice), float(0), name);
    }

    const largest = floats("ordered", [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]);

    assert.deepStrictEqual(statsOperator("mean", largest), float(Number.MAX_VALUE));
    assert.deepStrictEqual(statsOperator("popSD", largest), float(0));
    assert.deepStrictEqual(
      statsOperator("mean", floats("multiple", [Number.MAX_VALUE, -Number.MAX_VALUE])),
      float(0),
    );
  });

  it("[I-9a] qti-stats-operator's popVariance of [1e154, 3e154] is finite, the double after its true 1e308, as no square of a deviation overflows (9.20)", () => {
    assert.deepStrictEqual(
      statsOperator("popVariance", floats("multiple", [1e154, 3e154])),
      float(1.0000000000000002e308),
    );
  });

  it("[I-9a] qti-stats-operator gives a finite standard deviation whose variance overflows, and keeps the variance's INF (9.20)", () => {
    const inf = Number.POSITIVE_INFINITY;
    const opposite = floats("multiple", [1e200, -1e200]);

    assert.deepStrictEqual(statsOperator("popSD", opposite), float(1e200));
    assert.deepStrictEqual(statsOperator("sampleSD", opposite), float(1.414213562373095e200));
    assert.deepStrictEqual(statsOperator("popVariance", opposite), float(inf));
    assert.deepStrictEqual(statsOperator("sampleVariance", opposite), float(inf));

    const spread = floats("ordered", [1e300, 2e300, 3e300]);

    assert.deepStrictEqual(statsOperator("mean", spread), float(2e300));
    assert.deepStrictEqual(statsOperator("sampleSD", spread), float(1e300));
    assert.deepStrictEqual(statsOperator("popSD", spread), float(8.164965809277261e299));
    assert.deepStrictEqual(
      statsOperator("popSD", floats("multiple", [Number.MAX_VALUE, -Number.MAX_VALUE])),
      float(Number.MAX_VALUE),
    );
    assert.deepStrictEqual(
      statsOperator("sampleSD", floats("multiple", [Number.MAX_VALUE, -Number.MAX_VALUE])),
      float(inf),
    );
  });

  it("[I-9a] qti-power gives math.ts's pow as a float, integers included", () => {
    assert.deepStrictEqual(power(integer(2n), integer(10n)), float(1024));
    assert.deepStrictEqual(power(float(-2), integer(3n)), float(-8));
    assert.deepStrictEqual(power(float(2), float(0.5)), float(pow(2, 0.5)));
    assert.deepStrictEqual(power(float(1.5), float(-2.25)), float(pow(1.5, -2.25)));
  });

  it("[I-9a] qti-power gives NULL for a NULL operand and for a result of ±INF or NaN (§4.4)", () => {
    assert.deepStrictEqual(power(floatNull, float(2)), floatNull);
    assert.deepStrictEqual(power(float(2), integerNull), floatNull);
    assert.deepStrictEqual(power(float(0), float(-1)), floatNull);
    assert.deepStrictEqual(power(float(-0), integer(-1n)), floatNull);
    assert.deepStrictEqual(power(float(10), float(400)), floatNull);
    assert.deepStrictEqual(power(float(-10), integer(401n)), floatNull);
    assert.deepStrictEqual(power(float(-8), float(1 / 3)), floatNull);
    assert.deepStrictEqual(power(float(Number.NaN), float(1)), floatNull);
  });
});
