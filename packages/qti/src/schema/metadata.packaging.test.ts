import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as document from "#qti/schema/document.ts";
import {
  arms,
  LomId,
  LomValue,
  lomRemainderArms,
  lomRemainderRelations,
  lomRemainderRules,
  relations,
  rules,
} from "#qti/schema/metadata.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
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
 * The statements of `list` that contain `from`'s fields into the target relation's fields.
 */
const containments = (
  list: typeof rules,
  from: (typeof relations)[keyof typeof relations],
  into: typeof relations.Lom | typeof node.Edge,
  fields: readonly string[],
) =>
  list.flatMap((rule) =>
    rule.kind === "contained" &&
    rule.left.source === from &&
    rule.right.source === into &&
    JSON.stringify(rule.right.fields) === JSON.stringify(fields)
      ? [rule]
      : [],
  );

/**
 * The schema over the four modules as composed.
 */
const probe = () =>
  schema(
    "P4LomRemainderProbe",
    { ...node.relations, ...pkg.relations, ...document.relations, ...relations },
    [...node.rules, ...pkg.rules, ...document.rules, ...rules],
  );

/**
 * The categories' relations, whose parent is the record's `lom:lom` node.
 */
const categories = ["LomAnnotation", "LomClassification", "LomEducational", "LomRelation"] as const;

/**
 * The element names the remainder adds beyond the M0 roster, the spec's 3.3, and the two dotted
 * handles' names.
 */
const names = [
  "annotation",
  "classification",
  "context",
  "difficulty",
  "educational",
  "id",
  "intendedEndUserRole",
  "interactivityLevel",
  "interactivityType",
  "kind",
  "learningResourceType",
  "purpose",
  "relation",
  "resource",
  "semanticDensity",
  "taxon",
  "taxonPath",
  "typicalAgeRange",
  "typicalLearningTime",
  "source.langString",
  "entry.langString",
];

/**
 * The 16 nested containers and the one kind each is admitted under.
 */
const parents = {
  "lom:classification": ["lom:purpose", "lom:taxonPath"],
  "lom:educational": [
    "lom:interactivityType",
    "lom:learningResourceType",
    "lom:interactivityLevel",
    "lom:semanticDensity",
    "lom:intendedEndUserRole",
    "lom:context",
    "lom:typicalAgeRange",
    "lom:difficulty",
    "lom:typicalLearningTime",
  ],
  "lom:relation": ["lom:kind", "lom:resource"],
  "lom:taxon": ["lom:entry.langString"],
  "lom:taxonPath": ["lom:source.langString", "lom:taxon"],
} satisfies Readonly<Record<string, readonly string[]>>;

/**
 * Whether the admission rows hold `(parent, child)` for `version`.
 */
const admits = (parent: string, child: string, version: string) =>
  lom.admission.some(
    (row) => row.parent === parent && row.child === child && row.version === version,
  );

describe("metadata composed remainder", () => {
  it("builds the composed schema without refusal, with LomValue carrying parentKind and the check", () => {
    const built = probe();
    for (const name of Object.keys(lomRemainderRelations)) {
      assert.isTrue(name in built.relations, name);
    }

    assert.isTrue("parentKind" in LomValue.fields);
    assert.isTrue(
      rules.some(
        (rule) =>
          rule.kind === "check" &&
          rule.name === "LomLearningResourceType" &&
          rule.relation === LomValue,
      ),
    );
  });

  it("holds exactly the 21 remainder handles in the arms, each a NodeKind handle", () => {
    for (const handle of handles) {
      assert.isTrue(handle in arms, handle);
      assert.include(node.NodeKind.handles, handle);
    }

    assert.deepStrictEqual(Object.keys(lomRemainderArms).toSorted(), handles);
  });

  it("gives every remainder element name a handle, a registry row and an arm", () => {
    for (const name of names) {
      const handle = `lom:${name}`;
      assert.include(lom.kinds, handle);
      assert.include(node.NodeKind.handles, handle);

      const row = Object.entries(lom.registry).find(([key]) => key === handle)?.[1];
      assert.strictEqual(row?.local, name.split(".")[0], handle);
      assert.isTrue(handle in arms, handle);
    }
  });

  it("spreads the staged relations, rules and arms into the module's exports", () => {
    for (const name of Object.keys(lomRemainderRelations)) {
      assert.isTrue(name in relations, name);
    }

    for (const rule of lomRemainderRules) {
      assert.isTrue(rules.includes(rule));
    }

    for (const arm of Object.values(lomRemainderArms)) {
      assert.isTrue(Object.values<unknown>(arms).includes(arm));
    }
  });

  it("admits the remainder's pairs in both versions", () => {
    const pairs: readonly (readonly [string, string])[] = [
      ["lom:classification", "lom:taxonPath"],
      ["lom:taxonPath", "lom:source.langString"],
      ["lom:taxon", "lom:entry.langString"],
      ["lom:educational", "lom:learningResourceType"],
      ["lom:learningResourceType", "lom:value"],
      ["lom:relation", "lom:resource"],
      ["lom:resource", "lom:identifier"],
      ["lom:annotation", "lom:date"],
      ["lom:id", "entityRef"],
    ];
    for (const version of ["3.0.0", "3.0.1"]) {
      for (const [parent, child] of pairs) {
        assert.isTrue(admits(parent, child, version), `${parent} ${child} ${version}`);
      }

      assert.isFalse(admits("lom:taxonPath", "lom:source", version));
      assert.isFalse(admits("lom:taxon", "lom:entry", version));
      assert.isFalse(admits("lom:id", "lom:string", version));
    }
  });

  it("admits each of the 16 nested remainder kinds under exactly one parent kind, in both versions", () => {
    const nested = Object.values(parents).flat();
    assert.strictEqual(nested.length, 16);
    for (const version of ["3.0.0", "3.0.1"]) {
      for (const [parent, children] of Object.entries(parents)) {
        for (const child of children) {
          const under = new Set(
            lom.admission
              .filter((row) => row.child === child && row.version === version)
              .map((row) => row.parent),
          );
          assert.deepStrictEqual([...under], [parent], `${child} ${version}`);
        }
      }
    }
  });

  it("binds each category to its record's lom:lom node by an Edge containment on (id, lom)", () => {
    for (const name of categories) {
      const intoEdge = containments(rules, relations[name], node.Edge, ["child", "parent"]);
      assert.strictEqual(intoEdge.length, 1, `${name} into Edge`);
      assert.deepStrictEqual(intoEdge[0]?.left.fields, ["id", "lom"], `${name} left fields`);
    }
  });

  it("binds LomValue's parentKind to its Edge row's", () => {
    const bound = containments(rules, LomValue, node.Edge, ["child", "parentKind"]);
    assert.strictEqual(bound.length, 1);
    assert.deepStrictEqual(bound[0]?.left.fields, ["id", "parentKind"]);
  });

  it("types LomId's value by the wildcard pattern", () => {
    assert.strictEqual(LomId.fields.value.pattern.source, patterns.wildcard);
  });
});
