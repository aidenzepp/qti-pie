import { assert, describe, it } from "@effect/vitest";
import { ownAttributes } from "#pantry/schema/attribute-homes.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { SchemaVersion } from "#pantry/schema/node.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";

const { relations } = stimulus;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3 and
 * 4.11.
 */
const declarations = [
  ["AssessmentStimulus", ["id"], ["id"]],
  ["StimulusBody", ["id", "version"], ["id"]],
  ["ItemStimulusRef", ["document", "href", "id", "identifier"], ["id"]],
  ["ItemStimulusRefTitle", ["node", "value"], ["node"]],
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

describe("the stimulus relations", () => {
  it("declares 4 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 4);
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

  it("keeps the three arms keyed by their kinds and the root thin", () => {
    assert.deepStrictEqual(Object.keys(stimulus.arms).toSorted(), [
      "qti-assessment-stimulus",
      "qti-assessment-stimulus-ref",
      "qti-stimulus-body",
    ]);
    assert.deepStrictEqual(fieldsOf(stimulus.AssessmentStimulus), ["id"]);
  });

  it("types the body's version by SchemaVersion and the reference's fields by contract", () => {
    assert.strictEqual(relations.StimulusBody.fields.version.roster, SchemaVersion);
    assert.strictEqual(
      relations.ItemStimulusRef.fields.identifier.name,
      contracts.StimulusRefIdentifier.name,
    );
    assert.strictEqual(relations.ItemStimulusRef.fields.href.name, contracts.StimulusRefHref.name);
  });

  it("gives Author a line for the new relation beside the three arms", () => {
    for (const name of [
      "AssessmentStimulus",
      "ItemStimulusRef",
      "ItemStimulusRefTitle",
      "StimulusBody",
    ] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
  });

  it("fills the registry attributes of the three kinds from the inventory, in its order", () => {
    for (const handle of [
      "qti-assessment-stimulus",
      "qti-assessment-stimulus-ref",
      "qti-stimulus-body",
    ] as const) {
      assert.deepStrictEqual(
        [...test.registry[handle].attributes],
        testInventory[handle]?.attributes.map((attribute) => attribute.name),
        handle,
      );
    }
    assert.deepStrictEqual(
      [...test.registry["qti-assessment-stimulus-ref"].attributes],
      ["identifier", "href", "title"],
    );
  });

  it("homes the own attributes of the root and the reference, the body keeping none", () => {
    assert.deepStrictEqual(homed("qti-assessment-stimulus").toSorted(), [
      "identifier",
      "title",
      "tool-name",
      "tool-version",
    ]);
    assert.deepStrictEqual(homed("qti-assessment-stimulus-ref").toSorted(), [
      "href",
      "identifier",
      "title",
    ]);
    assert.deepStrictEqual(homed("qti-stimulus-body"), []);
  });

  it("declares no statement, the laws over these rows arriving with their headings", () => {
    assert.deepStrictEqual([...stimulus.rules], []);
  });
});
