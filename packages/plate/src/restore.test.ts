import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { open } from "#plate/validate/open.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";

/**
 * BG007, a true-or-false Choice bound to the single identifier response `RESPONSE`, by its path
 * under the corpus root, which `open` takes as its location.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The path under the corpus root of `template_digging`, an item whose template processing draws
 * the template variables `PEOPLE`, `A`, `B` and `MIN` and sets the correct value of its float
 * response `RESPONSE`.
 */
const templateDigging = "QTI3_BPIG_Examples/items/template_digging.xml";

/**
 * The candidate's answer to BG007: the choice `true`.
 */
const chosen: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "true" }],
};

/**
 * Open an item from the corpus cache, which `check` must accept.
 *
 * @param location The item's path under the corpus root.
 * @returns The accepted item.
 */
const opened = Effect.fnUntraced(function* opened(location: string) {
  const verdict = yield* open(location, yield* readCorpusFile(location));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open BG007 from the corpus cache and score one attempt of it answered {@link chosen}.
 *
 * @returns The accepted item and the record `score` returned, in the form the host stores.
 */
const scored = Effect.fnUntraced(function* scored() {
  const accepted = yield* opened(bg007);

  return { accepted, stored: yield* Effect.fromResult(score(accepted, { RESPONSE: chosen })) };
});

/**
 * Give the tag of a failed restore, and the stage of an `InvalidRecord`.
 *
 * @param restored What `restore` returned.
 * @returns The failure's `_tag`, then its `stage` where it has one; none when `restored`
 * succeeded.
 */
const failureOf = (restored: ReturnType<typeof restore>): Option.Option<readonly string[]> =>
  Option.map(Result.getFailure(restored), (failure) =>
    failure._tag === "InvalidRecord" ? [failure._tag, failure.stage] : [failure._tag],
  );

describe("restore", { tags: ["corpus"] }, () => {
  it.effect(
    "[T-14] [I-5] gives back the record score returned for BG007, decoded, beside its responses",
    () =>
      Effect.gen(function* restoresScored() {
        const { accepted, stored } = yield* scored();
        const record = yield* Effect.fromResult(decodeRecord(stored));

        assert.deepStrictEqual(
          Result.getSuccess(restore(accepted, stored)),
          Option.some({ record, values: { RESPONSE: chosen } }),
        );
      }),
  );

  it.effect(
    "[I-5] gives back a templated item's template values and correct responses in the record",
    () =>
      Effect.gen(function* restoresTemplated() {
        const accepted = yield* opened(templateDigging);
        const record: ItemRecord = {
          ...fresh(accepted.item, "digging"),
          correct: { RESPONSE: float(15) },
          seed: "7",
          templates: {
            A: integer(3n),
            B: integer(5n),
            MIN: integer(15n),
            PEOPLE: {
              baseType: "string",
              cardinality: "single",
              values: [{ baseType: "string", value: "children" }],
            },
          },
        };
        const stored = yield* Effect.fromResult(encodeRecord(record));

        assert.deepStrictEqual(
          Result.getSuccess(restore(accepted, stored)),
          Option.some({ record, values: record.responses }),
        );
      }),
  );

  it.effect(
    "[I-5] refuses begin's record of template_digging with its template values emptied, InvalidRecord at decode, and restores begin's own",
    () =>
      Effect.gen(function* refusesTemplateGap() {
        const accepted = yield* opened(templateDigging);
        const started = yield* Effect.fromResult(
          begin(accepted, { instance: "digging", seed: "7" }),
        );
        const emptied: StoredRecord = { ...started, templates: {} };
        const record = yield* Effect.fromResult(decodeRecord(started));

        assert.deepStrictEqual(
          failureOf(restore(accepted, emptied)),
          Option.some(["InvalidRecord", "decode"]),
        );
        assert.deepStrictEqual(
          Result.getSuccess(restore(accepted, started)),
          Option.some({ record, values: record.responses }),
        );
      }),
  );

  it.effect(
    "[I-5] refuses another item's record, before checking it against the item's declarations: RecordMismatch",
    () =>
      Effect.gen(function* refusesAnotherItems() {
        const { accepted } = yield* scored();
        const digging = yield* opened(templateDigging);
        const another = yield* Effect.fromResult(encodeRecord(fresh(digging.item, "digging")));
        const refused = restore(accepted, another);

        assert.deepStrictEqual(failureOf(refused), Option.some(["RecordMismatch"]));
        assert.deepStrictEqual(
          Option.flatMap(Result.getFailure(refused), (found) =>
            found._tag === "RecordMismatch"
              ? Option.some([found.item, found.recordItem])
              : Option.none(),
          ),
          Option.some(["beginnersguide007", "template_digging"]),
        );
      }),
  );

  it.effect(
    "[T-14] gives back a record holding a record response's record under records, its values the responses alone, and refuses one under an item that declares no record response: InvalidRecord",
    () =>
      Effect.gen(function* restoresRecords() {
        const { accepted } = yield* scored();
        const recorded = acceptForTest({
          ...accepted.item,
          records: new Map([
            ["RREC", { correct: Option.none(), defaultValue: Option.none(), identifier: "RREC" }],
          ]),
        });
        const answer: RecordValue = {
          cardinality: "record",
          fields: [
            { identifier: "stringValue", value: { baseType: "string", value: "1.5e3" } },
            { identifier: "exponent", value: { baseType: "integer", value: 3n } },
          ],
        };
        const stored = yield* Effect.fromResult(
          score(recorded, { RESPONSE: chosen, RREC: answer }),
        );
        const record = yield* Effect.fromResult(decodeRecord(stored));

        assert.deepStrictEqual(record.records, { RREC: answer });
        assert.deepStrictEqual(
          Result.getSuccess(restore(recorded, stored)),
          Option.some({ record, values: { RESPONSE: chosen } }),
        );
        assert.deepStrictEqual(
          failureOf(restore(accepted, stored)),
          Option.some(["InvalidRecord", "decode"]),
        );
      }),
  );

  it.effect("[T-14] refuses a record the renderer could not have written: InvalidRecord", () =>
    Effect.gen(function* refusesMalformed() {
      const { accepted, stored } = yield* scored();

      assert.deepStrictEqual(
        failureOf(restore(accepted, { ...stored, numAttempts: -1 })),
        Option.some(["InvalidRecord", "decode"]),
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
          Option.some(["InvalidRecord", "decode"]),
          "two values",
        );
        assert.deepStrictEqual(
          failureOf(restore(accepted, fullScore)),
          Option.some(["InvalidRecord", "decode"]),
          "SCORE full",
        );
      }),
  );
});
