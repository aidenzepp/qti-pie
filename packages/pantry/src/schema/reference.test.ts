import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { ItemRefTarget } from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as document from "#pantry/schema/document.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import * as node from "#pantry/schema/node.ts";
import { PackageEntry, Resource, ResourceHref } from "#pantry/schema/package.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as reference from "#pantry/schema/reference.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";
import * as structure from "#pantry/schema/test/structure.ts";

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

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * A containment as the relation and columns of each side, with the selection its right side binds
 * (the empty object where it binds none).
 */
interface Containment {
  readonly from: unknown;
  readonly fields: readonly string[];
  readonly into: unknown;
  readonly target: readonly string[];
  readonly selection: Readonly<Record<string, string>>;
}

const containments: readonly Containment[] = reference.rules
  .filter((rule) => rule.kind === "contained")
  .map((rule) => {
    const selection = selectionOf(rule.right);

    return {
      fields: [...rule.left.fields],
      from: rule.left.source,
      into: selection?.relation ?? rule.right.source,
      selection: Object.fromEntries(
        Object.entries(selection?.bindings ?? {}).map(([name, value]) => [name, String(value)]),
      ),
      target: [...rule.right.fields],
    };
  });

/**
 * Whether the module states `fields` of `from` contained in `target` of `into`, selecting
 * `selection` of the target where it names one.
 */
const states = (
  from: Containment["from"],
  fields: readonly string[],
  into: Containment["into"],
  target: readonly string[],
  selection: Containment["selection"] = {},
): boolean =>
  containments.some(
    (containment) =>
      containment.from === from &&
      containment.into === into &&
      JSON.stringify(containment.fields) === JSON.stringify(fields) &&
      JSON.stringify(containment.target) === JSON.stringify(target) &&
      JSON.stringify(containment.selection) === JSON.stringify(selection),
  );

const { Document } = document.relations;

describe("the reference statements", () => {
  it("declares the ItemRefResolution alternatives: an item arm and an lti arm, keyed by itemRef", () => {
    const [rule, ...rest] = reference.rules.filter(
      (candidate) => candidate.kind === "alternatives",
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.parent, relations.ItemRefResolution);
    assert.strictEqual(rule?.discriminator, "targetKind");
    assert.strictEqual(rule?.roster, ItemRefTarget);
    assert.deepStrictEqual(
      Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["item", relations.ItemRefDocument],
        ["lti", relations.ItemRefLti],
      ],
    );
  });

  it("contains an item arm's document in a Document whose root is an item", () => {
    assert.isTrue(
      states(
        relations.ItemRefDocument,
        ["package", "path", "document"],
        Document,
        ["package", "path", "id"],
        { root: "item" },
      ),
    );
  });

  it("contains an lti arm's resource and type in the package's Resource", () => {
    assert.isTrue(
      states(relations.ItemRefLti, ["package", "resource", "type"], Resource, [
        "package",
        "identifier",
        "type",
      ]),
    );
  });

  it("checks that an lti arm's type is one of the three LTI resource types", () => {
    const [rule, ...rest] = reference.rules.filter((candidate) => candidate.kind === "check");
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.name, "ItemRefLtiType");
    assert.strictEqual(rule?.relation, relations.ItemRefLti);

    const text = Predicate.hasProperty(rule, "desc") ? JSON.stringify(rule.desc) : "";
    for (const type of ["imsbasiclti_xmlv1p3", "imslti_xmlv1p1", "imsltia_xmlv1p0"]) {
      assert.include(text, type);
    }
  });

  it("makes every item reference resolve", () => {
    assert.isTrue(states(structure.ItemRef, ["id"], relations.ItemRefResolution, ["itemRef"]));
  });

  it("contains a section resolution in a Document whose root is a section, and makes every section reference resolve", () => {
    assert.isTrue(
      states(
        relations.SectionRefResolution,
        ["package", "path", "document"],
        Document,
        ["package", "path", "id"],
        { root: "section" },
      ),
    );
    assert.isTrue(
      states(structure.SectionRef, ["id"], relations.SectionRefResolution, ["sectionRef"]),
    );
  });

  it("contains a stimulus resolution in a Document whose root is a stimulus, and makes every stimulus reference resolve", () => {
    assert.isTrue(
      states(
        relations.StimulusRefResolution,
        ["package", "path", "document"],
        Document,
        ["package", "path", "id"],
        { root: "stimulus" },
      ),
    );
    assert.isTrue(
      states(stimulus.ItemStimulusRef, ["id"], relations.StimulusRefResolution, ["stimulusRef"]),
    );
  });

  it("gives AttributeFileReference phase 9's laws: its node, document, package, entry and admission", () => {
    const { AttributeFileReference } = relations;
    assert.isTrue(states(AttributeFileReference, ["node", "kind"], node.Node, ["id", "kind"]));
    assert.isTrue(states(AttributeFileReference, ["node", "document"], node.Node, ["id", "tree"]));
    assert.isTrue(
      states(AttributeFileReference, ["document", "package"], Document, ["id", "package"]),
    );
    assert.isTrue(
      states(AttributeFileReference, ["package", "path"], PackageEntry, ["package", "path"]),
    );
    assert.isTrue(
      states(AttributeFileReference, ["kind", "attribute"], attributes.AttributeAdmission, [
        "kind",
        "attribute",
      ]),
    );
  });

  it("states nothing else: fourteen statements, one alternatives, twelve containments and one check", () => {
    assert.strictEqual(reference.rules.length, 14);
    assert.strictEqual(containments.length, 12);
  });

  it("never contains a row in File or ResourceHref: neither holds a key on (package, href)", () => {
    assert.isFalse(containments.some((c) => c.into === pkg.File || c.into === ResourceHref));
  });
});
