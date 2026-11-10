/**
 * The React host's score text, read directly: the one arm no accepted item reaches. `open` holds
 * `SCORE` to a float (`reserved-outcome-type`), so a file `SCORE` never comes out of `score`; the
 * arm exists for the `Single` union, and this file hands {@link scoreText} the stored record a host
 * could hold, with `SCORE` replaced. The page's rows sit in `react.dom.test.tsx`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { acceptedItem, configure, open, score } from "#plate/index.ts";
import type { StoredRecord } from "#plate/index.ts";
import { scoreText } from "#plate/hosts/react.tsx";

/**
 * A single Choice item written for this test, bound to `RESPONSE` with correct response `B` and a
 * float `SCORE` that `match_correct` sets, as the M2 fixture's single Choice is built.
 */
const singleChoiceXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="single-choice"',
  ' title="Single choice" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "<qti-correct-response><qti-value>B</qti-value></qti-correct-response>",
  "</qti-response-declaration>",
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  "<qti-default-value><qti-value>0</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '<qti-simple-choice identifier="A">Yes</qti-simple-choice>',
  '<qti-simple-choice identifier="B">No</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body>",
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>',
  "</qti-assessment-item>",
].join("");

/**
 * Open the item, score `B`, and replace the record's `SCORE` with a file.
 *
 * @returns The accepted item, the record with its file `SCORE`, and the configuration.
 */
const fileScored = Effect.gen(function* fileScored() {
  const accepted = Option.getOrThrow(
    acceptedItem(yield* open("single-choice.xml", new TextEncoder().encode(singleChoiceXml))),
  );
  const configuration = yield* configure({});
  const scored = yield* Effect.fromResult(
    score(accepted, {
      RESPONSE: {
        baseType: "identifier",
        cardinality: "single",
        values: [{ baseType: "identifier", value: "B" }],
      },
    }),
  );
  const stored: StoredRecord = {
    ...scored,
    outcomes: {
      ...scored.outcomes,
      SCORE: {
        baseType: "file",
        cardinality: "single",
        values: [{ baseType: "file", value: { name: "photo.png", size: 2048, type: "image/png" } }],
      },
    },
  };

  return { accepted, configuration, stored };
});

describe("scoreText", () => {
  it.effect("writes a file SCORE as its name, as the HTML host writes one", () =>
    Effect.gen(function* fileAsName() {
      const { accepted, configuration, stored } = yield* fileScored;

      assert.strictEqual(scoreText(accepted, stored, configuration.locale), "photo.png");
    }),
  );
});
