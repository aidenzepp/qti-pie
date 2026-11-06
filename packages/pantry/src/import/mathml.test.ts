/**
 * The MathML arm and attribute rows (spec MA09): an item is read with `readXml`, walked with
 * `treeRows` and built with `contentRows`, with no database.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { contentRows } from "#pantry/import/content.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { ItemRefusal, Rows, treeRows, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import { AttributeIdref } from "#pantry/schema/attributes.ts";
import { MathmlBaseValue, MathmlCbytesValue } from "#pantry/schema/contracts.ts";
import { DocumentId, HtmlId } from "#pantry/schema/document.ts";
import {
  familyRelation,
  MathmlBase,
  MathmlCbytes,
  MathmlColor,
  MathmlDisplay,
  MathmlLength,
  MathmlMpaddedLength,
  MathmlTableWidth,
} from "#pantry/schema/mathml/attributes.ts";
import { arms, MathmlMaction } from "#pantry/schema/mathml/arms.ts";
import { families } from "#pantry/schema/mathml/values.ts";
import { AttributeLexical, Edge, Node } from "#pantry/schema/node.ts";

const documentId: Uuid = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const mathNamespace = "http://www.w3.org/1998/Math/MathML";

/**
 * Read an item whose body holds `math`, walk it and build its content rows.
 */
const built = (math: string) =>
  Effect.gen(function* run() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" xmlns:m="${mathNamespace}" xmlns:xlink="http://www.w3.org/1999/xlink" identifier="hand" title="Hand" time-dependent="false"><qti-item-body><p>${math}</p></qti-item-body></qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const tree = yield* treeRows(
      doc,
      { charset: doc.charset, id: documentId, kind: "document", root: "item", version: "3.0.1" },
      Rows.empty(),
    );

    return {
      nodes: tree.nodes,
      root: doc.root,
      rows: yield* contentRows(doc.root, tree.nodes, documentId, "item", new Map(), tree.rows),
    };
  });

/**
 * The elements under `element`, itself first, in document order.
 */
const descendants = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? descendants(child) : [])),
];

/**
 * The node of the first element named `qname`.
 */
const nodeNamed = (root: Element, nodes: NodeIndex, qname: string) => {
  const element = descendants(root).find((found) => found.qname === qname);
  const node = element === undefined ? undefined : nodes.get(element);

  return node ?? assert.fail(`no node of ${qname}`);
};

describe("mathmlRows", () => {
  it.effect("gives m:math, m:mfrac and m:mi their node, edge and arm rows", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        "<m:math><m:mfrac><m:mi>x</m:mi><m:mi>y</m:mi></m:mfrac></m:math>",
      );

      for (const [qname, kind, count] of [
        ["m:math", "m:math", 1],
        ["m:mfrac", "m:mfrac", 1],
        ["m:mi", "m:mi", 2],
      ] as const) {
        const node = nodeNamed(root, nodes, qname);
        const arm = arms[kind];

        assert.strictEqual(node.kind, kind);
        assert.strictEqual(Rows.of(rows, arm).length, count);
        assert.isTrue(Rows.of(rows, arm).some((row) => row.id === node.id));
        assert.isTrue(Rows.of(rows, Node).some((row) => row.id === node.id));
        assert.isTrue(Rows.of(rows, Edge).some((edge) => edge.child === node.id));
      }
    }),
  );

  it.effect("writes the actiontype of an m:maction as read", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        '<m:math><m:maction actiontype="toggle"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction></m:math>',
      );
      const node = nodeNamed(root, nodes, "m:maction");

      assert.deepStrictEqual(Rows.of(rows, MathmlMaction), [{ actiontype: "toggle", id: node.id }]);
    }),
  );

  it.effect("refuses a bare m:maction as required-attribute", () =>
    Effect.gen(function* run() {
      const exit = yield* Effect.exit(
        built("<m:math><m:maction><m:mi>a</m:mi></m:maction></m:math>"),
      );

      assert.isTrue(Exit.isFailure(exit));
      if (Exit.isFailure(exit)) {
        const [error] = exit.cause.reasons.flatMap((reason) =>
          reason._tag === "Fail" ? [reason.error] : [],
        );

        assert.instanceOf(error, ItemRefusal);
        assert.strictEqual(error instanceof ItemRefusal ? error.rule : "", "required-attribute");
      }
    }),
  );

  it.effect("writes an m:cbytes value without its spaces and keeps its text node as read", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built("<m:math><m:cbytes>AQID AQID</m:cbytes></m:math>");
      const node = nodeNamed(root, nodes, "m:cbytes");
      const cbytes = descendants(root).find((found) => found.qname === "m:cbytes");

      assert.deepStrictEqual(Rows.of(rows, MathmlCbytes), [
        { id: node.id, value: MathmlCbytesValue("AQIDAQID") },
      ]);
      assert.deepStrictEqual(
        cbytes?.children.map((child) => (child.kind === "text" ? child.value : "")),
        ["AQID AQID"],
      );
    }),
  );

  it.effect("writes no MathML row and refuses nothing for a div under m:annotation-xml", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        '<m:math><m:semantics><m:mi>x</m:mi><m:annotation-xml encoding="application/xhtml+xml"><div>d</div></m:annotation-xml></m:semantics></m:math>',
      );
      const div = nodeNamed(root, nodes, "div");
      const mathmlIds = new Set(
        Object.values(arms).flatMap((arm) => Rows.of(rows, arm).map((row) => row.id)),
      );

      assert.isFalse(mathmlIds.has(div.id));
      assert.isFalse(div.kind.startsWith("m:"));
    }),
  );
});

/**
 * The first failure of an exit.
 */
const failureOf = <A, E>(exit: Exit.Exit<A, E>): E | undefined =>
  Exit.isFailure(exit)
    ? exit.cause.reasons.flatMap((reason) => (reason._tag === "Fail" ? [reason.error] : []))[0]
    : undefined;

describe("mathmlRows attributes", () => {
  it.effect("writes a roster attribute as its family row and nothing else", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built('<m:math display="block"><m:mi>x</m:mi></m:math>');
      const node = nodeNamed(root, nodes, "m:math");

      assert.deepStrictEqual(Rows.of(rows, MathmlDisplay), [
        { attribute: "display", kind: "m:math", node: node.id, value: "block" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );

  it.effect("keeps the spelling of a collapsed attribute in an AttributeLexical row", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        '<m:math display=" block "><m:mi>x</m:mi></m:math>',
      );
      const node = nodeNamed(root, nodes, "m:math");

      assert.deepStrictEqual(Rows.of(rows, MathmlDisplay), [
        { attribute: "display", kind: "m:math", node: node.id, value: "block" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "display", kind: "m:math", node: node.id, value: " block " },
      ]);
    }),
  );

  it.effect("writes the id of an m:math as a DocumentId and an HtmlId row", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built('<m:math id="x"><m:mi>x</m:mi></m:math>');
      const node = nodeNamed(root, nodes, "m:math");

      assert.deepStrictEqual(Rows.of(rows, DocumentId), [
        { document: documentId, holder: "htmlId", id: "x" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, HtmlId), [
        { attribute: "id", document: documentId, id: "x", kind: "m:math", node: node.id },
      ]);
    }),
  );

  it.effect("writes xref as one AttributeIdref row at position 0", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built('<m:math><m:mi xref="a">x</m:mi></m:math>');
      const node = nodeNamed(root, nodes, "m:mi");

      assert.deepStrictEqual(Rows.of(rows, AttributeIdref), [
        { attribute: "xref", document: documentId, node: node.id, position: 0n, target: "a" },
      ]);
    }),
  );

  it.effect("routes width to the family its element's XSD type names", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        '<m:math><m:mspace width="1em"/><m:mpadded width="+1em"><m:mi>x</m:mi></m:mpadded><m:mtable width="auto"/></m:math>',
      );

      for (const [qname, relation, value] of [
        ["m:mspace", MathmlLength, "1em"],
        ["m:mpadded", MathmlMpaddedLength, "+1em"],
        ["m:mtable", MathmlTableWidth, "auto"],
      ] as const) {
        const node = nodeNamed(root, nodes, qname);

        assert.deepStrictEqual(Rows.of(rows, relation), [
          { attribute: "width", kind: node.kind, node: node.id, value },
        ]);
      }
    }),
  );

  it.effect("refuses a roster value outside its roster as attribute-lexical", () =>
    Effect.gen(function* run() {
      const error = failureOf(
        yield* Effect.exit(built('<m:math display="center"><m:mi>x</m:mi></m:math>')),
      );

      assert.instanceOf(error, ImportRefused);
      assert.strictEqual(error instanceof ImportRefused ? error.rule : "", "attribute-lexical");
    }),
  );

  it.effect("writes a contract family and a pattern family as read", () =>
    Effect.gen(function* run() {
      const { nodes, root, rows } = yield* built(
        '<m:math><m:cn base="10">1</m:cn><m:mi mathcolor="#fff">x</m:mi></m:math>',
      );
      const cn = nodeNamed(root, nodes, "m:cn");
      const mi = nodeNamed(root, nodes, "m:mi");

      assert.deepStrictEqual(Rows.of(rows, MathmlBase), [
        { attribute: "base", kind: "m:cn", node: cn.id, value: MathmlBaseValue("10") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, MathmlColor), [
        { attribute: "mathcolor", kind: "m:mi", node: mi.id, value: "#fff" },
      ]);
    }),
  );

  it("has a relation for every family", () => {
    for (const family of families) {
      assert.isTrue(familyRelation.has(family.handle));
    }
  });

  it.effect(
    "refuses display on m:mi in the walk and imports xlink:href on m:mi as a skip foreign attribute",
    () =>
      Effect.gen(function* run() {
        const refused = failureOf(
          yield* Effect.exit(built('<m:math><m:mi display="block">x</m:mi></m:math>')),
        );

        assert.instanceOf(refused, UnmodeledVocabulary);
        assert.strictEqual(refused instanceof UnmodeledVocabulary ? refused.name : "", "display");

        const imported = yield* Effect.exit(
          built('<m:math><m:mi xlink:href="http://example.com/">x</m:mi></m:math>'),
        );

        assert.isTrue(Exit.isSuccess(imported));
      }),
  );
});
