import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord, ItemRecordSchema } from "#plate/codec/record.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";

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

/**
 * BG007's fresh record as template processing would leave it, started under seed 7: template
 * values that are an integer beyond 2^53, a negative-zero float and a NULL, a correct response and
 * a default it set.
 */
const templated: ItemRecord = {
  ...fresh(bg007Item, "i1"),
  correct: {
    RESPONSE: {
      baseType: "identifier",
      cardinality: "single",
      values: [{ baseType: "identifier", value: "A" }],
    },
  },
  defaults: { SCORE: float(2) },
  seed: "7",
  templates: {
    HUGE: integer(2n ** 53n + 1n),
    MISSING: nullOf("integer", "single"),
    ZERO: float(-0),
  },
};

describe("the plain type", () => {
  it("is the Schema's type", () => {
    assert.isTrue(recordPinned);
  });
});

describe("encodeRecord and decodeRecord", () => {
  it("return Results: a fresh record's stored form is JSON text and decodes back to the record", () => {
    const record = fresh(bg007Item, "i1");
    const encoded = encodeRecord(record);
    assert.isTrue(Result.isResult(encoded));
    assert.isTrue(Result.isSuccess(encoded.pipe(Result.map((stored) => JSON.stringify(stored)))));

    const decoded = encoded.pipe(Result.flatMap((stored) => decodeRecord(stored)));
    assert.isTrue(Result.isResult(decoded));
    assert.deepStrictEqual(Result.getSuccess(decoded), Option.some(record));
  });

  it('decodeRecord refuses a record with attempt "late": a failed Result tagged InvalidRecord', () => {
    const encoded = encodeRecord(fresh(bg007Item, "i1"));
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
      const record = fresh(bg007Item, "i1");

      assert.deepStrictEqual(yield* Effect.fromResult(throughHost(record)), record);
    }),
  );

  it.effect("round-trips integers beyond 2^53 exactly, stored as their decimal digits", () =>
    Effect.gen(function* integersExact() {
      const record: ItemRecord = {
        ...fresh(bg007Item, "i1"),
        outcomes: {
          ...fresh(bg007Item, "i1").outcomes,
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

  it.effect("round-trips floats that are infinite, not a number or negative zero exactly", () =>
    Effect.gen(function* nonFiniteFloatsExact() {
      const record: ItemRecord = {
        ...fresh(bg007Item, "i1"),
        outcomes: {
          ...fresh(bg007Item, "i1").outcomes,
          HIGH: float(Number.POSITIVE_INFINITY),
          LOW: float(Number.NEGATIVE_INFINITY),
          UNDEFINED: float(Number.NaN),
          ZERO: float(-0),
        },
      };
      const handedBack = yield* Effect.fromResult(throughHost(record));

      assert.deepStrictEqual(handedBack, record);
      assert.isTrue(Number.isNaN(handedBack.outcomes["UNDEFINED"]?.values[0]?.value));
      assert.isTrue(Object.is(handedBack.outcomes["ZERO"]?.values[0]?.value, -0));
    }),
  );

  it.effect(
    "[I-5] round-trips the seed, the template values, the correct responses and the defaults exactly",
    () =>
      Effect.gen(function* templatesExact() {
        const stored = yield* Effect.fromResult(encodeRecord(templated));
        const handedBack = yield* Effect.fromResult(throughHost(templated));

        assert.strictEqual(stored.seed, "7");
        assert.strictEqual(stored.templates["HUGE"]?.values[0]?.value, "9007199254740993");
        assert.strictEqual(stored.templates["ZERO"]?.values[0]?.value, "-0");
        assert.deepStrictEqual(stored.templates["MISSING"]?.values, []);
        assert.deepStrictEqual(handedBack, templated);
        assert.isTrue(Object.is(handedBack.templates["ZERO"]?.values[0]?.value, -0));
      }),
  );

  it.effect('refuses a stored integer written as the number 5 or as "1.5"', () =>
    Effect.gen(function* refusesInexactIntegers() {
      const stored = yield* Effect.fromResult(encodeRecord(fresh(bg007Item, "i1")));
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

  it.effect(
    'refuses attempt "refused", which no function writes: InvalidRecord at stage decode',
    () =>
      Effect.gen(function* refusesRefused() {
        const stored = yield* Effect.fromResult(encodeRecord(fresh(bg007Item, "i1")));
        const result = decodeRecord({ ...stored, attempt: "refused" });
        assert.isTrue(Result.isResult(result));

        const error = yield* Effect.flip(Effect.fromResult(result));
        assert.strictEqual(error._tag, "InvalidRecord");
        assert.strictEqual(error.stage, "decode");
      }),
  );

  it.effect("refuses a negative numAttempts and a response that is not a value", () =>
    Effect.gen(function* refusesMalformed() {
      const stored = yield* Effect.fromResult(encodeRecord(fresh(bg007Item, "i1")));
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

describe("the stored record's version", () => {
  it.effect("[T-14] [I-5] is written as version 2 and read back", () =>
    Effect.gen(function* writesVersion() {
      const stored = yield* Effect.fromResult(encodeRecord(fresh(bg007Item, "i1")));

      assert.strictEqual(stored.version, 2);
      assert.deepStrictEqual(
        yield* Effect.fromResult(throughHost(fresh(bg007Item, "i1"))),
        fresh(bg007Item, "i1"),
      );
    }),
  );

  it.effect(
    "[T-14] is required: a stored record without one is InvalidRecord at stage decode",
    () =>
      Effect.gen(function* requiresVersion() {
        const { version: _written, ...unversioned } = yield* Effect.fromResult(
          encodeRecord(fresh(bg007Item, "i1")),
        );
        const error = yield* Effect.flip(Effect.fromResult(decodeRecord(unversioned)));

        assert.strictEqual(error._tag, "InvalidRecord");
        assert.strictEqual(error.stage, "decode");
      }),
  );

  it.effect(
    "[T-14] [I-5] must be 2: a stored record of version 1, with or without the fields version 2 adds, is InvalidRecord at stage decode",
    () =>
      Effect.gen(function* refusesOtherVersion() {
        const stored = yield* Effect.fromResult(encodeRecord(templated));
        const {
          correct: _correct,
          defaults: _defaults,
          seed: _seed,
          templates: _templates,
          ...earlier
        } = stored;

        for (const versionOne of [
          { ...earlier, version: 1 },
          { ...stored, version: 1 },
        ]) {
          const error = yield* Effect.flip(Effect.fromResult(decodeRecord(versionOne)));

          assert.strictEqual(error._tag, "InvalidRecord");
          assert.strictEqual(error.stage, "decode");
        }
      }),
  );
});

describe("encodeRecord", () => {
  it.effect(
    "refuses an integer outcome holding the number 1.5: InvalidRecord at stage encode",
    () =>
      Effect.gen(function* refusesInexactOutcome() {
        const inexact = {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 1.5 }],
        } as const;
        const record: ItemRecord = {
          ...fresh(bg007Item, "i1"),
          outcomes: {
            ...fresh(bg007Item, "i1").outcomes,
            // @ts-expect-error -- an integer holds a bigint; the number 1.5 is what encode must refuse.
            COUNT: inexact,
          },
        };
        const result = encodeRecord(record);
        assert.isTrue(Result.isResult(result));

        const error = yield* Effect.flip(Effect.fromResult(result));
        assert.strictEqual(error._tag, "InvalidRecord");
        assert.strictEqual(error.stage, "encode");
      }),
  );
});
