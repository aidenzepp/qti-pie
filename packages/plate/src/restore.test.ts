import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord } from "#plate/codec/record.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Value } from "#plate/model/values.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * BG007, a true-or-false Choice bound to the single identifier response `RESPONSE`, by its path
 * under the corpus root, which `open` takes as its location.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The candidate's answer to BG007: the choice `true`.
 */
const chosen: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "true" }],
};

/**
 * Open BG007 from the corpus cache and score one attempt of it answered {@link chosen}.
 *
 * @returns The accepted item and the record `score` returned, in the form the host stores.
 */
const scored = Effect.fnUntraced(function* scored() {
  const verdict = yield* open(bg007, yield* readCorpusFile(bg007));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${bg007} is ${verdict.verdict}, not accepted`),
  );

  return { accepted, stored: yield* Effect.fromResult(score(accepted, { RESPONSE: chosen })) };
});

/**
 * Give the tag and the stage of a failed restore.
 *
 * @param restored What `restore` returned.
 * @returns The failure's `_tag` and `stage`, none when `restored` succeeded.
 */
const failureOf = (
  restored: Result.Result<unknown, InvalidRecord>,
): Option.Option<readonly [string, string]> =>
  Option.map(Result.getFailure(restored), (failure) => [failure._tag, failure.stage] as const);

describe("restore", { tags: ["corpus"] }, () => {
  it.effect("[T-14] gives back the responses of the record score returned for BG007", () =>
    Effect.gen(function* restoresScored() {
      const { accepted, stored } = yield* scored();

      assert.deepStrictEqual(
        Result.getSuccess(restore(accepted, stored)),
        Option.some({ values: { RESPONSE: chosen } }),
      );
    }),
  );

  it.effect("[T-14] refuses a record the renderer could not have written: InvalidRecord", () =>
    Effect.gen(function* refusesMalformed() {
      const { accepted, stored } = yield* scored();

      assert.deepStrictEqual(
        failureOf(restore(accepted, { ...stored, numAttempts: -1 })),
        Option.some(["InvalidRecord", "decode"] as const),
      );
    }),
  );

  it.effect(
    "refuses a record that does not fit the item's declarations, a response of two values where one is declared or an outcome of another base type, as score refuses the first",
    () =>
      Effect.gen(function* refusesMisfit() {
        const { accepted, stored } = yield* scored();
        const decoded = yield* Effect.fromResult(decodeRecord(stored));
        const twoValues = yield* Effect.fromResult(
          encodeRecord({
            ...decoded,
            responses: {
              RESPONSE: {
                baseType: "identifier",
                cardinality: "multiple",
                values: [
                  { baseType: "identifier", value: "true" },
                  { baseType: "identifier", value: "false" },
                ],
              },
            },
          }),
        );
        const fullScore = yield* Effect.fromResult(
          encodeRecord({
            ...decoded,
            outcomes: {
              SCORE: {
                baseType: "identifier",
                cardinality: "single",
                values: [{ baseType: "identifier", value: "full" }],
              },
            },
          }),
        );

        assert.deepStrictEqual(
          Option.map(Result.getFailure(score(accepted, {}, twoValues)), ({ _tag }) => _tag),
          Option.some("InvalidRecord"),
        );
        assert.deepStrictEqual(
          failureOf(restore(accepted, twoValues)),
          Option.some(["InvalidRecord", "decode"] as const),
          "two values",
        );
        assert.deepStrictEqual(
          failureOf(restore(accepted, fullScore)),
          Option.some(["InvalidRecord", "decode"] as const),
          "SCORE full",
        );
      }),
  );
});
