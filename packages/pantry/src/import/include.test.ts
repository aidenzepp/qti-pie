import { assert, describe, it } from "@effect/vitest";
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { includeRows } from "#pantry/import/include.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import { XIncludeUri } from "#pantry/schema/contracts.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";
import * as rule from "#pantry/schema/rule.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const documentId: Uuid = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const xiNamespace = "http://www.w3.org/2001/XInclude";

const item = (body: string, processing = ""): string =>
  `<qti-assessment-item xmlns="${itemNamespace}" xmlns:xi="${xiNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body>${body}</qti-item-body>${processing}</qti-assessment-item>`;

const idOf = (nodes: NodeIndex, kind: string): Uuid =>
  Option.getOrThrow(
    Option.fromNullishOr([...nodes.values()].find((found) => found.kind === kind)?.id),
  );

/**
 * An item read and walked by `treeRows`, then run through `includeRows`.
 */
const included = (xml: string) =>
  Effect.gen(function* includedItem() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const tree = yield* treeRows(
      doc,
      { charset: "utf-8", id: documentId, kind: "document", root: "item", version: "3.0.1" },
      Rows.empty(),
    );

    return {
      before: tree.rows,
      nodes: tree.nodes,
      rows: yield* includeRows(doc.root, tree.nodes, tree.rows),
    };
  });

describe("includeRows", () => {
  it.effect("writes the arm, the attributes and the fallback of an include in a body", () =>
    Effect.gen(function* bodyInclude() {
      const { nodes, rows } = yield* included(
        item(
          '<p><xi:include href=" f.xml " parse="xml" xpointer="x"><xi:fallback>t</xi:fallback></xi:include></p>',
        ),
      );
      const include = idOf(nodes, "xi:include");

      assert.deepStrictEqual(Rows.of(rows, rule.XInclude), [{ id: include }]);
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeHref), [
        { node: include, value: XIncludeUri("f.xml") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "href", kind: "xi:include", node: include, value: " f.xml " },
      ]);
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeParse), [{ node: include, value: "xml" }]);
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeXpointer), [{ node: include, value: "x" }]);
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeEncoding), []);
      assert.deepStrictEqual(Rows.of(rows, rule.Fallback), [{ id: idOf(nodes, "xi:fallback") }]);
    }),
  );

  it.effect("writes nothing for an include under response processing", () =>
    Effect.gen(function* processingInclude() {
      const { before, rows } = yield* included(
        item(
          "<p>x</p>",
          '<qti-response-processing><xi:include href="f.xml"/></qti-response-processing>',
        ),
      );

      assert.deepStrictEqual(Rows.of(rows, rule.XInclude), []);
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeHref), []);
      assert.deepStrictEqual(rows, before);
    }),
  );

  it.effect("collapses parse and refuses a value outside its roster under P6", () =>
    Effect.gen(function* parseValues() {
      const { nodes, rows } = yield* included(item('<p><xi:include href="f" parse="text "/></p>'));
      assert.deepStrictEqual(Rows.of(rows, rule.XIncludeParse), [
        { node: idOf(nodes, "xi:include"), value: "text" },
      ]);

      const refused = yield* Effect.flip(
        included(item('<p><xi:include href="f" parse="bogus"/></p>')),
      );
      assert.strictEqual(refused._tag, "ImportRefused");
      assert.strictEqual(refused._tag === "ImportRefused" ? refused.rule : "", "P6");
    }),
  );

  it.effect("returns the rows unchanged for a tree with no include", () =>
    Effect.gen(function* noInclude() {
      const { before, rows } = yield* included(item("<p>x</p>"));

      assert.deepStrictEqual(rows, before);
    }),
  );
});
