import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  OutcomeMismatchError,
  UnknownIdentifierError,
  evaluateExpression,
  runRules,
} from "#plate/engine/evaluate.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type {
  Branch,
  Expression,
  Item,
  OutcomeDeclaration,
  ResponseDeclaration,
  Rule,
} from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

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
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * A single identifier response with no correct response.
 */
const open: ResponseDeclaration = { ...response, correct: Option.none(), identifier: "OPEN" };

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
