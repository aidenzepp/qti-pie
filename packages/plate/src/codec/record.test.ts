import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord, ItemRecordSchema } from "#plate/codec/record.ts";
import type { Item } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * {@link ItemRecordSchema}'s type is the plain {@link ItemRecord}; `tsc` refuses this line when they
 * part.
 */
const recordPinned: Equals<typeof ItemRecordSchema.Type, ItemRecord> = true;

/**
 * A single integer value.
 *
 * @param value The integer.
 * @returns The value holding it.
 */
const integer = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * A single float value.
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
 * A BG007-shaped item, built by hand: an identifier `RESPONSE`, a float `SCORE` with default 1,
 * outcomes with no default of each kind, one notice and one mark.
 */
const item: Item = {
  body: [],
  document: "items/BG007.xml",
  identifier: "beginnersguide007",
  lang: Option.none(),
  outcomes: new Map([
    [
      "SCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.some(float(1)),
        identifier: "SCORE",
      },
    ],
    [
      "MAXSCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "MAXSCORE",
      },
    ],
    [
      "COUNT",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "COUNT",
      },
    ],
    [
      "FEEDBACK",
      {
        baseType: "identifier",
        cardinality: "multiple",
        defaultValue: Option.none(),
        identifier: "FEEDBACK",
      },
    ],
  ]),
  processing: Option.none(),
  responses: new Map([
    [
      "RESPONSE",
      {
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some<Value>({
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "true" }],
        }),
        defaultValue: Option.none(),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
  ]),
  title: "BG true false example ",
  unsupported: [
    {
      feature: "qti-hotspot-interaction",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
      shown: "notice",
    },
    {
      feature: 'shuffle="true"',
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
      shown: "mark",
    },
  ],
};

/**
 * Pass a record through a host: encode it, write it as JSON text, read the text back and decode
 * what the host hands back.
 *
 * @param record The record.
 * @returns The record as the renderer reads it back, or the {@link InvalidRecord} either side
 *   gives.
 */
const throughHost = (record: ItemRecord): Result.Result<ItemRecord, InvalidRecord> =>
  Result.flatMap(encodeRecord(record), (stored) => {
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the record survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
    const handedBack: unknown = JSON.parse(JSON.stringify(stored));

    return decodeRecord(handedBack);
  });

describe("the plain type", () => {
  it("is the Schema's type", () => {
    assert.isTrue(recordPinned);
  });
});

describe("encodeRecord and decodeRecord", () => {
  it("return Results: a fresh record's stored form is JSON text and decodes back to the record", () => {
    const record = fresh(item, "i1");
    const encoded = encodeRecord(record);
    assert.isTrue(Result.isResult(encoded));
    assert.isTrue(Result.isSuccess(encoded.pipe(Result.map((stored) => JSON.stringify(stored)))));

    const decoded = encoded.pipe(Result.flatMap((stored) => decodeRecord(stored)));
    assert.isTrue(Result.isResult(decoded));
    assert.deepStrictEqual(Result.getSuccess(decoded), Option.some(record));
  });

  it('decodeRecord refuses a record with attempt "late": a failed Result tagged InvalidRecord', () => {
    const encoded = encodeRecord(fresh(item, "i1"));
    assert.isTrue(Result.isResult(encoded));
    assert.isTrue(Result.isSuccess(encoded));

    const late = encoded.pipe(
      Result.flatMap((stored) => decodeRecord({ ...stored, attempt: "late" })),
    );
    assert.isTrue(Result.isResult(late));
    assert.deepStrictEqual(
      Option.map(Result.getFailure(late), (failure) => failure._tag),
      Option.some("InvalidRecord"),
    );
  });
});

describe("decodeRecord", () => {
  it.effect("round-trips a record through encodeRecord and JSON", () =>
    Effect.gen(function* roundTrips() {
      const record = fresh(item, "i1");

      assert.deepStrictEqual(yield* Effect.fromResult(throughHost(record)), record);
    }),
  );

  it.effect("round-trips integers beyond 2^53 exactly, stored as their decimal digits", () =>
    Effect.gen(function* integersExact() {
      const record: ItemRecord = {
        ...fresh(item, "i1"),
        outcomes: {
          ...fresh(item, "i1").outcomes,
          BELOW: integer(-(10n ** 30n)),
          COUNT: integer(2n ** 53n + 1n),
          HUGE: integer(10n ** 30n),
        },
      };
      const stored = yield* Effect.fromResult(encodeRecord(record));

      assert.deepStrictEqual(
        [stored.outcomes["COUNT"], stored.outcomes["HUGE"], stored.outcomes["BELOW"]].map(
          (outcome) => outcome?.values[0]?.value,
        ),
        ["9007199254740993", "1000000000000000000000000000000", "-1000000000000000000000000000000"],
      );
      assert.deepStrictEqual(yield* Effect.fromResult(throughHost(record)), record);
    }),
  );

  it.effect('refuses a stored integer written as the number 5 or as "1.5"', () =>
    Effect.gen(function* refusesInexactIntegers() {
      const stored = yield* Effect.fromResult(encodeRecord(fresh(item, "i1")));
      for (const written of [5, "1.5"]) {
        const error = yield* Effect.flip(
          Effect.fromResult(
            decodeRecord({
              ...stored,
              outcomes: {
                ...stored.outcomes,
                COUNT: {
                  baseType: "integer",
                  cardinality: "single",
                  values: [{ baseType: "integer", value: written }],
                },
              },
            }),
          ),
        );

        assert.strictEqual(error._tag, "InvalidRecord", String(written));
      }
    }),
  );

  it.effect("refuses a negative numAttempts and a response that is not a value", () =>
    Effect.gen(function* refusesMalformed() {
      const stored = yield* Effect.fromResult(encodeRecord(fresh(item, "i1")));
      const negative = yield* Effect.flip(
        Effect.fromResult(decodeRecord({ ...stored, numAttempts: -1 })),
      );
      const malformed = yield* Effect.flip(
        Effect.fromResult(decodeRecord({ ...stored, responses: { RESPONSE: "true" } })),
      );

      assert.strictEqual(negative._tag, "InvalidRecord");
      assert.strictEqual(malformed._tag, "InvalidRecord");
    }),
  );
});
