import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import { ownAttributes } from "#pantry/schema/attribute-homes.ts";
import { FeedbackOutcomeRef } from "#pantry/schema/feedback.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import { RubricBlock } from "#pantry/schema/rubric.ts";
import { PrintedVariableRef, PrintedVariableVarRef } from "#pantry/schema/template.ts";
import * as content from "#pantry/schema/test/content.ts";

const { relations } = content;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3 and
 * 4.10.
 */
const declarations = [
  ["TestRubricBlock", ["id", "view"], ["id"]],
  ["TestRubricBlockUse", ["node", "value"], ["node"]],
  ["TestRubricContentBody", ["id"], ["id"]],
  ["TestFeedback", ["access", "id", "identifier", "outcomeIdentifier", "showHide"], ["id"]],
  ["TestFeedbackTitle", ["node", "value"], ["node"]],
  ["TestFeedbackContentBody", ["id"], ["id"]],
  [
    "SectionFeedbackOutcomeRef",
    ["baseType", "cardinality", "document", "identifier", "node", "test"],
    ["node", "test"],
  ],
  [
    "SectionPrintedVariableRef",
    ["document", "identifier", "kind", "node", "test"],
    ["node", "test"],
  ],
  [
    "SectionPrintedVariableVarRef",
    ["attribute", "baseType", "cardinality", "document", "identifier", "kind", "node", "test"],
    ["node", "attribute", "test"],
  ],
] as const;

/**
 * The relations the module adds to `roles.ts` beside the three arms the earlier slices named.
 */
const added = [
  "SectionFeedbackOutcomeRef",
  "SectionPrintedVariableRef",
  "SectionPrintedVariableVarRef",
  "TestFeedbackTitle",
  "TestRubricBlockUse",
] as const;

/**
 * The names of the own attributes the homes table gives each kind.
 */
const homes = new Map(
  Object.entries(ownAttributes).map(([kind, own]) => [kind, own.map(([name]) => name)]),
);

const homed = (handle: string): readonly string[] => homes.get(handle) ?? [];

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test content relations", () => {
  it("declares 9 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 9);
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

  it("keeps the four arms keyed by their kinds, the two content bodies thin", () => {
    assert.deepStrictEqual(Object.keys(content.arms).toSorted(), [
      "qti-content-body.testFeedback",
      "qti-content-body.testRubric",
      "qti-rubric-block.test",
      "qti-test-feedback",
    ]);
    assert.deepStrictEqual(fieldsOf(content.TestRubricContentBody), ["id"]);
    assert.deepStrictEqual(fieldsOf(content.TestFeedbackContentBody), ["id"]);
  });

  it("types the rubric's view and use as the item rubric's", () => {
    assert.deepStrictEqual(relations.TestRubricBlock.fields.view, RubricBlock.fields.view);
    assert.deepStrictEqual(relations.TestRubricBlockUse.fields.value, RubricBlock.fields.use);
  });

  it("types the feedback's identifiers by contract and its kinds by roster", () => {
    assert.strictEqual(
      relations.TestFeedback.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
    assert.strictEqual(
      relations.TestFeedback.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
    assert.strictEqual(relations.TestFeedback.fields.access.roster, rosters.TestFeedbackAccess);
    assert.strictEqual(relations.TestFeedback.fields.showHide.roster, rosters.ShowHide);
  });

  it("types each twin's fields as the field of the relation it copies", () => {
    const feedback = [
      [relations.SectionFeedbackOutcomeRef.fields.baseType, FeedbackOutcomeRef.fields.baseType],
      [
        relations.SectionFeedbackOutcomeRef.fields.cardinality,
        FeedbackOutcomeRef.fields.cardinality,
      ],
      [relations.SectionFeedbackOutcomeRef.fields.document, FeedbackOutcomeRef.fields.document],
      [relations.SectionFeedbackOutcomeRef.fields.identifier, FeedbackOutcomeRef.fields.identifier],
      [relations.SectionPrintedVariableRef.fields.document, PrintedVariableRef.fields.document],
      [relations.SectionPrintedVariableRef.fields.identifier, PrintedVariableRef.fields.identifier],
      [relations.SectionPrintedVariableRef.fields.kind, PrintedVariableRef.fields.kind],
      [
        relations.SectionPrintedVariableVarRef.fields.attribute,
        PrintedVariableVarRef.fields.attribute,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.baseType,
        PrintedVariableVarRef.fields.baseType,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.cardinality,
        PrintedVariableVarRef.fields.cardinality,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.document,
        PrintedVariableVarRef.fields.document,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.identifier,
        PrintedVariableVarRef.fields.identifier,
      ],
      [relations.SectionPrintedVariableVarRef.fields.kind, PrintedVariableVarRef.fields.kind],
    ] as const;
    for (const [twin, original] of feedback) {
      assert.deepStrictEqual(twin, original);
    }
  });

  it("gives Author a line for each relation", () => {
    for (const name of added) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    for (const name of [
      "TestFeedback",
      "TestFeedbackContentBody",
      "TestRubricBlock",
      "TestRubricContentBody",
    ] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
  });

  it("fills the registry attributes of the four kinds from the inventory, in its order", () => {
    for (const handle of [
      "qti-content-body.testFeedback",
      "qti-content-body.testRubric",
      "qti-rubric-block.test",
      "qti-test-feedback",
    ] as const) {
      assert.deepStrictEqual(
        [...test.registry[handle].attributes],
        testInventory[handle]?.attributes.map((attribute) => attribute.name),
        handle,
      );
    }
    assert.deepStrictEqual(
      [...test.registry["qti-test-feedback"].attributes],
      ["access", "outcome-identifier", "show-hide", "identifier", "title"],
    );
  });

  it("homes the own attributes of the rubric and the feedback, the bodies keeping none", () => {
    assert.deepStrictEqual(homed("qti-rubric-block.test").toSorted(), ["use", "view"]);
    assert.deepStrictEqual(homed("qti-test-feedback").toSorted(), [
      "access",
      "identifier",
      "outcome-identifier",
      "show-hide",
      "title",
    ]);
    assert.deepStrictEqual(homed("qti-content-body.testRubric"), []);
    assert.deepStrictEqual(homed("qti-content-body.testFeedback"), []);
  });

  it("declares the one new name, access, beside the twenty landed", () => {
    assert.include(test.attributes, "access");
    assert.strictEqual(test.attributes.length, 21);
    assert.deepStrictEqual([...test.attributes], [...test.attributes].toSorted());
  });

  it("declares no statement, the laws over these rows arriving with their headings", () => {
    assert.deepStrictEqual([...content.rules], []);
  });
});
