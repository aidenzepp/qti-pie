import { closed, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as generic from "#qti/schema/kinds/generic.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#qti/schema/node.ts";

/**
 * Whether every member of `A` is a member of `B`; the tuple wrapper stops distribution over a
 * union.
 */
type Within<A, B> = [A] extends [B] ? true : false;

/**
 * The node kinds every composed vocabulary declares, as one union.
 */
type ComposedKind = (typeof node.vocabularies)[number]["kinds"][number];

/**
 * The attribute names every composed vocabulary declares, as one union.
 */
type ComposedAttribute = (typeof node.vocabularies)[number]["attributes"][number];

/**
 * `NodeKindHandle` is the literal union of the composed kinds, and is not `string`.
 */
const nodeKindIsLiteral: [
  Within<NodeKindHandle, ComposedKind>,
  Within<ComposedKind, NodeKindHandle>,
  Within<string, NodeKindHandle>,
] = [true, true, false];

/**
 * `AttributeNameHandle` is the literal union of the composed attribute names, and is not `string`.
 */
const attributeNameIsLiteral: [
  Within<AttributeNameHandle, ComposedAttribute>,
  Within<ComposedAttribute, AttributeNameHandle>,
  Within<string, AttributeNameHandle>,
] = [true, true, false];

describe("node", () => {
  it("builds a schema over its relations and rules without refusal", () => {
    const probe = schema("QtiNodeProbe", node.relations, node.rules);
    assert.deepStrictEqual(Object.keys(probe.relations).toSorted(), [
      "Admission",
      "AttributeEntityReference",
      "AttributeLexical",
      "AttributeName",
      "Comment",
      "Edge",
      "EntityReference",
      "MiscKind",
      "NamespaceDeclaration",
      "Node",
      "NodeKind",
      "Pi",
      "Placement",
      "RootKind",
      "SchemaLocation",
      "SchemaVersion",
      "Text",
      "Tree",
      "TreeDoctype",
      "TreeExportCharset",
      "TreeKind",
      "TreeMisc",
      "TreeRoot",
      "TreeXmlEncoding",
      "TreeXmlStandalone",
      "TreeXmlVersion",
      "Ws",
    ]);
    assert.strictEqual(probe.statements.length, node.rules.length);
  });

  it("composes NodeKind from the kinds tuples of the composed vocabularies, in order", () => {
    assert.deepStrictEqual(
      [...node.relations.NodeKind.handles],
      node.vocabularies.flatMap((vocabulary) => [...vocabulary.kinds]),
    );
  });

  it("composes AttributeName from the attributes tuples of the composed vocabularies, in order", () => {
    assert.deepStrictEqual(
      [...node.relations.AttributeName.handles],
      node.vocabularies.flatMap((vocabulary) => [...vocabulary.attributes]),
    );
  });

  it("names every registry row's attribute in AttributeName", () => {
    const names = new Set<string>(node.relations.AttributeName.handles);
    const missing = node.vocabularies
      .flatMap((vocabulary) => Object.values(vocabulary.registry))
      .flatMap((row) => row.attributes)
      .filter((name) => !names.has(name));
    assert.deepStrictEqual(missing, []);
  });

  it("keys TreeRoot by its node as well as its tree: one tree per root node", () => {
    const candidates = node.rules.filter(
      (rule) => rule.kind === "key" && rule.relation === node.relations.TreeRoot,
    );
    assert.deepStrictEqual(
      candidates.map((rule) => (rule.kind === "key" ? [...rule.fields] : [])),
      [["node"]],
    );
    assert.deepStrictEqual([...node.relations.TreeRoot.primaryKey], ["tree"]);
  });

  it("contains each edge's version and kinds in Admission, over its three keyed fields", () => {
    const admitted = node.rules.filter(
      (rule) =>
        rule.kind === "contained" &&
        rule.left.source === node.relations.Edge &&
        rule.right.source === node.relations.Admission,
    );
    assert.deepStrictEqual(
      admitted.map((rule) =>
        rule.kind === "contained" ? [[...rule.left.fields], [...rule.right.fields]] : [],
      ),
      [
        [
          ["version", "parentKind", "childKind"],
          ["version", "parent", "child"],
        ],
      ],
    );
    assert.deepStrictEqual(
      [...node.relations.Admission.primaryKey],
      ["version", "parent", "child"],
    );
  });

  it("keys AttributeLexical by node and attribute, an AttributeName over an uncollapsed value", () => {
    const lexical = node.relations.AttributeLexical;
    assert.deepStrictEqual([...lexical.primaryKey], ["node", "attribute"]);
    assert.strictEqual(lexical.fields.attribute.roster.name, node.relations.AttributeName.name);
    assert.strictEqual(lexical.fields.value.pattern.source, patterns.uncollapsed);
    assert.strictEqual(lexical.fields.value.pattern.flags, patterns.uncollapsedFlags);
  });

  it("gives each generic kind its arm, keyed by its NodeKind handle", () => {
    assert.deepStrictEqual(Object.keys(node.arms).toSorted(), [...generic.kinds].toSorted());
    assert.deepStrictEqual(
      Object.values(node.arms).map((arm) => [...arm.primaryKey]),
      generic.kinds.map(() => ["id"]),
    );
  });

  it("types the composed handle unions as literals", () => {
    assert.deepStrictEqual(nodeKindIsLiteral, [true, true, false]);
    assert.deepStrictEqual(attributeNameIsLiteral, [true, true, false]);
  });

  it("refuses a plain string[] spread into closed at the type level", () => {
    const plain: string[] = ["loose"];
    // @ts-expect-error a widened roster is not a nonempty tuple of literals (TS2345)
    const loose = closed("Loose", [...plain]);
    assert.deepStrictEqual([...loose.handles], ["loose"]);
  });
});
