import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
  evaluateExpression,
  runRules,
} from "#plate/engine/evaluate.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type {
  Branch,
  Expression,
  Item,
  Mapping,
  OutcomeDeclaration,
  ResponseDeclaration,
  Rule,
} from "#plate/model/item.ts";
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
  baseType: "string",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "CITY",
  mapping: Option.some(yorkMapping),
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
    ["BOUNDED", bounded],
    ["CHOICES", choices],
    ["PAIRED", paired],
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
  evaluateExpression({ identifier, kind: "map-response" }, item, {
    ...variablesOf(identifierValue("A")),
    responses: { [identifier]: answerOf(identifier, values) },
  });

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

describe("runRules", () => {
  it("[I-9b] a match with a NULL response takes the else branch", () => {
    const after = runRules(
      matchCorrect,
      item,
      variablesOf(nullOf("identifier", "single"), floatValue(1)),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0));
  });

  it("[I-9b] a match with the correct identifier takes the if branch", () => {
    const after = runRules(matchCorrect, item, variablesOf(identifierValue("true")));

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(1));
  });

  it("[I-9b] set-outcome writes a float and leaves the responses as they were", () => {
    const before = variablesOf(identifierValue("false"));
    const after = runRules([setOutcome("SCORE", base(floatValue(2.5)))], item, before);

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
    const after = runRules(rules, item, variablesOf(identifierValue("B")));

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0.5));
  });

  it("[I-9b] a rule reads the outcome an earlier rule set", () => {
    const rules = [
      setOutcome("EMPTY", { kind: "is-null", operand: variable("RESPONSE") }),
      condition([branchOf(variable("EMPTY"), [setOutcome("SCORE", base(floatValue(0.5)))])]),
    ];
    const after = runRules(rules, item, variablesOf(nullOf("identifier", "single")));

    assert.deepStrictEqual(after.outcomes["EMPTY"], booleanValue(true));
    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0.5));
  });

  it("[I-9b] a condition with no true branch and no else changes nothing", () => {
    const rules = [
      condition([branchOf(variable("EMPTY"), [setOutcome("SCORE", base(floatValue(1)))])]),
    ];
    const before = variablesOf(identifierValue("A"), floatValue(0.25));

    assert.deepStrictEqual(runRules(rules, item, before), before);
  });

  it("refuses to set an outcome to a value of another base type", () => {
    const integerOne: Value = {
      baseType: "integer",
      cardinality: "single",
      values: [{ baseType: "integer", value: 1 }],
    };

    assert.throws(() => {
      runRules([setOutcome("SCORE", base(integerOne))], item, variablesOf(identifierValue("A")));
    }, OutcomeMismatchError);
  });

  it("refuses an outcome or a variable the item does not declare", () => {
    assert.throws(() => {
      runRules(
        [setOutcome("RESPONSE", base(floatValue(1)))],
        item,
        variablesOf(identifierValue("A")),
      );
    }, UnknownIdentifierError);
    assert.throws(() => {
      runRules([setOutcome("SCORE", variable("MISSING"))], item, variablesOf(identifierValue("A")));
    }, UnknownIdentifierError);
  });
});

describe("evaluateExpression", () => {
  it("[I-9b] is-null on NULL is true", () => {
    const value = evaluateExpression(
      { kind: "is-null", operand: variable("RESPONSE") },
      item,
      variablesOf(nullOf("identifier", "single")),
    );

    assert.deepStrictEqual(value, booleanValue(true));
  });

  it("[I-9b] a match with a NULL side is NULL", () => {
    const value = evaluateExpression(
      { kind: "match", operands: [variable("OPEN"), base(identifierValue("A"))] },
      item,
      variablesOf(identifierValue("A")),
    );

    assert.deepStrictEqual(value, nullOf("boolean", "single"));
  });

  it("[I-9b] correct is the declared correct response, or NULL of the declared type", () => {
    const variables = variablesOf(identifierValue("A"));

    assert.deepStrictEqual(
      evaluateExpression({ identifier: "RESPONSE", kind: "correct" }, item, variables),
      identifierValue("true"),
    );
    assert.deepStrictEqual(
      evaluateExpression({ identifier: "OPEN", kind: "correct" }, item, variables),
      nullOf("identifier", "single"),
    );
  });

  it("[I-9b] a variable reads a response or an outcome", () => {
    const variables = variablesOf(identifierValue("A"), floatValue(0.75));

    assert.deepStrictEqual(
      evaluateExpression(variable("RESPONSE"), item, variables),
      identifierValue("A"),
    );
    assert.deepStrictEqual(
      evaluateExpression(variable("SCORE"), item, variables),
      floatValue(0.75),
    );
  });

  it("refuses a variable named like an Object.prototype member", () => {
    assert.throws(() => {
      evaluateExpression(variable("constructor"), item, variablesOf(identifierValue("A")));
    }, UnknownIdentifierError);
  });
});

describe("map-response", () => {
  it("[I-9b] maps BG010's answers: YORK and york to 0.5, Paris and NULL to 0", () => {
    assert.deepStrictEqual(mapped("CITY", [stringOf("YORK")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("york")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("Paris")]), floatValue(0));
    assert.deepStrictEqual(mapped("CITY", []), floatValue(0));
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
    assert.throws(() => {
      evaluateExpression(
        { identifier: "OPEN", kind: "map-response" },
        item,
        variablesOf(identifierValue("A")),
      );
    }, UnmappedResponseError);
  });
});
