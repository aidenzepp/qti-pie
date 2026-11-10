import { assert, describe, it } from "@effect/vitest";
import { publishedRelations } from "#pantry/api/published.ts";

/**
 * The published relations' names, spec section 2.2's ten, sorted.
 */
const publishedNames: readonly string[] = [
  "BaseType",
  "DeclarationIdentifier",
  "Document",
  "ItemRefDocument",
  "Named",
  "Package",
  "Section",
  "SectionMember",
  "SectionSelection",
  "TestDocument",
];

describe("publishedRelations", () => {
  it("names exactly the ten published relations", () => {
    assert.deepStrictEqual(Object.keys(publishedRelations).toSorted(), publishedNames);
  });

  it("holds each relation's key and published fields to its own declaration", () => {
    for (const [name, entry] of Object.entries(publishedRelations)) {
      if (entry.kind === "roster") {
        assert.strictEqual(entry.relation.kind, "closed", name);
        assert.strictEqual(entry.relation.name, name);
        continue;
      }

      assert.strictEqual(entry.relation.kind, "relation", name);
      assert.strictEqual(entry.relation.name, name);
      assert.deepStrictEqual(entry.key, entry.relation.primaryKey, name);

      const declared = Object.keys(entry.relation.fields);
      for (const field of entry.fields) {
        assert.include(declared, field, `${name}.${field}`);
      }
      for (const field of entry.key) {
        assert.include(entry.fields, field, `${name} publishes its key field ${field}`);
      }
    }
  });
});
