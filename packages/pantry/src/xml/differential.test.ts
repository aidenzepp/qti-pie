/**
 * Crust's reader, canonicalizer and encoder as pantry reads packages with them, checked as
 * properties against libxml2's `xmllint --c14n` on generated documents (matklad's differential
 * oracle: two implementations of one specification, Canonical XML 1.0, must agree on every input),
 * and against themselves by round trip.
 */
import path from "node:path";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, boolean, element, int, string, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Layer, Option } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import { EncodeError } from "@qti-pie/crust/errors.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import { OracleLayer, xmllintC14n } from "#pantry/xml/oracle.ts";

const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The charsets a document is written in, each with its declaration label: UTF-8 with and without
 * a byte order mark, UTF-16 little-endian behind its mark, and the two single-byte labels the
 * corpus and its variants use.
 */
const CHARSETS = ["utf-8", "utf-8-bom", "utf-16le-bom", "iso-8859-1", "windows-1252"] as const;

type Charset = (typeof CHARSETS)[number];

/**
 * The characters character data is drawn from: markup characters that need escaping, the three
 * whitespace characters and a CR LF pair that end-of-line handling folds, U+0085 (NEL, which
 * ISO-8859-1 holds as byte 0x85 and windows-1252 does not), and letters from one, two, three and
 * four UTF-8 bytes. A single-byte charset writes what it cannot hold as a reference.
 */
const textCharacter = element([
  "a",
  "Z",
  " ",
  "\t",
  "\n",
  "\r\n",
  "&",
  "<",
  ">",
  '"',
  "'",
  "é",
  "\u0085",
  "€",
  "𝄞",
] as const);

/**
 * What comments, processing instructions and CDATA sections hold: no reference can stand there,
 * so only characters every charset here encodes, and nothing that would close them.
 */
const quietCharacter = element(["a", "b", " ", "\n", "é", "<", "&"] as const);

const nameOf = element(["a", "b", "item", "x-y", "p:a", "p:b"] as const);

type Misc =
  | Readonly<{ kind: "comment"; text: string }>
  | Readonly<{ data: string; kind: "pi"; target: string }>;

type Content =
  | Misc
  | Readonly<{ kind: "cdata"; text: string }>
  | Readonly<{ kind: "entity" }>
  | Readonly<{ kind: "text"; text: string }>
  | ElementSketch;

/**
 * An element: its name, its attributes in written order (distinct names), whether each value's
 * tabs and line feeds are written raw (which attribute-value normalization turns into spaces) or
 * as references (which it keeps), and its content.
 */
interface ElementSketch {
  readonly attributes: readonly (readonly [name: string, value: string])[];
  readonly children: readonly Content[];
  readonly kind: "element";
  readonly name: string;
  readonly rawWhitespace: boolean;
}

/**
 * A document: its charset, whether it declares itself, an internal subset that declares a default
 * attribute and a general entity, the misc around the root, and the root.
 */
interface DocumentSketch {
  readonly charset: Charset;
  readonly declared: boolean;
  readonly doctype: boolean;
  readonly epilog: readonly Misc[];
  readonly prolog: readonly Misc[];
  readonly root: ElementSketch;
}

const miscOf: Gen<Misc> = weighted<Misc>([
  [
    1,
    (source) => ({
      kind: "comment",
      text: source.draw(string(element(["a", " ", "é"] as const), { max: 6, min: 0 })),
    }),
  ],
  [
    1,
    (source) => ({
      data: source.draw(string(element(["a", " ", "é"] as const), { max: 6, min: 0 })),
      kind: "pi",
      target: source.draw(element(["pi", "app"] as const)),
    }),
  ],
]);

const attributesOf: Gen<ElementSketch["attributes"]> = (source) => {
  const names = ["id", "title", "p:x", "dflt"].filter(() => source.draw(boolean));

  return names.map(
    (name) => [name, source.draw(string(textCharacter, { max: 6, min: 0 }))] as const,
  );
};

/**
 * An element at most `depth` levels deep, its children drawn so that text never sits next to
 * text, which a parser would merge.
 */
const elementOf =
  (depth: number, doctype: boolean): Gen<ElementSketch> =>
  (source) => {
    const count = source.draw(int(0, depth === 0 ? 0 : 3));
    const children: Content[] = [];

    for (let index = 0; index < count; index += 1) {
      const previous = children.at(-1);
      const textual =
        previous?.kind === "text" || previous?.kind === "entity" || previous?.kind === "cdata";
      const options: Gen<Content>[] = [
        (inner) => inner.draw(elementOf(depth - 1, doctype)),
        miscOf,
        ...(textual
          ? []
          : [
              (inner: Parameters<Gen<Content>>[0]): Content => ({
                kind: "text",
                text: inner.draw(string(textCharacter, { max: 6, min: 1 })),
              }),
              (inner: Parameters<Gen<Content>>[0]): Content => ({
                kind: "cdata",
                text: inner.draw(string(quietCharacter, { max: 6, min: 0 })),
              }),
              ...(doctype ? [(): Content => ({ kind: "entity" })] : []),
            ]),
      ];

      children.push(source.draw(options[source.draw(int(0, options.length - 1))] ?? miscOf));
    }

    return {
      attributes: source.draw(attributesOf),
      children,
      kind: "element",
      name: source.draw(nameOf),
      rawWhitespace: source.draw(boolean),
    };
  };

const documentOf: Gen<DocumentSketch> = (source) => {
  const charset = source.draw(element(CHARSETS));
  const doctype = source.draw(boolean);

  return {
    charset,
    // A single-byte document must declare its charset, or it is read as UTF-8.
    declared: charset === "iso-8859-1" || charset === "windows-1252" || source.draw(boolean),
    doctype,
    epilog: source.draw(array(miscOf, { max: 2, min: 0 })),
    prolog: source.draw(array(miscOf, { max: 2, min: 0 })),
    root: source.draw(elementOf(3, doctype)),
  };
};

/**
 * The highest code point each charset writes as itself; the rest are written as references. Only
 * the code points the generator draws are listed for windows-1252: ASCII, é (0xE9) and € (0x80).
 */
const holds: Readonly<Record<Charset, (point: number) => boolean>> = {
  "iso-8859-1": (point) => point <= 0xff,
  "utf-16le-bom": () => true,
  "utf-8": () => true,
  "utf-8-bom": () => true,
  "windows-1252": (point) => point < 0x80 || point === 0xe9 || point === 0x20_ac,
};

/**
 * Where escaped text stands: in character data, or in an attribute value whose tabs and line feeds
 * are written raw or as references.
 */
type Place = Readonly<{ kind: "text" }> | Readonly<{ kind: "attribute"; raw: boolean }>;

/**
 * The markup characters character data and attribute values write as references.
 */
const MARKUP: ReadonlyMap<string, string> = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  [">", "&gt;"],
]);

/**
 * Character data or an attribute value as markup: `&`, `<` and `>` as references, `"` too inside
 * an attribute, a character the charset cannot hold as a reference, and in an attribute value
 * each tab and line feed raw or as a reference.
 */
const escaped = (value: string, charset: Charset, place: Place) =>
  Array.from(value, (char) => {
    const point = char.codePointAt(0) ?? 0;
    const reference = MARKUP.get(char);

    if (reference !== undefined) {
      return reference;
    }

    if (place.kind === "attribute" && char === '"') {
      return "&quot;";
    }

    if (
      place.kind === "attribute" &&
      !place.raw &&
      (char === "\t" || char === "\n" || char === "\r")
    ) {
      return `&#${point};`;
    }

    return holds[charset](point) ? char : `&#x${point.toString(16)};`;
  }).join("");

const miscText = (misc: Misc): string =>
  misc.kind === "comment"
    ? `<!--${misc.text}-->`
    : `<?${misc.target}${misc.data === "" ? "" : ` ${misc.data}`}?>`;

const elementText = (sketch: ElementSketch, charset: Charset): string => {
  // One child of an element as markup.
  const contentText = (child: Content): string => {
    if (child.kind === "element") {
      return elementText(child, charset);
    }

    if (child.kind === "text") {
      return escaped(child.text, charset, { kind: "text" });
    }

    if (child.kind === "cdata") {
      return `<![CDATA[${child.text}]]>`;
    }

    return child.kind === "entity" ? "&e;" : miscText(child);
  };

  const prefixed =
    sketch.name.startsWith("p:") || sketch.attributes.some(([name]) => name.startsWith("p:"));
  const attributes = [
    ...(prefixed ? ([["xmlns:p", "urn:example:p"]] as const) : []),
    ...sketch.attributes,
  ]
    .map(
      ([name, value]) =>
        ` ${name}="${escaped(value, charset, { kind: "attribute", raw: sketch.rawWhitespace })}"`,
    )
    .join("");
  const children = sketch.children.map(contentText).join("");

  return `<${sketch.name}${attributes}>${children}</${sketch.name}>`;
};

const LABELS: Readonly<Record<Charset, string>> = {
  "iso-8859-1": "ISO-8859-1",
  "utf-16le-bom": "UTF-16",
  "utf-8": "utf-8",
  "utf-8-bom": "utf-8",
  "windows-1252": "windows-1252",
};

/**
 * A document's text: its declaration, its internal subset, which gives every root element named
 * `a` a default `dflt` attribute and declares the entity `e`, its misc and its root. The root is
 * always named `a` under a doctype, so the default applies to it.
 */
const documentText = (sketch: DocumentSketch): string => {
  const root = sketch.doctype ? { ...sketch.root, name: "a" } : sketch.root;
  const declaration = sketch.declared
    ? `<?xml version="1.0" encoding="${LABELS[sketch.charset]}"?>\n`
    : "";
  const doctype = sketch.doctype
    ? `<!DOCTYPE a [\n<!ATTLIST a dflt CDATA "fallback value">\n<!ENTITY e "an entity &#38;amp; its text">\n]>\n`
    : "";

  return `${declaration}${doctype}${sketch.prolog.map(miscText).join("")}${elementText(root, sketch.charset)}${sketch.epilog.map(miscText).join("")}`;
};

/**
 * Windows-1252's bytes for the code points the generator draws beyond ASCII.
 */
const WINDOWS_1252: ReadonlyMap<number, number> = new Map([
  [0xe9, 0xe9],
  [0x20_ac, 0x80],
]);

/**
 * Each charset's encoder, written here and not by crust's: UTF-16 little-endian is Node's.
 */
const ENCODERS: Readonly<Record<Charset, (text: string) => Uint8Array>> = {
  "iso-8859-1": (text) => Uint8Array.from(Array.from(text, (char) => char.codePointAt(0) ?? 0)),
  "utf-16le-bom": (text) => Uint8Array.from([0xff, 0xfe, ...Buffer.from(text, "utf16le")]),
  "utf-8": (text) => new TextEncoder().encode(text),
  "utf-8-bom": (text) => Uint8Array.from([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(text)]),
  "windows-1252": (text) =>
    Uint8Array.from(
      Array.from(text, (char) => {
        const point = char.codePointAt(0) ?? 0;

        return WINDOWS_1252.get(point) ?? point;
      }),
    ),
};

const documentBytes = (sketch: DocumentSketch): Uint8Array =>
  ENCODERS[sketch.charset](documentText(sketch));

type Reached =
  | "decode-only"
  | "written-as-read"
  | Charset
  | "doctype"
  | "entity"
  | "cdata"
  | "comment"
  | "pi"
  | "raw-whitespace"
  | "namespace"
  | "nested";

const reachedBy = (sketch: DocumentSketch): readonly Reached[] => {
  const all: Content[] = [];
  const walk = (node: ElementSketch): void => {
    for (const child of node.children) {
      all.push(child);
      if (child.kind === "element") {
        walk(child);
      }
    }
  };

  walk(sketch.root);

  return [
    sketch.charset,
    ...(sketch.doctype ? ["doctype" as const] : []),
    ...all.flatMap((child): readonly Reached[] =>
      child.kind === "entity" ||
      child.kind === "cdata" ||
      child.kind === "comment" ||
      child.kind === "pi"
        ? [child.kind]
        : [],
    ),
    ...(sketch.prolog.length + sketch.epilog.length > 0 ? ["comment" as const] : []),
    ...(sketch.root.rawWhitespace && sketch.root.attributes.length > 0
      ? ["raw-whitespace" as const]
      : []),
    ...(documentText(sketch).includes("xmlns:p") ? ["namespace" as const] : []),
    ...(all.some(
      (child) =>
        child.kind === "element" && child.children.some((inner) => inner.kind === "element"),
    )
      ? ["nested" as const]
      : []),
  ];
};

describe("crust's reader as pantry uses it", () => {
  it.effect(
    "canonicalize(readXml(bytes)) is xmllint --c14n's canonical form of the same bytes",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchDocuments() {
          const fs = yield* FileSystem.FileSystem;

          yield* fs.makeDirectory(workDirectory, { recursive: true });

          const directory = yield* fs.makeTempDirectoryScoped({
            directory: workDirectory,
            prefix: "c14n-",
          });

          return yield* explore(
            {
              caseHang: Duration.seconds(30),
              concurrency: 1,
              coverage: required<Reached>(
                [
                  ...CHARSETS,
                  "doctype",
                  "entity",
                  "cdata",
                  "comment",
                  "pi",
                  "raw-whitespace",
                  "namespace",
                  "nested",
                  "decode-only",
                  "written-as-read",
                ],
                { cases: 500, sense: notesOnly },
              ),
              draw: drawn(documentOf),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "libxml2's xmllint --c14n (Canonical XML 1.0), with the written attribute order and the encode round trip",
              },
              runs: 200,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/xml/c14n-against-xmllint",
            },
            (sketch, c) =>
              Effect.gen(function* agree() {
                c.noteAll(reachedBy(sketch));

                const bytes = documentBytes(sketch);
                const file = `${directory}/case.xml`;

                yield* fs.writeFile(file, bytes);

                const document = yield* readXml(bytes);
                const decoder = new TextDecoder();

                assert.strictEqual(
                  decoder.decode(canonicalize(document)),
                  decoder.decode(yield* xmllintC14n(file)),
                );

                // The root's attributes in document order, a namespace declaration included, and a
                // default the internal subset supplies after them (crust's tree promises this order;
                // canonical form sorts it away).
                const root = sketch.doctype ? { ...sketch.root, name: "a" } : sketch.root;
                const written = root.attributes.map(([name]) => name);

                assert.deepStrictEqual(
                  document.root.attributes.map((attribute) => attribute.qname),
                  [
                    ...(root.name.startsWith("p:") || written.some((name) => name.startsWith("p:"))
                      ? ["xmlns:p"]
                      : []),
                    ...written,
                    ...(sketch.doctype && !written.includes("dflt") ? ["dflt"] : []),
                  ],
                );

                // The round trip through crust's encoder under the charset the importer exports
                // in (the document's own, or UTF-8 for a label crust only decodes), its
                // declaration naming that charset as encode's contract asks, reads back as the
                // same tree.
                const label = exportCharset(document.charset, document);

                // crust's contract: a label it only decodes (windows-1252 here) is refused for
                // writing with an EncodeError naming no code point, and the importer exports such a
                // document as UTF-8 instead. A label it writes is its own export charset.
                if (label === document.charset) {
                  c.note("written-as-read");
                } else {
                  c.note("decode-only");

                  const refusal = yield* Effect.flip(encode(document, document.charset));

                  assert.instanceOf(refusal, EncodeError);
                }

                const exported = {
                  ...document,
                  declaration: document.declaration.pipe(
                    Option.map((declaration) => ({
                      ...declaration,
                      encoding:
                        label === document.charset ? declaration.encoding : Option.some(label),
                    })),
                  ),
                };
                const again = yield* readXml(yield* encode(exported, label));

                // A charset label is matched without regard to case, and crust labels a document
                // by its byte order mark when it has one and by its declaration's spelling when not.
                assert.strictEqual(again.charset.toLowerCase(), label.toLowerCase());
                assert.deepStrictEqual(again, { ...exported, charset: again.charset });
              }),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    { timeout: 300_000 },
  );
});
