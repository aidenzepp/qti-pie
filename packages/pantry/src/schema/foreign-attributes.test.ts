import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { typedValues } from "#pantry/schema/attribute-homes.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import { XmlSpace } from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as foreignAttributes from "#pantry/schema/foreign-attributes.ts";
import { Rows } from "#pantry/import/tree.ts";
import * as node from "#pantry/schema/node.ts";
import { Qti } from "#pantry/schema/qti.ts";
import { Author } from "#pantry/schema/roles.ts";

const { NodeXmlSpace } = foreignAttributes.relations;

const { DocumentXmlId } = document.relations;

type DocumentRelation = (typeof document.relations)[keyof typeof document.relations];

/**
 * The fields of each key of `document.rules` on `relation`.
 */
const keysOf = (relation: DocumentRelation) =>
  document.rules.flatMap((rule) =>
    rule.kind === "key" && rule.relation === relation ? [[...rule.fields]] : [],
  );

type Rule = (typeof foreignAttributes.rules)[number];

const ofKind = <K extends Rule["kind"]>(kind: K) =>
  foreignAttributes.rules.filter(
    (rule): rule is Extract<Rule, { readonly kind: K }> => rule.kind === kind,
  );

const sideOf = (side: { readonly source: object }) => side.source;

const nodeId = "00000000-0000-4000-8000-000000000001";

const documentId = "00000000-0000-4000-8000-000000000002";

describe("the xml:space and xml:id model", () => {
  it("declares the XmlSpace roster as w3/xml.xsd's enumeration", () => {
    assert.deepStrictEqual(XmlSpace.handles, ["default", "preserve"]);
  });

  it("declares NodeXmlSpace with its fields in the lint's order, keyed by the node", () => {
    assert.deepStrictEqual(Object.keys(NodeXmlSpace.fields), [
      "attribute",
      "kind",
      "node",
      "value",
    ]);
    assert.deepStrictEqual([...NodeXmlSpace.primaryKey], ["node"]);
  });

  it("declares DocumentXmlId in HtmlId's shape, keyed by (document, id)", () => {
    assert.deepStrictEqual(Object.keys(DocumentXmlId.fields), [
      "attribute",
      "document",
      "id",
      "kind",
      "node",
    ]);
    assert.deepStrictEqual([...DocumentXmlId.primaryKey], ["document", "id"]);
    assert.deepStrictEqual(Object.keys(DocumentXmlId.fields), Object.keys(document.HtmlId.fields));
  });

  it("keys DocumentXmlId a second time by node and contains it in Node, as HtmlId is", () => {
    assert.deepStrictEqual(keysOf(DocumentXmlId), [["node"]]);
    assert.deepStrictEqual(keysOf(document.relations.HtmlId), [["node"]]);

    const into = document.rules.flatMap((rule) =>
      rule.kind === "contained" && rule.left.source === DocumentXmlId
        ? [[[...rule.left.fields], rule.right.source, [...rule.right.fields]]]
        : [],
    );
    assert.deepStrictEqual(into, [
      [["node", "document", "kind"], node.Node, ["id", "tree", "kind"]],
    ]);
  });

  it("contains NodeXmlSpace in Node and each relation's (kind, attribute) in AttributeAdmission", () => {
    assert.deepStrictEqual(
      ofKind("contained").map((rule) => [
        sideOf(rule.left),
        [...rule.left.fields],
        sideOf(rule.right),
        [...rule.right.fields],
      ]),
      [
        [NodeXmlSpace, ["node", "kind"], node.Node, ["id", "kind"]],
        [NodeXmlSpace, ["kind", "attribute"], attributes.AttributeAdmission, ["kind", "attribute"]],
        [
          DocumentXmlId,
          ["kind", "attribute"],
          attributes.AttributeAdmission,
          ["kind", "attribute"],
        ],
      ],
    );
  });

  it("checks that each relation's attribute is its own name", () => {
    assert.deepStrictEqual(
      ofKind("check").map((rule) => [rule.name, rule.relation]),
      [
        ["NodeXmlSpaceAttribute", NodeXmlSpace],
        ["DocumentXmlIdAttribute", DocumentXmlId],
      ],
    );
  });

  it("declares no arm", () => {
    assert.deepStrictEqual(foreignAttributes.arms, {});
  });

  it("composes both relations and every statement into the schema", () => {
    assert.strictEqual(Qti.relations.NodeXmlSpace, NodeXmlSpace);
    assert.strictEqual(Qti.relations.DocumentXmlId, DocumentXmlId);
    for (const rule of [...foreignAttributes.rules, ...document.rules]) {
      assert.include(Qti.statements, rule);
    }
  });

  it("lets the Author role write both relations", () => {
    assert.strictEqual(Author.relations.NodeXmlSpace, NodeXmlSpace);
    assert.strictEqual(Author.relations.DocumentXmlId, DocumentXmlId);
  });

  it("appends xmlId last in the IdHolder roster", () => {
    assert.strictEqual(document.IdHolder.handles.at(-1), "xmlId");
  });

  it("names DocumentXmlId under xmlId in the DocumentId alternatives", () => {
    const [rule, ...rest] = declaration.rules.filter(
      (candidate) => candidate.kind === "alternatives" && candidate.parent === document.DocumentId,
    );
    assert.strictEqual(rest.length, 0);
    assert.isTrue(Predicate.hasProperty(rule, "arms"));
    assert.isTrue(
      Predicate.hasProperty(rule, "arms") &&
        Predicate.hasProperty(rule.arms, "xmlId") &&
        rule.arms.xmlId === DocumentXmlId,
    );
  });

  it("holds DocumentId's containment into Document and its (document, id) key", () => {
    const into = document.rules.filter(
      (rule) => rule.kind === "contained" && rule.left.source === document.DocumentId,
    );
    assert.strictEqual(into.length, 1);
    assert.deepStrictEqual([...document.DocumentId.primaryKey], ["document", "id"]);
  });

  it("reads xml:space and xml:id back from the rows", () => {
    const rows = Rows.add(
      Rows.add(new Map(), NodeXmlSpace, [
        { attribute: "xml:space", kind: "foreign", node: nodeId, value: "preserve" },
      ]),
      DocumentXmlId,
      [
        {
          attribute: "xml:id",
          document: documentId,
          id: "anchor",
          kind: "foreign",
          node: nodeId,
        },
      ],
    );
    const read = typedValues(rows);
    assert.strictEqual(read(nodeId, "foreign", "xml:space"), "preserve");
    assert.strictEqual(read(nodeId, "foreign", "xml:id"), "anchor");
  });
});
