import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
  evaluateExpression,
  runRules,
} from "#plate/engine/evaluate.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type {
  AreaMapEntry,
  AreaMapping,
  Branch,
  Expression,
  Item,
  Mapping,
  OutcomeDeclaration,
  ResponseDeclaration,
  Rule,
} from "#plate/model/item.ts";
import { buildItem } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * Construct a single identifier value.
 *
 * @param identifier The identifier.
 * @returns The value.
 */
const identifierValue = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value.
 */
const floatValue = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

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
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value.
 */
const booleanValue = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * The BG007-shaped response: a single identifier whose correct response is `true`.
 */
const response: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.some(identifierValue("true")),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * A single identifier response with no correct response.
 */
const open: ResponseDeclaration = { ...response, correct: Option.none(), identifier: "OPEN" };

/**
 * BG010's mapping: `York` maps to 1 compared case-sensitively, `york` to 0.5 compared with case
 * folded, as `case-sensitive` defaults to false, and every other answer to 0.
 */
const yorkMapping: Mapping = {
  defaultValue: 0,
  entries: [
    { caseSensitive: true, key: { baseType: "string", value: "York" }, value: 1 },
    { caseSensitive: false, key: { baseType: "string", value: "york" }, value: 0.5 },
  ],
  lowerBound: Option.none(),
  upperBound: Option.none(),
};

/**
 * BG010's single string response, `CITY` here, with its mapping.
 */
const city: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "string",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "CITY",
  mapping: Option.some(yorkMapping),
};

/**
 * A single string response whose entries overlap in the order BG010's do not: `york` (0.5, with
 * case folded) comes before `York` (1, compared case-sensitively), so `York` matches both.
 */
const tied: ResponseDeclaration = {
  ...city,
  identifier: "TIED",
  mapping: Option.some({
    defaultValue: 0,
    entries: [
      { caseSensitive: false, key: { baseType: "string", value: "york" }, value: 0.5 },
      { caseSensitive: true, key: { baseType: "string", value: "York" }, value: 1 },
    ],
    lowerBound: Option.none(),
    upperBound: Option.none(),
  }),
};

/**
 * BG010's response with its mapping bounded from 0.25 to 0.4.
 */
const bounded: ResponseDeclaration = {
  ...city,
  identifier: "BOUNDED",
  mapping: Option.some({
    ...yorkMapping,
    lowerBound: Option.some(0.25),
    upperBound: Option.some(0.4),
  }),
};

/**
 * A multiple identifier response mapping `A` to 1 and `C` to 0.5.
 */
const choices: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "CHOICES",
  mapping: Option.some({
    defaultValue: 0,
    entries: [
      { caseSensitive: false, key: { baseType: "identifier", value: "A" }, value: 1 },
      { caseSensitive: false, key: { baseType: "identifier", value: "C" }, value: 0.5 },
    ],
    lowerBound: Option.none(),
    upperBound: Option.none(),
  }),
};

/**
 * A single pair response mapping the pair `A B` to 1.
 */
const paired: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "pair",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "PAIRED",
  mapping: Option.some({
    defaultValue: 0,
    entries: [{ caseSensitive: false, key: { baseType: "pair", value: ["A", "B"] }, value: 1 }],
    lowerBound: Option.none(),
    upperBound: Option.none(),
  }),
};

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * The area mapping of the point cases: the circle `102,113,16` mapped to 1, then the rect
 * `0,0,50,40` mapped to 0.5; a point in neither maps to 0.25.
 */
const targetMapping: AreaMapping = {
  defaultValue: 0.25,
  entries: [
    { coords: [102, 113, 16], mappedValue: 1, shape: "circle" },
    { coords: [0, 0, 50, 40], mappedValue: 0.5, shape: "rect" },
  ],
  lowerBound: Option.none(),
  percent: false,
  upperBound: Option.none(),
};

/**
 * Construct a multiple point response.
 *
 * @param identifier The response's identifier.
 * @param areaMapping Its area mapping, when it has one.
 * @returns The declaration.
 */
const pointResponse = (
  identifier: string,
  areaMapping: Option.Option<AreaMapping>,
): ResponseDeclaration => ({
  areaMapping,
  baseType: "point",
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier,
  mapping: Option.none(),
});

/**
 * A point response with {@link targetMapping}.
 */
const target = pointResponse("TARGET", Option.some(targetMapping));

/**
 * A point response with {@link targetMapping} bounded from 0.5 to 1.25.
 */
const clamped = pointResponse(
  "CLAMPED",
  Option.some({ ...targetMapping, lowerBound: Option.some(0.5), upperBound: Option.some(1.25) }),
);

/**
 * A point response whose areas overlap: the rect `0,0,50,40` mapped to 0.5, then the circle
 * `40,30,20` mapped to 1, which holds the rect's corner `50,40`.
 */
const overlapping = pointResponse(
  "OVERLAPPING",
  Option.some({
    ...targetMapping,
    entries: [
      { coords: [0, 0, 50, 40], mappedValue: 0.5, shape: "rect" },
      { coords: [40, 30, 20], mappedValue: 1, shape: "circle" },
    ],
  }),
);
/* oxlint-enable anti-slop/no-shape-in-symbol-names */

/**
 * A point response with no area mapping.
 */
const unmapped = pointResponse("UNMAPPED", Option.none());

/**
 * A single float outcome with no default, as `SCORE` is declared.
 */
const score: OutcomeDeclaration = {
  baseType: "float",
  cardinality: "single",
  defaultValue: Option.none(),
  identifier: "SCORE",
};

/**
 * A single boolean outcome with no default.
 */
const empty: OutcomeDeclaration = { ...score, baseType: "boolean", identifier: "EMPTY" };

/**
 * The item the rules run against: its declarations are all the evaluator reads of it.
 */
const item: Item = {
  body: [],
  document: "evaluate.xml",
  identifier: "evaluate",
  lang: Option.none(),
  outcomes: new Map([
    ["SCORE", score],
    ["EMPTY", empty],
  ]),
  processing: Option.none(),
  responses: new Map([
    ["RESPONSE", response],
    ["OPEN", open],
    ["CITY", city],
    ["TIED", tied],
    ["BOUNDED", bounded],
    ["CHOICES", choices],
    ["PAIRED", paired],
    ["TARGET", target],
    ["CLAMPED", clamped],
    ["OVERLAPPING", overlapping],
    ["UNMAPPED", unmapped],
  ]),
  title: "Evaluate",
  unsupported: [],
};

/**
 * Construct the variables of one attempt.
 *
 * @param answer The value of `RESPONSE`.
 * @param scored The value of `SCORE` before the rules run, 0 by default.
 * @returns The variables: `RESPONSE` and `OPEN`, and `SCORE` and a NULL `EMPTY`.
 */
const variablesOf = (answer: Value, scored: Value = floatValue(0)): Variables => ({
  outcomes: { EMPTY: nullOf("boolean", "single"), SCORE: scored },
  responses: { OPEN: nullOf("identifier", "single"), RESPONSE: answer },
});

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable's identifier.
 * @returns The expression.
 */
const variable = (identifier: string): Expression => ({ identifier, kind: "variable" });

/**
 * Construct a `qti-base-value`.
 *
 * @param value The value.
 * @returns The expression.
 */
const base = (value: Value): Expression => ({ kind: "base-value", value });

/**
 * Construct a response value of the base type and cardinality its declaration in {@link item} has.
 *
 * @param identifier The response.
 * @param values Its values, none for NULL.
 * @returns The value.
 */
const answerOf = (identifier: string, values: readonly Single[]): Value => {
  const declaration = item.responses.get(identifier);
  assert.isDefined(declaration);

  return { baseType: declaration.baseType, cardinality: declaration.cardinality, values };
};

/**
 * Give the value of a `qti-map-response` of one response.
 *
 * @param identifier The response.
 * @param values Its values, none for NULL.
 * @returns The mapped value.
 */
const mapped = (identifier: string, values: readonly Single[]): Value =>
  Result.getOrThrow(
    evaluateExpression({ identifier, kind: "map-response" }, item, {
      ...variablesOf(identifierValue("A")),
      responses: { [identifier]: answerOf(identifier, values) },
    }),
  );

/**
 * Construct a single point.
 *
 * @param x Its x coordinate.
 * @param y Its y coordinate.
 * @returns The single.
 */
const pointOf = (x: bigint, y: bigint): Single => ({ baseType: "point", value: [x, y] });

/**
 * Give the value of a `qti-map-response-point` of one response.
 *
 * @param identifier The response.
 * @param points Its points, none for NULL.
 * @returns The mapped value.
 */
const pointMapped = (identifier: string, points: readonly Single[]): Value =>
  Result.getOrThrow(
    evaluateExpression({ identifier, kind: "map-response-point" }, item, {
      ...variablesOf(identifierValue("A")),
      responses: { [identifier]: answerOf(identifier, points) },
    }),
  );

/**
 * Report whether one area holds a point, through a `qti-map-response-point` whose mapping is that
 * area alone, mapped to 1 with a default of 0.
 *
 * @param entry The area.
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @returns Whether the area maps the point.
 */
const holds = (entry: Omit<AreaMapEntry, "mappedValue">, x: bigint, y: bigint): boolean => {
  const area = pointResponse(
    "AREA",
    Option.some({
      defaultValue: 0,
      entries: [{ ...entry, mappedValue: 1 }],
      lowerBound: Option.none(),
      percent: false,
      upperBound: Option.none(),
    }),
  );
  const value = Result.getOrThrow(
    evaluateExpression(
      { identifier: "AREA", kind: "map-response-point" },
      { ...item, responses: new Map([["AREA", area]]) },
      {
        outcomes: {},
        responses: {
          AREA: { baseType: "point", cardinality: "multiple", values: [pointOf(x, y)] },
        },
      },
    ),
  );

  return value.values[0]?.baseType === "float" && value.values[0].value === 1;
};

/**
 * Construct a single string.
 *
 * @param value The text.
 * @returns The single.
 */
const stringOf = (value: string): Single => ({ baseType: "string", value });

/**
 * Construct a single identifier.
 *
 * @param value The identifier.
 * @returns The single.
 */
const identifierOf = (value: string): Single => ({ baseType: "identifier", value });

/**
 * Construct a `qti-set-outcome-value`.
 *
 * @param identifier The outcome.
 * @param expression Its new value.
 * @returns The rule.
 */
const setOutcome = (identifier: string, expression: Expression): Rule => ({
  expression,
  identifier,
  kind: "set-outcome",
});

/**
 * Construct a `qti-response-if` or `qti-response-else-if`.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
// oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the item model's name for it; it is an array, never a function, so no `await` treats a branch as a promise.
const branchOf = (when: Expression, then: readonly Rule[]): Branch => ({ then, when });

/**
 * Construct a `qti-response-condition`.
 *
 * @param branches Its if and else-if branches, in order.
 * @param otherwise Its else rules, when it has an else.
 * @returns The rule.
 */
const condition = (branches: readonly Branch[], otherwise?: readonly Rule[]): Rule => ({
  branches,
  kind: "condition",
  otherwise: Option.fromUndefinedOr(otherwise),
});

/**
 * The `match_correct` template as its rule tree: `SCORE` is 1 when `RESPONSE` matches its correct
 * response, else 0.
 */
const matchCorrect: readonly Rule[] = [
  condition(
    [
      branchOf(
        {
          kind: "match",
          operands: [variable("RESPONSE"), { identifier: "RESPONSE", kind: "correct" }],
        },
        [setOutcome("SCORE", base(floatValue(1)))],
      ),
    ],
    [setOutcome("SCORE", base(floatValue(0)))],
  ),
];

/**
 * Give the failure a Result holds, after checking that it is a Result and that it failed.
 *
 * @param result The Result the engine returned.
 * @returns Its failure.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): E => {
  assert.isTrue(Result.isResult(result));
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("runRules", () => {
  it("[I-9b] a match with a NULL response takes the else branch", () => {
    const after = Result.getOrThrow(
      runRules(matchCorrect, item, variablesOf(nullOf("identifier", "single"), floatValue(1))),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0));
  });

  it("[I-9b] a match with the correct identifier takes the if branch", () => {
    const after = Result.getOrThrow(
      runRules(matchCorrect, item, variablesOf(identifierValue("true"))),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(1));
  });

  it("[I-9b] set-outcome writes a float and leaves the responses as they were", () => {
    const before = variablesOf(identifierValue("false"));
    const after = Result.getOrThrow(
      runRules([setOutcome("SCORE", base(floatValue(2.5)))], item, before),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(2.5));
    assert.deepStrictEqual(after.responses, before.responses);
  });

  it("[I-9b] an else-if branch runs when the first fails", () => {
    const answered = (choice: string): Expression => ({
      kind: "match",
      operands: [variable("RESPONSE"), base(identifierValue(choice))],
    });
    const rules = [
      condition(
        [
          branchOf(answered("A"), [setOutcome("SCORE", base(floatValue(1)))]),
          branchOf(answered("B"), [setOutcome("SCORE", base(floatValue(0.5)))]),
        ],
        [setOutcome("SCORE", base(floatValue(0)))],
      ),
    ];
    const after = Result.getOrThrow(runRules(rules, item, variablesOf(identifierValue("B"))));

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0.5));
  });

  it("[I-9b] a rule reads the outcome an earlier rule set", () => {
    const rules = [
      setOutcome("EMPTY", { kind: "is-null", operand: variable("RESPONSE") }),
      condition([branchOf(variable("EMPTY"), [setOutcome("SCORE", base(floatValue(0.5)))])]),
    ];
    const after = Result.getOrThrow(
      runRules(rules, item, variablesOf(nullOf("identifier", "single"))),
    );

    assert.deepStrictEqual(after.outcomes["EMPTY"], booleanValue(true));
    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0.5));
  });

  it("[I-9b] a condition with no true branch and no else changes nothing", () => {
    const rules = [
      condition([branchOf(variable("EMPTY"), [setOutcome("SCORE", base(floatValue(1)))])]),
    ];
    const before = variablesOf(identifierValue("A"), floatValue(0.25));

    assert.deepStrictEqual(Result.getOrThrow(runRules(rules, item, before)), before);
  });

  it("refuses to set an outcome to a value of another base type", () => {
    const integerOne: Value = {
      baseType: "integer",
      cardinality: "single",
      values: [{ baseType: "integer", value: 1n }],
    };

    const failure = failureOf(
      runRules([setOutcome("SCORE", base(integerOne))], item, variablesOf(identifierValue("A"))),
    );

    assert.instanceOf(failure, OutcomeMismatchError);
    assert.deepStrictEqual(
      {
        _tag: failure._tag,
        actual: failure.actual,
        expected: failure.expected,
        identifier: failure.identifier,
      },
      {
        _tag: "OutcomeMismatchError",
        actual: "integer single",
        expected: "float single",
        identifier: "SCORE",
      },
    );
  });

  it("refuses an outcome or a variable the item does not declare", () => {
    const outcome = failureOf(
      runRules(
        [setOutcome("RESPONSE", base(floatValue(1)))],
        item,
        variablesOf(identifierValue("A")),
      ),
    );
    const missing = failureOf(
      runRules([setOutcome("SCORE", variable("MISSING"))], item, variablesOf(identifierValue("A"))),
    );

    assert.instanceOf(outcome, UnknownIdentifierError);
    assert.instanceOf(missing, UnknownIdentifierError);
    assert.deepStrictEqual(
      [
        { _tag: outcome._tag, identifier: outcome.identifier, role: outcome.role },
        { _tag: missing._tag, identifier: missing.identifier, role: missing.role },
      ],
      [
        { _tag: "UnknownIdentifierError", identifier: "RESPONSE", role: "outcome" },
        { _tag: "UnknownIdentifierError", identifier: "MISSING", role: "variable" },
      ],
    );
  });

  it("says the item lacks an outcome it does not declare", () => {
    const failure = failureOf(
      runRules(
        [setOutcome("UNDECLARED", base(floatValue(1)))],
        item,
        variablesOf(identifierValue("A")),
      ),
    );

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      {
        _tag: failure._tag,
        holder: failure.holder,
        identifier: failure.identifier,
        role: failure.role,
      },
      { _tag: "UnknownIdentifierError", holder: "item", identifier: "UNDECLARED", role: "outcome" },
    );
  });
});

describe("evaluateExpression", () => {
  it("[I-9b] is-null on NULL is true", () => {
    const value = Result.getOrThrow(
      evaluateExpression(
        { kind: "is-null", operand: variable("RESPONSE") },
        item,
        variablesOf(nullOf("identifier", "single")),
      ),
    );

    assert.deepStrictEqual(value, booleanValue(true));
  });

  it("[I-9b] a match with a NULL side is NULL", () => {
    const value = Result.getOrThrow(
      evaluateExpression(
        { kind: "match", operands: [variable("OPEN"), base(identifierValue("A"))] },
        item,
        variablesOf(identifierValue("A")),
      ),
    );

    assert.deepStrictEqual(value, nullOf("boolean", "single"));
  });

  it.effect("[I-9b] a match tells an integer correct response beyond 2^53 from its neighbour", () =>
    Effect.gen(function* exactIntegerMatch() {
      const built = yield* buildItem(
        doc(
          "items/exact.xml",
          el(
            "qti-assessment-item",
            [attr("identifier", "exact"), attr("title", "Exact")],
            [
              el(
                "qti-response-declaration",
                [
                  attr("base-type", "integer"),
                  attr("cardinality", "single"),
                  attr("identifier", "RESPONSE"),
                ],
                [el("qti-correct-response", [], [el("qti-value", [], [text("9007199254740993")])])],
              ),
              el("qti-item-body"),
            ],
          ),
        ),
      );
      const matches = (answer: bigint) =>
        Effect.fromResult(
          evaluateExpression(
            {
              kind: "match",
              operands: [variable("RESPONSE"), { identifier: "RESPONSE", kind: "correct" }],
            },
            built,
            {
              outcomes: {},
              responses: {
                RESPONSE: {
                  baseType: "integer",
                  cardinality: "single",
                  values: [{ baseType: "integer", value: answer }],
                },
              },
            },
          ),
        );

      assert.deepStrictEqual(yield* matches(2n ** 53n), booleanValue(false));
      assert.deepStrictEqual(yield* matches(2n ** 53n + 1n), booleanValue(true));
    }),
  );

  it("[I-9b] correct is the declared correct response, or NULL of the declared type", () => {
    const variables = variablesOf(identifierValue("A"));

    assert.deepStrictEqual(
      Result.getOrThrow(
        evaluateExpression({ identifier: "RESPONSE", kind: "correct" }, item, variables),
      ),
      identifierValue("true"),
    );
    assert.deepStrictEqual(
      Result.getOrThrow(
        evaluateExpression({ identifier: "OPEN", kind: "correct" }, item, variables),
      ),
      nullOf("identifier", "single"),
    );
  });

  it("[I-9b] a variable reads a response or an outcome", () => {
    const variables = variablesOf(identifierValue("A"), floatValue(0.75));

    assert.deepStrictEqual(
      Result.getOrThrow(evaluateExpression(variable("RESPONSE"), item, variables)),
      identifierValue("A"),
    );
    assert.deepStrictEqual(
      Result.getOrThrow(evaluateExpression(variable("SCORE"), item, variables)),
      floatValue(0.75),
    );
  });

  it("refuses a variable named like an Object.prototype member", () => {
    const failure = failureOf(
      evaluateExpression(variable("constructor"), item, variablesOf(identifierValue("A"))),
    );

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      { _tag: failure._tag, identifier: failure.identifier, role: failure.role },
      { _tag: "UnknownIdentifierError", identifier: "constructor", role: "variable" },
    );
  });

  it("says the record lacks a variable the variables hold no value of", () => {
    const failure = failureOf(
      evaluateExpression(variable("MISSING"), item, variablesOf(identifierValue("A"))),
    );

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      {
        _tag: failure._tag,
        holder: failure.holder,
        identifier: failure.identifier,
        role: failure.role,
      },
      { _tag: "UnknownIdentifierError", holder: "record", identifier: "MISSING", role: "variable" },
    );
    assert.include(failure.message, JSON.stringify("MISSING"));
    assert.include(failure.message, "session record");
  });
});

/**
 * Give the value of a `qti-equal` of two values, in exact mode.
 *
 * @param left The first operand's value.
 * @param right The second operand's value.
 * @returns The equal's value.
 */
const equalOf = (left: Value, right: Value): Value =>
  Result.getOrThrow(
    evaluateExpression(
      { kind: "equal", operands: [base(left), base(right)] },
      item,
      variablesOf(identifierValue("A")),
    ),
  );

describe("equal", () => {
  it("compares an integer and a float exactly: 1 and 1.0 are equal, 1 and 1.0000000000000002 are not", () => {
    assert.deepStrictEqual(equalOf(integerValue(1n), floatValue(1)), booleanValue(true));
    assert.deepStrictEqual(equalOf(floatValue(1), integerValue(1n)), booleanValue(true));
    assert.deepStrictEqual(
      equalOf(integerValue(1n), floatValue(1.0000000000000002)),
      booleanValue(false),
    );
  });

  it("compares two integers beyond 2^53, and an integer with the double nearest it, exactly", () => {
    const above = 2n ** 53n + 1n;

    assert.deepStrictEqual(equalOf(integerValue(above), integerValue(above)), booleanValue(true));
    assert.deepStrictEqual(
      equalOf(integerValue(above), integerValue(2n ** 53n)),
      booleanValue(false),
    );
    assert.deepStrictEqual(equalOf(integerValue(above), floatValue(2 ** 53)), booleanValue(false));
    assert.deepStrictEqual(
      equalOf(integerValue(2n ** 53n), floatValue(2 ** 53)),
      booleanValue(true),
    );
  });

  it("compares two floats by value", () => {
    assert.deepStrictEqual(equalOf(floatValue(0.5), floatValue(0.5)), booleanValue(true));
    assert.deepStrictEqual(equalOf(floatValue(0.5), floatValue(0.25)), booleanValue(false));
    assert.deepStrictEqual(equalOf(floatValue(-0), floatValue(0)), booleanValue(true));
  });

  it("is NULL when either side is NULL", () => {
    assert.deepStrictEqual(
      equalOf(nullOf("integer", "single"), floatValue(1)),
      nullOf("boolean", "single"),
    );
    assert.deepStrictEqual(
      equalOf(floatValue(1), nullOf("float", "single")),
      nullOf("boolean", "single"),
    );
  });

  it("is false when a side is not a single number", () => {
    assert.deepStrictEqual(equalOf(identifierValue("A"), floatValue(1)), booleanValue(false));
    assert.deepStrictEqual(
      equalOf(
        {
          baseType: "float",
          cardinality: "multiple",
          values: [{ baseType: "float", value: 1 }],
        },
        floatValue(1),
      ),
      booleanValue(false),
    );
  });
});

describe("map-response", () => {
  it("[I-9b] maps BG010's answers: YORK and york to 0.5, Paris and NULL to 0", () => {
    assert.deepStrictEqual(mapped("CITY", [stringOf("YORK")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("york")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("Paris")]), floatValue(0));
    assert.deepStrictEqual(mapped("CITY", []), floatValue(0));
  });

  it("[I-9b] a value two entries match maps by the first in document order (placeholder while spec §12 Q5 is open)", () => {
    assert.deepStrictEqual(mapped("TIED", [stringOf("York")]), floatValue(0.5));
  });

  it("[I-9b] the bounds clamp a single value, and a NULL response's 0 too", () => {
    assert.deepStrictEqual(mapped("BOUNDED", [stringOf("york")]), floatValue(0.4));
    assert.deepStrictEqual(mapped("BOUNDED", []), floatValue(0.25));
  });

  it("[I-9b] a multiple response sums its distinct values, each once", () => {
    const answer = [identifierOf("A"), identifierOf("A"), identifierOf("C")];

    assert.deepStrictEqual(mapped("CHOICES", answer), floatValue(1.5));
  });

  it("[I-9b] an identifier key keeps its case, and a pair key matches in either order", () => {
    assert.deepStrictEqual(
      mapped("CHOICES", [identifierOf("a"), identifierOf("C")]),
      floatValue(0.5),
    );
    assert.deepStrictEqual(
      mapped("PAIRED", [{ baseType: "pair", value: ["B", "A"] }]),
      floatValue(1),
    );
  });

  it("refuses to map a response with no mapping", () => {
    const failure = failureOf(
      evaluateExpression(
        { identifier: "OPEN", kind: "map-response" },
        item,
        variablesOf(identifierValue("A")),
      ),
    );

    assert.instanceOf(failure, UnmappedResponseError);
    assert.deepStrictEqual(
      { _tag: failure._tag, identifier: failure.identifier },
      { _tag: "UnmappedResponseError", identifier: "OPEN" },
    );
  });
});

describe("map-response-point", () => {
  it("[I-9b] maps a point inside the circle, or on its edge, to 1, and one in no area to the default", () => {
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(102n, 113n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(118n, 113n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(102n, 97n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(200n, 200n)]), floatValue(0.25));
  });

  it("[I-9b] maps an area once however many points it holds, and adds the default once per distinct point in no area", () => {
    assert.deepStrictEqual(
      pointMapped("TARGET", [pointOf(102n, 113n), pointOf(110n, 113n)]),
      floatValue(1),
    );
    assert.deepStrictEqual(
      pointMapped("TARGET", [pointOf(102n, 113n), pointOf(10n, 10n), pointOf(110n, 113n)]),
      floatValue(1.5),
    );
    assert.deepStrictEqual(
      pointMapped("TARGET", [pointOf(200n, 200n), pointOf(300n, 300n), pointOf(200n, 200n)]),
      floatValue(0.5),
    );
  });

  it("[I-9b] a NULL response maps to 0 before the bounds, and the bounds clamp the sum", () => {
    assert.deepStrictEqual(pointMapped("TARGET", []), floatValue(0));
    assert.deepStrictEqual(pointMapped("CLAMPED", []), floatValue(0.5));
    assert.deepStrictEqual(
      pointMapped("CLAMPED", [pointOf(102n, 113n), pointOf(10n, 10n)]),
      floatValue(1.25),
    );
  });

  it("[I-9b] a point two areas hold is mapped by the first listed", () => {
    assert.deepStrictEqual(pointMapped("OVERLAPPING", [pointOf(45n, 35n)]), floatValue(0.5));
    assert.deepStrictEqual(
      pointMapped("OVERLAPPING", [pointOf(45n, 35n), pointOf(55n, 35n)]),
      floatValue(1.5),
    );
  });

  /* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
  it("[I-9b] each shape holds the points on its boundary, and default holds every point", () => {
    const rect = { coords: [10, 20, 30, 40], shape: "rect" } as const;
    const circle = { coords: [0, 0, 5], shape: "circle" } as const;
    const ellipse = { coords: [0, 0, 4, 2], shape: "ellipse" } as const;
    const triangle = { coords: [0, 0, 10, 0, 0, 10], shape: "poly" } as const;
    const closed = { coords: [0, 0, 10, 0, 0, 10, 0, 0], shape: "poly" } as const;
    const cases = [
      [rect, 10n, 20n, true],
      [rect, 30n, 40n, true],
      [rect, 20n, 30n, true],
      [rect, 31n, 40n, false],
      [circle, 3n, 4n, true],
      [circle, 4n, 4n, false],
      [ellipse, 4n, 0n, true],
      [ellipse, 0n, -2n, true],
      [ellipse, 2n, 1n, true],
      [ellipse, 3n, 2n, false],
      [triangle, 0n, 0n, true],
      [triangle, 5n, 5n, true],
      [triangle, 2n, 2n, true],
      [triangle, 6n, 6n, false],
      [triangle, -1n, 0n, false],
      [closed, 5n, 5n, true],
      [closed, 6n, 6n, false],
      [{ coords: [], shape: "default" }, 999n, -5n, true],
    ] as const;

    for (const [entry, x, y, expected] of cases) {
      assert.strictEqual(holds(entry, x, y), expected, `${entry.shape} ${String(x)} ${String(y)}`);
    }
  });
  /* oxlint-enable anti-slop/no-shape-in-symbol-names */

  it("[I-9b] compares a coordinate beyond 2^53 after its one conversion to the nearest double", () => {
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
    const edge = { coords: [0, 0, 9_007_199_254_740_992, 1], shape: "rect" } as const;

    assert.isTrue(holds(edge, 2n ** 53n + 1n, 0n));
    assert.isFalse(holds(edge, 2n ** 53n + 2n, 0n));
  });

  it("refuses to map a point response with no area mapping, naming qti-area-mapping", () => {
    const failure = failureOf(
      evaluateExpression(
        { identifier: "UNMAPPED", kind: "map-response-point" },
        item,
        variablesOf(identifierValue("A")),
      ),
    );

    assert.instanceOf(failure, UnmappedResponseError);
    assert.deepStrictEqual(
      { _tag: failure._tag, identifier: failure.identifier, mapping: failure.mapping },
      { _tag: "UnmappedResponseError", identifier: "UNMAPPED", mapping: "qti-area-mapping" },
    );
  });
});
