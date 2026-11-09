/**
 * What a `max-choices` of 0 means on the two order interactions, pinned as reading 18 settles it.
 *
 * Decision 321 (6d) asked whether reading 18's exemption for `max-choices="0"` may be reversed
 * without refusing a document whose 0 means unlimited. No text gives 0 that meaning on either
 * interaction and no corpus document writes it, so the reversal stands: the composed `ChoiceBound`
 * rows read 0 as a count (`counted`), below every `min-choices` of at least 1, and the pair binds
 * only where `min-choices` is written (spec reading 18). The choice-style interactions keep
 * `unbounded` (readings 53 and 76), which this test holds apart.
 */
import { assert, describe, it } from "@effect/vitest";
import { grammar } from "#pantry/grammar/install.ts";

/**
 * The two order interactions, each with the attributes its bound pairs.
 */
const orderKinds = ["qti-order-interaction", "qti-graphic-order-interaction"] as const;

/**
 * The composed `ChoiceBound` rows of one kind.
 *
 * @param kind - The kind.
 * @returns The kind's rows: each its `min`, `max` and `zero`.
 */
const boundsOf = (kind: string) =>
  grammar.references.choiceBound.rows
    .filter((row) => row.kind === kind)
    .map(({ max, min, zero }) => ({ max, min, zero }));

describe("a max-choices of 0 on the order interactions (spec reading 18)", () => {
  for (const kind of orderKinds) {
    it(`${kind} counts 0 as a count`, () => {
      assert.deepStrictEqual(boundsOf(kind), [
        { max: "max-choices", min: "min-choices", zero: "counted" },
      ]);
    });
  }

  it("the choice interaction still reads 0 as no limit (readings 53 and 76)", () => {
    assert.deepStrictEqual(boundsOf("qti-choice-interaction"), [
      { max: "max-choices", min: "min-choices", zero: "unbounded" },
    ]);
  });
});
