import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import {
  MathmlAttributeType,
  familyRelation,
  relations,
  rules,
} from "#pantry/schema/mathml/attributes.ts";
import { families } from "#pantry/schema/mathml/values.ts";
import { Node } from "#pantry/schema/node.ts";

type Target = (typeof rules)[number]["right"];

/**
 * The relation a containment's target names, looking through a selection to the relation it
 * selects from.
 */
const targetName = (target: Target | undefined): string | undefined => {
  if (target === undefined) {
    return undefined;
  }

  return "relation" in target.source ? target.source.relation.name : target.source.name;
};

/**
 * The bindings of a containment's target when it is selected, else `undefined`.
 */
const targetSelector = (target: Target | undefined): object | undefined =>
  target !== undefined && "bindings" in target.source ? target.source.bindings : undefined;

const rosterFamilies = families.filter((family) => family.class === "roster");

describe("the MathML type matrix and roster families", () => {
  it("declares the 25 roster families of values.ts, each named from its handle", () => {
    assert.strictEqual(rosterFamilies.length, 25);
    assert.strictEqual(familyRelation.size, 25);
    assert.deepStrictEqual(
      [...familyRelation.keys()].toSorted(),
      rosterFamilies.map((family) => family.handle).toSorted(),
    );
    for (const family of rosterFamilies) {
      assert.strictEqual(familyRelation.get(family.handle)?.name, family.relation);
    }

    assert.deepStrictEqual(
      Object.values(relations)
        .map((relation) => relation.name)
        .toSorted(),
      ["MathmlAttributeType", ...rosterFamilies.map((family) => family.relation)].toSorted(),
    );
    assert.deepStrictEqual(
      Object.keys(relations),
      Object.values(relations).map((relation) => relation.name),
    );
    assert.strictEqual(Object.keys(relations).length, 26);
    assert.strictEqual(relations.MathmlAttributeType, MathmlAttributeType);
  });

  it("shapes the matrix and each family as the spec states", () => {
    assert.deepStrictEqual(Object.keys(MathmlAttributeType.fields).toSorted(), [
      "attribute",
      "kind",
      "type",
    ]);
    for (const family of rosterFamilies) {
      const relation = familyRelation.get(family.handle);
      assert.isDefined(relation);
      assert.deepStrictEqual(Object.keys(relation?.fields ?? {}).toSorted(), [
        "attribute",
        "kind",
        "node",
        "value",
      ]);
    }
  });

  it("types each family column with its roster", () => {
    const declared = new Set(Object.keys(rosters));
    for (const family of rosterFamilies) {
      assert.isTrue(declared.has(family.valueType), family.valueType);
    }
  });

  it("holds the matrix's containment and two statements per family", () => {
    assert.strictEqual(rules.length, 1 + 2 * 25);

    const [matrix] = rules;
    assert.strictEqual(matrix.left.source.name, "MathmlAttributeType");
    assert.deepStrictEqual(matrix.left.fields, ["kind", "attribute"]);
    assert.strictEqual(targetName(matrix.right), "AttributeAdmission");
    assert.deepStrictEqual(matrix.right.fields, ["kind", "attribute"]);

    for (const family of rosterFamilies) {
      const own = rules.filter((rule) => rule.left.source.name === family.relation);
      assert.strictEqual(own.length, 2, family.relation);

      const intoNode = own.filter((rule) => targetName(rule.right) === "Node");
      assert.strictEqual(intoNode.length, 1, family.relation);
      assert.deepStrictEqual(intoNode[0]?.left.fields, ["node", "kind"]);
      assert.deepStrictEqual(intoNode[0]?.right.fields, ["id", "kind"]);
      assert.isUndefined(targetSelector(intoNode[0]?.right));

      const intoMatrix = own.filter((rule) => targetName(rule.right) === "MathmlAttributeType");
      assert.strictEqual(intoMatrix.length, 1, family.relation);
      assert.deepStrictEqual(intoMatrix[0]?.left.fields, ["kind", "attribute"]);
      assert.deepStrictEqual(intoMatrix[0]?.right.fields, ["kind", "attribute"]);
      assert.deepStrictEqual(targetSelector(intoMatrix[0]?.right), { type: family.handle });
    }
  });

  it.effect("builds as a probe schema with Node, AttributeAdmission and the rosters", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("MathmlAttributesProbe", { AttributeAdmission, Node, ...relations }, [...rules]),
      );
      assert.isDefined(built);
    }),
  );
});
