import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as document from "#qti/schema/document.ts";
import {
  arms,
  LomId,
  LomValue,
  lomRemainderArms,
  lomRemainderRelations,
  lomRemainderRules,
  r30Asserts,
  r30Capacities,
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

/**
 * The 80 distinct (parent, child) pairs the spec's 3.5 second command prints for the 92 asserts
 * other than 36 and 57, each as `<parent> <child>`: a transcription of a closed source (the loose
 * binding's Schematron), which no phase appends to.
 */
const expectedPairs = [
  "lom:aggregationLevel lom:source",
  "lom:aggregationLevel lom:value",
  "lom:annotation lom:date",
  "lom:annotation lom:description",
  "lom:annotation lom:entity",
  "lom:classification lom:description",
  "lom:classification lom:purpose",
  "lom:context lom:source",
  "lom:context lom:value",
  "lom:contribute lom:date",
  "lom:contribute lom:role",
  "lom:copyrightAndOtherRestrictions lom:source",
  "lom:copyrightAndOtherRestrictions lom:value",
  "lom:cost lom:source",
  "lom:cost lom:value",
  "lom:date lom:dateTime",
  "lom:date lom:description",
  "lom:difficulty lom:source",
  "lom:difficulty lom:value",
  "lom:duration lom:description",
  "lom:duration lom:duration.string",
  "lom:educational lom:description",
  "lom:educational lom:difficulty",
  "lom:educational lom:interactivityLevel",
  "lom:educational lom:interactivityType",
  "lom:educational lom:semanticDensity",
  "lom:educational lom:typicalLearningTime",
  "lom:general lom:aggregationLevel",
  "lom:general lom:structure",
  "lom:identifier lom:catalog",
  "lom:identifier lom:entry",
  "lom:intendedEndUserRole lom:source",
  "lom:intendedEndUserRole lom:value",
  "lom:interactivityLevel lom:source",
  "lom:interactivityLevel lom:value",
  "lom:interactivityType lom:source",
  "lom:interactivityType lom:value",
  "lom:kind lom:source",
  "lom:kind lom:value",
  "lom:learningResourceType lom:source",
  "lom:learningResourceType lom:value",
  "lom:lifeCycle lom:status",
  "lom:lifeCycle lom:version",
  "lom:lom lom:lifeCycle",
  "lom:lom lom:metaMetadata",
  "lom:lom lom:rights",
  "lom:lom lom:technical",
  "lom:metaMetadata lom:language",
  "lom:name lom:source",
  "lom:name lom:value",
  "lom:orComposite lom:maximumVersion",
  "lom:orComposite lom:minimumVersion",
  "lom:orComposite lom:name",
  "lom:orComposite lom:type",
  "lom:purpose lom:source",
  "lom:purpose lom:value",
  "lom:relation lom:kind",
  "lom:relation lom:resource",
  "lom:rights lom:copyrightAndOtherRestrictions",
  "lom:rights lom:cost",
  "lom:rights lom:description",
  "lom:role lom:source",
  "lom:role lom:value",
  "lom:semanticDensity lom:source",
  "lom:semanticDensity lom:value",
  "lom:status lom:source",
  "lom:status lom:value",
  "lom:structure lom:source",
  "lom:structure lom:value",
  "lom:taxon lom:entry.langString",
  "lom:taxon lom:id",
  "lom:taxonPath lom:source.langString",
  "lom:technical lom:duration.string",
  "lom:technical lom:installationRemarks",
  "lom:technical lom:otherPlatformRequirements",
  "lom:technical lom:size",
  "lom:type lom:source",
  "lom:type lom:value",
  "lom:typicalLearningTime lom:description",
  "lom:typicalLearningTime lom:duration.string",
];

type Capacity = (typeof r30Capacities)[number];

/**
 * A capacity statement as far as its source goes.
 */
interface Sourced {
  readonly from: { readonly source: unknown };
}

/**
 * The (parent, child) pair of an assert row.
 */
const pairOf = (row: { readonly parent: string; readonly child: string }) =>
  `${row.parent} ${row.child}`;

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (statement: Capacity): readonly [unknown, unknown] | undefined => {
  const rule: unknown = statement;

  return Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
    ? [rule.desc.within.low, rule.desc.within.high]
    : undefined;
};

/**
 * The child kind a capacity statement selects `Edge` on, when its source is a selection of `Edge`
 * on `childKind` alone.
 */
const childKindOf = (statement: Sourced): string | undefined => {
  const source: unknown = statement.from.source;

  return Predicate.hasProperty(source, "relation") &&
    source.relation === node.Edge &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.hasProperty(source.bindings, "childKind") &&
    Object.keys(source.bindings).length === 1 &&
    Predicate.isString(source.bindings.childKind)
    ? source.bindings.childKind
    : undefined;
};

describe("metadata R30 capacities", () => {
  it("transcribes the 92 asserts of 1 to 94 except 36 and 57", () => {
    const expected = Array.from({ length: 94 }, (_, index) => index + 1).filter(
      (n) => n !== 36 && n !== 57,
    );
    assert.strictEqual(r30Asserts.length, 92);
    assert.deepStrictEqual(
      r30Asserts.map((row) => row.n),
      expected,
    );
  });

  it("maps the 92 asserts onto the 80 distinct pairs the spec's command prints", () => {
    const distinct = new Set(r30Asserts.map(pairOf));
    assert.strictEqual(distinct.size, 80);
    assert.deepStrictEqual([...distinct].toSorted(), expectedPairs);
    for (const row of r30Asserts) {
      assert.isTrue(expectedPairs.includes(pairOf(row)), String(row.n));
      assert.include(node.NodeKind.handles, row.parent);
      assert.include(node.NodeKind.handles, row.child);
    }
  });

  it("states one capacity per distinct pair: a selected Edge source, the parent arm, 0..1", () => {
    assert.strictEqual(r30Capacities.length, 80);

    const seen: string[] = [];
    for (const rule of r30Capacities) {
      const child = childKindOf(rule);
      assert.isDefined(child);
      assert.deepStrictEqual([...rule.from.fields], ["parent"]);
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.deepStrictEqual(boundsOf(rule), [0n, 1n]);

      const row = r30Asserts.find((candidate) => candidate.child === child);
      assert.isDefined(row);

      const parent = r30Asserts.find(
        (candidate) => candidate.child === child && arms[candidate.parent] === rule.target.source,
      )?.parent;
      assert.isDefined(parent, child);
      seen.push(`${parent} ${child}`);
    }

    assert.deepStrictEqual(seen.toSorted(), expectedPairs);
  });

  it("composes exactly the 80 statements into the module's rules, and the probe builds", () => {
    for (const rule of r30Capacities) {
      assert.isTrue(rules.includes(rule));
    }

    const composed = rules.filter(
      (rule) => rule.kind === "capacity" && childKindOf(rule) !== undefined,
    );
    assert.strictEqual(composed.length, 80);
    assert.isDefined(probe());
  });
});
