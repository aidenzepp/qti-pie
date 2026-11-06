import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import { UnknownIdentifierError } from "#plate/engine/evaluate.ts";
import { buildItem } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single string value.
 *
 * @param value The string.
 * @returns The value.
 */
const stringValue = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
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
 * Construct a declaration with its three attributes.
 *
 * @param local `qti-response-declaration` or `qti-outcome-declaration`.
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param children The declaration's children, none by default.
 * @returns A single-cardinality declaration.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration",
  identifier: string,
  baseType: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    local,
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a container holding one `qti-value`, such as `qti-default-value`.
 *
 * @param local The container's name.
 * @param value The value's text.
 * @returns The container element.
 */
const holding = (local: string, value: string): SourceElement =>
  el(local, [], [el("qti-value", [], [text(value)])]);

/**
 * Construct a `qti-response-processing` that names a built-in template by its purl URI.
 *
 * @param name The template's name.
 * @returns The processing element.
 */
const template = (name: "map_response" | "match_correct"): SourceElement =>
  el("qti-response-processing", [
    attr("template", `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/${name}.xml`),
  ]);

/**
 * Construct an item document of declarations and processing, with no body.
 *
 * @param parts The root's children.
 * @returns The document.
 */
const itemDocument = (...parts: readonly SourceElement[]): SourceDocument =>
  doc(
    "items/attempt.xml",
    el("qti-assessment-item", [attr("identifier", "attempt"), attr("title", "Attempt")], parts),
  );

/**
 * BG007's `RESPONSE`: a single identifier whose correct response is `true`.
 */
const trueFalse = declaration("qti-response-declaration", "RESPONSE", "identifier", [
  holding("qti-correct-response", "true"),
]);

/**
 * BG007's `SCORE`: a single float with default 1.
 */
const scoreOfOne = declaration("qti-outcome-declaration", "SCORE", "float", [
  holding("qti-default-value", "1"),
]);

/**
 * A BG007-shaped item: `RESPONSE` scored by `match_correct` into `SCORE`, whose default is 1.
 */
const bg007 = itemDocument(trueFalse, scoreOfOne, template("match_correct"));

/**
 * A BG010-shaped item: a string `RESPONSE` mapped by BG010's entries and scored by
 * `map_response` into `SCORE`, which has no default.
 */
const bg010 = itemDocument(
  declaration("qti-response-declaration", "RESPONSE", "string", [
    el(
      "qti-mapping",
      [attr("default-value", "0")],
      [
        el("qti-map-entry", [
          attr("case-sensitive", "true"),
          attr("map-key", "York"),
          attr("mapped-value", "1"),
        ]),
        el("qti-map-entry", [attr("map-key", "york"), attr("mapped-value", "0.5")]),
      ],
    ),
  ]),
  declaration("qti-outcome-declaration", "SCORE", "float"),
  template("map_response"),
);

/**
 * An item that sets `SCORE`, which has no default, to 1 when `RESPONSE` is correct and leaves it
 * alone otherwise, so only the reset brings it back to 0.
 */
const correctOnly = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "SCORE", "float"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-response-condition",
        [],
        [
          el(
            "qti-response-if",
            [],
            [
              el(
                "qti-match",
                [],
                [
                  el("qti-variable", [attr("identifier", "RESPONSE")]),
                  el("qti-correct", [attr("identifier", "RESPONSE")]),
                ],
              ),
              el(
                "qti-set-outcome-value",
                [attr("identifier", "SCORE")],
                [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
);

/**
 * An item that sets the integer outcome `ATTEMPTS` from the built-in `numAttempts`.
 */
const countsAttempts = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "ATTEMPTS", "integer"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "ATTEMPTS")],
        [el("qti-variable", [attr("identifier", "numAttempts")])],
      ),
    ],
  ),
);

/**
 * An item that copies the built-in `completionStatus` into the identifier outcome `STATUS`.
 */
const readsCompletion = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "STATUS", "identifier"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "STATUS")],
        [el("qti-variable", [attr("identifier", "completionStatus")])],
      ),
    ],
  ),
);

/**
 * The parts of an item that copies the built-in `completionStatus` into `STATUS`, as its rules
 * first read it, then sets the built-in to `completed` when `RESPONSE` is correct and leaves it
 * alone otherwise.
 */
const readsThenCompletes: readonly SourceElement[] = [
  trueFalse,
  declaration("qti-outcome-declaration", "STATUS", "identifier"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "STATUS")],
        [el("qti-variable", [attr("identifier", "completionStatus")])],
      ),
      el(
        "qti-response-condition",
        [],
        [
          el(
            "qti-response-if",
            [],
            [
              el(
                "qti-match",
                [],
                [
                  el("qti-variable", [attr("identifier", "RESPONSE")]),
                  el("qti-correct", [attr("identifier", "RESPONSE")]),
                ],
              ),
              el(
                "qti-set-outcome-value",
                [attr("identifier", "completionStatus")],
                [el("qti-base-value", [attr("base-type", "identifier")], [text("completed")])],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
];

/**
 * {@link readsThenCompletes} in a non-adaptive item and in an adaptive one, which plate marks and
 * still runs: the built-in carries over in both.
 */
const completing: readonly (readonly [string, SourceDocument])[] = [
  ["a non-adaptive", itemDocument(...readsThenCompletes)],
  [
    "an adaptive",
    doc(
      "items/attempt.xml",
      el(
        "qti-assessment-item",
        [attr("adaptive", "true"), attr("identifier", "attempt"), attr("title", "Attempt")],
        readsThenCompletes,
      ),
    ),
  ],
];

/**
 * The instance every record here is opened under.
 */
const instance = "q1";

/**
 * Give the `SCORE` an attempt left.
 *
 * @param record The record after the attempt.
 * @returns Its `SCORE`.
 */
const score = (record: ItemRecord): Value | undefined => record.outcomes["SCORE"];

/**
 * Give the failure a Result holds, after checking that it is a Result and that it failed.
 *
 * @param result The Result the attempt returned.
 * @returns Its failure.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): E => {
  assert.isTrue(Result.isResult(result));
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("runAttempt", () => {
  it.effect(
    "[I-9b] scores a BG007-shaped item: true gives 1, false 0 and NULL 0, though SCORE's default is 1",
    () =>
      Effect.gen(function* scoresBg007() {
        const item = yield* buildItem(bg007);
        const record = fresh(item, instance);

        const correct = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: identifierValue("true") }),
        );
        const wrong = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: identifierValue("false") }),
        );
        const empty = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: nullOf("identifier", "single") }),
        );

        assert.deepStrictEqual(correct, {
          ...record,
          attempt: "submitted",
          numAttempts: 1,
          outcomes: { SCORE: floatValue(1), completionStatus: identifierValue("unknown") },
          responses: { RESPONSE: identifierValue("true") },
        });
        assert.deepStrictEqual(score(wrong), floatValue(0));
        assert.deepStrictEqual(score(empty), floatValue(0));
        assert.deepStrictEqual(
          [wrong.attempt, wrong.numAttempts, empty.attempt, empty.numAttempts],
          ["submitted", 1, "submitted", 1],
        );
      }),
  );

  it.effect("[I-9b] scores a BG010-shaped item: NULL gives 0.0, and york maps to 0.5", () =>
    Effect.gen(function* scoresBg010() {
      const item = yield* buildItem(bg010);
      const record = fresh(item, instance);

      const empty = yield* Effect.fromResult(
        runAttempt(item, record, { RESPONSE: nullOf("string", "single") }),
      );
      const mapped = yield* Effect.fromResult(
        runAttempt(item, record, { RESPONSE: stringValue("york") }),
      );

      assert.deepStrictEqual(empty, {
        ...record,
        attempt: "submitted",
        numAttempts: 1,
        outcomes: { SCORE: floatValue(0), completionStatus: identifierValue("unknown") },
        responses: { RESPONSE: nullOf("string", "single") },
      });
      assert.deepStrictEqual(score(mapped), floatValue(0.5));
    }),
  );

  it.effect(
    "[I-9b] resets the outcomes before each attempt: true then false gives 0, with numAttempts 2",
    () =>
      Effect.gen(function* resetsFirst() {
        const item = yield* buildItem(correctOnly);
        const first = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );
        const second = yield* Effect.fromResult(
          runAttempt(item, first, { RESPONSE: identifierValue("false") }),
        );

        assert.deepStrictEqual(score(first), floatValue(1));
        assert.deepStrictEqual(score(second), floatValue(0));
        assert.deepStrictEqual(second.responses, { RESPONSE: identifierValue("false") });
        assert.strictEqual(second.numAttempts, 2);
        assert.strictEqual(second.attempt, "submitted");
      }),
  );

  it.effect(
    "reads numAttempts as the count including this attempt: 1 in the first, 2 in the second",
    () =>
      Effect.gen(function* readsNumAttempts() {
        const item = yield* buildItem(countsAttempts);
        const first = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );
        const second = yield* Effect.fromResult(
          runAttempt(item, first, { RESPONSE: identifierValue("false") }),
        );

        assert.deepStrictEqual(first.outcomes["ATTEMPTS"], integerValue(1n));
        assert.deepStrictEqual(second.outcomes["ATTEMPTS"], integerValue(2n));
        assert.deepStrictEqual([first.numAttempts, second.numAttempts], [1, 2]);
      }),
  );

  it.effect("leaves SCORE at its default when the item has no response processing", () =>
    Effect.gen(function* noProcessing() {
      const item = yield* buildItem(itemDocument(trueFalse, scoreOfOne));
      const scored: ItemRecord = { ...fresh(item, instance), outcomes: { SCORE: floatValue(0) } };

      const after = yield* Effect.fromResult(
        runAttempt(item, scored, { RESPONSE: identifierValue("false") }),
      );

      assert.deepStrictEqual(after.outcomes, {
        SCORE: floatValue(1),
        completionStatus: identifierValue("unknown"),
      });
      assert.deepStrictEqual(after.responses, { RESPONSE: identifierValue("false") });
      assert.strictEqual(after.numAttempts, 1);
      assert.strictEqual(after.attempt, "submitted");
    }),
  );

  it.effect("keeps the record's value of a response the attempt is not given", () =>
    Effect.gen(function* keepsUngiven() {
      const item = yield* buildItem(bg007);
      const record = fresh(item, instance);

      const after = yield* Effect.fromResult(runAttempt(item, record, {}));

      assert.deepStrictEqual(after.responses, record.responses);
      assert.deepStrictEqual(score(after), floatValue(0));
      assert.strictEqual(after.numAttempts, 1);
    }),
  );

  it.effect(
    "[I-9a] sets completionStatus from not_attempted to unknown when the first attempt starts, before the rules read it",
    () =>
      Effect.gen(function* startsUnknown() {
        const item = yield* buildItem(readsCompletion);
        const record = fresh(item, instance);

        const after = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: identifierValue("true") }),
        );

        assert.isTrue(Option.isSome(item.processing));
        assert.deepStrictEqual(
          record.outcomes["completionStatus"],
          identifierValue("not_attempted"),
        );
        assert.deepStrictEqual(after.outcomes, {
          STATUS: identifierValue("unknown"),
          completionStatus: identifierValue("unknown"),
        });
      }),
  );

  for (const [label, document] of completing) {
    it.effect(
      `[I-9a] keeps the completed a rule sets in attempt 1, so attempt 2's rules start from it, in ${label} item`,
      () =>
        Effect.gen(function* carriesCompleted() {
          const item = yield* buildItem(document);
          const first = yield* Effect.fromResult(
            runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
          );
          const second = yield* Effect.fromResult(
            runAttempt(item, first, { RESPONSE: identifierValue("false") }),
          );

          assert.isTrue(Option.isSome(item.processing));
          assert.deepStrictEqual(first.outcomes, {
            STATUS: identifierValue("unknown"),
            completionStatus: identifierValue("completed"),
          });
          assert.deepStrictEqual(second.outcomes, {
            STATUS: identifierValue("completed"),
            completionStatus: identifierValue("completed"),
          });
        }),
    );
  }

  it.effect("[I-9a] keeps unknown into attempt 2 when no rule sets completionStatus", () =>
    Effect.gen(function* keepsUnknown() {
      const item = yield* buildItem(readsCompletion);
      const first = yield* Effect.fromResult(
        runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
      );
      const second = yield* Effect.fromResult(
        runAttempt(item, first, { RESPONSE: identifierValue("false") }),
      );

      assert.deepStrictEqual(first.outcomes["completionStatus"], identifierValue("unknown"));
      assert.deepStrictEqual(second.outcomes, {
        STATUS: identifierValue("unknown"),
        completionStatus: identifierValue("unknown"),
      });
    }),
  );

  it.effect("returns the evaluator's failure and leaves the record it was given unchanged", () =>
    Effect.gen(function* returnsFailure() {
      // The model keeps only rules whose needs the item meets, so the failure comes from the
      // record the host hands back: this one holds no value of the RESPONSE match_correct reads.
      const item = yield* buildItem(bg007);
      const record: ItemRecord = { ...fresh(item, instance), responses: {} };
      const before = structuredClone(record);

      const failure = failureOf(runAttempt(item, record, {}));

      assert.isTrue(Option.isSome(item.processing));
      assert.instanceOf(failure, UnknownIdentifierError);
      assert.deepStrictEqual(
        {
          _tag: failure._tag,
          holder: failure.holder,
          identifier: failure.identifier,
          role: failure.role,
        },
        {
          _tag: "UnknownIdentifierError",
          holder: "record",
          identifier: "RESPONSE",
          role: "variable",
        },
      );
      assert.deepStrictEqual(record, before);
    }),
  );
});
