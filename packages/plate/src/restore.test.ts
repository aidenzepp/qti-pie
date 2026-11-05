import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { InvalidRecord } from "#plate/codec/record.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Value } from "#plate/model/values.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import { open } from "#plate/validate/open.ts";

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
 * @returns The record `score` returned, in the form the host stores.
 */
const scoredRecord = Effect.fnUntraced(function* scoredRecord() {
  const verdict = yield* open(bg007, yield* readCorpusFile(bg007));
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`${bg007} is ${verdict.verdict}, not accepted`);
  }

  return yield* Effect.fromResult(score(verdict.accepted, { RESPONSE: chosen }));
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

describe("restore", () => {
  it.effect("[T-14] gives back the responses of the record score returned for BG007", () =>
    Effect.gen(function* restoresScored() {
      const stored = yield* scoredRecord();

      assert.deepStrictEqual(
        Result.getSuccess(restore(stored)),
        Option.some({ values: { RESPONSE: chosen } }),
      );
    }),
  );

  it.effect("[T-14] refuses a record the renderer could not have written: InvalidRecord", () =>
    Effect.gen(function* refusesMalformed() {
      const stored = yield* scoredRecord();

      assert.deepStrictEqual(
        failureOf(restore({ ...stored, numAttempts: -1 })),
        Option.some(["InvalidRecord", "decode"] as const),
      );
    }),
  );
});
