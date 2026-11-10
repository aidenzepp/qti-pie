import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { evaluateExpression } from "#plate/engine/evaluate.ts";
import type { Declarations, EngineFailure } from "#plate/engine/evaluate.ts";
import { containerSizeBound } from "#plate/engine/numbers.ts";
import type { ScopeItem, TestScope } from "#plate/engine/scope.ts";
import type { Expression } from "#plate/model/expression.ts";
import type {
  OutcomeDeclaration,
  RecordDeclaration,
  ResponseDeclaration,
} from "#plate/model/item.ts";
import { buildTest } from "#plate/model/test.ts";
import type { RecordValue, Single, Value } from "#plate/model/values.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { assertKindType } from "#plate/test/processing.ts";

/**
 * Construct an outcome declaration with no reporting attributes and no default.
 *
 * @param identifier Its identifier.
 * @param baseType Its base type.
 * @param bounds Its `normal-minimum` and `normal-maximum`, each absent unless given.
 * @param cardinality Its cardinality, `single` unless given.
 * @returns The declaration.
 */
const outcome = (
  identifier: string,
  baseType: OutcomeDeclaration["baseType"],
  bounds: { readonly maximum?: number; readonly minimum?: number } = {},
  cardinality: OutcomeDeclaration["cardinality"] = "single",
): OutcomeDeclaration => ({
  baseType,
  cardinality,
  defaultValue: Option.none(),
  identifier,
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.fromUndefinedOr(bounds.maximum),
  normalMinimum: Option.fromUndefinedOr(bounds.minimum),
  view: Option.none(),
});

/**
 * The test's own declarations holder: one float outcome, `TOTAL`, no response and no template
 * variable, as a test's processing runs with.
 */
const testHolder: Declarations = {
  outcomes: new Map([["TOTAL", outcome("TOTAL", "float")]]),
  responses: new Map(),
  templates: new Map(),
};

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
 * The single identifier NULL, an unanswered `RESPONSE`.
 */
const unanswered: Value = { baseType: "identifier", cardinality: "single", values: [] };

/**
 * Construct a single identifier response declaration, `RESPONSE`.
 *
 * @param correct Its declared correct response, none unless given.
 * @returns The declaration.
 */
const response = (correct?: string): ResponseDeclaration => ({
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.map(Option.fromUndefinedOr(correct), identifier),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
});

/**
 * Construct one session item of a hand-built test scope: presented, with one attempt started, in
 * no category, weighting and mapping nothing, declaring and holding nothing but what is given.
 *
 * @param ref Its item ref's identifier.
 * @param fields The fields that differ.
 * @returns The item.
 */
const itemOf = (ref: string, fields: Partial<ScopeItem> = {}): ScopeItem => ({
  categories: [],
  declarations: { outcomes: new Map(), responses: new Map(), templates: new Map() },
  mappings: new Map(),
  numAttempts: 1,
  presented: true,
  record: { correct: {}, defaults: {}, outcomes: {}, records: {}, responses: {}, templates: {} },
  ref,
  unheld: new Map(),
  weights: new Map(),
  ...fields,
});

/**
 * Construct an item that declares `RESPONSE` with a correct response `A` and holds the given value
 * of it.
 *
 * @param ref Its item ref's identifier.
 * @param held The value its record holds of `RESPONSE`.
 * @param fields The other fields that differ.
 * @returns The item.
 */
const answered = (ref: string, held: Value, fields: Partial<ScopeItem> = {}): ScopeItem =>
  itemOf(ref, {
    declarations: {
      outcomes: new Map(),
      responses: new Map([["RESPONSE", response("A")]]),
      templates: new Map(),
    },
    record: {
      correct: {},
      defaults: {},
      outcomes: {},
      records: {},
      responses: { RESPONSE: held },
      templates: {},
    },
    ...fields,
  });

/**
 * Construct a test scope of items, all in one part `P1`, with the sections given.
 *
 * @param items The items, in sequence order.
 * @param sections Each section's identifier and the item refs it holds, nested sections' included.
 * @returns The scope, which holds no time.
 */
const scopeOf = (
  items: readonly ScopeItem[],
  sections: ReadonlyMap<string, readonly string[]> = new Map(),
): TestScope => ({
  declared: new Set(["TOTAL"]),
  duration: Option.none(),
  items,
  parts: new Map([["P1", items.map((item) => item.ref)]]),
  sections,
});

/**
 * The counting scope. Part `P1` holds section `S1`, which holds `CORRECT` and a nested section
 * `S2` holding `WRONG`, and section `S3`, which holds the rest:
 *
 * - `CORRECT` (category `easy`): answered `A`, the correct response.
 * - `WRONG` (category `hard`): answered `B`.
 * - `SEEN` (categories `easy` and `hard`): presented, its one attempt started and not submitted,
 *   unanswered, so attempted and incorrect (info.txt:9340: "whether or not they provided a
 *   response").
 * - `UNSEEN` (no category): neither presented nor attempted, no attempt started, unanswered.
 * - `NO_RESPONSE`: declares no response.
 * - `NO_KEY`: answered `A`, its response declaring no correct response.
 */
const counting = scopeOf(
  [
    answered("CORRECT", identifier("A"), { categories: ["easy"] }),
    answered("WRONG", identifier("B"), { categories: ["hard"] }),
    answered("SEEN", unanswered, { categories: ["easy", "hard"] }),
    answered("UNSEEN", unanswered, { numAttempts: 0, presented: false }),
    itemOf("NO_RESPONSE"),
    itemOf("NO_KEY", {
      declarations: {
        outcomes: new Map(),
        responses: new Map([["RESPONSE", response()]]),
        templates: new Map(),
      },
      record: {
        correct: {},
        defaults: {},
        outcomes: {},
        records: {},
        responses: { RESPONSE: identifier("A") },
        templates: {},
      },
    }),
  ],
  new Map([
    ["S1", ["CORRECT", "WRONG"]],
    ["S2", ["WRONG"]],
    ["S3", ["SEEN", "UNSEEN", "NO_RESPONSE", "NO_KEY"]],
  ]),
);

/**
 * The filters of an outcome-only kind: none unless given.
 */
interface Filters {
  readonly excludeCategory: Option.Option<readonly string[]>;
  readonly includeCategory: Option.Option<readonly string[]>;
  readonly sectionIdentifier: Option.Option<string>;
}

/**
 * Construct the filters of an outcome-only kind.
 *
 * @param written The filters written; each absent unless given.
 * @param written.exclude The `exclude-category` list.
 * @param written.include The `include-category` list.
 * @param written.section The `section-identifier`.
 * @returns The filters.
 */
const filtersOf = (
  written: {
    readonly exclude?: readonly string[];
    readonly include?: readonly string[];
    readonly section?: string;
  } = {},
): Filters => ({
  excludeCategory: Option.fromUndefinedOr(written.exclude),
  includeCategory: Option.fromUndefinedOr(written.include),
  sectionIdentifier: Option.fromUndefinedOr(written.section),
});

/**
 * The five counting kinds.
 */
type CountKind =
  | "number-correct"
  | "number-incorrect"
  | "number-presented"
  | "number-responded"
  | "number-selected";

/**
 * Evaluate an expression in a test's run: the test's holder, no variable of its own, and the test
 * scope given.
 *
 * @param expression The expression.
 * @param scope The test scope; a run without one when none is given.
 * @returns The value, or the first failure.
 */
const run = (expression: Expression, scope?: TestScope): Result.Result<Value, EngineFailure> =>
  evaluateExpression(
    expression,
    testHolder,
    scope === undefined
      ? { outcomes: {}, responses: {} }
      : { outcomes: {}, responses: {}, test: scope },
  );

/**
 * Give the value of an expression in a test's run, held to its kind's type, failing the case on a
 * failure.
 *
 * @param expression The expression.
 * @param scope The test scope.
 * @returns The value.
 */
const valueOf = (expression: Expression, scope: TestScope): Value => {
  const result = run(expression, scope);
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);
  if (Result.isFailure(result)) {
    return { baseType: "integer", cardinality: "single", values: [] };
  }

  assertKindType(
    result.success,
    expression.kind,
    [],
    expression.kind === "test-variables"
      ? Option.match(expression.baseType, {
          onNone: () => ({}),
          onSome: (baseType) => ({ baseType }),
        })
      : {},
  );

  return result.success;
};

/**
 * Give what a test asserts of a run that failed with an `UnknownIdentifierError`: its tag,
 * holder, identifier and role.
 *
 * @param result The run's result.
 * @returns The failure's facts; only its tag when it is another failure.
 */
const gapOf = (result: Result.Result<Value, EngineFailure>): Readonly<Record<string, string>> => {
  assert.isTrue(Result.isFailure(result));

  const failure = Result.getOrThrow(Result.flip(result));

  return failure._tag === "UnknownIdentifierError"
    ? {
        _tag: failure._tag,
        holder: failure.holder,
        identifier: failure.identifier,
        role: failure.role,
      }
    : { _tag: failure._tag };
};

/**
 * Give each counting kind's count over a scope, under the same filters.
 *
 * @param scope The test scope.
 * @param filters The filters.
 * @returns Each kind's count.
 */
const counts = (scope: TestScope, filters: Filters = filtersOf()): Record<CountKind, Value> => {
  const count = (kind: CountKind): Value => valueOf({ ...filters, kind, operands: [] }, scope);

  return {
    "number-correct": count("number-correct"),
    "number-incorrect": count("number-incorrect"),
    "number-presented": count("number-presented"),
    "number-responded": count("number-responded"),
    "number-selected": count("number-selected"),
  };
};

/**
 * Construct each counting kind's expected count.
 *
 * @param correct The `qti-number-correct` count.
 * @param incorrect The `qti-number-incorrect` count.
 * @param presented The `qti-number-presented` count.
 * @param responded The `qti-number-responded` count.
 * @param selected The `qti-number-selected` count.
 * @returns The counts, each a single integer.
 */
const expected = (
  correct: bigint,
  incorrect: bigint,
  presented: bigint,
  responded: bigint,
  selected: bigint,
): Record<CountKind, Value> => ({
  "number-correct": integer(correct),
  "number-incorrect": integer(incorrect),
  "number-presented": integer(presented),
  "number-responded": integer(responded),
  "number-selected": integer(selected),
});

/**
 * Construct a multiple float of the numbers given.
 *
 * @param numbers The numbers, in order.
 * @returns The value, NULL when none is given.
 */
const floats = (...numbers: readonly number[]): Value => ({
  baseType: "float",
  cardinality: "multiple",
  values: numbers.map((value): Single => ({ baseType: "float", value })),
});

/**
 * Construct a multiple integer of the integers given.
 *
 * @param held The integers, in order.
 * @returns The value, NULL when none is given.
 */
const integers = (...held: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality: "multiple",
  values: held.map((value): Single => ({ baseType: "integer", value })),
});

/**
 * Construct a `qti-outcome-minimum` or `qti-outcome-maximum`.
 *
 * @param kind Which of the two.
 * @param outcomeIdentifier Its `outcome-identifier`.
 * @param weightIdentifier Its `weight-identifier`, none unless given.
 * @returns The expression, with no filter.
 */
const bound = (
  kind: "outcome-maximum" | "outcome-minimum",
  outcomeIdentifier: string,
  weightIdentifier?: string,
): Expression => ({
  ...filtersOf(),
  kind,
  operands: [],
  outcomeIdentifier,
  weightIdentifier: Option.fromUndefinedOr(weightIdentifier),
});

/**
 * Construct a `qti-test-variables`.
 *
 * @param variableIdentifier Its `variable-identifier`.
 * @param written Its `base-type` and `weight-identifier`, each absent unless given.
 * @param written.baseType The `base-type`.
 * @param written.weight The `weight-identifier`.
 * @returns The expression, with no filter.
 */
const testVariables = (
  variableIdentifier: string,
  written: { readonly baseType?: "float" | "integer" | "string"; readonly weight?: string } = {},
): Expression => ({
  ...filtersOf(),
  baseType: Option.fromUndefinedOr(written.baseType),
  kind: "test-variables",
  operands: [],
  variableIdentifier,
  weightIdentifier: Option.fromUndefinedOr(written.weight),
});

/**
 * The aggregate scope. Each item declares the single outcome `SCORE` and weights it by `W`:
 *
 * - `FIRST`: `SCORE` 1.5 of minimum 1 and maximum 10, weight 2, three attempts started.
 * - `SECOND`: integer `SCORE` 4 of minimum -1 and maximum 5, no weight (so 1.0), one attempt.
 * - `THIRD`: `SCORE` NULL of maximum 8 and no minimum, weight 0.5, two attempts; a string `LABEL`.
 */
const aggregates = scopeOf([
  itemOf("FIRST", {
    declarations: {
      outcomes: new Map([["SCORE", outcome("SCORE", "float", { maximum: 10, minimum: 1 })]]),
      responses: new Map(),
      templates: new Map(),
    },
    numAttempts: 3,
    record: {
      correct: {},
      defaults: {},
      outcomes: { SCORE: float(1.5) },
      records: {},
      responses: {},
      templates: {},
    },
    weights: new Map([["W", 2]]),
  }),
  itemOf("SECOND", {
    declarations: {
      outcomes: new Map([["SCORE", outcome("SCORE", "integer", { maximum: 5, minimum: -1 })]]),
      responses: new Map(),
      templates: new Map(),
    },
    record: {
      correct: {},
      defaults: {},
      outcomes: { SCORE: integer(4n) },
      records: {},
      responses: {},
      templates: {},
    },
  }),
  itemOf("THIRD", {
    declarations: {
      outcomes: new Map([
        ["LABEL", outcome("LABEL", "string")],
        ["SCORE", outcome("SCORE", "float", { maximum: 8 })],
      ]),
      responses: new Map(),
      templates: new Map(),
    },
    numAttempts: 2,
    record: {
      correct: {},
      defaults: {},
      outcomes: {
        LABEL: {
          baseType: "string",
          cardinality: "single",
          values: [{ baseType: "string", value: "x" }],
        },
        SCORE: { baseType: "float", cardinality: "single", values: [] },
      },
      records: {},
      responses: {},
      templates: {},
    },
    weights: new Map([["W", 0.5]]),
  }),
]);

/**
 * Construct the scope modelled on the shape of the corpus's `rtest26.xml`, built by hand: item ref
 * `A` declares `SCORE` (maximum 10), and item ref `B` declares `SCORE` (maximum 3) and `NOTA`
 * (maximum 20), and maps its `NOTA` to `SCORE` when `mapped`.
 *
 * @param mapped Whether `B` maps `NOTA` to `SCORE`.
 * @returns The scope.
 */
const mappingScope = (mapped: boolean): TestScope =>
  scopeOf([
    itemOf("A", {
      declarations: {
        outcomes: new Map([["SCORE", outcome("SCORE", "float", { maximum: 10, minimum: 0 })]]),
        responses: new Map(),
        templates: new Map(),
      },
      record: {
        correct: {},
        defaults: {},
        outcomes: { SCORE: float(7) },
        records: {},
        responses: {},
        templates: {},
      },
    }),
    itemOf("B", {
      declarations: {
        outcomes: new Map([
          ["NOTA", outcome("NOTA", "float", { maximum: 20, minimum: 0 })],
          ["SCORE", outcome("SCORE", "float", { maximum: 3, minimum: 0 })],
        ]),
        responses: new Map(),
        templates: new Map(),
      },
      mappings: mapped ? new Map([["SCORE", "NOTA"]]) : new Map(),
      record: {
        correct: {},
        defaults: {},
        outcomes: { NOTA: float(15), SCORE: float(2) },
        records: {},
        responses: {},
        templates: {},
      },
    }),
  ]);

/**
 * Construct an item that declares the single outcome `PTS` of a base type and holds a value of it.
 *
 * @param ref Its item ref's identifier.
 * @param baseType The base type `PTS` is declared with.
 * @param held The value its record holds of `PTS`.
 * @param fields The other fields that differ.
 * @returns The item.
 */
const pointsItem = (
  ref: string,
  baseType: "float" | "integer",
  held: Value,
  fields: Partial<ScopeItem> = {},
): ScopeItem =>
  itemOf(ref, {
    declarations: {
      outcomes: new Map([["PTS", outcome("PTS", baseType)]]),
      responses: new Map(),
      templates: new Map(),
    },
    record: {
      correct: {},
      defaults: {},
      outcomes: { PTS: held },
      records: {},
      responses: {},
      templates: {},
    },
    ...fields,
  });

/**
 * Construct a test document whose outcome processing sets the float outcome `OUT` to each
 * expression, in order, beside the test structure of {@link counting}'s refs.
 *
 * @param expressions The expression elements.
 * @returns The test document.
 */
const testDocument = (expressions: readonly SourceElement[]) =>
  doc(
    "tests/outcome-only.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Outcome-only kinds")],
      [
        el("qti-outcome-declaration", [
          attr("base-type", "float"),
          attr("cardinality", "single"),
          attr("identifier", "OUT"),
        ]),
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
              [attr("identifier", "S1"), attr("title", "S1"), attr("visible", "true")],
              [
                el("qti-assessment-item-ref", [
                  attr("href", "items/correct.xml"),
                  attr("identifier", "CORRECT"),
                ]),
              ],
            ),
          ],
        ),
        el(
          "qti-outcome-processing",
          [],
          expressions.map((expression) =>
            el("qti-set-outcome-value", [attr("identifier", "OUT")], [expression]),
          ),
        ),
      ],
    ),
  );

/**
 * Construct the item info.txt:9332 reads: a choice `RESPONSE` with correct response `A`, answered
 * `A`, beside an upload response `FR` of base type `file`, which the record never holds.
 *
 * @param declaresCorrect Whether `FR` declares a correct response.
 * @returns The item, presented with one attempt started.
 */
const uploading = (declaresCorrect: boolean): ScopeItem =>
  answered("UPLOADING", identifier("A"), {
    unheld: new Map([["FR", { baseType: "file", cardinality: "single" }]]),
    unheldResponses: new Map([["FR", declaresCorrect]]),
  });

/**
 * Give the `qti-number-correct` and `qti-number-incorrect` of one item.
 *
 * @param item The item.
 * @returns The two counts, in that order.
 */
const judging = (item: ScopeItem): readonly Value[] => {
  const all = counts(scopeOf([item]));

  return [all["number-correct"], all["number-incorrect"]];
};

/**
 * Construct a record of string fields.
 *
 * @param fields Each field's identifier keyed to its text.
 * @returns The record.
 */
const stringRecord = (fields: Readonly<Record<string, string>>): RecordValue => ({
  cardinality: "record",
  fields: Object.entries(fields).map(([field, value]) => ({
    identifier: field,
    value: { baseType: "string", value },
  })),
});

/**
 * Construct an item whose only response is the record response `RREC`.
 *
 * @param ref Its item ref's identifier.
 * @param declared The correct response and default `RREC` declares, each none unless given.
 * @param declared.correct The correct response.
 * @param declared.defaultValue The default.
 * @param held The record its record holds of `RREC`, none unless given.
 * @returns The item, presented with one attempt started.
 */
const recordItem = (
  ref: string,
  declared: { readonly correct?: RecordValue; readonly defaultValue?: RecordValue },
  held?: RecordValue,
): ScopeItem => {
  const declaration: RecordDeclaration = {
    correct: Option.fromUndefinedOr(declared.correct),
    defaultValue: Option.fromUndefinedOr(declared.defaultValue),
    identifier: "RREC",
  };

  return itemOf(ref, {
    record: {
      correct: {},
      defaults: {},
      outcomes: {},
      records: held === undefined ? {} : { RREC: held },
      responses: {},
      templates: {},
    },
    records: new Map([["RREC", declaration]]),
  });
};

/**
 * The record `RREC`'s correct response: `stringValue` "12".
 */
const keyRecord = stringRecord({ stringValue: "12" });

/**
 * The record `RREC`'s declared default: `stringValue` "0".
 */
const startRecord = stringRecord({ stringValue: "0" });

/**
 * Give the `qti-number-responded` of one item.
 *
 * @param item The item.
 * @returns The count.
 */
const responded = (item: ScopeItem): Value => counts(scopeOf([item]))["number-responded"];

describe("the test family's evaluators", () => {
  it("[T-9] count over the test scope: selected, presented, responded, correct and incorrect items, an item presented and unanswered incorrect and one never presented not", () => {
    assert.deepStrictEqual(counts(counting), expected(1n, 2n, 5n, 3n, 6n));
  });

  it("[T-9] count over the test scope the items a section-identifier holds, a nested section's counted", () => {
    assert.deepStrictEqual(
      counts(counting, filtersOf({ section: "S1" })),
      expected(1n, 1n, 2n, 2n, 2n),
    );
    assert.deepStrictEqual(
      counts(counting, filtersOf({ section: "S2" })),
      expected(0n, 1n, 1n, 1n, 1n),
    );
    assert.deepStrictEqual(
      counts(counting, filtersOf({ section: "NONE" })),
      expected(0n, 0n, 0n, 0n, 0n),
    );
  });

  it("[T-9] count over the test scope the items include-category keeps and exclude-category drops, one shared category each", () => {
    assert.deepStrictEqual(
      counts(counting, filtersOf({ include: ["easy"] })),
      expected(1n, 1n, 2n, 1n, 2n),
    );
    assert.deepStrictEqual(
      counts(counting, filtersOf({ exclude: ["hard"] })),
      expected(1n, 0n, 3n, 2n, 4n),
    );
    assert.deepStrictEqual(
      counts(counting, filtersOf({ exclude: ["hard"], include: ["easy"] })),
      expected(1n, 0n, 1n, 1n, 1n),
    );
    assert.deepStrictEqual(
      counts(counting, filtersOf({ include: [] })),
      expected(0n, 0n, 0n, 0n, 0n),
    );
  });

  it("[T-9] count over the test scope an item whose template processing set its correct response as correct", () => {
    const keyless = (held: string): ScopeItem =>
      itemOf("KEYLESS", {
        declarations: {
          outcomes: new Map(),
          responses: new Map([["RESPONSE", response()]]),
          templates: new Map(),
        },
        record: {
          correct: { RESPONSE: identifier("B") },
          defaults: {},
          outcomes: {},
          records: {},
          responses: { RESPONSE: identifier(held) },
          templates: {},
        },
      });

    assert.deepStrictEqual(
      [
        counts(scopeOf([keyless("B")]))["number-correct"],
        counts(scopeOf([keyless("A")]))["number-incorrect"],
        counts(
          scopeOf([
            answered("SET", identifier("B"), {
              record: {
                correct: { RESPONSE: identifier("B") },
                defaults: {},
                outcomes: {},
                records: {},
                responses: { RESPONSE: identifier("B") },
                templates: {},
              },
            }),
          ]),
        )["number-correct"],
      ],
      [integer(1n), integer(1n), integer(1n)],
    );
  });

  it("[T-9] count over the test scope an item whose response still holds the default its template processing set as not responded", () => {
    const holding = (defaults: Readonly<Record<string, Value>>): ScopeItem =>
      itemOf("DEFAULTED", {
        declarations: {
          outcomes: new Map(),
          responses: new Map([["RESPONSE", response("A")]]),
          templates: new Map(),
        },
        record: {
          correct: {},
          defaults,
          outcomes: {},
          records: {},
          responses: { RESPONSE: identifier("C") },
          templates: {},
        },
      });

    assert.deepStrictEqual(
      [
        counts(scopeOf([holding({ RESPONSE: identifier("C") })]))["number-responded"],
        counts(scopeOf([holding({})]))["number-responded"],
      ],
      [integer(0n), integer(1n)],
    );
  });

  it("[T-9] count over the test scope an item that declares no response as neither correct nor incorrect", () => {
    assert.deepStrictEqual(
      counts(scopeOf([itemOf("NO_RESPONSE", { numAttempts: 2 })])),
      expected(0n, 0n, 1n, 0n, 1n),
    );
  });

  it("[T-9] an unheld response is considered: an item whose file response declares no correct response is neither correct nor incorrect (info.txt:9332)", () => {
    assert.deepStrictEqual(judging(uploading(false)), [integer(0n), integer(0n)]);
    // The control: without the upload response, the same answer is correct.
    assert.deepStrictEqual(judging(answered("UPLOADING", identifier("A"))), [
      integer(1n),
      integer(0n),
    ]);
  });

  it("[T-9] an unheld response is considered: an item whose file response declares a correct response is judged, that response NULL and so not matched, which makes it incorrect", () => {
    assert.deepStrictEqual(judging(uploading(true)), [integer(0n), integer(1n)]);
  });

  it("[T-9] qti-number-responded counts an item whose only response is a record response through its item ref that differs from its default, the declared one or else the NULL record", () => {
    assert.deepStrictEqual(
      [
        responded(recordItem("CHANGED", { defaultValue: startRecord }, keyRecord)),
        responded(recordItem("ANSWERED", {}, keyRecord)),
        responded(recordItem("AT_DEFAULT", { defaultValue: startRecord }, startRecord)),
        responded(
          recordItem(
            "REORDERED",
            { defaultValue: stringRecord({ floatValue: "0", stringValue: "0" }) },
            {
              cardinality: "record",
              fields: [
                { identifier: "stringValue", value: { baseType: "string", value: "0" } },
                { identifier: "floatValue", value: { baseType: "string", value: "0" } },
              ],
            },
          ),
        ),
        responded(recordItem("UNANSWERED", {})),
      ],
      [integer(1n), integer(1n), integer(0n), integer(0n), integer(0n)],
    );
  });

  it("[T-9] qti-number-correct counts an item whose record response through its item ref equals its correct response, and qti-number-incorrect one that does not", () => {
    const fieldMore = stringRecord({ floatValue: "12", stringValue: "12" });

    assert.deepStrictEqual(
      [
        judging(recordItem("EQUAL", { correct: keyRecord }, stringRecord({ stringValue: "12" }))),
        judging(recordItem("FIELD_MORE", { correct: keyRecord }, fieldMore)),
        judging(recordItem("UNANSWERED", { correct: keyRecord })),
      ],
      [
        [integer(1n), integer(0n)],
        [integer(0n), integer(1n)],
        [integer(0n), integer(1n)],
      ],
    );
  });

  it("[T-9] an item whose record response through its item ref declares no correct response is not judged: neither correct nor incorrect, whatever it holds", () => {
    assert.deepStrictEqual(
      [
        judging(recordItem("KEYLESS", {}, keyRecord)),
        judging(recordItem("KEYLESS", {}, stringRecord({ stringValue: "7" }))),
      ],
      [
        [integer(0n), integer(0n)],
        [integer(0n), integer(0n)],
      ],
    );

    // The control: beside a choice response with a correct response, a keyless record still keeps
    // the item unjudged, and with the record keyed and matched the item is correct.
    const beside = (correct?: RecordValue): ScopeItem =>
      answered("BESIDE", identifier("A"), {
        record: {
          correct: {},
          defaults: {},
          outcomes: {},
          records: { RREC: keyRecord },
          responses: { RESPONSE: identifier("A") },
          templates: {},
        },
        records: new Map([
          [
            "RREC",
            {
              correct: Option.fromUndefinedOr(correct),
              defaultValue: Option.none(),
              identifier: "RREC",
            },
          ],
        ]),
      });
    assert.deepStrictEqual(judging(beside()), [integer(0n), integer(0n)]);
    assert.deepStrictEqual(judging(beside(keyRecord)), [integer(1n), integer(0n)]);
  });

  it("[T-9] give qti-outcome-minimum over the test scope, weighted, an item with no declared minimum ignored", () => {
    assert.deepStrictEqual(
      [
        valueOf(bound("outcome-minimum", "SCORE"), aggregates),
        valueOf(bound("outcome-minimum", "SCORE", "W"), aggregates),
      ],
      [floats(1, -1), floats(2, -1)],
    );
  });

  it("[T-9] give qti-outcome-maximum over the test scope, weighted, and NULL when an item has no declared maximum", () => {
    const lacking = scopeOf([
      ...aggregates.items,
      itemOf("FOURTH", {
        declarations: {
          outcomes: new Map([["SCORE", outcome("SCORE", "float", { minimum: 0 })]]),
          responses: new Map(),
          templates: new Map(),
        },
        record: {
          correct: {},
          defaults: {},
          outcomes: { SCORE: float(1) },
          records: {},
          responses: {},
          templates: {},
        },
      }),
    ]);

    assert.deepStrictEqual(
      [
        valueOf(bound("outcome-maximum", "SCORE"), aggregates),
        valueOf(bound("outcome-maximum", "SCORE", "W"), aggregates),
        valueOf(bound("outcome-maximum", "SCORE"), lacking),
        valueOf(bound("outcome-minimum", "SCORE"), lacking),
      ],
      [floats(10, 5, 8), floats(20, 5, 4), floats(), floats(1, -1, 0)],
    );
  });

  it("[T-9] give qti-outcome-minimum and qti-outcome-maximum over the test scope of numAttempts, which declares neither: ignored by the minimum, NULL from the maximum", () => {
    assert.deepStrictEqual(
      [
        valueOf(bound("outcome-minimum", "numAttempts"), aggregates),
        valueOf(bound("outcome-maximum", "numAttempts", "W"), aggregates),
      ],
      [floats(), floats()],
    );
  });

  it("[T-9] collect qti-test-variables over the test scope: every declaration it matches an integer and unweighted a multiple integer, else a multiple float, NULLs ignored", () => {
    const integersOnly = scopeOf([aggregates.items[1] ?? itemOf("MISSING")]);

    assert.deepStrictEqual(
      [
        valueOf(testVariables("SCORE"), aggregates),
        valueOf(testVariables("SCORE"), integersOnly),
        valueOf(testVariables("SCORE", { weight: "W" }), integersOnly),
        valueOf(testVariables("SCORE", { weight: "W" }), aggregates),
      ],
      [floats(1.5, 4), integers(4n), floats(4), floats(3, 4)],
    );
  });

  it("[T-9] collect qti-test-variables over the test scope by base-type when written, and only integer or float variables when not", () => {
    assert.deepStrictEqual(
      [
        valueOf(testVariables("SCORE", { baseType: "float" }), aggregates),
        valueOf(testVariables("SCORE", { baseType: "integer" }), aggregates),
        valueOf(testVariables("LABEL"), aggregates),
        valueOf(testVariables("LABEL", { baseType: "string" }), aggregates),
      ],
      [
        floats(1.5),
        integers(4n),
        integers(),
        {
          baseType: "string",
          cardinality: "multiple",
          values: [{ baseType: "string", value: "x" }],
        },
      ],
    );
  });

  it("[T-9] collect qti-test-variables over the test scope of numAttempts as each item's count of attempts started", () => {
    assert.deepStrictEqual(valueOf(testVariables("numAttempts"), aggregates), integers(3n, 1n, 2n));
  });

  it("[T-9] collection typed from the items: a float PTS declared beside an integer one makes qti-test-variables with no base-type a multiple float, the integer promoted, though the float's value is NULL (G-R3 199)", () => {
    assert.deepStrictEqual(
      valueOf(
        testVariables("PTS"),
        scopeOf([
          pointsItem("INT", "integer", integer(4n)),
          pointsItem("FLT", "float", { baseType: "float", cardinality: "single", values: [] }),
        ]),
      ),
      floats(4),
    );
  });

  it("[T-9] collection typed from the items: every PTS declared integer makes qti-test-variables with no base-type a multiple integer (G-R3 199)", () => {
    assert.deepStrictEqual(
      valueOf(
        testVariables("PTS"),
        scopeOf([
          pointsItem("FIRST", "integer", integer(4n)),
          pointsItem("SECOND", "integer", integer(2n)),
        ]),
      ),
      integers(4n, 2n),
    );
  });

  it("[T-9] collection typed from the items: a filter that keeps only the integer PTS still gives a multiple float when an item it drops declares PTS float, whatever the filters (G-R3 199)", () => {
    const scope = scopeOf(
      [
        pointsItem("INT", "integer", integer(4n), { categories: ["kept"] }),
        pointsItem("FLT", "float", float(1.5)),
      ],
      new Map([["S1", ["INT"]]]),
    );

    assert.deepStrictEqual(
      [
        valueOf({ ...testVariables("PTS"), ...filtersOf({ include: ["kept"] }) }, scope),
        valueOf({ ...testVariables("PTS"), ...filtersOf({ section: "S1" }) }, scope),
      ],
      [floats(4), floats(4)],
    );
  });

  it("[T-9] collection typed from the items: a declaration read through an item ref's mappings counts, so B's float NOTA, which B maps to PTS, makes the collection float (G-R3 199)", () => {
    const nota = itemOf("B", {
      declarations: {
        outcomes: new Map([
          ["NOTA", outcome("NOTA", "float")],
          ["PTS", outcome("PTS", "integer")],
        ]),
        responses: new Map(),
        templates: new Map(),
      },
      record: {
        correct: {},
        defaults: {},
        outcomes: {
          NOTA: { baseType: "float", cardinality: "single", values: [] },
          PTS: integer(1n),
        },
        records: {},
        responses: {},
        templates: {},
      },
    });

    assert.deepStrictEqual(
      [
        valueOf(
          testVariables("PTS"),
          scopeOf([
            pointsItem("A", "integer", integer(4n)),
            { ...nota, mappings: new Map([["PTS", "NOTA"]]) },
          ]),
        ),
        valueOf(testVariables("PTS"), scopeOf([pointsItem("A", "integer", integer(4n)), nota])),
      ],
      [floats(4), integers(4n, 1n)],
    );
  });

  it("[T-9] variable mapping: qti-test-variables and qti-outcome-maximum read item ref B's NOTA where B maps it to SCORE", () => {
    assert.deepStrictEqual(
      [
        valueOf(testVariables("SCORE"), mappingScope(true)),
        valueOf(bound("outcome-maximum", "SCORE"), mappingScope(true)),
      ],
      [floats(7, 15), floats(10, 20)],
    );
  });

  it("[T-9] variable mapping control: with no mapping, each item ref's own SCORE is read", () => {
    assert.deepStrictEqual(
      [
        valueOf(testVariables("SCORE"), mappingScope(false)),
        valueOf(bound("outcome-maximum", "SCORE"), mappingScope(false)),
      ],
      [floats(7, 2), floats(10, 3)],
    );
  });

  it("[T-9] give NULL over the test scope for a container past the container bound", () => {
    const many = scopeOf(
      Array.from(
        { length: containerSizeBound + 1 },
        () => aggregates.items[1] ?? itemOf("MISSING"),
      ),
    );

    assert.deepStrictEqual(
      [
        valueOf(testVariables("SCORE"), many),
        valueOf(bound("outcome-minimum", "SCORE"), many),
        valueOf(bound("outcome-maximum", "SCORE"), many),
      ],
      [integers(), floats(), floats()],
    );
  });

  it("[T-9] fail each kind with no test scope as the record's gap, never a crash", () => {
    const kinds: readonly Expression[] = [
      ...(
        [
          "number-correct",
          "number-incorrect",
          "number-presented",
          "number-responded",
          "number-selected",
        ] as const
      ).map((kind): Expression => ({ ...filtersOf(), kind, operands: [] })),
      bound("outcome-maximum", "SCORE"),
      bound("outcome-minimum", "SCORE"),
      testVariables("SCORE"),
    ];

    assert.deepStrictEqual(
      kinds.map((expression) => gapOf(run(expression))),
      kinds.map((expression) => ({
        _tag: "UnknownIdentifierError",
        holder: "record",
        identifier: `qti-${expression.kind}`,
        role: "variable",
      })),
    );
  });

  it("[T-9] fail a count over the test scope with the record's gap when a record lacks a declared response", () => {
    const gap = itemOf("GAP", {
      declarations: {
        outcomes: new Map(),
        responses: new Map([["RESPONSE", response("A")]]),
        templates: new Map(),
      },
    });

    assert.deepStrictEqual(
      gapOf(run({ ...filtersOf(), kind: "number-correct", operands: [] }, scopeOf([gap]))),
      {
        _tag: "UnknownIdentifierError",
        holder: "record",
        identifier: "RESPONSE",
        role: "response",
      },
    );
  });

  it.effect(
    "[T-9] agree on each of the eight kinds over the test scope: the reader's variant, the model's type and the evaluator's value",
    () =>
      Effect.gen(function* agreeOnEachKind() {
        const built = yield* Effect.fromResult(
          buildTest(
            testDocument([
              el("qti-number-correct"),
              el("qti-number-incorrect"),
              el("qti-number-presented", [attr("section-identifier", "S1")]),
              el("qti-number-responded", [attr("include-category", "easy")]),
              el("qti-number-selected", [attr("exclude-category", "hard")]),
              el("qti-outcome-maximum", [
                attr("outcome-identifier", "SCORE"),
                attr("weight-identifier", "W"),
              ]),
              el("qti-outcome-minimum", [attr("outcome-identifier", "SCORE")]),
              el("qti-test-variables", [attr("variable-identifier", "SCORE")]),
              el("qti-test-variables", [
                attr("base-type", "integer"),
                attr("variable-identifier", "SCORE"),
              ]),
            ]),
          ),
        );
        assert.strictEqual(built.outcomeProcessing.kind, "runs");

        const rules = built.outcomeProcessing.kind === "runs" ? built.outcomeProcessing.rules : [];
        const values = rules.flatMap((rule) =>
          rule.kind === "set-outcome"
            ? [
                [
                  rule.expression.kind,
                  valueOf(
                    rule.expression,
                    rule.expression.kind.startsWith("number-") ? counting : aggregates,
                  ),
                ] as const,
              ]
            : [],
        );

        assert.deepStrictEqual(values, [
          ["number-correct", integer(1n)],
          ["number-incorrect", integer(2n)],
          ["number-presented", integer(2n)],
          ["number-responded", integer(1n)],
          ["number-selected", integer(4n)],
          ["outcome-maximum", floats(20, 5, 4)],
          ["outcome-minimum", floats(1, -1)],
          ["test-variables", floats(1.5, 4)],
          ["test-variables", integers(4n)],
        ]);
      }),
  );
});
