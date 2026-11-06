import { assert, describe, it } from "@effect/vitest";
import { foldCase, shortestDecimal } from "#plate/engine/math.ts";

/**
 * Floats and the digits {@link shortestDecimal} must write for each, pinned so a change of the
 * engine's number-to-string conversion, or of its remedy, shows here.
 */
const pinned: readonly (readonly [number, string])[] = [
  [1.5, "1.5"],
  [100, "100"],
  [1e21, "1e+21"],
  [0.1 + 0.2, "0.30000000000000004"],
  [-0, "0"],
  [5e-324, "5e-324"],
  [Number.MAX_VALUE, "1.7976931348623157e+308"],
  [3.175, "3.175"],
  [1.2345e-7, "1.2345e-7"],
];

describe("shortestDecimal", () => {
  for (const [float, written] of pinned) {
    it(`writes ${written}`, () => {
      assert.strictEqual(shortestDecimal(float), written);
    });
  }
});

describe("foldCase", () => {
  it("folds York to york", () => {
    assert.strictEqual(foldCase("York"), "york");
  });

  it("folds ß to ss", () => {
    assert.strictEqual(foldCase("ß"), "ss");
  });
});
