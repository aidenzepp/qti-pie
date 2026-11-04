import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { prefixedForm } from "#pantry/processing/prefixed.ts";

/**
 * Parses `name` and fails unless it has a prefixed form.
 */
const parsed = (name: string) => {
  const form = prefixedForm(name);
  assert.isTrue(Option.isSome(form));

  return Option.getOrThrow(form);
};

describe("prefixedForm", () => {
  it("splits ITEMREF.VAR", () => {
    const form = parsed("item034.SCORE");
    assert.strictEqual(form.prefix, "item034");
    assert.isUndefined(form.instance);
    assert.strictEqual(form.variable, "SCORE");
  });

  it("reads a positive instance", () => {
    const form = parsed("I1.2.SCORE");
    assert.strictEqual(form.prefix, "I1");
    assert.deepStrictEqual(form.instance, { spelling: "2", value: 2n });
    assert.strictEqual(form.variable, "SCORE");
  });

  it("keeps the instance spelling as written", () => {
    const form = parsed("I1.02.SCORE");
    assert.deepStrictEqual(form.instance, { spelling: "02", value: 2n });
    assert.strictEqual(String(form.instance?.value), "2");
  });

  it("keeps a dotted variable whole", () => {
    const form = parsed("I1.A.B");
    assert.isUndefined(form.instance);
    assert.strictEqual(form.variable, "A.B");
  });

  it("reads an instance before a dotted variable", () => {
    const form = parsed("I1.2.A.B");
    assert.deepStrictEqual(form.instance, { spelling: "2", value: 2n });
    assert.strictEqual(form.variable, "A.B");
  });

  it("has no instance for zero", () => {
    const form = parsed("I1.0.SCORE");
    assert.isUndefined(form.instance);
    assert.strictEqual(form.variable, "0.SCORE");
  });

  it("parses PART.duration as variable duration", () => {
    const form = parsed("PART.duration");
    assert.strictEqual(form.prefix, "PART");
    assert.strictEqual(form.variable, "duration");
  });

  it("is none without a dot", () => {
    assert.isTrue(Option.isNone(prefixedForm("SCORE")));
  });

  it("reads an instance too large for a number exactly", () => {
    const form = parsed("I1.123456789012345678901234567890.V");
    assert.strictEqual(form.instance?.value, 123_456_789_012_345_678_901_234_567_890n);
  });
});
