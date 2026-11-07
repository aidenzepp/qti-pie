import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { Configuration, configure } from "#plate/configuration.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import { Malformed } from "#plate/form/encoding.ts";
import type { PostedBaseType } from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import type {
  ChoiceInteraction,
  InlineChoiceInteraction,
  Item,
  TemplateVisibility,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { render } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { fitting, score, tierA } from "#plate/score.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { open } from "#plate/validate/open.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Construct a value of identifiers.
 *
 * @param cardinality The value's cardinality.
 * @param chosen The identifiers it holds, none for NULL.
 * @returns The value.
 */
const identifiers = (cardinality: Value["cardinality"], ...chosen: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: chosen.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Construct a Choice of the given identifiers bound to a response, with no Prompt.
 *
 * @param response The response it binds.
 * @param cardinality The response's cardinality.
 * @param counts Its `max-choices` and `min-choices`.
 * @param choices The choices' identifiers, each its own content.
 * @returns The Choice.
 */
const choiceOf = (
  response: string,
  cardinality: ChoiceInteraction["cardinality"],
  counts: Pick<ChoiceInteraction, "maxChoices" | "minChoices">,
  choices: readonly string[],
): ChoiceInteraction => ({
  ariaLabel: Option.some(response),
  ariaLabelledby: Option.none(),
  cardinality,
  choices: choices.map((identifier) => ({
    content: [{ kind: "text", text: identifier }],
    fixed: false,
    identifier,
    templateVisibility: Option.none(),
  })),
  class: "",
  kind: "choice",
  messages: { max: Option.none(), min: Option.none() },
  orientation: Option.none(),
  path: `qti-assessment-item/qti-item-body/qti-choice-interaction[${response}]`,
  prompt: Option.none(),
  response,
  shuffle: false,
  ...counts,
});

/**
 * A Text Entry bound to the single integer response `NUMBER`.
 */
const number: TextEntryInteraction = {
  ariaLabel: Option.some("A number"),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "integer",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response: "NUMBER",
};

/**
 * A hand-built item scored by `match_correct`: a single Choice `RESPONSE` whose correct choice is
 * `A`, a multiple Choice `PICK` of two exactly (`max-choices` and `min-choices` 2), and a paragraph
 * holding the integer Text Entry `NUMBER`. Its processing sets the float `SCORE` to 1 when
 * `RESPONSE` matches its correct response, else to 0.
 */
const item: Item = {
  body: [
    choiceOf("RESPONSE", "single", { maxChoices: 1n, minChoices: 0n }, ["A", "B", "C"]),
    choiceOf("PICK", "multiple", { maxChoices: 2n, minChoices: 2n }, ["A", "B", "C", "D"]),
    {
      attributes: [],
      children: [{ kind: "text", text: "Pick a number: " }, number],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/scored.xml",
  identifier: "scored",
  lang: Option.none(),
  outcomes: new Map([
    [
      "SCORE",
      {
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
      },
    ],
  ]),
  processing: Option.some([
    {
      branches: [
        {
          // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the item model fixes; it is an array, never a function.
          then: [
            {
              expression: { kind: "base-value", operands: [], value: float(1) },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ],
          when: {
            kind: "match",
            operands: [
              {
                identifier: "RESPONSE",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              { identifier: "RESPONSE", kind: "correct", operands: [] },
            ],
          },
        },
      ],
      kind: "condition",
      otherwise: Option.some([
        {
          expression: { kind: "base-value", operands: [], value: float(0) },
          identifier: "SCORE",
          kind: "set-outcome",
        },
      ]),
    },
  ]),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some(identifiers("single", "A")),
        defaultValue: Option.none(),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
    [
      "PICK",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "multiple",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "PICK",
        mapping: Option.none(),
      },
    ],
    [
      "NUMBER",
      {
        areaMapping: Option.none(),
        baseType: "integer",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "NUMBER",
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Scored",
  unsupported: [],
};

/**
 * The item as `check` would accept it, through the tests' named seam.
 */
const accepted = acceptForTest(item);

/**
 * A required Inline Choice of choices `A`, `B` and `C`, bound to the single identifier response
 * `TONE`.
 */
const tone: InlineChoiceInteraction = {
  ariaLabel: Option.some("Tone"),
  ariaLabelledby: Option.none(),
  choices: ["A", "B", "C"].map((identifier) => ({
    content: [{ kind: "text", text: identifier }],
    fixed: false,
    identifier,
    templateVisibility: Option.none(),
  })),
  class: "",
  kind: "inline-choice",
  label: Option.none(),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: true,
  response: "TONE",
  shuffle: false,
};

/**
 * An item whose one paragraph holds {@link tone}, with no processing, as `check` would accept it.
 */
const inlineAccepted = acceptForTest({
  ...item,
  body: [
    {
      attributes: [],
      children: [{ kind: "text", text: "The tone is " }, tone],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/tone.xml",
  identifier: "tone",
  processing: Option.none(),
  responses: new Map([
    [
      "TONE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "TONE",
        mapping: Option.none(),
      },
    ],
  ]),
});

/**
 * Another item, at another location: a record of it never belongs to {@link item}.
 */
const other = acceptForTest({ ...item, document: "items/other.xml", identifier: "other" });

/**
 * A hand-built item whose template processing runs: {@link item} with the single integer template
 * variable `T`, which its template processing sets to 7, the default of `SCORE` set to 0.5, and the
 * correct response of `RESPONSE` set to `B`, so `B`, not the declared `A`, scores 1.
 */
const templatedItem: Item = {
  ...item,
  document: "items/templated.xml",
  identifier: "templated",
  templateProcessing: Option.some([
    {
      expression: { kind: "base-value", operands: [], value: integer(7n) },
      identifier: "T",
      kind: "set-template-value",
    },
    {
      expression: { kind: "base-value", operands: [], value: float(0.5) },
      identifier: "SCORE",
      kind: "set-default-value",
    },
    {
      expression: { kind: "base-value", operands: [], value: identifiers("single", "B") },
      identifier: "RESPONSE",
      kind: "set-correct-response",
    },
  ]),
  templates: new Map([
    [
      "T",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "T",
        mathVariable: false,
        paramVariable: false,
      },
    ],
  ]),
};

/**
 * {@link templatedItem} as `check` would accept it, through the tests' named seam.
 */
const templated = acceptForTest(templatedItem);

/**
 * {@link item} with `RESPONSE` declaring the default `A`, its correct response, as `check` would
 * accept it: an attempt that posts no `RESPONSE` scores its default, 1.
 */
const defaulted = acceptForTest({
  ...item,
  document: "items/defaulted.xml",
  identifier: "defaulted",
  responses: new Map(
    Array.from(item.responses, ([identifier, declaration]) => [
      identifier,
      identifier === "RESPONSE"
        ? { ...declaration, defaultValue: Option.some(identifiers("single", "A")) }
        : declaration,
    ]),
  ),
});

/**
 * The template visibility of a part shown when the template variable `SHOWN` holds its identifier.
 */
const shownBy: TemplateVisibility = { showHide: "show", templateIdentifier: "SHOWN" };

/**
 * The single Choice `RESPONSE` of {@link visibleItem}: choice `A` with no template visibility, and
 * `B` and `C` each {@link shownBy}.
 */
const visibleChoice: ChoiceInteraction = (() => {
  const choice = choiceOf("RESPONSE", "single", { maxChoices: 1n, minChoices: 0n }, [
    "A",
    "B",
    "C",
  ]);

  return {
    ...choice,
    choices: choice.choices.map((simple) =>
      simple.identifier === "A" ? simple : { ...simple, templateVisibility: Option.some(shownBy) },
    ),
  };
})();

/**
 * A hand-built item whose template processing sets the single identifier template variable `SHOWN`
 * to `B`, so its record shows {@link visibleChoice}'s `A` and `B` and hides `C`, and hides the
 * template block shown when `SHOWN` holds `C`, which holds the integer Text Entry `HIDDEN`,
 * declared with the default 3. Its processing sets `SCORE` to 1 when `RESPONSE` matches its correct
 * response, `B`, else to 0, and the integer `ECHO` to `HIDDEN`.
 */
const visibleItem: Item = {
  ...item,
  body: [
    visibleChoice,
    {
      content: [
        {
          attributes: [],
          children: [
            {
              ...number,
              path: "qti-assessment-item/qti-item-body/qti-template-block/p/qti-text-entry-interaction",
              response: "HIDDEN",
            },
          ],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/qti-template-block/p",
          tag: "p",
        },
      ],
      identifier: "C",
      kind: "template-block",
      path: "qti-assessment-item/qti-item-body/qti-template-block",
      responses: ["HIDDEN"],
      templateVisibility: shownBy,
    },
  ],
  document: "items/visible.xml",
  identifier: "visible",
  outcomes: new Map([
    ...item.outcomes,
    [
      "ECHO",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "ECHO",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
  ]),
  processing: Option.some([
    ...Option.getOrElse(item.processing, () => []),
    {
      expression: {
        identifier: "HIDDEN",
        kind: "variable",
        operands: [],
        weightIdentifier: Option.none(),
      },
      identifier: "ECHO",
      kind: "set-outcome",
    },
  ]),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some(identifiers("single", "B")),
        defaultValue: Option.none(),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
    [
      "HIDDEN",
      {
        areaMapping: Option.none(),
        baseType: "integer",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.some(integer(3n)),
        identifier: "HIDDEN",
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.some([
    {
      expression: { kind: "base-value", operands: [], value: identifiers("single", "B") },
      identifier: "SHOWN",
      kind: "set-template-value",
    },
  ]),
  templates: new Map([
    [
      "SHOWN",
      {
        baseType: "identifier",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "SHOWN",
        mathVariable: false,
        paramVariable: false,
      },
    ],
  ]),
};

/**
 * {@link visibleItem} as `check` would accept it, through the tests' named seam.
 */
const visible = acceptForTest(visibleItem);

/**
 * Give the failure of a score, after checking it is a `Result` at all.
 *
 * @param result What `score` returned.
 * @returns Its failure, or none when it succeeded.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): Option.Option<E> => {
  assert.isTrue(Result.isResult(result));

  return Result.getFailure(result);
};

/**
 * Give one outcome of a stored record, as its value's numbers.
 *
 * @param stored The stored record.
 * @param identifier The outcome.
 * @returns The outcome's stored values, none when the record lacks it.
 */
const outcomeOf = (stored: StoredRecord, identifier: string): readonly unknown[] =>
  stored.outcomes[identifier]?.values.map((single) => single.value) ?? [];

/**
 * Give what an attempt carries through a stored record unchanged: its seed, template values, and
 * the correct responses and defaults its template processing set.
 *
 * @param stored The stored record.
 * @returns Those four fields.
 */
const carriedOf = ({
  correct,
  defaults,
  seed,
  templates,
}: StoredRecord): Pick<StoredRecord, "correct" | "defaults" | "seed" | "templates"> => ({
  correct,
  defaults,
  seed,
  templates,
});

/**
 * A hand-built item document whose response processing sets the boolean `STATUS_NULL` to whether
 * the `qti-default` of the built-in `completionStatus` is NULL, and `ATTEMPTS_NULL` to whether the
 * `qti-default` of the built-in `numAttempts` is. Neither built-in has a declaration, so each
 * default is NULL of the built-in's type and both outcomes are true.
 */
const builtInDefaults = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="built-in-defaults" title="Built-in defaults" time-dependent="false" adaptive="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-outcome-declaration identifier="STATUS_NULL" cardinality="single" base-type="boolean"/>
  <qti-outcome-declaration identifier="ATTEMPTS_NULL" cardinality="single" base-type="boolean"/>
  <qti-item-body><p>Built-in defaults</p></qti-item-body>
  <qti-response-processing>
    <qti-set-outcome-value identifier="STATUS_NULL">
      <qti-is-null><qti-default identifier="completionStatus"/></qti-is-null>
    </qti-set-outcome-value>
    <qti-set-outcome-value identifier="ATTEMPTS_NULL">
      <qti-is-null><qti-default identifier="numAttempts"/></qti-is-null>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>
`;

/**
 * Hand `score` and `checkResponses` a hand-built item, which their types refuse: the type tests
 * are the `@ts-expect-error`s below, which `tsc` fails on if a call ever type-checks. No test calls
 * it.
 *
 * @returns What each would make of it.
 */
const scoreUnchecked = (): readonly unknown[] => [
  // @ts-expect-error -- an `Item` is not `Accepted`: only `check` makes one, after it strips an onclick or a javascript: href.
  score(item, {}),
];

describe("score", () => {
  it.effect(
    "[Q-2] [I-9b] the correct choice scores 1 and a wrong one 0, each from a fresh record",
    () =>
      Effect.gen(function* scoresChoice() {
        const right = score(accepted, { RESPONSE: identifiers("single", "A") });
        assert.isTrue(Result.isResult(right));

        const stored = yield* Effect.fromResult(right);
        const wrong = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("single", "B") }),
        );

        assert.deepStrictEqual(outcomeOf(stored, "SCORE"), [1]);
        assert.deepStrictEqual(outcomeOf(wrong, "SCORE"), [0]);
        assert.deepStrictEqual(
          [stored.attempt, stored.document, stored.item, stored.numAttempts],
          ["submitted", "items/scored.xml", "scored", 1],
        );
        assert.deepStrictEqual(stored.responses["RESPONSE"], {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "A" }],
        });
      }),
  );

  it.effect(
    "[I-9b] given the record it returned, a second score counts 2 attempts, with no limit",
    () =>
      Effect.gen(function* countsAttempts() {
        const first = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("single", "B") }),
        );
        const second = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("single", "A") }, first),
        );
        const third = yield* Effect.fromResult(score(accepted, {}, second));

        assert.deepStrictEqual(
          [first.numAttempts, second.numAttempts, third.numAttempts],
          [1, 2, 3],
        );
        assert.deepStrictEqual(outcomeOf(second, "SCORE"), [1]);
        assert.deepStrictEqual(outcomeOf(third, "SCORE"), [1]);
      }),
  );

  it("fails InvalidRecord when the record is not one it wrote", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));

    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, { ...stored, numAttempts: -1 })), (failure) =>
        failure._tag === "InvalidRecord" ? [failure._tag, failure.stage] : [failure._tag],
      ),
      Option.some(["InvalidRecord", "decode"]),
    );
  });

  it("fails InvalidRecord at decode, naming the response, when a stored response has another type than its declaration", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));
    const retyped: StoredRecord = {
      ...stored,
      responses: {
        ...stored.responses,
        PICK: {
          baseType: "string",
          cardinality: "multiple",
          values: [{ baseType: "string", value: "A" }],
        },
      },
    };

    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, retyped)), (failure) =>
        failure._tag === "InvalidRecord"
          ? [failure._tag, failure.stage, failure.issue.includes('"PICK"')]
          : [failure._tag],
      ),
      Option.some(["InvalidRecord", "decode", true]),
    );
  });

  it("fails InvalidRecord at decode, naming the response, when a stored response is one the item does not score", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));
    const extra: StoredRecord = {
      ...stored,
      responses: {
        ...stored.responses,
        EXTRA: {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "A" }],
        },
      },
    };

    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, extra)), (failure) =>
        failure._tag === "InvalidRecord"
          ? [failure._tag, failure.stage, failure.issue.includes('"EXTRA"')]
          : [failure._tag],
      ),
      Option.some(["InvalidRecord", "decode", true]),
    );
  });

  it("[I-9a] carries a stored completionStatus into the attempt, and fails InvalidRecord at decode, naming it, when it is not a single identifier", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));
    const completed: StoredRecord = {
      ...stored,
      attempt: "submitted",
      numAttempts: 1,
      outcomes: {
        ...stored.outcomes,
        completionStatus: {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "completed" }],
        },
      },
    };
    const counted: StoredRecord = {
      ...stored,
      outcomes: {
        ...stored.outcomes,
        completionStatus: {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: "1" }],
        },
      },
    };

    assert.deepStrictEqual(
      Option.map(Result.getSuccess(score(accepted, {}, completed)), (after) =>
        outcomeOf(after, "completionStatus"),
      ),
      Option.some(["completed"]),
    );
    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, counted)), (failure) =>
        failure._tag === "InvalidRecord"
          ? [failure._tag, failure.stage, failure.issue.includes('"completionStatus"')]
          : [failure._tag],
      ),
      Option.some(["InvalidRecord", "decode", true]),
    );
  });

  it("fails RecordMismatch when the record belongs to another item", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(other.item, "")));

    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, stored)), (failure) =>
        failure._tag === "RecordMismatch"
          ? {
              document: failure.document,
              item: failure.item,
              recordDocument: failure.recordDocument,
              recordItem: failure.recordItem,
            }
          : failure._tag,
      ),
      Option.some({
        document: "items/scored.xml",
        item: "scored",
        recordDocument: "items/other.xml",
        recordItem: "other",
      }),
    );
  });

  it("fails InvalidResponses naming the response: another base type, another cardinality, no value, no declaration", () => {
    const cases: readonly (readonly [Readonly<Record<string, Value>>, string, string])[] = [
      [
        { RESPONSE: { baseType: "string", cardinality: "single", values: [] } },
        "RESPONSE",
        "base-type",
      ],
      [{ RESPONSE: identifiers("multiple", "A") }, "RESPONSE", "cardinality"],
      [{ PICK: identifiers("single", "A", "B") }, "PICK", "not-a-value"],
      [{ OTHER: identifiers("single", "A") }, "OTHER", "undeclared"],
    ];

    for (const [responses, response, problem] of cases) {
      assert.deepStrictEqual(
        Option.map(failureOf(score(accepted, responses)), (failure) =>
          failure._tag === "InvalidResponses"
            ? [failure._tag, failure.response, failure.problem]
            : [failure._tag],
        ),
        Option.some(["InvalidResponses", response, problem]),
        problem,
      );
    }
  });

  it("fails InvalidResponses for a response the item does not score, saying a declaration of an unscored type is one", () => {
    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, { EXTRA: identifiers("single", "A") })), (failure) =>
        failure._tag === "InvalidResponses"
          ? [
              failure._tag,
              failure.problem,
              Option.isNone(failure.expected),
              failure.message.includes('"EXTRA"'),
              failure.message.includes("duration"),
            ]
          : [failure._tag],
      ),
      Option.some(["InvalidResponses", "undeclared", true, true, true]),
    );
  });

  it("fails ResponsesRefused with the messages when three identifiers break max-choices 2", () => {
    assert.deepStrictEqual(
      Option.map(
        failureOf(score(accepted, { PICK: identifiers("multiple", "A", "B", "C") })),
        (failure) => (failure._tag === "ResponsesRefused" ? failure.messages : [failure._tag]),
      ),
      Option.some([{ response: "PICK", text: message("en", "atMost", { n: "2" }) }]),
    );
  });

  it("fails UnknownIdentifierError given a stored record whose responses omit RESPONSE", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));
    const omitted: StoredRecord = {
      ...stored,
      responses: Object.fromEntries(
        Object.entries(stored.responses).filter(([identifier]) => identifier !== "RESPONSE"),
      ),
    };

    assert.deepStrictEqual(
      Option.map(failureOf(score(accepted, {}, omitted)), (failure) =>
        failure._tag === "UnknownIdentifierError"
          ? [failure._tag, failure.identifier, failure.role]
          : [failure._tag],
      ),
      Option.some(["UnknownIdentifierError", "RESPONSE", "variable"]),
    );
  });

  it.effect(
    "[I-9a] scores a record stored without completionStatus, as one written before it was held, and holds it after",
    () =>
      Effect.gen(function* scoresWithoutCompletion() {
        const stored = yield* Effect.fromResult(encodeRecord(fresh(item, "")));
        const lacking: StoredRecord = {
          ...stored,
          outcomes: Object.fromEntries(
            Object.entries(stored.outcomes).filter(
              ([identifier]) => identifier !== "completionStatus",
            ),
          ),
        };

        const after = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("single", "A") }, lacking),
        );

        assert.isTrue(Object.hasOwn(stored.outcomes, "completionStatus"));
        assert.isFalse(Object.hasOwn(lacking.outcomes, "completionStatus"));
        assert.deepStrictEqual(outcomeOf(after, "SCORE"), [1]);
        assert.deepStrictEqual(outcomeOf(after, "completionStatus"), ["unknown"]);
      }),
  );

  it.effect(
    "[I-9a] opens and scores an item whose processing reads qti-default of the built-in completionStatus through qti-is-null, beside numAttempts",
    () =>
      Effect.gen(function* scoresBuiltInDefaults() {
        const verdict = yield* open(
          "items/built-in-defaults.xml",
          new TextEncoder().encode(builtInDefaults),
        );
        const opened = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`The item is ${verdict.verdict}, not accepted.`),
        );

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual(opened.item.unsupported, []);
        assert.isTrue(Option.isSome(opened.item.processing), "the processing runs");

        const stored = yield* Effect.fromResult(score(opened, {}));

        assert.deepStrictEqual(outcomeOf(stored, "STATUS_NULL"), [true]);
        assert.deepStrictEqual(outcomeOf(stored, "ATTEMPTS_NULL"), [true]);
      }),
  );

  it("[I-5] fails RecordRequired, naming the item, when an item whose template processing runs is scored with no record", () => {
    assert.deepStrictEqual(
      Option.map(
        failureOf(score(templated, { RESPONSE: identifiers("single", "B") })),
        (failure) =>
          failure._tag === "RecordRequired"
            ? [failure._tag, failure.document, failure.item]
            : [failure._tag],
      ),
      Option.some(["RecordRequired", "items/templated.xml", "templated"]),
    );
  });

  it.effect(
    "[I-5] writes a declared response default first (D4-11): RESPONSE posted without its value scores as its default, with no record and over begin's record",
    () =>
      Effect.gen(function* scoresDefault() {
        const alone = yield* Effect.fromResult(score(defaulted, {}));
        const started = yield* Effect.fromResult(begin(defaulted, { instance: "q1" }));
        const over = yield* Effect.fromResult(score(defaulted, {}, started));

        assert.deepStrictEqual(alone.responses["RESPONSE"], {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "A" }],
        });
        assert.deepStrictEqual(outcomeOf(alone, "SCORE"), [1]);
        assert.deepStrictEqual(outcomeOf(over, "SCORE"), [1]);
      }),
  );

  it.effect(
    "[I-5] starts an item whose template processing does not run, scored with no record, under a drawn seed of 32 lowercase hex digits, another each call",
    () =>
      Effect.gen(function* drawsSeed() {
        const first = yield* Effect.fromResult(score(defaulted, {}));
        const second = yield* Effect.fromResult(score(defaulted, {}));

        assert.match(first.seed, /^[0-9a-f]{32}$/u);
        assert.match(second.seed, /^[0-9a-f]{32}$/u);
        assert.notStrictEqual(second.seed, first.seed);
      }),
  );

  it.effect(
    "[I-5] scores against begin's record, its template-set correct response, and gives its seed, template values, correct responses and defaults back unchanged",
    () =>
      Effect.gen(function* carriesRecord() {
        const started = yield* Effect.fromResult(begin(templated, { instance: "q1", seed: "7" }));
        const right = yield* Effect.fromResult(
          score(templated, { RESPONSE: identifiers("single", "B") }, started),
        );
        const wrong = yield* Effect.fromResult(
          score(templated, { RESPONSE: identifiers("single", "A") }, right),
        );

        assert.deepStrictEqual(carriedOf(right), carriedOf(started));
        assert.deepStrictEqual(carriedOf(wrong), carriedOf(started));
        assert.deepStrictEqual(
          [started.seed, started.templates["T"]?.values.map((single) => single.value)],
          ["7", ["7"]],
        );
        assert.deepStrictEqual(outcomeOf(right, "SCORE"), [1]);
        assert.deepStrictEqual(outcomeOf(wrong, "SCORE"), [0]);
      }),
  );

  it.effect(
    "[I-5] fails InvalidRecord at decode, naming the template variable, when a stored template value has another type than its declaration",
    () =>
      Effect.gen(function* refusesTemplate() {
        const started = yield* Effect.fromResult(begin(templated, { instance: "q1" }));
        const retyped: StoredRecord = {
          ...started,
          templates: {
            T: {
              baseType: "float",
              cardinality: "single",
              values: [{ baseType: "float", value: 7 }],
            },
          },
        };

        assert.deepStrictEqual(
          Option.map(failureOf(score(templated, {}, retyped)), (failure) =>
            failure._tag === "InvalidRecord"
              ? [failure._tag, failure.stage, failure.issue.includes('"T"')]
              : [failure._tag],
          ),
          Option.some(["InvalidRecord", "decode", true]),
        );
      }),
  );

  it("[I-9a] fails InvalidRecord at decode for a mistyped stored completionStatus, naming the built-in rather than a declaration (D7-2)", () => {
    const stored = Result.getOrThrow(encodeRecord(fresh(item, "")));
    const counted: StoredRecord = {
      ...stored,
      outcomes: {
        ...stored.outcomes,
        completionStatus: {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: "1" }],
        },
      },
    };
    const scored = failureOf(score(accepted, {}, counted));
    const fitted = Result.getFailure(fitting(item, Result.getOrThrow(decodeRecord(counted))));

    for (const failure of [scored, fitted]) {
      assert.deepStrictEqual(
        failure.pipe(
          Option.map((found) =>
            found._tag === "InvalidRecord"
              ? [
                  found._tag,
                  found.stage,
                  found.issue.includes('"completionStatus"'),
                  found.issue.includes("built-in"),
                  found.issue.includes("declares"),
                ]
              : [found._tag],
          ),
        ),
        Option.some(["InvalidRecord", "decode", true, true, false]),
      );
    }
  });

  it("refuses a hand-built item in its type", () => {
    assert.isFunction(scoreUnchecked);
  });

  it("runs tier (a) under the configuration the Schema decodes from English and validateResponses off", () => {
    assert.deepStrictEqual(
      tierA,
      Schema.decodeSync(Configuration)({ locale: "en", validateResponses: false }),
    );
  });
});

describe("score over the content a templated item's record shows", () => {
  it.effect(
    "[I-5] scores a choice begin's record shows, and refuses one it hides unknownChoice inside ResponsesRefused",
    () =>
      Effect.gen(function* judgesChoices() {
        const started = yield* Effect.fromResult(begin(visible, { instance: "q1", seed: "7" }));
        const shown = yield* Effect.fromResult(
          score(visible, { RESPONSE: identifiers("single", "B") }, started),
        );

        assert.deepStrictEqual(outcomeOf(shown, "SCORE"), [1]);
        assert.deepStrictEqual(
          Option.map(
            failureOf(score(visible, { RESPONSE: identifiers("single", "C") }, started)),
            (failure) => (failure._tag === "ResponsesRefused" ? failure.messages : [failure._tag]),
          ),
          Option.some([{ response: "RESPONSE", text: message("en", "unknownChoice") }]),
        );
      }),
  );

  it.effect(
    "[I-5] keeps the record's value of a response only a hidden template block binds, whether a value or a NULL is posted for it",
    () =>
      Effect.gen(function* keepsHidden() {
        const started = yield* Effect.fromResult(begin(visible, { instance: "q1", seed: "7" }));
        const unposted = yield* Effect.fromResult(score(visible, {}, started));
        const posted = yield* Effect.fromResult(score(visible, { HIDDEN: integer(9n) }, started));
        const nulled = yield* Effect.fromResult(
          score(visible, { HIDDEN: nullOf("integer", "single") }, started),
        );

        assert.deepStrictEqual(outcomeOf(unposted, "ECHO"), ["3"]);
        assert.deepStrictEqual(outcomeOf(posted, "ECHO"), ["3"]);
        assert.deepStrictEqual(outcomeOf(nulled, "ECHO"), ["3"]);
        assert.deepStrictEqual(
          [posted.responses["HIDDEN"], nulled.responses["HIDDEN"]],
          [started.responses["HIDDEN"], started.responses["HIDDEN"]],
        );
      }),
  );

  it.effect(
    "[I-5] takes back the responses begin's record stores, a hidden interaction's declared default among them, without refusing it",
    () =>
      Effect.gen(function* takesStored() {
        const started = yield* Effect.fromResult(begin(visible, { instance: "q1", seed: "7" }));
        const { responses } = yield* Effect.fromResult(decodeRecord(started));
        const scored = yield* Effect.fromResult(score(visible, responses, started));

        assert.deepStrictEqual(outcomeOf(scored, "ECHO"), ["3"]);
        assert.deepStrictEqual(outcomeOf(scored, "SCORE"), [0]);
      }),
  );
});

describe("fitting", () => {
  it("[I-9a] accepts a record that holds the built-in completionStatus and one that lacks it, and refuses one of another type", () => {
    const record = fresh(item, "");
    const lacking: ItemRecord = {
      ...record,
      outcomes: Object.fromEntries(
        Object.entries(record.outcomes).filter(([identifier]) => identifier !== "completionStatus"),
      ),
    };
    const counted: ItemRecord = {
      ...record,
      outcomes: { ...record.outcomes, completionStatus: integer(1n) },
    };

    assert.isTrue(Object.hasOwn(record.outcomes, "completionStatus"));
    assert.deepStrictEqual(Result.getSuccess(fitting(item, record)), Option.some(record));
    assert.deepStrictEqual(Result.getSuccess(fitting(item, lacking)), Option.some(lacking));
    assert.deepStrictEqual(
      Option.map(Result.getFailure(fitting(item, counted)), (failure) => [
        failure._tag,
        failure.stage,
      ]),
      Option.some(["InvalidRecord", "decode"]),
    );
  });
});

describe("fitting a templated item", () => {
  /**
   * The record of {@link templatedItem}'s first attempt.
   */
  const started = Result.getOrThrow(firstAttempt(templatedItem, { instance: "", seed: "" }));

  /**
   * Give what `fitting` makes of a record, as its tag, stage and whether its issue names the
   * variable.
   *
   * @param record The record.
   * @param identifier The variable its issue should name.
   * @returns The record's fit, or the failure's tag, stage and whether its issue names it.
   */
  const fitOf = (record: ItemRecord, identifier: string) =>
    Result.match(fitting(templatedItem, record), {
      onFailure: (failure) => [
        failure._tag,
        failure.stage,
        failure.issue.includes(JSON.stringify(identifier)),
      ],
      onSuccess: () => ["fits"],
    });

  it("[I-5] accepts the record of its first attempt", () => {
    assert.deepStrictEqual(
      Result.getSuccess(fitting(templatedItem, started)),
      Option.some(started),
    );
  });

  it("[I-5] refuses a template value, a correct response or a default of another type than its declaration, or of no declared variable", () => {
    const refused = ["InvalidRecord", "decode", true];

    assert.deepStrictEqual(fitOf({ ...started, templates: { T: float(7) } }, "T"), refused);
    assert.deepStrictEqual(fitOf({ ...started, templates: { U: integer(7n) } }, "U"), refused);
    assert.deepStrictEqual(
      fitOf({ ...started, correct: { RESPONSE: integer(1n) } }, "RESPONSE"),
      refused,
    );
    assert.deepStrictEqual(
      fitOf({ ...started, correct: { OTHER: identifiers("single", "A") } }, "OTHER"),
      refused,
    );
    assert.deepStrictEqual(
      fitOf({ ...started, defaults: { SCORE: integer(1n) } }, "SCORE"),
      refused,
    );
    assert.deepStrictEqual(
      fitOf({ ...started, defaults: { NUMBER: float(1) } }, "NUMBER"),
      refused,
    );
    assert.deepStrictEqual(fitOf({ ...started, defaults: { NONE: float(1) } }, "NONE"), refused);
    assert.deepStrictEqual(
      fitOf({ ...started, defaults: { NUMBER: integer(3n), SCORE: float(0) } }, "NUMBER"),
      ["fits"],
    );
  });
});

describe("checkResponses", () => {
  it.effect(
    "gives tier (a) messages always, in document order, and min-choices only under validateResponses",
    () =>
      Effect.gen(function* tiers() {
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });
        const tooMany = { PICK: identifiers("multiple", "A", "B", "C") };
        const tooFew = { PICK: identifiers("multiple", "A") };
        const atMost = { response: "PICK", text: message("en", "atMost", { n: "2" }) };
        const atLeast = { response: "PICK", text: message("en", "atLeast", { n: "2" }) };

        assert.deepStrictEqual(checkResponses(accepted, tooMany, lenient), [atMost]);
        assert.deepStrictEqual(checkResponses(accepted, tooMany, strict), [atMost]);
        assert.deepStrictEqual(checkResponses(accepted, tooFew, lenient), []);
        assert.deepStrictEqual(checkResponses(accepted, tooFew, strict), [atLeast]);
        assert.deepStrictEqual(checkResponses(accepted, {}, lenient), []);
        assert.deepStrictEqual(checkResponses(accepted, {}, strict), [atLeast]);
        assert.deepStrictEqual(
          checkResponses(accepted, { ...tooMany, RESPONSE: identifiers("single", "Z") }, lenient),
          [{ response: "RESPONSE", text: message("en", "unknownChoice") }, atMost],
        );
      }),
  );

  it.effect(
    "[Q-12] gives an Inline Choice one unknownChoice for a stray identifier and none for a presented one",
    () =>
      Effect.gen(function* inlineChoice() {
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(
          checkResponses(inlineAccepted, { TONE: identifiers("single", "Z") }, lenient),
          [{ response: "TONE", text: message("en", "unknownChoice") }],
        );
        assert.deepStrictEqual(
          checkResponses(inlineAccepted, { TONE: identifiers("single", "B") }, strict),
          [],
        );
        assert.deepStrictEqual(checkResponses(inlineAccepted, {}, lenient), []);
        assert.deepStrictEqual(checkResponses(inlineAccepted, {}, strict), [
          { response: "TONE", text: message("en", "atLeast", { n: "1" }) },
        ]);
      }),
  );

  it.effect("gives a Malformed its interaction's message", () =>
    Effect.gen(function* malformed() {
      const configuration = yield* configure({});

      assert.deepStrictEqual(
        checkResponses(
          accepted,
          {
            NUMBER: new Malformed({ entry: "q1.NUMBER", reason: "number" }),
            RESPONSE: new Malformed({ entry: "q1.RESPONSE", reason: "single-many" }),
          },
          configuration,
        ),
        [
          { response: "RESPONSE", text: message("en", "atMost", { n: "1" }) },
          { response: "NUMBER", text: message("en", "malformedNumber") },
        ],
      );
    }),
  );
});

describe("the public surface", () => {
  it.effect("@qti-pie/plate resolves through the exports map to the same render and score", () =>
    Effect.gen(function* selfImport() {
      const surface = yield* Effect.promise(() => import("@qti-pie/plate"));

      assert.strictEqual(surface.render, render);
      assert.strictEqual(surface.score, score);
    }),
  );

  it.effect("exports exactly the author's functions, the native-form helpers and the errors", () =>
    Effect.gen(function* surfaceNames() {
      const surface = yield* Effect.promise(() => import("#plate/index.ts"));

      assert.deepStrictEqual(Object.keys(surface).toSorted(), [
        "IntentRefused",
        "InvalidConfiguration",
        "InvalidInstance",
        "InvalidRecord",
        "InvalidRedacted",
        "InvalidResponses",
        "InvalidResultContext",
        "InvalidSession",
        "InvalidSessionInstance",
        "InvalidTime",
        "ItemNotInSession",
        "Malformed",
        "OutcomeMismatchError",
        "PartSwapRefused",
        "RecordMismatch",
        "RecordRequired",
        "ResponsesRefused",
        "ResultItemMissing",
        "SessionMismatch",
        "StepResponseMisfit",
        "TestNotDeliverable",
        "UnknownIdentifierError",
        "UnknownItemRef",
        "UnknownPart",
        "UnmappedResponseError",
        "acceptedItem",
        "advance",
        "allowedIntents",
        "begin",
        "checkInstance",
        "checkResponses",
        "configure",
        "current",
        "decode",
        "decodeIntent",
        "decodeRedacted",
        "decodeSession",
        "encode",
        "encodeIntent",
        "encodeRedacted",
        "encodeSession",
        "entryName",
        "h",
        "intentName",
        "isPosted",
        "itemRefs",
        "itemView",
        "navigationState",
        "open",
        "openPackage",
        "partition",
        "permits",
        "postings",
        "redact",
        "render",
        "renderNavigation",
        "renderStatus",
        "restore",
        "results",
        "score",
        "solution",
        "startTest",
      ]);
    }),
  );

  it.effect("exports isPosted, which narrows a declaration's base type to PostedBaseType", () =>
    Effect.gen(function* narrowsBaseType() {
      const surface = yield* Effect.promise(() => import("#plate/index.ts"));
      const posted: readonly PostedBaseType[] = ["float", "point"].filter(surface.isPosted);

      assert.deepStrictEqual(posted, ["float"]);
    }),
  );

  it.effect(
    "exports none of the five …ForTest seams, nor brandRedacted, the brand's constructor",
    () =>
      Effect.gen(function* noSeams() {
        const surface = yield* Effect.promise(() => import("#plate/index.ts"));

        for (const name of [
          "acceptForTest",
          "acceptPackageForTest",
          "acceptSectionForTest",
          "acceptStimulusForTest",
          "acceptTestForTest",
          "brandRedacted",
          "redactItem",
          "payload",
        ]) {
          assert.notProperty(surface, name);
        }
      }),
  );
});
