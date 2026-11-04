import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as rules from "#pantry/schema/test/rules.ts";

const { relations } = rules;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3,
 * 4.8 and 4.9.
 */
const declarations = [
  ["PreCondition", ["id"], ["id"]],
  ["BranchRule", ["document", "id", "owner", "ownerKind", "targetKind"], ["id"]],
  ["BranchRuleExit", ["exit", "rule"], ["rule"]],
  ["BranchRuleTarget", ["holderKind", "identifier", "ownerKind", "rule", "scope"], ["rule"]],
  ["VariableMapping", ["id", "itemDocument", "itemRef", "source", "target"], ["id"]],
  ["Weight", ["id", "identifier", "itemRef", "value"], ["id"]],
  ["TemplateDefault", ["id", "itemDocument", "itemRef", "templateIdentifier"], ["id"]],
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test rule relations", () => {
  it("declares 7 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 7);
    assert.deepStrictEqual(
      Object.keys(relations).toSorted(),
      declarations.map(([name]) => name).toSorted(),
    );
    for (const [name, columns, primaryKey] of declarations) {
      const relation = relations[name];
      assert.strictEqual(relation.name, name);
      assert.deepStrictEqual(fieldsOf(relation), columns, name);
      assert.deepStrictEqual([...relation.primaryKey], primaryKey, name);
    }
  });

  it("keeps the five arms keyed by their kinds", () => {
    assert.deepStrictEqual(Object.keys(rules.arms).toSorted(), [
      "qti-branch-rule",
      "qti-pre-condition",
      "qti-template-default",
      "qti-variable-mapping",
      "qti-weight",
    ]);
    assert.deepStrictEqual(fieldsOf(rules.PreCondition), ["id"]);
  });

  it("types the identifiers, the mapped name and the weight by contract", () => {
    const typed = [
      [relations.BranchRuleTarget.fields.identifier, contracts.TestStructureIdentifier],
      [relations.VariableMapping.fields.target, contracts.MappedVariableName],
      [relations.Weight.fields.identifier, contracts.WeightReference],
      [relations.Weight.fields.value, contracts.WeightValue],
    ] as const;
    for (const [field, contract] of typed) {
      assert.strictEqual(field.name, contract.name);
    }
  });

  it("holds the bare identifiers to the plain name, with no contract of their own", () => {
    const bare: readonly object[] = [
      relations.VariableMapping.fields.source,
      relations.TemplateDefault.fields.templateIdentifier,
    ];
    for (const field of bare) {
      assert.isFalse("name" in field);
    }
  });

  it("holds the kind columns to their rosters", () => {
    const wanted: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.BranchRule.fields.ownerKind, rosters.StructureHolder],
      [relations.BranchRule.fields.targetKind, rosters.BranchTarget],
      [relations.BranchRuleExit.fields.exit, rosters.BranchExit],
      [relations.BranchRuleTarget.fields.holderKind, rosters.StructureHolder],
      [relations.BranchRuleTarget.fields.ownerKind, rosters.StructureHolder],
    ];
    for (const [field, roster] of wanted) {
      assert.strictEqual(field.roster, roster);
    }
  });

  it("declares the one key a later containment targets, a mapping's target within its item ref", () => {
    assert.deepStrictEqual(
      rules.rules.map((rule) => [rule.kind, rule.relation.name, [...rule.fields]]),
      [["key", "VariableMapping", ["itemRef", "target"]]],
    );
  });

  it("gives Author a line for the two new relations beside the five arms", () => {
    for (const name of ["BranchRuleExit", "BranchRuleTarget"] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    for (const name of [
      "BranchRule",
      "PreCondition",
      "TemplateDefault",
      "VariableMapping",
      "Weight",
    ] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
  });

  it("fills the registry attributes of the five kinds from the inventory, in its order", () => {
    const registry = new Map(
      Object.entries(test.registry).map(([handle, row]) => [handle, row.attributes]),
    );
    const wanted = {
      "qti-branch-rule": ["target"],
      "qti-pre-condition": [],
      "qti-template-default": ["template-identifier"],
      "qti-variable-mapping": ["source-identifier", "target-identifier"],
      "qti-weight": ["identifier", "value"],
    } as const;
    for (const [handle, attributes] of Object.entries(wanted)) {
      assert.deepStrictEqual([...(registry.get(handle) ?? [])], [...attributes], handle);
    }
  });

  it("declares the three new names the kinds carry beside the seventeen landed", () => {
    for (const name of ["source-identifier", "target", "target-identifier"]) {
      assert.include(test.attributes, name);
    }
    assert.strictEqual(test.attributes.length, 21);
    assert.deepStrictEqual([...test.attributes], [...test.attributes].toSorted());
  });
});
