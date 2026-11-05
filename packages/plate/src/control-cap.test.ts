import { assert, describe, it } from "@effect/vitest";
import { controlCap, exceedsControlCap } from "#plate/control-cap.ts";
import { renders } from "#plate/vocabulary.ts";

describe("controlCap", () => {
  it("is the one control notice the vocabulary lists, so the payload and the verdict read one rule", () => {
    assert.deepStrictEqual(renders.controlNotices, [controlCap]);
    assert.strictEqual(renders.controlNotices[0], controlCap);
  });
});

describe("exceedsControlCap", () => {
  it("holds for a min-strings above 100, exact at any size", () => {
    assert.isTrue(exceedsControlCap(101n));
    assert.isTrue(exceedsControlCap(9_223_372_036_854_775_808n));
  });

  it("does not hold for a min-strings of 100 or less", () => {
    assert.isFalse(exceedsControlCap(100n));
    assert.isFalse(exceedsControlCap(0n));
  });
});
