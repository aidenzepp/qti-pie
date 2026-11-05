import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as item from "#pantry/schema/item.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as reference from "#pantry/schema/reference.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";
import * as testProcessing from "#pantry/schema/test/processing.ts";
import * as testRules from "#pantry/schema/test/rules.ts";
import * as testStructure from "#pantry/schema/test/structure.ts";
import * as value from "#pantry/schema/value.ts";

/**
 * The probe schema: every module whose relations the statements of `testProcessing` or of
 * `processing` name, with their rules. A subset of the relations would be refused.
 */
const probe = () =>
  schema(
    "QtiTestProcessingProbe",
    {
      ...node.relations,
      ...attributes.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...item.relations,
      ...rosters.relations,
      ...reference.relations,
      ...stimulus.relations,
      ...testRules.relations,
      ...testStructure.relations,
      ...ruleSchema.relations,
      ...processing.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...item.rules,
      ...reference.rules,
      ...testRules.rules,
      ...testStructure.rules,
      ...ruleSchema.rules,
      ...processing.rules,
      ...testProcessing.rules,
    ],
  );

/**
 * The containments of `testProcessing.rules` whose left side names a relation whole or selected:
 * the left bindings, the left fields, the right relation, its bindings and its fields.
 */
const laws = testProcessing.rules.map((rule) => [
  "relation" in rule.left.source ? rule.left.source.relation : rule.left.source,
  "bindings" in rule.left.source ? rule.left.source.bindings : undefined,
  [...rule.left.fields],
  "relation" in rule.right.source ? rule.right.source.relation : rule.right.source,
  "bindings" in rule.right.source ? rule.right.source.bindings : undefined,
  [...rule.right.fields],
]);

/**
 * The laws of `testProcessing.rules` that start at one relation.
 */
const lawsFrom = (owner: { readonly name: string }) =>
  laws.filter(([left]) => left === owner).map(([, ...rest]) => rest);

describe("test/processing", () => {
  it("adds no relation and composes with processing's statements without refusal", () => {
    assert.isFalse("relations" in testProcessing);

    const built = probe();
    assert.strictEqual(
      built.statements.length,
      node.rules.length +
        pkg.rules.length +
        document.rules.length +
        declaration.rules.length +
        value.rules.length +
        item.rules.length +
        reference.rules.length +
        testRules.rules.length +
        testStructure.rules.length +
        ruleSchema.rules.length +
        processing.rules.length +
        testProcessing.rules.length,
    );
  });

  it("holds p5-34's 71 statements and E18's thirteen: processing's rules and this module's together are the 84", () => {
    assert.strictEqual(processing.rules.length, 73);
    assert.strictEqual(testProcessing.rules.length, 11);
    assert.strictEqual(processing.rules.length + testProcessing.rules.length, 84);
  });

  it("holds only containments", () => {
    assert.isTrue(testProcessing.rules.every((rule) => rule.kind === "contained"));
  });

  it("binds each prefixed arm's root to a document", () => {
    const { ItemInstanceVariableRef, ItemVariableRef, SectionDurationRef } = processing.relations;
    for (const arm of [ItemVariableRef, ItemInstanceVariableRef, SectionDurationRef]) {
      assert.deepStrictEqual(
        lawsFrom(arm),
        [[undefined, ["document", "root"], document.relations.Document, undefined, ["id", "root"]]],
        arm.name,
      );
    }
  });

  it("ties the hub PrefixedVariableSource to its test, item reference and item document", () => {
    const { PrefixedVariableSource } = processing.relations;
    const { ItemRefDocument } = reference.relations;
    const { TestDocument, TestReach } = testStructure.relations;
    assert.deepStrictEqual(lawsFrom(PrefixedVariableSource), [
      [undefined, ["test", "document"], TestDocument, undefined, ["test", "document"]],
      [
        undefined,
        ["test", "prefix", "itemRef"],
        TestReach,
        { holderKind: "itemRef" },
        ["test", "identifier", "holder"],
      ],
      [undefined, ["itemRef", "itemDocument"], ItemRefDocument, undefined, ["itemRef", "document"]],
    ]);
  });

  it("homes a mapped prefixed source in the variable mapping of its item reference", () => {
    assert.deepStrictEqual(lawsFrom(processing.relations.PrefixedMapped), [
      [
        undefined,
        ["itemRef", "variable"],
        testRules.relations.VariableMapping,
        undefined,
        ["itemRef", "target"],
      ],
    ]);
  });

  it("binds SectionDurationTarget to its test and the part or section it names", () => {
    const { TestDocument, TestReach } = testStructure.relations;
    assert.deepStrictEqual(lawsFrom(processing.relations.SectionDurationTarget), [
      [undefined, ["test", "document"], TestDocument, undefined, ["test", "document"]],
      [
        undefined,
        ["test", "prefix", "holder", "holderKind"],
        TestReach,
        undefined,
        ["test", "identifier", "holder", "holderKind"],
      ],
    ]);
  });

  it("binds a section variable reference's root to a document and its resolution to a test document", () => {
    const { SectionVariableRef, SectionVariableResolution } = processing.relations;
    assert.deepStrictEqual(lawsFrom(SectionVariableRef), [
      [undefined, ["document", "root"], document.relations.Document, undefined, ["id", "root"]],
    ]);
    assert.deepStrictEqual(lawsFrom(SectionVariableResolution), [
      [
        undefined,
        ["test", "document"],
        testStructure.relations.TestDocument,
        undefined,
        ["test", "document"],
      ],
    ]);
  });

  it("selects at most one side of every containment it declares", () => {
    for (const [, leftBindings, leftFields, , rightBindings] of laws) {
      assert.isFalse(leftBindings !== undefined && rightBindings !== undefined, String(leftFields));
    }
  });

  it("leaves processing importing none of the modules these statements name", () => {
    for (const name of [
      "Document",
      "ItemRefDocument",
      "VariableMapping",
      "TestDocument",
      "TestReach",
    ]) {
      assert.notInclude(Object.keys(processing.relations), name);
    }
  });
});
