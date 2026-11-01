/* oxlint-disable anti-slop/no-shape-in-symbol-names -- the roster under test is `DeclarationShape`. */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The schema over node's, package's, document's, declaration's and this module's relations and
 * rules.
 */
const probe = () =>
  schema(
    "QtiValueProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
    },
    [...node.rules, ...pkg.rules, ...document.rules, ...declaration.rules, ...value.rules],
  );

/**
 * The relations and rosters this module declares.
 */
const added = [
  "CorrectResponseArm",
  "DefaultValueArm",
  "RecordValueSet",
  "TypedValueSet",
  "ValueRole",
  "ValueSet",
  "ValueSetInterpretation",
];

/**
 * The statements `value.rules` declares of one kind.
 */
const ofKind = <K extends (typeof value.rules)[number]["kind"]>(kind: K) =>
  value.rules.filter(
    (rule): rule is Extract<(typeof value.rules)[number], { readonly kind: K }> =>
      rule.kind === kind,
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

describe("value", () => {
  it("builds a schema over node, package, document, declaration and value without refusal", () => {
    const built = probe();
    for (const name of added) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("adds exactly the value-set relations and rosters", () => {
    assert.deepStrictEqual(Object.keys(value.relations).toSorted(), added);
  });

  it("fixes the ValueRole roster", () => {
    assert.deepStrictEqual(value.relations.ValueRole.handles, ["default", "correct"]);
  });

  it("gives ValueSet its fields, its key and the (declaration, role) candidate key", () => {
    const { ValueSet } = value.relations;
    assert.deepStrictEqual(Object.keys(ValueSet.fields).toSorted(), [
      "declaration",
      "id",
      "role",
      "shape",
    ]);
    assert.deepStrictEqual([...ValueSet.primaryKey], ["id"]);
    assert.deepStrictEqual(
      ofKind("key")
        .filter((rule) => rule.relation === ValueSet)
        .map((rule) => [...rule.fields]),
      [["declaration", "role"]],
    );
  });

  it("contains each ValueSet in Edge and in Declaration", () => {
    const into = ofKind("contained").filter(
      (rule) => rule.left.source === value.relations.ValueSet,
    );
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [
        [node.relations.Edge, ["id", "declaration"], ["child", "parent"]],
        [declaration.relations.Declaration, ["declaration", "shape"], ["id", "shape"]],
      ],
    );
  });

  it("types ValueSetInterpretation as xsNormalizedString, keyed by valueSet, in ValueSet", () => {
    const rel = value.relations.ValueSetInterpretation;
    assert.deepStrictEqual(Object.keys(rel.fields).toSorted(), ["value", "valueSet"]);
    assert.deepStrictEqual([...rel.primaryKey], ["valueSet"]);
    assert.include(JSON.stringify(rel.fields.value), patterns.xsNormalizedString);

    const into = ofKind("contained").filter((rule) => rule.left.source === rel);
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [[value.relations.ValueSet, ["valueSet"], ["id"]]],
    );
  });

  it("declares the ValueSet alternatives with a typed and a record arm", () => {
    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === value.relations.ValueSet,
    );
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.strictEqual(rule?.discriminator, "shape");
    assert.strictEqual(rule?.roster, declaration.relations.DeclarationShape);

    const arms = Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
    assert.deepStrictEqual(arms, [
      ["record", value.relations.RecordValueSet],
      ["typed", value.relations.TypedValueSet],
    ]);
  });

  it("gives TypedValueSet its fields and copies of the declaration's type", () => {
    const { RecordValueSet, TypedValueSet, ValueSet } = value.relations;
    assert.deepStrictEqual(Object.keys(TypedValueSet.fields).toSorted(), [
      "baseType",
      "cardinality",
      "declaration",
      "id",
    ]);
    assert.deepStrictEqual([...TypedValueSet.primaryKey], ["id"]);
    assert.deepStrictEqual(Object.keys(RecordValueSet.fields), ["id"]);
    assert.deepStrictEqual([...RecordValueSet.primaryKey], ["id"]);

    const copies = ofKind("contained").filter((rule) => rule.left.source === TypedValueSet);
    assert.deepStrictEqual(
      copies.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [
        [ValueSet, ["id", "declaration"], ["id", "declaration"]],
        [
          declaration.relations.TypedDeclaration,
          ["declaration", "baseType", "cardinality"],
          ["id", "baseType", "cardinality"],
        ],
      ],
    );
  });

  it("mirrors each thin role arm with the value sets of its role on id", () => {
    const rules = ofKind("mirrors");
    assert.deepStrictEqual(
      rules.map((rule) => {
        const selection = selectionOf(rule.right);

        return [rule.left.source, selection?.relation, selection?.bindings];
      }),
      [
        [value.relations.CorrectResponseArm, value.relations.ValueSet, { role: "correct" }],
        [value.relations.DefaultValueArm, value.relations.ValueSet, { role: "default" }],
      ],
    );
    for (const rule of rules) {
      assert.deepStrictEqual([...rule.left.fields], ["id"]);
      assert.deepStrictEqual([...rule.right.fields], ["id"]);
    }
  });

  it("exports the correct-response and default-value arms", () => {
    assert.deepStrictEqual(Object.keys(value.arms).toSorted(), [
      "qti-correct-response",
      "qti-default-value",
    ]);
    assert.strictEqual(value.arms["qti-correct-response"], value.relations.CorrectResponseArm);
    assert.strictEqual(value.arms["qti-default-value"], value.relations.DefaultValueArm);
  });
});
