/**
 * The attribute pass over a response processing template tree (decision 183 b), in memory: each
 * case reads a template document from an inline literal with `readXml`, runs `rptemplateRows` and
 * reads the rows by relation and value, or renders the tree back with `renderTree`. No database, no
 * tarball. The literal is the shape of `rptemplates/match_correct.xml` with a `qti-custom-operator`
 * and a foreign element under it carrying the typed `xml:*` attributes.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { renderTree } from "#pantry/export/render.ts";
import { itemRows } from "#pantry/import/item.ts";
import { rptemplateRows } from "#pantry/import/rptemplate.ts";
import { Rows } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { DocumentId, DocumentXmlId } from "#pantry/schema/document.ts";
import { NodeXmlSpace } from "#pantry/schema/foreign-attributes.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

const decode = (xml: string) => readXml(new TextEncoder().encode(xml));

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * The processing of the template: a condition whose test is a custom operator over `true`, with the
 * foreign element `ma:ext` under it, and a score set when it holds.
 */
const processing = (operatorAttributes: string): string =>
  `<qti-response-condition><qti-response-if><qti-custom-operator class="org.example.Op"${operatorAttributes}><qti-base-value base-type="boolean">true</qti-base-value><ma:ext xmlns:ma="${mathassess}" xml:lang="fr" xml:space="preserve" xml:id="t1"/></qti-custom-operator><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`;

const template = (operatorAttributes: string): string =>
  `<qti-response-processing xmlns="${asi}">${processing(operatorAttributes)}</qti-response-processing>`;

const item = (operatorAttributes: string): string =>
  `<qti-assessment-item xmlns="${asi}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-processing>${processing(operatorAttributes)}</qti-response-processing></qti-assessment-item>`;

const templateOf = (xml: string) =>
  Effect.gen(function* templateTree() {
    const doc = yield* decode(xml);
    const built = yield* rptemplateRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "rptemplates/t.xml",
        resource: "t",
        resourceType: "imsqti_rptemplate_xmlv3p0",
        version: "3.0.0",
      },
      Rows.empty(),
    );

    return { ...built, doc };
  });

const itemOf = (xml: string) =>
  Effect.gen(function* itemTree() {
    const doc = yield* decode(xml);
    const built = yield* itemRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "items/i.xml",
        resource: "i",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version: "3.0.0",
      },
      Rows.empty(),
    );

    return { ...built, doc };
  });

const descend = (element: Element, qname: string): Element | undefined => {
  if (element.qname === qname) {
    return element;
  }

  return element.children
    .filter((child): child is Element => child.kind === "element")
    .map((child) => descend(child, qname))
    .find((found) => found !== undefined);
};

const idOf = (nodes: NodeIndex, root: Element, qname: string): Uuid => {
  const element = descend(root, qname);
  assert.isDefined(element, `the tree holds ${qname}`);

  const node = nodes.get(element);
  assert.isDefined(node, `${qname} has a node`);

  return node.id;
};

/**
 * The values of `rows` on `node`, in row order.
 */
const valuesOn = (rows: readonly { node: Uuid; value: string }[], node: Uuid) =>
  rows.filter((row) => row.node === node).map((row) => row.value);

const operatorAttributes = ' xml:lang="en"';

describe("import/rptemplate.ts the attribute pass over a template tree", () => {
  it.effect("writes the typed xml attributes of the operator and its foreign child", () =>
    Effect.gen(function* typedAttributes() {
      const { doc, documentId, nodes, rows } = yield* templateOf(template(operatorAttributes));
      const operator = idOf(nodes, doc.root, "qti-custom-operator");
      const extension = idOf(nodes, doc.root, "ma:ext");

      assert.deepStrictEqual(valuesOn(Rows.of(rows, NodeXmlLang), operator), ["en"]);
      assert.deepStrictEqual(valuesOn(Rows.of(rows, NodeXmlLang), extension), ["fr"]);
      assert.deepStrictEqual(valuesOn(Rows.of(rows, NodeXmlSpace), extension), ["preserve"]);
      assert.deepStrictEqual(Rows.of(rows, DocumentId), [
        { document: documentId, holder: "xmlId", id: "t1" },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, DocumentXmlId).map(({ document, id, node }) => ({ document, id, node })),
        [{ document: documentId, id: "t1", node: extension }],
      );
    }),
  );

  it.effect("renders the template tree back to its source", () =>
    Effect.gen(function* roundTrip() {
      const source = template(operatorAttributes);
      const { doc, documentId, rows } = yield* templateOf(source);

      assert.strictEqual(text(canonicalize(renderTree(rows, documentId))), text(canonicalize(doc)));
      assert.include(text(canonicalize(renderTree(rows, documentId))), 'xml:lang="en"');
    }),
  );

  it.effect("writes the operator the rows an item's operator gets", () =>
    Effect.gen(function* parity() {
      const inTemplate = yield* templateOf(template(operatorAttributes));
      const inItem = yield* itemOf(item(operatorAttributes));
      const familyRows = (tree: typeof inTemplate | typeof inItem) => {
        const operator = idOf(tree.nodes, tree.doc.root, "qti-custom-operator");
        const extension = idOf(tree.nodes, tree.doc.root, "ma:ext");

        return {
          lang: valuesOn(Rows.of(tree.rows, NodeXmlLang), operator),
          langOfForeign: valuesOn(Rows.of(tree.rows, NodeXmlLang), extension),
          space: valuesOn(Rows.of(tree.rows, NodeXmlSpace), extension),
          xmlId: Rows.of(tree.rows, DocumentXmlId).map((row) => row.id),
        };
      };

      assert.deepStrictEqual(familyRows(inTemplate), familyRows(inItem));
    }),
  );

  it.effect("keeps a padded xml:lang as an AttributeLexical row", () =>
    Effect.gen(function* paddedLang() {
      const { doc, nodes, rows } = yield* templateOf(template(' xml:lang=" en "'));
      const operator = idOf(nodes, doc.root, "qti-custom-operator");

      assert.deepStrictEqual(valuesOn(Rows.of(rows, NodeXmlLang), operator), ["en"]);
      assert.deepStrictEqual(
        Rows.of(rows, AttributeLexical)
          .filter((row) => row.node === operator && row.attribute === "xml:lang")
          .map((row) => row.value),
        [" en "],
      );
    }),
  );
});
