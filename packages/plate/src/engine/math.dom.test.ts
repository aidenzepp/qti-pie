/**
 * Plate's own Math in Chromium's and WebKit's pages: each function's digest over P7-MP's grids,
 * and each grid's input digest, equal the constants `src/test/math-grid.ts` commits, which Node
 * computed (`math.test.ts` asserts them there). So the port gives the same bits in Node and in
 * both engines.
 *
 * The run puts 2,000 inputs through 14 functions, long enough to reach each engine's optimising
 * tiers, where an engine that contracted `a * b + c` into a fused multiply-add, or kept extended
 * precision, would give other bits.
 *
 * It runs only inside the engine's page, under Vitest's browser mode in the in-page project of
 * `vite.browser.config.ts` (`test:browser`). Every case sits under a `describe` named by the engine
 * (`server.browser`), so each result's first ancestor title names the engine.
 */
import { assert, describe, it } from "@effect/vitest";
import { server } from "vite-plus/test/browser/context";
import {
  acos,
  asin,
  atan,
  atan2,
  cos,
  cosh,
  exp,
  log,
  log10,
  pow,
  sin,
  sinh,
  tan,
  tanh,
} from "#plate/engine/math.ts";
import {
  fold,
  inputDigests,
  pairNames,
  pairs,
  resultDigests,
  singleNames,
  singles,
} from "#plate/test/math-grid.ts";

/**
 * Plate's functions of one argument, by name.
 */
const singleFunctions: Readonly<Record<(typeof singleNames)[number], (x: number) => number>> = {
  acos,
  asin,
  atan,
  cos,
  cosh,
  exp,
  log,
  log10,
  sin,
  sinh,
  tan,
  tanh,
};

/**
 * Plate's functions of two arguments, by name.
 */
const pairFunctions: Readonly<
  Record<(typeof pairNames)[number], (a: number, b: number) => number>
> = { atan2, pow };

describe(server.browser, () => {
  it("rebuilds the single grid's inputs", () => {
    assert.strictEqual(fold(singles), inputDigests.singles);
  });

  it("rebuilds the pair grid's inputs", () => {
    assert.strictEqual(fold(pairs.flat()), inputDigests.pairs);
  });

  for (const name of singleNames) {
    it(`gives ${name}'s digest over the singles`, () => {
      assert.strictEqual(fold(singles.map((x) => singleFunctions[name](x))), resultDigests[name]);
    });
  }

  for (const name of pairNames) {
    it(`gives ${name}'s digest over the pairs`, () => {
      assert.strictEqual(
        fold(pairs.map(([a, b]) => pairFunctions[name](a, b))),
        resultDigests[name],
      );
    });
  }
});
