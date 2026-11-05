import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { typedValues } from "#pantry/schema/attribute-homes.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import { XmlSpace } from "#pantry/schema/content/rosters.ts";
import { ManifestIdentifier } from "#pantry/schema/contracts.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as foreignAttributes from "#pantry/schema/foreign-attributes.ts";
import * as pkg from "#pantry/schema/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import * as node from "#pantry/schema/node.ts";
import { Qti } from "#pantry/schema/qti.ts";
import { Author } from "#pantry/schema/roles.ts";

const { NodeXmlSpace } = foreignAttributes.relations;

const { DocumentXmlId } = document.relations;

const { ManifestXmlId } = pkg.relations;

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
        [
          ManifestXmlId,
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
        ["ManifestXmlIdAttribute", ManifestXmlId],
      ],
    );
  });

  it("declares no arm", () => {
    assert.deepStrictEqual(foreignAttributes.arms, {});
  });

  it("composes both relations and every statement into the schema", () => {
    assert.strictEqual(Qti.relations.NodeXmlSpace, NodeXmlSpace);
    assert.strictEqual(Qti.relations.DocumentXmlId, DocumentXmlId);
    assert.strictEqual(Qti.relations.ManifestXmlId, ManifestXmlId);
    for (const rule of [...foreignAttributes.rules, ...document.rules, ...pkg.rules]) {
      assert.include(Qti.statements, rule);
    }
  });

  it("lets the Author role write both relations", () => {
    assert.strictEqual(Author.relations.NodeXmlSpace, NodeXmlSpace);
    assert.strictEqual(Author.relations.DocumentXmlId, DocumentXmlId);
    assert.strictEqual(Author.relations.ManifestXmlId, ManifestXmlId);
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

type PackageRule = (typeof pkg.rules)[number];

const packageRulesOf = <K extends PackageRule["kind"]>(kind: K) =>
  pkg.rules.filter(
    (rule): rule is Extract<PackageRule, { readonly kind: K }> => rule.kind === kind,
  );

const packageId = "00000000-0000-4000-8000-000000000003";

describe("the manifest xml:id model", () => {
  it("declares ManifestXmlId in the other ManifestId arms' shape, keyed by (package, id)", () => {
    assert.deepStrictEqual(Object.keys(ManifestXmlId.fields), [
      "attribute",
      "id",
      "kind",
      "node",
      "package",
    ]);
    assert.deepStrictEqual([...ManifestXmlId.primaryKey], ["package", "id"]);
    assert.strictEqual(ManifestXmlId.fields.id, pkg.ManifestIdOfResource.fields.id);
  });

  it("keys ManifestXmlId a second time by node and contains it in Node by the package's tree", () => {
    assert.deepStrictEqual(
      packageRulesOf("key")
        .filter((rule) => rule.relation === ManifestXmlId)
        .map((rule) => [...rule.fields]),
      [["node"]],
    );
    assert.deepStrictEqual(
      packageRulesOf("contained")
        .filter((rule) => rule.left.source === ManifestXmlId)
        .map((rule) => [[...rule.left.fields], rule.right.source, [...rule.right.fields]]),
      [[["node", "package", "kind"], node.Node, ["id", "tree", "kind"]]],
    );
  });

  it("appends xmlId last in the ManifestIdHolder roster", () => {
    assert.strictEqual(pkg.ManifestIdHolder.handles.at(-1), "xmlId");
  });

  it("names ManifestXmlId under xmlId in the ManifestId alternatives", () => {
    const [rule, ...rest] = packageRulesOf("alternatives").filter(
      (candidate) => candidate.parent === pkg.ManifestId,
    );
    assert.strictEqual(rest.length, 0);
    assert.isTrue(
      Predicate.hasProperty(rule, "arms") &&
        Predicate.hasProperty(rule.arms, "xmlId") &&
        rule.arms.xmlId === ManifestXmlId,
    );
  });

  it("holds ManifestId's (package, id) key and its containment into Package", () => {
    assert.deepStrictEqual([...pkg.ManifestId.primaryKey], ["package", "id"]);
    assert.isTrue(
      packageRulesOf("contained").some(
        (rule) =>
          rule.left.source === pkg.ManifestId &&
          rule.right.source === pkg.Package &&
          rule.left.fields.join(",") === "package" &&
          rule.right.fields.join(",") === "id",
      ),
    );
  });

  it("reads xml:id back from the ManifestXmlId rows", () => {
    const rows = Rows.add(new Map(), ManifestXmlId, [
      {
        attribute: "xml:id",
        id: ManifestIdentifier("anchor"),
        kind: "foreign",
        node: nodeId,
        package: packageId,
      },
    ]);
    assert.strictEqual(typedValues(rows)(nodeId, "foreign", "xml:id"), "anchor");
  });

  it("reads xml:id from whichever arm holds the node's row", () => {
    const rows = Rows.add(
      Rows.add(new Map(), DocumentXmlId, [
        { attribute: "xml:id", document: documentId, id: "doc", kind: "foreign", node: nodeId },
      ]),
      ManifestXmlId,
      [
        {
          attribute: "xml:id",
          id: ManifestIdentifier("manifest"),
          kind: "foreign",
          node: documentId,
          package: packageId,
        },
      ],
    );
    const read = typedValues(rows);
    assert.strictEqual(read(nodeId, "foreign", "xml:id"), "doc");
    assert.strictEqual(read(documentId, "foreign", "xml:id"), "manifest");
  });
});
