import { assert, describe, it } from "@effect/vitest";
import * as valueContracts from "#qti/schema/value-contracts.ts";
import * as value from "#qti/schema/value.ts";

/**
 * A contract as the tests read it: its name.
 */
interface Named {
  readonly name: string;
}

/**
 * The names of the contracts of one context's arms.
 */
const armNames = (byBase: Readonly<Record<string, Named>>): readonly string[] =>
  Object.values(byBase).map((made) => made.name);

describe("schema/value-contracts", () => {
  it("mints the arms for every context of the value table, one for each of eight base types", () => {
    const minted = valueContracts.valueArmContracts();
    assert.deepStrictEqual(
      Object.keys(minted).toSorted(),
      value.valueContexts.map(({ context }) => context).toSorted(),
    );
    for (const [context, byBase] of Object.entries<Readonly<Record<string, Named>>>(minted)) {
      assert.deepStrictEqual(armNames(byBase).toSorted(), [
        `${context}DirectedPairValue`,
        `${context}DurationValue`,
        `${context}FloatValue`,
        `${context}IdentifierValue`,
        `${context}IntegerValue`,
        `${context}PairValue`,
        `${context}PointValue`,
        `${context}UriValue`,
      ]);
    }
  });

  it("gives each arm the language of its context's lexical form", () => {
    const minted = valueContracts.valueArmContracts();
    for (const { context } of value.valueContexts) {
      const lexical = value.lexicalOf(context);
      const arms = minted[context];
      assert.strictEqual(arms.integer.base.pattern.source, lexical.integer.pattern.source);
      assert.strictEqual(arms.float.base.pattern.source, lexical.float.pattern.source);
      assert.strictEqual(arms.duration.base.pattern.source, lexical.duration.pattern.source);
      assert.strictEqual(arms.pair.base.pattern.source, lexical.pair.pattern.source);
      assert.strictEqual(
        arms.directedPair.base.pattern.source,
        lexical.directedPair.pattern.source,
      );
      assert.strictEqual(arms.point.base.pattern.source, lexical.point.pattern.source);
      assert.strictEqual(arms.uri.base.pattern.source, lexical.uri.pattern.source);
      assert.strictEqual(arms.identifier.base.pattern.source, lexical.identifier.pattern.source);
    }
  });
});
