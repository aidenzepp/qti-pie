import { assert, describe, it } from "@effect/vitest";
import { toFloat } from "#plate/engine/numbers.ts";

/**
 * The largest finite float, `Number.MAX_VALUE`, as an exact integer: 2^1024 − 2^971.
 */
const greatest = 2n ** 1024n - 2n ** 971n;

/**
 * The least integer whose nearest double, ties to even, is an infinity: 2^1024 − 2^970, halfway
 * between {@link greatest} and 2^1024, a tie that rounds to the even 2^1024.
 */
const midpoint = 2n ** 1024n - 2n ** 970n;

describe("the engine's one integer-to-float conversion", () => {
  it("[I-9a] toFloat gives an integer beyond the largest finite float the largest finite float of its sign (reading 45)", () => {
    assert.strictEqual(toFloat(10n ** 400n), Number.MAX_VALUE);
    assert.strictEqual(toFloat(-(10n ** 400n)), -Number.MAX_VALUE);
    assert.strictEqual(toFloat(midpoint), Number.MAX_VALUE);
    assert.strictEqual(toFloat(-midpoint), -Number.MAX_VALUE);
    assert.strictEqual(toFloat(2n ** 1024n), Number.MAX_VALUE);
  });

  it("[I-9a] toFloat gives every other integer its nearest double, ties to even (reading 45)", () => {
    assert.strictEqual(toFloat(greatest), Number.MAX_VALUE);
    assert.strictEqual(toFloat(midpoint - 1n), Number.MAX_VALUE);
    assert.strictEqual(toFloat(-greatest), -Number.MAX_VALUE);
    assert.strictEqual(toFloat(2n ** 53n + 1n), 2 ** 53);
    assert.strictEqual(toFloat(2n ** 53n + 3n), 2 ** 53 + 4);
    assert.strictEqual(toFloat(-7n), -7);
    assert.isTrue(Object.is(toFloat(0n), 0), "the integer 0 is the float +0");
  });
});
