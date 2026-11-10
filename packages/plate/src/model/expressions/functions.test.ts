import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { float, integer } from "#plate/test/fixtures.ts";
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
 * Construct a float outcome declaration whose default is a container of floats.
 *
 * @param identifier Its `identifier`.
 * @param written Its default values, as written.
 * @returns The `qti-outcome-declaration`.
 */
const floatsOutcome = (identifier: string, written: readonly string[]): SourceElement =>
  outcomeDeclaration(identifier, "float", "multiple", [
    el(
      "qti-default-value",
      [],
      written.map((value) => el("qti-value", [], [text(value)])),
    ),
  ]);

/**
 * Construct a `qti-math-operator`.
 *
 * @param name Its `name`, as written.
 * @param operands Its operands.
 * @returns The element.
 */
const mathOperatorElement = (name: string, operands: readonly SourceElement[]): SourceElement =>
  expressionElement("math-operator", [attr("name", name)], operands);

/**
 * Construct a `qti-base-value` of a float.
 *
 * @param written The float, as written.
 * @returns The element.
 */
const floatElement = (written: string): SourceElement => baseValueElement("float", written);

/**
 * Construct the `qti-base-value` expression of a value, as the reader reads its element.
 *
 * @param value The value.
 * @returns The expression.
 */
const valueExpression = (value: Value): Expression => ({
  kind: "base-value",
  operands: [],
  value,
});

/**
 * Construct an item whose processing sets a float outcome `SCORE`, an integer outcome `WHOLE` and
 * a float outcome `MEAN` from a functions expression each, beside the float container `VALUES`.
 *
 * @returns The item document.
 */
const functionsItem = () =>
  processingItem(
    [
      outcomeDeclaration("SCORE", "float"),
      outcomeDeclaration("WHOLE", "integer"),
      outcomeDeclaration("MEAN", "float"),
      floatsOutcome("VALUES", ["1", "2", "3", "6"]),
    ],
    [
      setOutcomeElement(
        "SCORE",
        expressionElement(
          "power",
          [],
          [
            mathOperatorElement("abs", [floatElement("-2")]),
            expressionElement("math-constant", [attr("name", "e")]),
          ],
        ),
      ),
      setOutcomeElement("WHOLE", mathOperatorElement("floor", [floatElement("-2.5")])),
      setOutcomeElement(
        "MEAN",
        expressionElement("stats-operator", [attr("name", "mean")], [variableElement("VALUES")]),
      ),
    ],
  );

/**
 * Build an item and run its processing with no response, as one attempt does.
 *
 * @param document The item document.
 * @returns The outcomes after the run.
 */
const outcomesAfter = (document: ReturnType<typeof processingItem>) =>
  Effect.gen(function* runFunctions() {
    const after = yield* processed(document, {});
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(after).outcomes;
  });

/**
 * Construct an item whose processing sets one outcome of a type to one expression.
 *
 * @param baseType The outcome's base type.
 * @param expression The expression element.
 * @returns The item document.
 */
const settingItem = (baseType: string, expression: SourceElement) =>
  processingItem(
    [outcomeDeclaration("OUT", baseType), floatsOutcome("VALUES", ["1", "2"])],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * The refusal of a `qti-set-outcome-value` in an item {@link settingItem} builds whose expression
 * is not of its outcome's type (P20).
 *
 * @param given The expression's base type.
 * @param outcome The outcome's base type.
 * @returns The one refusal.
 */
const mismatch = (given: string, outcome: string): ReturnType<typeof refusalsOf> => [
  {
    detail: {
      element: "qti-set-outcome-value",
      expressionBaseType: given,
      expressionCardinality: "single",
      identifier: "OUT",
      outcomeBaseType: outcome,
      outcomeCardinality: "single",
    },
    path: `${processing}/qti-set-outcome-value`,
    rule: "expression-type",
  },
];

describe("the functions family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds qti-power, qti-math-operator, qti-math-constant and qti-stats-operator, with processing some",
    () =>
      Effect.gen(function* buildsFunctions() {
        const built = yield* Effect.fromResult(buildItem(functionsItem()));

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                kind: "power",
                operands: [
                  { kind: "math-operator", name: "abs", operands: [valueExpression(float(-2))] },
                  { kind: "math-constant", name: "e", operands: [] },
                ],
              },
              identifier: "SCORE",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "math-operator",
                name: "floor",
                operands: [valueExpression(float(-2.5))],
              },
              identifier: "WHOLE",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "stats-operator",
                name: "mean",
                operands: [
                  {
                    identifier: "VALUES",
                    kind: "variable",
                    operands: [],
                    weightIdentifier: Option.none(),
                  },
                ],
              },
              identifier: "MEAN",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(refusalsOf(functionsItem()), []);
      }),
  );

  it.effect("[I-9a] run that processing: a float power, an integer floor and a float mean", () =>
    Effect.gen(function* runsFunctions() {
      const outcomes = yield* outcomesAfter(functionsItem());
      const score = outcomes["SCORE"];
      const whole = outcomes["WHOLE"];
      const mean = outcomes["MEAN"];

      assert.strictEqual(score?.baseType, "float");
      assert.strictEqual(score?.cardinality, "single");
      assert.strictEqual(score?.values.length, 1);
      assert.deepStrictEqual(whole, integer(-3n));
      assert.deepStrictEqual(mean, float(3));
      assertKindType(
        Option.getOrThrow(Option.fromNullishOr(whole)),
        "math-operator",
        [{ baseType: "float", cardinality: "single" }],
        { name: "floor" },
      );
      assertKindType(
        Option.getOrThrow(Option.fromNullishOr(mean)),
        "stats-operator",
        [{ baseType: "float", cardinality: "multiple" }],
        { name: "mean" },
      );
    }),
  );

  it("[I-9a] refuse each operand of qti-math-operator, qti-power and qti-stats-operator of another type (expression-type, P23)", () => {
    const cases: readonly (readonly [SourceElement, string, string, string, string])[] = [
      [
        mathOperatorElement("sin", [baseValueElement("string", "x")]),
        "1",
        "string",
        "single",
        "single",
      ],
      [
        mathOperatorElement("atan2", [floatElement("1"), baseValueElement("boolean", "true")]),
        "2",
        "boolean",
        "single",
        "single",
      ],
      [
        expressionElement("power", [], [floatElement("2"), baseValueElement("string", "3")]),
        "2",
        "string",
        "single",
        "single",
      ],
      [
        expressionElement("stats-operator", [attr("name", "mean")], [floatElement("2")]),
        "1",
        "float",
        "single",
        "multiple ordered",
      ],
    ];

    for (const [expression, operand, expressionBaseType, cardinality, accepted] of cases) {
      assert.deepStrictEqual(
        refusalsOf(settingItem("float", expression)),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: accepted,
              check: "operand",
              element: expression.local,
              expressionBaseType,
              expressionCardinality: cardinality,
              operand,
            },
            path: `${processing}/qti-set-outcome-value/${expression.local}`,
            rule: "expression-type",
          },
        ],
        expression.local,
      );
    }
  });

  it("[I-9a] type qti-math-operator by its name, signum, floor and ceil an integer and every other a float, and the other three kinds a float (expression-type, P20)", () => {
    const integerKinds = ["signum", "floor", "ceil"].map((name) =>
      mathOperatorElement(name, [floatElement("1.5")]),
    );
    const floatKinds = [
      mathOperatorElement("sin", [floatElement("1.5")]),
      mathOperatorElement("atan2", [floatElement("1"), floatElement("2")]),
      expressionElement("math-constant", [attr("name", "pi")]),
      expressionElement("power", [], [floatElement("2"), floatElement("3")]),
      expressionElement("stats-operator", [attr("name", "popSD")], [variableElement("VALUES")]),
    ];

    for (const expression of integerKinds) {
      assert.deepStrictEqual(refusalsOf(settingItem("integer", expression)), []);
      assert.deepStrictEqual(
        refusalsOf(settingItem("float", expression)),
        mismatch("integer", "float"),
      );
    }

    for (const expression of floatKinds) {
      assert.deepStrictEqual(refusalsOf(settingItem("float", expression)), []);
      assert.deepStrictEqual(
        refusalsOf(settingItem("integer", expression)),
        mismatch("float", "integer"),
      );
    }
  });

  it.effect(
    "[I-9a] accept a qti-math-operator whose operand count is not its name's and run it to NULL, never a refusal (9.22)",
    () =>
      Effect.gen(function* runsWrongArity() {
        for (const expression of [
          mathOperatorElement("sin", [floatElement("1"), floatElement("2")]),
          mathOperatorElement("atan2", [floatElement("1")]),
        ]) {
          const document = settingItem("float", expression);

          assert.deepStrictEqual(refusalsOf(document), []);

          const outcomes = yield* outcomesAfter(document);

          assert.deepStrictEqual(outcomes["OUT"], nullOf("float", "single"));
        }
      }),
  );
});
