import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { runRules } from "#plate/engine/evaluate.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Item } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import { isNull, nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import {
  assertKindType,
  baseValueElement,
  evaluateIn,
  expressionElement,
  outcomeDeclaration,
  processingItem,
  responseDeclaration,
  scopeOf,
  setOutcomeElement,
} from "#plate/test/processing.ts";

/**
 * Construct a `qti-default-value` of the values written.
 *
 * @param written Each value as written, one `qti-value` each.
 * @returns The element.
 */
const defaultValue = (...written: readonly string[]): SourceElement =>
  el(
    "qti-default-value",
    [],
    written.map((each) => el("qti-value", [], [text(each)])),
  );

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifier = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * The declarations of the item {@link declared} builds: a single identifier response with a
 * default, a multiple identifier response with none, a single float outcome with a default and a
 * single integer outcome with none.
 */
const declarations: readonly SourceElement[] = [
  responseDeclaration("RESPONSE", "identifier", "single", [defaultValue("A")]),
  responseDeclaration("CHOICES", "identifier", "multiple"),
  outcomeDeclaration("SCORE", "float", "single", [defaultValue("2.5")]),
  outcomeDeclaration("COUNT", "integer"),
];

/**
 * Build the item of {@link declarations}, whose processing is empty.
 *
 * @returns The item.
 */
const declared = () => buildItem(processingItem(declarations, []));

/**
 * The variables of an attempt in which every variable of {@link declarations} holds a value other
 * than its default, so a value read from the declaration is told from one read from the attempt.
 */
const changed: Variables = {
  numAttempts: 3n,
  outcomes: { COUNT: integer(4n), SCORE: float(7) },
  responses: {
    CHOICES: {
      baseType: "identifier",
      cardinality: "multiple",
      values: [{ baseType: "identifier", value: "B" }],
    },
    RESPONSE: identifier("C"),
  },
};

/**
 * Construct the `qti-default` of a variable.
 *
 * @param named The variable's identifier.
 * @returns The expression.
 */
const defaultOf = (named: string): Expression => ({
  identifier: named,
  kind: "default",
  operands: [],
});

/**
 * Give the value of an expression through the engine's dispatcher, after checking that it
 * succeeded.
 *
 * @param expression The expression.
 * @param item The item whose declarations it reads.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const evaluated = (expression: Expression, item: Item, variables: Variables = changed): Value => {
  const result = evaluateIn(expression, scopeOf(item, variables));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  return Result.getOrThrow(result);
};

/**
 * Build an item document's model, check that its processing is some, and run it with no response,
 * as one attempt does: the outcomes start at their defaults and `numAttempts` is 1.
 *
 * @param declarationsOf The item's declarations.
 * @param rules The rules of its response processing.
 * @returns The outcomes after the run.
 */
const outcomesAfter = (declarationsOf: readonly SourceElement[], rules: readonly SourceElement[]) =>
  Effect.gen(function* runOutcomes() {
    const item = yield* buildItem(processingItem(declarationsOf, rules));
    assert.isTrue(Option.isSome(item.processing), "the processing runs");
    assert.deepStrictEqual(item.unsupported, []);

    const tree = Option.getOrThrow(item.processing);
    const before: Variables = { numAttempts: 1n, outcomes: outcomeDefaults(item), responses: {} };
    const after = yield* Effect.fromResult(runRules(tree, item, before));

    return after.outcomes;
  });

describe("the references family's evaluators of qti-default and qti-null", () => {
  it.effect(
    "[I-9a] qti-default gives a response's and an outcome's declared default, not the attempt's value",
    () =>
      Effect.gen(function* readsDeclaredDefaults() {
        const item = yield* declared();
        const response = evaluated(defaultOf("RESPONSE"), item);
        const outcome = evaluated(defaultOf("SCORE"), item);

        assert.deepStrictEqual(response, identifier("A"));
        assert.deepStrictEqual(outcome, float(2.5));
        assertKindType(response, "default", [], { baseType: "identifier", cardinality: "single" });
        assertKindType(outcome, "default", [], { baseType: "float", cardinality: "single" });
      }),
  );

  it.effect(
    "[I-9a] qti-default gives NULL of the declared type when no default is declared, a single integer outcome's starting 0 notwithstanding, and NULL of numAttempts' type for that built-in",
    () =>
      Effect.gen(function* readsAbsentDefaults() {
        const item = yield* declared();
        const cases: readonly (readonly [string, Value])[] = [
          ["CHOICES", nullOf("identifier", "multiple")],
          ["COUNT", nullOf("integer", "single")],
          ["numAttempts", nullOf("integer", "single")],
        ];

        for (const [named, expected] of cases) {
          const value = evaluated(defaultOf(named), item);

          assert.deepStrictEqual(value, expected, named);
          assertKindType(value, "default", [], {
            baseType: expected.baseType,
            cardinality: expected.cardinality,
          });
        }
      }),
  );

  it.effect(
    "[I-9a] qti-default of a built-in gives NULL of the built-in's own type whatever the attempt holds: completionStatus a single identifier, numAttempts a single integer",
    () =>
      Effect.gen(function* readsBuiltInDefaults() {
        const item = yield* declared();
        const holding: Variables = {
          ...changed,
          outcomes: { ...changed.outcomes, completionStatus: identifier("completed") },
        };
        const holdingNothing: Variables = { outcomes: {}, responses: {} };
        const cases: readonly (readonly [string, Value])[] = [
          ["completionStatus", nullOf("identifier", "single")],
          ["numAttempts", nullOf("integer", "single")],
        ];

        for (const [named, expected] of cases) {
          for (const variables of [holding, holdingNothing]) {
            const value = evaluated(defaultOf(named), item, variables);

            assert.deepStrictEqual(value, expected, named);
            assertKindType(value, "default", [], {
              baseType: expected.baseType,
              cardinality: expected.cardinality,
            });
          }
        }
      }),
  );

  it.effect(
    "[I-9a] qti-default of an identifier the item declares no variable by fails UnknownIdentifierError of the item",
    () =>
      Effect.gen(function* failsUndeclared() {
        const item = yield* declared();
        const result = evaluateIn(defaultOf("NOPE"), scopeOf(item, changed));

        assert.deepStrictEqual(
          Option.map(Result.getFailure(result), (failure) =>
            failure._tag === "UnknownIdentifierError"
              ? [failure._tag, failure.holder, failure.identifier, failure.role]
              : [failure._tag],
          ),
          Option.some(["UnknownIdentifierError", "item", "NOPE", "variable"]),
        );
      }),
  );

  it.effect("[I-9a] qti-null gives NULL, which holds the any type its rule gives", () =>
    Effect.gen(function* givesNull() {
      const item = yield* declared();
      const value = evaluated({ kind: "null", operands: [] }, item);

      assert.isTrue(isNull(value), "qti-null gave NULL");
      assertKindType(value, "null", []);
    }),
  );

  it.effect(
    "[I-9a] an item whose response processing sets an outcome from qti-null builds with processing some and stores that outcome's typed NULL (spec §4.5)",
    () =>
      Effect.gen(function* storesTypedNull() {
        const outcomes = yield* outcomesAfter(
          [
            outcomeDeclaration("SCORE", "float", "single", [defaultValue("2.5")]),
            outcomeDeclaration("LABELS", "identifier", "multiple", [defaultValue("A", "B")]),
          ],
          [
            setOutcomeElement("SCORE", expressionElement("null")),
            setOutcomeElement("LABELS", expressionElement("null")),
          ],
        );

        assert.deepStrictEqual(outcomes["SCORE"], nullOf("float", "single"));
        assert.deepStrictEqual(outcomes["LABELS"], nullOf("identifier", "multiple"));
      }),
  );

  it.effect(
    "[I-9a] an item whose response processing sets SCORE and then resets it with qti-default stores the declared default",
    () =>
      Effect.gen(function* resetsToDefault() {
        const outcomes = yield* outcomesAfter(
          [outcomeDeclaration("SCORE", "float", "single", [defaultValue("2.5")])],
          [
            setOutcomeElement("SCORE", baseValueElement("float", "9")),
            setOutcomeElement("SCORE", expressionElement("default", [attr("identifier", "SCORE")])),
          ],
        );

        assert.deepStrictEqual(outcomes["SCORE"], float(2.5));
      }),
  );
});
