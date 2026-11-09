import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { OutcomeMismatchError, UnknownIdentifierError } from "#plate/engine/evaluate.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import { defaultLabel, drawBelow, drawStream } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import type { TestScope } from "#plate/engine/scope.ts";
import {
  checkTemplateDefaults,
  evaluateTemplateDefaults,
  runTemplates,
} from "#plate/engine/template.ts";
import type { TemplateValues } from "#plate/engine/template.ts";
import type { TemplateBranch, TemplateRule } from "#plate/model/expression.ts";
import type {
  Expression,
  Item,
  OutcomeDeclaration,
  ResponseDeclaration,
  TemplateDeclaration,
} from "#plate/model/item.ts";
import type { TemplateDefault, Test } from "#plate/model/test.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { score } from "#plate/score.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Construct a single integer value.
 *
 * @param value The integer.
 * @returns The value.
 */
const integer = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * Construct a single float value.
 *
 * @param value The float.
 * @returns The value.
 */
const float = (value: number): Value => ({
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
const boolean = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

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
 * Construct a `qti-base-value` that gives a value.
 *
 * @param value The value.
 * @returns The expression.
 */
const base = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Construct a `qti-variable` of an identifier.
 *
 * @param name The variable's identifier.
 * @returns The expression.
 */
const variable = (name: string): Expression => ({
  identifier: name,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * Construct a `qti-sum` of two operands.
 *
 * @param left The first operand.
 * @param right The second operand.
 * @returns The expression.
 */
const sum = (left: Expression, right: Expression): Expression => ({
  kind: "sum",
  operands: [left, right],
});

/**
 * Construct a `qti-match` of two operands.
 *
 * @param left The first operand.
 * @param right The second operand.
 * @returns The expression.
 */
const match = (left: Expression, right: Expression): Expression => ({
  kind: "match",
  operands: [left, right],
});

/**
 * Construct a `qti-random-integer` from `min` to `max` in steps of 1, both literals.
 *
 * @param min The least value.
 * @param max The greatest value.
 * @returns The expression, which draws once per value for a range of a power of two.
 */
const randomInteger = (min: bigint, max: bigint): Expression => ({
  kind: "random-integer",
  max: { _tag: "literal", value: max },
  min: { _tag: "literal", value: min },
  operands: [],
  step: { _tag: "literal", value: 1n },
});

/**
 * Construct the `qti-equal` of 1 and 1.25 in the absolute tolerance mode, with a tolerance that
 * names a variable: true for a tolerance of at least 0.25, NULL when the tolerance is not known.
 *
 * @param name The variable the tolerance names.
 * @returns The expression.
 */
const withinTolerance = (name: string): Expression => ({
  includeLowerBound: true,
  includeUpperBound: true,
  kind: "equal",
  operands: [base(float(1)), base(float(1.25))],
  tolerance: [{ _tag: "ref", identifier: name }],
  toleranceMode: "absolute",
});

/**
 * The `qti-null` expression, a NULL of a single string.
 */
const nothing: Expression = { kind: "null", operands: [] };

/**
 * Construct a `qti-set-template-value`.
 *
 * @param name The template variable's identifier.
 * @param expression The expression whose value it takes.
 * @returns The rule.
 */
const setTemplate = (name: string, expression: Expression): TemplateRule => ({
  expression,
  identifier: name,
  kind: "set-template-value",
});

/**
 * Construct a `qti-set-correct-response`.
 *
 * @param name The response's identifier.
 * @param expression The expression whose value its correct response takes.
 * @returns The rule.
 */
const setCorrect = (name: string, expression: Expression): TemplateRule => ({
  expression,
  identifier: name,
  kind: "set-correct-response",
});

/**
 * Construct a `qti-set-default-value`.
 *
 * @param name The response's or outcome's identifier.
 * @param expression The expression whose value its default takes.
 * @returns The rule.
 */
const setDefault = (name: string, expression: Expression): TemplateRule => ({
  expression,
  identifier: name,
  kind: "set-default-value",
});

/**
 * Construct a `qti-template-constraint`.
 *
 * @param expression Its condition.
 * @returns The rule.
 */
const constraint = (expression: Expression): TemplateRule => ({
  expression,
  kind: "template-constraint",
});

/**
 * The `qti-exit-template` rule.
 */
const exit: TemplateRule = { kind: "exit-template" };

/**
 * Construct a `qti-template-if` or `qti-template-else-if` part.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
const branch = (when: Expression, then: readonly TemplateRule[]): TemplateBranch => ({
  // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name section 0.5 of the phase-8 slice list fixes; it is an array, never a function.
  then,
  when,
});

/**
 * Construct a `qti-template-condition`.
 *
 * @param branches Its `qti-template-if` and `qti-template-else-if` parts, in order.
 * @param otherwise Its `qti-template-else` rules, when it has one.
 * @returns The rule.
 */
const condition = (
  branches: readonly TemplateBranch[],
  otherwise?: readonly TemplateRule[],
): TemplateRule => ({
  branches,
  kind: "template-condition",
  otherwise: Option.fromUndefinedOr(otherwise),
});

/**
 * Construct a template declaration of a single value.
 *
 * @param name Its identifier.
 * @param baseType Its base type.
 * @param defaultValue Its `qti-default-value`, when it has one.
 * @returns The declaration.
 */
const template = (
  name: string,
  baseType: TemplateDeclaration["baseType"],
  defaultValue?: Value,
): TemplateDeclaration => ({
  baseType,
  cardinality: "single",
  defaultValue: Option.fromUndefinedOr(defaultValue),
  identifier: name,
  mathVariable: false,
  paramVariable: false,
});

/**
 * The item's one response, a single identifier with no correct response and no default.
 */
const responseDeclaration: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * The item's one outcome, a single float whose declared default is 0.5.
 */
const scoreDeclaration: OutcomeDeclaration = {
  baseType: "float",
  cardinality: "single",
  defaultValue: Option.some(float(0.5)),
  identifier: "SCORE",
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
};

/**
 * Construct the hand-built item whose template processing is the given rules: a response
 * `RESPONSE`, an outcome `SCORE`, the integer template variables `T` (default 3) and `U` (no
 * default), and the boolean template variables `B` and `C` (no default).
 *
 * @param rules The template rules.
 * @returns The item.
 */
const itemOf = (rules: readonly TemplateRule[]): Item => ({
  body: [],
  document: "items/template.xml",
  identifier: "templated",
  lang: Option.none(),
  outcomes: new Map([["SCORE", scoreDeclaration]]),
  processing: Option.none(),
  responses: new Map([["RESPONSE", responseDeclaration]]),
  templateProcessing: Option.some(rules),
  templates: new Map([
    ["T", template("T", "integer", integer(3n))],
    ["U", template("U", "integer")],
    ["B", template("B", "boolean")],
    ["C", template("C", "boolean")],
  ]),
  title: "Templated",
  unsupported: [],
});

/**
 * A stream that counts the draws taken from it.
 */
interface Counting {
  /**
   * Give the number of draws taken so far.
   *
   * @returns The count.
   */
  readonly count: () => number;
  readonly draw: Draw;
}

/**
 * Wrap a stream so a test can count the draws taken from it.
 *
 * @param draw The stream.
 * @returns The counting stream and a reader of its count so far.
 */
const counting = (draw: Draw): Counting => {
  let taken = 0;

  return {
    count: () => taken,
    draw: () => {
      taken += 1;

      return draw();
    },
  };
};

/**
 * Construct a stream that gives the listed words in order, then 0.
 *
 * @param words The draws to give.
 * @returns The stream.
 */
const scripted = (words: readonly number[]): Draw => {
  let next = 0;

  return () => {
    const word = words[next] ?? 0;
    next += 1;

    return word;
  };
};

/**
 * Run the item's template processing, as the item {@link itemOf} builds for the rules holds it.
 *
 * @param rules The template rules.
 * @param draw The stream; a fixed label's, under the seed `""`, when none is given.
 * @returns What the run leaves, or its failure.
 */
const run = (
  rules: readonly TemplateRule[],
  draw: Draw = drawStream("", "template test"),
): Result.Result<TemplateValues, EngineFailure> => runTemplates(itemOf(rules), rules, draw);

/**
 * Give what a run leaves, after checking that it succeeded.
 *
 * @param result The run's result.
 * @returns The values.
 */
const values = (result: Result.Result<TemplateValues, EngineFailure>): TemplateValues => {
  assert.isTrue(Result.isSuccess(result));

  return Result.getOrThrow(result);
};

/**
 * Give the failure a run returns, after checking that it failed.
 *
 * @param result The run's result.
 * @returns The failure.
 */
const failure = (result: Result.Result<TemplateValues, EngineFailure>): EngineFailure => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("runTemplates", () => {
  it("[I-5] starts each template variable at its declared default, else NULL of its type, with no correct response or default set", () => {
    const left = values(run([]));

    assert.deepStrictEqual(left, {
      correct: {},
      defaults: {},
      templates: {
        B: nullOf("boolean", "single"),
        C: nullOf("boolean", "single"),
        T: integer(3n),
        U: nullOf("integer", "single"),
      },
    });
  });

  it("[I-5] runs the rules in order, each seeing the value the rules before it left, a variable its own earlier value", () => {
    const left = values(
      run([
        setTemplate("T", sum(variable("T"), base(integer(1n)))),
        setTemplate("U", sum(variable("T"), variable("T"))),
      ]),
    );

    assert.deepStrictEqual(left.templates["T"], integer(4n));
    assert.deepStrictEqual(left.templates["U"], integer(8n));
  });

  it("[I-5] ends the run at a qti-exit-template, nested or not, keeping what the rules before it set", () => {
    const left = values(
      run([
        setTemplate("T", base(integer(5n))),
        setCorrect("RESPONSE", base(identifier("A"))),
        condition([branch(base(boolean(true)), [exit])]),
        setTemplate("T", base(integer(6n))),
        setTemplate("U", base(integer(1n))),
      ]),
    );

    assert.deepStrictEqual(left.templates["T"], integer(5n));
    assert.deepStrictEqual(left.templates["U"], nullOf("integer", "single"));
    assert.deepStrictEqual(left.correct, { RESPONSE: identifier("A") });
  });

  it("[I-5] runs a condition's first branch whose condition is true, past a NULL and a false one, and evaluates no later branch", () => {
    const left = values(
      run([
        condition(
          [
            branch(nothing, [setTemplate("T", base(integer(1n)))]),
            branch(base(boolean(false)), [setTemplate("T", base(integer(2n)))]),
            branch(base(boolean(true)), [setTemplate("T", base(integer(4n)))]),
            branch(variable("NOWHERE"), [setTemplate("T", base(integer(5n)))]),
          ],
          [setTemplate("T", base(integer(6n)))],
        ),
      ]),
    );

    assert.deepStrictEqual(left.templates["T"], integer(4n));
  });

  it("[I-5] runs a condition's otherwise when no branch's condition is true", () => {
    const left = values(
      run([
        condition(
          [branch(base(boolean(false)), [setTemplate("T", base(integer(2n)))])],
          [setTemplate("T", base(integer(6n)))],
        ),
      ]),
    );

    assert.deepStrictEqual(left.templates["T"], integer(6n));
  });

  it("[I-5] restarts from declared state at a failing constraint, drawing new values from the same stream until it passes", () => {
    const key = "constraint 11";
    const replay = drawStream("", key);
    const drawn = [drawBelow(replay, 8n), drawBelow(replay, 8n), drawBelow(replay, 8n)];
    const stream = counting(drawStream("", key));
    const left = values(
      run(
        [
          setTemplate("T", randomInteger(0n, 7n)),
          constraint(match(variable("T"), base(integer(7n)))),
        ],
        stream.draw,
      ),
    );

    assert.deepStrictEqual(drawn, [0n, 2n, 7n]);
    assert.strictEqual(stream.count(), 3);
    assert.deepStrictEqual(left.templates["T"], integer(7n));
  });

  it("[I-5] empties both override maps at a restart", () => {
    const stream = counting(scripted([0, 1]));
    const left = values(
      run(
        [
          setTemplate("T", randomInteger(0n, 1n)),
          condition([
            branch(match(variable("T"), base(integer(0n))), [
              setCorrect("RESPONSE", base(identifier("A"))),
              setDefault("SCORE", base(float(1))),
            ]),
          ]),
          constraint(match(variable("T"), base(integer(1n)))),
        ],
        stream.draw,
      ),
    );

    assert.strictEqual(stream.count(), 2);
    assert.deepStrictEqual(left, {
      correct: {},
      defaults: {},
      templates: {
        B: nullOf("boolean", "single"),
        C: nullOf("boolean", "single"),
        T: integer(1n),
        U: nullOf("integer", "single"),
      },
    });
  });

  it("[I-5] runs exactly 100 restarts for a constraint that never passes, then applies the declared defaults and runs the rules after it", () => {
    const stream = counting(drawStream("", "never"));
    const left = values(
      run(
        [
          setTemplate("T", randomInteger(0n, 7n)),
          constraint(base(boolean(false))),
          setTemplate("U", sum(variable("T"), base(integer(10n)))),
        ],
        stream.draw,
      ),
    );

    assert.strictEqual(stream.count(), 101);
    assert.deepStrictEqual(left.templates["T"], integer(3n));
    assert.deepStrictEqual(left.templates["U"], integer(13n));
  });

  it("[I-5] applies the declared state again at a later failing constraint once the restarts are spent, and restarts no more", () => {
    const stream = counting(drawStream("", "never"));
    const left = values(
      run(
        [
          setTemplate("T", randomInteger(0n, 7n)),
          setCorrect("RESPONSE", base(identifier("A"))),
          constraint(nothing),
          setTemplate("T", base(integer(9n))),
          setCorrect("RESPONSE", base(identifier("B"))),
          setDefault("SCORE", base(float(1))),
          constraint(base(boolean(false))),
          setTemplate("U", variable("T")),
        ],
        stream.draw,
      ),
    );

    assert.strictEqual(stream.count(), 101);
    assert.deepStrictEqual(left.templates["T"], integer(3n));
    assert.deepStrictEqual(left.templates["U"], integer(3n));
    assert.deepStrictEqual(left.correct, {});
    assert.deepStrictEqual(left.defaults, {});
  });

  it("[I-5] puts what qti-set-correct-response and qti-set-default-value set in the result's maps and leaves the item unchanged", () => {
    const rules = [
      setCorrect("RESPONSE", base(identifier("B"))),
      setDefault("SCORE", base(float(1))),
      setDefault("RESPONSE", base(identifier("A"))),
    ];
    const item = itemOf(rules);
    const left = values(runTemplates(item, rules, drawStream("", "template test")));

    assert.deepStrictEqual(left.correct, { RESPONSE: identifier("B") });
    assert.deepStrictEqual(left.defaults, { RESPONSE: identifier("A"), SCORE: float(1) });
    assert.strictEqual(item.responses.get("RESPONSE"), responseDeclaration);
    assert.isTrue(Option.isNone(responseDeclaration.correct));
    assert.isTrue(Option.isNone(responseDeclaration.defaultValue));
    assert.strictEqual(item.outcomes.get("SCORE"), scoreDeclaration);
    assert.deepStrictEqual(scoreDeclaration.defaultValue, Option.some(float(0.5)));
  });

  it("[I-5] gives NULL for a qti-equal whose tolerance names an outcome, as template processing holds no outcome value, and reads a template variable's (OD-P8-20)", () => {
    const left = values(
      run([setTemplate("B", withinTolerance("SCORE")), setTemplate("C", withinTolerance("T"))]),
    );

    assert.deepStrictEqual(left.templates["B"], nullOf("boolean", "single"));
    assert.deepStrictEqual(left.templates["C"], boolean(true));
  });

  it("[I-5] fails a qti-variable of an outcome as the record's gap, as template processing holds no response or outcome value", () => {
    const left = failure(run([setTemplate("U", variable("SCORE"))]));

    assert.deepStrictEqual(
      left,
      new UnknownIdentifierError({ holder: "record", identifier: "SCORE", role: "variable" }),
    );
  });

  it("[I-5] stores a NULL as the target's own NULL, of its declared base type and cardinality", () => {
    const left = values(
      run([
        setTemplate("T", nothing),
        setCorrect("RESPONSE", nothing),
        setDefault("SCORE", nothing),
      ]),
    );

    assert.deepStrictEqual(left.templates["T"], nullOf("integer", "single"));
    assert.deepStrictEqual(left.correct, { RESPONSE: nullOf("identifier", "single") });
    assert.deepStrictEqual(left.defaults, { SCORE: nullOf("float", "single") });
  });

  it("[I-5] fails a set to a value of another type, as qti-set-outcome-value fails", () => {
    assert.deepStrictEqual(
      failure(run([setTemplate("T", base(float(1.5)))])),
      new OutcomeMismatchError({
        actual: "float single",
        expected: "integer single",
        identifier: "T",
      }),
    );
    assert.deepStrictEqual(
      failure(run([setCorrect("RESPONSE", base(integer(1n)))])),
      new OutcomeMismatchError({
        actual: "integer single",
        expected: "identifier single",
        identifier: "RESPONSE",
      }),
    );
  });

  it("[I-5] fails a set of a variable the item does not declare in the kind the rule sets", () => {
    assert.deepStrictEqual(
      failure(run([setTemplate("NOWHERE", base(integer(1n)))])),
      new UnknownIdentifierError({ holder: "item", identifier: "NOWHERE", role: "variable" }),
    );
    assert.deepStrictEqual(
      failure(run([setCorrect("SCORE", base(float(1)))])),
      new UnknownIdentifierError({ holder: "item", identifier: "SCORE", role: "response" }),
    );
    assert.deepStrictEqual(
      failure(run([setDefault("T", base(integer(1n)))])),
      new UnknownIdentifierError({ holder: "item", identifier: "T", role: "variable" }),
    );
  });
});

/**
 * Construct a single string value.
 *
 * @param value The string.
 * @returns The value.
 */
const string = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * Construct an item ref's `qti-template-default`.
 *
 * @param templateIdentifier The template variable it sets.
 * @param expression The expression the test evaluates for it.
 * @returns The default.
 */
const templateDefault = (templateIdentifier: string, expression: Expression): TemplateDefault => ({
  expression,
  templateIdentifier,
});

/**
 * The test's one outcome, `TOTAL`, a single integer with no declared default.
 */
const totalDeclaration: OutcomeDeclaration = {
  ...scoreDeclaration,
  baseType: "integer",
  defaultValue: Option.none(),
  identifier: "TOTAL",
};

/**
 * The test holder a template default reads: the outcome `TOTAL`.
 */
const defaultsTest: Pick<Test, "outcomes"> = { outcomes: new Map([["TOTAL", totalDeclaration]]) };

/**
 * A test scope with no item, no part and no time, as a template default's scope holds none.
 */
const defaultsScope: TestScope = {
  declared: new Set(["TOTAL"]),
  duration: Option.none(),
  items: [],
  parts: new Map(),
  sections: new Map(),
};

/**
 * The instance whose template defaults the cases draw.
 */
const defaultsInstance = "t1";

/**
 * Evaluate an item ref's template defaults over {@link defaultsTest} and {@link defaultsScope},
 * with `TOTAL` at 5.
 *
 * @param defaults The item ref's template defaults.
 * @param draw The stream; the default label's for the sequence index 2, under the seed `"s"`, when
 *   none is given.
 * @returns The defaults' values, or the first failure.
 */
const evaluated = (
  defaults: readonly TemplateDefault[],
  draw: Draw = drawStream("s", defaultLabel(defaultsInstance, 2)),
): Result.Result<Readonly<Record<string, Value>>, EngineFailure> =>
  evaluateTemplateDefaults(defaults, defaultsTest, { TOTAL: integer(5n) }, defaultsScope, draw);

/**
 * The range of {@link wideDraw}: a million integers, so two draws almost never agree.
 */
const wideCount = 1_000_000n;

/**
 * A `qti-random-integer` over {@link wideCount} integers, from 0.
 */
const wideDraw: Expression = randomInteger(0n, wideCount - 1n);

/**
 * Give the defaults' values, after checking that their evaluation succeeded.
 *
 * @param result The evaluation's result.
 * @returns The values.
 */
const defaultsOf = (
  result: Result.Result<Readonly<Record<string, Value>>, EngineFailure>,
): Readonly<Record<string, Value>> => {
  assert.isTrue(Result.isSuccess(result));

  return Result.getOrThrow(result);
};

/**
 * Give the failure an evaluation or a check returns, after checking that it failed.
 *
 * @param result The result.
 * @returns The failure.
 */
const failed = <A>(result: Result.Result<A, EngineFailure>): EngineFailure => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("template defaults in template processing", () => {
  it("[T-9] starts a template variable at the declared state the test sets, before the item's template processing reads it", () => {
    const rules = [setTemplate("U", sum(variable("T"), base(integer(1n))))];
    const left = values(
      runTemplates(itemOf(rules), rules, drawStream("", "template test"), { T: integer(10n) }),
    );

    assert.deepStrictEqual(left.templates["T"], integer(10n));
    assert.deepStrictEqual(left.templates["U"], integer(11n));
  });

  it("[T-9] returns a constraint's restart, and a spent budget, to the declared state the test sets, not the declaration's default", () => {
    const key = "constraint 11";
    const restarting = [
      setTemplate("U", variable("T")),
      setTemplate("T", randomInteger(0n, 7n)),
      constraint(match(variable("T"), base(integer(7n)))),
    ];
    const restarted = values(
      runTemplates(itemOf(restarting), restarting, drawStream("", key), { T: integer(10n) }),
    );
    const spending = [
      setTemplate("T", randomInteger(0n, 7n)),
      constraint(base(boolean(false))),
      setTemplate("U", variable("T")),
    ];
    const stream = counting(drawStream("", "never"));
    const spent = values(
      runTemplates(itemOf(spending), spending, stream.draw, { T: integer(10n) }),
    );

    // The stream draws 0, 2 and 7, so the run restarts twice; each pass reads `T` before it draws.
    assert.deepStrictEqual(restarted.templates["T"], integer(7n));
    assert.deepStrictEqual(restarted.templates["U"], integer(10n));
    assert.strictEqual(stream.count(), 101);
    assert.deepStrictEqual(spent.templates["T"], integer(10n));
    assert.deepStrictEqual(spent.templates["U"], integer(10n));
  });

  it("[T-9] keeps a NULL default as the variable's own NULL in the declared state the test sets", () => {
    const left = values(
      runTemplates(itemOf([]), [], drawStream("", "template test"), {
        T: nullOf("string", "single"),
      }),
    );

    assert.deepStrictEqual(left.templates["T"], nullOf("integer", "single"));
  });

  it("[T-9] fails a default that does not fit the declared state the test sets: a key that names no template variable, a value of another type", () => {
    const item = itemOf([]);
    const unknown = new UnknownIdentifierError({
      holder: "item",
      identifier: "NOWHERE",
      role: "variable",
    });
    const response = new UnknownIdentifierError({
      holder: "item",
      identifier: "RESPONSE",
      role: "variable",
    });
    const mismatch = new OutcomeMismatchError({
      actual: "string single",
      expected: "integer single",
      identifier: "T",
    });

    assert.deepStrictEqual(failed(checkTemplateDefaults(item, { NOWHERE: integer(1n) })), unknown);
    assert.deepStrictEqual(
      failed(checkTemplateDefaults(item, { RESPONSE: identifier("A") })),
      response,
    );
    assert.deepStrictEqual(failed(checkTemplateDefaults(item, { T: string("seven") })), mismatch);
    assert.deepStrictEqual(
      failure(runTemplates(item, [], drawStream("", "template test"), { NOWHERE: integer(1n) })),
      unknown,
    );
    assert.deepStrictEqual(
      failure(runTemplates(item, [], drawStream("", "template test"), { T: string("seven") })),
      mismatch,
    );
    assert.deepStrictEqual(
      defaultsOf(checkTemplateDefaults(item, { T: integer(10n), U: nullOf("float", "single") })),
      { T: integer(10n), U: nullOf("integer", "single") },
    );
  });

  it("[T-9] evaluates the declared state the test sets in document order from one stream, the first and second draws", () => {
    const replay = drawStream("s", defaultLabel(defaultsInstance, 2));
    const first = drawBelow(replay, wideCount);
    const second = drawBelow(replay, wideCount);
    const left = defaultsOf(
      evaluated([templateDefault("T", wideDraw), templateDefault("U", wideDraw)]),
    );

    assert.notStrictEqual(first, second);
    assert.deepStrictEqual(left, { T: integer(first), U: integer(second) });
  });

  it("[T-9] draws the declared state the test sets from the label's stream under the seed, not from the default key's", () => {
    const keyed = drawBelow(drawStream("s", defaultLabel(defaultsInstance, 2)), wideCount);
    const unkeyed = drawBelow(drawStream("", ""), wideCount);
    const left = defaultsOf(evaluated([templateDefault("T", wideDraw)]));

    assert.notStrictEqual(keyed, unkeyed);
    assert.deepStrictEqual(left, { T: integer(keyed) });
  });

  it("[T-9] reads a test outcome's current value, unprefixed, into the declared state the test sets", () => {
    const left = defaultsOf(
      evaluated([templateDefault("T", sum(variable("TOTAL"), base(integer(1n))))]),
    );

    assert.deepStrictEqual(left, { T: integer(6n) });
  });

  it("[T-9] fails a name the test's processing does not hold as the record's gap, ending the declared state the test sets", () => {
    const stream = counting(drawStream("s", defaultLabel(defaultsInstance, 2)));
    const left = failed(
      evaluated(
        [templateDefault("T", variable("NOWHERE")), templateDefault("U", wideDraw)],
        stream.draw,
      ),
    );

    assert.deepStrictEqual(
      left,
      new UnknownIdentifierError({ holder: "record", identifier: "NOWHERE", role: "variable" }),
    );
    assert.strictEqual(stream.count(), 0);
  });
});

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

describe("align-54 built-ins by kind: template processing sets a built-in's correct response or default (reading 111)", () => {
  it("align-54 built-ins by kind E22a: records a correct response of numAttempts and a default of numAttempts and of completionStatus, typed as the built-in", () => {
    const left = values(
      run([
        setCorrect("numAttempts", base(integer(7n))),
        setDefault("numAttempts", nothing),
        setDefault("completionStatus", base(identifier("completed"))),
      ]),
    );

    assert.deepStrictEqual(
      [left.correct, left.defaults],
      [
        { numAttempts: integer(7n) },
        { completionStatus: identifier("completed"), numAttempts: nullOf("integer", "single") },
      ],
    );
  });

  it("align-54 built-ins by kind E22a: still fails a set of a built-in of another kind, or to a value of another type than the built-in's", () => {
    assert.deepStrictEqual(
      [
        failure(run([setCorrect("completionStatus", base(identifier("completed")))])),
        failure(run([setTemplate("numAttempts", base(integer(1n)))])),
        failure(run([setDefault("numAttempts", base(float(1.5)))])),
      ],
      [
        new UnknownIdentifierError({
          holder: "item",
          identifier: "completionStatus",
          role: "response",
        }),
        new UnknownIdentifierError({ holder: "item", identifier: "numAttempts", role: "variable" }),
        new OutcomeMismatchError({
          actual: "float single",
          expected: "integer single",
          identifier: "numAttempts",
        }),
      ],
    );
  });

  it.effect(
    "align-54 built-ins by kind E22a: begin and score of an accepted item read back the defaults its template processing set for numAttempts and completionStatus, while the count and the built-in outcome start as an attempt gives them",
    () =>
      Effect.gen(function* readsBackBuiltInDefaults() {
        const record = yield* scoredBuiltIns(
          '<qti-outcome-declaration identifier="N" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="C" cardinality="single" base-type="identifier"/><qti-template-processing><qti-set-default-value identifier="numAttempts"><qti-base-value base-type="integer">5</qti-base-value></qti-set-default-value><qti-set-default-value identifier="completionStatus"><qti-base-value base-type="identifier">completed</qti-base-value></qti-set-default-value></qti-template-processing><qti-item-body><p>x</p></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="N"><qti-default identifier="numAttempts"/></qti-set-outcome-value><qti-set-outcome-value identifier="C"><qti-default identifier="completionStatus"/></qti-set-outcome-value></qti-response-processing>',
        );

        assert.deepStrictEqual(
          [
            record.outcomes["N"],
            record.outcomes["C"],
            record.numAttempts,
            record.outcomes["completionStatus"],
          ],
          [integer(5n), identifier("completed"), 1, identifier("unknown")],
        );
      }),
  );
});
