import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";

import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { attributes, isMathmlKind, kinds, registry } from "#pantry/schema/kinds/mathml.ts";
import { attributeTuples } from "#pantry/schema/node.ts";

const entries = Object.values(mathmlInventory);

describe("the MathML kinds file", () => {
  it("lists the leaf's handles in order", () => {
    assert.deepStrictEqual([...kinds], Object.keys(mathmlInventory));
    assert.strictEqual(kinds.length, 194);
  });

  it("gives each kind a registry row whose attributes are its leaf entry's", () => {
    assert.deepStrictEqual(Object.keys(registry).toSorted(), [...kinds].toSorted());

    for (const kind of kinds) {
      const entry = mathmlInventory[kind];
      const row = registry[kind];

      assert.isDefined(entry);
      assert.strictEqual(row.namespace, "http://www.w3.org/1998/Math/MathML");
      assert.strictEqual(row.local, entry?.element);
      assert.deepStrictEqual(
        row.attributes,
        entry?.attributes.map((a) => a.name),
      );
    }
  });

  it("declares exactly the leaf names no earlier vocabulary has, once each", () => {
    const have = new Set<string>(attributeTuples.flat());
    const wanted = [
      ...new Set(entries.flatMap((entry) => entry.attributes.map((attribute) => attribute.name))),
    ].filter((name) => !have.has(name));

    assert.deepStrictEqual([...attributes], wanted);
    assert.strictEqual(new Set(attributes).size, attributes.length);
    assert.include(attributes, "xref");
  });

  it("parents m:semantics.ci under m:bvar and no other kind", () => {
    assert.deepStrictEqual(registry["m:semantics.ci"].parent, Option.some("m:bvar"));
    assert.strictEqual(registry["m:semantics.ci"].local, "semantics");
    assert.strictEqual(registry["m:semantics"].local, "semantics");

    for (const kind of kinds) {
      if (kind !== "m:semantics.ci") {
        assert.isTrue(Option.isNone(registry[kind].parent));
      }
    }
  });

  it("recognises MathML handles only", () => {
    assert.isTrue(isMathmlKind("m:mi"));
    assert.isFalse(isMathmlKind("p"));
  });
});
