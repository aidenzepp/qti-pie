/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16`, `ISO-8859-1`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { materialize } from "#pantry/test/fixtures.ts";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import { EncodeError } from "@qti-pie/crust/errors.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * Read `choice.xml` of the materialized fixture `name`, returning its bytes and the tree read.
 */
const readChoice = (name: "latin1" | "utf16" | "windows-1252") =>
  Effect.gen(function* readChoiceFixture() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* materialize(name);
    const bytes = yield* fs.readFile(path.join(directory, "choice.xml"));
    const document = yield* readXml(bytes);

    return { bytes, document };
  });

/**
 * The text of the bytes read as latin1, so each byte is one character.
 */
const latin1Text = (bytes: Uint8Array): string => Buffer.from(bytes).toString("latin1");

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
  const found = elements(node).find((candidate) => candidate.qname === qname);

  return found ?? assert.fail(`no <${qname}> in the tree`);
};

/**
 * Replace the children of the first `qname` element below the root of `doc`.
 */
const withChildren = (node: Element, qname: string, children: readonly Child[]): Element =>
  node.qname === qname
    ? { ...node, children }
    : {
        ...node,
        children: node.children.map((child) =>
          child.kind === "element" ? withChildren(child, qname, children) : child,
        ),
      };

/**
 * The text children of `node` concatenated.
 */
const textOf = (node: Element): string =>
  node.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * Run `effect` and return the `EncodeError` it fails with.
 */
const failureOf = <A>(effect: Effect.Effect<A, EncodeError>) =>
  Effect.gen(function* failureOfEffect() {
    const exit = yield* Effect.exit(effect);

    if (Exit.isSuccess(exit)) {
      return assert.fail("expected an EncodeError, the encode succeeded");
    }

    const error = exit.cause.reasons.find((reason) => reason._tag === "Fail")?.error;

    return error instanceof EncodeError ? error : assert.fail("expected an EncodeError");
  });

layer(NodeServices.layer, { excludeTestServices: true })("xml/encode.ts", (suite) => {
  suite.effect("encodes the latin1 fixture back to its bytes' meaning", () =>
    Effect.gen(function* encodeLatin1() {
      const { document } = yield* readChoice("latin1");

      assert.strictEqual(exportCharset("ISO-8859-1", document), "ISO-8859-1");

      const bytes = yield* encode(document, "ISO-8859-1");
      const text = latin1Text(bytes);

      assert.include(text, "\u0085");
      assert.include(text, "&#x20AC;");
      assert.notInclude(text, "€");

      const again = yield* readXml(bytes);

      assert.deepStrictEqual(again, document);
    }),
  );

  suite.effect("refuses U+20AC in a prolog comment under ISO-8859-1", () =>
    Effect.gen(function* encodeLatin1Comment() {
      const { document } = yield* readChoice("latin1");
      const holding: XmlDocument = {
        ...document,
        prolog: [...document.prolog, { kind: "comment", text: " € " }],
      };
      const error = yield* failureOf(encode(holding, "ISO-8859-1"));

      assert.strictEqual(error.where, "comment");
      assert.strictEqual(error.codePoint, 0x20_ac);
      assert.strictEqual(error.threshold, 0xff);
    }),
  );

  suite.effect("encodes the windows-1252 fixture as UTF-8 after the import decision", () =>
    Effect.gen(function* encodeWindows1252() {
      const { document } = yield* readChoice("windows-1252");

      assert.strictEqual(exportCharset("windows-1252", document), "UTF-8");

      const declaration = Option.getOrThrow(document.declaration);
      const exported: XmlDocument = {
        ...document,
        declaration: Option.some({ ...declaration, encoding: Option.some("UTF-8") }),
      };
      const bytes = yield* encode(exported, "UTF-8");
      const again = yield* readXml(bytes);

      assert.deepStrictEqual(again, { ...exported, charset: "UTF-8" });
    }),
  );

  suite.effect("encodes the utf16 fixture with a little-endian byte order mark", () =>
    Effect.gen(function* encodeUtf16() {
      const { document } = yield* readChoice("utf16");
      const bytes = yield* encode(document, "UTF-16");

      assert.strictEqual(bytes[0], 0xff);
      assert.strictEqual(bytes[1], 0xfe);
      assert.deepStrictEqual(yield* readXml(bytes), document);
    }),
  );

  suite.effect("encodes the UTF-16BE label with a big-endian byte order mark", () =>
    Effect.gen(function* encodeUtf16Be() {
      const { document } = yield* readChoice("utf16");
      const declaration = Option.getOrThrow(document.declaration);
      const declared: XmlDocument = {
        ...document,
        declaration: Option.some({ ...declaration, encoding: Option.some("UTF-16BE") }),
      };
      const bytes = yield* encode(declared, "UTF-16BE");

      assert.deepStrictEqual([...bytes.subarray(0, 4)], [0xfe, 0xff, 0x00, 0x3c]);
      assert.deepStrictEqual(yield* readXml(bytes), { ...declared, charset: "UTF-16" });
    }),
  );

  suite.effect("encodes a document as plain UTF-8", () =>
    Effect.gen(function* encodeUtf8() {
      const { document } = yield* readChoice("windows-1252");
      const bytes = yield* encode(document, "UTF-8");

      assert.include(new TextDecoder("utf-8").decode(bytes), "€");
      assert.notStrictEqual(bytes[0], 0xff);
    }),
  );

  suite.effect("encodes under US-ASCII with references above 0x7F", () =>
    Effect.gen(function* encodeAscii() {
      const { document } = yield* readChoice("latin1");
      const error = yield* failureOf(
        encode({ ...document, prolog: [{ kind: "comment", text: "é" }] }, "US-ASCII"),
      );

      assert.strictEqual(error.where, "comment");
      assert.strictEqual(error.threshold, 0x7f);

      const bytes = yield* encode(document, "US-ASCII");

      assert.isTrue(bytes.every((byte) => byte <= 0x7f));
      assert.include(latin1Text(bytes), "&#x85;");
    }),
  );

  suite.effect("fails a decode-only label with where label", () =>
    Effect.gen(function* encodeDecodeOnly() {
      const { document } = yield* readChoice("windows-1252");
      const error = yield* failureOf(encode(document, "windows-1252"));

      assert.strictEqual(error.where, "label");
      assert.strictEqual(error.codePoint, 0);
      assert.strictEqual(error.threshold, 0);
    }),
  );

  suite.effect("closes and reopens a CDATA run around a reference under ISO-8859-1", () =>
    Effect.gen(function* encodeCdata() {
      const { document } = yield* readChoice("latin1");
      const root = withChildren(document.root, "p", [
        { cdata: true, kind: "text", value: "ab€cd" },
      ]);
      const bytes = yield* encode({ ...document, root }, "ISO-8859-1");

      assert.include(latin1Text(bytes), "<![CDATA[ab]]>&#x20AC;<![CDATA[cd]]>");

      const again = yield* readXml(bytes);

      assert.strictEqual(textOf(first(again.root, "p")), "ab€cd");
    }),
  );

  suite.effect(
    "falls back at import and refuses at encode for an entity name above the limit",
    () =>
      Effect.gen(function* encodeEntityName() {
        const { document } = yield* readChoice("latin1");
        const asChild = withChildren(document.root, "p", [{ kind: "entityRef", name: "α" }]);
        const inChild: XmlDocument = { ...document, root: asChild };

        assert.strictEqual(exportCharset("ISO-8859-1", inChild), "UTF-8");
        assert.strictEqual((yield* failureOf(encode(inChild, "ISO-8859-1"))).where, "name");

        const img = first(document.root, "img");
        const referenced = {
          ...img,
          attributes: img.attributes.map((attribute) =>
            attribute.qname === "alt"
              ? {
                  ...attribute,
                  references: [{ name: "α", offset: 0 }],
                  value: "&α;",
                }
              : attribute,
          ),
        };
        const inAttribute: XmlDocument = {
          ...document,
          root: {
            ...document.root,
            children: [...document.root.children, referenced],
          },
        };

        assert.strictEqual(exportCharset("ISO-8859-1", inAttribute), "UTF-8");
        assert.strictEqual((yield* failureOf(encode(inAttribute, "ISO-8859-1"))).where, "name");
      }),
  );
});
