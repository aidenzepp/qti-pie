import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression, ResultAttributes } from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import { buildTest } from "#plate/model/test.ts";
import type { MarkedFeature, Test } from "#plate/model/test.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The path of the test's outcome processing.
 */
const processingPath = "qti-assessment-test/qti-outcome-processing";

/**
 * Construct a test document whose outcome processing sets the float outcome `OUT` to each
 * expression, in order.
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
                  attr("href", "items/one.xml"),
                  attr("identifier", "I1"),
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
 * What a test's outcome processing reads: its state, the expressions its rules read and its marks.
 */
interface Read {
  readonly expressions: readonly Expression[];
  readonly marks: readonly MarkedFeature[];
  readonly state: Test["outcomeProcessing"]["kind"];
}

/**
 * Build a test whose outcome processing sets `OUT` to each expression, and give what it reads.
 *
 * @param expressions The expression elements.
 * @returns The state, the expressions in order (none unless it runs) and the marks, or the
 *   model's refusal.
 */
const readAll = (expressions: readonly SourceElement[]): Effect.Effect<Read, Refusal> =>
  Effect.map(buildTest(testDocument(expressions)), (built) => ({
    expressions:
      built.outcomeProcessing.kind === "runs"
        ? built.outcomeProcessing.rules.flatMap((rule) =>
            rule.kind === "set-outcome" ? [rule.expression] : [],
          )
        : [],
    marks: built.unsupported,
    state: built.outcomeProcessing.kind,
  }));

/**
 * No filter: the filters of an outcome-only kind that writes none.
 */
const unfiltered = {
  excludeCategory: Option.none(),
  includeCategory: Option.none(),
  sectionIdentifier: Option.none(),
} as const;

/**
 * Construct a mark at a path.
 *
 * @param feature The mark's key.
 * @param path Its path.
 * @returns The marked feature.
 */
const mark = (feature: string, path: string): MarkedFeature => ({ feature, path, shown: "mark" });

describe("the test family's reader specs", () => {
  it.effect(
    "[T-9] read the five counts over the test scope with their filters: a section-identifier trimmed, each category list split on XML whitespace, an empty list written as empty",
    () =>
      Effect.gen(function* readsCounts() {
        const read = yield* readAll([
          el("qti-number-correct"),
          el("qti-number-incorrect", [attr("section-identifier", " S1 ")]),
          el("qti-number-presented", [attr("include-category", "\teasy  hard\n")]),
          el("qti-number-responded", [attr("exclude-category", "")]),
          el("qti-number-selected", [
            attr("exclude-category", "practice"),
            attr("include-category", "scored"),
            attr("section-identifier", "S1"),
          ]),
        ]);
        const expected: readonly Expression[] = [
          { ...unfiltered, kind: "number-correct", operands: [] },
          {
            ...unfiltered,
            kind: "number-incorrect",
            operands: [],
            sectionIdentifier: Option.some("S1"),
          },
          {
            ...unfiltered,
            includeCategory: Option.some(["easy", "hard"]),
            kind: "number-presented",
            operands: [],
          },
          {
            ...unfiltered,
            excludeCategory: Option.some([]),
            kind: "number-responded",
            operands: [],
          },
          {
            excludeCategory: Option.some(["practice"]),
            includeCategory: Option.some(["scored"]),
            kind: "number-selected",
            operands: [],
            sectionIdentifier: Option.some("S1"),
          },
        ];

        assert.deepStrictEqual(read, { expressions: expected, marks: [], state: "runs" });
      }),
  );

  it.effect(
    "[T-9] read qti-outcome-minimum and qti-outcome-maximum over the test scope: the outcome-identifier and weight-identifier trimmed",
    () =>
      Effect.gen(function* readsBounds() {
        const read = yield* readAll([
          el("qti-outcome-minimum", [attr("outcome-identifier", " SCORE ")]),
          el("qti-outcome-maximum", [
            attr("include-category", "scored"),
            attr("outcome-identifier", "SCORE"),
            attr("weight-identifier", "\tW\n"),
          ]),
        ]);
        const expected: readonly Expression[] = [
          {
            ...unfiltered,
            kind: "outcome-minimum",
            operands: [],
            outcomeIdentifier: "SCORE",
            weightIdentifier: Option.none(),
          },
          {
            ...unfiltered,
            includeCategory: Option.some(["scored"]),
            kind: "outcome-maximum",
            operands: [],
            outcomeIdentifier: "SCORE",
            weightIdentifier: Option.some("W"),
          },
        ];

        assert.deepStrictEqual(read, { expressions: expected, marks: [], state: "runs" });
      }),
  );

  it.effect(
    "[T-9] read qti-test-variables over the test scope: its variable-identifier, its base-type when written and its weight-identifier",
    () =>
      Effect.gen(function* readsTestVariables() {
        const read = yield* readAll([
          el("qti-test-variables", [attr("variable-identifier", "SCORE")]),
          el("qti-test-variables", [
            attr("base-type", "float"),
            attr("section-identifier", "S1"),
            attr("variable-identifier", " SCORE "),
            attr("weight-identifier", "W"),
          ]),
        ]);
        const expected: readonly Expression[] = [
          {
            ...unfiltered,
            baseType: Option.none(),
            kind: "test-variables",
            operands: [],
            variableIdentifier: "SCORE",
            weightIdentifier: Option.none(),
          },
          {
            ...unfiltered,
            baseType: Option.some("float"),
            kind: "test-variables",
            operands: [],
            sectionIdentifier: Option.some("S1"),
            variableIdentifier: "SCORE",
            weightIdentifier: Option.some("W"),
          },
        ];

        assert.deepStrictEqual(read, { expressions: expected, marks: [], state: "runs" });
      }),
  );

  it.effect(
    "[T-9] mark a qti-test-variables of base-type file, whose values the engine does not hold, and a count with an operand, so the outcome processing is marked",
    () =>
      Effect.gen(function* marksUnheld() {
        const read = yield* readAll([
          el("qti-test-variables", [
            attr("base-type", "file"),
            attr("variable-identifier", "UPLOAD"),
          ]),
          el(
            "qti-number-correct",
            [],
            [el("qti-base-value", [attr("base-type", "integer")], [text("1")])],
          ),
        ]);

        assert.deepStrictEqual(read, {
          expressions: [],
          marks: [
            mark(
              'base-type="file"',
              `${processingPath}/qti-set-outcome-value[1]/qti-test-variables`,
            ),
            mark(
              "qti-number-correct",
              `${processingPath}/qti-set-outcome-value[2]/qti-number-correct`,
            ),
          ],
          state: "marked",
        });
      }),
  );
});

/**
 * Give the type the kind rule of `qti-test-variables` gives under attributes.
 *
 * @param attributes The attributes its caller fills in.
 * @returns The type.
 */
const collectionTyped = (attributes: ResultAttributes) =>
  kindRules["test-variables"].resultType([], attributes);

describe("the test family's kind rules", () => {
  it("[T-9] type each count over the test scope a single integer, the collected minimum and maximum a multiple float, and qti-test-variables a multiple of its written base-type, else a float when weighted, else unknown (G-R3 199)", () => {
    const none: readonly [] = [];
    const typed = (kind: keyof typeof kindRules, attributes: ResultAttributes = {}) =>
      kindRules[kind].resultType(none, attributes);

    assert.deepStrictEqual(
      {
        numberCorrect: typed("number-correct"),
        numberIncorrect: typed("number-incorrect"),
        numberPresented: typed("number-presented"),
        numberResponded: typed("number-responded"),
        numberSelected: typed("number-selected"),
        outcomeMaximum: typed("outcome-maximum"),
        outcomeMinimum: typed("outcome-minimum"),
        testVariables: typed("test-variables"),
        testVariablesInteger: typed("test-variables", { baseType: "integer" }),
        testVariablesWeighted: typed("test-variables", { weighted: true }),
        testVariablesWeightedFloat: typed("test-variables", { baseType: "float", weighted: true }),
        testVariablesWeightedString: typed("test-variables", {
          baseType: "string",
          weighted: true,
        }),
      },
      {
        numberCorrect: { baseType: "integer", cardinality: "single" },
        numberIncorrect: { baseType: "integer", cardinality: "single" },
        numberPresented: { baseType: "integer", cardinality: "single" },
        numberResponded: { baseType: "integer", cardinality: "single" },
        numberSelected: { baseType: "integer", cardinality: "single" },
        outcomeMaximum: { baseType: "float", cardinality: "multiple" },
        outcomeMinimum: { baseType: "float", cardinality: "multiple" },
        testVariables: { baseType: "unknown", cardinality: "multiple" },
        testVariablesInteger: { baseType: "integer", cardinality: "multiple" },
        testVariablesWeighted: { baseType: "float", cardinality: "multiple" },
        testVariablesWeightedFloat: { baseType: "float", cardinality: "multiple" },
        testVariablesWeightedString: { baseType: "string", cardinality: "multiple" },
      },
    );
  });

  it("[T-9] collection typed from the items: qti-test-variables unweighted with no base-type is a multiple of the collected base type its caller gives, and unknown with none; a written base-type and a weight still decide first (G-R3 199)", () => {
    assert.deepStrictEqual(
      [
        collectionTyped({ collected: "integer" }),
        collectionTyped({ collected: "float" }),
        collectionTyped({}),
        collectionTyped({ baseType: "string", collected: "float" }),
        collectionTyped({ baseType: "float", collected: "integer" }),
        collectionTyped({ collected: "integer", weighted: true }),
      ],
      [
        { baseType: "integer", cardinality: "multiple" },
        { baseType: "float", cardinality: "multiple" },
        { baseType: "unknown", cardinality: "multiple" },
        { baseType: "string", cardinality: "multiple" },
        { baseType: "float", cardinality: "multiple" },
        { baseType: "float", cardinality: "multiple" },
      ],
    );
  });

  it("[T-9] declare no declaration facet and no reference facet on any of the eight kinds, and accept any operand", () => {
    const kinds = [
      "number-correct",
      "number-incorrect",
      "number-presented",
      "number-responded",
      "number-selected",
      "outcome-maximum",
      "outcome-minimum",
      "test-variables",
    ] as const;

    assert.deepStrictEqual(
      kinds.map((kind) => ({
        declaration: kindRules[kind].declaration,
        mismatches: kindRules[kind].operandsAccept([
          { baseType: "string", cardinality: "ordered" },
        ]),
        references: kindRules[kind].references,
      })),
      kinds.map(() => ({ declaration: undefined, mismatches: [], references: [] })),
    );
  });
});
