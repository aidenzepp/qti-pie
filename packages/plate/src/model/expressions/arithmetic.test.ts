import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { SourceElement } from "#plate/document/source.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import {
  assertKindType,
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  refusalsOf,
  responseDeclaration,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the rule that sets `OUT` in an item {@link outItem} builds.
 */
const setOut = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

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
 * Build an item and run its processing over the given responses, as one attempt does.
 *
 * @param baseType `OUT`'s base type.
 * @param expression The expression `OUT` is set to.
 * @param declarations The declarations beside `OUT`'s.
 * @param responses The responses, by identifier.
 * @returns The value of `OUT` after the run.
 */
const outAfter = (
  baseType: string,
  expression: SourceElement,
  declarations: readonly SourceElement[] = [],
  responses: Variables["responses"] = {},
) =>
  Effect.gen(function* runOut() {
    const after = yield* processed(outItem(baseType, expression, declarations), responses);
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes["OUT"]),
    );
  });

/**
 * Construct a `qti-base-value` of an integer, as written.
 *
 * @param written The integer, as written.
 * @returns The element.
 */
const integerElement = (written: string): SourceElement => baseValueElement("integer", written);

/**
 * Construct a `qti-base-value` of a float, as written.
 *
 * @param written The float, as written.
 * @returns The element.
 */
const floatElement = (written: string): SourceElement => baseValueElement("float", written);

/**
 * Construct the `qti-base-value` expression of a value, as the reader reads
 * {@link integerElement} or {@link floatElement}.
 *
 * @param value The value.
 * @returns The expression.
 */
const valueExpression = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Construct a single integer value.
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
 * Construct a single float value.
 *
 * @param value The float.
 * @returns The value.
 */
const floatValue = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

/**
 * The single integer type.
 */
const integerType = { baseType: "integer", cardinality: "single" } as const;

/**
 * The single float type.
 */
const floatType = { baseType: "float", cardinality: "single" } as const;

describe("the arithmetic family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds qti-sum, qti-product, qti-subtract, qti-divide, qti-min and qti-max, with processing some",
    () =>
      Effect.gen(function* buildsArithmetic() {
        const built = yield* buildItem(
          processingItem(
            [
              outcomeDeclaration("SUM", "integer"),
              outcomeDeclaration("PRODUCT", "float"),
              outcomeDeclaration("DIFFERENCE", "integer"),
              outcomeDeclaration("QUOTIENT", "float"),
              outcomeDeclaration("LEAST", "integer"),
              outcomeDeclaration("GREATEST", "float"),
            ],
            [
              setOutcomeElement(
                "SUM",
                expressionElement("sum", [], [integerElement("1"), integerElement("2")]),
              ),
              setOutcomeElement(
                "PRODUCT",
                expressionElement("product", [], [integerElement("3"), floatElement("0.5")]),
              ),
              setOutcomeElement(
                "DIFFERENCE",
                expressionElement("subtract", [], [integerElement("5"), integerElement("7")]),
              ),
              setOutcomeElement(
                "QUOTIENT",
                expressionElement("divide", [], [integerElement("7"), integerElement("2")]),
              ),
              setOutcomeElement("LEAST", expressionElement("min", [], [integerElement("4")])),
              setOutcomeElement(
                "GREATEST",
                expressionElement(
                  "max",
                  [],
                  [floatElement("2.5"), integerElement("3"), floatElement("-1")],
                ),
              ),
            ],
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                kind: "sum",
                operands: [valueExpression(integerValue(1n)), valueExpression(integerValue(2n))],
              },
              identifier: "SUM",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "product",
                operands: [valueExpression(integerValue(3n)), valueExpression(floatValue(0.5))],
              },
              identifier: "PRODUCT",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "subtract",
                operands: [valueExpression(integerValue(5n)), valueExpression(integerValue(7n))],
              },
              identifier: "DIFFERENCE",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "divide",
                operands: [valueExpression(integerValue(7n)), valueExpression(integerValue(2n))],
              },
              identifier: "QUOTIENT",
              kind: "set-outcome",
            },
            {
              expression: { kind: "min", operands: [valueExpression(integerValue(4n))] },
              identifier: "LEAST",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "max",
                operands: [
                  valueExpression(floatValue(2.5)),
                  valueExpression(integerValue(3n)),
                  valueExpression(floatValue(-1)),
                ],
              },
              identifier: "GREATEST",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] run each kind in an item's processing: an integer from integers, a float otherwise, exact past 2^53 (reading 45)",
    () =>
      Effect.gen(function* runsArithmetic() {
        const cases: readonly (readonly [
          string,
          "divide" | "max" | "min" | "product" | "subtract" | "sum",
          readonly SourceElement[],
          Value,
        ])[] = [
          [
            "integer",
            "sum",
            [integerElement("9007199254740992"), integerElement("1")],
            integerValue(9_007_199_254_740_993n),
          ],
          [
            "integer",
            "product",
            [integerElement("9007199254740993"), integerElement("3")],
            integerValue(27_021_597_764_222_979n),
          ],
          ["float", "product", [integerElement("3"), floatElement("0.5")], floatValue(1.5)],
          [
            "integer",
            "subtract",
            [integerElement("9007199254740995"), integerElement("2")],
            integerValue(9_007_199_254_740_993n),
          ],
          ["float", "subtract", [floatElement("2.5"), integerElement("1")], floatValue(1.5)],
          ["float", "divide", [integerElement("7"), integerElement("2")], floatValue(3.5)],
          ["integer", "min", [integerElement("4"), integerElement("-2")], integerValue(-2n)],
          ["float", "min", [integerElement("3"), floatElement("2.5")], floatValue(2.5)],
          ["float", "max", [integerElement("3"), floatElement("2.5")], floatValue(3)],
        ];

        for (const [outType, kind, operands, expected] of cases) {
          const out = yield* outAfter(outType, expressionElement(kind, [], operands));

          assert.deepStrictEqual(out, expected, `qti-${kind} into a ${outType} outcome`);
          assertKindType(
            out,
            kind,
            operands.map((operand) =>
              operand.attributes.some((each) => each.value === "integer") ? integerType : floatType,
            ),
          );
        }
      }),
  );

  it.effect(
    "[I-9a] run a qti-sum of an integer response of cardinality multiple, member by member",
    () =>
      Effect.gen(function* sumsContainer() {
        const expression = expressionElement(
          "sum",
          [],
          [variableElement("RESPONSE"), integerElement("4")],
        );
        const declarations = [responseDeclaration("RESPONSE", "integer", "multiple")];

        assert.deepStrictEqual(refusalsOf(outItem("integer", expression, declarations)), []);

        const out = yield* outAfter("integer", expression, declarations, {
          RESPONSE: {
            baseType: "integer",
            cardinality: "multiple",
            values: [
              { baseType: "integer", value: 1n },
              { baseType: "integer", value: 2n },
              { baseType: "integer", value: 3n },
            ],
          },
        });

        assert.deepStrictEqual(out, integerValue(10n));
        assertKindType(out, "sum", [{ baseType: "integer", cardinality: "multiple" }, integerType]);
      }),
  );

  it.effect("[I-9a] set a float outcome from a qti-divide by 0 to NULL, not a failure (§4.4)", () =>
    Effect.gen(function* dividesByZero() {
      const expression = expressionElement(
        "divide",
        [],
        [integerElement("1"), integerElement("0")],
      );

      assert.deepStrictEqual(refusalsOf(outItem("float", expression)), []);

      const out = yield* outAfter("float", expression);

      assert.deepStrictEqual(out, nullOf("float", "single"));
      assertKindType(out, "divide", [integerType, integerType]);
    }),
  );

  it("[I-9a] refuse each operand of the arithmetic kinds that is a duration (9.5: not numerical) or a string (expression-type, P23)", () => {
    const duration = baseValueElement("duration", "PT1S");
    const written = baseValueElement("string", "4");
    const cases: readonly (readonly [
      SourceElement,
      string,
      string,
      "multiple ordered single" | "single",
    ])[] = [
      [
        expressionElement("sum", [], [integerElement("1"), duration]),
        "2",
        "duration",
        "multiple ordered single",
      ],
      [expressionElement("product", [], [written]), "1", "string", "multiple ordered single"],
      [
        expressionElement("min", [], [duration, integerElement("1")]),
        "1",
        "duration",
        "multiple ordered single",
      ],
      [
        expressionElement("max", [], [integerElement("1"), written]),
        "2",
        "string",
        "multiple ordered single",
      ],
      [
        expressionElement("subtract", [], [duration, integerElement("1")]),
        "1",
        "duration",
        "single",
      ],
      [expressionElement("divide", [], [integerElement("1"), written]), "2", "string", "single"],
    ];

    for (const [expression, operand, expressionBaseType, cardinalities] of cases) {
      assert.deepStrictEqual(
        refusalsOf(outItem("float", expression)),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: cardinalities,
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

  it("[I-9a] refuse a container operand of qti-subtract and qti-divide, which take single numbers (expression-type, P23)", () => {
    const declarations = [responseDeclaration("RESPONSE", "integer", "multiple")];

    for (const [outType, kind] of [
      ["integer", "subtract"],
      ["float", "divide"],
    ] as const) {
      const expression = expressionElement(
        kind,
        [],
        [integerElement("1"), variableElement("RESPONSE")],
      );

      assert.deepStrictEqual(
        refusalsOf(outItem(outType, expression, declarations)),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "single",
              check: "operand",
              element: `qti-${kind}`,
              expressionBaseType: "integer",
              expressionCardinality: "multiple",
              operand: "2",
            },
            path: `${setOut}/qti-${kind}`,
            rule: "expression-type",
          },
        ],
        kind,
      );
    }
  });
});
