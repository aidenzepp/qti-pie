import { assert, describe, it } from "@effect/vitest";
import { publishedRelations } from "#pantry/api/published.ts";

/**
 * The published relations' names, spec section 2.2's ten, `TestFlag` (decision 503), and `Entry`
 * and `ReferencePath` (operator ruling 6a456d85), sorted.
 */
const publishedNames: readonly string[] = [
  "BaseType",
  "DeclarationIdentifier",
  "Document",
  "Entry",
  "ItemRefDocument",
  "Named",
  "Package",
  "ReferencePath",
  "Section",
  "SectionMember",
  "SectionSelection",
  "TestDocument",
  "TestFlag",
];

describe("publishedRelations", () => {
  it("publishes TestFlag, where a section's visibility is the row named visible", () => {
    const { TestFlag } = publishedRelations;

    assert.strictEqual(TestFlag.kind, "relation");
    assert.deepStrictEqual(TestFlag.key, ["node", "name"]);
    assert.deepStrictEqual(TestFlag.fields, ["node", "name", "value"]);
  });

  it("publishes Entry, a package's entries by path with their bytes", () => {
    const { Entry } = publishedRelations;

    assert.strictEqual(Entry.kind, "relation");
    assert.deepStrictEqual(Entry.key, ["package", "at"]);
    assert.deepStrictEqual(Entry.fields, ["package", "at", "path", "content"]);
  });

  it("publishes ReferencePath, a reference's resolved path in its package", () => {
    const { ReferencePath } = publishedRelations;

    assert.strictEqual(ReferencePath.kind, "relation");
    assert.deepStrictEqual(ReferencePath.key, ["node", "name"]);
    assert.deepStrictEqual(ReferencePath.fields, [
      "node",
      "name",
      "document",
      "package",
      "kind",
      "path",
    ]);
  });

  it("names exactly the thirteen published relations", () => {
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
