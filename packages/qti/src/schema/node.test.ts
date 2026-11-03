import { closed, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import * as attributes from "#qti/schema/attributes.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
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
      "Ancestry",
      "AttributeEntityReference",
      "AttributeLexical",
      "AttributeName",
      "AttributeSpelling",
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
      "TextNode",
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
    assert.deepStrictEqual([...node.relations.NodeKind.handles], node.kindTuples.flat());
  });

  it("composes AttributeName from the attributes tuples of the composed vocabularies, in order", () => {
    assert.deepStrictEqual([...node.relations.AttributeName.handles], node.attributeTuples.flat());
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

  it("types TreeXmlStandalone as closedId of YesNo", () => {
    assert.strictEqual(node.relations.TreeXmlStandalone.fields.value.roster, rosters.YesNo);
  });

  it("keys AttributeLexical by node and attribute, an AttributeName over an uncollapsed value", () => {
    const lexical = node.relations.AttributeLexical;
    assert.deepStrictEqual([...lexical.primaryKey], ["node", "attribute"]);
    assert.strictEqual(lexical.fields.attribute.roster.name, node.relations.AttributeName.name);
    assert.strictEqual(lexical.fields.value.pattern.source, patterns.uncollapsed);
    assert.strictEqual(lexical.fields.value.pattern.flags, patterns.uncollapsedFlags);
  });

  it("keys AttributeSpelling by node and attribute, an AttributeName over a non-canonical integer", () => {
    const spelling = node.relations.AttributeSpelling;
    assert.deepStrictEqual([...spelling.primaryKey], ["node", "attribute"]);
    assert.deepStrictEqual(Object.keys(spelling.fields).toSorted(), [
      "attribute",
      "kind",
      "node",
      "value",
    ]);
    assert.strictEqual(spelling.fields.attribute.roster.name, node.relations.AttributeName.name);
    assert.strictEqual(spelling.fields.kind.roster.name, node.relations.NodeKind.name);
    assert.strictEqual(spelling.fields.value.pattern.source, patterns.nonCanonicalInteger);
  });

  it("contains an AttributeSpelling in its Node and in its AttributeAdmission, as AttributeLexical is", () => {
    const Side = Schema.Struct({
      fields: Schema.Array(Schema.String),
      source: Schema.Struct({ name: Schema.String }),
    });
    const Containment = Schema.Struct({
      kind: Schema.Literal("contained"),
      left: Side,
      right: Side,
    });
    const containments = (name: string) =>
      [...node.rules, ...attributes.rules]
        .flatMap((rule) => {
          const decoded = Schema.decodeUnknownOption(Containment)(rule);

          return Option.isSome(decoded) && decoded.value.left.source.name === name
            ? [decoded.value]
            : [];
        })
        .map(({ left, right }) => [left.fields, right.source.name, right.fields]);
    assert.deepStrictEqual(containments("AttributeSpelling"), [
      [["node", "kind"], "Node", ["id", "kind"]],
      [["kind", "attribute"], "AttributeAdmission", ["kind", "attribute"]],
    ]);
    assert.deepStrictEqual(containments("AttributeSpelling"), containments("AttributeLexical"));
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
