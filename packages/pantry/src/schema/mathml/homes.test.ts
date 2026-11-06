import { assert, describe, it } from "@effect/vitest";

import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { MathmlMaction, arms } from "#pantry/schema/mathml/arms.ts";
import { familyRelation } from "#pantry/schema/mathml/attributes.ts";
import type { MathmlHomeSource } from "#pantry/schema/mathml/homes.ts";
import { mathmlHomes } from "#pantry/schema/mathml/homes.ts";

const homeOf = (kind: string, name: string): MathmlHomeSource => {
  const found = mathmlHomes[kind]?.filter((entry) => entry.name === name) ?? [];
  assert.strictEqual(found.length, 1, `${kind} ${name}`);

  return found[0]?.home ?? { id: true };
};

const familyName = (kind: string, name: string): string => {
  const home = homeOf(kind, name);
  assert.isTrue("family" in home, `${kind} ${name} is a family row`);

  return "family" in home ? home.family.name : "";
};

describe("the MathML attribute homes", () => {
  it("covers every kind of the inventory, in the inventory's attribute order", () => {
    assert.deepStrictEqual(Object.keys(mathmlHomes), Object.keys(mathmlInventory));
    for (const [kind, leaf] of Object.entries(mathmlInventory)) {
      assert.deepStrictEqual(
        mathmlHomes[kind]?.map((entry) => entry.name),
        leaf.attributes.map((attribute) => attribute.name),
        kind,
      );
    }
  });

  it("gives every leaf pair exactly one home", () => {
    let pairs = 0;
    for (const [kind, leaf] of Object.entries(mathmlInventory)) {
      for (const attribute of leaf.attributes) {
        pairs += 1;
        homeOf(kind, attribute.name);
      }
    }
    assert.isAbove(pairs, 1484);
  });

  it("names a family relation of the 67 for every pair but id, xref and actiontype", () => {
    const relations = new Set([...familyRelation.values()].map((relation) => relation.name));
    for (const [kind, entries] of Object.entries(mathmlHomes)) {
      for (const { home, name } of entries) {
        if ("family" in home) {
          assert.isTrue(relations.has(home.family.name), `${kind} ${name}`);
        } else {
          assert.isTrue(["actiontype", "id", "xref"].includes(name), `${kind} ${name}`);
        }
      }
    }
  });

  it("splits width into three relations by kind", () => {
    const names = [
      familyName("m:mspace", "width"),
      familyName("m:mpadded", "width"),
      familyName("m:mtable", "width"),
    ];
    assert.strictEqual(new Set(names).size, 3);
  });

  it("homes id in HtmlId and xref in the idref tokens on every kind that declares them", () => {
    let ids = 0;
    let xrefs = 0;
    for (const [kind, entries] of Object.entries(mathmlHomes)) {
      for (const { home, name } of entries) {
        if (name === "id") {
          ids += 1;
          assert.deepStrictEqual(home, { id: true }, kind);
        }

        if (name === "xref") {
          xrefs += 1;
          assert.deepStrictEqual(home, { idref: true }, kind);
        }
      }
    }
    assert.isAbove(ids, 0);
    assert.isAbove(xrefs, 0);
  });

  it("homes m:maction's actiontype in its arm", () => {
    const home = homeOf("m:maction", "actiontype");
    assert.isTrue("arm" in home);
    if ("arm" in home) {
      assert.strictEqual(home.arm, MathmlMaction);
      assert.strictEqual(home.arm, arms["m:maction"]);
      assert.strictEqual(home.field, "actiontype");
    }
  });
});
