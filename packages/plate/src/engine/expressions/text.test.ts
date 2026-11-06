/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-inside` and names an area's geometry, not a structure. */
import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression, ExpressionType, StringOrRef } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { AreaShape } from "#plate/vocabulary.ts";
import { bg007Item, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, scopeOf } from "#plate/test/processing.ts";

/**
 * The single boolean NULL.
 */
const unknown: Value = nullOf("boolean", "single");

/**
 * The type of a single string operand.
 */
const singleString: ExpressionType = { baseType: "string", cardinality: "single" };

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value.
 */
const truth = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * Construct a single string value.
 *
 * @param value The string.
 * @returns The value.
 */
const string = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * Construct the `qti-base-value` operand of a value.
 *
 * @param value The value, NULL included.
 * @returns The operand.
 */
const operandOf = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Give the value of a text expression through the engine's dispatcher, after checking that it
 * succeeded and holds the type its kind's rule gives over its operands' types (the family's type
 * invariant).
 *
 * @param expression The expression.
 * @param operands The types of its operands, in order.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const evaluated = (
  expression: Expression,
  operands: readonly ExpressionType[],
  variables: Variables = none,
): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, variables));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  assertKindType(value, expression.kind, operands);

  return value;
};

/**
 * Construct a `qti-string-match` of two string values.
 *
 * @param left Its first operand.
 * @param right Its second operand.
 * @param flags Its `case-sensitive` and its `substring`.
 * @param flags.caseSensitive Its `case-sensitive`.
 * @param flags.substring Its `substring`.
 * @returns The expression.
 */
const stringMatchOf = (
  left: Value,
  right: Value,
  { caseSensitive, substring }: { readonly caseSensitive: boolean; readonly substring: boolean },
): Expression => ({
  caseSensitive,
  kind: "string-match",
  operands: [operandOf(left), operandOf(right)],
  substring,
});

/**
 * Construct a `qti-substring` of two string values.
 *
 * @param left Its first operand.
 * @param right Its second operand.
 * @param caseSensitive Its `case-sensitive`.
 * @returns The expression.
 */
const substringOf = (left: Value, right: Value, caseSensitive: boolean): Expression => ({
  caseSensitive,
  kind: "substring",
  operands: [operandOf(left), operandOf(right)],
});

/**
 * Construct a `qti-pattern-match` of a string value.
 *
 * @param pattern Its `pattern`.
 * @param value Its operand.
 * @returns The expression.
 */
const patternMatchOf = (pattern: StringOrRef, value: Value): Expression => ({
  kind: "pattern-match",
  operands: [operandOf(value)],
  pattern,
});

/**
 * Construct a literal pattern.
 *
 * @param value The pattern's text.
 * @returns The literal.
 */
const literal = (value: string): StringOrRef => ({ _tag: "literal", value });

/**
 * Construct a reference to a variable from a pattern.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const ref = (identifier: string): StringOrRef => ({ _tag: "ref", identifier });

/**
 * Construct a points value.
 *
 * @param cardinality Its cardinality.
 * @param points Its points, each as `[x, y]`.
 * @returns The value.
 */
const pointsOf = (
  cardinality: Value["cardinality"],
  points: readonly (readonly [bigint, bigint])[],
): Value => ({
  baseType: "point",
  cardinality,
  values: points.map((point) => ({ baseType: "point", value: point })),
});

/**
 * Construct a `qti-inside` of a point value.
 *
 * @param shape Its `shape`.
 * @param coords Its `coords`.
 * @param value Its operand.
 * @returns The expression.
 */
const insideOf = (shape: AreaShape, coords: readonly number[], value: Value): Expression => ({
  coords,
  kind: "inside",
  operands: [operandOf(value)],
  shape,
});

/**
 * Give whether `qti-inside` holds one point, after checking the type invariant.
 *
 * @param shape The area's shape.
 * @param coords The area's coordinates.
 * @param point The point, as `[x, y]`.
 * @returns The value.
 */
const insideAt = (shape: AreaShape, coords: readonly number[], point: readonly [bigint, bigint]) =>
  evaluated(insideOf(shape, coords, pointsOf("single", [point])), [
    { baseType: "point", cardinality: "single" },
  ]);

describe("the text family's evaluators", () => {
  it("[I-9a] qti-string-match compares two strings whole, exactly when case-sensitive and with case folded as map entries fold when not (9.14)", () => {
    const exact = { caseSensitive: true, substring: false };
    const folded = { caseSensitive: false, substring: false };
    const pair = [singleString, singleString];

    assert.deepStrictEqual(
      evaluated(stringMatchOf(string("York"), string("York"), exact), pair),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(stringMatchOf(string("York"), string("YORK"), exact), pair),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(stringMatchOf(string("York"), string("YORK"), folded), pair),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(stringMatchOf(string("Straße"), string("STRASSE"), folded), pair),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(stringMatchOf(string("York"), string("New York"), folded), pair),
      truth(false),
    );
  });

  it("[I-9a] qti-string-match with substring true gives whether the first string contains the second", () => {
    const pair = [singleString, singleString];

    assert.deepStrictEqual(
      evaluated(
        stringMatchOf(string("New York"), string("york"), {
          caseSensitive: false,
          substring: true,
        }),
        pair,
      ),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(
        stringMatchOf(string("New York"), string("york"), { caseSensitive: true, substring: true }),
        pair,
      ),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(
        stringMatchOf(string("York"), string("New York"), { caseSensitive: true, substring: true }),
        pair,
      ),
      truth(false),
    );
  });

  it("[I-9a] qti-substring gives whether the first string is a substring of the second, with case folded when not case-sensitive (9.14)", () => {
    const pair = [singleString, singleString];

    assert.deepStrictEqual(
      evaluated(substringOf(string("York"), string("New York"), true), pair),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(substringOf(string("New York"), string("York"), true), pair),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(substringOf(string("YORK"), string("New York"), true), pair),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(substringOf(string("YORK"), string("New York"), false), pair),
      truth(true),
    );
  });

  it("[I-9a] qti-string-match and qti-substring give NULL when either operand is NULL", () => {
    const pair = [singleString, singleString];
    const absent = nullOf("string", "single");
    const flags = { caseSensitive: true, substring: false };

    assert.deepStrictEqual(evaluated(stringMatchOf(absent, string("a"), flags), pair), unknown);
    assert.deepStrictEqual(evaluated(stringMatchOf(string("a"), absent, flags), pair), unknown);
    assert.deepStrictEqual(evaluated(substringOf(absent, string("a"), true), pair), unknown);
    assert.deepStrictEqual(evaluated(substringOf(string("a"), absent, true), pair), unknown);
  });

  it("[I-9a] qti-pattern-match matches the whole string, the pattern anchored at both ends, and gives NULL for NULL", () => {
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("[0-9]+"), string("123")), [singleString]),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("[0-9]+"), string("a123")), [singleString]),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("[0-9]+"), string("123a")), [singleString]),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("^1$"), string("^1$")), [singleString]),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("[0-9]+"), nullOf("string", "single")), [singleString]),
      unknown,
    );
  });

  it("[I-9a] qti-pattern-match answers (a+)+b against 100,000 a's at once, through the linear automaton (G-CQ F12)", () => {
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("(a+)+b"), string("a".repeat(100_000))), [singleString]),
      truth(false),
    );
  }, 5000);

  it("[I-9a] qti-pattern-match reads a referenced pattern's value at run time, and gives NULL for a value no regular expression, a NULL or a value of another type", () => {
    const variables: Variables = {
      outcomes: {
        BROKEN: string("a(b"),
        COUNT: integer(1n),
        DIGITS: string("[0-9]+"),
        UNSET: nullOf("string", "single"),
      },
      responses: {},
    };

    assert.deepStrictEqual(
      evaluated(patternMatchOf(ref("DIGITS"), string("42")), [singleString], variables),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(ref("DIGITS"), string("4a")), [singleString], variables),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(ref("BROKEN"), string("ab")), [singleString], variables),
      unknown,
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(ref("UNSET"), string("ab")), [singleString], variables),
      unknown,
    );
    assert.deepStrictEqual(
      evaluated(patternMatchOf(ref("COUNT"), string("1")), [singleString], variables),
      unknown,
    );
  });

  it("[I-9a] qti-pattern-match gives NULL for a literal pattern no regular expression, which the reader marks first", () => {
    assert.deepStrictEqual(
      evaluated(patternMatchOf(literal("{NOPE}"), string("{NOPE}")), [singleString]),
      unknown,
    );
  });

  it("[I-9a] qti-pattern-match fails with UnknownIdentifierError for a pattern naming a variable the variables hold no value of", () => {
    const result = evaluateIn(
      patternMatchOf({ _tag: "ref", identifier: "GONE" }, string("1")),
      scopeOf(bg007Item, none),
    );

    assert.deepStrictEqual(
      Result.match(result, { onFailure: (failure) => failure._tag, onSuccess: () => "success" }),
      "UnknownIdentifierError",
    );
  });

  it("[I-9a] qti-inside holds a point in each shape, its boundary included, and none outside (readings 52 and 59)", () => {
    const cases: readonly (readonly [
      AreaShape,
      readonly number[],
      readonly [bigint, bigint],
      boolean,
    ])[] = [
      ["rect", [10, 20, 30, 40], [20n, 30n], true],
      ["rect", [10, 20, 30, 40], [30n, 40n], true],
      ["rect", [10, 20, 30, 40], [31n, 40n], false],
      ["circle", [50, 50, 10], [55n, 55n], true],
      ["circle", [50, 50, 10], [60n, 50n], true],
      ["circle", [50, 50, 10], [61n, 50n], false],
      ["ellipse", [50, 50, 20, 10], [70n, 50n], true],
      ["ellipse", [50, 50, 20, 10], [50n, 61n], false],
      ["poly", [0, 0, 10, 0, 0, 10], [2n, 2n], true],
      ["poly", [0, 0, 10, 0, 0, 10], [5n, 5n], true],
      ["poly", [0, 0, 10, 0, 0, 10], [6n, 6n], false],
      ["default", [], [1000n, -1000n], true],
    ];

    for (const [shape, coords, point, held] of cases) {
      assert.deepStrictEqual(
        insideAt(shape, coords, point),
        truth(held),
        `${shape} ${point.join(" ")}`,
      );
    }
  });

  it("[I-9a] qti-inside over a container gives true when any point is inside, and NULL for NULL", () => {
    const rect = [10, 20, 30, 40];

    for (const cardinality of ["multiple", "ordered"] as const) {
      const type: ExpressionType = { baseType: "point", cardinality };

      assert.deepStrictEqual(
        evaluated(
          insideOf(
            "rect",
            rect,
            pointsOf(cardinality, [
              [0n, 0n],
              [20n, 30n],
            ]),
          ),
          [type],
        ),
        truth(true),
      );
      assert.deepStrictEqual(
        evaluated(
          insideOf(
            "rect",
            rect,
            pointsOf(cardinality, [
              [0n, 0n],
              [1n, 1n],
            ]),
          ),
          [type],
        ),
        truth(false),
      );
      assert.deepStrictEqual(
        evaluated(insideOf("rect", rect, nullOf("point", cardinality)), [type]),
        unknown,
      );
    }
    assert.deepStrictEqual(
      evaluated(insideOf("rect", rect, nullOf("point", "single")), [
        { baseType: "point", cardinality: "single" },
      ]),
      unknown,
    );
  });

  it("[I-9a] qti-custom-operator gives NULL, whatever its operands (9.21)", () => {
    const custom: Expression = {
      class: Option.some("com.example.Marker"),
      definition: Option.none(),
      kind: "custom-operator",
      operands: [operandOf(string("essay")), operandOf(integer(1n))],
    };
    const value = evaluated(custom, [singleString, { baseType: "integer", cardinality: "single" }]);

    assert.deepStrictEqual(value.values, []);
  });
});
