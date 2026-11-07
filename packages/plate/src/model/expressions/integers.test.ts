import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import {
  assertKindType,
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  refusalsOf,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the `qti-response-processing` of an item {@link processingItem} builds.
 */
const processing = "qti-assessment-item/qti-response-processing";

/**
 * The path of the rule that sets `OUT` in an item {@link outItem} builds.
 */
const setOut = `${processing}/qti-set-outcome-value`;

/**
 * Construct an item whose processing sets the outcome `OUT` to one expression.
 *
 * @param baseType `OUT`'s base type.
 * @param expression The expression element.
 * @param declarations The declarations beside `OUT`'s, in document order after it.
 * @returns The item document.
 */
const outItem = (
  baseType: string,
  expression: SourceElement,
  declarations: readonly SourceElement[] = [],
) =>
  processingItem(
    [outcomeDeclaration("OUT", baseType), ...declarations],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * Construct a `qti-base-value` of an integer, as written.
 *
 * @param written The integer, as written.
 * @returns The element.
 */
const integerElement = (written: string): SourceElement => baseValueElement("integer", written);

/**
 * Construct a multiple integer outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param written Its default value's members, as written.
 * @returns The `qti-outcome-declaration`.
 */
const integersOutcome = (identifier: string, written: readonly string[]): SourceElement =>
  outcomeDeclaration(identifier, "integer", "multiple", [
    el(
      "qti-default-value",
      [],
      written.map((member) => el("qti-value", [], [text(member)])),
    ),
  ]);

/**
 * Construct the `qti-base-value` expression of an integer, as the reader reads
 * {@link integerElement}.
 *
 * @param value The integer.
 * @returns The expression.
 */
const integerExpression = (value: bigint): Expression => ({
  kind: "base-value",
  operands: [],
  value: { baseType: "integer", cardinality: "single", values: [{ baseType: "integer", value }] },
});

/**
 * Build an item and run its processing with no response, as one attempt does.
 *
 * @param baseType `OUT`'s base type.
 * @param expression The expression `OUT` is set to.
 * @param declarations The declarations beside `OUT`'s.
 * @returns The value of `OUT` after the run.
 */
const outAfter = (
  baseType: string,
  expression: SourceElement,
  declarations: readonly SourceElement[] = [],
) =>
  Effect.gen(function* runOut() {
    const after = yield* processed(outItem(baseType, expression, declarations), {});
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes["OUT"]),
    );
  });

/**
 * The single integer value of an integer.
 *
 * @param value The integer.
 * @returns The value.
 */
const integerValue = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * The single integer type.
 */
const integerType = { baseType: "integer", cardinality: "single" } as const;

describe("the integers family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds qti-integer-divide, qti-integer-modulus, qti-integer-to-float, qti-gcd and qti-lcm, with processing some",
    () =>
      Effect.gen(function* buildsIntegers() {
        const built = yield* buildItem(
          processingItem(
            [
              outcomeDeclaration("QUOTIENT", "integer"),
              outcomeDeclaration("REMAINDER", "integer"),
              outcomeDeclaration("FLOATED", "float"),
              outcomeDeclaration("GCD", "integer"),
              outcomeDeclaration("LCM", "integer"),
            ],
            [
              setOutcomeElement(
                "QUOTIENT",
                expressionElement(
                  "integer-divide",
                  [],
                  [integerElement("-7"), integerElement("2")],
                ),
              ),
              setOutcomeElement(
                "REMAINDER",
                expressionElement(
                  "integer-modulus",
                  [],
                  [integerElement("7"), integerElement("-2")],
                ),
              ),
              setOutcomeElement(
                "FLOATED",
                expressionElement("integer-to-float", [], [integerElement("3")]),
              ),
              setOutcomeElement(
                "GCD",
                expressionElement("gcd", [], [integerElement("12"), integerElement("18")]),
              ),
              setOutcomeElement("LCM", expressionElement("lcm", [], [integerElement("4")])),
            ],
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                kind: "integer-divide",
                operands: [integerExpression(-7n), integerExpression(2n)],
              },
              identifier: "QUOTIENT",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "integer-modulus",
                operands: [integerExpression(7n), integerExpression(-2n)],
              },
              identifier: "REMAINDER",
              kind: "set-outcome",
            },
            {
              expression: { kind: "integer-to-float", operands: [integerExpression(3n)] },
              identifier: "FLOATED",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "gcd",
                operands: [integerExpression(12n), integerExpression(18n)],
              },
              identifier: "GCD",
              kind: "set-outcome",
            },
            {
              expression: { kind: "lcm", operands: [integerExpression(4n)] },
              identifier: "LCM",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] run qti-integer-divide and qti-integer-modulus in an item's processing: -4 for -7 / 2, -1 for 7 mod -2",
    () =>
      Effect.gen(function* runsDivision() {
        const divide = expressionElement(
          "integer-divide",
          [],
          [integerElement("-7"), integerElement("2")],
        );
        const modulus = expressionElement(
          "integer-modulus",
          [],
          [integerElement("7"), integerElement("-2")],
        );

        assert.deepStrictEqual(refusalsOf(outItem("integer", divide)), []);
        assert.deepStrictEqual(refusalsOf(outItem("integer", modulus)), []);

        const quotient = yield* outAfter("integer", divide);
        const remainder = yield* outAfter("integer", modulus);

        assert.deepStrictEqual(quotient, integerValue(-4n));
        assert.deepStrictEqual(remainder, integerValue(-1n));
        assertKindType(quotient, "integer-divide", [integerType, integerType]);
        assertKindType(remainder, "integer-modulus", [integerType, integerType]);
      }),
  );

  it.effect(
    "[I-9a] run qti-integer-to-float of 10^400 in an item's processing to the largest finite float (reading 45)",
    () =>
      Effect.gen(function* runsHugeFloat() {
        const expression = expressionElement(
          "integer-to-float",
          [],
          [integerElement(`1${"0".repeat(400)}`)],
        );

        assert.deepStrictEqual(refusalsOf(outItem("float", expression)), []);

        const out = yield* outAfter("float", expression);

        assert.deepStrictEqual(out, {
          baseType: "float",
          cardinality: "single",
          values: [{ baseType: "float", value: Number.MAX_VALUE }],
        });
        assertKindType(out, "integer-to-float", [integerType]);
      }),
  );

  it.effect(
    "[I-9a] run qti-gcd and qti-lcm over a multiple integer outcome variable and a single integer, with no refusal",
    () =>
      Effect.gen(function* runsAggregates() {
        const declarations = [integersOutcome("NUMS", ["12", "-18"])];
        const gcd = expressionElement("gcd", [], [variableElement("NUMS"), integerElement("8")]);
        const lcm = expressionElement("lcm", [], [variableElement("NUMS"), integerElement("8")]);

        assert.deepStrictEqual(refusalsOf(outItem("integer", gcd, declarations)), []);
        assert.deepStrictEqual(refusalsOf(outItem("integer", lcm, declarations)), []);

        const greatest = yield* outAfter("integer", gcd, declarations);
        const least = yield* outAfter("integer", lcm, declarations);
        const multipleType = { baseType: "integer", cardinality: "multiple" } as const;

        assert.deepStrictEqual(greatest, integerValue(2n));
        assert.deepStrictEqual(least, integerValue(72n));
        assertKindType(greatest, "gcd", [multipleType, integerType]);
        assertKindType(least, "lcm", [multipleType, integerType]);
      }),
  );

  it("[I-9a] refuse each operand of the integer kinds that is not an integer of a cardinality the kind takes (expression-type, P23)", () => {
    const floated = baseValueElement("float", "2");
    const written = baseValueElement("string", "2");
    const single = { acceptsBaseTypes: "integer", acceptsCardinalities: "single" };
    const aggregate = {
      acceptsBaseTypes: "integer",
      acceptsCardinalities: "multiple ordered single",
    };
    const cases: readonly (readonly [
      string,
      SourceElement,
      typeof aggregate | typeof single,
      string,
      string,
    ])[] = [
      [
        "integer",
        expressionElement("integer-divide", [], [integerElement("7"), floated]),
        single,
        "2",
        "float",
      ],
      [
        "integer",
        expressionElement("integer-modulus", [], [written, integerElement("2")]),
        single,
        "1",
        "string",
      ],
      ["float", expressionElement("integer-to-float", [], [floated]), single, "1", "float"],
      [
        "integer",
        expressionElement("gcd", [], [integerElement("4"), floated]),
        aggregate,
        "2",
        "float",
      ],
      ["integer", expressionElement("lcm", [], [written]), aggregate, "1", "string"],
    ];

    for (const [outType, expression, accepted, operand, expressionBaseType] of cases) {
      assert.deepStrictEqual(
        refusalsOf(outItem(outType, expression)),
        [
          {
            detail: {
              ...accepted,
              check: "operand",
              element: expression.local,
              expressionBaseType,
              expressionCardinality: "single",
              operand,
            },
            path: `${setOut}/${expression.local}`,
            rule: "expression-type",
          },
        ],
        expression.local,
      );
    }
  });

  it("[I-9a] refuse a multiple integer operand of qti-integer-divide, which takes single operands only (expression-type, P23)", () => {
    const expression = expressionElement(
      "integer-divide",
      [],
      [variableElement("NUMS"), integerElement("2")],
    );

    assert.deepStrictEqual(
      refusalsOf(outItem("integer", expression, [integersOutcome("NUMS", ["4"])])),
      [
        {
          detail: {
            acceptsBaseTypes: "integer",
            acceptsCardinalities: "single",
            check: "operand",
            element: "qti-integer-divide",
            expressionBaseType: "integer",
            expressionCardinality: "multiple",
            operand: "1",
          },
          path: `${setOut}/qti-integer-divide`,
          rule: "expression-type",
        },
      ],
    );
  });
});
