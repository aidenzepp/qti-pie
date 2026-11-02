import { relation, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * One builder per DRD source, each constructing the text field under grizzle's default flags. Each
 * call stays apart so the type-level regex check sees one literal source at a time.
 */
const fields = [
  ["drdExt", () => str.regex(patterns.drdExt)],
  ["drdAccessMode", () => str.regex(patterns.drdAccessMode)],
  ["drdAccessModeAdapted", () => str.regex(patterns.drdAccessModeAdapted)],
  ["drdAdaptationDetail", () => str.regex(patterns.drdAdaptationDetail)],
  ["drdAdaptationMediaType", () => str.regex(patterns.drdAdaptationMediaType)],
  ["drdAdaptationType", () => str.regex(patterns.drdAdaptationType)],
  ["drdApiInteroperable", () => str.regex(patterns.drdApiInteroperable)],
  ["drdControlFlexibility", () => str.regex(patterns.drdControlFlexibility)],
  ["drdDisplayTransformability", () => str.regex(patterns.drdDisplayTransformability)],
  [
    "drdEducationalComplexityOfAdaptation",
    () => str.regex(patterns.drdEducationalComplexityOfAdaptation),
  ],
  ["drdHazard", () => str.regex(patterns.drdHazard)],
] as const;

/**
 * Whether the pattern admits the value, read through a regular expression of grizzle's default
 * flag.
 */
const admits = (source: string, value: string): boolean => new RegExp(source, "u").test(value);

describe("DRD patterns", () => {
  describe("grizzle builds a relation over each source", () => {
    for (const [name, field] of fields) {
      it.effect(name, () =>
        Effect.try(() => relation("P", { id: uuid, v: field() }, ["id"])).pipe(Effect.asVoid),
      );
    }
  });

  it("drdAccessMode admits its values and the extension arm, as read", () => {
    const { drdAccessMode } = patterns;
    for (const value of ["textual", "visual", "ext:x y|z"]) {
      assert.isTrue(admits(drdAccessMode, value), value);
    }
    for (const value of ["tactile ", "ext:", "Textual", ""]) {
      assert.isFalse(admits(drdAccessMode, value), JSON.stringify(value));
    }
  });

  it("drdHazard admits its values and refuses another leaf's", () => {
    assert.isTrue(admits(patterns.drdHazard, "flashing"));
    assert.isFalse(admits(patterns.drdHazard, "fullKeyboardControl"));
  });

  it("drdExt admits the extension string as the XSD writes it", () => {
    assert.isTrue(admits(patterns.drdExt, "ext:a.b_c"));
    assert.isFalse(admits(patterns.drdExt, "ext"));
    assert.isFalse(admits(patterns.drdExt, "ext:é"));
  });
});
