import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as node from "#pantry/schema/node.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as structure from "#pantry/schema/test/structure.ts";

const { relations } = structure;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3.
 */
const declarations = [
  ["AssessmentTest", ["id"], ["id"]],
  ["TestPart", ["document", "id", "identifier", "navigationMode", "submissionMode"], ["id"]],
  ["TestPartTitle", ["node", "value"], ["node"]],
  [
    "AssessmentSection",
    ["document", "fixed", "id", "identifier", "keepTogether", "required", "title", "visible"],
    ["id"],
  ],
  ["DeclaredSectionRequired", ["node"], ["node"]],
  ["DeclaredSectionFixed", ["node"], ["node"]],
  ["DeclaredSectionKeepTogether", ["node"], ["node"]],
  ["SectionRef", ["document", "href", "id", "identifier"], ["id"]],
  ["ItemRef", ["document", "fixed", "href", "id", "identifier", "required"], ["id"]],
  ["DeclaredItemRefRequired", ["node"], ["node"]],
  ["DeclaredItemRefFixed", ["node"], ["node"]],
  ["ItemRefCategory", ["node", "value"], ["node"]],
  ["TestIdentifier", ["holder", "holderKind", "identifier", "scope"], ["holder"]],
  ["TestReach", ["holder", "holderKind", "identifier", "test"], ["test", "holder"]],
  ["TestDocument", ["document", "test"], ["test", "document"]],
  ["StructureChild", ["child", "childKind", "parent"], ["child"]],
  ["RequiredChild", ["child", "parent", "required"], ["child"]],
] as const;

/**
 * The names the module's relations take in `roles.ts`, beside the five arms' own.
 */
const added = [
  "DeclaredItemRefFixed",
  "DeclaredItemRefRequired",
  "DeclaredSectionFixed",
  "DeclaredSectionKeepTogether",
  "DeclaredSectionRequired",
  "ItemRefCategory",
  "RequiredChild",
  "StructureChild",
  "TestDocument",
  "TestIdentifier",
  "TestPartTitle",
  "TestReach",
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test structure relations", () => {
  it("declares 17 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 17);
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

  it("keeps the five arms keyed by their kinds and the test root thin", () => {
    assert.deepStrictEqual(Object.keys(structure.arms).toSorted(), [
      "qti-assessment-item-ref",
      "qti-assessment-section",
      "qti-assessment-section-ref",
      "qti-assessment-test",
      "qti-test-part",
    ]);
    assert.deepStrictEqual(fieldsOf(structure.AssessmentTest), ["id"]);
  });

  it("types the identifiers, hrefs and category by contract", () => {
    const typed = [
      [relations.TestPart.fields.identifier, contracts.TestStructureIdentifier],
      [relations.AssessmentSection.fields.identifier, contracts.TestStructureIdentifier],
      [relations.SectionRef.fields.identifier, contracts.TestStructureIdentifier],
      [relations.ItemRef.fields.identifier, contracts.TestStructureIdentifier],
      [relations.TestIdentifier.fields.identifier, contracts.TestStructureIdentifier],
      [relations.TestReach.fields.identifier, contracts.TestStructureIdentifier],
      [relations.SectionRef.fields.href, contracts.SectionRefHref],
      [relations.ItemRef.fields.href, contracts.ItemRefHref],
      [relations.ItemRefCategory.fields.value, contracts.CategoryList],
    ] as const;
    for (const [field, contract] of typed) {
      assert.strictEqual(field.name, contract.name);
    }
  });

  it("holds the closed columns to their rosters", () => {
    const closed: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.TestPart.fields.navigationMode, rosters.NavigationMode],
      [relations.TestPart.fields.submissionMode, rosters.SubmissionMode],
      [relations.AssessmentSection.fields.visible, rosters.XsBoolean],
      [relations.AssessmentSection.fields.required, rosters.XsBoolean],
      [relations.AssessmentSection.fields.fixed, rosters.XsBoolean],
      [relations.AssessmentSection.fields.keepTogether, rosters.XsBoolean],
      [relations.ItemRef.fields.required, rosters.XsBoolean],
      [relations.ItemRef.fields.fixed, rosters.XsBoolean],
      [relations.TestIdentifier.fields.holderKind, rosters.StructureHolder],
      [relations.TestReach.fields.holderKind, rosters.StructureHolder],
      [relations.StructureChild.fields.childKind, node.NodeKind],
      [relations.RequiredChild.fields.required, rosters.XsBoolean],
    ];
    for (const [field, roster] of closed) {
      assert.strictEqual(field.roster, roster);
    }
  });

  it("declares the two candidate keys later containments target, and no other statement", () => {
    assert.deepStrictEqual(
      structure.rules.map((rule) => [rule.kind, rule.relation.name, [...rule.fields]]),
      [
        ["key", "TestIdentifier", ["scope", "identifier"]],
        ["key", "TestReach", ["test", "identifier"]],
      ],
    );
  });

  it("gives Author a line for each of the twelve relations beside the arms", () => {
    for (const name of added) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    assert.strictEqual(added.length, 12);
  });

  it("fills the registry attributes of the five kinds from the inventory, in its order", () => {
    const registry = new Map(
      Object.entries(test.registry).map(([handle, row]) => [handle, row.attributes]),
    );
    const wanted = {
      "qti-assessment-item-ref": ["identifier", "required", "fixed", "class", "href", "category"],
      "qti-assessment-section": [
        "identifier",
        "required",
        "fixed",
        "title",
        "class",
        "visible",
        "keep-together",
      ],
      "qti-assessment-section-ref": ["identifier", "class", "href"],
      "qti-assessment-test": ["identifier", "title", "class", "tool-name", "tool-version"],
      "qti-test-part": ["identifier", "title", "class", "navigation-mode", "submission-mode"],
    } as const;
    for (const [handle, attributes] of Object.entries(wanted)) {
      assert.deepStrictEqual([...(registry.get(handle) ?? [])], [...attributes], handle);
    }
  });

  it("declares the five new names the kinds carry, alphabetically", () => {
    assert.deepStrictEqual(
      [...test.attributes],
      ["category", "keep-together", "navigation-mode", "submission-mode", "visible"],
    );
  });
});
