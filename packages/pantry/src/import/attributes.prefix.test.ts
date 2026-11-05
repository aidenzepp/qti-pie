/**
 * Typed global attributes are matched by namespace and local name, never by the prefix an author
 * chose (Namespaces in XML 1.0; decision 280), in memory: each case reads a manifest from an inline
 * literal, runs `treeRows` and then `attributeRows`, and asserts the typed rows by value. No
 * database, no tarball.
 */
import { assert, describe, it } from "@effect/vitest";
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Exit } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { attributeRows } from "#pantry/import/attributes.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import { ForeignAttribute } from "#pantry/schema/foreign.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";
import * as xlink from "#pantry/schema/xlink.ts";

const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lom = "http://ltsc.ieee.org/xsd/LOM";

const xlinkNamespace = "http://www.w3.org/1999/xlink";

const treeId: Uuid = "11111111-1111-4111-8111-111111111111";

/**
 * A manifest whose `imsmd:lom` carries `attributes`, under `declarations`.
 */
const manifestOf = (declarations: string, attributes: string): string =>
  `<manifest xmlns="${cp}" xmlns:imsmd="${lom}" ${declarations} identifier="M"><metadata><imsmd:lom ${attributes}/></metadata><organizations/><resources><resource identifier="r" type="imsqti_item_xmlv3p0" href="a.xml"><file href="a.xml"/></resource></resources></manifest>`;

/**
 * The manifest read, walked by `treeRows` and run through `attributeRows`.
 */
const built = (xml: string) =>
  Effect.gen(function* builtTree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const tree = yield* treeRows(
      doc,
      { charset: doc.charset, id: treeId, kind: "manifest", root: "manifest", version: "3.0.0" },
      Rows.empty(),
    );

    return yield* attributeRows(doc.root, tree.nodes, treeId, tree.rows);
  });

const valuesOf = (found: readonly { readonly value: string }[]) => found.map((row) => row.value);

/**
 * The values of the xlink rows and the lexical rows a manifest writes, by relation.
 */
const typedOf = (xml: string) =>
  Effect.gen(function* typedValues() {
    const rows = yield* built(xml);

    return {
      foreign: Rows.of(rows, ForeignAttribute).map((row) => `${row.namespace}\u0000${row.local}`),
      href: valuesOf(Rows.of(rows, xlink.XlinkHref)),
      lexical: Rows.of(rows, AttributeLexical).map((row) => `${row.attribute}=${row.value}`),
      title: valuesOf(Rows.of(rows, xlink.XlinkTitle)),
      type: valuesOf(Rows.of(rows, xlink.XlinkType)),
    };
  });

const attributesOf = (prefix: string) =>
  `${prefix}:type="simple" ${prefix}:href=" https://example.org/lom " ${prefix}:title=" t "`;

describe("import/attributes.ts typed names by namespace", () => {
  it.effect("reads the xlink prefix as the three typed rows, keeping xlink:title's padding", () =>
    Effect.gen(function* control() {
      const typed = yield* typedOf(
        manifestOf(`xmlns:xlink="${xlinkNamespace}"`, attributesOf("xlink")),
      );

      assert.deepStrictEqual(typed.type, ["simple"]);
      assert.deepStrictEqual(typed.href, ["https://example.org/lom"]);
      assert.deepStrictEqual(typed.title, [" t "]);
      assert.deepStrictEqual(typed.lexical, ["xlink:href= https://example.org/lom "]);
      assert.deepStrictEqual(typed.foreign, []);
    }),
  );

  it.effect("reads xl:href, xl:type and xl:title exactly as the xlink spelling", () =>
    Effect.gen(function* freePrefix() {
      const written = yield* typedOf(
        manifestOf(`xmlns:xl="${xlinkNamespace}"`, attributesOf("xl")),
      );
      const control = yield* typedOf(
        manifestOf(`xmlns:xlink="${xlinkNamespace}"`, attributesOf("xlink")),
      );

      assert.deepStrictEqual(written, control);
      assert.deepStrictEqual(written.title, [" t "]);
    }),
  );

  it.effect("does not read a non-XLink namespace bound to xlink as XLink's href", () =>
    Effect.gen(function* otherNamespace() {
      const exit = yield* Effect.exit(
        typedOf(manifestOf('xmlns:xlink="urn:x"', 'xlink:href="https://example.org/lom"')),
      );

      if (Exit.isSuccess(exit)) {
        assert.deepStrictEqual(exit.value.href, []);
        assert.deepStrictEqual(exit.value.foreign, ["urn:x\u0000href"]);
      } else {
        assert.isTrue(Exit.isFailure(exit));
      }
    }),
  );
});
