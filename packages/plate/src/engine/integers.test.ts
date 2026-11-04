import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { runRules } from "#plate/engine/evaluate.ts";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import type { Binding } from "#plate/form/encoding.ts";
import { buildItem } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import { format } from "#plate/model/values.ts";

/**
 * The item instance every case posts under.
 */
const instance = "6f1c2b9e-4d3a-4e8b-9c7f-0a1b2c3d4e5f";

/**
 * The binding of `RESPONSE`, a single integer, as a Text Entry posts it.
 */
const binding: Binding = {
  baseType: "integer",
  cardinality: "single",
  name: entryName(instance, "RESPONSE"),
};

/**
 * Construct an item with a Text Entry bound to `RESPONSE`, a single integer, and a single float
 * `SCORE` with no default, processed by a built-in template.
 *
 * @param identifier The item's identifier, which also names its document.
 * @param response The response declaration's children: its correct response or its mapping.
 * @param templateName The template's file name.
 * @returns The item document.
 */
const integerItem = (
  identifier: string,
  response: readonly SourceChild[],
  templateName: string,
): SourceDocument =>
  doc(
    `items/${identifier}.xml`,
    el(
      "qti-assessment-item",
      [attr("identifier", identifier), attr("title", identifier)],
      [
        el(
          "qti-response-declaration",
          [
            attr("base-type", "integer"),
            attr("cardinality", "single"),
            attr("identifier", "RESPONSE"),
          ],
          response,
        ),
        el("qti-outcome-declaration", [
          attr("base-type", "float"),
          attr("cardinality", "single"),
          attr("identifier", "SCORE"),
        ]),
        el(
          "qti-item-body",
          [],
          [
            el(
              "p",
              [],
              [
                text("How many? "),
                el("qti-text-entry-interaction", [attr("response-identifier", "RESPONSE")]),
              ],
            ),
          ],
        ),
        el("qti-response-processing", [
          attr("template", `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/${templateName}`),
        ]),
      ],
    ),
  );

/**
 * Construct a `qti-map-entry` of an integer key.
 *
 * @param key The key's text.
 * @param mapped The mapped value's text.
 * @returns The entry element.
 */
const entry = (key: string, mapped: string): SourceElement =>
  el("qti-map-entry", [attr("map-key", key), attr("mapped-value", mapped)]);

/**
 * W1: `match_correct`, whose correct response is 2^53 + 1, the smallest positive integer no double
 * holds.
 */
const w1 = integerItem(
  "w1",
  [el("qti-correct-response", [], [el("qti-value", [], [text("9007199254740993")])])],
  "match_correct",
);

/**
 * W2: `map_response`, which maps 10^30 to 2 and -10^30 to 3, and anything else to 0.
 */
const w2 = integerItem(
  "w2",
  [
    el(
      "qti-mapping",
      [attr("default-value", "0")],
      [
        entry("1000000000000000000000000000000", "2"),
        entry("-1000000000000000000000000000000", "3"),
      ],
    ),
  ],
  "map_response",
);

/**
 * Build an item, post one integer to it and run its response processing from the outcome defaults.
 *
 * @param source The item document.
 * @param posted The text the candidate posts for `RESPONSE`.
 * @returns `SCORE`'s values after processing, each in its lexical form.
 */
const scoreAfter = (source: SourceDocument, posted: string) =>
  Effect.gen(function* postAndProcess() {
    const item = yield* buildItem(source);
    const response = yield* decode([[binding.name, posted]], binding);
    const rules = yield* Effect.fromOption(item.processing);
    const after = runRules(rules, item, {
      outcomes: outcomeDefaults(item),
      responses: { RESPONSE: response },
    });

    return after.outcomes["SCORE"]?.values.map(format);
  });

/**
 * W1's posts and the score each earns. 2^53 and 2^53 + 1 are one double, so the second case fails
 * under any number model.
 */
const w1Cases = [
  { posted: "9007199254740993", score: "1" },
  { posted: "9007199254740992", score: "0" },
  { posted: "-9007199254740993", score: "0" },
] as const;

/**
 * W2's posts and the score each earns. 10^30 and 10^30 + 1 are one double, so the third case fails
 * under any number model.
 */
const w2Cases = [
  { posted: "1000000000000000000000000000000", score: "2" },
  { posted: "-1000000000000000000000000000000", score: "3" },
  { posted: "1000000000000000000000000000001", score: "0" },
  { posted: "+0001000000000000000000000000000000", score: "2" },
] as const;

describe("exact integers from content and post through the engine", () => {
  for (const { posted, score } of w1Cases) {
    it.effect(
      `[Q-20] [I-9b] match_correct with the correct response 9007199254740993: posting ${posted} scores ${score}`,
      () =>
        Effect.gen(function* matchCorrect() {
          assert.deepStrictEqual(yield* scoreAfter(w1, posted), [score]);
        }),
    );
  }

  for (const { posted, score } of w2Cases) {
    it.effect(`[Q-20] [I-9b] map_response over ±10^30: posting ${posted} scores ${score}`, () =>
      Effect.gen(function* mapResponse() {
        assert.deepStrictEqual(yield* scoreAfter(w2, posted), [score]);
      }),
    );
  }
});
