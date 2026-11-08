import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
  evaluateExpression,
  evaluators,
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
import { match, nullOf, parseLexical } from "#plate/model/values.ts";
import type { ModelledBaseType, Single, Value } from "#plate/model/values.ts";
import { expressionKinds } from "#plate/model/expression.ts";

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

/**
 * Construct a multiple response with a mapping.
 *
 * @param identifier The response's identifier.
 * @param baseType Its base type.
 * @param mapping Its mapping.
 * @returns The declaration.
 */
const mappedMultiple = (
  identifier: string,
  baseType: ModelledBaseType,
  mapping: Mapping,
): ResponseDeclaration => ({
  areaMapping: Option.none(),
  baseType,
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier,
  mapping: Option.some(mapping),
});

/**
 * A multiple string response with BG010's mapping.
 */
const strings = mappedMultiple("STRINGS", "string", yorkMapping);

/**
 * A multiple integer response mapping 5 to 1; every other integer maps to 0.25.
 */
const integers = mappedMultiple("INTEGERS", "integer", {
  defaultValue: 0.25,
  entries: [{ caseSensitive: false, key: { baseType: "integer", value: 5n }, value: 1 }],
  lowerBound: Option.none(),
  upperBound: Option.none(),
});

/**
 * A multiple float response mapping 1 to 1; every other float maps to 0.125.
 */
const floats = mappedMultiple("FLOATS", "float", {
  defaultValue: 0.125,
  entries: [{ caseSensitive: false, key: { baseType: "float", value: 1 }, value: 1 }],
  lowerBound: Option.none(),
  upperBound: Option.none(),
});

/**
 * A multiple pair response mapping the pair `A B` to 1; every other pair maps to 0.5.
 */
const pairs = mappedMultiple("PAIRS", "pair", {
  defaultValue: 0.5,
  entries: [{ caseSensitive: false, key: { baseType: "pair", value: ["A", "B"] }, value: 1 }],
  lowerBound: Option.none(),
  upperBound: Option.none(),
});

/**
 * A multiple directed pair response mapping `A B` to 1; every other directed pair, `B A` among
 * them, maps to 0.5.
 */
const directed = mappedMultiple("DIRECTED", "directedPair", {
  defaultValue: 0.5,
  entries: [
    { caseSensitive: false, key: { baseType: "directedPair", value: ["A", "B"] }, value: 1 },
  ],
  lowerBound: Option.none(),
  upperBound: Option.none(),
});

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
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
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
    ["STRINGS", strings],
    ["INTEGERS", integers],
    ["FLOATS", floats],
    ["PAIRS", pairs],
    ["DIRECTED", directed],
    ["TARGET", target],
    ["CLAMPED", clamped],
    ["OVERLAPPING", overlapping],
    ["UNMAPPED", unmapped],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
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
const variable = (identifier: string): Expression => ({
  identifier,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * Construct a `qti-base-value`.
 *
 * @param value The value.
 * @returns The expression.
 */
const base = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

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
    evaluateExpression({ identifier, kind: "map-response", operands: [] }, item, {
      ...variablesOf(identifierValue("A")),
      responses: { [identifier]: answerOf(identifier, values) },
    }),
  );

/**
 * Read each lexical form as a value of a base type, as a post's members are read.
 *
 * @param baseType The base type.
 * @param lexicals The lexical forms, as written.
 * @returns The values, in order.
 */
const written = (baseType: ModelledBaseType, lexicals: readonly string[]): readonly Single[] =>
  lexicals.map((lexical) => Result.getOrThrow(parseLexical(baseType, lexical)));

/**
 * Drop repeated values as the evaluator did before it keyed them: each value against every value
 * kept before it, as `match` compares two single values. It is the reference the keyed dedupe must
 * agree with.
 *
 * @param values The values.
 * @returns The values no earlier value matches, in order.
 */
const pairwiseDistinct = (values: readonly Single[]): readonly Single[] =>
  Arr.dedupeWith(values, (left, right) =>
    match(
      { baseType: left.baseType, cardinality: "single", values: [left] },
      { baseType: right.baseType, cardinality: "single", values: [right] },
    ),
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
    evaluateExpression({ identifier, kind: "map-response-point", operands: [] }, item, {
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
      { identifier: "AREA", kind: "map-response-point", operands: [] },
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
          operands: [
            variable("RESPONSE"),
            { identifier: "RESPONSE", kind: "correct", operands: [] },
          ],
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

  it("set-outcome writes a float and leaves the responses as they were", () => {
    const before = variablesOf(identifierValue("false"));
    const after = Result.getOrThrow(
      runRules([setOutcome("SCORE", base(floatValue(2.5)))], item, before),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(2.5));
    assert.deepStrictEqual(after.responses, before.responses);
  });

  it("an else-if branch runs when the first fails", () => {
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

  it("a rule reads the outcome an earlier rule set", () => {
    const rules = [
      setOutcome("EMPTY", { kind: "is-null", operands: [variable("RESPONSE")] }),
      condition([branchOf(variable("EMPTY"), [setOutcome("SCORE", base(floatValue(0.5)))])]),
    ];
    const after = Result.getOrThrow(
      runRules(rules, item, variablesOf(nullOf("identifier", "single"))),
    );

    assert.deepStrictEqual(after.outcomes["EMPTY"], booleanValue(true));
    assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(0.5));
  });

  it("a condition with no true branch and no else changes nothing", () => {
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

/**
 * `GRADE`'s match table: 1 maps to `A`, 2 to `B`, and every other integer to `F`.
 */
const grade: OutcomeDeclaration = {
  ...score,
  baseType: "identifier",
  identifier: "GRADE",
  lookupTable: Option.some({
    defaultValue: Option.some(identifierOf("F")),
    entries: [
      { sourceValue: 1n, targetValue: identifierOf("A") },
      { sourceValue: 2n, targetValue: identifierOf("B") },
    ],
    kind: "match",
  }),
};

/**
 * `LEVEL`'s match table, with no `default-value`: 1 maps to `A`.
 */
const level: OutcomeDeclaration = {
  ...grade,
  identifier: "LEVEL",
  lookupTable: Option.some({
    defaultValue: Option.none(),
    entries: [{ sourceValue: 1n, targetValue: identifierOf("A") }],
    kind: "match",
  }),
};

/**
 * `BAND`'s interpolation table, in document order: at or above 7.5 is `HIGH`; above 2, the
 * boundary excluded, `MID`; at or above 0 `LOW`; anything else `NONE`.
 */
const band: OutcomeDeclaration = {
  ...grade,
  identifier: "BAND",
  lookupTable: Option.some({
    defaultValue: Option.some(identifierOf("NONE")),
    entries: [
      { includeBoundary: true, sourceValue: 7.5, targetValue: identifierOf("HIGH") },
      { includeBoundary: false, sourceValue: 2, targetValue: identifierOf("MID") },
      { includeBoundary: true, sourceValue: 0, targetValue: identifierOf("LOW") },
    ],
    kind: "interpolation",
  }),
};

/**
 * A single integer outcome, `COUNT`, the source of a NULL integer.
 */
const count: OutcomeDeclaration = { ...score, baseType: "integer", identifier: "COUNT" };

/**
 * The item of the response-rule cases: {@link item} with the lookup outcomes and `COUNT`.
 */
const lookupItem: Item = {
  ...item,
  outcomes: new Map([
    ...item.outcomes,
    ["GRADE", grade],
    ["LEVEL", level],
    ["BAND", band],
    ["COUNT", count],
  ]),
};

/**
 * The variables of the response-rule cases: `SCORE` 0, and `COUNT`, `GRADE`, `LEVEL` and `BAND`
 * NULL.
 */
const lookupVariables: Variables = {
  outcomes: {
    BAND: nullOf("identifier", "single"),
    COUNT: nullOf("integer", "single"),
    GRADE: nullOf("identifier", "single"),
    LEVEL: nullOf("identifier", "single"),
    SCORE: floatValue(0),
  },
  responses: {},
};

/**
 * Construct a `qti-lookup-outcome-value`.
 *
 * @param identifier The outcome whose table maps the value.
 * @param expression The value looked up.
 * @returns The rule.
 */
const lookupOutcome = (identifier: string, expression: Expression): Rule => ({
  expression,
  identifier,
  kind: "lookup-outcome",
});

/**
 * Run one lookup against {@link lookupItem} and give the outcome it set.
 *
 * @param identifier The outcome looked up.
 * @param expression The value looked up.
 * @returns The outcome's value after the lookup.
 */
const lookedUp = (identifier: string, expression: Expression): Value | undefined =>
  Result.getOrThrow(runRules([lookupOutcome(identifier, expression)], lookupItem, lookupVariables))
    .outcomes[identifier];

/**
 * Construct a `qti-set-outcome-value` element of `SCORE` to a float base value.
 *
 * @param value The base value's text.
 * @returns The rule element.
 */
const scoreElement = (value: string): SourceElement =>
  el(
    "qti-set-outcome-value",
    [attr("identifier", "SCORE")],
    [el("qti-base-value", [attr("base-type", "float")], [text(value)])],
  );

/**
 * Construct an item whose inline response processing looks its float response up in `BAND`'s
 * interpolation table, {@link band}'s as written: at or above 7.5 is `HIGH`; above 2, the
 * boundary excluded, `MID`; at or above 0 `LOW`; anything else `NONE`.
 *
 * @param cardinality `BAND`'s cardinality.
 * @returns The item's document.
 */
const bandItem = (cardinality: "multiple" | "ordered" | "single"): SourceDocument =>
  doc(
    "items/band.xml",
    el(
      "qti-assessment-item",
      [attr("identifier", "band"), attr("title", "Band")],
      [
        el("qti-response-declaration", [
          attr("base-type", "float"),
          attr("cardinality", "single"),
          attr("identifier", "RESPONSE"),
        ]),
        el(
          "qti-outcome-declaration",
          [
            attr("base-type", "identifier"),
            attr("cardinality", cardinality),
            attr("identifier", "BAND"),
          ],
          [
            el(
              "qti-interpolation-table",
              [attr("default-value", "NONE")],
              [
                el("qti-interpolation-table-entry", [
                  attr("source-value", "7.5"),
                  attr("target-value", "HIGH"),
                ]),
                el("qti-interpolation-table-entry", [
                  attr("include-boundary", "false"),
                  attr("source-value", "2"),
                  attr("target-value", "MID"),
                ]),
                el("qti-interpolation-table-entry", [
                  attr("source-value", "0"),
                  attr("target-value", "LOW"),
                ]),
              ],
            ),
          ],
        ),
        el("qti-item-body"),
        el(
          "qti-response-processing",
          [],
          [
            el(
              "qti-lookup-outcome-value",
              [attr("identifier", "BAND")],
              [el("qti-variable", [attr("identifier", "RESPONSE")])],
            ),
          ],
        ),
      ],
    ),
  );

describe("response rules: lookup, exit and a typed NULL", () => {
  it("[I-9a] a lookup maps a value through its outcome's match table by exact integer", () => {
    assert.deepStrictEqual(lookedUp("GRADE", base(integerValue(2n))), identifierValue("B"));
  });

  it("[I-9a] a lookup no match table entry maps gives the table's default-value, else a NULL of the outcome's type", () => {
    assert.deepStrictEqual(lookedUp("GRADE", base(integerValue(3n))), identifierValue("F"));
    assert.deepStrictEqual(
      lookedUp("LEVEL", base(integerValue(3n))),
      nullOf("identifier", "single"),
    );
  });

  it("[I-9a] a lookup of a NULL gives the table's default-value, else NULL, never the outcome's own default (9.12)", () => {
    const defaulted: Item = {
      ...lookupItem,
      outcomes: new Map([
        ...lookupItem.outcomes,
        ["LEVEL", { ...level, defaultValue: Option.some(identifierValue("Z")) }],
      ]),
    };
    const after = Result.getOrThrow(
      runRules(
        [lookupOutcome("GRADE", variable("COUNT")), lookupOutcome("LEVEL", variable("COUNT"))],
        defaulted,
        lookupVariables,
      ),
    );

    assert.deepStrictEqual(after.outcomes["GRADE"], identifierValue("F"));
    assert.deepStrictEqual(after.outcomes["LEVEL"], nullOf("identifier", "single"));
  });

  it("[I-9a] a lookup maps a number through an interpolation table by the first entry whose source-value it reaches, include-boundary deciding the equal case", () => {
    const bands = [
      [floatValue(7.5), "HIGH"],
      [floatValue(9), "HIGH"],
      [floatValue(2.5), "MID"],
      [floatValue(2), "LOW"],
      [integerValue(2n), "LOW"],
      [integerValue(3n), "MID"],
      [floatValue(0), "LOW"],
      [floatValue(-1), "NONE"],
    ] as const;

    for (const [index, [source, expected]] of bands.entries()) {
      assert.deepStrictEqual(
        lookedUp("BAND", base(source)),
        identifierValue(expected),
        `case ${index}`,
      );
    }
  });

  it.effect(
    "[I-9a] an inline lookup through an interpolation table runs into a single outcome, and into a multiple or an ordered one is marked with processing none, as a match table's (repair7-1)",
    () =>
      Effect.gen(function* looksUpInline() {
        const single = yield* buildItem(bandItem("single"));
        const rules = yield* Option.match(single.processing, {
          onNone: () => Effect.die("the single outcome's lookup does not run"),
          onSome: Effect.succeed,
        });
        const bands = [
          [7.5, "HIGH"],
          [2.5, "MID"],
          [2, "LOW"],
          [-1, "NONE"],
        ] as const;

        assert.deepStrictEqual(single.unsupported, []);
        for (const [index, [answer, expected]] of bands.entries()) {
          const after = Result.getOrThrow(
            runRules(rules, single, {
              outcomes: { BAND: nullOf("identifier", "single") },
              responses: { RESPONSE: floatValue(answer) },
            }),
          );

          assert.deepStrictEqual(
            after.outcomes["BAND"],
            identifierValue(expected),
            `case ${index}`,
          );
        }

        for (const cardinality of ["multiple", "ordered"] as const) {
          const marked = yield* buildItem(bandItem(cardinality));

          assert.deepStrictEqual(marked.processing, Option.none(), cardinality);
          assert.deepStrictEqual(
            marked.unsupported,
            [
              {
                feature: "outcome-type:BAND",
                path: "qti-assessment-item/qti-response-processing",
                shown: "mark",
              },
            ],
            cardinality,
          );
        }
      }),
  );

  it("[I-9a] an exit ends the run, at any depth, keeping what earlier rules set and skipping later ones", () => {
    const flat = Result.getOrThrow(
      runRules(
        [
          setOutcome("SCORE", base(floatValue(1))),
          { kind: "exit" },
          setOutcome("SCORE", base(floatValue(2))),
        ],
        lookupItem,
        lookupVariables,
      ),
    );
    const nested = Result.getOrThrow(
      runRules(
        [
          condition([
            branchOf(base(booleanValue(true)), [
              setOutcome("SCORE", base(floatValue(1))),
              { kind: "exit" },
              setOutcome("SCORE", base(floatValue(3))),
            ]),
          ]),
          setOutcome("SCORE", base(floatValue(2))),
        ],
        lookupItem,
        lookupVariables,
      ),
    );

    assert.deepStrictEqual(flat.outcomes["SCORE"], floatValue(1));
    assert.deepStrictEqual(nested.outcomes["SCORE"], floatValue(1));
  });

  it.effect("[I-9a] a nested fragment's rules run in its place", () =>
    Effect.gen(function* runsFragment() {
      const built = yield* buildItem(
        doc(
          "items/fragment.xml",
          el(
            "qti-assessment-item",
            [attr("identifier", "fragment"), attr("title", "Fragment")],
            [
              el("qti-outcome-declaration", [
                attr("base-type", "float"),
                attr("cardinality", "single"),
                attr("identifier", "SCORE"),
              ]),
              el("qti-item-body"),
              el(
                "qti-response-processing",
                [],
                [
                  scoreElement("1"),
                  el(
                    "qti-response-processing-fragment",
                    [],
                    [
                      scoreElement("2"),
                      el("qti-response-processing-fragment", [], [el("qti-exit-response")]),
                      scoreElement("3"),
                    ],
                  ),
                  scoreElement("4"),
                ],
              ),
            ],
          ),
        ),
      );
      const rules = yield* Option.match(built.processing, {
        onNone: () => Effect.die("the fragments' processing does not run"),
        onSome: Effect.succeed,
      });
      const after = Result.getOrThrow(
        runRules(rules, built, { outcomes: { SCORE: floatValue(0) }, responses: {} }),
      );

      assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(2));
    }),
  );

  it("[I-9a] a NULL of another type is stored as the outcome's typed NULL (spec §4.5)", () => {
    const after = Result.getOrThrow(
      runRules([setOutcome("SCORE", variable("COUNT"))], lookupItem, lookupVariables),
    );

    assert.deepStrictEqual(after.outcomes["SCORE"], nullOf("float", "single"));
  });

  it("[I-9a] a value of another type that is not NULL still fails OutcomeMismatchError at the evaluator", () => {
    const failure = failureOf(
      runRules([setOutcome("SCORE", base(integerValue(1n)))], lookupItem, lookupVariables),
    );

    assert.instanceOf(failure, OutcomeMismatchError);
    assert.deepStrictEqual(
      { _tag: failure._tag, actual: failure.actual, expected: failure.expected },
      { _tag: "OutcomeMismatchError", actual: "integer single", expected: "float single" },
    );
  });
});

describe("evaluateExpression", () => {
  it("is-null on NULL is true", () => {
    const value = Result.getOrThrow(
      evaluateExpression(
        { kind: "is-null", operands: [variable("RESPONSE")] },
        item,
        variablesOf(nullOf("identifier", "single")),
      ),
    );

    assert.deepStrictEqual(value, booleanValue(true));
  });

  it("a match with a NULL side is NULL", () => {
    const value = Result.getOrThrow(
      evaluateExpression(
        { kind: "match", operands: [variable("OPEN"), base(identifierValue("A"))] },
        item,
        variablesOf(identifierValue("A")),
      ),
    );

    assert.deepStrictEqual(value, nullOf("boolean", "single"));
  });

  it.effect("a match tells an integer correct response beyond 2^53 from its neighbour", () =>
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
              operands: [
                variable("RESPONSE"),
                { identifier: "RESPONSE", kind: "correct", operands: [] },
              ],
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

  it("correct is the declared correct response, or NULL of the declared type", () => {
    const variables = variablesOf(identifierValue("A"));

    assert.deepStrictEqual(
      Result.getOrThrow(
        evaluateExpression(
          { identifier: "RESPONSE", kind: "correct", operands: [] },
          item,
          variables,
        ),
      ),
      identifierValue("true"),
    );
    assert.deepStrictEqual(
      Result.getOrThrow(
        evaluateExpression({ identifier: "OPEN", kind: "correct", operands: [] }, item, variables),
      ),
      nullOf("identifier", "single"),
    );
  });

  it("a variable reads a response or an outcome", () => {
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

  it("a variable reads the built-in numAttempts as a single integer, the attempt count", () => {
    const variables: Variables = { ...variablesOf(identifierValue("A")), numAttempts: 3n };

    assert.deepStrictEqual(
      Result.getOrThrow(evaluateExpression(variable("numAttempts"), item, variables)),
      integerValue(3n),
    );
  });

  it("a variable reads a response or an outcome named numAttempts before the attempt count", () => {
    const plain = variablesOf(identifierValue("A"));
    const declared: Variables = {
      ...plain,
      numAttempts: 3n,
      outcomes: { ...plain.outcomes, numAttempts: floatValue(0.5) },
    };

    assert.deepStrictEqual(
      Result.getOrThrow(evaluateExpression(variable("numAttempts"), item, declared)),
      floatValue(0.5),
    );
  });

  it("says the record lacks numAttempts when the variables carry no attempt count", () => {
    const failure = failureOf(
      evaluateExpression(variable("numAttempts"), item, variablesOf(identifierValue("A"))),
    );

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      { _tag: failure._tag, holder: failure.holder, identifier: failure.identifier },
      { _tag: "UnknownIdentifierError", holder: "record", identifier: "numAttempts" },
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
      {
        includeLowerBound: true,
        includeUpperBound: true,
        kind: "equal",
        operands: [base(left), base(right)],
        tolerance: [],
        toleranceMode: "exact",
      },
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
  it("maps BG010's answers: YORK and york to 0.5, Paris and NULL to 0", () => {
    assert.deepStrictEqual(mapped("CITY", [stringOf("YORK")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("york")]), floatValue(0.5));
    assert.deepStrictEqual(mapped("CITY", [stringOf("Paris")]), floatValue(0));
    assert.deepStrictEqual(mapped("CITY", []), floatValue(0));
  });

  it("a value two entries match maps by the first in document order", () => {
    assert.deepStrictEqual(mapped("TIED", [stringOf("York")]), floatValue(0.5));
  });

  it("the bounds clamp a single value, and a NULL response's 0 too", () => {
    assert.deepStrictEqual(mapped("BOUNDED", [stringOf("york")]), floatValue(0.4));
    assert.deepStrictEqual(mapped("BOUNDED", []), floatValue(0.25));
  });

  it("a multiple response sums its distinct values, each once", () => {
    const answer = [identifierOf("A"), identifierOf("A"), identifierOf("C")];

    assert.deepStrictEqual(mapped("CHOICES", answer), floatValue(1.5));
  });

  it("an identifier key keeps its case, and a pair key matches in either order", () => {
    assert.deepStrictEqual(
      mapped("CHOICES", [identifierOf("a"), identifierOf("C")]),
      floatValue(0.5),
    );
    assert.deepStrictEqual(
      mapped("PAIRED", [{ baseType: "pair", value: ["B", "A"] }]),
      floatValue(1),
    );
  });

  it("a multiple response counts a value once however it is written, as the pairwise comparison does", () => {
    // Each NaN counts: `match` compares floats with `===`, so a NaN equals no value, itself included.
    const cases = [
      ["CHOICES", "identifier", ["A", "A", "C"], 1.5],
      ["INTEGERS", "integer", ["5", "+5", "05", "-0", "0", "+0", "7"], 1.5],
      ["FLOATS", "float", ["1", "1.0", "1e0", "+1.00", "10E-1", "0", "-0", "0.0"], 1.125],
      ["FLOATS", "float", ["NaN", "NaN", "INF", "1e400", "-INF"], 0.625],
      ["STRINGS", "string", ["York", "York", "york", "YORK", " York"], 2],
      ["PAIRS", "pair", ["A B", "B A", "A\tB", "B  A", "A C", "C A"], 1.5],
      ["DIRECTED", "directedPair", ["A B", "B A", "A  B", "B\nA"], 1.5],
    ] as const;

    for (const [identifier, baseType, lexicals, expected] of cases) {
      const values = written(baseType, lexicals);

      assert.deepStrictEqual(mapped(identifier, values), floatValue(expected), lexicals.join(","));
      assert.deepStrictEqual(
        mapped(identifier, values),
        mapped(identifier, pairwiseDistinct(values)),
        lexicals.join(","),
      );
    }
  });

  it("maps 50,000 distinct posted strings in time linear in their number", () => {
    const posted = Array.from({ length: 50_000 }, (_, index) => stringOf(`v${index.toString(36)}`));

    assert.deepStrictEqual(mapped("STRINGS", [...posted, stringOf("York")]), floatValue(1));
  });

  it("refuses to map a response with no mapping", () => {
    const failure = failureOf(
      evaluateExpression(
        { identifier: "OPEN", kind: "map-response", operands: [] },
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
  it("maps a point inside the circle, or on its edge, to 1, and one in no area to the default", () => {
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(102n, 113n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(118n, 113n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(102n, 97n)]), floatValue(1));
    assert.deepStrictEqual(pointMapped("TARGET", [pointOf(200n, 200n)]), floatValue(0.25));
  });

  it("maps an area once however many points it holds, and adds the default once per distinct point in no area", () => {
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

  it("counts a point once however it is written, as the pairwise comparison does", () => {
    const points = written("point", [
      "200 300",
      "+200 0300",
      "200\t300",
      "300 200",
      "0 -500",
      "-0 -500",
      "+0 -0500",
      "102 113",
      "102  +113",
    ]);

    assert.deepStrictEqual(pointMapped("TARGET", points), floatValue(1.75));
    assert.deepStrictEqual(
      pointMapped("TARGET", points),
      pointMapped("TARGET", pairwiseDistinct(points)),
    );
  });

  it("maps 50,000 distinct points in time linear in their number", () => {
    const points = Array.from({ length: 50_000 }, (_, index) => pointOf(BigInt(index), 1000n));

    assert.deepStrictEqual(pointMapped("TARGET", points), floatValue(12_500));
  });

  it("a NULL response maps to 0 before the bounds, and the bounds clamp the sum", () => {
    assert.deepStrictEqual(pointMapped("TARGET", []), floatValue(0));
    assert.deepStrictEqual(pointMapped("CLAMPED", []), floatValue(0.5));
    assert.deepStrictEqual(
      pointMapped("CLAMPED", [pointOf(102n, 113n), pointOf(10n, 10n)]),
      floatValue(1.25),
    );
  });

  it("a point two areas hold is mapped by the first listed", () => {
    assert.deepStrictEqual(pointMapped("OVERLAPPING", [pointOf(45n, 35n)]), floatValue(0.5));
    assert.deepStrictEqual(
      pointMapped("OVERLAPPING", [pointOf(45n, 35n), pointOf(55n, 35n)]),
      floatValue(1.5),
    );
  });

  /* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
  it("each shape holds the points on its boundary, and default holds every point", () => {
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

  it("compares a coordinate beyond 2^53 after its one conversion to the nearest double", () => {
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
    const edge = { coords: [0, 0, 9_007_199_254_740_992, 1], shape: "rect" } as const;

    assert.isTrue(holds(edge, 2n ** 53n + 1n, 0n));
    assert.isFalse(holds(edge, 2n ** 53n + 2n, 0n));
  });

  it("refuses to map a point response with no area mapping, naming qti-area-mapping", () => {
    const failure = failureOf(
      evaluateExpression(
        { identifier: "UNMAPPED", kind: "map-response-point", operands: [] },
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

describe("evaluators", () => {
  it("holds one entry for each of the 64 kinds, each an evaluator", () => {
    const entries = Object.entries(evaluators);
    for (const [kind, entry] of entries) {
      assert.isFunction(entry, kind);
    }

    assert.deepStrictEqual(entries.map(([kind]) => kind).toSorted(), expressionKinds.toSorted());
  });
});
