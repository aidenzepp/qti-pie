/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { SaxesParser } from "saxes";
import { inject } from "vitest";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Child, Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * The events one `saxes` parse reported: every text run in order, every attribute value in order,
 * and every error the parser raised instead of throwing.
 */
interface Observed {
  readonly attributes: readonly string[];
  readonly errors: readonly string[];
  readonly texts: readonly string[];
}

/**
 * Parse `document` with a namespace-aware, position-tracking `SaxesParser` whose `ENTITIES` table
 * holds `entities`, and return what the `text` and `attribute` events carried.
 */
const observe = (entities: Readonly<Record<string, string>>, document: string): Observed => {
  const parser = new SaxesParser({ position: true, xmlns: true });
  const attributes: string[] = [];
  const errors: string[] = [];
  const texts: string[] = [];
  Object.assign(parser.ENTITIES, entities);
  parser.on("attribute", (attribute) => {
    attributes.push(attribute.value);
  });
  parser.on("error", (error) => {
    errors.push(error.message);
  });
  parser.on("text", (text) => {
    texts.push(text);
  });
  parser.write(document).close();

  return { attributes, errors, texts };
};

it.effect("saxes appends ENTITIES replacement text unnormalized and unparsed", () =>
  Effect.sync(() => {
    const observed = observe({ e: "<b>1</b>\n" }, '<a x="&e;">&e;</a>');

    assert.deepStrictEqual(observed.errors, []);
    assert.strictEqual(observed.texts.join(""), "<b>1</b>\n");
    assert.deepStrictEqual(observed.attributes, ["<b>1</b>\n"]);
  }),
);

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

  suite.effect("keeps CDATA, comments and processing instructions in order", () =>
    Effect.gen(function* readMixed() {
      const text =
        '<?xml version="1.0"?><!--a--><?t d?><r>x<![CDATA[<y>]]>z&amp;w<!--c--><e/></r><?u v?>';
      const document: XmlDocument = yield* readXml(new TextEncoder().encode(text));

      assert.deepStrictEqual(document.prolog, [
        { kind: "comment", text: "a" },
        { data: "d", kind: "pi", target: "t" },
      ]);
      assert.deepStrictEqual(document.epilog, [{ data: "v", kind: "pi", target: "u" }]);
      assert.deepStrictEqual(
        document.root.children.map((child) =>
          child.kind === "text" ? [child.cdata, child.value] : child.kind,
        ),
        [[false, "x"], [true, "<y>"], [false, "z&w"], "comment", "element"],
      );
    }),
  );

  suite.effect("reports the position of a well-formedness error", () =>
    Effect.gen(function* readBroken() {
      const error = yield* Effect.flip(readXml(new TextEncoder().encode("<a>\n  </b>")));

      assert.strictEqual(error._tag, "WellFormednessError");
      assert.strictEqual(error._tag === "WellFormednessError" && error.line, 2);
      assert.strictEqual(error._tag === "WellFormednessError" && error.afterSubstitution, false);
    }),
  );

  suite.effect("flags an error after an entity substitution", () =>
    Effect.gen(function* readSubstituted() {
      const text = '<!DOCTYPE a [<!ENTITY e "<b>">]><a>&e;</c></a>';
      const error = yield* Effect.flip(readXml(new TextEncoder().encode(text)));

      assert.strictEqual(error._tag === "WellFormednessError" && error.afterSubstitution, true);
    }),
  );

  /**
   * The failure tag of each file under `fixtures/bad/`.
   */
  const refused: readonly (readonly [string, string])[] = [
    ["01-mismatched-nesting.xml", "WellFormednessError"],
    ["02-unclosed-root.xml", "WellFormednessError"],
    ["03-duplicate-attribute.xml", "WellFormednessError"],
    ["04-undeclared-element-prefix.xml", "WellFormednessError"],
    ["05-undeclared-attribute-prefix.xml", "WellFormednessError"],
    ["06-lt-in-attribute.xml", "WellFormednessError"],
    ["07-undeclared-entity.xml", "WellFormednessError"],
    ["08-control-character.xml", "WellFormednessError"],
    ["09-two-roots.xml", "WellFormednessError"],
    ["10-trailing-content.xml", "WellFormednessError"],
    ["11-prefix-undeclaration.xml", "WellFormednessError"],
    ["12-duplicate-expanded-attribute.xml", "WellFormednessError"],
    ["13-xml-prefix-rebound.xml", "WellFormednessError"],
    ["14-unquoted-attribute.xml", "WellFormednessError"],
    ["15-cdata-end-in-text.xml", "WellFormednessError"],
    ["16-double-hyphen-in-comment.xml", "WellFormednessError"],
    ["17-space-before-declaration.xml", "WellFormednessError"],
    ["18-attribute-without-value.xml", "WellFormednessError"],
    ["19-digit-name-start.xml", "WellFormednessError"],
    ["20-char-ref-nul.xml", "WellFormednessError"],
    ["21-xml-pi-target.xml", "WellFormednessError"],
    ["22-xml-namespace-as-default.xml", "WellFormednessError"],
    ["23-xmlns-prefix-declared.xml", "WellFormednessError"],
    ["24-declaration-only.xml", "WellFormednessError"],
    ["25-two-colons-in-name.xml", "WellFormednessError"],
    ["26-char-ref-surrogate.xml", "WellFormednessError"],
    ["27-version-2.xml", "WellFormednessError"],
    ["28-bare-ampersand.xml", "WellFormednessError"],
  ];

  for (const [file, tag] of refused) {
    suite.effect(`refuses bad/${file}`, () =>
      Effect.gen(function* refuseBad() {
        const fs = yield* FileSystem.FileSystem;
        const bytes = yield* fs.readFile(path.join(import.meta.dirname, "fixtures/bad", file));
        const error = yield* Effect.flip(readXml(bytes));

        assert.strictEqual(error._tag, tag);
      }),
    );
  }
});
