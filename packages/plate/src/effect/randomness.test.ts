import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { SecureRandom } from "effect/crypto";
import { drawnInstance, drawnSeed, Randomness } from "#plate/effect/randomness.ts";
import { checkInstance } from "#plate/form/encoding.ts";

/**
 * A lowercase UUID v4: version nibble 4, variant bits `10`, lowercase hex digits.
 */
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

/**
 * A test `Randomness` over a fixed byte source: each call returns a fresh array whose byte at index
 * `n` is `n`, so every draw of the same size gives the same bytes.
 */
const fixedRandomness = SecureRandom.make((size) =>
  Uint8Array.from({ length: size }, (_, index) => index % 0x1_00),
);

describe("Randomness", () => {
  it.effect(
    "a seed and an instance drawn through Randomness by default: 32 lowercase hex digits and a lowercase UUID v4 checkInstance admits",
    () =>
      Effect.gen(function* defaultDraws() {
        const seed = yield* drawnSeed;
        const instance = yield* drawnInstance;

        assert.match(seed, /^[0-9a-f]{32}$/u);
        assert.match(instance, uuidV4);
        assert.isTrue(Option.isNone(checkInstance(instance)), "checkInstance admits the instance");
        assert.notStrictEqual(yield* drawnSeed, seed, "each seed is a fresh draw");
        assert.notStrictEqual(yield* drawnInstance, instance, "each instance is a fresh draw");
      }),
  );

  it.effect(
    "a seed and an instance drawn through Randomness from a test byte source are the values those bytes make, the same on two runs",
    () =>
      Effect.gen(function* fixedDraws() {
        const draws = Effect.all([drawnSeed, drawnInstance]).pipe(
          Effect.provideService(Randomness, fixedRandomness),
        );
        const first = yield* draws;
        const second = yield* draws;

        // Bytes 0x00 to 0x0f as hex; the instance sets byte 6's high nibble to 4 (0x06 → 0x46) and
        // byte 8's top two bits to 10 (0x08 → 0x88), as `drawInstance` does with the same bytes.
        assert.deepStrictEqual(first, [
          "000102030405060708090a0b0c0d0e0f",
          "00010203-0405-4607-8809-0a0b0c0d0e0f",
        ]);
        assert.deepStrictEqual(second, first);
        assert.isTrue(Option.isNone(checkInstance(first[1])), "checkInstance admits the instance");
      }),
  );
});
