import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { runRules } from "#plate/engine/evaluate.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { integer } from "#plate/test/fixtures.ts";
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
 * The path of the rule that sets `PASSED` in an item {@link passedItem} builds.
 */
const setPassed = `${processing}/qti-set-outcome-value`;

/**
 * Construct an item whose processing sets the boolean outcome `PASSED` to one expression.
 *
 * @param expression The expression element.
 * @param declarations The declarations beside `PASSED`'s, in document order after it.
 * @returns The item document.
 */
const passedItem = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  processingItem(
    [outcomeDeclaration("PASSED", "boolean"), ...declarations],
    [setOutcomeElement("PASSED", expression)],
  );

/**
 * Construct a `qti-base-value` of a boolean.
 *
 * @param value The boolean.
 * @returns The element.
 */
const truthElement = (value: boolean): SourceElement =>
  baseValueElement("boolean", value ? "true" : "false");

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
 * Construct the `qti-base-value` expression of a boolean, as the reader reads
 * {@link truthElement}.
 *
 * @param value The boolean.
 * @returns The expression.
 */
const truthExpression = (value: boolean): Expression => ({
  kind: "base-value",
  operands: [],
  value: truth(value),
});

/**
 * Construct a `qti-any-n` with its bounds as written.
 *
 * @param min Its `min`, as written.
 * @param max Its `max`, as written.
 * @param operands Its operands.
 * @returns The element.
 */
const anyNElement = (min: string, max: string, operands: readonly SourceElement[]) =>
  expressionElement("any-n", [attr("max", max), attr("min", min)], operands);

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
 * Build an item and run its processing with no response, as one attempt does.
 *
 * @param expression The expression `PASSED` is set to.
 * @param declarations The declarations beside `PASSED`'s.
 * @returns The value of `PASSED` after the run.
 */
const passedAfter = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  Effect.gen(function* runPassed() {
    const after = yield* processed(passedItem(expression, declarations), {});
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes["PASSED"]),
    );
  });

describe("the logic family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds a qti-and tree, with processing some",
    () =>
      Effect.gen(function* buildsAndTree() {
        const built = yield* buildItem(
          passedItem(
            expressionElement(
              "and",
              [],
              [
                truthElement(true),
                expressionElement(
                  "or",
                  [],
                  [truthElement(false), expressionElement("not", [], [truthElement(false)])],
                ),
                anyNElement(" 1 ", "TWO", [truthElement(true)]),
              ],
            ),
            [integerOutcome("TWO", "2")],
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                kind: "and",
                operands: [
                  truthExpression(true),
                  {
                    kind: "or",
                    operands: [
                      truthExpression(false),
                      { kind: "not", operands: [truthExpression(false)] },
                    ],
                  },
                  {
                    kind: "any-n",
                    max: { _tag: "ref", identifier: "TWO" },
                    min: { _tag: "literal", value: 1n },
                    operands: [truthExpression(true)],
                  },
                ],
              },
              identifier: "PASSED",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect("[I-9a] run that qti-and tree to true, the type its rule gives", () =>
    Effect.gen(function* runsAndTree() {
      const passed = yield* passedAfter(
        expressionElement(
          "and",
          [],
          [
            truthElement(true),
            expressionElement(
              "or",
              [],
              [truthElement(false), expressionElement("not", [], [truthElement(false)])],
            ),
            anyNElement("1", "TWO", [truthElement(true)]),
          ],
        ),
        [integerOutcome("TWO", "2")],
      );

      assert.deepStrictEqual(passed, truth(true));
      assertKindType(passed, "and", [
        { baseType: "boolean", cardinality: "single" },
        { baseType: "boolean", cardinality: "single" },
        { baseType: "boolean", cardinality: "single" },
      ]);
    }),
  );

  it("[I-9a] refuse each operand of qti-and, qti-or, qti-not and qti-any-n that is not a single boolean (expression-type, P23)", () => {
    const integerOne = baseValueElement("integer", "1");
    const cases: readonly (readonly [SourceElement, string, string])[] = [
      [expressionElement("and", [], [truthElement(true), integerOne]), "2", "integer"],
      [expressionElement("or", [], [truthElement(true), integerOne]), "2", "integer"],
      [expressionElement("not", [], [baseValueElement("string", "true")]), "1", "string"],
      [anyNElement("1", "2", [truthElement(true), integerOne]), "2", "integer"],
    ];

    for (const [expression, operand, expressionBaseType] of cases) {
      assert.deepStrictEqual(
        refusalsOf(passedItem(expression)),
        [
          {
            detail: {
              acceptsBaseTypes: "boolean",
              acceptsCardinalities: "single",
              check: "operand",
              element: expression.local,
              expressionBaseType,
              expressionCardinality: "single",
              operand,
            },
            path: `${setPassed}/${expression.local}`,
            rule: "expression-type",
          },
        ],
        expression.local,
      );
    }
  });

  it("[I-9a] refuse a qti-any-n whose min names a string outcome variable (expression-type, P24)", () => {
    const refusals = refusalsOf(
      passedItem(anyNElement("LABEL", "4", [truthElement(true)]), [
        outcomeDeclaration("LABEL", "string"),
      ]),
    );

    assert.deepStrictEqual(refusals, [
      {
        detail: {
          attribute: "min",
          check: "reference",
          element: "qti-any-n",
          expectedBaseType: "integer",
          identifier: "LABEL",
        },
        path: `${setPassed}/qti-any-n`,
        rule: "expression-type",
      },
    ]);
  });

  it.effect(
    "[I-9a] run a qti-any-n whose min names an integer outcome variable with that variable's value",
    () =>
      Effect.gen(function* runsReferencedMin() {
        const operands = [truthElement(true), truthElement(true), truthElement(false)];
        const expression = anyNElement("MIN", "3", operands);

        assert.deepStrictEqual(
          refusalsOf(passedItem(expression, [integerOutcome("MIN", "2")])),
          [],
        );

        const atTwo = yield* passedAfter(expression, [integerOutcome("MIN", "2")]);
        const atThree = yield* passedAfter(expression, [integerOutcome("MIN", "3")]);

        assert.deepStrictEqual(atTwo, truth(true));
        assert.deepStrictEqual(atThree, truth(false));
        for (const value of [atTwo, atThree]) {
          assertKindType(
            value,
            "any-n",
            operands.map(() => ({ baseType: "boolean", cardinality: "single" })),
          );
        }
      }),
  );

  it.effect(
    "[I-5] [I-9a] run a qti-any-n whose min names a template variable with the template value, with no mark",
    () =>
      Effect.gen(function* runsTemplateMin() {
        const document = passedItem(anyNElement("T", "4", [truthElement(true)]), [
          el("qti-template-declaration", [
            attr("base-type", "integer"),
            attr("cardinality", "single"),
            attr("identifier", "T"),
          ]),
        ]);
        const built = yield* buildItem(document);
        const rules = Option.getOrElse(built.processing, () => assert.fail("no processing"));
        const passedAt = (min: bigint) =>
          Effect.fromResult(
            runRules(rules, built, {
              outcomes: outcomeDefaults(built),
              responses: {},
              templates: { T: integer(min) },
            }),
          ).pipe(Effect.map((after) => after.outcomes["PASSED"]));

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(yield* passedAt(1n), truth(true));
        assert.deepStrictEqual(yield* passedAt(2n), truth(false));
      }),
  );
});
