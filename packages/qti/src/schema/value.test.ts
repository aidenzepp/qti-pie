/* oxlint-disable anti-slop/no-shape-in-symbol-names -- the roster under test is `DeclarationShape`. */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
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
  "DeclaredValue",
  "DeclaredValueBoolean",
  "DeclaredValueDirectedPair",
  "DeclaredValueDuration",
  "DeclaredValueFile",
  "DeclaredValueFloat",
  "DeclaredValueIdentifier",
  "DeclaredValueInteger",
  "DeclaredValuePair",
  "DeclaredValuePoint",
  "DeclaredValueString",
  "DeclaredValueUri",
  "DefaultValueArm",
  "RecordField",
  "RecordValueSet",
  "TypedValueSet",
  "ValueRole",
  "ValueSet",
  "ValueSetInterpretation",
];

/**
 * The lower and upper bound a capacity statement declares, read from its description.
 */
const boundsOf = (rule: (typeof value.rules)[number]) => {
  const desc: unknown = Predicate.hasProperty(rule, "desc") ? rule.desc : undefined;
  const within = Predicate.hasProperty(desc, "within") ? desc.within : undefined;

  return Predicate.hasProperty(within, "low") && Predicate.hasProperty(within, "high")
    ? [within.low, within.high]
    : [];
};

/**
 * The base types a value arm exists for.
 */
const baseTypes = [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
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

  it("exports the correct-response, default-value and value arms", () => {
    assert.deepStrictEqual(Object.keys(value.arms).toSorted(), [
      "qti-correct-response",
      "qti-default-value",
      "qti-value",
    ]);
    assert.strictEqual(value.arms["qti-value"], value.relations.DeclaredValue);
    assert.strictEqual(value.arms["qti-correct-response"], value.relations.CorrectResponseArm);
    assert.strictEqual(value.arms["qti-default-value"], value.relations.DefaultValueArm);
  });

  it("builds the eleven value arms of a prefix, each keyed by id with a typed value", () => {
    const built = value.valueArms("Probe");
    assert.deepStrictEqual(Object.keys(built).toSorted(), [...baseTypes].toSorted());

    const expected = [
      [built.boolean, "ProbeBoolean", patterns.booleanLiteral],
      [built.directedPair, "ProbeDirectedPair", patterns.pair],
      [built.duration, "ProbeDuration", patterns.xsDouble],
      [built.file, "ProbeFile", patterns.xsNormalizedString],
      [built.float, "ProbeFloat", patterns.xsDouble],
      [built.identifier, "ProbeIdentifier", patterns.ncName],
      [built.integer, "ProbeInteger", patterns.xsInteger],
      [built.pair, "ProbePair", patterns.pair],
      [built.point, "ProbePoint", patterns.point],
      [built.string, "ProbeString", patterns.xsNormalizedString],
      [built.uri, "ProbeUri", patterns.anyUri],
    ] as const;
    for (const [arm, name, pattern] of expected) {
      assert.strictEqual(arm.name, name);
      assert.deepStrictEqual(Object.keys(arm.fields).toSorted(), ["id", "value"]);
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
      assert.strictEqual(arm.fields.value.pattern.source, pattern);
    }
  });

  it("gives DeclaredValue its fields, key and containments", () => {
    const {
      DeclaredValue,
      Edge: _unused,
      ValueSet,
    } = {
      ...value.relations,
      Edge: node.relations.Edge,
    };
    assert.deepStrictEqual(Object.keys(DeclaredValue.fields).toSorted(), [
      "baseType",
      "id",
      "position",
      "shape",
      "valueSet",
    ]);
    assert.deepStrictEqual([...DeclaredValue.primaryKey], ["id"]);

    const into = ofKind("contained").filter((rule) => rule.left.source === DeclaredValue);
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [
        [ValueSet, ["valueSet", "shape"], ["id", "shape"]],
        [node.relations.Edge, ["id", "valueSet", "position"], ["child", "parent", "position"]],
      ],
    );
  });

  it("holds a typed value's base type to its value set's", () => {
    const typed = ofKind("contained")
      .filter((rule) => selectionOf(rule.left)?.relation === value.relations.DeclaredValue)
      .map((rule) => [
        selectionOf(rule.left)?.bindings,
        [...rule.left.fields],
        rule.right.source,
        [...rule.right.fields],
      ]);
    assert.deepStrictEqual(typed, [
      [
        { shape: "typed" },
        ["valueSet", "baseType"],
        value.relations.TypedValueSet,
        ["id", "baseType"],
      ],
    ]);
  });

  it("declares DeclaredValue alternatives on base type and on shape", () => {
    const rules = ofKind("alternatives").filter(
      (candidate) => candidate.parent === value.relations.DeclaredValue,
    );
    assert.deepStrictEqual(
      rules.map((rule) => [rule.discriminator, rule.roster]),
      [
        ["baseType", declaration.relations.BaseType],
        ["shape", declaration.relations.DeclarationShape],
      ],
    );
    assert.deepStrictEqual(Object.keys(rules[0]?.arms ?? {}).toSorted(), [...baseTypes].toSorted());
    assert.deepStrictEqual(rules[1]?.arms, { record: value.relations.RecordField });
    assert.deepStrictEqual(Object.keys(value.relations.RecordField.fields).toSorted(), [
      "fieldIdentifier",
      "id",
    ]);
    assert.deepStrictEqual([...value.relations.RecordField.primaryKey], ["id"]);
  });

  it("bounds a single value set to one value and every value set to at least one", () => {
    const capacities = ofKind("capacity").map((rule) => [
      selectionOf(rule.target)?.relation ?? rule.target.source,
      selectionOf(rule.target)?.bindings,
      [...rule.target.fields],
      rule.from.source,
      [...rule.from.fields],
      boundsOf(rule),
    ]);
    assert.deepStrictEqual(capacities, [
      [
        value.relations.TypedValueSet,
        { cardinality: "single" },
        ["id"],
        value.relations.DeclaredValue,
        ["valueSet"],
        [1n, 1n],
      ],
      [
        value.relations.ValueSet,
        undefined,
        ["id"],
        value.relations.DeclaredValue,
        ["valueSet"],
        [1n, "*"],
      ],
    ]);
  });

  it("refuses an identifier with a space or padding by the identifier arm's pattern", () => {
    const pattern = new RegExp(
      value.valueArms("Probe").identifier.fields.value.pattern.source,
      "u",
    );
    assert.isTrue(pattern.test("ChoiceA"));
    assert.isFalse(pattern.test("Choice A"));
    assert.isFalse(pattern.test(" ChoiceA "));
  });
});
