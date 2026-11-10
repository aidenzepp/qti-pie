import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { evaluateExpression, runRules } from "#plate/engine/evaluate.ts";
import type { Declarations, Variables } from "#plate/engine/evaluate.ts";
import { drawStream } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import type { ScopeItem, TestScope } from "#plate/engine/scope.ts";
import type { Expression, LiteralOrRef } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Item, OutcomeDeclaration, ResponseDeclaration } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import { isNull, nullOf } from "#plate/model/values.ts";
import type { ModelledBaseType, RecordValue, Value } from "#plate/model/values.ts";
import { score } from "#plate/score.ts";
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
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

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
const declared = () => Effect.fromResult(buildItem(processingItem(declarations, [])));

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
    const item = yield* Effect.fromResult(buildItem(processingItem(declarationsOf, rules)));
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

/**
 * Construct a template declaration.
 *
 * @param named Its `identifier`.
 * @param baseType Its `base-type`.
 * @param children Its children, such as a `qti-default-value`.
 * @returns The `qti-template-declaration`, single cardinality.
 */
const templateDeclaration = (
  named: string,
  baseType: string,
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-template-declaration",
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", named)],
    children,
  );

/**
 * Build the item of {@link declarations} with a single identifier response `KEYED` whose correct
 * response is `A`, a single integer template variable `T` whose default is 6 and a single float
 * template variable `TN` with no default.
 *
 * @returns The item.
 */
const templated = () =>
  Effect.fromResult(
    buildItem(
      processingItem(
        [
          ...declarations,
          responseDeclaration("KEYED", "identifier", "single", [
            el("qti-correct-response", [], [el("qti-value", [], [text("A")])]),
          ]),
          templateDeclaration("T", "integer", [defaultValue("6")]),
          templateDeclaration("TN", "float"),
        ],
        [],
      ),
    ),
  );

/**
 * Construct the `qti-correct` of a response.
 *
 * @param named The response's identifier.
 * @returns The expression.
 */
const correctOf = (named: string): Expression => ({
  identifier: named,
  kind: "correct",
  operands: [],
});

describe("the references family's evaluators over template values and the template-set overrides", () => {
  it.effect("[I-5] qti-variable reads a template value", () =>
    Effect.gen(function* readsTemplateValue() {
      const item = yield* templated();

      assert.deepStrictEqual(
        evaluated(
          { identifier: "T", kind: "variable", operands: [], weightIdentifier: Option.none() },
          item,
          {
            ...changed,
            templates: { T: integer(9n) },
          },
        ),
        integer(9n),
      );
    }),
  );

  it.effect(
    "[I-5] qti-correct reads Variables.correct when it holds the response, the declaration's correct response otherwise",
    () =>
      Effect.gen(function* readsCorrectOverride() {
        const item = yield* templated();
        const overridden: Variables = {
          ...changed,
          correct: { KEYED: identifier("B"), RESPONSE: identifier("C") },
        };
        const cases: readonly (readonly [string, Variables, Value])[] = [
          ["KEYED, overridden", overridden, identifier("B")],
          ["RESPONSE, overridden", overridden, identifier("C")],
          ["KEYED, no override map", changed, identifier("A")],
          ["KEYED, an override map without it", { ...changed, correct: {} }, identifier("A")],
          ["RESPONSE, no override map", changed, nullOf("identifier", "single")],
        ];

        for (const [name, variables, expected] of cases) {
          const named = name.split(",")[0] ?? name;
          const value = evaluated(correctOf(named), item, variables);

          assert.deepStrictEqual(value, expected, name);
          assertKindType(value, "correct", [], { baseType: "identifier", cardinality: "single" });
        }
      }),
  );

  it.effect(
    "[I-5] qti-correct of a response the item does not declare fails UnknownIdentifierError of the item, whatever Variables.correct holds",
    () =>
      Effect.gen(function* failsUndeclaredCorrect() {
        const item = yield* templated();
        const result = evaluateIn(
          correctOf("NOPE"),
          scopeOf(item, { ...changed, correct: { NOPE: identifier("A") } }),
        );

        assert.deepStrictEqual(
          Option.map(Result.getFailure(result), (failure) =>
            failure._tag === "UnknownIdentifierError"
              ? [failure._tag, failure.holder, failure.identifier, failure.role]
              : [failure._tag],
          ),
          Option.some(["UnknownIdentifierError", "item", "NOPE", "response"]),
        );
      }),
  );

  it.effect(
    "[I-5] qti-default reads Variables.defaults when it holds the variable, the declaration's default otherwise",
    () =>
      Effect.gen(function* readsDefaultOverride() {
        const item = yield* templated();
        const overridden: Variables = {
          ...changed,
          defaults: { COUNT: integer(8n), RESPONSE: identifier("D"), SCORE: float(9) },
        };
        const cases: readonly (readonly [string, Variables, Value])[] = [
          ["SCORE", overridden, float(9)],
          ["COUNT", overridden, integer(8n)],
          ["RESPONSE", overridden, identifier("D")],
          ["SCORE", changed, float(2.5)],
          ["SCORE", { ...changed, defaults: {} }, float(2.5)],
          ["COUNT", changed, nullOf("integer", "single")],
        ];

        for (const [named, variables, expected] of cases) {
          assert.deepStrictEqual(evaluated(defaultOf(named), item, variables), expected, named);
        }
      }),
  );

  it.effect(
    "[I-5] qti-default of a template variable gives its declared default, not its template value, and NULL of its type when it declares none",
    () =>
      Effect.gen(function* readsTemplateDefault() {
        const item = yield* templated();
        const holding: Variables = {
          ...changed,
          templates: { T: integer(9n), TN: float(1.5) },
        };
        const cases: readonly (readonly [string, Value])[] = [
          ["T", integer(6n)],
          ["TN", nullOf("float", "single")],
        ];

        for (const [named, expected] of cases) {
          const value = evaluated(defaultOf(named), item, holding);

          assert.deepStrictEqual(value, expected, named);
          assertKindType(value, "default", [], {
            baseType: expected.baseType,
            cardinality: expected.cardinality,
          });
        }
      }),
  );
});

/**
 * A stream that counts its draws: the stream of a key, and how many draws have been taken from it.
 */
interface Counted {
  readonly count: () => number;
  readonly draw: Draw;
}

/**
 * Wrap the stream of a key so its draws are counted.
 *
 * @param key The stream's key.
 * @returns The counted stream.
 */
const counted = (key: string): Counted => {
  const stream = drawStream("", key);
  let taken = 0;

  return {
    count: () => taken,
    draw: () => {
      taken += 1;

      return stream();
    },
  };
};

/**
 * A literal attribute value.
 *
 * @param value The literal.
 * @returns The attribute's value.
 */
const literal = <A>(value: A): LiteralOrRef<A> => ({
  _tag: "literal",
  value,
});

/**
 * A reference attribute value.
 *
 * @param named The variable it names.
 * @returns The attribute's value.
 */
const reference = (named: string): LiteralOrRef<never> => ({
  _tag: "ref",
  identifier: named,
});

/**
 * Construct a `qti-random-integer` of literal bounds and step.
 *
 * @param min The least value.
 * @param max The greatest value.
 * @param step The step between values.
 * @returns The expression.
 */
const randomInteger = (min: bigint, max: bigint, step = 1n): Expression => ({
  kind: "random-integer",
  max: literal(max),
  min: literal(min),
  operands: [],
  step: literal(step),
});

/**
 * Construct a `qti-random-float` of literal bounds.
 *
 * @param min The least value.
 * @param max The greatest value.
 * @returns The expression.
 */
const randomFloat = (min: number, max: number): Expression => ({
  kind: "random-float",
  max: literal(max),
  min: literal(min),
  operands: [],
});

/**
 * Give the value of an expression under a stream, after checking that it succeeded.
 *
 * @param expression The expression.
 * @param item The item.
 * @param variables The variables of the attempt.
 * @param draw The stream.
 * @returns Its value.
 */
const drawn = (expression: Expression, item: Item, variables: Variables, draw: Draw): Value => {
  const result = evaluateIn(expression, scopeOf(item, variables, draw));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  return Result.getOrThrow(result);
};

/**
 * The number of keys each range test draws under.
 */
const keys = 1000;

/**
 * Give the value of an expression under each of {@link keys} streams, `k0` to `k999`.
 *
 * @param expression The expression.
 * @param item The item.
 * @param variables The variables of the attempt.
 * @returns The values, one per key.
 */
const overKeys = (expression: Expression, item: Item, variables: Variables): readonly Value[] =>
  Array.from({ length: keys }, (_, index) =>
    drawn(expression, item, variables, drawStream("", `k${String(index)}`)),
  );

/**
 * Give the integer a single integer value holds, after checking that it holds one.
 *
 * @param value The value.
 * @returns The integer.
 */
const onlyInteger = (value: Value): bigint => {
  const [single, ...rest] = value.values;
  assert.isTrue(
    single?.baseType === "integer" && rest.length === 0,
    "the value is a single integer",
  );

  return single?.baseType === "integer" ? single.value : 0n;
};

/**
 * Give the float a single float value holds, after checking that it holds one.
 *
 * @param value The value.
 * @returns The float.
 */
const onlyFloat = (value: Value): number => {
  const [single, ...rest] = value.values;
  assert.isTrue(single?.baseType === "float" && rest.length === 0, "the value is a single float");

  return single?.baseType === "float" ? single.value : Number.NaN;
};

/**
 * The variables of an attempt in which `COUNT` and `SCORE` hold NULL.
 */
const nulled: Variables = {
  outcomes: { COUNT: nullOf("integer", "single"), SCORE: nullOf("float", "single") },
  responses: {},
};

describe("the references family's evaluators of qti-random-integer and qti-random-float", () => {
  it.effect(
    '[I-9a] qti-random-integer with min="2" max="11" step="3" gives only 2, 5, 8 and 11 over 1,000 keys, each at least once',
    () =>
      Effect.gen(function* drawsSteppedIntegers() {
        const item = yield* declared();
        const values = overKeys(randomInteger(2n, 11n, 3n), item, changed);
        const seen = new Set(values.map((value) => onlyInteger(value)));

        assert.deepStrictEqual(
          [...seen].toSorted((left, right) => Number(left) - Number(right)),
          [2n, 5n, 8n, 11n],
        );
        for (const value of values) {
          assertKindType(value, "random-integer", []);
        }
      }),
  );

  it.effect(
    '[I-9a] qti-random-integer with min="2" max="11" step="3" gives min + step × j for the stream\'s j: 8',
    () =>
      Effect.gen(function* pinsSteppedInteger() {
        const item = yield* declared();
        // `drawStream("pin", "random-integer")`'s first draw is 0x967db1fe. `drawBelow` among the 4
        // values the range holds keeps its low 2 bits, j = 2, so the value is 2 + 3 × 2 = 8. The
        // reversed mapping, max − step × j, gives 5.
        const value = drawn(
          randomInteger(2n, 11n, 3n),
          item,
          changed,
          drawStream("pin", "random-integer"),
        );

        assert.deepStrictEqual(value, integer(8n));
      }),
  );

  it.effect(
    "[I-9a] qti-random-integer gives NULL and draws nothing when max is below min, step is 0 or below, a bound passes 1,000,000 bits, or an attribute names a variable holding NULL (G-R1 draft 148; G-R2, pending)",
    () =>
      Effect.gen(function* givesNullWithoutDrawing() {
        const item = yield* declared();
        const huge = 2n ** 1_000_000n;
        const cases: readonly (readonly [string, Expression, Variables])[] = [
          ["max below min", randomInteger(5n, 4n), changed],
          ["step 0", randomInteger(0n, 10n, 0n), changed],
          ["step -1", randomInteger(0n, 10n, -1n), changed],
          ["min of 2^1,000,000", randomInteger(huge, huge + 3n), changed],
          ["max of 2^1,000,000", randomInteger(0n, huge), changed],
          [
            "min naming NULL",
            {
              kind: "random-integer",
              max: literal(9n),
              min: reference("COUNT"),
              operands: [],
              step: literal(1n),
            },
            nulled,
          ],
          [
            "max naming NULL",
            {
              kind: "random-integer",
              max: reference("COUNT"),
              min: literal(0n),
              operands: [],
              step: literal(1n),
            },
            nulled,
          ],
          [
            "step naming NULL",
            {
              kind: "random-integer",
              max: literal(9n),
              min: literal(0n),
              operands: [],
              step: reference("COUNT"),
            },
            nulled,
          ],
        ];

        for (const [name, expression, variables] of cases) {
          const stream = counted("null");
          const value = drawn(expression, item, variables, stream.draw);

          assert.deepStrictEqual(value, nullOf("integer", "single"), name);
          assert.strictEqual(stream.count(), 0, `${name} drew`);
        }
      }),
  );

  it.effect(
    "[I-9a] qti-random-integer draws below the bit bound: a range of 2^999,999 to 2^999,999 + 3 gives a value in it",
    () =>
      Effect.gen(function* drawsAtTheBound() {
        const item = yield* declared();
        const least = 2n ** 999_999n;
        const value = onlyInteger(
          drawn(randomInteger(least, least + 3n), item, changed, drawStream("", "bound")),
        );

        assert.isTrue(value >= least && value <= least + 3n, "the value lies in the range");
      }),
  );

  it.effect("[I-9a] qti-random-integer's min naming a single integer variable reads it", () =>
    Effect.gen(function* readsReference() {
      const item = yield* declared();
      const stream = counted("reference");
      const value = drawn(
        {
          kind: "random-integer",
          max: literal(4n),
          min: reference("COUNT"),
          operands: [],
          step: literal(1n),
        },
        item,
        changed,
        stream.draw,
      );

      assert.deepStrictEqual(value, integer(4n));
      assert.strictEqual(stream.count(), 0, "a range of one value draws nothing");
    }),
  );

  it.effect(
    "[I-9a] qti-random-float stays in [min, max] over 1,000 keys, from -1.5 to 2.5 and across the whole double range",
    () =>
      Effect.gen(function* drawsFloatsInRange() {
        const item = yield* declared();
        const ranges: readonly (readonly [number, number])[] = [
          [-1.5, 2.5],
          [-1.7976931348623157e308, 1.7976931348623157e308],
        ];

        for (const [min, max] of ranges) {
          for (const value of overKeys(randomFloat(min, max), item, changed)) {
            const number = onlyFloat(value);

            assert.isTrue(
              number >= min && number <= max,
              `${String(number)} lies outside [${String(min)}, ${String(max)}]`,
            );
            assertKindType(value, "random-float", []);
          }
        }
      }),
  );

  it.effect(
    "[I-9a] qti-random-float from -1.5 to 2.5 gives min + u × (max − min) for the stream's u: 0.7269821957053031",
    () =>
      Effect.gen(function* pinsNonzeroMinFloat() {
        const item = yield* declared();
        // `drawStream("pin", "random-float")`'s first two draws are 0x8e86e047 and 0xa6a837b0, so
        // `drawFloat`'s numerator is (0x8e86e047 >>> 5) × 2^26 + (0xa6a837b0 >>> 6) =
        // 74725122 × 2^26 + 43688158 = 5014718093369566, and u = 5014718093369566 / 2^53
        // (0.5567455489263258). The value is -1.5 + u × 4 = -1.5 + 5014718093369566 / 2^51 =
        // 0.7269821957053031, exactly. With a nonzero min the swapped form, max − u × (max − min),
        // gives 0.2730178042946969, and the fallback form 0.7269821957053032.
        const value = drawn(
          randomFloat(-1.5, 2.5),
          item,
          changed,
          drawStream("pin", "random-float"),
        );

        assert.deepStrictEqual(value, float(0.7269821957053031));
      }),
  );

  it.effect(
    "[I-9a] qti-random-float across the whole double range gives min × (1 − u) + max × u for the stream's u: 1.7435743705619021e308",
    () =>
      Effect.gen(function* pinsFallbackFloat() {
        const item = yield* declared();
        // `drawStream("pin", "random-float across the double range")`'s first two draws are
        // 0xfc2588ad and 0x0c49ebbd, so `drawFloat`'s numerator is 132197445 × 2^26 + 3221422 =
        // 8871620360873902, and u = 8871620360873902 / 2^53 (0.9849477190375546). max − min
        // overflows to Infinity, so the value is min × (1 − u) + max × u in doubles:
        // -2.705938215020678e306 + 1.770633752712109e308 = 1.7435743705619021e308. The main form,
        // min + u × (max − min), gives Infinity, which the clamp makes max.
        const value = drawn(
          randomFloat(-1.7976931348623157e308, 1.7976931348623157e308),
          item,
          changed,
          drawStream("pin", "random-float across the double range"),
        );

        assert.deepStrictEqual(value, float(1.7435743705619021e308));
      }),
  );

  it.effect(
    "[I-9a] qti-random-float gives NULL and draws nothing for a NaN, an infinite or a crossed bound, or a bound naming a variable holding NULL (G-R2, pending)",
    () =>
      Effect.gen(function* givesFloatNullWithoutDrawing() {
        const item = yield* declared();
        const cases: readonly (readonly [string, Expression, Variables])[] = [
          ["NaN min", randomFloat(Number.NaN, 1), changed],
          ["NaN max", randomFloat(0, Number.NaN), changed],
          ["infinite max", randomFloat(0, Number.POSITIVE_INFINITY), changed],
          ["infinite min", randomFloat(Number.NEGATIVE_INFINITY, 0), changed],
          ["crossed", randomFloat(2, 1), changed],
          [
            "min naming NULL",
            { kind: "random-float", max: literal(1), min: reference("SCORE"), operands: [] },
            nulled,
          ],
          [
            "max naming NULL",
            { kind: "random-float", max: reference("SCORE"), min: literal(0), operands: [] },
            nulled,
          ],
        ];

        for (const [name, expression, variables] of cases) {
          const stream = counted("null");
          const value = drawn(expression, item, variables, stream.draw);

          assert.deepStrictEqual(value, nullOf("float", "single"), name);
          assert.strictEqual(stream.count(), 0, `${name} drew`);
        }
      }),
  );

  it.effect("[I-9a] qti-random-float's min naming a single float variable reads it", () =>
    Effect.gen(function* readsFloatReference() {
      const item = yield* declared();
      const value = drawn(
        { kind: "random-float", max: literal(7), min: reference("SCORE"), operands: [] },
        item,
        changed,
        drawStream("", "reference"),
      );

      assert.deepStrictEqual(value, float(7));
    }),
  );

  it.effect(
    "[I-9a] evaluateExpression with no stream gives the same draw on every call (OD-P8-2)",
    () =>
      Effect.gen(function* drawsAlikeWithNoStream() {
        const item = yield* declared();

        for (const expression of [randomInteger(0n, 1_000_000n), randomFloat(0, 1)]) {
          const first = evaluateExpression(expression, item, changed);
          const second = evaluateExpression(expression, item, changed);

          assert.isTrue(Result.isSuccess(first), `qti-${expression.kind} failed`);
          assert.deepStrictEqual(second, first);
        }
      }),
  );
});

/**
 * Construct an outcome declaration with no reporting attributes.
 *
 * @param named Its identifier.
 * @param baseType Its base type.
 * @param cardinality Its cardinality.
 * @param declaredDefault Its declared default, if any.
 * @returns The declaration.
 */
const outcomeOf = (
  named: string,
  baseType: ModelledBaseType,
  cardinality: Value["cardinality"] = "single",
  declaredDefault: Option.Option<Value> = Option.none(),
): OutcomeDeclaration => ({
  baseType,
  cardinality,
  defaultValue: declaredDefault,
  identifier: named,
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
});

/**
 * A single identifier response, `RESPONSE`, whose correct response is `A` and whose mapping maps
 * `A` to 1.5 and `B` to 0.5, every other value to 0.
 */
const mappedResponse: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.some(identifier("A")),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.some({
    defaultValue: 0,
    entries: [
      { caseSensitive: true, key: { baseType: "identifier", value: "A" }, value: 1.5 },
      { caseSensitive: true, key: { baseType: "identifier", value: "B" }, value: 0.5 },
    ],
    lowerBound: Option.none(),
    upperBound: Option.none(),
  }),
};

/**
 * A multiple point response, `POINT`, whose area mapping maps a point in the rectangle from (0, 0)
 * to (10, 10) to 2, and every other point to 0.25.
 */
const pointResponse: ResponseDeclaration = {
  areaMapping: Option.some({
    defaultValue: 0.25,
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
    entries: [{ coords: [0, 0, 10, 10], mappedValue: 2, shape: "rect" }],
    lowerBound: Option.none(),
    percent: false,
    upperBound: Option.none(),
  }),
  baseType: "point",
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "POINT",
  mapping: Option.none(),
};

/**
 * The declarations of each item below: the responses `RESPONSE` and `POINT`, a float outcome
 * `SCORE` whose declared default is 0.5, an integer outcome `N` and a multiple integer outcome
 * `LIST`.
 */
const itemDeclarations: Declarations = {
  outcomes: new Map([
    ["LIST", outcomeOf("LIST", "integer", "multiple")],
    ["N", outcomeOf("N", "integer")],
    ["SCORE", outcomeOf("SCORE", "float", "single", Option.some(float(0.5)))],
  ]),
  responses: new Map([
    ["POINT", pointResponse],
    ["RESPONSE", mappedResponse],
  ]),
  templates: new Map(),
};

/**
 * A presented item, `ITEM1`: its record holds the response `A`, the points (5, 5) and (20, 20),
 * `SCORE` 1.5, `N` 3 and `LIST` {1, 2}, and a template-set default of `SCORE`, 0.25. It declares
 * the file response `FR` and the record outcome `REC`, of which the value model holds no value.
 * Its item ref weights `W` by 2 and `HALF` by 0.5, and maps `UPLOADED` to `FR`.
 */
const firstItem: ScopeItem = {
  categories: [],
  declarations: itemDeclarations,
  mappings: new Map([["UPLOADED", "FR"]]),
  numAttempts: 1,
  presented: true,
  record: {
    correct: {},
    defaults: { SCORE: float(0.25) },
    outcomes: {
      LIST: {
        baseType: "integer",
        cardinality: "multiple",
        values: [
          { baseType: "integer", value: 1n },
          { baseType: "integer", value: 2n },
        ],
      },
      N: integer(3n),
      SCORE: float(1.5),
    },
    records: {},
    responses: {
      POINT: {
        baseType: "point",
        cardinality: "multiple",
        values: [
          { baseType: "point", value: [5n, 5n] },
          { baseType: "point", value: [20n, 20n] },
        ],
      },
      RESPONSE: identifier("A"),
    },
    templates: {},
  },
  ref: "ITEM1",
  unheld: new Map([
    ["FR", { baseType: "file", cardinality: "single" }],
    ["REC", { baseType: "file", cardinality: "record" }],
  ]),
  weights: new Map([
    ["HALF", 0.5],
    ["W", 2],
  ]),
};

/**
 * A second item, `ITEM2`, whose record holds the response `B`, no template-set default, and the
 * correct response `B` its template processing set.
 */
const secondItem: ScopeItem = {
  ...firstItem,
  record: {
    ...firstItem.record,
    correct: { RESPONSE: identifier("B") },
    defaults: {},
    responses: { ...firstItem.record.responses, RESPONSE: identifier("B") },
  },
  ref: "ITEM2",
};

/**
 * A test's declarations holder: its float outcome `TOTAL`, and no response or template variable.
 */
const testHolder: Declarations = {
  outcomes: new Map([["TOTAL", outcomeOf("TOTAL", "float")]]),
  responses: new Map(),
  templates: new Map(),
};

/**
 * The test scope of `ITEM1` and `ITEM2`, in one part `P1`. A selection with replacement can repeat
 * `ITEM1`, so a numbered name reads through it.
 */
const testScope: TestScope = {
  declared: new Set(["TOTAL"]),
  duration: Option.some(60),
  items: [firstItem, secondItem],
  parts: new Map([["P1", ["ITEM1", "ITEM2"]]]),
  repeatable: new Set(["ITEM1"]),
  sections: new Map(),
};

/**
 * The variables of a test's run: its outcome `TOTAL` at 7 and its test scope.
 */
const testRun: Variables = { outcomes: { TOTAL: float(7) }, responses: {}, test: testScope };

/**
 * Construct a `qti-variable`, weighted when a weight identifier is given.
 *
 * @param named The variable's identifier.
 * @param weight Its `weight-identifier`, if any.
 * @returns The expression.
 */
const variableOf = (named: string, weight?: string): Expression => ({
  identifier: named,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.fromUndefinedOr(weight),
});

/**
 * Give the value of an expression in a test's run, after checking that it succeeded.
 *
 * @param expression The expression.
 * @returns Its value.
 */
const inTest = (expression: Expression): Value => {
  const result = evaluateExpression(expression, testHolder, testRun);
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed in the test's run`);

  return Result.getOrThrow(result);
};

describe("the references family's evaluators in a test's run, each read through its item ref [T-9]", () => {
  it("[T-9] qti-variable gives a weighted ITEM1.SCORE read through its item ref as its value times the weight, a single float", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.SCORE", "W")), float(3));
  });

  it("[T-9] qti-variable gives a weighted integer read through its item ref as a single float, the value times the weight", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.N", "HALF")), float(1.5));
  });

  it("[T-9] qti-variable gives a weighted multiple integer read through its item ref as a multiple float, each value times the weight", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.LIST", "W")), {
      baseType: "float",
      cardinality: "multiple",
      values: [
        { baseType: "float", value: 2 },
        { baseType: "float", value: 4 },
      ],
    });
  });

  it("[T-9] qti-variable gives a weighted identifier variable read through its item ref unweighted", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.RESPONSE", "W")), identifier("A"));
  });

  it("[T-9] qti-variable gives a weight its item ref does not define as 1.0, read through its item ref: an integer reads as a float", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.N", "MISSING")), float(3));
  });

  it("[T-9] qti-variable gives a weighted NULL integer read through its item ref as NULL of a single float", () => {
    assert.deepStrictEqual(inTest(variableOf("ITEM1.2.N", "W")), nullOf("float", "single"));
  });

  it("[T-9] qti-variable gives an unprefixed weighted name the test's own variable unweighted, with no read through its item ref (G-R3, pending)", () => {
    assert.deepStrictEqual(inTest(variableOf("TOTAL", "W")), float(7));
  });

  it("[T-9] qti-correct of ITEM1.RESPONSE gives the item's correct response read through its item ref, the template-set one first", () => {
    assert.deepStrictEqual(
      [
        inTest({ identifier: "ITEM1.RESPONSE", kind: "correct", operands: [] }),
        inTest({ identifier: "ITEM2.RESPONSE", kind: "correct", operands: [] }),
      ],
      [identifier("A"), identifier("B")],
    );
  });

  it("[T-9] qti-default of ITEM1.SCORE gives the template-set default read through its item ref, before the declaration's", () => {
    assert.deepStrictEqual(
      [
        inTest(defaultOf("ITEM1.SCORE")),
        inTest(defaultOf("ITEM2.SCORE")),
        inTest(defaultOf("ITEM1.N")),
      ],
      [float(0.25), float(0.5), nullOf("integer", "single")],
    );
  });

  it("[T-9] a test's run maps ITEM1.RESPONSE read through its item ref by the item's qti-mapping", () => {
    const rules = [
      {
        expression: { identifier: "ITEM2.RESPONSE", kind: "map-response", operands: [] },
        identifier: "TOTAL",
        kind: "set-outcome",
      },
    ] as const;

    assert.deepStrictEqual(
      [
        inTest({ identifier: "ITEM1.RESPONSE", kind: "map-response", operands: [] }),
        Result.getOrThrow(runRules(rules, testHolder, testRun)).outcomes["TOTAL"],
      ],
      [float(1.5), float(0.5)],
    );
  });

  it("[T-9] qti-map-response-point of ITEM1.POINT maps the item's points read through its item ref by its qti-area-mapping", () => {
    assert.deepStrictEqual(
      inTest({ identifier: "ITEM1.POINT", kind: "map-response-point", operands: [] }),
      float(2.25),
    );
  });
});

/**
 * Give the failure an expression gives in a run, after checking that it failed.
 *
 * @param expression The expression.
 * @param holder The declarations holder the run reads.
 * @param variables The variables of the run.
 * @returns The failure's tag, and its holder, identifier and role when it is an
 *   `UnknownIdentifierError`.
 */
const failureIn = (
  expression: Expression,
  holder: Declarations,
  variables: Variables,
): readonly string[] =>
  Option.match(Result.getFailure(evaluateExpression(expression, holder, variables)), {
    onNone: () => assert.fail(`qti-${expression.kind} did not fail`),
    onSome: (failure) =>
      failure._tag === "UnknownIdentifierError"
        ? [failure._tag, failure.holder, failure.identifier, failure.role]
        : [failure._tag],
  });

describe("the references family's qti-default of a built-in and its reads of an unheld item variable in a test's run [T-9]", () => {
  it("[T-9] qti-default of duration in a test's run gives NULL of a single duration, timed or untimed, and qti-variable of it the seconds: a built-in declares no default", () => {
    const untimed: Variables = { ...testRun, test: { ...testScope, duration: Option.none() } };

    assert.deepStrictEqual(
      [
        inTest(defaultOf("duration")),
        Result.getOrThrow(evaluateExpression(defaultOf("duration"), testHolder, untimed)),
        inTest(variableOf("duration")),
      ],
      [
        nullOf("duration", "single"),
        nullOf("duration", "single"),
        {
          baseType: "duration",
          cardinality: "single",
          values: [{ baseType: "duration", value: 60 }],
        },
      ],
    );
  });

  it("[T-9] qti-default of duration in an item's run, which holds no duration, fails UnknownIdentifierError of the item: a built-in declares no default only where the run holds it", () => {
    assert.deepStrictEqual(
      failureIn(defaultOf("duration"), itemDeclarations, { outcomes: {}, responses: {} }),
      ["UnknownIdentifierError", "item", "duration", "variable"],
    );
  });

  it("[T-9] qti-correct of ITEM1.FR, a file response, gives a NULL, and of ITEM1.RESPONSE its correct response: a file or record reads NULL", () => {
    assert.isTrue(isNull(inTest(correctOf("ITEM1.FR"))), "ITEM1.FR");
    assert.deepStrictEqual(inTest(correctOf("ITEM1.RESPONSE")), identifier("A"));
  });

  it("[T-9] qti-default of ITEM1.FR, a file response, and of ITEM1.REC, a record outcome, each gives a NULL: a file or record reads NULL", () => {
    for (const named of ["ITEM1.FR", "ITEM1.REC"]) {
      assert.isTrue(isNull(inTest(defaultOf(named))), named);
    }
  });

  it("[T-9] qti-correct and qti-default of ITEM1.UPLOADED, a mapping target whose source is a file response, and of ITEM1.2.FR each gives a NULL: a file or record reads NULL", () => {
    for (const named of ["ITEM1.UPLOADED", "ITEM1.2.FR"]) {
      assert.isTrue(isNull(inTest(correctOf(named))), `qti-correct of ${named}`);
      assert.isTrue(isNull(inTest(defaultOf(named))), `qti-default of ${named}`);
    }
  });

  it("[T-9] qti-map-response and qti-map-response-point of ITEM1.FR, a file response, each fail UnknownIdentifierError of the item, as the engine holds no mapping of it", () => {
    assert.deepStrictEqual(
      [
        failureIn(
          { identifier: "ITEM1.FR", kind: "map-response", operands: [] },
          testHolder,
          testRun,
        ),
        failureIn(
          { identifier: "ITEM1.FR", kind: "map-response-point", operands: [] },
          testHolder,
          testRun,
        ),
      ],
      [
        ["UnknownIdentifierError", "item", "ITEM1.FR", "response"],
        ["UnknownIdentifierError", "item", "ITEM1.FR", "response"],
      ],
    );
  });
});

/**
 * The record `ITEM3` declares as `RREC`'s correct response and default, and holds as its answer:
 * `stringValue` "12".
 */
const heldRecord: RecordValue = {
  cardinality: "record",
  fields: [{ identifier: "stringValue", value: { baseType: "string", value: "12" } }],
};

/**
 * `ITEM3`, `ITEM1` with the record response `RREC`, whose declared correct response and default
 * are {@link heldRecord} and whose record holds it.
 */
const recordItem: ScopeItem = {
  ...firstItem,
  record: { ...firstItem.record, records: { RREC: heldRecord } },
  records: new Map([
    [
      "RREC",
      {
        correct: Option.some(heldRecord),
        defaultValue: Option.some(heldRecord),
        identifier: "RREC",
      },
    ],
  ]),
  ref: "ITEM3",
};

/**
 * The variables of a test's run over `ITEM1` and `ITEM3`.
 */
const recordRun: Variables = {
  ...testRun,
  test: {
    ...testScope,
    items: [firstItem, recordItem],
    parts: new Map([["P1", ["ITEM1", "ITEM3"]]]),
  },
};

/**
 * Give the value of an expression in the test's run over `ITEM1` and `ITEM3`, failing the case on a
 * failure.
 *
 * @param expression The expression.
 * @returns Its value.
 */
const readInRecordRun = (expression: Expression): Value =>
  Result.getOrThrow(evaluateExpression(expression, testHolder, recordRun));

describe("the references family's value reads of a record response through its item ref [T-9]", () => {
  it("[T-9] qti-variable, qti-correct, qti-default and qti-map-response of a record response through its item ref, read as a value, each fail RecordOperandError naming it", () => {
    const failures = (["variable", "correct", "default", "map-response"] as const).map((kind) => {
      const expression: Expression =
        kind === "variable"
          ? variableOf("ITEM3.RREC")
          : { identifier: "ITEM3.RREC", kind, operands: [] };

      return Option.match(
        Result.getFailure(evaluateExpression(expression, testHolder, recordRun)),
        {
          onNone: () => [kind, "no failure"],
          onSome: (failure) =>
            failure._tag === "RecordOperandError"
              ? [kind, failure._tag, failure.identifier]
              : [kind, failure._tag],
        },
      );
    });

    assert.deepStrictEqual(failures, [
      ["variable", "RecordOperandError", "ITEM3.RREC"],
      ["correct", "RecordOperandError", "ITEM3.RREC"],
      ["default", "RecordOperandError", "ITEM3.RREC"],
      ["map-response", "RecordOperandError", "ITEM3.RREC"],
    ]);

    // The control: the same item's modelled response and record outcome read through the same item
    // ref keep their values, the correct response and NULL.
    assert.deepStrictEqual(
      readInRecordRun({ identifier: "ITEM3.RESPONSE", kind: "correct", operands: [] }),
      identifier("A"),
    );
    assert.isTrue(
      isNull(readInRecordRun({ identifier: "ITEM3.REC", kind: "default", operands: [] })),
    );
  });
});

/**
 * `choice`, `ITEM1` under the ref `choice`, whose record holds the correct response 4 and the
 * default 9 its template processing set for the built-in `numAttempts`.
 */
const choiceItem: ScopeItem = {
  ...firstItem,
  record: {
    ...firstItem.record,
    correct: { numAttempts: integer(4n) },
    defaults: { numAttempts: integer(9n) },
  },
  ref: "choice",
};

/**
 * The variables of a test's run over `choice` and `ITEM2`, whose record sets nothing of
 * `numAttempts`. A selection with replacement can repeat `choice`.
 */
const choiceRun: Variables = {
  outcomes: {},
  responses: {},
  test: {
    ...testScope,
    items: [choiceItem, secondItem],
    parts: new Map([["P1", ["choice", "ITEM2"]]]),
    repeatable: new Set(["choice"]),
  },
};

/**
 * Give the value of an expression in {@link choiceRun}, which must succeed.
 *
 * @param expression The expression.
 * @returns Its value.
 */
const inChoiceRun = (expression: Expression): Value =>
  Result.getOrThrow(evaluateExpression(expression, testHolder, choiceRun));

/**
 * Open a hand-built item document, which `check` must accept with no unsupported feature, start
 * its first record with `begin` and score one attempt with no response.
 *
 * @param children The root's children, as written.
 * @returns The record `score` returned, decoded.
 */
const scoredBuiltIns = Effect.fnUntraced(function* scoredBuiltIns(children: string) {
  const verdict = yield* open(
    "items/built-ins.xml",
    new TextEncoder().encode(
      `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="builtins" title="Built-ins" adaptive="false" time-dependent="false">${children}</qti-assessment-item>`,
    ),
  );
  assert.strictEqual(
    verdict.verdict,
    "accepted",
    verdict.verdict === "refused"
      ? JSON.stringify(verdict.refusals.map((each) => [each.rule, each.detail]))
      : verdict.verdict,
  );

  const accepted = Option.getOrElse(acceptedItem(verdict), () => assert.fail("not an item"));
  const started = yield* Effect.fromResult(begin(accepted, { instance: "q1", seed: "7" }));

  return yield* Effect.fromResult(
    decodeRecord(yield* Effect.fromResult(score(accepted, {}, started))),
  );
});

describe("align-54 built-ins by kind: a qti-correct and a qti-default of a built-in read what template processing set (reading 111)", () => {
  it.effect(
    "align-54 built-ins by kind E22a: qti-correct of numAttempts reads the correct response template processing set, else NULL of a single integer, no longer a failure",
    () =>
      Effect.gen(function* readsBuiltInCorrect() {
        const item = yield* declared();

        assert.deepStrictEqual(
          [
            evaluated(correctOf("numAttempts"), item, {
              ...changed,
              correct: { numAttempts: integer(7n) },
            }),
            evaluated(correctOf("numAttempts"), item),
          ],
          [integer(7n), nullOf("integer", "single")],
        );
      }),
  );

  it.effect(
    "align-54 built-ins by kind E22a: qti-default of numAttempts and of completionStatus reads the default template processing set, never the built-in's own value",
    () =>
      Effect.gen(function* readsBuiltInDefault() {
        const item = yield* declared();
        const set: Variables = {
          ...changed,
          defaults: { completionStatus: identifier("completed"), numAttempts: integer(5n) },
          outcomes: { ...changed.outcomes, completionStatus: identifier("incomplete") },
        };

        assert.deepStrictEqual(
          [
            evaluated(defaultOf("numAttempts"), item, set),
            evaluated(defaultOf("completionStatus"), item, set),
          ],
          [integer(5n), identifier("completed")],
        );
      }),
  );

  it("align-54 built-ins by kind E22a: a test's prefixed qti-correct and qti-default of choice.numAttempts read what the item's template processing set, else NULL of a single integer", () => {
    assert.deepStrictEqual(
      [
        inChoiceRun(correctOf("choice.numAttempts")),
        inChoiceRun(defaultOf("choice.numAttempts")),
        inChoiceRun(correctOf("ITEM2.numAttempts")),
        inChoiceRun(correctOf("choice.2.numAttempts")),
      ],
      [integer(4n), integer(9n), nullOf("integer", "single"), nullOf("integer", "single")],
    );
  });

  it.effect(
    "align-54 built-ins by kind E22a: begin and score of an accepted item read back the correct response its template processing set for numAttempts, and NULL with none set",
    () =>
      Effect.gen(function* readsBackBuiltInCorrect() {
        const set = yield* scoredBuiltIns(
          '<qti-outcome-declaration identifier="N" cardinality="single" base-type="integer"/><qti-template-processing><qti-set-correct-response identifier="numAttempts"><qti-base-value base-type="integer">7</qti-base-value></qti-set-correct-response></qti-template-processing><qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="N"><qti-correct identifier="numAttempts"/></qti-set-outcome-value></qti-response-processing>',
        );
        const unset = yield* scoredBuiltIns(
          '<qti-outcome-declaration identifier="B" cardinality="single" base-type="boolean"/><qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="B"><qti-is-null><qti-correct identifier="numAttempts"/></qti-is-null></qti-set-outcome-value></qti-response-processing>',
        );

        assert.deepStrictEqual(
          [set.correct, set.outcomes["N"], set.numAttempts, unset.outcomes["B"]],
          [
            { numAttempts: integer(7n) },
            integer(7n),
            1,
            {
              baseType: "boolean",
              cardinality: "single",
              values: [{ baseType: "boolean", value: true }],
            },
          ],
        );
      }),
  );
});
