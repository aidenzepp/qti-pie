/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { inject } from "vitest";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element } from "@qti-pie/crust/tree.ts";

/**
 * Every element at or below `node`, in document order.
 */
const elements = (node: Element): readonly Element[] => [
  node,
  ...node.children.flatMap((child) => (child.kind === "element" ? elements(child) : [])),
];

/**
 * The concatenated text of the `Text` children of `node`.
 */
const textOf = (node: Element): string =>
  node.children.map((child: Child) => (child.kind === "text" ? child.value : "")).join("");

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
 * The qnames of the attributes of `node`, in order.
 */
const names = (node: Element): readonly string[] =>
  node.attributes.map((attribute) => attribute.qname);

/**
 * The value of the attribute `qname` of `node`.
 */
const attr = (node: Element, qname: string): string | undefined =>
  node.attributes.find((attribute) => attribute.qname === qname)?.value;

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
  suite.effect("reads SIMPLE/choice.xml", () =>
    Effect.gen(function* readChoice() {
      const document = yield* readFixture(inject("fixtures").simple, "choice.xml");

      const declaration = Option.getOrThrow(document.declaration);

      assert.strictEqual(declaration.version, "1.0");
      assert.deepStrictEqual(declaration.encoding, Option.some("UTF-8"));
      assert.isTrue(Option.isNone(declaration.standalone));
      assert.strictEqual(document.charset, "UTF-8");
      assert.isTrue(Option.isNone(document.doctype));
      assert.strictEqual(document.prolog.length, 1);
      assert.strictEqual(document.prolog[0]?.kind, "comment");
      assert.deepStrictEqual(document.epilog, []);
      assert.strictEqual(elements(document.root).length, 17);
      assert.deepStrictEqual(names(document.root), [
        "xmlns",
        "xmlns:xsi",
        "xsi:schemaLocation",
        "identifier",
        "title",
        "adaptive",
        "time-dependent",
      ]);
      assert.strictEqual(document.root.qname, "qti-assessment-item");
      assert.strictEqual(document.root.namespace, "http://www.imsglobal.org/xsd/imsqtiasi_v3p0");
      assert.strictEqual(document.root.attributes[1]?.namespace, "http://www.w3.org/2000/xmlns/");
      assert.strictEqual(
        document.root.attributes[2]?.namespace,
        "http://www.w3.org/2001/XMLSchema-instance",
      );
      assert.deepStrictEqual(document.root.attributes[3]?.references, []);
    }),
  );

  suite.effect("reads SIMPLE/imsmanifest.xml", () =>
    Effect.gen(function* readManifest() {
      const document = yield* readFixture(inject("fixtures").simple, "imsmanifest.xml");

      assert.strictEqual(document.prolog.length, 2);
      assert.isTrue(document.prolog.every((misc) => misc.kind === "comment"));
      assert.strictEqual(elements(document.root).length, 58);
      assert.deepStrictEqual(names(document.root).slice(0, 6), [
        "xmlns",
        "xmlns:imsmd",
        "xmlns:xsi",
        "xmlns:imsqti",
        "identifier",
        "xsi:schemaLocation",
      ]);
    }),
  );

  suite.effect("reads the utf16 variant", () =>
    Effect.gen(function* readUtf16() {
      const directory = yield* materialize("utf16");
      const document = yield* readFixture(directory, "choice.xml");

      assert.strictEqual(document.charset, "UTF-16");
      assert.strictEqual(elements(document.root).length, 17);
    }),
  );

  suite.effect("reads the windows-1252 variant", () =>
    Effect.gen(function* readWindows1252() {
      const directory = yield* materialize("windows-1252");
      const document = yield* readFixture(directory, "choice.xml");

      assert.strictEqual(document.charset, "windows-1252");
      assert.include(textOf(first(document.root, "p")), "\u20AC");
    }),
  );

  suite.effect("reads the latin1 variant", () =>
    Effect.gen(function* readLatin1() {
      const directory = yield* materialize("latin1");
      const document = yield* readFixture(directory, "choice.xml");

      assert.strictEqual(document.charset, "ISO-8859-1");
      assert.include(textOf(first(document.root, "p")), "\u0085");
      assert.include(attr(first(document.root, "img"), "alt") ?? "", "\u20AC");
    }),
  );

  suite.effect("reads the padded-attributes variant verbatim", () =>
    Effect.gen(function* readPaddedAttributes() {
      const directory = yield* materialize("padded-attributes");
      const { root } = yield* readFixture(directory, "choice.xml");

      assert.strictEqual(attr(root, "identifier"), " choice ");
      assert.strictEqual(attr(root, "adaptive"), " false ");
      assert.strictEqual(attr(root, "title"), "Unattended\tLuggage");
      assert.strictEqual(attr(first(root, "img"), "src"), " images/sign.png ");
      assert.strictEqual(attr(first(root, "img"), "alt"), "NEVER\tLEAVE LUGGAGE UNATTENDED");
      assert.strictEqual(
        attr(first(root, "qti-choice-interaction"), "response-identifier"),
        " RESPONSE ",
      );
      assert.strictEqual(attr(first(root, "qti-choice-interaction"), "max-choices"), " 1 ");
      assert.strictEqual(attr(first(root, "qti-simple-choice"), "identifier"), " ChoiceA ");
      assert.strictEqual(
        attr(first(root, "qti-response-processing"), "template"),
        " https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml ",
      );
    }),
  );

  suite.effect("reads the padded-text variant verbatim", () =>
    Effect.gen(function* readPaddedText() {
      const directory = yield* materialize("padded-text");
      const item = yield* readFixture(directory, "choice.xml");
      const manifest = yield* readFixture(directory, "imsmanifest.xml");
      const note = elements(item.root).find(
        (element) =>
          element.qname === "qti-outcome-declaration" && attr(element, "identifier") === "NOTE",
      );

      assert.strictEqual(textOf(first(note ?? item.root, "qti-value")), "a\tb\nc");
      assert.strictEqual(textOf(first(manifest.root, "imsqti:timeDependent")), " false ");
    }),
  );

  suite.effect("applies the ATTLIST default and reads the entity of the doctype variant", () =>
    Effect.gen(function* readDoctype() {
      const directory = yield* materialize("doctype");
      const { root } = yield* readFixture(directory, "choice.xml");

      assert.strictEqual(attr(root, "adaptive"), "false");
      assert.strictEqual(names(root).at(-1), "adaptive");
      assert.include(textOf(first(root, "qti-prompt")), "1EdTech & friends");
    }),
  );

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
