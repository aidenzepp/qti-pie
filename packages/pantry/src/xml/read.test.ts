/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { materialize } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * Every element at or below `node`, in document order.
 */
const elements = (node: Element): readonly Element[] => [
  node,
  ...node.children.flatMap((child) => (child.kind === "element" ? elements(child) : [])),
];

/**
 * The first element named `qname` at or below `node`.
 */
const first = (node: Element, qname: string): Element => {
  const found = elements(node).find((element) => element.qname === qname);
  if (found === undefined) {
    throw new Error(`no <${qname}> in the tree`);
  }

  return found;
};

/**
 * Read one file of a materialized fixture directory.
 */
const readFixture = (directory: string, file: string) =>
  Effect.gen(function* readFixtureFile() {
    const fs = yield* FileSystem.FileSystem;
    const bytes = yield* fs.readFile(path.join(directory, file));

    return yield* readXml(bytes);
  });

layer(NodeServices.layer, { excludeTestServices: true })("xml/read.ts", (suite) => {
  suite.effect("reads the external variant with its undeclared references as sentinels", () =>
    Effect.gen(function* readExternal() {
      const directory = yield* materialize("external");
      const { root } = yield* readFixture(directory, "choice.xml");
      const prompt = first(root, "qti-prompt");
      const alt = first(root, "img").attributes.find((attribute) => attribute.qname === "alt");

      assert.deepStrictEqual(prompt.children, [
        { cdata: false, kind: "text", value: "What does it say? " },
        { kind: "entityRef", name: "undeclared" },
      ]);
      assert.strictEqual(alt?.value, "NEVER LEAVE LUGGAGE &undeclared;");
      assert.deepStrictEqual(alt?.references, [{ name: "undeclared", offset: 20 }]);
    }),
  );
});
