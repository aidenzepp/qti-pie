import { closed, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import * as contracts from "#pantry/schema/contracts.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import * as node from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";

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
      "NoNamespaceSchemaLocation",
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
      "XsiNil",
      "XsiType",
      "XsiTypeAttribute",
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

type Rule = (typeof node.rules)[number];

type Source =
  | { readonly name: string }
  | {
      readonly bindings: Readonly<Record<string, string>>;
      readonly relation: { readonly name: string };
    };

/**
 * One side of a statement written out: the relation, the handles a `select` fixes, and the fields.
 */
const sideOf = ({
  fields,
  source,
}: {
  readonly fields: readonly string[];
  readonly source: Source;
}): string => {
  if ("relation" in source) {
    const bound = Object.entries(source.bindings).map(([key, value]) => `${key}=${value}`);

    return `${source.relation.name}{${bound.join(",")}}(${fields.join(",")})`;
  }

  return `${source.name}(${fields.join(",")})`;
};

/**
 * One statement written out by its law kind and its sides, or by its check's name and relation:
 * never a message.
 */
const stated = (rule: Rule): string => {
  if (rule.kind === "contained") {
    return `contained ${sideOf(rule.left)} in ${sideOf(rule.right)}`;
  }

  if (rule.kind === "check") {
    return `check ${rule.name} on ${rule.relation.name}`;
  }

  return rule.kind;
};

describe("the xsi relations", () => {
  const { NoNamespaceSchemaLocation, XsiNil, XsiType, XsiTypeAttribute } = node.relations;
  const statements = node.rules.map(stated);

  it("gives XsiType a node, the prefix it was written under and its value, keyed by the node", () => {
    assert.deepStrictEqual(Object.keys(XsiType.fields), ["node", "prefix", "value"]);
    assert.deepStrictEqual([...XsiType.primaryKey], ["node"]);
    assert.strictEqual(XsiType.fields.prefix.name, contracts.NamespacePrefix.name);
  });

  it("gives XsiNil a kind beside its node, prefix and value, keyed by the node", () => {
    assert.deepStrictEqual(Object.keys(XsiNil.fields), ["kind", "node", "prefix", "value"]);
    assert.deepStrictEqual([...XsiNil.primaryKey], ["node"]);
    assert.strictEqual(XsiNil.fields.prefix.name, contracts.NamespacePrefix.name);
  });

  it("gives NoNamespaceSchemaLocation a node, prefix and value, keyed by the node", () => {
    assert.deepStrictEqual(Object.keys(NoNamespaceSchemaLocation.fields), [
      "node",
      "prefix",
      "value",
    ]);
    assert.deepStrictEqual([...NoNamespaceSchemaLocation.primaryKey], ["node"]);
    assert.strictEqual(
      NoNamespaceSchemaLocation.fields.prefix.name,
      contracts.NamespacePrefix.name,
    );
  });

  it("gives XsiTypeAttribute the fields of ForeignAttribute's name and value, keyed by node, prefix and local", () => {
    assert.deepStrictEqual(Object.keys(XsiTypeAttribute.fields), [
      "kind",
      "local",
      "namespace",
      "node",
      "prefix",
      "value",
    ]);
    assert.deepStrictEqual([...XsiTypeAttribute.primaryKey], ["node", "prefix", "local"]);
    assert.strictEqual(XsiTypeAttribute.fields.local.name, contracts.XmlLocalName.name);
    assert.strictEqual(XsiTypeAttribute.fields.namespace.name, contracts.NamespaceUri.name);
  });

  it("states the containments into Node and the xsi:type owner, and the two checks", () => {
    assert.includeMembers(statements, [
      "contained XsiType(node) in Node(id)",
      "contained NoNamespaceSchemaLocation(node) in Node(id)",
      "contained XsiNil(node,kind) in Node(id,kind)",
      "check XsiNilUndeclared on XsiNil",
      "contained XsiTypeAttribute(node,kind) in Node(id,kind)",
      "contained XsiTypeAttribute(node) in XsiType(node)",
      "check XsiTypeAttributePrefix on XsiTypeAttribute",
    ]);
  });

  it("states each of the seven once", () => {
    const xsi = statements.filter((line) => /Xsi|NoNamespace/u.test(line));
    assert.strictEqual(xsi.length, 7);
    assert.strictEqual(new Set(xsi).size, 7);
  });
});

describe("contracts (node)", () => {
  it("types NamespaceDeclaration.uri NamespaceUri", () => {
    assert.strictEqual(node.NamespaceDeclaration.fields.uri.name, contracts.NamespaceUri.name);
  });
  it("types SchemaLocation.prefix NamespacePrefix", () => {
    assert.strictEqual(node.SchemaLocation.fields.prefix.name, contracts.NamespacePrefix.name);
  });
  it("types AttributeEntityReference.name XmlEntityName", () => {
    assert.strictEqual(
      node.AttributeEntityReference.fields.name.name,
      contracts.XmlEntityName.name,
    );
  });
  it("types Pi.target PiTarget", () => {
    assert.strictEqual(node.Pi.fields.target.name, contracts.PiTarget.name);
  });
  it("types EntityReference.name XmlEntityName", () => {
    assert.strictEqual(node.EntityReference.fields.name.name, contracts.XmlEntityName.name);
  });
});
