import { assert, describe, it } from "@effect/vitest";

import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { mathmlAttributeType } from "#pantry/schema/seed/mathml-attribute-type.ts";

/**
 * Find a row's type, failing the test unless exactly one row holds the pair.
 *
 * @param kind - The kind handle.
 * @param attribute - The attribute name.
 * @returns The family handle of the pair.
 */
const typeOf = (kind: string, attribute: string): string => {
  const rows = mathmlAttributeType.filter(
    (row) => row.kind === kind && row.attribute === attribute,
  );

  if (rows.length !== 1 || rows[0] === undefined) {
    return assert.fail(`${kind}/@${attribute} has one row, found ${rows.length}`);
  }

  return rows[0].type;
};

describe("the MathmlAttributeType seed rows", () => {
  it("number 1,484, one per pair, with no duplicate (kind, attribute)", () => {
    assert.strictEqual(mathmlAttributeType.length, 1484);
    assert.strictEqual(
      new Set(mathmlAttributeType.map((row) => `${row.kind}/@${row.attribute}`)).size,
      1484,
    );
  });

  it("cover every inventory pair but id, xref and the required actiontype", () => {
    const expected = Object.entries(mathmlInventory).flatMap(([kind, entry]) =>
      entry.attributes
        .filter(
          (attribute) =>
            attribute.name !== "id" && attribute.name !== "xref" && attribute.use !== "required",
        )
        .map((attribute) => `${kind}/@${attribute.name}`),
    );

    assert.sameMembers(
      mathmlAttributeType.map((row) => `${row.kind}/@${row.attribute}`),
      expected,
    );
  });

  it("have no row for id, xref or m:maction/@actiontype", () => {
    assert.isFalse(mathmlAttributeType.some((row) => row.attribute === "id"));
    assert.isFalse(mathmlAttributeType.some((row) => row.attribute === "xref"));
    assert.isFalse(
      mathmlAttributeType.some((row) => row.kind === "m:maction" && row.attribute === "actiontype"),
    );
  });

  it("follow the inventory's kind order, then attribute order", () => {
    const order = Object.keys(mathmlInventory);
    const keys = mathmlAttributeType.map(
      (row) => [order.indexOf(row.kind), row.attribute] as const,
    );

    for (const [index, key] of keys.entries()) {
      const previous = keys[index - 1];

      if (previous === undefined) {
        continue;
      }

      assert.isAtLeast(key[0], previous[0]);

      if (key[0] === previous[0]) {
        assert.isTrue(previous[1] < key[1]);
      }
    }
  });

  it("give width three different types on mspace, mpadded and mtable", () => {
    const types = [
      typeOf("m:mspace", "width"),
      typeOf("m:mpadded", "width"),
      typeOf("m:mtable", "width"),
    ];

    assert.strictEqual(new Set(types).size, 3);
  });
});
