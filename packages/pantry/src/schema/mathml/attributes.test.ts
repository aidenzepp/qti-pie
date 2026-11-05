import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import { MathmlCbytesValue } from "#pantry/schema/contracts.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import {
  MathmlAttributeType,
  MathmlCbytes,
  contentArms,
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

const typeOf = (kind: string, attribute: string): string => {
  const family = families.find((candidate) =>
    candidate.pairs.some(
      ([pairKind, pairAttribute]) => pairKind === kind && pairAttribute === attribute,
    ),
  );
  assert.isDefined(family, `${kind} ${attribute}`);

  return family?.handle ?? "";
};

const countOf = (kind: string) => families.filter((family) => family.class === kind).length;

describe("the MathML type matrix and attribute families", () => {
  it("declares the 67 families of values.ts, each named from its handle", () => {
    assert.strictEqual(families.length, 67);
    assert.strictEqual(rosterFamilies.length, 25);
    assert.strictEqual(countOf("pattern"), 26);
    assert.strictEqual(countOf("contract"), 15);
    assert.strictEqual(countOf("tautology"), 1);
    assert.strictEqual(familyRelation.size, 67);
    assert.deepStrictEqual(
      [...familyRelation.keys()].toSorted(),
      families.map((family) => family.handle).toSorted(),
    );
    for (const family of families) {
      assert.strictEqual(familyRelation.get(family.handle)?.name, family.relation);
    }

    assert.deepStrictEqual(
      Object.values(relations)
        .map((relation) => relation.name)
        .toSorted(),
      ["MathmlAttributeType", ...families.map((family) => family.relation)].toSorted(),
    );
    assert.deepStrictEqual(
      Object.keys(relations),
      Object.values(relations).map((relation) => relation.name),
    );
    assert.strictEqual(Object.keys(relations).length, 68);
    assert.strictEqual(relations.MathmlAttributeType, MathmlAttributeType);
  });

  it("maps a pair's family to its relation", () => {
    assert.strictEqual(familyRelation.get(typeOf("m:math", "display"))?.name, "MathmlDisplay");
    assert.strictEqual(familyRelation.get(typeOf("m:mo", "class"))?.name, "MathmlClass");
  });

  it("shapes the matrix, each family and the m:cbytes arm as the spec states", () => {
    assert.deepStrictEqual(Object.keys(MathmlAttributeType.fields).toSorted(), [
      "attribute",
      "kind",
      "type",
    ]);
    for (const family of families) {
      const relation = familyRelation.get(family.handle);
      assert.isDefined(relation);
      assert.deepStrictEqual(Object.keys(relation?.fields ?? {}).toSorted(), [
        "attribute",
        "kind",
        "node",
        "value",
      ]);
    }

    assert.deepStrictEqual(Object.keys(MathmlCbytes.fields).toSorted(), ["id", "value"]);
    assert.strictEqual(MathmlCbytes.name, "MathmlCbytes");
    assert.strictEqual(MathmlCbytes.fields.value, MathmlCbytesValue);
    assert.deepStrictEqual(Object.keys(contentArms), ["m:cbytes"]);
    assert.strictEqual(contentArms["m:cbytes"], MathmlCbytes);
    assert.isFalse(Object.keys(relations).includes("MathmlCbytes"));
  });

  it("types each family column with its roster, pattern or contract", () => {
    const declared = new Set(Object.keys(rosters));
    for (const family of rosterFamilies) {
      assert.isTrue(declared.has(family.valueType), family.valueType);
    }
    for (const family of families.filter((candidate) => candidate.class === "pattern")) {
      assert.isTrue(family.valueType in patterns, family.valueType);
    }
    for (const family of families.filter((candidate) => candidate.class === "contract")) {
      assert.isTrue(family.valueType in contracts, family.valueType);
    }
  });

  it("holds the matrix's containment and two statements per family", () => {
    assert.strictEqual(rules.length, 1 + 2 * 67);

    const [matrix] = rules;
    assert.strictEqual(matrix.left.source.name, "MathmlAttributeType");
    assert.deepStrictEqual(matrix.left.fields, ["kind", "attribute"]);
    assert.strictEqual(targetName(matrix.right), "AttributeAdmission");
    assert.deepStrictEqual(matrix.right.fields, ["kind", "attribute"]);

    for (const family of families) {
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

  it.effect("builds as a probe schema with all 67 families and MathmlCbytes", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("MathmlAttributesProbe", { AttributeAdmission, MathmlCbytes, Node, ...relations }, [
          ...rules,
        ]),
      );
      assert.isDefined(built);
    }),
  );
});
