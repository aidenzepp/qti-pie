/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16`) the declarations under test carry, as crust's charset table spells them. */
import { assert, describe, it } from "@effect/vitest";
import { Cause, Effect, Exit, Option } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type {
  Attribute,
  Child,
  Element,
  Misc,
  XmlDeclaration,
  XmlDocument,
} from "@qti-pie/crust/tree.ts";
import { toXmlDocument, unshred } from "#pantry/model/unshred.ts";
import type { ExpandedName, QualifiedName, XdmNames } from "#pantry/model/unshred.ts";
import { none } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  ElementKind,
  FixedKind,
  OpenClass,
  Standalone,
  XdmAttribute,
  XdmAttributeName,
  XdmChild,
  XdmComment,
  XdmDocument,
  XdmDocumentChild,
  XdmElement,
  XdmPi,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";

/**
 * The namespace `xml:` names are in, bound by XML Names whatever the document declares.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The QTI 3 item namespace, the one the toy vocabulary's elements are in.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * A vocabulary of a few handles, for trees written by hand: two of its kinds name an element by
 * another local name than their handle, as a context kind does.
 */
interface Toy extends XdmVocabulary {
  readonly domain: "identifier" | "language" | "string";
  readonly kind: FixedKind | "body" | "body.feedback" | "item" | "p";
  readonly name: OpenClass | "identifier" | "title" | "xml:lang";
  readonly version: "3.0.1";
}

/**
 * The element each toy kind names.
 */
const toyElements: Readonly<Record<ElementKind<Toy>, ExpandedName>> = {
  body: { local: "qti-item-body", namespace: asi },
  "body.feedback": { local: "qti-content-body", namespace: asi },
  item: { local: "qti-assessment-item", namespace: asi },
  p: { local: "p", namespace: asi },
};

/**
 * The attribute each closed toy handle names.
 */
const toyAttributes: Readonly<Record<ClosedName<Toy>, QualifiedName>> = {
  identifier: { local: "identifier", namespace: "", prefix: "" },
  title: { local: "title", namespace: "", prefix: "" },
  "xml:lang": { local: "lang", namespace: xmlNamespace, prefix: "xml" },
};

/**
 * The toy vocabulary's names.
 */
const toyNames: XdmNames<Toy> = {
  attribute: (name) => toyAttributes[name],
  element: (kind) => toyElements[kind],
};

/**
 * A childless toy element with no namespace declarations, attributes or prefix.
 *
 * @param kind - Its kind.
 * @returns The element.
 */
const leaf = (kind: ElementKind<Toy>): XdmElement<Toy> => ({
  _tag: "element",
  attributes: [],
  children: [],
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * A toy document read from UTF-8 with an XML declaration that names it, holding one empty item.
 * Each case spreads it with its own children or charsets.
 */
const base: XdmDocument<Toy> = {
  _tag: "document",
  charset: "UTF-8",
  children: [leaf("item")],
  encoding: "UTF-8",
  exportCharset: "UTF-8",
  standalone: none,
  version: "3.0.1",
  xmlVersion: "1.0",
};

/**
 * A closed toy attribute of the string domain, holding no entity reference.
 *
 * @param handle - Its name's handle.
 * @param lexical - Its lexical form.
 * @returns The attribute.
 */
const closed = (handle: ClosedName<Toy>, lexical: string): XdmAttribute<Toy> => ({
  domain: "string",
  lexical,
  name: { _tag: "closed", handle },
  references: [],
});

/**
 * A vocabulary whose kinds are the expanded names they stand for, so a tree crust read is written
 * in it without a registry and any document round-trips.
 *
 * A kind is its element's name in Clark notation, `{namespace}local`, and a closed name is the
 * attribute's qualified name, unprefixed or `xml:`.
 */
interface Open extends XdmVocabulary {
  readonly domain: "string";
  readonly kind: string;
  readonly name: string;
  readonly version: "3.0.1";
}

/**
 * The open vocabulary's names: each kind's Clark notation split back into its parts, and each
 * closed name's qualified name.
 */
const openNames: XdmNames<Open> = {
  attribute: (name) =>
    name.startsWith("xml:")
      ? { local: name.slice("xml:".length), namespace: xmlNamespace, prefix: "xml" }
      : { local: name, namespace: "", prefix: "" },
  element: (kind) => ({
    local: kind.slice(kind.indexOf("}") + 1),
    namespace: kind.slice(1, kind.indexOf("}")),
  }),
};

/**
 * Name an attribute crust read in the open vocabulary, the way shred classes names: a `data-*`
 * attribute is a `data-*` open name, an unprefixed or `xml:` attribute a closed one, and any other
 * prefixed attribute a `foreign` one.
 *
 * @param attribute - The attribute as crust read it.
 * @returns Its name in the tree.
 */
const openNameOf = (attribute: Attribute): XdmAttributeName<Open> => {
  if (attribute.prefix === "" && attribute.local.startsWith("data-")) {
    return { _tag: "data-*", local: `data-${attribute.local.slice("data-".length)}` };
  }

  return attribute.prefix === "" || attribute.prefix === "xml"
    ? { _tag: "closed", handle: attribute.qname }
    : {
        _tag: "foreign",
        local: attribute.local,
        prefix: attribute.prefix,
        uri: attribute.namespace,
      };
};

/**
 * Write a comment or processing instruction crust read as a tree node.
 *
 * @param misc - The node as crust read it.
 * @returns The node in the tree.
 */
const openMiscOf = (misc: Misc): XdmComment | XdmPi =>
  misc.kind === "comment"
    ? { _tag: "comment", value: misc.text }
    : { _tag: "pi", data: misc.data, target: misc.target };

/**
 * Write an element crust read, and everything below it, as a tree in the open vocabulary: its
 * namespace declarations as the namespace family and every other attribute in source order.
 *
 * @param element - The element as crust read it.
 * @returns The element in the tree; a text run of whitespace only is a `ws` node, and a CDATA
 *   section is text like any other.
 */
const openElementOf = (element: Element): XdmElement<Open> => ({
  _tag: "element",
  attributes: element.attributes
    .filter((attribute) => attribute.prefix !== "xmlns" && attribute.qname !== "xmlns")
    .map((attribute) => ({
      domain: "string",
      lexical: attribute.value,
      name: openNameOf(attribute),
      references: attribute.references,
    })),
  children: element.children.map((child: Child): XdmChild<Open> => {
    switch (child.kind) {
      case "element": {
        return openElementOf(child);
      }
      case "text": {
        return /^[ \t\r\n]+$/u.test(child.value)
          ? { _tag: "ws", value: child.value }
          : { _tag: "text", value: child.value };
      }
      case "entityRef": {
        return { _tag: "entityRef", name: child.name };
      }
      case "comment":
      case "pi": {
        return openMiscOf(child);
      }
      default: {
        return child satisfies never;
      }
    }
  }),
  kind: `{${element.namespace}}${element.local}`,
  namespaces: element.attributes
    .filter((attribute) => attribute.prefix === "xmlns" || attribute.qname === "xmlns")
    .map((attribute) => ({
      prefix: attribute.prefix === "xmlns" ? attribute.local : "",
      uri: attribute.value,
    })),
  prefix: element.prefix,
});

/**
 * The `standalone` values a declaration can be written with.
 */
const standalones: ReadonlyMap<string, Standalone> = new Map([
  ["no", "no"],
  ["yes", "yes"],
]);

/**
 * Write the XML declaration crust read as a document node's fields.
 *
 * @param declaration - The declaration, declaring XML 1.0, when the document has one.
 * @returns The `encoding` as written or empty, the `standalone` as written or `none`, and the
 *   version, or `none` for all three when the document has no declaration.
 */
const declarationFields = (
  declaration: Option.Option<XmlDeclaration>,
): Pick<XdmDocument<Open>, "encoding" | "standalone" | "xmlVersion"> =>
  Option.match(declaration, {
    onNone: () => ({ encoding: "", standalone: none, xmlVersion: none }),
    onSome: ({ encoding, standalone, version }) => ({
      encoding: Option.getOrElse(encoding, () => ""),
      standalone: Option.match(standalone, {
        onNone: () => none,
        onSome: (value) => standalones.get(value) ?? assert.fail(`standalone="${value}"`),
      }),
      xmlVersion: version === "1.0" ? version : assert.fail(`version="${version}"`),
    }),
  });

/**
 * Write a document crust read as a tree in the open vocabulary, the doctype first among the
 * document node's children, and its export label decided as import decides it.
 *
 * @param doc - The document as crust read it.
 * @returns The tree.
 */
const openDocumentOf = (doc: XmlDocument): XdmDocument<Open> => ({
  _tag: "document",
  charset: doc.charset,
  children: [
    ...Option.match(doc.doctype, {
      onNone: (): readonly XdmDocumentChild<Open>[] => [],
      onSome: (value): readonly XdmDocumentChild<Open>[] => [{ _tag: "doctype", value }],
    }),
    ...doc.prolog.map(openMiscOf),
    openElementOf(doc.root),
    ...doc.epilog.map(openMiscOf),
  ],
  exportCharset: exportCharset(doc.charset, doc),
  version: "3.0.1",
  ...declarationFields(doc.declaration),
});

/**
 * Read text as the document crust reads from its UTF-8 bytes.
 *
 * @param text - The document's text.
 * @returns What crust's reader gives.
 */
const read = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * Write each character of text as the one byte its code point is, the bytes of a single-byte
 * charset whose characters are the first 256 code points.
 *
 * @param text - Text whose every code point is below 256.
 * @returns One byte per code point.
 */
const bytesOf = (text: string): readonly number[] =>
  Array.from(text, (character) => character.codePointAt(0) ?? 0);

/**
 * Write text as UTF-16LE led by its byte order mark.
 *
 * @param text - Text whose every character is in the Basic Multilingual Plane.
 * @returns The mark `FF FE`, then each character's two bytes, low byte first.
 */
const utf16le = (text: string): readonly number[] => [
  0xff,
  0xfe,
  ...bytesOf(text).flatMap((unit) => [unit % 0x1_00, Math.floor(unit / 0x1_00)]),
];

/**
 * Decode UTF-8 bytes, so a failed comparison prints two documents.
 *
 * @param bytes - The bytes.
 * @returns Their text.
 */
const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * An item that writes the attribute values whose spelling must survive verbatim: an empty and a
 * padded `headers`, a padded `title`, `class` and ARIA reference, a `shuffle` written `true` and
 * `false` beside one omitted, a `source` with no `src`, and an `xml:lang`.
 */
const synthetic = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="synthetic" title="  Padded   title " label="L  1" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>
  <qti-item-body class=" a   b " id="body">
    <table summary="s"><tbody><tr><td headers="" colspan="2">a</td><td headers=" h1   h2 " aria-labelledby=" x  y " role="gridcell">b</td></tr></tbody></table>
    <qti-order-interaction response-identifier="RESPONSE" shuffle="true"><qti-simple-choice identifier="A" fixed="true">a</qti-simple-choice></qti-order-interaction>
    <qti-order-interaction response-identifier="OTHER"><qti-simple-choice identifier="C">c</qti-simple-choice></qti-order-interaction>
    <qti-order-interaction response-identifier="THIRD" shuffle="false"><qti-simple-choice identifier="D">d</qti-simple-choice></qti-order-interaction>
    <p><picture><source srcset="a.svg" type="image/svg"/><img src="a.png" alt=""/></picture></p>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * An item that writes `src`, `href` and `alt` empty on purpose; each empty value is a value the
 * source wrote.
 */
const explicitEmpty = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="empty" title="Empty" adaptive="false" time-dependent="false">
  <qti-item-body><video><source src="" type="video/mp4"/></video><p><a href="">go</a><img src="a.png" alt=""/></p></qti-item-body>
</qti-assessment-item>`;

/**
 * An item whose values are spelled other than their canonical forms: a padded identifier, a tab in
 * a map key, a padded float, `max-choices=" +5 "`, `match-min="03"` and `match-max="+2"`, and
 * padded text.
 */
const spelled = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier=" v1 " title="Spelled" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"><qti-mapping default-value="0"><qti-map-entry map-key="a&#x9;b" mapped-value=" 0.87 "/></qti-mapping></qti-response-declaration>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices=" +5 "><qti-simple-choice identifier="A">a</qti-simple-choice></qti-choice-interaction>
    <qti-graphic-associate-interaction response-identifier="RESPONSE"><img src="a.png" alt="a"/><qti-associable-hotspot identifier="H1" shape="rect" coords="0,0,5,5" match-max="1" match-min="03"/><qti-associable-hotspot identifier="H2" shape="rect" coords="6,6,9,9" match-max="+2"/></qti-graphic-associate-interaction>
    <p> 0.87 </p>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * A manifest with every part of a prolog and an epilog, a doctype whose external subset lets
 * undeclared entities stand, entity references in attribute values and in content, a `foreign`
 * attribute and a `data-*` one.
 */
const manifest = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE manifest SYSTEM "manifest.dtd">
<!-- prolog -->
<?xml-stylesheet href="a.xsl"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1 imscp.xsd" identifier="&pkg;-1" xml:lang="en" data-x="&a; and &b;"><metadata><schema>QTI &ver; <!-- c --><?p d?></schema></metadata><resources/></manifest>
<!-- epilog --><?done?>`;

/**
 * The documents written with no CDATA section and every namespace declaration before the
 * attributes of its element, which the tree gives back exactly.
 */
const exact = { explicitEmpty, manifest, spelled, synthetic };

/**
 * Read a UTF-8 document, write it in the open vocabulary and unshred it.
 *
 * @param source - The document's text.
 * @returns The text of the bytes unshred writes.
 */
const roundTripped = (source: string) =>
  read(source).pipe(
    Effect.flatMap((doc) => unshred(openDocumentOf(doc), openNames)),
    Effect.map(text),
  );

describe("toXmlDocument", () => {
  it.effect("gives back the tree crust read, for a document the tree records whole", () =>
    Effect.gen(function* givesBackTheTree() {
      for (const [name, source] of Object.entries(exact)) {
        const doc = yield* read(source);

        assert.deepStrictEqual(yield* toXmlDocument(openDocumentOf(doc), openNames), doc, name);
      }
    }),
  );

  it.effect("names each element by its kind, and each closed attribute by its handle", () =>
    Effect.gen(function* namesByTheVocabulary() {
      const tree = yield* toXmlDocument(
        {
          ...base,
          children: [
            {
              ...leaf("item"),
              attributes: [closed("xml:lang", "en")],
              children: [{ ...leaf("body.feedback"), prefix: "q" }],
            },
          ],
        },
        toyNames,
      );

      assert.deepStrictEqual(tree.root, {
        attributes: [
          {
            local: "lang",
            namespace: xmlNamespace,
            prefix: "xml",
            qname: "xml:lang",
            references: [],
            value: "en",
          },
        ],
        children: [
          {
            attributes: [],
            children: [],
            kind: "element",
            local: "qti-content-body",
            namespace: asi,
            prefix: "q",
            qname: "q:qti-content-body",
          },
        ],
        kind: "element",
        local: "qti-assessment-item",
        namespace: asi,
        prefix: "",
        qname: "qti-assessment-item",
      });
    }),
  );

  it.effect("joins adjacent runs of character data into one text run", () =>
    Effect.gen(function* joinsRuns() {
      const doc = yield* read("<a>x<![CDATA[]]]]><![CDATA[>]]>\n<![CDATA[y]]></a>");
      const tree = yield* toXmlDocument(openDocumentOf(doc), openNames);

      assert.lengthOf(doc.root.children, 5);
      assert.deepStrictEqual(tree.root.children, [
        { cdata: false, kind: "text", value: "x]]>\ny" },
      ]);
    }),
  );

  it.effect("writes a tree 100,000 elements deep without recursion", () =>
    Effect.gen(function* writesDeepTrees() {
      const depth = 100_000;
      let deep = leaf("p");
      for (let level = 1; level < depth; level += 1) {
        deep = { ...leaf("p"), children: [deep] };
      }

      const tree = yield* toXmlDocument({ ...base, children: [deep] }, toyNames);
      let reached = 0;
      let below: Child | undefined = tree.root;
      while (below?.kind === "element") {
        reached += 1;
        [below] = below.children;
      }

      assert.strictEqual(reached, depth);
    }),
  );

  it.effect("dies on a document node whose children break its content model", () =>
    Effect.gen(function* diesOutsideTheModel() {
      const doctype: XdmDocumentChild<Toy> = { _tag: "doctype", value: "<!DOCTYPE a>" };
      const comment: XdmDocumentChild<Toy> = { _tag: "comment", value: "c" };
      const cases: readonly (readonly [readonly XdmDocumentChild<Toy>[], string])[] = [
        [[comment], "no element"],
        [[leaf("item"), comment, leaf("item")], "a second element at slot 2"],
        [[leaf("item"), doctype], "a doctype at slot 1 after its element"],
        [[doctype, comment, doctype, leaf("item")], "a doctype at slot 2 after its doctype"],
      ];

      for (const [children, what] of cases) {
        const exit = yield* Effect.exit(toXmlDocument({ ...base, children }, toyNames));

        assert.isTrue(Exit.isFailure(exit) && Cause.hasDies(exit.cause), what);
        assert.include(Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "", what);
      }
    }),
  );
});

describe("unshred", () => {
  it.effect("writes the bytes crust's writer gives the tree crust read", () =>
    Effect.gen(function* writesCrustsBytes() {
      for (const [name, source] of Object.entries(exact)) {
        const doc = yield* read(source);

        assert.strictEqual(
          text(yield* unshred(openDocumentOf(doc), openNames)),
          text(yield* encode(doc, doc.charset)),
          name,
        );
      }
    }),
  );

  it.effect("keeps every lexical form as written and writes no attribute the source omitted", () =>
    Effect.gen(function* keepsLexicalForms() {
      const items = yield* roundTripped(synthetic);
      const empty = yield* roundTripped(explicitEmpty);
      const forms = yield* roundTripped(spelled);

      for (const form of [
        'title="  Padded   title "',
        'label="L  1"',
        'class=" a   b "',
        'headers=""',
        'headers=" h1   h2 "',
        'aria-labelledby=" x  y "',
        'shuffle="false"',
        'xml:lang="en"',
      ]) {
        assert.include(items, form);
      }

      assert.strictEqual(items.split('shuffle="').length - 1, 2);
      assert.notInclude(items, 'src=""');
      assert.include(empty, '<source src="" type="video/mp4"/>');
      assert.include(empty, '<a href="">go</a>');
      assert.include(empty, 'alt=""');
      for (const form of [
        'identifier=" v1 "',
        'map-key="a&#x9;b"',
        'mapped-value=" 0.87 "',
        'max-choices=" +5 "',
        'match-min="03"',
        'match-max="+2"',
        "<p> 0.87 </p>",
      ]) {
        assert.include(forms, form);
      }

      assert.strictEqual(forms.split('match-min="').length - 1, 1);
    }),
  );

  it.effect("writes namespace declarations, then attributes in source order", () =>
    Effect.gen(function* writesSourceOrder() {
      const bytes = yield* unshred(
        {
          ...base,
          children: [
            {
              ...leaf("item"),
              attributes: [
                closed("title", "t"),
                { ...closed("identifier", "i"), domain: "identifier" },
                {
                  domain: "string",
                  lexical: "f",
                  name: { _tag: "foreign", local: "x", prefix: "m", uri: "urn:m" },
                  references: [],
                },
                {
                  domain: "string",
                  lexical: "d",
                  name: { _tag: "data-*", local: "data-z" },
                  references: [],
                },
                {
                  domain: "string",
                  lexical: "l",
                  name: { _tag: "lax", local: "patternMask" },
                  references: [],
                },
                { ...closed("xml:lang", "en"), domain: "language" },
              ],
              namespaces: [
                { prefix: "m", uri: "urn:m" },
                { prefix: "", uri: asi },
              ],
            },
          ],
        },
        toyNames,
      );

      assert.strictEqual(
        text(bytes),
        `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns:m="urn:m" xmlns="${asi}" title="t" identifier="i" m:x="f" data-z="d" patternMask="l" xml:lang="en"/>`,
      );
    }),
  );

  it.effect("writes each recorded entity reference as written and escapes the rest", () =>
    Effect.gen(function* writesReferences() {
      const lexical = '&a;<"\t\n\r& &b;';
      const bytes = yield* unshred(
        {
          ...base,
          children: [
            { _tag: "doctype", value: '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">' },
            {
              ...leaf("item"),
              attributes: [
                {
                  ...closed("title", lexical),
                  references: [
                    { name: "a", offset: 0 },
                    { name: "b", offset: lexical.indexOf("&b;") },
                  ],
                },
              ],
              children: [
                { _tag: "text", value: "x & <y> " },
                { _tag: "entityRef", name: "c" },
              ],
            },
          ],
        },
        toyNames,
      );
      const again = yield* readXml(bytes);
      const [title] = again.root.attributes;

      assert.include(
        text(bytes),
        'title="&a;&lt;&quot;&#x9;&#xA;&#xD;&amp; &b;">x &amp; &lt;y> &c;<',
      );
      assert.deepStrictEqual(title?.value, lexical);
      assert.deepStrictEqual(title?.references, [
        { name: "a", offset: 0 },
        { name: "b", offset: 10 },
      ]);
      assert.deepStrictEqual(again.root.children, [
        { cdata: false, kind: "text", value: "x & <y> " },
        { kind: "entityRef", name: "c" },
      ]);
    }),
  );

  it.effect(
    "writes the doctype after the declaration, then the prolog, the root and the epilog",
    () =>
      Effect.gen(function* writesPrologAndEpilog() {
        const bytes = yield* unshred(
          {
            ...base,
            children: [
              { _tag: "comment", value: " c " },
              { _tag: "doctype", value: '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">' },
              { _tag: "pi", data: "", target: "p" },
              leaf("item"),
              { _tag: "pi", data: "d", target: "q" },
              { _tag: "comment", value: "e" },
            ],
            encoding: "utf-8",
            standalone: "no",
          },
          toyNames,
        );

        assert.strictEqual(
          text(bytes),
          [
            '<?xml version="1.0" encoding="utf-8" standalone="no"?>',
            '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">',
            "<!-- c -->",
            "<?p?>",
            "<qti-assessment-item/>",
            "<?q d?>",
            "<!--e-->",
          ].join("\n"),
        );
      }),
  );

  it.effect("writes no declaration when the document has none, and only the fields it writes", () =>
    Effect.gen(function* writesTheDeclaration() {
      const bare: XdmDocument<Toy> = { ...base, encoding: "", standalone: none, xmlVersion: none };
      const versionOnly: XdmDocument<Toy> = { ...base, encoding: "", standalone: none };

      assert.strictEqual(text(yield* unshred(bare, toyNames)), "<qti-assessment-item/>");
      assert.strictEqual(
        text(yield* unshred(versionOnly, toyNames)),
        '<?xml version="1.0"?>\n<qti-assessment-item/>',
      );
    }),
  );

  it.effect("escapes a ]]> that adjacent runs spell, and writes a CR as a reference", () =>
    Effect.gen(function* escapesAcrossRuns() {
      const bytes = yield* unshred(
        {
          ...base,
          children: [
            {
              ...leaf("p"),
              children: [
                { _tag: "text", value: "a]" },
                { _tag: "text", value: "]>" },
                { _tag: "ws", value: "\r\n" },
              ],
            },
          ],
        },
        toyNames,
      );

      assert.strictEqual(
        text(bytes),
        '<?xml version="1.0" encoding="UTF-8"?>\n<p>a]]&gt;&#xD;\n</p>',
      );
      assert.deepStrictEqual((yield* readXml(bytes)).root.children, [
        { cdata: false, kind: "text", value: "a]]>\r\n" },
      ]);
    }),
  );

  it.effect("writes CDATA, interleaved declarations and a late doctype canonically unchanged", () =>
    Effect.gen(function* canonicallyUnchanged() {
      const sources = [
        '<a xmlns="urn:a" id="1" xmlns:m="urn:m" m:x="2"><![CDATA[<b> & ]]]]><![CDATA[>]]> t</a>',
        '<?xml version="1.0"?><!-- before --><!DOCTYPE a SYSTEM "a.dtd"><a>&e;</a>',
        ...Object.values(exact),
      ];

      for (const source of sources) {
        const doc = yield* read(source);
        const again = yield* readXml(yield* unshred(openDocumentOf(doc), openNames));

        assert.strictEqual(text(canonicalize(again)), text(canonicalize(doc)), source);
      }
    }),
  );
});

describe("unshred's charsets", () => {
  it.effect("writes windows-1252 input as UTF-8, its declaration naming UTF-8", () =>
    Effect.gen(function* writesUtf8() {
      const doc = yield* readXml(
        Uint8Array.from(
          bytesOf('<?xml version="1.0" encoding="windows-1252"?><a t="\u0080">é</a>'),
        ),
      );
      const tree = openDocumentOf(doc);

      assert.deepStrictEqual([tree.charset, tree.exportCharset], ["windows-1252", "UTF-8"]);
      assert.strictEqual(
        text(yield* unshred(tree, openNames)),
        '<?xml version="1.0" encoding="UTF-8"?>\n<a t="€">é</a>',
      );
    }),
  );

  it.effect("keeps ISO-8859-1, writing what it cannot carry as character references", () =>
    Effect.gen(function* writesLatin1() {
      const doc = yield* readXml(
        Uint8Array.from(
          bytesOf('<?xml version="1.0" encoding="ISO-8859-1"?><a t="&#x20AC;é">&#x20AC;é</a>'),
        ),
      );

      assert.deepStrictEqual(
        [...(yield* unshred(openDocumentOf(doc), openNames))],
        bytesOf('<?xml version="1.0" encoding="ISO-8859-1"?>\n<a t="&#x20AC;é">&#x20AC;é</a>'),
      );
    }),
  );

  it.effect("keeps US-ASCII, writing every character above U+007F as a reference", () =>
    Effect.gen(function* writesAscii() {
      const source = '<?xml version="1.0" encoding="US-ASCII"?>\n<a t="&#xE9;">&#xE9;</a>';
      const doc = yield* readXml(Uint8Array.from(bytesOf(source)));

      assert.deepStrictEqual(
        [...(yield* unshred(openDocumentOf(doc), openNames))],
        bytesOf(source),
      );
    }),
  );

  it.effect("writes UTF-16 as read, and UTF-16BE big-endian, each led by its byte order mark", () =>
    Effect.gen(function* writesUtf16() {
      const source = utf16le('<?xml version="1.0" encoding="UTF-16"?>\n<a t="é">é</a>');
      const doc = yield* readXml(Uint8Array.from(source));
      const big = yield* unshred(
        { ...base, charset: "UTF-16BE", encoding: "UTF-16BE", exportCharset: "UTF-16BE" },
        toyNames,
      );

      assert.strictEqual(doc.charset, "UTF-16");
      assert.deepStrictEqual([...(yield* unshred(openDocumentOf(doc), openNames))], source);
      assert.deepStrictEqual([...big.subarray(0, 4)], [0xfe, 0xff, 0x00, 0x3c]);
    }),
  );

  it.effect("fails with crust's EncodeError rather than writing in another label", () =>
    Effect.gen(function* failsToEncode() {
      const latin1 = { ...base, charset: "ISO-8859-1", encoding: "ISO-8859-1" };
      const comment = yield* Effect.flip(
        unshred(
          {
            ...latin1,
            children: [{ _tag: "comment", value: "€" }, leaf("item")],
            exportCharset: "ISO-8859-1",
          },
          toyNames,
        ),
      );
      const label = yield* Effect.flip(
        unshred(
          {
            ...base,
            charset: "windows-1252",
            encoding: "windows-1252",
            exportCharset: "windows-1252",
          },
          toyNames,
        ),
      );

      assert.deepStrictEqual(
        [comment.where, comment.codePoint, comment.threshold],
        ["comment", 0x20_ac, 0xff],
      );
      assert.strictEqual(label.where, "label");
    }),
  );
});
