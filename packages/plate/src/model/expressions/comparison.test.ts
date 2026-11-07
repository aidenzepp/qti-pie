import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceElement } from "#plate/document/source.ts";
import { runRules } from "#plate/engine/evaluate.ts";
import type { Expression, ExpressionType, Rule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
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
  responseDeclaration,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the `qti-response-processing` of an item {@link processingItem} builds.
 */
const processing = "qti-assessment-item/qti-response-processing";

/**
 * The path of the rule that sets `SAME` in an item {@link sameItem} builds.
 */
const setSame = `${processing}/qti-set-outcome-value`;

/**
 * The single integer type.
 */
const integerType: ExpressionType = { baseType: "integer", cardinality: "single" };

/**
 * The single float type.
 */
const floatType: ExpressionType = { baseType: "float", cardinality: "single" };

/**
 * Construct an item whose processing sets the boolean outcome `SAME` to one expression, beside a
 * single identifier response `RESPONSE`.
 *
 * @param expression The expression element.
 * @param declarations The declarations after `RESPONSE`'s and `SAME`'s, in document order.
 * @returns The item document.
 */
const sameItem = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  processingItem(
    [
      responseDeclaration("RESPONSE", "identifier"),
      outcomeDeclaration("SAME", "boolean"),
      ...declarations,
    ],
    [setOutcomeElement("SAME", expression)],
  );

/**
 * Construct a `qti-equal` of the integer 1 and the float 1.0.
 *
 * @param attributes Its attributes.
 * @returns The element.
 */
const equalOfOnes = (attributes: readonly SourceAttribute[]): SourceElement =>
  expressionElement("equal", attributes, [
    baseValueElement("integer", "1"),
    baseValueElement("float", "1.0"),
  ]);

/**
 * The two operands {@link equalOfOnes} reads into.
 */
const ones: readonly [Expression, Expression] = [
  { kind: "base-value", operands: [], value: integer(1n) },
  { kind: "base-value", operands: [], value: float(1) },
];

/**
 * Construct the rule that sets `SAME`.
 *
 * @param expression Its expression.
 * @returns The rule.
 */
const setsSame = (expression: Expression): Rule => ({
  expression,
  identifier: "SAME",
  kind: "set-outcome",
});

/**
 * Construct an outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`.
 * @param written Its default value, as written.
 * @returns The `qti-outcome-declaration`.
 */
const outcomeWithDefault = (identifier: string, baseType: string, written: string) =>
  outcomeDeclaration(identifier, baseType, "single", [
    el("qti-default-value", [], [el("qti-value", [], [text(written)])]),
  ]);

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
 * Build an item and run its processing with no response, as one attempt does.
 *
 * @param expression The expression `SAME` is set to.
 * @param declarations The declarations after `RESPONSE`'s and `SAME`'s.
 * @returns The value of `SAME` after the run.
 */
const sameAfter = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  Effect.gen(function* runSame() {
    const after = yield* processed(sameItem(expression, declarations), {});
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes["SAME"]),
    );
  });

/**
 * The base types `qti-match` takes, every one but `duration`, in the order `base-type` lists
 * them, as a refusal's `acceptsBaseTypes` spells them.
 */
const matchBaseTypes = "identifier boolean integer float string point pair directedPair file uri";

/**
 * The refusal of a duration operand of the `qti-match` {@link sameItem} sets `SAME` to.
 *
 * @param operand The operand's position, counted from 1.
 * @param acceptsCardinalities The cardinalities `qti-match` takes there, as the refusal spells
 *   them.
 * @returns The refusal, as `refusalsOf` reduces it.
 */
const durationOperand = (
  operand: string,
  acceptsCardinalities: string,
): ReturnType<typeof refusalsOf>[number] => ({
  detail: {
    acceptsBaseTypes: matchBaseTypes,
    acceptsCardinalities,
    check: "operand",
    element: "qti-match",
    expressionBaseType: "duration",
    expressionCardinality: "single",
    operand,
  },
  path: `${setSame}/qti-match`,
  rule: "expression-type",
});

/**
 * Construct a `qti-equal` of two floats in a tolerance mode.
 *
 * @param mode Its `tolerance-mode`, as written.
 * @param tolerance Its `tolerance`, as written.
 * @param x Its first operand, as written.
 * @param y Its second operand, as written.
 * @returns The element.
 */
const floatEqual = (mode: string, tolerance: string, x: string, y: string): SourceElement =>
  expressionElement(
    "equal",
    [attr("tolerance", tolerance), attr("tolerance-mode", mode)],
    [baseValueElement("float", x), baseValueElement("float", y)],
  );

describe("the comparison family's reader specs and kind rules", () => {
  it.effect("read a qti-match into its two operands, as before the registry", () =>
    Effect.gen(function* readsMatch() {
      const document = sameItem(
        expressionElement(
          "match",
          [],
          [
            variableElement("RESPONSE"),
            expressionElement("correct", [attr("identifier", "RESPONSE")]),
          ],
        ),
      );
      const built = yield* buildItem(document);

      assert.deepStrictEqual(refusalsOf(document), []);
      assert.deepStrictEqual(
        built.processing,
        Option.some([
          setsSame({
            kind: "match",
            operands: [
              {
                identifier: "RESPONSE",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              { identifier: "RESPONSE", kind: "correct", operands: [] },
            ],
          }),
        ]),
      );
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect("mark a qti-match with one operand at its path, and read nothing in it", () =>
    Effect.gen(function* marksShortMatch() {
      const built = yield* buildItem(
        sameItem(expressionElement("match", [], [expressionElement("sum")])),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-match", path: `${setSame}/qti-match`, shown: "mark" },
      ]);
    }),
  );

  it("[I-9a] refuse operand 2 of a qti-match of an integer and a string, which takes operand 1's base type and cardinality (expression-type, P23)", () => {
    assert.deepStrictEqual(
      refusalsOf(
        sameItem(
          expressionElement(
            "match",
            [],
            [baseValueElement("integer", "1"), baseValueElement("string", "1")],
          ),
        ),
      ),
      [
        {
          detail: {
            acceptsBaseTypes: "integer",
            acceptsCardinalities: "single",
            check: "operand",
            element: "qti-match",
            expressionBaseType: "string",
            expressionCardinality: "single",
            operand: "2",
          },
          path: `${setSame}/qti-match`,
          rule: "expression-type",
        },
      ],
    );
  });

  it("[I-9a] refuse operand 2 of a qti-match of a single and a multiple identifier response (expression-type, P23)", () => {
    assert.deepStrictEqual(
      refusalsOf(
        sameItem(
          expressionElement("match", [], [variableElement("RESPONSE"), variableElement("CHOICES")]),
          [responseDeclaration("CHOICES", "identifier", "multiple")],
        ),
      ),
      [
        {
          detail: {
            acceptsBaseTypes: "identifier",
            acceptsCardinalities: "single",
            check: "operand",
            element: "qti-match",
            expressionBaseType: "identifier",
            expressionCardinality: "multiple",
            operand: "2",
          },
          path: `${setSame}/qti-match`,
          rule: "expression-type",
        },
      ],
    );
  });

  it("[I-9a] refuse both operands of a qti-match of two durations, which it never takes (expression-type, P23)", () => {
    assert.deepStrictEqual(
      refusalsOf(
        sameItem(
          expressionElement(
            "match",
            [],
            [baseValueElement("duration", "PT1S"), baseValueElement("duration", "PT1S")],
          ),
        ),
      ),
      [durationOperand("1", "single multiple ordered record"), durationOperand("2", "single")],
    );
  });

  it.effect("read a qti-equal's four tolerance fields at their defaults when none is written", () =>
    Effect.gen(function* readsEqualDefaults() {
      const built = yield* buildItem(sameItem(equalOfOnes([])));

      assert.deepStrictEqual(
        built.processing,
        Option.some([
          setsSame({
            includeLowerBound: true,
            includeUpperBound: true,
            kind: "equal",
            operands: ones,
            tolerance: [],
            toleranceMode: "exact",
          }),
        ]),
      );
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect("read a qti-equal's four tolerance fields as written", () =>
    Effect.gen(function* readsEqualFields() {
      const built = yield* buildItem(
        sameItem(
          equalOfOnes([
            attr("include-lower-bound", "false"),
            attr("include-upper-bound", " 0 "),
            attr("tolerance", "\t0.5  INF "),
            attr("tolerance-mode", "exact"),
          ]),
        ),
      );

      assert.deepStrictEqual(
        built.processing,
        Option.some([
          setsSame({
            includeLowerBound: false,
            includeUpperBound: false,
            kind: "equal",
            operands: ones,
            tolerance: [
              { _tag: "literal", value: 0.5 },
              { _tag: "literal", value: Number.POSITIVE_INFINITY },
            ],
            toleranceMode: "exact",
          }),
        ]),
      );
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect(
    "build an exact qti-equal whose tolerance token names nothing, with no mark (G-CQ F5)",
    () =>
      Effect.gen(function* buildsUnnamedTolerance() {
        const built = yield* buildItem(sameItem(equalOfOnes([attr("tolerance", "NOTHING")])));

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            setsSame({
              includeLowerBound: true,
              includeUpperBound: true,
              kind: "equal",
              operands: ones,
              tolerance: [{ _tag: "ref", identifier: "NOTHING" }],
              toleranceMode: "exact",
            }),
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    '[I-9a] build an inline qti-equal with tolerance-mode="relative" or "absolute", with processing some and no tolerance-mode mark',
    () =>
      Effect.gen(function* buildsToleranceModes() {
        for (const mode of ["relative", "absolute"] as const) {
          const built = yield* buildItem(
            sameItem(equalOfOnes([attr("tolerance-mode", mode), attr("tolerance", "0.1")])),
          );

          assert.deepStrictEqual(
            built.processing,
            Option.some([
              setsSame({
                includeLowerBound: true,
                includeUpperBound: true,
                kind: "equal",
                operands: ones,
                tolerance: [{ _tag: "literal", value: 0.1 }],
                toleranceMode: mode,
              }),
            ]),
            mode,
          );
          assert.deepStrictEqual(built.unsupported, [], mode);
        }
      }),
  );

  it.effect(
    "[I-9a] mark only the unlanded kind among an absolute qti-equal's operands, and no tolerance mode",
    () =>
      Effect.gen(function* marksOperandOnly() {
        const built = yield* buildItem(
          sameItem(
            expressionElement(
              "equal",
              [attr("tolerance-mode", "absolute"), attr("tolerance", "0.1")],
              [
                expressionElement(
                  "duration-lt",
                  [],
                  [baseValueElement("duration", "PT1S"), baseValueElement("duration", "PT2S")],
                ),
                baseValueElement("float", "1.0"),
              ],
            ),
          ),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-duration-lt",
            path: `${setSame}/qti-equal/qti-duration-lt`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-9a] run a qti-equal in absolute and relative modes whose tolerance names a float and an integer outcome variable (9.11)",
    () =>
      Effect.gen(function* runsReferencedTolerance() {
        const declarations = [
          outcomeWithDefault("HALF", "float", "0.5"),
          outcomeWithDefault("ONE", "integer", "1"),
        ];
        const cases: readonly (readonly [SourceElement, boolean])[] = [
          [floatEqual("absolute", "ONE HALF", "10", "9"), true],
          [floatEqual("absolute", "ONE HALF", "10", "10.5"), true],
          [floatEqual("absolute", "ONE HALF", "10", "10.75"), false],
          [floatEqual("absolute", "HALF", "10", "9.25"), false],
          [floatEqual("relative", "5.0 5.0", "200", "210"), true],
          [floatEqual("relative", "ONE", "200", "202.5"), false],
          [floatEqual("relative", "ONE", "-200", "-202"), true],
        ];

        for (const [expression, expected] of cases) {
          assert.deepStrictEqual(refusalsOf(sameItem(expression, declarations)), []);

          const same = yield* sameAfter(expression, declarations);

          assert.deepStrictEqual(same, truth(expected));
          assertKindType(same, "equal", [floatType, floatType]);
        }
      }),
  );

  it.effect(
    "[I-9a] accept a qti-equal whose tolerance token names no variable or a string variable, and run it to NULL (9.11)",
    () =>
      Effect.gen(function* runsUnnamedToleranceToNull() {
        const declarations = [outcomeWithDefault("LABEL", "string", "0.5")];

        for (const token of ["NOTHING", "LABEL"]) {
          const expression = equalOfOnes([
            attr("tolerance", token),
            attr("tolerance-mode", "absolute"),
          ]);

          assert.deepStrictEqual(refusalsOf(sameItem(expression, declarations)), [], token);

          const same = yield* sameAfter(expression, declarations);

          assert.deepStrictEqual(same, nullOf("boolean", "single"), token);
          assertKindType(same, "equal", [integerType, floatType]);
        }
      }),
  );

  it.effect(
    "[I-5] [I-9a] run a qti-equal whose tolerance token names a template variable with the template value, with no mark",
    () =>
      Effect.gen(function* runsTemplateTolerance() {
        const document = sameItem(
          expressionElement(
            "equal",
            [attr("tolerance", "T"), attr("tolerance-mode", "absolute")],
            [baseValueElement("integer", "1"), baseValueElement("float", "1.5")],
          ),
          [
            el("qti-template-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "T"),
            ]),
          ],
        );
        const built = yield* buildItem(document);
        const rules = Option.getOrElse(built.processing, () => assert.fail("no processing"));
        const sameAt = (tolerance: number) =>
          Effect.fromResult(
            runRules(rules, built, {
              outcomes: outcomeDefaults(built),
              responses: {},
              templates: { T: float(tolerance) },
            }),
          ).pipe(Effect.map((after) => after.outcomes["SAME"]));

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(yield* sameAt(0.5), truth(true));
        assert.deepStrictEqual(yield* sameAt(0.25), truth(false));
      }),
  );

  it.effect("[I-9a] read qti-gt, qti-gte, qti-lt and qti-lte into their two operands", () =>
    Effect.gen(function* readsOrders() {
      for (const kind of ["gt", "gte", "lt", "lte"] as const) {
        const built = yield* buildItem(
          sameItem(
            expressionElement(
              kind,
              [],
              [baseValueElement("integer", "2"), baseValueElement("float", "1.5")],
            ),
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            setsSame({
              kind,
              operands: [
                { kind: "base-value", operands: [], value: integer(2n) },
                { kind: "base-value", operands: [], value: float(1.5) },
              ],
            }),
          ]),
          kind,
        );
        assert.deepStrictEqual(built.unsupported, [], kind);
      }
    }),
  );

  it.effect(
    "[I-9a] run qti-gt, qti-gte, qti-lt and qti-lte of the integer 2 and the float 1.5 to the boolean each gives",
    () =>
      Effect.gen(function* runsOrders() {
        const cases = [
          ["gt", true],
          ["gte", true],
          ["lt", false],
          ["lte", false],
        ] as const;

        for (const [kind, expected] of cases) {
          const same = yield* sameAfter(
            expressionElement(
              kind,
              [],
              [baseValueElement("integer", "2"), baseValueElement("float", "1.5")],
            ),
          );

          assert.deepStrictEqual(same, truth(expected), kind);
          assertKindType(same, kind, [integerType, floatType]);
        }
      }),
  );

  it("[I-9a] refuse a string operand of qti-gt, qti-gte, qti-lt and qti-lte, which take single integers or floats (expression-type, P23)", () => {
    for (const kind of ["gt", "gte", "lt", "lte"] as const) {
      assert.deepStrictEqual(
        refusalsOf(
          sameItem(
            expressionElement(
              kind,
              [],
              [baseValueElement("string", "2"), baseValueElement("integer", "1")],
            ),
          ),
        ),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "single",
              check: "operand",
              element: `qti-${kind}`,
              expressionBaseType: "string",
              expressionCardinality: "single",
              operand: "1",
            },
            path: `${setSame}/qti-${kind}`,
            rule: "expression-type",
          },
        ],
        kind,
      );
    }
  });
});
