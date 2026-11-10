import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { firstAttempt, runAttempt } from "#plate/engine/attempt.ts";
import { OutcomeMismatchError, UnknownIdentifierError } from "#plate/engine/evaluate.ts";
import { drawBelow, drawStream, responseLabel, templateLabel } from "#plate/engine/random.ts";
import { checkTemplateDefaults } from "#plate/engine/template.ts";
import type { ModelOf, Modules } from "#plate/model/interactions.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Item } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { score as scoreItem } from "#plate/score.ts";
import { stubElement, stubKind } from "#plate/test/stub-kind.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

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
 * @param local `qti-response-declaration`, `qti-outcome-declaration` or
 *   `qti-template-declaration`.
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param children The declaration's children, none by default.
 * @returns A single-cardinality declaration.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration" | "qti-template-declaration",
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
 * Construct the parts of an item that copies the built-in `completionStatus` into `STATUS`, as its
 * rules first read it, then sets the built-in to a value when `RESPONSE` is correct and leaves it
 * alone otherwise.
 *
 * @param status The value the rules set.
 * @returns The declarations and the processing.
 */
const readsThenSets = (status: string): readonly SourceElement[] => [
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
                [el("qti-base-value", [attr("base-type", "identifier")], [text(status)])],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
];

/**
 * The parts of an item whose rules read `completionStatus` and then set it to `completed`.
 */
const readsThenCompletes = readsThenSets("completed");

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

/**
 * The number of values each `qti-random-integer` here draws among: 0 to 999,999.
 */
const drawnCount = 1_000_000n;

/**
 * Construct a `qti-random-integer` from 0 to {@link drawnCount} − 1, step 1.
 *
 * @returns The element.
 */
const randomInteger = (): SourceElement =>
  el("qti-random-integer", [attr("max", String(drawnCount - 1n)), attr("min", "0")]);

/**
 * Construct a `qti-base-value`.
 *
 * @param baseType The `base-type` value.
 * @param written The value's text.
 * @returns The element.
 */
const baseValue = (baseType: string, written: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(written)]);

/**
 * Construct a `qti-set-outcome-value`.
 *
 * @param identifier The outcome it sets.
 * @param expression The expression whose value it sets.
 * @returns The rule.
 */
const setting = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", identifier)], [expression]);

/**
 * An item that sets the integer outcome `DRAWN` from a {@link randomInteger}.
 */
const drawsOnce = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "DRAWN", "integer"),
  el("qti-response-processing", [], [setting("DRAWN", randomInteger())]),
);

/**
 * An item that sets the boolean `FIRST` from a `qti-and` whose first operand is false and whose
 * second compares a {@link randomInteger}, then sets the integer `SECOND` from another.
 */
const andThenDraws = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "FIRST", "boolean"),
  declaration("qti-outcome-declaration", "SECOND", "integer"),
  el(
    "qti-response-processing",
    [],
    [
      setting(
        "FIRST",
        el(
          "qti-and",
          [],
          [
            baseValue("boolean", "false"),
            el("qti-gte", [], [randomInteger(), baseValue("integer", "0")]),
          ],
        ),
      ),
      setting("SECOND", randomInteger()),
    ],
  ),
);

/**
 * An item that sets the integer `FIRST` from a `qti-custom-operator` holding a
 * {@link randomInteger}, then sets the integer `SECOND` from another.
 */
const customThenDraws = itemDocument(
  trueFalse,
  declaration("qti-outcome-declaration", "FIRST", "integer"),
  declaration("qti-outcome-declaration", "SECOND", "integer"),
  el(
    "qti-response-processing",
    [],
    [
      setting("FIRST", el("qti-custom-operator", [attr("class", "x")], [randomInteger()])),
      setting("SECOND", randomInteger()),
    ],
  ),
);

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable it reads.
 * @returns The element.
 */
const variableOf = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier)]);

/**
 * Construct a template rule that sets a variable.
 *
 * @param local The rule's name.
 * @param identifier The variable it sets.
 * @param expression The expression whose value it sets.
 * @returns The rule.
 */
const templateSetting = (
  local: "qti-set-correct-response" | "qti-set-default-value" | "qti-set-template-value",
  identifier: string,
  expression: SourceElement,
): SourceElement => el(local, [attr("identifier", identifier)], [expression]);

/**
 * An item whose template processing draws the integer `N` from a {@link randomInteger}, then sets
 * `RESPONSE`'s correct response and default to it and `SCORE`'s default to 0.5. `RESPONSE`
 * declares the default 7 and `OTHER` the default `x`; `BARE`, `SCORE` and the integer `TALLY`
 * declare none.
 */
const drawsTemplate = itemDocument(
  declaration("qti-response-declaration", "RESPONSE", "integer", [
    holding("qti-default-value", "7"),
  ]),
  declaration("qti-response-declaration", "OTHER", "identifier", [
    holding("qti-default-value", "x"),
  ]),
  declaration("qti-response-declaration", "BARE", "string"),
  declaration("qti-outcome-declaration", "SCORE", "float"),
  declaration("qti-outcome-declaration", "TALLY", "integer"),
  declaration("qti-template-declaration", "N", "integer"),
  el(
    "qti-template-processing",
    [],
    [
      templateSetting("qti-set-template-value", "N", randomInteger()),
      templateSetting("qti-set-correct-response", "RESPONSE", variableOf("N")),
      templateSetting("qti-set-default-value", "RESPONSE", variableOf("N")),
      templateSetting("qti-set-default-value", "SCORE", baseValue("float", "0.5")),
    ],
  ),
);

/**
 * The template variable `T`, an integer declared with the default 3.
 */
const threeByDefault = declaration("qti-template-declaration", "T", "integer", [
  holding("qti-default-value", "3"),
]);

/**
 * An item that declares the template variables {@link threeByDefault} and `U`, an integer with no
 * default, and has no template processing.
 */
const declaresTemplates = itemDocument(
  trueFalse,
  threeByDefault,
  declaration("qti-template-declaration", "U", "integer"),
);

/**
 * An item that declares {@link threeByDefault} and `U`, an integer with no default, whose template
 * processing sets `U` to `T` plus 1.
 */
const readsTemplate = itemDocument(
  trueFalse,
  threeByDefault,
  declaration("qti-template-declaration", "U", "integer"),
  el(
    "qti-template-processing",
    [],
    [
      templateSetting(
        "qti-set-template-value",
        "U",
        el("qti-sum", [], [variableOf("T"), baseValue("integer", "1")]),
      ),
    ],
  ),
);

/**
 * An item that declares {@link threeByDefault} under a template processing the engine does not
 * run: it sets `T` from a field of `QTI_CONTEXT`, the built-in context variable the engine holds
 * no value of, which the item model marks.
 */
const marksTemplates = itemDocument(
  trueFalse,
  threeByDefault,
  el(
    "qti-template-processing",
    [],
    [
      templateSetting(
        "qti-set-template-value",
        "T",
        el(
          "qti-field-value",
          [attr("field-identifier", "f")],
          [el("qti-variable", [attr("identifier", "QTI_CONTEXT")])],
        ),
      ),
    ],
  ),
);

/**
 * An item whose template processing sets the integer `N` to a string, as no checked item does.
 */
const mistypesTemplate = itemDocument(
  trueFalse,
  declaration("qti-template-declaration", "N", "integer"),
  el(
    "qti-template-processing",
    [],
    [templateSetting("qti-set-template-value", "N", baseValue("string", "seven"))],
  ),
);

/**
 * An item whose rules set `MATCHED` from matching `RESPONSE` against its correct response and `WAS`
 * from `SCORE`'s default, `SCORE` declaring the default 1.
 */
const readsOverrides = itemDocument(
  trueFalse,
  scoreOfOne,
  declaration("qti-outcome-declaration", "MATCHED", "boolean"),
  declaration("qti-outcome-declaration", "WAS", "float"),
  el(
    "qti-response-processing",
    [],
    [
      setting(
        "MATCHED",
        el(
          "qti-match",
          [],
          [variableOf("RESPONSE"), el("qti-correct", [attr("identifier", "RESPONSE")])],
        ),
      ),
      setting("WAS", el("qti-default", [attr("identifier", "SCORE")])),
    ],
  ),
);

/**
 * Give the value {@link drawsTemplate}'s {@link randomInteger} draws under a seed: the first
 * `drawBelow` over the stream keyed by the seed under the item's template label.
 *
 * @param seed The record's seed.
 * @returns The integer.
 */
const templateDraw = (seed: string): bigint =>
  drawBelow(drawStream(seed, templateLabel(instance, "attempt")), drawnCount);

/**
 * Give the value the nth {@link randomInteger} an attempt's response processing evaluates draws,
 * counting from 1: the nth `drawBelow` over the one stream keyed by the seed under the attempt's
 * response label.
 *
 * @param numAttempts The attempt's count, this attempt included.
 * @param nth Which draw, from 1.
 * @param seed The record's seed, the empty string by default.
 * @returns The integer.
 */
const responseDraw = (numAttempts: number, nth: number, seed = ""): bigint => {
  const draw = drawStream(seed, responseLabel(instance, numAttempts));
  let drawn = drawBelow(draw, drawnCount);
  for (let call = 1; call < nth; call += 1) {
    drawn = drawBelow(draw, drawnCount);
  }

  return drawn;
};

/**
 * The module file of the stub kind, which {@link withUncounted} mocks.
 */
const stubFile = `#plate/interactions/${stubKind}.ts`;

/**
 * A node of the stub kind bound to `RESPONSE`, the bare node the table of modules holds for a stub:
 * what an item's body holds for a module whose `countsAttempt` the engine reads through the hub.
 * It goes with `stubKind` when the last stub lands: a landed module sets the fact on its own node.
 */
const stubNode: ModelOf<typeof stubKind> = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  kind: stubKind,
  path: `qti-assessment-item/qti-item-body/${stubElement}`,
  response: "RESPONSE",
};

/**
 * Run an effect with the stub kind's module answering `countsAttempt` false for every submission,
 * every module it imports loaded afresh, and the module restored after. The mock keeps the stub's
 * every other member, so the item's body may hold {@link stubNode}, which no other step of the
 * engine's path reaches.
 *
 * @param effect The effect, which imports what it reads of plate dynamically, after the mock.
 * @returns The effect, wrapped.
 */
const withUncounted = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  Effect.sync(() => {
    vi.resetModules();
    vi.doMock(stubFile, async (importOriginal) => {
      const actual = await importOriginal<Record<string, Modules[typeof stubKind]>>();

      return Object.fromEntries(
        Object.entries(actual).map(([name, module]) => [
          name,
          { ...module, countsAttempt: () => false },
        ]),
      );
    });
  }).pipe(
    Effect.andThen(effect),
    Effect.ensuring(
      Effect.sync(() => {
        vi.doUnmock(stubFile);
        vi.resetModules();
      }),
    ),
  );

describe("runAttempt", () => {
  it.effect(
    "leaves numAttempts where it was when an interaction's module says the submission counts no attempt, and still sets the responses and runs the rules",
    () =>
      withUncounted(
        Effect.gen(function* uncounted() {
          const engine = yield* Effect.promise(() => import("#plate/engine/attempt.ts"));
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const records = yield* Effect.promise(() => import("#plate/model/record.ts"));
          const built = yield* Effect.fromResult(model.buildItem(countsAttempts));
          const item: Item = { ...built, body: [...built.body, stubNode] };
          const record = records.fresh(item, instance);

          const first = yield* Effect.fromResult(
            engine.runAttempt(item, record, { RESPONSE: identifierValue("true") }),
          );
          const second = yield* Effect.fromResult(
            engine.runAttempt(item, first, { RESPONSE: identifierValue("false") }),
          );

          assert.deepStrictEqual(first, {
            ...record,
            attempt: "submitted",
            numAttempts: 0,
            outcomes: { ATTEMPTS: integerValue(0n), completionStatus: identifierValue("unknown") },
            responses: { RESPONSE: identifierValue("true") },
          });
          assert.strictEqual(second.numAttempts, 0);
          assert.deepStrictEqual(second.responses, { RESPONSE: identifierValue("false") });
        }),
      ),
  );

  it.effect(
    "[I-9b] scores a BG007-shaped item: true gives 1, false 0 and NULL 0, though SCORE's default is 1",
    () =>
      Effect.gen(function* scoresBg007() {
        const item = yield* Effect.fromResult(buildItem(bg007));
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
      const item = yield* Effect.fromResult(buildItem(bg010));
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
        const item = yield* Effect.fromResult(buildItem(correctOnly));
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
        const item = yield* Effect.fromResult(buildItem(countsAttempts));
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
      const item = yield* Effect.fromResult(buildItem(itemDocument(trueFalse, scoreOfOne)));
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
      const item = yield* Effect.fromResult(buildItem(bg007));
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
        const item = yield* Effect.fromResult(buildItem(readsCompletion));
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
          const item = yield* Effect.fromResult(buildItem(document));
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

  it.effect(
    "[I-9a] keeps the not_attempted a rule sets in attempt 1, so attempt 2's rules start from it",
    () =>
      Effect.gen(function* carriesNotAttempted() {
        const item = yield* Effect.fromResult(
          buildItem(itemDocument(...readsThenSets("not_attempted"))),
        );
        const first = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );
        const second = yield* Effect.fromResult(
          runAttempt(item, first, { RESPONSE: identifierValue("false") }),
        );

        assert.isTrue(Option.isSome(item.processing));
        assert.deepStrictEqual(first.outcomes, {
          STATUS: identifierValue("unknown"),
          completionStatus: identifierValue("not_attempted"),
        });
        assert.deepStrictEqual(second.outcomes, {
          STATUS: identifierValue("not_attempted"),
          completionStatus: identifierValue("not_attempted"),
        });
      }),
  );

  it.effect(
    "[I-9a] starts a later attempt at unknown when the record lacks completionStatus, as one written before it was held does",
    () =>
      Effect.gen(function* lacksCompletion() {
        const item = yield* Effect.fromResult(buildItem(readsCompletion));
        const first = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );
        const lacking: ItemRecord = { ...first, outcomes: { STATUS: identifierValue("unknown") } };

        const second = yield* Effect.fromResult(
          runAttempt(item, lacking, { RESPONSE: identifierValue("false") }),
        );

        assert.strictEqual(lacking.numAttempts, 1);
        assert.deepStrictEqual(second.outcomes, {
          STATUS: identifierValue("unknown"),
          completionStatus: identifierValue("unknown"),
        });
      }),
  );

  it.effect("[I-9a] keeps unknown into attempt 2 when no rule sets completionStatus", () =>
    Effect.gen(function* keepsUnknown() {
      const item = yield* Effect.fromResult(buildItem(readsCompletion));
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
      const item = yield* Effect.fromResult(buildItem(bg007));
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

  it.effect(
    "[I-9a] draws attempt 1's response processing under the response label …␟response␟1, and attempt 2's under …␟2",
    () =>
      Effect.gen(function* drawsUnderResponseLabel() {
        const item = yield* Effect.fromResult(buildItem(drawsOnce));
        const first = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );
        const second = yield* Effect.fromResult(
          runAttempt(item, first, { RESPONSE: identifierValue("true") }),
        );

        // The two response labels and the default stream give three values, so the case tells them
        // apart.
        assert.strictEqual(
          new Set([
            responseDraw(1, 1),
            responseDraw(2, 1),
            drawBelow(drawStream("", ""), drawnCount),
          ]).size,
          3,
        );
        assert.deepStrictEqual(first.outcomes["DRAWN"], integerValue(responseDraw(1, 1)));
        assert.deepStrictEqual(second.outcomes["DRAWN"], integerValue(responseDraw(2, 1)));
      }),
  );

  it.effect(
    "[I-9a] evaluates every operand of qti-and, left to right, so the rule after it draws the response stream's second value",
    () =>
      Effect.gen(function* evaluatesEveryOperand() {
        const item = yield* Effect.fromResult(buildItem(andThenDraws));
        const after = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );

        // A qti-and that stopped at its false operand would leave SECOND the stream's first value.
        assert.notStrictEqual(responseDraw(1, 1), responseDraw(1, 2));
        assert.deepStrictEqual(after.outcomes["FIRST"], booleanValue(false));
        assert.deepStrictEqual(after.outcomes["SECOND"], integerValue(responseDraw(1, 2)));
      }),
  );

  it.effect(
    "[I-9a] evaluates no operand of qti-custom-operator, so the random kind inside it never draws and the rule after it draws the response stream's first value",
    () =>
      Effect.gen(function* evaluatesNoCustomOperand() {
        const item = yield* Effect.fromResult(buildItem(customThenDraws));
        const after = yield* Effect.fromResult(
          runAttempt(item, fresh(item, instance), { RESPONSE: identifierValue("true") }),
        );

        // An operator that evaluated its operand would leave SECOND the stream's second value.
        assert.notStrictEqual(responseDraw(1, 1), responseDraw(1, 2));
        assert.deepStrictEqual(after.outcomes["FIRST"], nullOf("integer", "single"));
        assert.deepStrictEqual(after.outcomes["SECOND"], integerValue(responseDraw(1, 1)));
      }),
  );

  it.effect(
    "[I-5] reads the record's correct responses in qti-correct and its defaults in qti-default before the declarations'",
    () =>
      Effect.gen(function* readsRecordOverrides() {
        const item = yield* Effect.fromResult(buildItem(readsOverrides));
        const record: ItemRecord = {
          ...fresh(item, instance),
          correct: { RESPONSE: identifierValue("false") },
          defaults: { SCORE: floatValue(0.25) },
        };

        const after = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: identifierValue("false") }),
        );

        // With the declarations alone, MATCHED would be false and WAS 1.
        assert.isTrue(Option.isSome(item.processing));
        assert.deepStrictEqual(after.outcomes["MATCHED"], booleanValue(true));
        assert.deepStrictEqual(after.outcomes["WAS"], floatValue(0.25));
      }),
  );

  it.effect(
    "[I-5] resets each outcome to the record's template-set default before each attempt, never to a response's",
    () =>
      Effect.gen(function* resetsToSetDefault() {
        const item = yield* Effect.fromResult(buildItem(correctOnly));
        const record: ItemRecord = {
          ...fresh(item, instance),
          defaults: { RESPONSE: identifierValue("true"), SCORE: floatValue(0.5) },
        };

        const first = yield* Effect.fromResult(
          runAttempt(item, record, { RESPONSE: identifierValue("true") }),
        );
        const second = yield* Effect.fromResult(
          runAttempt(item, first, { RESPONSE: identifierValue("false") }),
        );

        // With the declared default alone, the reset would bring SCORE back to 0.
        assert.deepStrictEqual(score(first), floatValue(1));
        assert.deepStrictEqual(second.outcomes, {
          SCORE: floatValue(0.5),
          completionStatus: identifierValue("unknown"),
        });
      }),
  );

  it.effect("[I-5] reads the record's template values in response processing", () =>
    Effect.gen(function* readsRecordTemplates() {
      // The rules are written by hand, so the case does not depend on which reads of a template
      // variable the item model keeps in response processing.
      const built = yield* Effect.fromResult(
        buildItem(
          itemDocument(
            trueFalse,
            declaration("qti-outcome-declaration", "COPIED", "integer"),
            declaration("qti-template-declaration", "T", "integer"),
          ),
        ),
      );
      const item: Item = {
        ...built,
        processing: Option.some([
          {
            expression: {
              identifier: "T",
              kind: "variable",
              operands: [],
              weightIdentifier: Option.none(),
            },
            identifier: "COPIED",
            kind: "set-outcome",
          },
        ]),
      };
      const record: ItemRecord = { ...fresh(item, instance), templates: { T: integerValue(41n) } };

      const after = yield* Effect.fromResult(
        runAttempt(item, record, { RESPONSE: identifierValue("true") }),
      );

      assert.deepStrictEqual(after.outcomes["COPIED"], integerValue(41n));
    }),
  );

  it.effect("[I-5] draws response processing under the record's seed: two seeds, two values", () =>
    Effect.gen(function* drawsUnderRecordSeed() {
      const item = yield* Effect.fromResult(buildItem(drawsOnce));
      const seeded = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "1" }));
      const reseeded = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "2" }));

      const first = yield* Effect.fromResult(
        runAttempt(item, seeded, { RESPONSE: identifierValue("true") }),
      );
      const second = yield* Effect.fromResult(
        runAttempt(item, reseeded, { RESPONSE: identifierValue("true") }),
      );

      assert.strictEqual(
        new Set([responseDraw(1, 1, "1"), responseDraw(1, 1, "2"), responseDraw(1, 1)]).size,
        3,
      );
      assert.deepStrictEqual(first.outcomes["DRAWN"], integerValue(responseDraw(1, 1, "1")));
      assert.deepStrictEqual(second.outcomes["DRAWN"], integerValue(responseDraw(1, 1, "2")));
    }),
  );

  it.effect("[I-5] copies the record's seed, template values and overrides unchanged", () =>
    Effect.gen(function* copiesRecordFields() {
      const item = yield* Effect.fromResult(buildItem(bg007));
      const record: ItemRecord = {
        ...fresh(item, instance),
        correct: { RESPONSE: identifierValue("false") },
        defaults: { SCORE: floatValue(0.5) },
        seed: "9",
        templates: { T: integerValue(3n) },
      };

      const after = yield* Effect.fromResult(
        runAttempt(item, record, { RESPONSE: identifierValue("true") }),
      );

      assert.deepStrictEqual(
        [after.seed, after.templates, after.correct, after.defaults],
        [record.seed, record.templates, record.correct, record.defaults],
      );
    }),
  );

  it.effect("[T-14] keeps the record's records, the record responses' values, unchanged", () =>
    Effect.gen(function* keepsRecords() {
      const item = yield* Effect.fromResult(buildItem(bg007));
      const record: ItemRecord = {
        ...fresh(item, instance),
        records: {
          DETAIL: {
            cardinality: "record",
            fields: [{ identifier: "stringValue", value: { baseType: "string", value: "12" } }],
          },
          EMPTY: { cardinality: "record", fields: [] },
        },
      };

      const first = yield* Effect.fromResult(
        runAttempt(item, record, { RESPONSE: identifierValue("true") }),
      );
      const second = yield* Effect.fromResult(
        runAttempt(item, first, { RESPONSE: identifierValue("false") }),
      );

      assert.deepStrictEqual([first.records, second.records], [record.records, record.records]);
      assert.strictEqual(second.numAttempts, 2);
    }),
  );
});

describe("firstAttempt", () => {
  it.effect(
    "[I-5] runs template processing under the seed and the template label and writes each default, the template-set one winning",
    () =>
      Effect.gen(function* startsTemplated() {
        const item = yield* Effect.fromResult(buildItem(drawsTemplate));
        const drawn = integerValue(templateDraw("42"));

        const record = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "42" }));

        // The seed "42" and the seed "" give different values, and neither is the declared 7.
        assert.isTrue(Option.isSome(item.templateProcessing));
        assert.strictEqual(new Set([templateDraw("42"), templateDraw(""), 7n]).size, 3);
        assert.deepStrictEqual(record, {
          ...fresh(item, instance),
          correct: { RESPONSE: drawn },
          defaults: { RESPONSE: drawn, SCORE: floatValue(0.5) },
          outcomes: {
            SCORE: floatValue(0.5),
            TALLY: integerValue(0n),
            completionStatus: identifierValue("not_attempted"),
          },
          responses: {
            BARE: nullOf("string", "single"),
            OTHER: identifierValue("x"),
            RESPONSE: drawn,
          },
          seed: "42",
          templates: { N: drawn },
        });
      }),
  );

  it.effect(
    "[I-5] starts an item with no template declaration as fresh does, with three empty maps and the seed it was given",
    () =>
      Effect.gen(function* startsUntemplated() {
        const item = yield* Effect.fromResult(buildItem(bg007));

        const record = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "7" }));

        assert.deepStrictEqual(record, { ...fresh(item, instance), seed: "7" });
        assert.deepStrictEqual([record.templates, record.correct, record.defaults], [{}, {}, {}]);
      }),
  );

  it.effect(
    "[I-3] [I-5] holds each template variable at its declared default, else NULL, when the item has no template processing",
    () =>
      Effect.gen(function* holdsDeclaredTemplates() {
        const item = yield* Effect.fromResult(buildItem(declaresTemplates));

        const record = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "7" }));

        assert.deepStrictEqual(record.templates, {
          T: integerValue(3n),
          U: nullOf("integer", "single"),
        });
        assert.deepStrictEqual([record.correct, record.defaults], [{}, {}]);
      }),
  );

  it.effect(
    "[I-5] holds no template value when the item's template processing does not run, since nothing computed them",
    () =>
      Effect.gen(function* holdsNoMarkedTemplates() {
        const item = yield* Effect.fromResult(buildItem(marksTemplates));

        const record = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "7" }));

        assert.isTrue(Option.isNone(item.templateProcessing));
        assert.isTrue(item.templates.has("T"));
        assert.deepStrictEqual([record.templates, record.correct, record.defaults], [{}, {}, {}]);
      }),
  );

  it.effect("[I-5] returns template processing's failure", () =>
    Effect.gen(function* returnsTemplateFailure() {
      const item = yield* Effect.fromResult(buildItem(mistypesTemplate));

      const failure = failureOf(firstAttempt(item, { instance, seed: "7" }));

      assert.isTrue(Option.isSome(item.templateProcessing));
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
          actual: "string single",
          expected: "integer single",
          identifier: "N",
        },
      );
    }),
  );
});

describe("firstAttempt with an item ref's template defaults", () => {
  it.effect(
    "[T-9] starts the declared state the test sets before the item's template processing reads it",
    () =>
      Effect.gen(function* startsAtTestDefault() {
        const item = yield* Effect.fromResult(buildItem(readsTemplate));

        const record = yield* Effect.fromResult(
          firstAttempt(item, { instance, seed: "7", templateDefaults: { T: integerValue(10n) } }),
        );

        assert.isTrue(Option.isSome(item.templateProcessing));
        assert.deepStrictEqual(record.templates, { T: integerValue(10n), U: integerValue(11n) });
      }),
  );

  it.effect(
    "[T-9] holds an item with no template processing at the declared state the test sets",
    () =>
      Effect.gen(function* holdsUnprocessedAtTestDefault() {
        const item = yield* Effect.fromResult(buildItem(declaresTemplates));

        const record = yield* Effect.fromResult(
          firstAttempt(item, { instance, seed: "7", templateDefaults: { T: integerValue(10n) } }),
        );

        assert.deepStrictEqual(record.templates, {
          T: integerValue(10n),
          U: nullOf("integer", "single"),
        });
        assert.deepStrictEqual([record.correct, record.defaults], [{}, {}]);
      }),
  );

  it.effect(
    "[T-9] holds a marked item's template variables at the declared state the test sets, though its processing does not run",
    () =>
      Effect.gen(function* holdsMarkedAtTestDefault() {
        const item = yield* Effect.fromResult(buildItem(marksTemplates));

        const record = yield* Effect.fromResult(
          firstAttempt(item, { instance, seed: "7", templateDefaults: { T: integerValue(10n) } }),
        );

        assert.isTrue(Option.isNone(item.templateProcessing));
        assert.deepStrictEqual(record.templates, { T: integerValue(10n) });
        assert.deepStrictEqual([record.correct, record.defaults], [{}, {}]);
      }),
  );

  it.effect(
    "[T-9] tells a misfit default from the item's own failure: checkTemplateDefaults fails it on a sound item, and firstAttempt runs the declared state the test sets once it is checked",
    () =>
      Effect.gen(function* checksBeforeFirstAttempt() {
        const item = yield* Effect.fromResult(buildItem(readsTemplate));

        const misfit = failureOf(checkTemplateDefaults(item, { T: stringValue("ten") }));
        const checked = yield* Effect.fromResult(
          checkTemplateDefaults(item, { T: integerValue(10n) }),
        );
        const record = yield* Effect.fromResult(
          firstAttempt(item, { instance, seed: "7", templateDefaults: checked }),
        );

        assert.instanceOf(misfit, OutcomeMismatchError);
        assert.deepStrictEqual(
          { _tag: misfit._tag, actual: misfit.actual, expected: misfit.expected },
          { _tag: "OutcomeMismatchError", actual: "string single", expected: "integer single" },
        );
        assert.deepStrictEqual(record.templates, { T: integerValue(10n), U: integerValue(11n) });
      }),
  );

  it.effect(
    "[T-9] returns a misfit default as its failure, checking the declared state the test sets where it applies it",
    () =>
      Effect.gen(function* failsMisfitDefault() {
        const processed = yield* Effect.fromResult(buildItem(readsTemplate));
        const marked = yield* Effect.fromResult(buildItem(marksTemplates));

        const unknown = failureOf(
          firstAttempt(processed, {
            instance,
            seed: "7",
            templateDefaults: { NOWHERE: integerValue(1n) },
          }),
        );
        const mismatch = failureOf(
          firstAttempt(marked, {
            instance,
            seed: "7",
            templateDefaults: { T: stringValue("ten") },
          }),
        );

        assert.deepStrictEqual(
          unknown,
          new UnknownIdentifierError({ holder: "item", identifier: "NOWHERE", role: "variable" }),
        );
        assert.deepStrictEqual(
          mismatch,
          new OutcomeMismatchError({
            actual: "string single",
            expected: "integer single",
            identifier: "T",
          }),
        );
      }),
  );
});

/**
 * Construct a record's `qti-value`: one field, of a base type, from its text.
 *
 * @param identifier The `field-identifier`.
 * @param baseType The field's `base-type`.
 * @param written The value's text.
 * @returns The `qti-value` element.
 */
const fieldElement = (identifier: string, baseType: string, written: string): SourceElement =>
  el(
    "qti-value",
    [attr("base-type", baseType), attr("field-identifier", identifier)],
    [text(written)],
  );

/**
 * The record `R` declares as its default: the text `2.5` read into its `stringValue` and
 * `floatValue`, as a Text Entry bound to a record would post it.
 */
const declaredRecord: RecordValue = {
  cardinality: "record",
  fields: [
    { identifier: "stringValue", value: { baseType: "string", value: "2.5" } },
    { identifier: "floatValue", value: { baseType: "float", value: 2.5 } },
  ],
};

/**
 * An item with the record response `R`, which declares {@link declaredRecord} as its default, the
 * record response `BARE`, which declares none, and response processing that sets the float `SCORE`
 * to `R`'s `floatValue`.
 */
const recordDefaults = itemDocument(
  el(
    "qti-response-declaration",
    [attr("cardinality", "record"), attr("identifier", "R")],
    [
      el(
        "qti-default-value",
        [],
        [fieldElement("stringValue", "string", "2.5"), fieldElement("floatValue", "float", "2.5")],
      ),
    ],
  ),
  el("qti-response-declaration", [attr("cardinality", "record"), attr("identifier", "BARE")]),
  declaration("qti-outcome-declaration", "SCORE", "float"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "SCORE")],
        [
          el(
            "qti-field-value",
            [attr("field-identifier", "floatValue")],
            [el("qti-variable", [attr("identifier", "R")])],
          ),
        ],
      ),
    ],
  ),
);

/**
 * The NULL record: a record of no field.
 */
const nullRecord: RecordValue = { cardinality: "record", fields: [] };

/**
 * An item with the record response `BARE`, which declares no default, and response processing
 * that sets the boolean `LACKS` to whether `BARE`'s `stringValue` is NULL and the string `TEXT` to
 * that field.
 */
const readsUndefaulted = itemDocument(
  el("qti-response-declaration", [attr("cardinality", "record"), attr("identifier", "BARE")]),
  declaration("qti-outcome-declaration", "LACKS", "boolean"),
  declaration("qti-outcome-declaration", "TEXT", "string"),
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "LACKS")],
        [
          el(
            "qti-is-null",
            [],
            [
              el(
                "qti-field-value",
                [attr("field-identifier", "stringValue")],
                [el("qti-variable", [attr("identifier", "BARE")])],
              ),
            ],
          ),
        ],
      ),
      el(
        "qti-set-outcome-value",
        [attr("identifier", "TEXT")],
        [
          el(
            "qti-field-value",
            [attr("field-identifier", "stringValue")],
            [el("qti-variable", [attr("identifier", "BARE")])],
          ),
        ],
      ),
    ],
  ),
);

describe("firstAttempt with a record response", () => {
  it.effect(
    "[I-1] record default at the first attempt: firstAttempt writes a record response's declared default into records, and the NULL record for one that declares none",
    () =>
      Effect.gen(function* writesRecordDefault() {
        const item = yield* Effect.fromResult(buildItem(recordDefaults));

        const record = yield* Effect.fromResult(firstAttempt(item, { instance, seed: "7" }));

        assert.deepStrictEqual([...(item.records?.keys() ?? [])], ["R", "BARE"]);
        assert.deepStrictEqual(record, {
          ...fresh(item, instance),
          records: { BARE: nullRecord, R: declaredRecord },
          seed: "7",
        });
      }),
  );

  it.effect(
    "[I-1] record default at the first attempt: score with no record stores the default of a record response the post leaves out, and scores it",
    () =>
      Effect.gen(function* scoresRecordDefault() {
        const item = yield* Effect.fromResult(buildItem(recordDefaults));

        const stored = yield* Effect.fromResult(scoreItem(acceptForTest(item), {}));
        const after = yield* Effect.fromResult(decodeRecord(stored));

        assert.deepStrictEqual(item.unsupported, []);
        assert.deepStrictEqual(after.records, { BARE: nullRecord, R: declaredRecord });
        assert.deepStrictEqual(after.outcomes["SCORE"], floatValue(2.5));
      }),
  );

  it.effect(
    "[I-1] record default at the first attempt: an undefaulted record response starts as the NULL record, so score with no record reads its field as NULL and does not fail",
    () =>
      Effect.gen(function* readsUndefaultedField() {
        const item = yield* Effect.fromResult(buildItem(readsUndefaulted));

        const stored = yield* Effect.fromResult(scoreItem(acceptForTest(item), {}));
        const after = yield* Effect.fromResult(decodeRecord(stored));

        assert.deepStrictEqual(item.unsupported, []);
        assert.deepStrictEqual(after.records, { BARE: nullRecord });
        assert.deepStrictEqual(
          [after.outcomes["LACKS"], after.outcomes["TEXT"]],
          [booleanValue(true), nullOf("string", "single")],
        );
      }),
  );
});
