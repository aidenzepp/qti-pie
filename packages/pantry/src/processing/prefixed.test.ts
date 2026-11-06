import { assert, describe, it } from "@effect/vitest";
import { prefixedReadings } from "#pantry/processing/prefixed.ts";

describe("prefixedReadings", () => {
  it("gives both splits of a twice-dotted name", () => {
    assert.deepStrictEqual(prefixedReadings("a.b.SCORE"), [
      { instance: undefined, prefix: "a", variable: "b.SCORE" },
      { instance: undefined, prefix: "a.b", variable: "SCORE" },
    ]);
  });

  it("gives one reading for ITEMREF.VAR", () => {
    assert.deepStrictEqual(prefixedReadings("item034.SCORE"), [
      { instance: undefined, prefix: "item034", variable: "SCORE" },
    ]);
  });

  it("reads a positive instance and the split after it", () => {
    assert.deepStrictEqual(prefixedReadings("I1.2.SCORE"), [
      { instance: { spelling: "2", value: 2n }, prefix: "I1", variable: "SCORE" },
      { instance: undefined, prefix: "I1.2", variable: "SCORE" },
    ]);
  });

  it("keeps the instance spelling as written", () => {
    const readings = prefixedReadings("I1.02.SCORE");
    assert.deepStrictEqual(readings, [
      { instance: { spelling: "02", value: 2n }, prefix: "I1", variable: "SCORE" },
      { instance: undefined, prefix: "I1.02", variable: "SCORE" },
    ]);
    assert.strictEqual(String(readings[0]?.instance?.value), "2");
  });

  it("gives a dotted variable as the first reading's", () => {
    assert.deepStrictEqual(prefixedReadings("I1.A.B"), [
      { instance: undefined, prefix: "I1", variable: "A.B" },
      { instance: undefined, prefix: "I1.A", variable: "B" },
    ]);
  });

  it("reads an instance before a dotted variable", () => {
    assert.deepStrictEqual(prefixedReadings("I1.2.A.B"), [
      { instance: { spelling: "2", value: 2n }, prefix: "I1", variable: "A.B" },
      { instance: undefined, prefix: "I1.2", variable: "A.B" },
      { instance: undefined, prefix: "I1.2.A", variable: "B" },
    ]);
  });

  it("has no instance for zero", () => {
    assert.deepStrictEqual(prefixedReadings("I1.0.SCORE"), [
      { instance: undefined, prefix: "I1", variable: "0.SCORE" },
      { instance: undefined, prefix: "I1.0", variable: "SCORE" },
    ]);
  });

  it("parses PART.duration as variable duration", () => {
    assert.deepStrictEqual(prefixedReadings("PART.duration"), [
      { instance: undefined, prefix: "PART", variable: "duration" },
    ]);
  });

  it("is empty without a dot", () => {
    assert.deepStrictEqual(prefixedReadings("SCORE"), []);
  });

  it("reads an instance too large for a number exactly", () => {
    const readings = prefixedReadings("I1.123456789012345678901234567890.V");
    assert.strictEqual(readings[0]?.instance?.value, 123_456_789_012_345_678_901_234_567_890n);
  });
});
