import { assert, describe, it } from "@effect/vitest";
import { drawSeed } from "#plate/seed.ts";

describe("drawSeed", () => {
  it("[I-5] gives 32 lowercase hex digits", () => {
    assert.match(drawSeed(), /^[0-9a-f]{32}$/u);
  });

  it("[I-5] gives another seed every call: 100 calls give 100 seeds", () => {
    const seeds = Array.from({ length: 100 }, drawSeed);

    assert.strictEqual(new Set(seeds).size, 100);
  });
});
