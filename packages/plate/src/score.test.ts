import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { configure } from "#plate/configuration.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { ChoiceInteraction, Item, TextEntryInteraction } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { render } from "#plate/render.ts";
import { checkResponses, score } from "#plate/score.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

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
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value holding it.
 */
const float = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
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
    identifier,
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
              expression: { kind: "base-value", value: float(1) },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ],
          when: {
            kind: "match",
            operands: [
              { identifier: "RESPONSE", kind: "variable" },
              { identifier: "RESPONSE", kind: "correct" },
            ],
          },
        },
      ],
      kind: "condition",
      otherwise: Option.some([
        {
          expression: { kind: "base-value", value: float(0) },
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
        baseType: "integer",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "NUMBER",
        mapping: Option.none(),
      },
    ],
  ]),
  title: "Scored",
  unsupported: [],
};

/**
 * The item as `check` would accept it, through the tests' named seam.
 */
const accepted = acceptForTest(item);

/**
 * Another item, at another location: a record of it never belongs to {@link item}.
 */
const other = acceptForTest({ ...item, document: "items/other.xml", identifier: "other" });

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

  it("refuses a hand-built item in its type", () => {
    assert.isFunction(scoreUnchecked);
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

  it.effect("exports exactly the pure functions, the native-form helpers and the errors", () =>
    Effect.gen(function* surfaceNames() {
      const surface = yield* Effect.promise(() => import("#plate/index.ts"));

      assert.deepStrictEqual(Object.keys(surface).toSorted(), [
        "InvalidConfiguration",
        "InvalidInstance",
        "InvalidRecord",
        "InvalidRedacted",
        "InvalidResponses",
        "Malformed",
        "OutcomeMismatchError",
        "PartSwapRefused",
        "RecordMismatch",
        "ResponsesRefused",
        "UnknownIdentifierError",
        "UnknownPart",
        "UnmappedResponseError",
        "checkInstance",
        "checkResponses",
        "configure",
        "decode",
        "decodeRedacted",
        "encode",
        "encodeRedacted",
        "entryName",
        "h",
        "open",
        "partition",
        "redact",
        "render",
        "renderStatus",
        "score",
      ]);
    }),
  );

  it.effect(
    "exports neither test seam nor the brand's constructor: acceptForTest and brandRedacted",
    () =>
      Effect.gen(function* noSeams() {
        const surface = yield* Effect.promise(() => import("#plate/index.ts"));

        for (const name of ["acceptForTest", "brandRedacted", "redactItem", "payload"]) {
          assert.notProperty(surface, name);
        }
      }),
  );
});
