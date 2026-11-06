import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
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
 * The path of the rule that sets `OUT` in an item {@link outItem} builds.
 */
const setOut = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

/**
 * Construct an item whose processing sets the outcome `OUT` to one expression, beside a single
 * identifier response `RESPONSE` and a single point response `POINT`. The outcome's type is not
 * the model's to judge in inline processing, so one declaration serves every kind.
 *
 * @param expression The expression element.
 * @returns The item document.
 */
const outItem = (expression: SourceElement) =>
  processingItem(
    [
      responseDeclaration("RESPONSE", "identifier"),
      responseDeclaration("POINT", "point"),
      outcomeDeclaration("OUT", "float"),
    ],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * Build an item whose processing sets `OUT` to one expression, and give the expression it reads.
 *
 * @param expression The expression element.
 * @returns The expression the rule tree holds, none when the processing is none.
 */
const readOut = (expression: SourceElement) =>
  buildItem(outItem(expression)).pipe(
    Effect.map((built) =>
      built.processing.pipe(
        Option.flatMap((tree) => Option.fromUndefinedOr(tree[0])),
        Option.flatMap((rule) =>
          rule.kind === "set-outcome" ? Option.some(rule.expression) : Option.none(),
        ),
      ),
    ),
  );

describe("the references family's reader specs", () => {
  it.effect(
    "read qti-variable, qti-correct, qti-map-response and qti-map-response-point by their identifier, trimmed, as before the registry",
    () =>
      Effect.gen(function* readsIdentifiers() {
        const read = {
          correct: yield* readOut(expressionElement("correct", [attr("identifier", " RESPONSE ")])),
          mapResponse: yield* readOut(
            expressionElement("map-response", [attr("identifier", "RESPONSE")]),
          ),
          mapResponsePoint: yield* readOut(
            expressionElement("map-response-point", [attr("identifier", "\tPOINT\n")]),
          ),
          variable: yield* readOut(variableElement(" RESPONSE")),
        };
        const expected: Readonly<Record<keyof typeof read, Option.Option<Expression>>> = {
          correct: Option.some({ identifier: "RESPONSE", kind: "correct", operands: [] }),
          mapResponse: Option.some({ identifier: "RESPONSE", kind: "map-response", operands: [] }),
          mapResponsePoint: Option.some({
            identifier: "POINT",
            kind: "map-response-point",
            operands: [],
          }),
          variable: Option.some({
            identifier: "RESPONSE",
            kind: "variable",
            operands: [],
            weightIdentifier: Option.none(),
          }),
        };

        assert.deepStrictEqual(read, expected);
      }),
  );

  it.effect("read a qti-variable's weight-identifier, trimmed", () =>
    Effect.gen(function* readsWeight() {
      const read = yield* readOut(
        expressionElement("variable", [
          attr("identifier", "RESPONSE"),
          attr("weight-identifier", " WEIGHT "),
        ]),
      );

      assert.deepStrictEqual(
        read,
        Option.some<Expression>({
          identifier: "RESPONSE",
          kind: "variable",
          operands: [],
          weightIdentifier: Option.some("WEIGHT"),
        }),
      );
    }),
  );

  it.effect("read a qti-base-value's text as its base type, as before the registry", () =>
    Effect.gen(function* readsBaseValues() {
      const read = {
        float: yield* readOut(baseValueElement("float", " 2.5 ")),
        integer: yield* readOut(baseValueElement("integer", "7")),
      };

      assert.deepStrictEqual(read, {
        float: Option.some<Expression>({ kind: "base-value", operands: [], value: float(2.5) }),
        integer: Option.some<Expression>({
          kind: "base-value",
          operands: [],
          value: integer(7n),
        }),
      });
    }),
  );

  it.effect(
    'mark a qti-base-value of base-type="duration" at its path, as before the registry',
    () =>
      Effect.gen(function* marksDuration() {
        const built = yield* buildItem(outItem(baseValueElement("duration", "PT1S")));

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: 'base-type="duration"', path: `${setOut}/qti-base-value`, shown: "mark" },
        ]);
      }),
  );

  it.effect("refuse a qti-base-value outside its lexical space as value-type at its path", () =>
    Effect.gen(function* refusesBaseValue() {
      const refusal = yield* Effect.flip(buildItem(outItem(baseValueElement("integer", "abc"))));

      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${setOut}/qti-base-value`,
      });
    }),
  );

  it.effect("mark a stub kind, qti-sum, at its path, and read nothing in it", () =>
    Effect.gen(function* marksStub() {
      const built = yield* buildItem(
        outItem(
          expressionElement(
            "sum",
            [],
            [
              expressionElement("product", [], [baseValueElement("integer", "1")]),
              baseValueElement("duration", "PT1S"),
            ],
          ),
        ),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-sum", path: `${setOut}/qti-sum`, shown: "mark" },
      ]);
    }),
  );

  it.effect("mark a qti-variable that holds an operand at its path, as no operand fits it", () =>
    Effect.gen(function* marksVariableWithOperand() {
      const built = yield* buildItem(
        outItem(
          expressionElement(
            "variable",
            [attr("identifier", "RESPONSE")],
            [baseValueElement("integer", "1")],
          ),
        ),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-variable", path: `${setOut}/qti-variable`, shown: "mark" },
      ]);
    }),
  );
});
