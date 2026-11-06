import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { ownAttributes } from "#pantry/schema/attribute-homes.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as document from "#pantry/schema/document.ts";
import * as node from "#pantry/schema/node.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";

const { relations } = stimulus;

const capacities = stimulus.rules.filter((rule) => rule.kind === "capacity");

type Capacity = (typeof capacities)[number];

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * The version a capacity's target selects, or the empty string where it selects none.
 */
const selectedVersion = (rule: Capacity): string => {
  const bindings = selectionOf(rule.target)?.bindings;

  return Predicate.hasProperty(bindings, "version") ? String(bindings.version) : "";
};

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity | undefined): readonly [unknown, unknown] => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [within.low, within.high];
};

/**
 * The relations the shared attribute homes read: the node-keyed families, the id relation and each
 * ARIA relation.
 */
const aria = Object.entries(attributes.relations).filter(([key]) => key.startsWith("Aria"));

const ariaCount = aria.length;

const families = [
  attributes.relations.NodeClass,
  attributes.relations.NodeLang,
  attributes.relations.NodeXmlLang,
  attributes.relations.NodeLabel,
  attributes.relations.NodeDir,
  attributes.relations.NodeXmlBase,
  attributes.relations.NodeSuppressTts,
  attributes.relations.NodeCatalogIdref,
  document.relations.HtmlId,
  ...aria.map(([, relation]) => relation),
];

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
    assert.strictEqual(relations.StimulusBody.fields.version.roster, node.SchemaVersion);
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

  it("keys a stimulus reference by its document and identifier, once", () => {
    const keys = stimulus.rules.filter(
      (rule) => rule.kind === "key" && rule.relation === relations.ItemStimulusRef,
    );
    assert.deepStrictEqual(
      keys.map((rule) => (rule.kind === "key" ? [...rule.fields] : [])),
      [["document", "identifier"]],
    );
  });

  it("holds a reference's title to the reference and the reference to a node of its document", () => {
    const owned = stimulus.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === relations.ItemStimulusRefTitle);
    assert.strictEqual(owned.length, 1);
    assert.deepStrictEqual([...(owned[0]?.left.fields ?? [])], ["node"]);
    assert.strictEqual(owned[0]?.right.source, relations.ItemStimulusRef);
    assert.deepStrictEqual([...(owned[0]?.right.fields ?? [])], ["id"]);

    const placed = stimulus.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === relations.ItemStimulusRef);
    assert.strictEqual(placed.length, 1);
    assert.deepStrictEqual([...(placed[0]?.left.fields ?? [])], ["id", "document"]);
    assert.strictEqual(placed[0]?.right.source, node.relations.Node);
    assert.deepStrictEqual([...(placed[0]?.right.fields ?? [])], ["id", "tree"]);
  });

  it("holds the body's version to its node's version", () => {
    const versions = stimulus.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === relations.StimulusBody);
    assert.strictEqual(versions.length, 1);
    assert.deepStrictEqual([...(versions[0]?.left.fields ?? [])], ["id", "version"]);
    assert.strictEqual(versions[0]?.right.source, node.relations.Node);
    assert.deepStrictEqual([...(versions[0]?.right.fields ?? [])], ["id", "version"]);
  });

  it("requires exactly one body under each stimulus root", () => {
    const bodies = capacities.filter(
      (rule) => selectionOf(rule.from)?.relation === node.relations.Edge,
    );
    assert.strictEqual(bodies.length, 1);

    const [body] = bodies;
    assert.strictEqual(body?.target.source, relations.AssessmentStimulus);
    assert.deepStrictEqual([...(body?.target.fields ?? [])], ["id"]);
    assert.deepStrictEqual(body === undefined ? undefined : selectionOf(body.from)?.bindings, {
      childKind: "qti-stimulus-body",
      parentKind: "qti-assessment-stimulus",
    });
    assert.deepStrictEqual([...(body?.from.fields ?? [])], ["parent"]);
    assert.deepStrictEqual(boundsOf(body), [1n, 1n]);
  });

  it("refuses every shared attribute on a 3.0.0 body, one zero-bound capacity per family relation", () => {
    const zero = capacities.filter((rule) => selectedVersion(rule) === "3.0.0");
    assert.strictEqual(zero.length, families.length);
    for (const family of families) {
      assert.strictEqual(
        zero.filter((rule) => selectionOf(rule.from)?.relation === family).length,
        1,
        family.name,
      );
    }
    assert.strictEqual(zero.length, 9 + ariaCount);
    for (const rule of zero) {
      assert.strictEqual(selectionOf(rule.target)?.relation, relations.StimulusBody);
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.deepStrictEqual(selectionOf(rule.from)?.bindings, { kind: "qti-stimulus-body" });
      assert.deepStrictEqual([...rule.from.fields], ["node"]);
      assert.deepStrictEqual(boundsOf(rule), [0n, 0n]);
    }
  });

  it("gives every family relation the kind column the capacity selects on", () => {
    for (const family of families) {
      assert.property(family.fields, "kind", family.name);
      assert.property(family.fields, "node", family.name);
    }
  });

  it("declares exactly the statements above", () => {
    assert.strictEqual(stimulus.rules.length, 1 + 3 + 1 + 9 + ariaCount);
  });
});
