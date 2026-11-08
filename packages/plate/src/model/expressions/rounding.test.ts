import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { checkStructure } from "#plate/validate/structure.ts";
import { tables } from "#plate/validate/tables.ts";
import {
  assertKindType,
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  refusalsOf,
  setOutcomeElement,
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
 * Construct a `qti-base-value` of a float, as written.
 *
 * @param written The float, as written.
 * @returns The element.
 */
const floatElement = (written: string): SourceElement => baseValueElement("float", written);

/**
 * Construct a `qti-round-to`.
 *
 * @param mode Its `rounding-mode`, as written.
 * @param figures Its `figures`, as written.
 * @param operand Its operand.
 * @returns The element.
 */
const roundToElement = (mode: string, figures: string, operand: SourceElement) =>
  expressionElement("round-to", [attr("figures", figures), attr("rounding-mode", mode)], [operand]);

/**
 * Construct a `qti-equal-rounded`.
 *
 * @param attributes Its attributes: `figures`, and `rounding-mode` where given.
 * @param left Its first operand.
 * @param right Its second operand.
 * @returns The element.
 */
const equalRoundedElement = (
  attributes: readonly ReturnType<typeof attr>[],
  left: SourceElement,
  right: SourceElement,
) => expressionElement("equal-rounded", attributes, [left, right]);

/**
 * Construct an integer outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param written Its default value, as written.
 * @returns The `qti-outcome-declaration`.
 */
const integerOutcome = (identifier: string, written: string): SourceElement =>
  outcomeDeclaration(identifier, "integer", "single", [
    el("qti-default-value", [], [el("qti-value", [], [text(written)])]),
  ]);

/**
 * Construct the `qti-base-value` expression of a float, as the reader reads
 * {@link floatElement}.
 *
 * @param value The float.
 * @returns The expression.
 */
const floatExpression = (value: number): Expression => ({
  kind: "base-value",
  operands: [],
  value: { baseType: "float", cardinality: "single", values: [{ baseType: "float", value }] },
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
 * The single boolean value of a truth.
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
 * The single float type.
 */
const floatType = { baseType: "float", cardinality: "single" } as const;

describe("the rounding family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds qti-round, qti-truncate, qti-round-to and qti-equal-rounded, with processing some",
    () =>
      Effect.gen(function* buildsRounding() {
        const built = yield* buildItem(
          processingItem(
            [
              outcomeDeclaration("ROUNDED", "integer"),
              outcomeDeclaration("CUT", "integer"),
              outcomeDeclaration("TO", "float"),
              outcomeDeclaration("SAME", "boolean"),
              integerOutcome("FIGURES", "2"),
            ],
            [
              setOutcomeElement("ROUNDED", expressionElement("round", [], [floatElement("6.5")])),
              setOutcomeElement("CUT", expressionElement("truncate", [], [floatElement("-6.8")])),
              setOutcomeElement(
                "TO",
                roundToElement("decimalPlaces", "FIGURES", floatElement("2.675")),
              ),
              setOutcomeElement(
                "SAME",
                equalRoundedElement(
                  [attr("figures", " 3 ")],
                  floatElement("3.175"),
                  floatElement("3.183"),
                ),
              ),
            ],
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: { kind: "round", operands: [floatExpression(6.5)] },
              identifier: "ROUNDED",
              kind: "set-outcome",
            },
            {
              expression: { kind: "truncate", operands: [floatExpression(-6.8)] },
              identifier: "CUT",
              kind: "set-outcome",
            },
            {
              expression: {
                figures: { _tag: "ref", identifier: "FIGURES" },
                kind: "round-to",
                operands: [floatExpression(2.675)],
                roundingMode: "decimalPlaces",
              },
              identifier: "TO",
              kind: "set-outcome",
            },
            {
              expression: {
                figures: { _tag: "literal", value: 3n },
                kind: "equal-rounded",
                operands: [floatExpression(3.175), floatExpression(3.183)],
                roundingMode: "significantFigures",
              },
              identifier: "SAME",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] run the information model's four qti-equal-rounded examples in an item's processing (info.txt:25131)",
    () =>
      Effect.gen(function* runsExamples() {
        const cases: readonly (readonly [string, string, string, string, boolean])[] = [
          ["significantFigures", "3", "3.175", "3.183", true],
          ["significantFigures", "3", "3.175", "3.1749", false],
          ["decimalPlaces", "2", "1.68572", "1.69", true],
          ["decimalPlaces", "2", "1.68572", "1.68432", false],
        ];

        for (const [mode, figures, left, right, expected] of cases) {
          const out = yield* outAfter(
            "boolean",
            equalRoundedElement(
              [attr("figures", figures), attr("rounding-mode", mode)],
              floatElement(left),
              floatElement(right),
            ),
          );

          assert.deepStrictEqual(out, truth(expected), `${left} and ${right} at ${figures}`);
          assertKindType(out, "equal-rounded", [floatType, floatType]);
        }
      }),
  );

  it.effect(
    "[I-9a] run a qti-round-to whose figures names an integer outcome variable with that variable's value",
    () =>
      Effect.gen(function* runsReferencedFigures() {
        const expression = roundToElement("decimalPlaces", "FIGURES", floatElement("2.675"));
        const declarations = [integerOutcome("FIGURES", "2")];

        assert.deepStrictEqual(refusalsOf(outItem("float", expression, declarations)), []);

        const out = yield* outAfter("float", expression, declarations);

        assert.deepStrictEqual(out, {
          baseType: "float",
          cardinality: "single",
          values: [{ baseType: "float", value: 2.68 }],
        });
        assertKindType(out, "round-to", [floatType]);
      }),
  );

  it.effect(
    "[I-9a] set an integer outcome from qti-round of INF to the integer NULL, not a failure (9.10)",
    () =>
      Effect.gen(function* setsRoundedInfinity() {
        const expression = expressionElement("round", [], [floatElement("INF")]);

        assert.deepStrictEqual(refusalsOf(outItem("integer", expression)), []);

        const out = yield* outAfter("integer", expression);

        assert.deepStrictEqual(out, nullOf("integer", "single"));
        assertKindType(out, "round", [floatType]);
      }),
  );

  it("[I-9a] refuse each operand of the rounding kinds that is not a single number (expression-type, P23)", () => {
    const written = baseValueElement("string", "6.5");
    const duration = baseValueElement("duration", "1");
    const cases: readonly (readonly [string, SourceElement, string, string])[] = [
      ["integer", expressionElement("round", [], [written]), "1", "string"],
      ["integer", expressionElement("truncate", [], [duration]), "1", "duration"],
      ["float", roundToElement("decimalPlaces", "2", written), "1", "string"],
      [
        "boolean",
        equalRoundedElement([attr("figures", "2")], floatElement("1"), written),
        "2",
        "string",
      ],
    ];

    for (const [outType, expression, operand, expressionBaseType] of cases) {
      assert.deepStrictEqual(
        refusalsOf(outItem(outType, expression)),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "single",
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

  it("[I-9a] refuse a figures that names a float outcome variable (expression-type, P24) or no variable (undeclared-variable, P8)", () => {
    const named = (figures: string) => roundToElement("decimalPlaces", figures, floatElement("1"));

    assert.deepStrictEqual(
      refusalsOf(outItem("float", named("SCORE"), [outcomeDeclaration("SCORE", "float")])),
      [
        {
          detail: {
            attribute: "figures",
            check: "reference",
            element: "qti-round-to",
            expectedBaseType: "integer",
            identifier: "SCORE",
          },
          path: `${setOut}/qti-round-to`,
          rule: "expression-type",
        },
      ],
    );
    assert.deepStrictEqual(refusalsOf(outItem("float", named("NOPE"))), [
      {
        detail: {
          attribute: "figures",
          element: "qti-round-to",
          expected: "variable",
          identifier: "NOPE",
        },
        path: `${setOut}/qti-round-to`,
        rule: "undeclared-variable",
      },
    ]);
    assert.deepStrictEqual(
      refusalsOf(
        outItem(
          "boolean",
          equalRoundedElement([attr("figures", "SCORE")], floatElement("1"), floatElement("1")),
          [outcomeDeclaration("SCORE", "float")],
        ),
      ),
      [
        {
          detail: {
            attribute: "figures",
            check: "reference",
            element: "qti-equal-rounded",
            expectedBaseType: "integer",
            identifier: "SCORE",
          },
          path: `${setOut}/qti-equal-rounded`,
          rule: "expression-type",
        },
      ],
    );
  });

  it.effect(
    "[I-9a] read figures at 2^63 - 1 exactly and run it, refuse 2^63 (count-range, reading 46), and refuse -2^63 under decimalPlaces (attribute-type, info.txt:39732), which the model still runs to NULL",
    () =>
      Effect.gen(function* readsFiguresRange() {
        const greatest = roundToElement(
          "decimalPlaces",
          "9223372036854775807",
          floatElement("2.675"),
        );
        const least = roundToElement(
          "decimalPlaces",
          "-9223372036854775808",
          floatElement("2.675"),
        );
        const beyond = outItem(
          "float",
          roundToElement("decimalPlaces", "9223372036854775808", floatElement("2.675")),
        );

        assert.deepStrictEqual(checkStructure(outItem("float", greatest), tables), []);
        assert.deepStrictEqual(
          checkStructure(outItem("float", least), tables).map((refusal) => refusal.rule),
          ["attribute-type"],
        );
        assert.deepStrictEqual(
          checkStructure(beyond, tables).map((refusal) => refusal.rule),
          ["count-range"],
        );

        const built = yield* buildItem(outItem("float", greatest));
        const read = Option.getOrElse(built.processing, () => []).flatMap((rule) =>
          rule.kind === "set-outcome" && rule.expression.kind === "round-to"
            ? [rule.expression.figures]
            : [],
        );
        assert.deepStrictEqual(read, [{ _tag: "literal", value: 9_223_372_036_854_775_807n }]);
        assert.deepStrictEqual(yield* outAfter("float", greatest), {
          baseType: "float",
          cardinality: "single",
          values: [{ baseType: "float", value: 2.675 }],
        });
        assert.deepStrictEqual(yield* outAfter("float", least), nullOf("float", "single"));
      }),
  );
});
