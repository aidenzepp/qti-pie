/**
 * The MathML arm rows (spec MA09, part 1): an item is read with `readXml`, walked with `treeRows`
 * and built with `contentRows`, with no database.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { contentRows } from "#pantry/import/content.ts";
import { ItemRefusal, Rows, treeRows } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import { MathmlCbytesValue } from "#pantry/schema/contracts.ts";
import { MathmlCbytes } from "#pantry/schema/mathml/attributes.ts";
import { arms, MathmlMaction } from "#pantry/schema/mathml/arms.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

const documentId: Uuid = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const mathNamespace = "http://www.w3.org/1998/Math/MathML";

/**
 * Read an item whose body holds `math`, walk it and build its content rows.
 */
const built = (math: string) =>
  Effect.gen(function* run() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" xmlns:m="${mathNamespace}" identifier="hand" title="Hand" time-dependent="false"><qti-item-body><p>${math}</p></qti-item-body></qti-assessment-item>`;
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
