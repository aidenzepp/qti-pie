import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { Declarations } from "#plate/engine/evaluate.ts";
import { OutcomeMismatchError, UnknownIdentifierError } from "#plate/engine/failures.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { runOutcomes, testScopeOf } from "#plate/engine/outcome.ts";
import { drawBelow, drawStream, outcomeLabel } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import { itemVariable, prefixedVariable } from "#plate/engine/scope.ts";
import type { DeclaredType, Reading, ScopeItem, TestScope } from "#plate/engine/scope.ts";
import type { Expression, Rule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type {
  Item,
  LookupTable,
  OutcomeDeclaration,
  ResponseDeclaration,
  TemplateDeclaration,
  UnheldDeclaration,
} from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { absentControl, buildTest } from "#plate/model/test.ts";
import type { ItemRef, OutcomeProcessing, Section, Test, TestPart } from "#plate/model/test.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";
import type { SessionItem } from "#plate/session/session.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

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
 * Construct an unweighted `qti-variable`.
 *
 * @param name The variable's name.
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
 * Construct a `qti-match` of two identifiers, true exactly when they are the same.
 *
 * @param left The first identifier.
 * @param right The second identifier.
 * @returns The expression.
 */
const same = (left: string, right: string): Expression => ({
  kind: "match",
  operands: [base(identifier(left)), base(identifier(right))],
});

/**
 * The number of values {@link drawn} draws among: 0 to 999,999.
 */
const drawnCount = 1_000_000n;

/**
 * A `qti-random-integer` from 0 to {@link drawnCount} − 1, step 1.
 */
const drawn: Expression = {
  kind: "random-integer",
  max: { _tag: "literal", value: drawnCount - 1n },
  min: { _tag: "literal", value: 0n },
  operands: [],
  step: { _tag: "literal", value: 1n },
};

/**
 * Construct a `qti-set-outcome-value`.
 *
 * @param name The outcome's identifier.
 * @param expression The expression whose value it takes.
 * @returns The rule.
 */
const set = (name: string, expression: Expression): Rule => ({
  expression,
  identifier: name,
  kind: "set-outcome",
});

/**
 * Give the value {@link drawn} takes from a stream, computed apart from the evaluator.
 *
 * @param draw The stream.
 * @returns The single integer it draws.
 */
const expected = (draw: Draw): Value => integer(drawBelow(draw, drawnCount));

/**
 * The `qti-exit-test` rule.
 */
const exit: Rule = { kind: "exit" };

/**
 * Construct a single outcome declaration with no reporting attributes.
 *
 * @param name Its identifier.
 * @param baseType Its base type.
 * @param options Its default and its lookup table, each none when left out.
 * @returns The declaration.
 */
const outcome = (
  name: string,
  baseType: ModelledBaseType,
  options: { readonly defaultValue?: Value; readonly lookupTable?: LookupTable } = {},
): OutcomeDeclaration => ({
  baseType,
  cardinality: "single",
  defaultValue: Option.fromUndefinedOr(options.defaultValue),
  identifier: name,
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.fromUndefinedOr(options.lookupTable),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
});

/**
 * The test's outcomes: `TOTAL`, an integer with default 5; `COUNT`, an integer, and `RATIO`, a
 * float, with no default; `GRADE`, an identifier with no default, whose match table maps 1 to `A`
 * and 2 to `B` and any other value to `F`; and `N`, an integer with no default.
 */
const outcomes: ReadonlyMap<string, OutcomeDeclaration> = new Map([
  ["TOTAL", outcome("TOTAL", "integer", { defaultValue: integer(5n) })],
  ["COUNT", outcome("COUNT", "integer")],
  ["RATIO", outcome("RATIO", "float")],
  [
    "GRADE",
    outcome("GRADE", "identifier", {
      lookupTable: {
        defaultValue: Option.some({ baseType: "identifier", value: "F" }),
        entries: [
          { sourceValue: 1n, targetValue: { baseType: "identifier", value: "A" } },
          { sourceValue: 2n, targetValue: { baseType: "identifier", value: "B" } },
        ],
        kind: "match",
      },
    }),
  ],
  ["N", outcome("N", "integer")],
]);

/**
 * The value of every outcome before any rule runs: `TOTAL` its default 5, `COUNT` 0, `RATIO` 0,
 * `GRADE` NULL and `N` 0.
 */
const starting = {
  COUNT: integer(0n),
  GRADE: { baseType: "identifier", cardinality: "single", values: [] },
  N: integer(0n),
  RATIO: float(0),
  TOTAL: integer(5n),
} satisfies Readonly<Record<string, Value>>;

/**
 * Construct a test with {@link outcomes} whose outcome processing runs rules.
 *
 * @param rules The rules.
 * @returns The test.
 */
const running = (rules: readonly Rule[]): Pick<Test, "outcomeProcessing" | "outcomes"> => ({
  outcomeProcessing: { kind: "runs", rules },
  outcomes,
});

/**
 * A test scope of no items, no parts and no time.
 */
const emptyScope: TestScope = {
  declared: new Set(),
  duration: Option.none(),
  items: [],
  parts: new Map(),
  sections: new Map(),
};

/**
 * A stream that counts the draws taken from it, and how many it gave.
 */
interface Counted {
  readonly count: () => number;
  readonly draw: Draw;
}

/**
 * Construct a stream that counts the draws taken from it, each 0.
 *
 * @returns The stream, and a function giving how many draws it gave.
 */
const counting = (): Counted => {
  let taken = 0;

  return {
    count: () => taken,
    draw: () => {
      taken += 1;

      return 0;
    },
  };
};

/**
 * Give the outcomes a run gave, after checking that it succeeded.
 *
 * @param result The run's result.
 * @returns The outcomes.
 */
const outcomesOf = (
  result: Result.Result<Readonly<Record<string, Value>>, EngineFailure>,
): Readonly<Record<string, Value>> => {
  assert.isTrue(Result.isSuccess(result));

  return Result.getOrElse(result, () => ({}));
};

/**
 * Give the failure a run returned, after checking that it failed.
 *
 * @param result The run's result.
 * @returns The failure.
 */
const failureOf = (
  result: Result.Result<Readonly<Record<string, Value>>, EngineFailure>,
): EngineFailure => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

/**
 * Give the value a reading holds, after checking that it holds one.
 *
 * @param reading The reading.
 * @returns The value, or an empty NULL when it holds none.
 */
const heldValue = (reading: Reading): Value => {
  assert.strictEqual(reading.kind, "held");

  return reading.kind === "held"
    ? reading.value
    : { baseType: "float", cardinality: "single", values: [] };
};

describe("runOutcomes", () => {
  it("[T-9] the outcome interpreter starts every outcome at its declared default, else its starting value, then runs the rules", () => {
    const test = running([set("TOTAL", sum(variable("TOTAL"), base(integer(1n))))]);

    assert.deepStrictEqual(outcomesOf(runOutcomes(test, emptyScope, counting().draw)), {
      ...starting,
      TOTAL: integer(6n),
    });
  });

  it("[T-9] the outcome interpreter starts a second run from the defaults again, not from what the first left", () => {
    const test = running([set("TOTAL", sum(variable("TOTAL"), base(integer(1n))))]);
    const first = outcomesOf(runOutcomes(test, emptyScope, counting().draw));
    const second = outcomesOf(runOutcomes(test, emptyScope, counting().draw));

    assert.deepStrictEqual(first["TOTAL"], integer(6n));
    assert.deepStrictEqual(second, first);
  });

  it("[T-9] the outcome interpreter runs a condition's first true branch, else its otherwise", () => {
    const condition = (whens: readonly Expression[]): Rule => ({
      branches: whens.map((when, index) => ({
        // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, as `Branch` names it.
        then: [set("GRADE", base(identifier(`branch${String(index + 1)}`)))],
        when,
      })),
      kind: "condition",
      otherwise: Option.some([set("GRADE", base(identifier("otherwise")))]),
    });
    const chosen = runOutcomes(
      running([condition([same("a", "b"), same("a", "a"), same("b", "b")])]),
      emptyScope,
      counting().draw,
    );
    const otherwise = runOutcomes(
      running([condition([same("a", "b"), same("b", "c")])]),
      emptyScope,
      counting().draw,
    );

    assert.deepStrictEqual(outcomesOf(chosen)["GRADE"], identifier("branch2"));
    assert.deepStrictEqual(outcomesOf(otherwise)["GRADE"], identifier("otherwise"));
  });

  it("[T-9] the outcome interpreter looks a value up in its outcome's table, the table's default for a value no entry maps", () => {
    const mapped = runOutcomes(
      running([{ expression: base(integer(2n)), identifier: "GRADE", kind: "lookup-outcome" }]),
      emptyScope,
      counting().draw,
    );
    const unmapped = runOutcomes(
      running([{ expression: base(integer(7n)), identifier: "GRADE", kind: "lookup-outcome" }]),
      emptyScope,
      counting().draw,
    );

    assert.deepStrictEqual(outcomesOf(mapped)["GRADE"], identifier("B"));
    assert.deepStrictEqual(outcomesOf(unmapped)["GRADE"], identifier("F"));
  });

  it("[T-9] the outcome interpreter's qti-exit-test ends that run only, keeping what it set, and the next run runs the rules again", () => {
    const test = running([
      set("TOTAL", sum(variable("TOTAL"), base(integer(1n)))),
      {
        branches: [
          // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, as `Branch` names it.
          { then: [exit], when: same("a", "a") },
        ],
        kind: "condition",
        otherwise: Option.none(),
      },
      set("TOTAL", base(integer(100n))),
      set("COUNT", base(integer(3n))),
    ]);
    const first = outcomesOf(runOutcomes(test, emptyScope, counting().draw));
    const second = outcomesOf(runOutcomes(test, emptyScope, counting().draw));

    assert.deepStrictEqual(first, { ...starting, TOTAL: integer(6n) });
    assert.deepStrictEqual(second, first);
  });

  it("[T-9] the outcome interpreter runs nothing for an absent or a marked processing, and gives the starting outcomes", () => {
    for (const outcomeProcessing of [
      { kind: "absent" },
      { kind: "marked" },
    ] satisfies readonly OutcomeProcessing[]) {
      const { count, draw } = counting();
      const result = runOutcomes({ outcomeProcessing, outcomes }, emptyScope, draw);

      assert.deepStrictEqual(outcomesOf(result), starting);
      assert.strictEqual(count(), 0);
    }
  });

  it("[T-9] the outcome interpreter returns a rule's failure through Result: an undeclared outcome, a value of another type", () => {
    const undeclared = runOutcomes(
      running([set("MISSING", base(integer(1n)))]),
      emptyScope,
      counting().draw,
    );
    const mismatched = runOutcomes(
      running([set("TOTAL", base(float(1.5)))]),
      emptyScope,
      counting().draw,
    );

    assert.deepStrictEqual(
      failureOf(undeclared),
      new UnknownIdentifierError({ holder: "item", identifier: "MISSING", role: "outcome" }),
    );
    assert.deepStrictEqual(
      failureOf(mismatched),
      new OutcomeMismatchError({
        actual: "float single",
        expected: "integer single",
        identifier: "TOTAL",
      }),
    );
  });

  it("[T-9] the outcome interpreter draws from the stream its run's label keys by the seed, never the default key's, and each run's label draws apart", () => {
    const seed = "processing-seed";
    const instance = "sitting-1";
    const test = running([set("N", drawn)]);
    const runOf = (run: number): Value | undefined =>
      outcomesOf(runOutcomes(test, emptyScope, drawStream(seed, outcomeLabel(instance, run))))["N"];

    assert.strictEqual(outcomeLabel(instance, 1), "sitting-1\u001Foutcome\u001F1");
    assert.deepStrictEqual(runOf(1), expected(drawStream(seed, outcomeLabel(instance, 1))));
    assert.notDeepEqual(runOf(1), expected(drawStream("", "")));
    assert.deepStrictEqual(runOf(2), expected(drawStream(seed, outcomeLabel(instance, 2))));
    assert.notDeepEqual(runOf(2), runOf(1));
  });
});

/**
 * Construct an item ref with no session control, template default or extra attribute.
 *
 * @param name Its identifier.
 * @param refs What it reads by: its categories, weights and variable mappings.
 * @returns The item ref.
 */
const itemRef = (
  name: string,
  refs: Pick<ItemRef, "category" | "mappings" | "weights">,
): ItemRef => ({
  ...refs,
  control: absentControl,
  fixed: false,
  href: `items/${name}.xml`,
  identifier: name,
  kind: "item-ref",
  required: false,
  templateDefaults: [],
});

/**
 * Construct a visible section.
 *
 * @param name Its identifier.
 * @param children Its sections and item refs.
 * @returns The section.
 */
const section = (name: string, children: Section["children"]): Section => ({
  children,
  control: absentControl,
  fixed: false,
  identifier: name,
  keepTogether: false,
  kind: "section",
  required: false,
  title: name,
  visible: true,
});

/**
 * Construct a linear, individual test part.
 *
 * @param name Its identifier.
 * @param children Its sections.
 * @returns The part.
 */
const testPart = (name: string, children: readonly Section[]): TestPart => ({
  children,
  control: absentControl,
  identifier: name,
  navigation: "linear",
  submission: "individual",
});

/**
 * The response every item below declares, a single identifier `RESPONSE`.
 */
const response: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * The template variable every item below declares, a single integer `T`.
 */
const template: TemplateDeclaration = {
  baseType: "integer",
  cardinality: "single",
  defaultValue: Option.none(),
  identifier: "T",
  mathVariable: false,
  paramVariable: false,
};

/**
 * The declarations every item below makes: the response `RESPONSE`, the float outcome `SCORE` and
 * the template variable `T`.
 */
const declarations: Declarations = {
  outcomes: new Map([["SCORE", outcome("SCORE", "float")]]),
  responses: new Map([["RESPONSE", response]]),
  templates: new Map([["T", template]]),
};

/**
 * The declarations `ITEM1` makes of a type the value model does not hold: a `file` response
 * `UPLOAD` and a `record` outcome `DETAIL` that writes no base type.
 */
const unheld: ReadonlyMap<string, UnheldDeclaration> = new Map<string, UnheldDeclaration>([
  [
    "UPLOAD",
    {
      baseType: Option.some("file"),
      cardinality: "single",
      declaresCorrect: false,
      identifier: "UPLOAD",
      kind: "response",
    },
  ],
  [
    "DETAIL",
    { baseType: Option.none(), cardinality: "record", identifier: "DETAIL", kind: "outcome" },
  ],
]);

/**
 * Construct the record an item's session holds: its responses, its outcome `SCORE`, its template
 * value, a correct response and a default its template processing set, and its seed.
 *
 * @param name The item's identifier.
 * @param score Its `SCORE`.
 * @param numAttempts The attempts processed.
 * @returns The record.
 */
const record = (name: string, score: number, numAttempts: number): ItemRecord => ({
  attempt: numAttempts === 0 ? "none" : "submitted",
  correct: { RESPONSE: identifier("A") },
  defaults: { SCORE: float(0.5) },
  document: `items/${name}.xml`,
  instance: `sitting.${name}`,
  item: name,
  kind: "item",
  notices: [],
  numAttempts,
  outcomes: { SCORE: float(score), completionStatus: identifier("completed") },
  records: {},
  responses: { RESPONSE: identifier("B") },
  seed: "a seed the scope never holds",
  templates: { T: integer(4n) },
});

/**
 * Construct a session item.
 *
 * @param itemRecord Its record.
 * @param sequenceIndex Its place in the sequence, from 1.
 * @param presented Whether it was presented.
 * @returns The session item, which delivers the item ref named after its record's item.
 */
const sessionItem = (
  itemRecord: ItemRecord,
  sequenceIndex: number,
  presented: boolean,
): SessionItem => ({
  datestamp: "2026-11-07T00:00:00.000Z",
  duration: 0,
  firstOutcomes: Option.none(),
  presented,
  record: itemRecord,
  ref: itemRecord.item,
  saved: Option.none(),
  sequenceIndex,
  templateDefaults: Option.none(),
});

/**
 * A test of two parts: `P1`'s section `S1` holds `ITEM1` and the nested section `S2`, which holds
 * `ITEM2`; `P2`'s section `S3` holds `ITEM3`. `ITEM1` is in the categories `alpha` and `beta`,
 * weights `SCORE` by 2 and maps nothing; `ITEM2` maps `TOTAL` to `SCORE`; `ITEM3` has none of
 * them. The test declares `TOTAL` and the context name `ITEM1.SCORE`.
 */
const structured: Pick<Test, "declared" | "outcomes" | "parts"> = {
  declared: new Set(["ITEM1.SCORE", "TOTAL"]),
  outcomes: new Map([["TOTAL", outcome("TOTAL", "float")]]),
  parts: [
    testPart("P1", [
      section("S1", [
        itemRef("ITEM1", {
          category: ["alpha", "beta"],
          mappings: new Map(),
          weights: new Map([["SCORE", 2]]),
        }),
        section("S2", [
          itemRef("ITEM2", {
            category: [],
            mappings: new Map([["TOTAL", "SCORE"]]),
            weights: new Map(),
          }),
        ]),
      ]),
    ]),
    testPart("P2", [
      section("S3", [itemRef("ITEM3", { category: [], mappings: new Map(), weights: new Map() })]),
    ]),
  ],
};

/**
 * The session of {@link structured}: `ITEM1`, presented with three attempts processed and `SCORE`
 * 1e16; `ITEM2`, presented with one and `SCORE` 1; `ITEM3`, not presented, with `SCORE` −1e16.
 * Summed in that order the scores give 0, and summed `ITEM1`, `ITEM3`, `ITEM2` they give 1.
 */
const session = {
  items: [
    sessionItem(record("ITEM1", 1e16, 3), 1, true),
    sessionItem(record("ITEM2", 1, 1), 2, true),
    sessionItem(record("ITEM3", -1e16, 0), 3, false),
  ],
};

/**
 * Give the record part a scope entry holds of a session item's record: no seed.
 *
 * @param itemRecord The record.
 * @returns Its responses, outcomes, template values, correct responses and defaults.
 */
const scopeRecord = (itemRecord: ItemRecord): ScopeItem["record"] => ({
  correct: itemRecord.correct,
  defaults: itemRecord.defaults,
  outcomes: itemRecord.outcomes,
  responses: itemRecord.responses,
  templates: itemRecord.templates,
});

/**
 * Sum each scope entry's `SCORE`, in the scope's order, as a float aggregate over the test's items
 * would.
 *
 * @param scope The scope.
 * @returns The sum.
 */
const scoreSum = (scope: TestScope): number => {
  let total = 0;
  for (const entry of scope.items) {
    const [single] = heldValue(Result.getOrThrow(itemVariable(entry, "SCORE"))).values;
    total += single?.baseType === "float" ? single.value : Number.NaN;
  }

  return total;
};

/**
 * The attempt limits of {@link structured}'s item refs: `ITEM1` closes at its third attempt,
 * `ITEM2` has no limit, and `ITEM3` allows one.
 */
const limits = new Map([
  ["ITEM1", 3],
  ["ITEM2", 0],
  ["ITEM3", 1],
]);

describe("testScopeOf", () => {
  /**
   * The items `ITEM1` and `ITEM2` deliver, keyed by item ref in session order: `ITEM1` with its
   * unheld declarations, `ITEM2` with none. `ITEM3` is left out.
   */
  const items = new Map<string, { readonly item: Declarations & Pick<Item, "unheld"> }>([
    ["ITEM1", { item: { ...declarations, unheld } }],
    ["ITEM2", { item: declarations }],
  ]);

  it("[T-9] the outcome interpreter's scope of a session holds the test's parts and sections, and one entry per session item with its ref's, item's and record's fields and its count of attempts started", () => {
    const [first, second, third] = session.items;
    const scope = testScopeOf(structured, items, session, limits, Option.some(90.5));

    assert.deepStrictEqual(scope, {
      declared: new Set(["ITEM1.SCORE", "TOTAL"]),
      duration: Option.some(90.5),
      items: [
        {
          categories: ["alpha", "beta"],
          declarations,
          mappings: new Map(),
          numAttempts: 3,
          presented: true,
          record: scopeRecord(first?.record ?? record("ITEM1", 0, 0)),
          ref: "ITEM1",
          unheld: new Map<string, DeclaredType>([
            ["UPLOAD", { baseType: "file", cardinality: "single" }],
            ["DETAIL", { baseType: "file", cardinality: "record" }],
          ]),
          unheldResponses: new Map([["UPLOAD", false]]),
          weights: new Map([["SCORE", 2]]),
        },
        {
          categories: [],
          declarations,
          mappings: new Map([["TOTAL", "SCORE"]]),
          numAttempts: 2,
          presented: true,
          record: scopeRecord(second?.record ?? record("ITEM2", 0, 0)),
          ref: "ITEM2",
          unheld: new Map(),
          unheldResponses: new Map(),
          weights: new Map(),
        },
        {
          categories: [],
          declarations: { outcomes: new Map(), responses: new Map(), templates: new Map() },
          mappings: new Map(),
          numAttempts: 0,
          presented: false,
          record: scopeRecord(third?.record ?? record("ITEM3", 0, 0)),
          ref: "ITEM3",
          unheld: new Map(),
          unheldResponses: new Map(),
          weights: new Map(),
        },
      ],
      parts: new Map([
        ["P1", ["ITEM1", "ITEM2"]],
        ["P2", ["ITEM3"]],
      ]),
      sections: new Map([
        ["S1", ["ITEM1", "ITEM2"]],
        ["S2", ["ITEM2"]],
        ["S3", ["ITEM3"]],
      ]),
    });
    assert.isTrue(
      Option.isNone(testScopeOf(structured, items, session, limits, Option.none()).duration),
    );
    // The control: ITEM1 under no limit has started one attempt past its three processed.
    assert.deepStrictEqual(
      testScopeOf(structured, items, session, new Map(), Option.none()).items.map(
        (entry) => entry.numAttempts,
      ),
      [4, 2, 0],
    );
  });

  it("[T-9] the outcome interpreter's scope follows the session's item order, whatever order the items map was built in, so a float sum over it is one sum", () => {
    const [first, second, third] = session.items;
    const inSessionOrder = new Map([
      ["ITEM1", { item: { ...declarations, unheld } }],
      ["ITEM2", { item: declarations }],
      ["ITEM3", { item: declarations }],
    ]);
    const reordered = new Map([
      ["ITEM3", { item: declarations }],
      ["ITEM2", { item: declarations }],
      ["ITEM1", { item: { ...declarations, unheld } }],
    ]);
    const fromSessionOrder = testScopeOf(
      structured,
      inSessionOrder,
      session,
      limits,
      Option.none(),
    );
    const fromReordered = testScopeOf(structured, reordered, session, limits, Option.none());
    const metApart = testScopeOf(
      structured,
      reordered,
      { items: [first, third, second].flatMap((each) => (each === undefined ? [] : [each])) },
      limits,
      Option.none(),
    );

    assert.deepStrictEqual(
      fromReordered.items.map((entry) => entry.ref),
      ["ITEM1", "ITEM2", "ITEM3"],
    );
    assert.deepStrictEqual(fromReordered, fromSessionOrder);
    assert.strictEqual(scoreSum(fromSessionOrder), 0);
    assert.strictEqual(scoreSum(fromReordered), 0);
    // The control: a session that meets the items in another order sums the same scores to 1.
    assert.strictEqual(scoreSum(metApart), 1);
  });
});

/**
 * An item document with an empty body that declares a file response `F`, a record outcome `R`
 * with no base type, and a float outcome `SCORE`.
 */
const unheldItem = doc(
  "items/ITEM1.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "ITEM1"), attr("title", "Item one")],
    [
      el("qti-response-declaration", [
        attr("base-type", "file"),
        attr("cardinality", "single"),
        attr("identifier", "F"),
      ]),
      el("qti-outcome-declaration", [attr("cardinality", "record"), attr("identifier", "R")]),
      el("qti-outcome-declaration", [
        attr("base-type", "float"),
        attr("cardinality", "single"),
        attr("identifier", "SCORE"),
      ]),
      el("qti-item-body"),
    ],
  ),
);

/**
 * Construct a test document of one part, one section and the item ref `ITEM1`, with a float
 * outcome `TOTAL` and its other declarations.
 *
 * @param others The test's other declarations.
 * @returns The document.
 */
const testDocument = (others: readonly SourceElement[]): SourceDocument =>
  doc(
    "tests/test.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "test"), attr("title", "Test")],
      [
        el("qti-outcome-declaration", [
          attr("base-type", "float"),
          attr("cardinality", "single"),
          attr("identifier", "TOTAL"),
        ]),
        ...others,
        el(
          "qti-test-part",
          [
            attr("identifier", "P1"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [
            el(
              "qti-assessment-section",
              [attr("identifier", "S1"), attr("title", "Section"), attr("visible", "true")],
              [
                el("qti-assessment-item-ref", [
                  attr("href", "../items/ITEM1.xml"),
                  attr("identifier", "ITEM1"),
                ]),
              ],
            ),
          ],
        ),
      ],
    ),
  );

describe("testScopeOf over built models", () => {
  it.effect(
    "[T-9] the outcome interpreter's scope of a session reads an item's file and record declarations as NULL of their type, and never splits a test's context name",
    () =>
      Effect.gen(function* builtScope() {
        const item = yield* buildItem(unheldItem);
        const plain = yield* buildTest(testDocument([]));
        const contextual = yield* buildTest(
          testDocument([
            el("qti-context-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "ITEM1.SCORE"),
            ]),
          ]),
        );
        const items = new Map([["ITEM1", acceptForTest(item)]]);
        const started = fresh(item, "sitting.1");
        const sitting = {
          items: [
            sessionItem(
              { ...started, outcomes: { ...started.outcomes, SCORE: float(0.75) } },
              1,
              true,
            ),
          ],
        };
        const scope = testScopeOf(plain, items, sitting, new Map(), Option.none());
        const withContext = testScopeOf(contextual, items, sitting, new Map(), Option.none());

        assert.deepStrictEqual(Result.getOrThrow(prefixedVariable(scope, "ITEM1.F")).reading, {
          kind: "unheld",
          type: { baseType: "file", cardinality: "single" },
        });
        assert.deepStrictEqual(Result.getOrThrow(prefixedVariable(scope, "ITEM1.R")).reading, {
          kind: "unheld",
          type: { baseType: "file", cardinality: "record" },
        });
        // The control: a modelled read is the item's value, unchanged.
        assert.deepStrictEqual(
          heldValue(Result.getOrThrow(prefixedVariable(scope, "ITEM1.SCORE")).reading),
          float(0.75),
        );
        assert.isTrue(withContext.declared.has("ITEM1.SCORE"));
        assert.isTrue(Result.isFailure(prefixedVariable(withContext, "ITEM1.SCORE")));
      }),
  );

  it.effect(
    "[T-9] testScopeOf holds each file or record response of an item with whether it declares a correct response, and no outcome",
    () =>
      Effect.gen(function* unheldResponsesScope() {
        const item = yield* buildItem(
          doc(
            "items/ITEM1.xml",
            el(
              "qti-assessment-item",
              [attr("identifier", "ITEM1"), attr("title", "Item one")],
              [
                el(
                  "qti-response-declaration",
                  [
                    attr("base-type", "identifier"),
                    attr("cardinality", "single"),
                    attr("identifier", "RESPONSE"),
                  ],
                  [el("qti-correct-response", [], [el("qti-value", [], [text("A")])])],
                ),
                el("qti-response-declaration", [
                  attr("base-type", "file"),
                  attr("cardinality", "single"),
                  attr("identifier", "FR"),
                ]),
                el("qti-outcome-declaration", [
                  attr("cardinality", "record"),
                  attr("identifier", "R"),
                ]),
                el("qti-item-body"),
              ],
            ),
          ),
        );
        const scope = testScopeOf(
          yield* buildTest(testDocument([])),
          new Map([["ITEM1", acceptForTest(item)]]),
          { items: [sessionItem(fresh(item, "sitting.1"), 1, true)] },
          new Map(),
          Option.none(),
        );

        assert.deepStrictEqual(
          scope.items.map((entry) => entry.unheldResponses),
          [new Map([["FR", false]])],
        );
      }),
  );

  it.effect(
    "[I-1] [T-9] testScopeOf reads a record response declaration the item model holds as NULL of cardinality record, with whether it declares a correct response",
    () =>
      Effect.gen(function* recordResponsesScope() {
        const item = yield* buildItem(
          doc(
            "items/ITEM1.xml",
            el(
              "qti-assessment-item",
              [attr("identifier", "ITEM1"), attr("title", "Item one")],
              [
                el(
                  "qti-response-declaration",
                  [attr("cardinality", "record"), attr("identifier", "KEYED")],
                  [
                    el(
                      "qti-correct-response",
                      [],
                      [
                        el(
                          "qti-value",
                          [attr("base-type", "string"), attr("field-identifier", "stringValue")],
                          [text("12")],
                        ),
                      ],
                    ),
                  ],
                ),
                el("qti-response-declaration", [
                  attr("cardinality", "record"),
                  attr("identifier", "OPEN"),
                ]),
                el("qti-item-body"),
              ],
            ),
          ),
        );
        const scope = testScopeOf(
          yield* buildTest(testDocument([])),
          new Map([["ITEM1", acceptForTest(item)]]),
          { items: [sessionItem(fresh(item, "sitting.1"), 1, true)] },
          new Map(),
          Option.none(),
        );
        const recordType: DeclaredType = { baseType: "file", cardinality: "record" };

        // The item model holds both, so the scope reads them through the item's records.
        assert.deepStrictEqual([...(item.records?.keys() ?? [])], ["KEYED", "OPEN"]);
        assert.isUndefined(item.unheld);
        assert.deepStrictEqual(
          scope.items.map((entry) => entry.unheld),
          [
            new Map([
              ["KEYED", recordType],
              ["OPEN", recordType],
            ]),
          ],
        );
        assert.deepStrictEqual(
          scope.items.map((entry) => entry.unheldResponses),
          [
            new Map([
              ["KEYED", true],
              ["OPEN", false],
            ]),
          ],
        );
        assert.deepStrictEqual(Result.getOrThrow(prefixedVariable(scope, "ITEM1.KEYED")).reading, {
          kind: "unheld",
          type: recordType,
        });
      }),
  );
});
