import { assert, describe, it } from "@effect/vitest";
import { ItemRefTarget } from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import { Resource } from "#pantry/schema/package.ts";
import * as reference from "#pantry/schema/reference.ts";
import { Author } from "#pantry/schema/roles.ts";

const { relations } = reference;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.5 and
 * 4.6.
 */
const declarations = [
  ["ItemRefResolution", ["itemRef", "package", "path", "targetKind"], ["itemRef"]],
  ["ItemRefDocument", ["document", "itemRef", "package", "path"], ["itemRef"]],
  ["ItemRefLti", ["itemRef", "package", "resource", "type"], ["itemRef"]],
  ["SectionRefResolution", ["document", "package", "path", "sectionRef"], ["sectionRef"]],
  ["StimulusRefResolution", ["document", "package", "path", "stimulusRef"], ["stimulusRef"]],
  [
    "AttributeFileReference",
    ["attribute", "document", "kind", "node", "package", "path", "position"],
    ["node", "attribute", "position"],
  ],
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the reference relations", () => {
  it("declares 6 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 6);
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

  it("declares no statement", () => {
    assert.deepStrictEqual([...reference.rules], []);
  });

  it("types every path PackagePath", () => {
    for (const name of [
      "ItemRefResolution",
      "ItemRefDocument",
      "SectionRefResolution",
      "StimulusRefResolution",
      "AttributeFileReference",
    ] as const) {
      assert.strictEqual(relations[name].fields.path.name, contracts.PackagePath.name, name);
    }
  });

  it("types the target kind, the node kind and the attribute by their rosters", () => {
    assert.strictEqual(relations.ItemRefResolution.fields.targetKind.roster, ItemRefTarget);
    assert.strictEqual(relations.AttributeFileReference.fields.kind.roster, NodeKind);
    assert.strictEqual(relations.AttributeFileReference.fields.attribute.roster, AttributeName);
  });

  it("types the LTI resource and type as the columns of Resource", () => {
    assert.strictEqual(relations.ItemRefLti.fields.resource, Resource.fields.identifier);
    assert.strictEqual(relations.ItemRefLti.fields.type, Resource.fields.type);
  });

  it("gives every relation to the author role", () => {
    for (const name of Object.keys(relations)) {
      assert.isTrue(name in Author.relations, name);
    }
  });
});
