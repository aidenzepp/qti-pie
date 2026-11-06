import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr } from "#plate/document/source.ts";
import type { SourceAttribute, SourceElement } from "#plate/document/source.ts";
import type { Expression, Rule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import {
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processingItem,
  responseDeclaration,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the rule that sets `SAME` in an item {@link processingItem} builds.
 */
const setSame = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

/**
 * Construct an item whose processing sets the boolean outcome `SAME` to one expression, beside a
 * single identifier response `RESPONSE`.
 *
 * @param expression The expression element.
 * @returns The item document.
 */
const sameItem = (expression: SourceElement) =>
  processingItem(
    [responseDeclaration("RESPONSE", "identifier"), outcomeDeclaration("SAME", "boolean")],
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

describe("the comparison family's reader specs", () => {
  it.effect("read a qti-match into its two operands, as before the registry", () =>
    Effect.gen(function* readsMatch() {
      const built = yield* buildItem(
        sameItem(
          expressionElement(
            "match",
            [],
            [
              variableElement("RESPONSE"),
              expressionElement("correct", [attr("identifier", "RESPONSE")]),
            ],
          ),
        ),
      );

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
    'mark an inline qti-equal with tolerance-mode="relative" or "absolute" at its path and run none',
    () =>
      Effect.gen(function* marksToleranceMode() {
        for (const mode of ["relative", "absolute"]) {
          const built = yield* buildItem(
            sameItem(equalOfOnes([attr("tolerance-mode", mode), attr("tolerance", "0.1")])),
          );

          assert.deepStrictEqual(built.processing, Option.none(), mode);
          assert.deepStrictEqual(
            built.unsupported,
            [
              {
                feature: `tolerance-mode="${mode}"`,
                path: `${setSame}/qti-equal`,
                shown: "mark",
              },
            ],
            mode,
          );
        }
      }),
  );

  it.effect(
    "mark a qti-equal's tolerance mode before an unlanded kind among its operands, in document order",
    () =>
      Effect.gen(function* marksModeThenOperand() {
        const built = yield* buildItem(
          sameItem(
            expressionElement(
              "equal",
              [attr("tolerance-mode", "absolute")],
              [
                expressionElement("sum", [], [baseValueElement("integer", "1")]),
                baseValueElement("float", "1.0"),
              ],
            ),
          ),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: 'tolerance-mode="absolute"', path: `${setSame}/qti-equal`, shown: "mark" },
          { feature: "qti-sum", path: `${setSame}/qti-equal/qti-sum`, shown: "mark" },
        ]);
      }),
  );
});
