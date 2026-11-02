import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as document from "#qti/schema/document.ts";
import {
  arms,
  LomId,
  lomRemainderArms,
  lomRemainderRelations,
  lomRemainderRules,
  relations,
  rules,
} from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The handles of the 21 LOM remainder arms, the spec's 4.3 and U01.
 */
const handles = [
  "lom:annotation",
  "lom:classification",
  "lom:context",
  "lom:difficulty",
  "lom:educational",
  "lom:entry.langString",
  "lom:id",
  "lom:intendedEndUserRole",
  "lom:interactivityLevel",
  "lom:interactivityType",
  "lom:kind",
  "lom:learningResourceType",
  "lom:purpose",
  "lom:relation",
  "lom:resource",
  "lom:semanticDensity",
  "lom:source.langString",
  "lom:taxon",
  "lom:taxonPath",
  "lom:typicalAgeRange",
  "lom:typicalLearningTime",
];

/**
 * The schema over the four modules and the staged remainder, which the module's own exports do not
 * yet hold.
 */
const probe = () =>
  schema(
    "P4LomRemainderProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...relations,
      ...lomRemainderRelations,
    },
    [...node.rules, ...pkg.rules, ...document.rules, ...rules, ...lomRemainderRules],
  );

/**
 * The statements of `rules` that contain `from`'s fields into the target relation's fields.
 */
const containments = (
  list: typeof lomRemainderRules,
  from: (typeof lomRemainderRelations)[keyof typeof lomRemainderRelations],
  into: typeof relations.Lom | typeof node.Edge,
  fields: readonly string[],
) =>
  list.filter(
    (rule) =>
      rule.kind === "contained" &&
      rule.left.source === from &&
      rule.right.source === into &&
      JSON.stringify(rule.right.fields) === JSON.stringify(fields),
  );

/**
 * The four categories, whose parent is the record's `lom:lom` node.
 */
const categories = ["LomAnnotation", "LomClassification", "LomEducational", "LomRelation"] as const;

/**
 * The 16 nested containers, whose parent kind the `Edge` admission law binds.
 */
const nested = [
  "LomContext",
  "LomDifficulty",
  "LomEntryLangString",
  "LomIntendedEndUserRole",
  "LomInteractivityLevel",
  "LomInteractivityType",
  "LomKind",
  "LomLearningResourceType",
  "LomPurpose",
  "LomResource",
  "LomSemanticDensity",
  "LomSourceLangString",
  "LomTaxon",
  "LomTaxonPath",
  "LomTypicalAgeRange",
  "LomTypicalLearningTime",
] as const;

/**
 * The remainder relation named `name`.
 */
const relationOf = (name: (typeof categories)[number] | (typeof nested)[number]) =>
  lomRemainderRelations[name];

describe("metadata staged remainder", () => {
  it("builds a schema over the four modules, the remainder relations and their rules without refusal", () => {
    const built = probe();
    for (const name of Object.keys(lomRemainderRelations)) {
      assert.isTrue(name in built.relations, name);
    }
  });

  it("holds exactly the 21 remainder handles in the arms", () => {
    assert.deepStrictEqual(Object.keys(lomRemainderArms).toSorted(), handles);
  });

  it("stages the remainder: the module's own arms and relations do not hold it", () => {
    assert.isFalse("lom:educational" in arms);
    assert.isFalse("LomEducational" in relations);
    for (const arm of Object.values(lomRemainderArms)) {
      assert.isFalse(Object.values<unknown>(arms).includes(arm));
    }
  });

  it("contains every relation of the remainder but LomId into Lom", () => {
    for (const [name, relation] of Object.entries(lomRemainderRelations)) {
      if (name === "LomId") {
        continue;
      }

      const intoLom = containments(lomRemainderRules, relation, relations.Lom, ["id"]);
      assert.strictEqual(intoLom.length, 1, `${name} into Lom`);
    }
  });

  it("binds each category to its record's lom:lom node by an Edge containment on (id, lom)", () => {
    for (const name of categories) {
      const intoEdge = containments(lomRemainderRules, relationOf(name), node.Edge, [
        "child",
        "parent",
      ]);
      assert.strictEqual(intoEdge.length, 1, `${name} into Edge`);
      assert.deepStrictEqual(intoEdge[0]?.left.fields, ["id", "lom"], `${name} left fields`);
    }
  });

  it("leaves each nested container's parent to the Edge admission law", () => {
    for (const name of nested) {
      const intoEdge = lomRemainderRules.filter(
        (rule) =>
          rule.kind === "contained" &&
          rule.left.source === relationOf(name) &&
          rule.right.source === node.Edge,
      );
      assert.strictEqual(intoEdge.length, 0, `${name} into Edge`);
    }
  });

  it("partitions the remainder's relations but LomId into categories and nested", () => {
    const named = [...categories, ...nested];
    assert.strictEqual(new Set(named).size, named.length);
    assert.strictEqual(named.length, 20);
    assert.deepStrictEqual(
      named.toSorted(),
      Object.keys(lomRemainderRelations)
        .filter((name) => name !== "LomId")
        .toSorted(),
    );
  });

  it("types LomId's value by the wildcard pattern", () => {
    assert.strictEqual(LomId.fields.value.pattern.source, patterns.wildcard);
  });
});
