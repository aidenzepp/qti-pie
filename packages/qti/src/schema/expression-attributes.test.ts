import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as expressionAttributes from "#qti/schema/expression-attributes.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as processing from "#qti/schema/processing.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The 14 attributed kinds this module arms, each with the relation that is its arm.
 */
const armNames = {
  "qti-any-n": "AnyN",
  "qti-custom-operator": "CustomOperator",
  "qti-field-value": "FieldValue",
  "qti-inside": "Inside",
  "qti-math-constant": "MathConstant",
  "qti-math-operator": "MathOperator",
  "qti-pattern-match": "PatternMatch",
  "qti-random-float": "RandomFloat",
  "qti-random-integer": "RandomInteger",
  "qti-stats-operator": "StatsOperator",
  "qti-string-match": "StringMatch",
  "qti-substring": "Substring",
  "qti-test-variables": "TestVariables",
  "qti-variable": "Variable",
} as const;

/**
 * The optional relations, each with the field set it carries and the arm its `node` is contained
 * in.
 */
const optional = {
  CustomOperatorClass: ["CustomOperator", ["node", "value"]],
  CustomOperatorDefinition: ["CustomOperator", ["node", "value"]],
  DeclaredSubstring: ["StringMatch", ["node"]],
  ExpressionWeightIdentifier: ["Expression", ["node", "value"]],
  RandomFloatMin: ["RandomFloat", ["node", "value"]],
  RandomIntegerMin: ["RandomInteger", ["node", "value"]],
  RandomIntegerStep: ["RandomInteger", ["node", "value"]],
  TestVariablesBaseType: ["TestVariables", ["node", "value"]],
  VariableWeightIdentifier: ["Variable", ["node", "rootKind", "value"]],
} as const;

const relationsByName = new Map(Object.entries(expressionAttributes.relations));

const armsByKind = new Map(Object.entries(expressionAttributes.arms));

/**
 * The containments whose left side names the relation whole, as the right relation's name then
 * both field lists.
 */
const containedFrom = (owner: { readonly name: string } | undefined) =>
  expressionAttributes.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === owner && "name" in rule.right.source
      ? [[rule.right.source.name, [...rule.left.fields], [...rule.right.fields]]]
      : [],
  );

/**
 * The column names of the relation of this module called `name`.
 */
const fields = (name: string) => Object.keys(relationsByName.get(name)?.fields ?? {});

const probe = () =>
  schema(
    "QtiExpressionAttributesProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...item.relations,
      ...processing.relations,
      ...expressionAttributes.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...item.rules,
      ...processing.rules,
      ...expressionAttributes.rules,
    ],
  );

describe("expression-attributes", () => {
  it("keys the arms by the 14 attributed kinds", () => {
    assert.deepStrictEqual(
      Object.keys(expressionAttributes.arms).toSorted(),
      Object.keys(armNames).toSorted(),
    );
  });

  it("gives each kind its own arm relation, keyed by id", () => {
    for (const [kind, name] of Object.entries(armNames)) {
      const relation = relationsByName.get(name);
      assert.isDefined(relation, name);
      assert.isTrue(armsByKind.get(kind) === relation, kind);
      assert.include(Object.keys(relation?.fields ?? {}), "id", name);
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["id"], name);
    }
  });

  it("adds exactly the 14 arms and the nine optional relations", () => {
    assert.deepStrictEqual(
      Object.keys(expressionAttributes.relations).toSorted(),
      [...Object.values(armNames), ...Object.keys(optional)].toSorted(),
    );
  });

  it("gives each arm the columns table A names", () => {
    assert.deepStrictEqual(fields("Variable"), ["id"]);
    assert.deepStrictEqual(fields("MathConstant"), ["id", "name"]);
    assert.deepStrictEqual(fields("MathOperator"), ["id", "name"]);
    assert.deepStrictEqual(fields("StatsOperator"), ["id", "name"]);
    assert.deepStrictEqual(fields("AnyN"), ["id", "max", "min"]);
    assert.deepStrictEqual(fields("RandomInteger"), ["id", "max"]);
    assert.deepStrictEqual(fields("RandomFloat"), ["id", "max"]);
    assert.deepStrictEqual(fields("FieldValue"), ["fieldIdentifier", "id"]);
    assert.deepStrictEqual(fields("Inside"), ["coords", "id", "shape"]);
    assert.deepStrictEqual(fields("PatternMatch"), ["id", "pattern"]);
    assert.deepStrictEqual(fields("Substring"), ["caseSensitive", "id"]);
    assert.deepStrictEqual(fields("StringMatch"), ["caseSensitive", "id", "substring"]);
    assert.deepStrictEqual(fields("CustomOperator"), ["id"]);
    assert.deepStrictEqual(fields("TestVariables"), ["id", "variableIdentifier"]);
  });

  it("keys each optional relation by node with its own field set", () => {
    for (const [name, [, columns]] of Object.entries(optional)) {
      const relation = relationsByName.get(name);
      assert.isDefined(relation, name);
      assert.deepStrictEqual(Object.keys(relation?.fields ?? {}).toSorted(), [...columns], name);
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["node"], name);
    }
  });

  it("contains each optional relation's node in its owner's id", () => {
    for (const [name, [owner]] of Object.entries(optional)) {
      const into = containedFrom(relationsByName.get(name)).filter(([target]) => target === owner);
      assert.deepStrictEqual(into, [[owner, ["node"], ["id"]]], name);
    }
  });

  it("contains each arm in Expression by id", () => {
    for (const name of Object.values(armNames)) {
      const into = containedFrom(relationsByName.get(name)).filter(
        ([target]) => target === "Expression",
      );
      assert.deepStrictEqual(into, [["Expression", ["id"], ["id"]]], name);
    }
  });

  it("contains Variable in VariableRef by id, the only referring kind", () => {
    const refs = Object.values(armNames).flatMap((name) =>
      containedFrom(relationsByName.get(name)).filter(([target]) => target === "VariableRef"),
    );
    assert.deepStrictEqual(refs, [["VariableRef", ["id"], ["id"]]]);
    assert.deepStrictEqual(
      containedFrom(relationsByName.get("Variable")).filter(([t]) => t === "VariableRef"),
      refs,
    );
  });

  it("pins VariableWeightIdentifier to the node's root kind, which must be test", () => {
    const weight = relationsByName.get("VariableWeightIdentifier");
    assert.deepStrictEqual(
      containedFrom(weight).filter(([target]) => target === "Node"),
      [["Node", ["node", "rootKind"], ["id", "rootKind"]]],
    );

    const checks = expressionAttributes.rules.filter(
      (rule) => rule.kind === "check" && rule.relation === weight,
    );
    assert.strictEqual(checks.length, 1);
  });

  it("builds a schema over the leaves without refusal", () => {
    const built = probe();
    for (const name of [...Object.values(armNames), ...Object.keys(optional)]) {
      assert.include(Object.keys(built.relations), name);
    }
  });
});
