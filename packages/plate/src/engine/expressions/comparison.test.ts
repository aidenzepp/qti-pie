import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression, FloatOrRef } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, operandOf, scopeOf } from "#plate/test/processing.ts";

/**
 * The four order comparisons the family runs.
 */
type OrderKind = "gt" | "gte" | "lt" | "lte";

/**
 * The single boolean NULL.
 */
const unknown: Value = nullOf("boolean", "single");

/**
 * Construct the single boolean value of a truth.
 *
 * @param held The truth.
 * @returns The value.
 */
const truth = (held: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: held }],
});

/**
 * The integer NULL.
 */
const integerNull: Value = nullOf("integer", "single");

/**
 * The float NULL.
 */
const floatNull: Value = nullOf("float", "single");

/**
 * 2^53, the least integer above which a double cannot hold every integer.
 */
const twoTo53 = 2n ** 53n;

/**
 * Construct an order comparison of two values.
 *
 * @param kind Its kind.
 * @param left Its first operand's value.
 * @param right Its second operand's value.
 * @returns The expression.
 */
const orderOf = (kind: OrderKind, left: Value, right: Value): Expression => ({
  kind,
  operands: [operandOf(left), operandOf(right)],
});

/**
 * Construct a float literal of a `tolerance` token.
 *
 * @param value The number.
 * @returns The literal.
 */
const literal = (value: number): FloatOrRef => ({ _tag: "literal", value });

/**
 * Construct a `tolerance` token that names a variable.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const ref = (identifier: string): FloatOrRef => ({ _tag: "ref", identifier });

/**
 * What a `qti-equal` holds besides its operands, at the XSD's defaults unless given.
 */
interface EqualOptions {
  readonly includeLowerBound?: boolean;
  readonly includeUpperBound?: boolean;
  readonly tolerance?: readonly FloatOrRef[];
  readonly toleranceMode?: "absolute" | "exact" | "relative";
}

/**
 * Construct a `qti-equal` of two values.
 *
 * @param left Its first operand's value, `x` of the information model's range.
 * @param right Its second operand's value, `y`, which the range must hold.
 * @param options Its tolerance mode, tolerance and bound flags.
 * @returns The expression.
 */
const equalOf = (left: Value, right: Value, options: EqualOptions = {}): Expression => ({
  includeLowerBound: options.includeLowerBound ?? true,
  includeUpperBound: options.includeUpperBound ?? true,
  kind: "equal",
  operands: [operandOf(left), operandOf(right)],
  tolerance: options.tolerance ?? [],
  toleranceMode: options.toleranceMode ?? "exact",
});

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Give the value of a comparison through the engine's dispatcher, after checking that it succeeded
 * and holds the type its kind's rule gives over its operands' types (the family's type invariant).
 *
 * @param expression The expression, each operand a `qti-base-value`.
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
    expression.operands.map((operand) =>
      operand.kind === "base-value"
        ? { baseType: operand.value.baseType, cardinality: operand.value.cardinality }
        : { baseType: "unknown", cardinality: "unknown" },
    ),
  );

  return value;
};

/**
 * Assert the four order comparisons of two values.
 *
 * @param left The first operand's value.
 * @param right The second operand's value.
 * @param expected What `gt`, `gte`, `lt` and `lte` give, in that order.
 */
const assertOrders = (
  left: Value,
  right: Value,
  expected: readonly [boolean, boolean, boolean, boolean],
): void => {
  const kinds: readonly OrderKind[] = ["gt", "gte", "lt", "lte"];

  assert.deepStrictEqual(
    kinds.map((kind) => evaluated(orderOf(kind, left, right))),
    expected.map((held) => truth(held)),
  );
};

/**
 * Give the value of a `qti-equal` of two values in a tolerance mode, through {@link evaluated}.
 *
 * @param toleranceMode Its mode.
 * @param operands Its operands' values: `x`, then `y`, which the range must hold.
 * @param tolerance Its tolerance's tokens.
 * @param flags Its bound flags, each true unless given.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const tolerated = (
  toleranceMode: "absolute" | "relative",
  [x, y]: readonly [Value, Value],
  tolerance: readonly FloatOrRef[],
  flags: Pick<EqualOptions, "includeLowerBound" | "includeUpperBound"> = {},
  variables: Variables = none,
): Value => evaluated(equalOf(x, y, { ...flags, tolerance, toleranceMode }), variables);

/**
 * The two duration comparisons the family runs.
 */
type DurationKind = "duration-gte" | "duration-lt";

/**
 * Construct the single duration value of a number of seconds.
 *
 * @param seconds The seconds, a double.
 * @returns The value.
 */
const duration = (seconds: number): Value => ({
  baseType: "duration",
  cardinality: "single",
  values: [{ baseType: "duration", value: seconds }],
});

/**
 * The duration NULL.
 */
const durationNull: Value = nullOf("duration", "single");

/**
 * Give what `qti-duration-lt` and `qti-duration-gte` of two values give, in that order, through
 * {@link evaluated}.
 *
 * @param left The first operand's value.
 * @param right The second operand's value.
 * @returns The two values.
 */
const durationsOf = (left: Value, right: Value): readonly Value[] => {
  const kinds: readonly DurationKind[] = ["duration-lt", "duration-gte"];

  return kinds.map((kind) => evaluated({ kind, operands: [operandOf(left), operandOf(right)] }));
};

/**
 * Assert the two duration comparisons of two durations.
 *
 * @param left The first operand's seconds.
 * @param right The second operand's seconds.
 * @param expected What `qti-duration-lt` and `qti-duration-gte` give, in that order.
 */
const assertDurations = (
  left: number,
  right: number,
  expected: readonly [boolean, boolean],
): void => {
  assert.deepStrictEqual(
    durationsOf(duration(left), duration(right)),
    expected.map((held) => truth(held)),
    `${left} against ${right}`,
  );
};

describe("the comparison family's evaluators", () => {
  it("[I-9a] qti-gt, qti-gte, qti-lt and qti-lte compare two integers, two floats, and an integer with a float either way", () => {
    assertOrders(integer(2n), integer(1n), [true, true, false, false]);
    assertOrders(integer(1n), integer(1n), [false, true, false, true]);
    assertOrders(float(1.5), float(2.5), [false, false, true, true]);
    assertOrders(float(-0), float(0), [false, true, false, true]);
    assertOrders(integer(3n), float(2.5), [true, true, false, false]);
    assertOrders(integer(2n), float(2.5), [false, false, true, true]);
    assertOrders(integer(-3n), float(-2.5), [false, false, true, true]);
    assertOrders(float(2), integer(2n), [false, true, false, true]);
    assertOrders(float(2.5), integer(3n), [false, false, true, true]);
  });

  it("[I-9a] qti-gt, qti-gte, qti-lt and qti-lte compare the integer 2^53+1 with the float 2^53 exactly, never through a lossy conversion", () => {
    assertOrders(integer(twoTo53 + 1n), float(2 ** 53), [true, true, false, false]);
    assertOrders(float(2 ** 53), integer(twoTo53 + 1n), [false, false, true, true]);
    assertOrders(integer(twoTo53), float(2 ** 53), [false, true, false, true]);
    assertOrders(integer(-twoTo53 - 1n), float(-(2 ** 53)), [false, false, true, true]);
  });

  it("[I-9a] qti-gt, qti-gte, qti-lt and qti-lte order an integer below the float INF and above -INF, and order nothing against NaN", () => {
    assertOrders(integer(10n ** 400n), float(Number.POSITIVE_INFINITY), [false, false, true, true]);
    assertOrders(integer(-(10n ** 400n)), float(Number.NEGATIVE_INFINITY), [
      true,
      true,
      false,
      false,
    ]);
    assertOrders(float(Number.NaN), integer(1n), [false, false, false, false]);
    assertOrders(float(1), float(Number.NaN), [false, false, false, false]);
  });

  it("[I-9a] qti-gt, qti-gte, qti-lt and qti-lte give NULL when either operand is NULL", () => {
    for (const kind of ["gt", "gte", "lt", "lte"] as const) {
      assert.deepStrictEqual(evaluated(orderOf(kind, integerNull, integer(1n))), unknown, kind);
      assert.deepStrictEqual(evaluated(orderOf(kind, float(1), floatNull)), unknown, kind);
    }
  });

  it("[I-9a] qti-equal in absolute mode with one tolerance tests y in [x-t, x+t], each bound closed unless its flag is false (R§6.4)", () => {
    const half = [literal(0.5)];

    assert.deepStrictEqual(
      [9.4, 9.5, 10, 10.5, 10.6].map((y) => tolerated("absolute", [float(10), float(y)], half)),
      [false, true, true, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [
        tolerated("absolute", [float(10), float(9.5)], half, { includeLowerBound: false }),
        tolerated("absolute", [float(10), float(10.5)], half, { includeLowerBound: false }),
        tolerated("absolute", [float(10), float(10.5)], half, { includeUpperBound: false }),
        tolerated("absolute", [float(10), float(9.5)], half, { includeUpperBound: false }),
      ],
      [false, true, false, true].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in absolute mode with two tolerances takes t0 below x and t1 above it (R§6.4)", () => {
    assert.deepStrictEqual(
      [8.5, 9, 12, 12.5].map((y) =>
        tolerated("absolute", [float(10), float(y)], [literal(1), literal(2)]),
      ),
      [false, true, true, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in relative mode reads its tolerances as percentages of x: one for both bounds, or t0 and t1 (R§6.4)", () => {
    const five = [literal(5)];

    assert.deepStrictEqual(
      [189, 190, 210, 211].map((y) => tolerated("relative", [float(200), float(y)], five)),
      [false, true, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [179, 180, 240, 241].map((y) =>
        tolerated("relative", [float(200), float(y)], [literal(10), literal(20)]),
      ),
      [false, true, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [
        tolerated("relative", [float(200), float(190)], five, { includeLowerBound: false }),
        tolerated("relative", [float(200), float(210)], five, { includeUpperBound: false }),
      ],
      [truth(false), truth(false)],
    );
  });

  it("[I-9a] qti-equal in relative mode with a negative x takes t0 percent of |x| below x and t1 percent above it (Mind amendment 2)", () => {
    const ten = [literal(10)];

    assert.deepStrictEqual(
      [-11.5, -11, -10, -9, -8.5].map((y) => tolerated("relative", [float(-10), float(y)], ten)),
      [false, true, true, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [-111, -110, -80, -79].map((y) =>
        tolerated("relative", [float(-100), float(y)], [literal(10), literal(20)]),
      ),
      [false, true, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [
        tolerated("relative", [float(-10), float(-11)], ten, { includeLowerBound: false }),
        tolerated("relative", [float(-10), float(-9)], ten, { includeUpperBound: false }),
        tolerated("relative", [integer(-10n), integer(-11n)], ten),
      ],
      [false, false, true].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in relative mode with x = INF holds INF alone for a tolerance below 100, as the written range does (Mind amendment 3)", () => {
    assert.deepStrictEqual(
      [Number.POSITIVE_INFINITY, Number.MAX_VALUE].map((y) =>
        tolerated("relative", [float(Number.POSITIVE_INFINITY), float(y)], [literal(10)]),
      ),
      [true, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in relative mode with x = -INF holds -INF alone for a tolerance below 100, the range mirrored (Mind amendment 3)", () => {
    assert.deepStrictEqual(
      [Number.NEGATIVE_INFINITY, -Number.MAX_VALUE].map((y) =>
        tolerated("relative", [float(Number.NEGATIVE_INFINITY), float(y)], [literal(10)]),
      ),
      [true, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in relative mode with x = 0 holds 0 alone, whatever its tolerance (Mind amendment 2)", () => {
    assert.deepStrictEqual(
      [-0.001, 0, 0.001].map((y) =>
        tolerated("relative", [float(0), float(y)], [literal(50), literal(50)]),
      ),
      [false, true, false].map((held) => truth(held)),
    );
    assert.deepStrictEqual(
      [
        tolerated("relative", [integer(0n), integer(0n)], [literal(50)]),
        tolerated("relative", [float(0), float(0)], [literal(50)], { includeLowerBound: false }),
        tolerated("relative", [float(0), float(0)], [literal(50)], { includeUpperBound: false }),
      ],
      [true, false, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in a tolerance mode compares an integer and a float operand exactly, the float as the exact fraction it is, whichever operand it is (Mind amendment 1)", () => {
    const one = [literal(1)];

    assert.deepStrictEqual(
      [
        tolerated("absolute", [float(10), integer(9n)], one),
        tolerated("absolute", [integer(10n), float(11)], one),
        tolerated("absolute", [float(10), integer(12n)], one),
      ],
      [true, true, false].map((held) => truth(held)),
    );
    for (const [width, expected] of [
      [2, true],
      [1, true],
      [0, false],
    ] as const) {
      assert.deepStrictEqual(
        [
          tolerated("absolute", [float(2 ** 53), integer(twoTo53 + 1n)], [literal(width)]),
          tolerated("absolute", [integer(twoTo53 + 1n), float(2 ** 53)], [literal(width)]),
        ],
        [truth(expected), truth(expected)],
        `2^53+1 against 2^53 ± ${width}`,
      );
    }
    assert.deepStrictEqual(
      [
        tolerated("absolute", [float(Number.MAX_VALUE), integer(10n ** 400n)], [literal(0)]),
        tolerated("absolute", [integer(10n ** 400n), float(Number.MAX_VALUE)], [literal(0)]),
      ],
      [truth(false), truth(false)],
    );
  });

  it("[I-9a] qti-equal in a tolerance mode compares two finite floats exactly, so no bound is rounded (Mind amendment 1)", () => {
    const x = float(1e16);

    assert.deepStrictEqual(
      [
        tolerated("absolute", [x, float(1e16 + 2)], [literal(1.5)]),
        tolerated("absolute", [x, float(1e16 - 2)], [literal(1.5)]),
        tolerated("absolute", [x, float(1e16 + 2)], [literal(2)]),
        tolerated("absolute", [float(0.1), float(0.3)], [literal(0.2)]),
      ],
      [false, false, true, true].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in a tolerance mode compares two integer operands exactly, so equal(v, v) holds past 2^53 and past the largest float (audit F3)", () => {
    for (const v of [twoTo53 + 1n, 10n ** 400n, -(10n ** 400n)]) {
      for (const toleranceMode of ["absolute", "relative"] as const) {
        for (const width of [0, 1]) {
          assert.deepStrictEqual(
            tolerated(toleranceMode, [integer(v), integer(v)], [literal(width)]),
            truth(true),
            `${v} against itself, ${toleranceMode} ${width}`,
          );
        }
      }
    }
    assert.deepStrictEqual(
      [
        tolerated("relative", [integer(10n ** 400n), integer(10n ** 500n)], [literal(10)]),
        tolerated("relative", [integer(10n ** 400n), integer(11n * 10n ** 399n)], [literal(10)]),
        tolerated(
          "relative",
          [integer(10n ** 400n), integer(11n * 10n ** 399n + 1n)],
          [literal(10)],
        ),
        tolerated("relative", [integer(10n ** 400n), integer(9n * 10n ** 399n)], [literal(10)], {
          includeLowerBound: false,
        }),
        tolerated(
          "relative",
          [integer(-(10n ** 400n)), integer(-11n * 10n ** 399n)],
          [literal(10)],
        ),
        tolerated("absolute", [integer(twoTo53 + 1n), integer(twoTo53 + 2n)], [literal(1)]),
        tolerated("absolute", [integer(twoTo53 + 1n), integer(twoTo53 + 2n)], [literal(0.5)]),
        tolerated("absolute", [integer(twoTo53 + 1n), integer(twoTo53)], [literal(0), literal(1)]),
      ],
      [false, true, false, false, true, true, false, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal in a tolerance mode takes the written float formula for a bound an infinite or NaN tolerance enters, and the other bound exactly (Mind amendment 1)", () => {
    const infinite = literal(Number.POSITIVE_INFINITY);
    const v = integer(twoTo53 + 1n);

    assert.deepStrictEqual(
      [
        tolerated("absolute", [integer(10n), integer(10n ** 400n)], [infinite]),
        tolerated("relative", [integer(10n), integer(-(10n ** 400n))], [infinite]),
        tolerated("relative", [integer(0n), integer(0n)], [infinite]),
        tolerated("absolute", [integer(10n), integer(10n)], [literal(Number.NaN)]),
        tolerated("absolute", [v, v], [infinite, literal(0)]),
        tolerated("absolute", [v, v], [literal(0), infinite]),
        tolerated("absolute", [float(1e16), float(1e16 + 2)], [infinite, literal(1.5)]),
      ],
      [true, true, false, false, true, true, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal reads an integer tolerance variable exactly, past the largest float (Mind amendment 1)", () => {
    const variables: Variables = { outcomes: { BIG: integer(10n ** 400n) }, responses: {} };
    const big = [ref("BIG")];

    assert.deepStrictEqual(
      [
        tolerated("absolute", [integer(0n), integer(10n ** 400n)], big, {}, variables),
        tolerated("absolute", [integer(0n), integer(10n ** 400n + 1n)], big, {}, variables),
        tolerated("absolute", [float(0), integer(10n ** 400n)], big, {}, variables),
        tolerated("absolute", [float(0), integer(10n ** 400n + 1n)], big, {}, variables),
      ],
      [true, false, true, false].map((held) => truth(held)),
    );
  });

  it("[I-9a] qti-equal reads a tolerance token that names a float variable, and one that names an integer variable, exactly (9.11)", () => {
    const variables: Variables = {
      outcomes: { HALF: float(0.5), ONE: integer(1n) },
      responses: {},
    };
    const cases: readonly (readonly [number, readonly FloatOrRef[], boolean])[] = [
      [10.5, [ref("HALF")], true],
      [10.75, [ref("HALF")], false],
      [11, [ref("ONE")], true],
      [8.75, [ref("ONE"), ref("HALF")], false],
      [9, [ref("ONE"), ref("HALF")], true],
      [10.5, [ref("ONE"), ref("HALF")], true],
    ];

    for (const [y, tolerance, expected] of cases) {
      assert.deepStrictEqual(
        tolerated("absolute", [float(10), float(y)], tolerance, {}, variables),
        truth(expected),
        `${y}`,
      );
    }
  });

  it("[I-9a] qti-equal in a tolerance mode gives NULL for a tolerance token that names no variable, a variable that is no number, or one that holds NULL (9.11)", () => {
    const variables: Variables = {
      outcomes: {
        LABEL: {
          baseType: "string",
          cardinality: "single",
          values: [{ baseType: "string", value: "0.5" }],
        },
        UNSET: floatNull,
      },
      responses: {},
    };

    for (const token of ["NOTHING", "LABEL", "UNSET"]) {
      for (const toleranceMode of ["absolute", "relative"] as const) {
        assert.deepStrictEqual(
          evaluated(
            equalOf(float(10), float(10), { tolerance: [literal(1), ref(token)], toleranceMode }),
            variables,
          ),
          unknown,
          `${token} in ${toleranceMode} mode`,
        );
      }
    }
  });

  it("[I-9a] qti-equal in a tolerance mode gives NULL for a tolerance token that names a response or a built-in, as only a template or outcome variable may be named (9.11, audit C1)", () => {
    const variables: Variables = {
      numAttempts: 5n,
      outcomes: { FIVE: integer(5n) },
      responses: { RESPONSE: integer(5n) },
    };

    assert.deepStrictEqual(
      tolerated("absolute", [integer(10n), integer(14n)], [ref("FIVE")], {}, variables),
      truth(true),
      "an outcome holding 5",
    );
    for (const token of ["RESPONSE", "numAttempts"]) {
      for (const toleranceMode of ["absolute", "relative"] as const) {
        assert.deepStrictEqual(
          tolerated(toleranceMode, [integer(10n), integer(14n)], [ref(token)], {}, variables),
          unknown,
          `${token} in ${toleranceMode} mode`,
        );
      }
    }
  });

  it("[I-9a] qti-equal in a tolerance mode gives NULL when its tolerance holds no number or more than two", () => {
    for (const tolerance of [[], [literal(1), literal(1), literal(1)]]) {
      for (const toleranceMode of ["absolute", "relative"] as const) {
        assert.deepStrictEqual(
          evaluated(equalOf(float(10), float(10), { tolerance, toleranceMode })),
          unknown,
          `${tolerance.length} tokens in ${toleranceMode} mode`,
        );
      }
    }
  });

  it("[I-9a] qti-equal in exact mode tests numeric equality and reads no tolerance", () => {
    assert.deepStrictEqual(evaluated(equalOf(integer(1n), float(1))), truth(true));
    assert.deepStrictEqual(evaluated(equalOf(integer(twoTo53 + 1n), float(2 ** 53))), truth(false));
    assert.deepStrictEqual(
      evaluated(equalOf(float(10), float(10.25), { tolerance: [literal(0.5)] })),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(equalOf(float(10), float(10), { tolerance: [ref("NOTHING")] })),
      truth(true),
    );
  });

  it("[I-9a] qti-duration-lt is true when the first duration is shorter, and qti-duration-gte when it is as long or longer", () => {
    assertDurations(89.9, 90, [true, false]);
    assertDurations(90, 90, [false, true]);
    assertDurations(90.5, 90, [false, true]);
    assertDurations(-1.5, 0, [true, false]);
  });

  it("[I-9a] qti-duration-lt and qti-duration-gte give NULL when either operand is NULL", () => {
    assert.deepStrictEqual(durationsOf(durationNull, duration(90)), [unknown, unknown]);
    assert.deepStrictEqual(durationsOf(duration(90), durationNull), [unknown, unknown]);
    assert.deepStrictEqual(durationsOf(durationNull, durationNull), [unknown, unknown]);
  });

  it("[I-9a] qti-duration-lt and qti-duration-gte give false either way when either duration is NaN", () => {
    assertDurations(Number.NaN, 90, [false, false]);
    assertDurations(90, Number.NaN, [false, false]);
    assertDurations(Number.NaN, Number.NaN, [false, false]);
  });

  it("[I-9a] qti-duration-lt and qti-duration-gte compare INF and -INF as infinities", () => {
    assertDurations(Number.POSITIVE_INFINITY, Number.MAX_VALUE, [false, true]);
    assertDurations(Number.MAX_VALUE, Number.POSITIVE_INFINITY, [true, false]);
    assertDurations(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, [false, true]);
    assertDurations(Number.NEGATIVE_INFINITY, -Number.MAX_VALUE, [true, false]);
    assertDurations(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, [true, false]);
  });

  it("[I-9a] qti-duration-lt and qti-duration-gte read the seconds exactly as doubles, with no truncation: 89.95 and 90 differ", () => {
    assertDurations(89.95, 90, [true, false]);
    assertDurations(90, 90 + 2 ** -46, [true, false]);
    assertDurations(90 + 2 ** -46, 90, [false, true]);
    assertDurations(5e-324, 0, [false, true]);
    assertDurations(0, 5e-324, [true, false]);
  });

  it("[I-9a] qti-equal gives NULL when either operand is NULL, in every tolerance mode", () => {
    for (const toleranceMode of ["exact", "absolute", "relative"] as const) {
      const options: EqualOptions = { tolerance: [literal(1)], toleranceMode };

      assert.deepStrictEqual(evaluated(equalOf(integerNull, float(1), options)), unknown);
      assert.deepStrictEqual(evaluated(equalOf(float(1), floatNull, options)), unknown);
    }
  });
});
