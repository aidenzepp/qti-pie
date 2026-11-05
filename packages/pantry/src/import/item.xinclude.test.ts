/**
 * The rows of an `xi:include` in item content: the schema mirrors every `xi:include` node into
 * `XInclude` and every `xi:fallback` node into `Fallback`, so a content include needs its arm rows
 * as a processing include does. Each case runs `itemRows` over an inline literal; no database.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect } from "effect";
import { itemRows } from "#pantry/import/item.ts";
import { readRows } from "#pantry/import/preview.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Node } from "#pantry/schema/node.ts";
import { Fallback, XInclude, XIncludeHref, XIncludeParse } from "#pantry/schema/rule.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const xi = `xmlns:xi="http://www.w3.org/2001/XInclude"`;

const contentInclude = `<xi:include ${xi} href="part.xml" parse="xml"><xi:fallback><p>f</p></xi:fallback></xi:include>`;

/**
 * Run `itemRows` over an inline 3.0.1 item.
 *
 * @param body - The markup of the item's `qti-item-body`.
 * @param processing - The markup after the body, such as a response processing.
 * @returns The item's rows.
 */
const itemWith = (body: string, processing = "") =>
  Effect.gen(function* itemWithBody() {
    const doc = yield* readXml(
      new TextEncoder().encode(
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body>${body}</qti-item-body>${processing}</qti-assessment-item>`,
      ),
    );

    return (yield* itemRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "i.xml",
        resource: "i",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version: "3.0.1",
      },
      Rows.empty(),
    )).rows;
  });

/**
 * The two mirrors on the rows: every node of kind `xi:include` has an `XInclude` row with its id
 * and every node of kind `xi:fallback` a `Fallback` row.
 */
const mirrored = (rows: Rows) => {
  const includes = new Set(Rows.of(rows, XInclude).map((row) => row.id));
  const fallbacks = new Set(Rows.of(rows, Fallback).map((row) => row.id));
  const nodes = Rows.of(rows, Node);

  return {
    fallbacks: nodes.filter((node) => node.kind === "xi:fallback"),
    includes: nodes.filter((node) => node.kind === "xi:include"),
    missing: nodes.filter(
      (node) =>
        (node.kind === "xi:include" && !includes.has(node.id)) ||
        (node.kind === "xi:fallback" && !fallbacks.has(node.id)),
    ),
  };
};

describe("itemRows on an xi:include in item content", () => {
  it.effect("writes the include, its href and parse and its fallback", () =>
    Effect.gen(function* body() {
      const rows = yield* itemWith(contentInclude);
      const { fallbacks, includes } = mirrored(rows);

      assert.strictEqual(includes.length, 1);
      assert.strictEqual(fallbacks.length, 1);
      assert.deepStrictEqual(
        Rows.of(rows, XInclude).map((row) => row.id),
        [includes[0]?.id],
      );
      assert.deepStrictEqual(
        Rows.of(rows, XIncludeHref).map((row) => [row.node, row.value]),
        [[includes[0]?.id, "part.xml"]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, XIncludeParse).map((row) => [row.node, row.value]),
        [[includes[0]?.id, "xml"]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, Fallback).map((row) => row.id),
        [fallbacks[0]?.id],
      );
    }),
  );

  it.effect("mirrors every include and fallback node into its arm", () =>
    Effect.gen(function* mirrors() {
      const nested = `<p>x<xi:include ${xi} href="a.xml"><xi:fallback><xi:include href="b.xml"/></xi:fallback></xi:include></p>`;
      const rows = yield* itemWith(`${contentInclude}${nested}`);
      const { includes, missing } = mirrored(rows);

      assert.strictEqual(includes.length, 3);
      assert.deepStrictEqual(missing, []);
      assert.strictEqual(Rows.of(rows, XInclude).length, 3);
    }),
  );

  it.effect("writes one XInclude row per include in response processing", () =>
    Effect.gen(function* processing() {
      const rows = yield* itemWith(
        "<p>x</p>",
        `<qti-response-processing><qti-response-processing-fragment ${xi}><xi:include href="shared.xml" parse="xml"><xi:fallback>f</xi:fallback></xi:include></qti-response-processing-fragment></qti-response-processing>`,
      );
      const { includes, missing } = mirrored(rows);

      assert.strictEqual(includes.length, 1);
      assert.deepStrictEqual(missing, []);
      assert.strictEqual(Rows.of(rows, XInclude).length, 1);
      assert.strictEqual(Rows.of(rows, XIncludeHref).length, 1);
      assert.strictEqual(Rows.of(rows, Fallback).length, 1);
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "readRows on the fallback-3-0-1 fixture",
  (suite) => {
    suite.effect("mirrors every include and fallback node into its arm", () =>
      Effect.gen(function* fixture() {
        const { rows } = yield* readRows(yield* materialize("fallback-3-0-1"));
        const { includes, missing } = mirrored(rows);

        assert.isAbove(includes.length, 0);
        assert.deepStrictEqual(missing, []);
      }),
    );
  },
);
