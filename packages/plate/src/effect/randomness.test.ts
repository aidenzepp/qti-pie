import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { SecureRandom } from "effect/crypto";
import { drawnSeed, Randomness } from "#plate/effect/randomness.ts";

/**
 * A test `Randomness` over a fixed byte source: each call returns a fresh array whose byte at index
 * `n` is `n`, so every draw of the same size gives the same bytes.
 */
const fixedRandomness = SecureRandom.make((size) =>
  Uint8Array.from({ length: size }, (_, index) => index % 0x1_00),
);

describe("Randomness", () => {
  it.effect("a seed drawn through Randomness by default: 32 lowercase hex digits", () =>
    Effect.gen(function* defaultDraws() {
      const seed = yield* drawnSeed;

      assert.match(seed, /^[0-9a-f]{32}$/u);
      assert.notStrictEqual(yield* drawnSeed, seed, "each seed is a fresh draw");
    }),
  );

  it.effect(
    "a seed drawn through Randomness from a test byte source is the value those bytes make, the same on two runs",
    () =>
      Effect.gen(function* fixedDraws() {
        const draw = drawnSeed.pipe(Effect.provideService(Randomness, fixedRandomness));
        const first = yield* draw;

        // Bytes 0x00 to 0x0f as hex.
        assert.strictEqual(first, "000102030405060708090a0b0c0d0e0f");
        assert.strictEqual(yield* draw, first);
      }),
  );
});
