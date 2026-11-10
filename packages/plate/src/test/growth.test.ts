import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  cpuMillis,
  growthFactor,
  growthLimit,
  growthRatio,
  growthSample,
  growthSampleCap,
} from "#plate/test/growth.ts";

/**
 * The tick of the coarse thread-CPU accounting of a Linux VM, in milliseconds.
 */
const tickMillis = 4;

/**
 * A clock that reads CPU time in whole ticks, as a cloud VM's kernel accounts it.
 *
 * @param work The computation.
 * @returns Its CPU time rounded down to a whole tick.
 */
const coarseClock = (work: () => void): Effect.Effect<number> =>
  Effect.map(cpuMillis(work), (millis) => Math.floor(millis / tickMillis) * tickMillis);

/**
 * Build a linear computation over `size` items.
 *
 * @param size The item count.
 * @returns A function summing `size` numbers.
 */
const linear = (size: number): (() => void) => {
  const items = Array.from({ length: size }, (_, index) => index);

  return () => {
    let total = 0;
    for (const item of items) {
      total += item;
    }
    assert.isAtLeast(total, 0);
  };
};

/**
 * Build a quadratic computation over `size` items.
 *
 * @param size The item count.
 * @returns A function comparing every pair of `size` numbers.
 */
const quadratic = (size: number): (() => void) => {
  const items = Array.from({ length: size }, (_, index) => index);

  return () => {
    let pairs = 0;
    for (const left of items) {
      for (const right of items) {
        pairs += left <= right ? 1 : 0;
      }
    }
    assert.isAtLeast(pairs, 0);
  };
};

describe("growthRatio", () => {
  it.effect(
    "reads a linear computation under the limit on a coarse clock",
    () =>
      Effect.gen(function* checkLinear() {
        const ratio = yield* growthRatio(linear(5000), linear(5000 * growthFactor), coarseClock);
        assert.isTrue(Number.isFinite(ratio));
        assert.isBelow(ratio, growthLimit);
      }),
    20_000,
  );

  it.effect(
    "reads a quadratic computation over the limit on a coarse clock",
    () =>
      Effect.gen(function* checkQuadratic() {
        const ratio = yield* growthRatio(
          quadratic(150),
          quadratic(150 * growthFactor),
          coarseClock,
        );
        assert.isTrue(Number.isFinite(ratio));
        assert.isAbove(ratio, growthLimit);
      }),
    20_000,
  );
});

describe("growthSample", () => {
  it.effect("doubles the repeat count until the measurement is nonzero", () =>
    Effect.gen(function* checkSearch() {
      const repeats = yield* growthSample((count) => Effect.succeed(count >= 16 ? 20 : 0));
      assert.strictEqual(repeats, 16);
    }),
  );

  it.effect("stops at the cap when the clock never reads anything", () =>
    Effect.gen(function* checkCap() {
      const repeats = yield* growthSample(() => Effect.succeed(0));
      assert.strictEqual(repeats, growthSampleCap);
      assert.strictEqual(repeats, 1024);
    }),
  );
});
