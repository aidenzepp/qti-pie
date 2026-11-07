import { assert, describe, it } from "@effect/vitest";
import {
  clampOutputBudget,
  defaultOutputBudget,
  maximumOutputBudget,
} from "#plate/output-budget.ts";

/**
 * Each budget a host may pass and what `clampOutputBudget` holds it to: `NaN` to the default,
 * anything past the maximum to the maximum, anything below 1 to 1, and a finite fraction to its
 * floor, then into the range.
 */
const clamped: readonly { readonly budget: number; readonly held: number }[] = [
  { budget: Number.POSITIVE_INFINITY, held: maximumOutputBudget },
  { budget: Number.NaN, held: defaultOutputBudget },
  { budget: 0, held: 1 },
  { budget: -5, held: 1 },
  { budget: 1.5, held: 1 },
  { budget: 600_000_000, held: maximumOutputBudget },
  { budget: 1_000_000, held: 1_000_000 },
];

describe("clampOutputBudget", () => {
  for (const { budget, held } of clamped) {
    it(`[I-5] clamps ${String(budget)} to ${String(held)}`, () => {
      assert.strictEqual(clampOutputBudget(budget), held);
    });
  }

  it("[I-5] clamps -Infinity and a fraction below 1 to 1, and a fraction past the maximum to the maximum", () => {
    assert.strictEqual(clampOutputBudget(Number.NEGATIVE_INFINITY), 1);
    assert.strictEqual(clampOutputBudget(0.5), 1);
    assert.strictEqual(clampOutputBudget(maximumOutputBudget + 0.5), maximumOutputBudget);
  });

  it("[I-5] clamps nothing in the range: 1, the default and the maximum are held as given", () => {
    assert.strictEqual(clampOutputBudget(1), 1);
    assert.strictEqual(clampOutputBudget(defaultOutputBudget), defaultOutputBudget);
    assert.strictEqual(clampOutputBudget(maximumOutputBudget), maximumOutputBudget);
  });
});
