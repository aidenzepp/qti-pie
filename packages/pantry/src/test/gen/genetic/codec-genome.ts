/* oxlint-disable unicorn/text-encoding-identifier-case -- The codec search spells encoding labels (`UTF-8`, `UTF-16LE`) as XML 1.0 section 4.3.3 and crust's trees spell them: they are the data under test, not names passed to a Node encoding API. */
/**
 * The codec search's genome: an XML document as the intentions its source text is written from,
 * not as bytes and not as crust's tree. Crust's tree is what a reader resolved: it has no
 * character reference, no reference to a declared entity, no internal subset and no attribute
 * default, which are exactly what a reader and a writer can get wrong. So the genome holds the
 * source's parts: the XML declaration, the doctype with its external subset and its internal
 * subset's declarations (general and parameter entities, attribute lists with their types and
 * defaults, element declarations, comments and processing instructions), the comments and
 * processing instructions around the root, and the root's tree, every text, attribute value,
 * namespace name and literal a list of pieces: plain text, a character reference, an entity
 * reference, a reference whose `&` is escaped, or a token of XML's own syntax spliced in as
 * written.
 *
 * {@link rendered} writes a genome to bytes in one of the charsets crust reads, and every oracle of
 * `#pantry/test/gen/genetic/codec-judge.ts` judges those bytes. The renderer escapes nothing a
 * piece means to write: a text piece is escaped only as its context's syntax needs, and a token is
 * written as it is, so a genome can spell any source text, well-formed or not, and the oracles,
 * not the renderer, decide what it means.
 *
 * The edits ({@link mutationOf}) breed a genome near its parent: the tree's (insert, delete, move,
 * duplicate, wrap and graft from a mate), the attributes' and namespaces', the pieces' (insert,
 * delete or replace one from the dictionaries), and the prolog's and the internal subset's (add,
 * drop, move or edit a declaration, take one from a mate, toggle the doctype, its subsets, the
 * declaration, `standalone`, the encoding label and the charset). The dictionaries hold XML's own
 * syntax and the code points its productions turn on, never an input a known defect needs: the
 * search reaches what it reaches by construction and novelty.
 */
import { Option } from "effect";
import type { Source } from "@grizzle/testing/source";
import type { Attribute, Child, XmlDocument } from "@qti-pie/crust/tree.ts";
import { below, oneOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Edited } from "#pantry/test/gen/genetic/engine.ts";

/**
 * A generator on the choice stream.
 */
type Gen<A> = (source: Source) => A;

/**
 * How a literal `&` of an escaped reference is written.
 */
export type Spelling = "&amp;" | "&#38;" | "&#x26;";

/**
 * One piece of a text, an attribute value, a namespace name or a literal:
 *
 * - `text`: characters, escaped only as the context's syntax needs (`&` and `<` in content, the quote
 *   and `&` and `<` in a value, `&`, `%` and the quote in an entity value);
 * - `charref`: a character reference, decimal or hexadecimal, to any number, a character XML forbids
 *   included;
 * - `ref`: an entity reference `&name;`, declared, predefined or not;
 * - `escaped`: the text of a reference with its `&` escaped, `&amp;name;`, which names no entity;
 * - `token`: a token of XML's syntax, written as it is.
 */
export type Piece =
  | { readonly _tag: "charref"; readonly code: number; readonly hex: boolean }
  | { readonly _tag: "escaped"; readonly name: string; readonly spelling: Spelling }
  | { readonly _tag: "ref"; readonly name: string }
  | { readonly _tag: "text"; readonly value: string }
  | { readonly _tag: "token"; readonly value: string };

/**
 * A quote a literal is written between.
 */
export type Quote = '"' | "'";

/**
 * An attribute as written: its qualified name, its quote and its value's pieces.
 */
export interface Attr {
  readonly _tag: "attribute";
  readonly name: string;
  readonly pieces: readonly Piece[];
  readonly quote: Quote;
}

/**
 * A namespace declaration as written: its prefix (empty for the default namespace) and the
 * namespace name's pieces.
 */
export interface Namespace {
  readonly _tag: "namespace";
  readonly pieces: readonly Piece[];
  readonly prefix: string;
}

/**
 * An element as written: its qualified name, its attributes and namespace declarations in the
 * order written, interleaved as written, and its children.
 */
export interface ElementNode {
  readonly _tag: "element";
  readonly attributes: readonly (Attr | Namespace)[];
  readonly children: readonly Node[];
  readonly name: string;
}

/**
 * A comment or a processing instruction, which stand anywhere: in the body, around the root and in
 * the internal subset.
 */
export type Misc =
  | { readonly _tag: "comment"; readonly text: string }
  | { readonly _tag: "pi"; readonly data: string; readonly target: string };

/**
 * One node of the root's tree: an element, character data as pieces, a CDATA section, or a
 * comment or a processing instruction.
 */
export type Node =
  | ElementNode
  | Misc
  | { readonly _tag: "cdata"; readonly value: string }
  | { readonly _tag: "text"; readonly pieces: readonly Piece[] };

/**
 * An attribute's declared type in an attribute-list declaration.
 */
export type AttType =
  | "(a|b)"
  | "CDATA"
  | "ENTITY"
  | "ID"
  | "IDREF"
  | "IDREFS"
  | "NMTOKEN"
  | "NMTOKENS";

/**
 * An attribute's default declaration: `#IMPLIED`, `#REQUIRED`, or a value, `#FIXED` or not.
 */
export type AttDefault =
  | { readonly _tag: "implied" }
  | { readonly _tag: "required" }
  | {
      readonly _tag: "value";
      readonly fixed: boolean;
      readonly pieces: readonly Piece[];
      readonly quote: Quote;
    };

/**
 * One declaration of the internal subset, in the order written.
 */
export type Declaration =
  | Misc
  | {
      readonly _tag: "attlist";
      readonly attribute: string;
      readonly default: AttDefault;
      readonly element: string;
      readonly type: AttType;
    }
  | { readonly _tag: "elementDecl"; readonly content: string; readonly name: string }
  | {
      readonly _tag: "entity";
      readonly name: string;
      readonly parameter: boolean;
      readonly pieces: readonly Piece[];
      readonly quote: Quote;
    }
  | { readonly _tag: "peref"; readonly name: string };

/**
 * A document type declaration: the root name it names, whether it names an external subset
 * (`SYSTEM "…"`, never read), and its internal subset, when it writes one.
 */
export interface Doctype {
  readonly external: boolean;
  readonly name: string;
  readonly subset: Option.Option<readonly Declaration[]>;
}

/**
 * An XML declaration: its encoding label and its `standalone`, each as written or absent.
 */
export interface Declared {
  readonly encoding: Option.Option<string>;
  readonly standalone: Option.Option<"no" | "yes">;
}

/**
 * How a genome's text becomes bytes: UTF-8 with or without a byte order mark, UTF-16 in either
 * order with one or without one (which a reader finds by XML 1.0 Appendix F's patterns, only when a
 * declaration comes first), or a single-byte charset, whose characters above its range are written
 * as character references where a reference is possible and as `?` elsewhere.
 */
export const charsets = [
  "UTF-8",
  "UTF-8 BOM",
  "UTF-16LE BOM",
  "UTF-16BE BOM",
  "UTF-16LE",
  "UTF-16BE",
  "ISO-8859-1",
  "US-ASCII",
] as const;

/**
 * One of {@link charsets}.
 */
export type Charset = (typeof charsets)[number];

/**
 * A document as the search breeds it.
 */
export interface CodecGenome {
  readonly charset: Charset;
  readonly declaration: Option.Option<Declared>;
  readonly doctype: Option.Option<Doctype>;
  readonly epilog: readonly Misc[];
  readonly prolog: readonly Misc[];
  readonly root: ElementNode;
}

/**
 * The namespace name of namespace declarations, which crust reads as attributes.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The labels an XML declaration's encoding is drawn from: each charset's, spelled as XML 1.0
 * section 4.3.3 and IANA spell them, in either case.
 */
export const labels = [
  "UTF-8",
  "utf-8",
  "UTF-16",
  "UTF-16LE",
  "UTF-16BE",
  "ISO-8859-1",
  "latin1",
  "US-ASCII",
] as const;

/**
 * The characters a text piece is drawn from: plain ones; each line end and the tab; each
 * character an escape or a production turns on; one of each UTF-8 width; the no-break space,
 * U+0085 and U+2028, which XML 1.0 does not treat as line ends; and U+FFFD.
 */
const characters = [
  "a",
  "b",
  " ",
  "\t",
  "\n",
  "\r",
  "\r\n",
  "]",
  ">",
  '"',
  "'",
  "%",
  ";",
  "#",
  "é",
  "Ā",
  "€",
  "𝔸",
  "\u00A0",
  "\u0085",
  "\u2028",
  "\uFFFD",
] as const;

/**
 * The numbers a character reference is drawn from: XML 1.0's `Char` production's edges (section
 * 2.2) and the characters just outside them, the line ends and the space, every character an
 * escape turns on, each UTF-8 and UTF-16 width's edges, the surrogates, the private use areas'
 * edges, the noncharacters U+FFFE and U+FFFF, and the first number past Unicode.
 */
const codes = [
  0x0, 0x1, 0x9, 0xa, 0xd, 0x1f, 0x20, 0x22, 0x25, 0x26, 0x27, 0x3c, 0x3e, 0x41, 0x7f, 0x80, 0x85,
  0xa0, 0xff, 0x1_00, 0x7_ff, 0x8_00, 0x20_28, 0xd7_ff, 0xd8_00, 0xdf_ff, 0xe0_00, 0xe0_01, 0xf8_ff,
  0xf9_00, 0xff_fd, 0xff_fe, 0xff_ff, 0x1_00_00, 0xf_00_00, 0xf_ff_fd, 0x10_00_00, 0x10_ff_fd,
  0x10_ff_ff, 0x11_00_00,
] as const;

/**
 * The whitespace and line-end characters a character reference names half the time: the tab, the
 * line feed and CR, which attribute-value normalization and line-end handling turn on (XML 1.0
 * sections 2.11 and 3.3.3), the space, and the no-break space, U+0085 and U+2028, which XML 1.0
 * leaves as they are and a JavaScript trim does not.
 */
const spaces = [0x9, 0xa, 0xd, 0x20, 0xa0, 0x85, 0x20_28] as const;

/**
 * The tokens of XML's own syntax a piece may splice in as written: each predefined entity's
 * reference and each escape's references, the bare characters references exist for, a lone `;`
 * and `%`, the line ends, a CDATA section's end, and whole constructs of markup.
 */
const tokens = [
  "&amp;",
  "&lt;",
  "&gt;",
  "&quot;",
  "&apos;",
  "&#38;",
  "&#x26;",
  "&#60;",
  "&#37;",
  "&",
  "<",
  ">",
  ";",
  "%",
  '"',
  "'",
  "\r",
  "\r\n",
  "]]>",
  "--",
  "?>",
  "<x/>",
  "<x>y</x>",
  "<!--c-->",
  "<?t d?>",
  "<![CDATA[c]]>",
  "</x>",
] as const;

/**
 * The names entities, elements and attributes are drawn from beside those a genome already
 * writes: plain names, names with a prefix, the reserved `xml` and `xmlns` names, a name with a
 * character above Latin-1, and the predefined entities' names.
 */
const entityNames = ["e", "f", "g", "amp", "lt", "gt", "quot", "apos", "e1"] as const;

/**
 * The element names an inserted element takes beside those the genome already writes.
 */
const elementNames = ["r", "a", "b", "p:a", "q:b", "xml:a", "é", "a-b.c"] as const;

/**
 * The attribute names an added attribute or an attribute-list declaration takes beside those the
 * genome writes.
 */
const attributeNames = [
  "a",
  "b",
  "id",
  "p:a",
  "xml:lang",
  "xml:space",
  "xmlns",
  "xmlns:p",
  "é",
] as const;

/**
 * The prefixes a namespace declaration binds, and the empty prefix of the default namespace.
 */
const prefixes = ["", "p", "q", "xml", "xmlns"] as const;

/**
 * The namespace names a declaration's pieces start from: an absolute URI, a URN, the empty name
 * (an undeclaration), a relative reference, and XML's own two.
 */
const uris = [
  "urn:p",
  "urn:q",
  "http://example.com/n",
  "",
  "rel",
  "http://www.w3.org/XML/1998/namespace",
  xmlnsNamespace,
] as const;

/**
 * The content specs an element declaration writes.
 */
const contentSpecs = ["ANY", "EMPTY", "(#PCDATA)", "(#PCDATA|a)*", "(a,b?)"] as const;

/**
 * The types an attribute-list declaration writes.
 */
const attTypes: readonly AttType[] = [
  "CDATA",
  "ID",
  "IDREF",
  "IDREFS",
  "NMTOKEN",
  "NMTOKENS",
  "ENTITY",
  "(a|b)",
];

/**
 * The comment texts and processing instructions the misc nodes are drawn from: plain, empty,
 * a lone and a doubled `-`, a target that is `xml` in another case, data holding `?`, and text
 * above ASCII.
 */
const miscs: readonly Misc[] = [
  { _tag: "comment", text: "c" },
  { _tag: "comment", text: "" },
  { _tag: "comment", text: " - " },
  { _tag: "comment", text: "é𝔸" },
  { _tag: "comment", text: "a--b" },
  { _tag: "pi", data: "d", target: "t" },
  { _tag: "pi", data: "", target: "t" },
  { _tag: "pi", data: "a?b", target: "t" },
  { _tag: "pi", data: "d", target: "XmL" },
  { _tag: "pi", data: "é", target: "é" },
];

/**
 * The CDATA section texts: plain, empty, holding `]`, `]]`, a CR, a `>` and a character above
 * Latin-1.
 */
const cdatas = ["c", "", "]", "]]", "a\rb", "a\r\nb", "]>", "x]", "Ā"] as const;

/**
 * Draw a piece of a text from the dictionaries: a character, a character reference, a reference
 * to an entity the genome declares or to a name from {@link entityNames}, an escaped reference,
 * or a token.
 *
 * @param declared - The entities the genome declares.
 * @returns The generator.
 */
const pieceOf =
  (declared: readonly string[]): Gen<Piece> =>
  (source) => {
    const names = [...declared, ...entityNames];
    switch (source.draw(below(5))) {
      case 0: {
        return {
          _tag: "charref",
          // Half the references name a whitespace or line-end character, which every writer and
          // normalizer treats apart, and half any number of the dictionary.
          code: source.draw(oneOf(source.draw(below(2)) === 0 ? spaces : codes)) ?? 0x41,
          hex: source.draw(below(2)) === 1,
        };
      }
      case 1: {
        return { _tag: "ref", name: source.draw(oneOf(names)) ?? "e" };
      }
      case 2: {
        return {
          _tag: "escaped",
          name: source.draw(oneOf(names)) ?? "e",
          spelling: source.draw(oneOf(["&amp;", "&#38;", "&#x26;"] as const)) ?? "&amp;",
        };
      }
      case 3: {
        return { _tag: "token", value: source.draw(oneOf(tokens)) ?? ";" };
      }
      default: {
        return { _tag: "text", value: source.draw(oneOf(characters)) ?? "a" };
      }
    }
  };

/**
 * Escape a text piece for content: `&` and `<`, so the characters read back as written.
 *
 * @param value - The characters.
 * @returns The source text.
 */
const contentText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

/**
 * Escape a text piece for an attribute value or a default: `&`, `<` and the quote.
 *
 * @param value - The characters.
 * @param quote - The quote the value is written between.
 * @returns The source text.
 */
const valueText = (value: string, quote: Quote): string =>
  contentText(value).replaceAll(quote, quote === '"' ? "&quot;" : "&apos;");

/**
 * Escape a text piece for an entity value: `&`, `%` and the quote as character references, which
 * an entity value expands where it is declared (XML 1.0 section 4.5).
 *
 * @param value - The characters.
 * @param quote - The quote the literal is written between.
 * @returns The source text.
 */
const literalText = (value: string, quote: Quote): string =>
  value
    .replaceAll("&", "&#38;")
    .replaceAll("%", "&#37;")
    .replaceAll(quote, quote === '"' ? "&#34;" : "&#39;");

/**
 * Where a piece list is written, which decides how a text piece is escaped.
 */
type Context = "content" | Quote | `literal${Quote}`;

/**
 * Write a piece list's source text.
 *
 * @param pieces - The pieces.
 * @param context - Where they are written.
 * @returns The text.
 */
const piecesText = (pieces: readonly Piece[], context: Context): string =>
  pieces
    .map((piece) => {
      switch (piece._tag) {
        case "charref": {
          return piece.hex ? `&#x${piece.code.toString(16).toUpperCase()};` : `&#${piece.code};`;
        }
        case "escaped": {
          return `${piece.spelling}${piece.name};`;
        }
        case "ref": {
          return `&${piece.name};`;
        }
        case "text": {
          if (context === "content") {
            return contentText(piece.value);
          }

          return context === '"' || context === "'"
            ? valueText(piece.value, context)
            : literalText(piece.value, context === "literal'" ? "'" : '"');
        }
        case "token": {
          return piece.value;
        }
        default: {
          return piece satisfies never;
        }
      }
    })
    .join("");

/**
 * Write a comment or a processing instruction.
 *
 * @param misc - The node.
 * @returns Its source text.
 */
const miscText = (misc: Misc): string =>
  misc._tag === "comment"
    ? `<!--${misc.text}-->`
    : `<?${misc.target}${misc.data === "" ? "" : ` ${misc.data}`}?>`;

/**
 * Write an attribute-list declaration's default.
 *
 * @param value - The default.
 * @returns Its source text.
 */
const defaultText = (value: AttDefault): string => {
  switch (value._tag) {
    case "implied": {
      return "#IMPLIED";
    }
    case "required": {
      return "#REQUIRED";
    }
    case "value": {
      return `${value.fixed ? "#FIXED " : ""}${value.quote}${piecesText(value.pieces, value.quote)}${value.quote}`;
    }
    default: {
      return value satisfies never;
    }
  }
};

/**
 * Write one declaration of the internal subset.
 *
 * @param declaration - The declaration.
 * @returns Its source text.
 */
const declarationText = (declaration: Declaration): string => {
  switch (declaration._tag) {
    case "attlist": {
      return `<!ATTLIST ${declaration.element} ${declaration.attribute} ${declaration.type} ${defaultText(declaration.default)}>`;
    }
    case "comment":
    case "pi": {
      return miscText(declaration);
    }
    case "elementDecl": {
      return `<!ELEMENT ${declaration.name} ${declaration.content}>`;
    }
    case "entity": {
      const literal = piecesText(declaration.pieces, `literal${declaration.quote}`);

      return `<!ENTITY ${declaration.parameter ? "% " : ""}${declaration.name} ${declaration.quote}${literal}${declaration.quote}>`;
    }
    case "peref": {
      return `%${declaration.name};`;
    }
    default: {
      return declaration satisfies never;
    }
  }
};

/**
 * Write an element and everything below it, without recursion.
 *
 * @param root - The element.
 * @returns Its source text.
 */
const elementText = (root: ElementNode): string => {
  const out: string[] = [];
  const stack: (Node | { readonly _tag: "close"; readonly name: string })[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    switch (next._tag) {
      case "cdata": {
        out.push(`<![CDATA[${next.value}]]>`);
        break;
      }
      case "close": {
        out.push(`</${next.name}>`);
        break;
      }
      case "comment":
      case "pi": {
        out.push(miscText(next));
        break;
      }
      case "element": {
        const attributes = next.attributes
          .map((attribute) =>
            attribute._tag === "attribute"
              ? ` ${attribute.name}=${attribute.quote}${piecesText(attribute.pieces, attribute.quote)}${attribute.quote}`
              : ` ${attribute.prefix === "" ? "xmlns" : `xmlns:${attribute.prefix}`}="${piecesText(attribute.pieces, '"')}"`,
          )
          .join("");
        if (next.children.length === 0) {
          out.push(`<${next.name}${attributes}/>`);
        } else {
          out.push(`<${next.name}${attributes}>`);
          stack.push({ _tag: "close", name: next.name }, ...next.children.toReversed());
        }

        break;
      }
      case "text": {
        out.push(piecesText(next.pieces, "content"));
        break;
      }
      default: {
        next satisfies never;
      }
    }
  }

  return out.join("");
};

/**
 * The label a charset's declaration names when the genome writes an encoding but leaves its
 * spelling to the charset.
 */
const charsetLabel: Readonly<Record<Charset, string>> = {
  "ISO-8859-1": "ISO-8859-1",
  "US-ASCII": "US-ASCII",
  "UTF-16BE": "UTF-16BE",
  "UTF-16BE BOM": "UTF-16",
  "UTF-16LE": "UTF-16LE",
  "UTF-16LE BOM": "UTF-16",
  "UTF-8": "UTF-8",
  "UTF-8 BOM": "UTF-8",
};

/**
 * Write a genome's source text, before its charset encodes it.
 *
 * @param genome - The genome.
 * @returns The text.
 */
export const sourceText = (genome: CodecGenome): string => {
  const declaration = Option.match(genome.declaration, {
    onNone: () => "",
    onSome: ({ encoding, standalone }) =>
      `<?xml version="1.0"${Option.match(encoding, { onNone: () => "", onSome: (label) => ` encoding="${label}"` })}${Option.match(standalone, { onNone: () => "", onSome: (value) => ` standalone="${value}"` })}?>`,
  });
  const doctype = Option.match(genome.doctype, {
    onNone: () => "",
    onSome: ({ external, name, subset }) =>
      `<!DOCTYPE ${name}${external ? ' SYSTEM "doc.dtd"' : ""}${Option.match(subset, { onNone: () => "", onSome: (declarations) => ` [${declarations.map(declarationText).join("")}]` })}>`,
  });

  return `${declaration}${doctype}${genome.prolog.map(miscText).join("")}${elementText(genome.root)}${genome.epilog.map(miscText).join("")}`;
};

/**
 * Encode text in a single-byte charset: each code point within its range as its byte, each
 * other as `?`. The renderer has already written every one a reference can carry as one.
 *
 * @param text - The text.
 * @param highest - The highest code point the charset holds.
 * @returns The bytes.
 */
const singleByte = (text: string, highest: number): Uint8Array =>
  Uint8Array.from(
    Array.from(text, (character) => {
      const code = character.codePointAt(0) ?? 0x3f;

      return code > highest ? 0x3f : code;
    }),
  );

/**
 * Encode text as UTF-16 code units, with a byte order mark or without one.
 *
 * @param text - The text.
 * @param little - Whether the units are little-endian.
 * @param marked - Whether a byte order mark comes first.
 * @returns The bytes.
 */
const utf16 = (text: string, little: boolean, marked: boolean): Uint8Array => {
  const start = marked ? 2 : 0;
  const bytes = new Uint8Array(start + 2 * text.length);
  const view = new DataView(bytes.buffer);
  if (marked) {
    view.setUint16(0, 0xfe_ff, little);
  }

  for (let index = 0; index < text.length; index += 1) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- UTF-16 is written unit by unit.
    view.setUint16(start + 2 * index, text.charCodeAt(index), little);
  }

  return bytes;
};

/**
 * Rebuild a tree with every piece list mapped, without recursion over its depth's stack.
 *
 * @param root - The root.
 * @param map - Maps a piece list.
 * @returns The tree.
 */
const mapTree = (
  root: ElementNode,
  map: (pieces: readonly Piece[]) => readonly Piece[],
): ElementNode => {
  const node = (held: Node): Node => {
    if (held._tag === "text") {
      return { ...held, pieces: map(held.pieces) };
    }

    return held._tag === "element"
      ? {
          ...held,
          attributes: held.attributes.map((attribute) => ({
            ...attribute,
            pieces: map(attribute.pieces),
          })),
          children: held.children.map(node),
        }
      : held;
  };

  const mapped = node(root);

  return mapped._tag === "element" ? mapped : root;
};

/**
 * Rebuild a genome with every piece list mapped: the tree's, and the internal subset's literals.
 *
 * @param genome - The genome.
 * @param map - Maps a piece list.
 * @returns The genome.
 */
export const mapPiecesOf = (
  genome: CodecGenome,
  map: (pieces: readonly Piece[]) => readonly Piece[],
): CodecGenome => ({
  ...genome,
  doctype: genome.doctype.pipe(
    Option.map((doctype) => ({
      ...doctype,
      subset: doctype.subset.pipe(
        Option.map((declarations) =>
          declarations.map((declaration): Declaration => {
            if (declaration._tag === "entity") {
              return { ...declaration, pieces: map(declaration.pieces) };
            }

            return declaration._tag === "attlist" && declaration.default._tag === "value"
              ? {
                  ...declaration,
                  default: { ...declaration.default, pieces: map(declaration.default.pieces) },
                }
              : declaration;
          }),
        ),
      ),
    })),
  ),
  root: mapTree(genome.root, map),
});

/**
 * Write every character above a threshold in a piece list's text pieces as a character
 * reference, so a single-byte charset carries what a reference can.
 *
 * @param genome - The genome.
 * @param highest - The highest code point the charset holds.
 * @returns The genome with those characters as references.
 */
const referenced = (genome: CodecGenome, highest: number): CodecGenome => {
  const pieces = (list: readonly Piece[]): readonly Piece[] =>
    list.flatMap((piece): readonly Piece[] =>
      piece._tag === "text"
        ? Array.from(piece.value, (character): Piece => {
            const code = character.codePointAt(0) ?? 0;

            return code > highest
              ? { _tag: "charref", code, hex: true }
              : { _tag: "text", value: character };
          })
        : [piece],
    );

  return mapPiecesOf(genome, pieces);
};

/**
 * Encode a document's text in a charset: UTF-8 with or without a byte order mark, UTF-16 in
 * either order with or without one, or a single-byte charset, each character above its range as
 * `?`.
 *
 * @param text - The text.
 * @param charset - The charset.
 * @returns The bytes.
 */
export const encodedIn = (text: string, charset: Charset): Uint8Array => {
  switch (charset) {
    case "ISO-8859-1": {
      return singleByte(text, 0xff);
    }
    case "US-ASCII": {
      return singleByte(text, 0x7f);
    }
    case "UTF-16BE": {
      return utf16(text, false, false);
    }
    case "UTF-16BE BOM": {
      return utf16(text, false, true);
    }
    case "UTF-16LE": {
      return utf16(text, true, false);
    }
    case "UTF-16LE BOM": {
      return utf16(text, true, true);
    }
    case "UTF-8": {
      return new TextEncoder().encode(text);
    }
    case "UTF-8 BOM": {
      return Uint8Array.from([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(text)]);
    }
    default: {
      return charset satisfies never;
    }
  }
};

/**
 * The highest code point each single-byte charset holds.
 */
const singleByteHighest: ReadonlyMap<Charset, number> = new Map([
  ["ISO-8859-1", 0xff],
  ["US-ASCII", 0x7f],
]);

/**
 * Write a genome's bytes in its charset, every character a single-byte charset cannot hold
 * written as a character reference where a reference can stand.
 *
 * @param genome - The genome.
 * @returns The bytes.
 */
export const rendered = (genome: CodecGenome): Uint8Array => {
  const highest = singleByteHighest.get(genome.charset);

  return encodedIn(
    sourceText(highest === undefined ? genome : referenced(genome, highest)),
    genome.charset,
  );
};

/**
 * Where a node stands: the index among its parent's children of each node on the way down from
 * the root, empty for the root.
 */
export type Path = readonly number[];

/**
 * Every node of a tree with its path, in document order, the root first. Deep trees are walked on
 * a stack of their own.
 *
 * @param root - The root.
 * @returns The nodes.
 */
export const nodesOf = (
  root: ElementNode,
): readonly { readonly node: Node; readonly path: Path }[] => {
  const out: { readonly node: Node; readonly path: Path }[] = [];
  const stack: { readonly node: Node; readonly path: Path }[] = [{ node: root, path: [] }];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    out.push(next);
    if (next.node._tag === "element") {
      const { path } = next;
      stack.push(
        ...next.node.children
          .map((child, at) => ({ node: child, path: [...path, at] }))
          .toReversed(),
      );
    }
  }

  return out;
};

/**
 * Rebuild a tree with the node at a path replaced by the nodes `edit` makes of it: none deletes
 * it, several put siblings beside it. The root is replaced by the first element `edit` gives, and
 * kept when it gives none.
 *
 * @param root - The root.
 * @param path - The node's path.
 * @param edit - Maps the node to the nodes that take its place.
 * @returns The new root.
 */
export const replacedAt = (
  root: ElementNode,
  path: Path,
  edit: (node: Node) => readonly Node[],
): ElementNode => {
  if (path.length === 0) {
    return edit(root).find((node): node is ElementNode => node._tag === "element") ?? root;
  }

  // The chain of elements down to the node's parent, so a deep path is rebuilt without recursion.
  const chain: ElementNode[] = [root];
  for (const step of path.slice(0, -1)) {
    const child = chain.at(-1)?.children[step];
    if (child?._tag !== "element") {
      return root;
    }

    chain.push(child);
  }

  const last = path.at(-1) ?? 0;
  const parent = chain.at(-1) ?? root;
  const target = parent.children[last];
  if (target === undefined) {
    return root;
  }

  let rebuilt: ElementNode = {
    ...parent,
    children: [
      ...parent.children.slice(0, last),
      ...edit(target),
      ...parent.children.slice(last + 1),
    ],
  };
  for (let at = chain.length - 2; at >= 0; at -= 1) {
    const above = chain[at] ?? root;
    const step = path[at] ?? 0;
    rebuilt = {
      ...above,
      children: [...above.children.slice(0, step), rebuilt, ...above.children.slice(step + 1)],
    };
  }

  return rebuilt;
};

/**
 * The entity names a genome's internal subset declares, general ones only.
 *
 * @param genome - The genome.
 * @returns The names, in declaration order.
 */
export const declaredEntities = (genome: CodecGenome): readonly string[] =>
  Option.match(genome.doctype.pipe(Option.flatMap(({ subset }) => subset)), {
    onNone: () => [],
    onSome: (declarations) =>
      declarations.flatMap((declaration) =>
        declaration._tag === "entity" && !declaration.parameter ? [declaration.name] : [],
      ),
  });

/**
 * The element and attribute names a genome's tree writes.
 */
interface WrittenNames {
  readonly attributes: readonly string[];
  readonly elements: readonly string[];
}

/**
 * The element and attribute names a genome writes, which an attribute-list declaration targets.
 *
 * @param genome - The genome.
 * @returns The element names and the attribute names, each once.
 */
const namesIn = (genome: CodecGenome): WrittenNames => {
  const elements = new Set<string>();
  const attributes = new Set<string>();
  for (const { node } of nodesOf(genome.root)) {
    if (node._tag === "element") {
      elements.add(node.name);
      for (const attribute of node.attributes) {
        if (attribute._tag === "attribute") {
          attributes.add(attribute.name);
        }
      }
    }
  }

  return { attributes: [...attributes], elements: [...elements] };
};

/**
 * Convert a comment or processing instruction crust read around the root to the genome's.
 *
 * @param misc - The node.
 * @returns The genome's node.
 */
const miscOf = (misc: XmlDocument["prolog"][number]): Misc =>
  misc.kind === "comment"
    ? { _tag: "comment", text: misc.text }
    : { _tag: "pi", data: misc.data, target: misc.target };

/**
 * Split an attribute value crust read into pieces: its text, and each reference it records.
 *
 * @param attribute - The attribute.
 * @returns The pieces, in order.
 */
const valuePieces = (attribute: Attribute): readonly Piece[] => {
  const out: Piece[] = [];
  let position = 0;
  for (const reference of attribute.references) {
    if (reference.offset > position) {
      out.push({ _tag: "text", value: attribute.value.slice(position, reference.offset) });
    }

    out.push({ _tag: "ref", name: reference.name });
    position = reference.offset + reference.name.length + 2;
  }

  if (position < attribute.value.length) {
    out.push({ _tag: "text", value: attribute.value.slice(position) });
  }

  return out;
};

/**
 * Convert a crust tree to the genome's: each text run a text piece, each unexpanded reference a
 * reference piece, each attribute's recorded references reference pieces, each namespace
 * declaration a namespace node, in the order crust read them.
 *
 * @param document - The tree.
 * @returns The genome, in UTF-8, with the document's declaration and no doctype.
 */
export const genomeOfTree = (document: XmlDocument): CodecGenome => {
  const nodeOf = (child: Child): Node => {
    switch (child.kind) {
      case "comment": {
        return { _tag: "comment", text: child.text };
      }
      case "element": {
        return {
          _tag: "element",
          attributes: child.attributes.map((attribute): Attr | Namespace =>
            attribute.namespace === xmlnsNamespace
              ? {
                  _tag: "namespace",
                  pieces: valuePieces(attribute),
                  prefix: attribute.qname === "xmlns" ? "" : attribute.local,
                }
              : {
                  _tag: "attribute",
                  name: attribute.qname,
                  pieces: valuePieces(attribute),
                  quote: '"',
                },
          ),
          children: child.children.map(nodeOf),
          name: child.qname,
        };
      }
      case "entityRef": {
        return { _tag: "text", pieces: [{ _tag: "ref", name: child.name }] };
      }
      case "pi": {
        return { _tag: "pi", data: child.data, target: child.target };
      }
      case "text": {
        return child.cdata
          ? { _tag: "cdata", value: child.value }
          : { _tag: "text", pieces: [{ _tag: "text", value: child.value }] };
      }
      default: {
        return child satisfies never;
      }
    }
  };
  const root = nodeOf(document.root);

  return {
    charset: "UTF-8",
    declaration: document.declaration.pipe(
      Option.map(({ standalone }) => ({
        encoding: Option.none(),
        standalone: standalone.pipe(
          Option.filter((value): value is "no" | "yes" => value === "yes" || value === "no"),
        ),
      })),
    ),
    doctype: Option.none(),
    epilog: document.epilog.map(miscOf),
    prolog: document.prolog.map(miscOf),
    root:
      root._tag === "element" ? root : { _tag: "element", attributes: [], children: [], name: "r" },
  };
};

/**
 * Draw a small generic document by construction: a root named from {@link elementNames}, a few
 * children of every kind with pieces from the dictionaries, and, half the time, a doctype whose
 * internal subset declares an entity or two the body references and an attribute list on an
 * element the body writes.
 *
 * @returns The generator.
 */
export const genericGenome: Gen<CodecGenome> = (source) => {
  const entities = Array.from({ length: source.draw(below(3)) }, (_, at) => `e${String(at)}`);
  const piece = pieceOf(entities);
  const pieces = (most: number): readonly Piece[] =>
    Array.from({ length: 1 + source.draw(below(most)) }, () => source.draw(piece));
  const leaf = (): Node => {
    switch (source.draw(below(5))) {
      case 0: {
        return { _tag: "cdata", value: source.draw(oneOf(cdatas)) ?? "c" };
      }
      case 1: {
        return source.draw(oneOf(miscs)) ?? { _tag: "comment", text: "c" };
      }
      case 2: {
        return {
          _tag: "element",
          attributes: [],
          children: [],
          name: source.draw(oneOf(["a", "b"] as const)) ?? "a",
        };
      }
      default: {
        return { _tag: "text", pieces: pieces(3) };
      }
    }
  };
  const root: ElementNode = {
    _tag: "element",
    attributes: Array.from({ length: source.draw(below(3)) }, (_, at): Attr => ({
      _tag: "attribute",
      name: ["a", "b"][at] ?? "c",
      pieces: pieces(2),
      quote: source.draw(below(2)) === 0 ? '"' : "'",
    })),
    children: Array.from({ length: source.draw(below(4)) }, leaf),
    name: "r",
  };
  const subset: readonly Declaration[] = [
    ...entities.map((name): Declaration => ({
      _tag: "entity",
      name,
      parameter: false,
      pieces: pieces(2),
      quote: '"',
    })),
    {
      _tag: "attlist",
      attribute: source.draw(oneOf(attributeNames)) ?? "a",
      default: { _tag: "value", fixed: false, pieces: pieces(2), quote: '"' },
      element: "r",
      type: source.draw(oneOf(attTypes)) ?? "CDATA",
    },
  ];
  const withDoctype = source.draw(below(2)) === 1 || entities.length > 0;

  return {
    charset: "UTF-8",
    declaration:
      source.draw(below(2)) === 1
        ? Option.some({ encoding: Option.none(), standalone: Option.none() })
        : Option.none(),
    doctype: withDoctype
      ? Option.some({
          external: source.draw(below(3)) === 0,
          name: "r",
          subset: Option.some(subset),
        })
      : Option.none(),
    epilog: [],
    prolog: [],
    root,
  };
};

/**
 * The edits a run's genomes breed by.
 */
export const operators = [
  "insert-element",
  "insert-leaf",
  "delete-node",
  "move-node",
  "duplicate-node",
  "wrap",
  "graft",
  "rename-element",
  "edit-pieces",
  "add-attribute",
  "drop-attribute",
  "swap-attributes",
  "add-namespace",
  "add-declaration",
  "drop-declaration",
  "move-declaration",
  "take-declaration",
  "edit-attlist",
  "toggle-doctype",
  "toggle-external",
  "toggle-subset",
  "edit-xml-declaration",
  "charset",
  "re-encode",
  "misc",
] as const;

/**
 * One edit.
 */
export type Operator = (typeof operators)[number];

/**
 * A genome edited, with the edit's note.
 *
 * @param genome - The genome.
 * @param note - The note, its operator first.
 * @returns The edit.
 */
const edited = (genome: CodecGenome, note: string): Option.Option<Edited<CodecGenome>> =>
  Option.some({ genome, note });

/**
 * The root's name.
 *
 * @param genome - The genome.
 * @returns The name.
 */
const rootName = (genome: CodecGenome): string => genome.root.name;

/**
 * Rebuild a genome with its internal subset replaced, a doctype made where it has none.
 *
 * @param genome - The genome.
 * @param subset - The declarations.
 * @returns The genome.
 */
const withSubset = (genome: CodecGenome, subset: readonly Declaration[]): CodecGenome => ({
  ...genome,
  doctype: Option.some(
    Option.match(genome.doctype, {
      onNone: (): Doctype => ({
        external: false,
        name: rootName(genome),
        subset: Option.some(subset),
      }),
      onSome: (doctype) => ({ ...doctype, subset: Option.some(subset) }),
    }),
  ),
});

/**
 * The subset's declarations, none when there is no internal subset.
 *
 * @param genome - The genome.
 * @returns The declarations.
 */
const subsetOf = (genome: CodecGenome): readonly Declaration[] =>
  Option.getOrElse(
    genome.doctype.pipe(Option.flatMap(({ subset }) => subset)),
    (): readonly Declaration[] => [],
  );

/**
 * Every piece list of a genome, each with the function that replaces it: the tree's texts,
 * attribute values and namespace names, and the subset's entity values and defaults.
 *
 * @param genome - The genome.
 * @returns The lists, in document order.
 */
const pieceSites = (
  genome: CodecGenome,
): readonly {
  readonly pieces: readonly Piece[];
  readonly put: (pieces: readonly Piece[]) => CodecGenome;
  readonly where: string;
}[] => {
  const sites: {
    readonly pieces: readonly Piece[];
    readonly put: (pieces: readonly Piece[]) => CodecGenome;
    readonly where: string;
  }[] = [];
  for (const { node, path } of nodesOf(genome.root)) {
    if (node._tag === "text") {
      sites.push({
        pieces: node.pieces,
        put: (pieces) => ({
          ...genome,
          root: replacedAt(genome.root, path, () => [{ ...node, pieces }]),
        }),
        where: "text",
      });
    } else if (node._tag === "element") {
      for (const [at, attribute] of node.attributes.entries()) {
        sites.push({
          pieces: attribute.pieces,
          put: (pieces) => ({
            ...genome,
            root: replacedAt(genome.root, path, () => [
              {
                ...node,
                attributes: node.attributes.map((held, index) =>
                  index === at ? { ...held, pieces } : held,
                ),
              },
            ]),
          }),
          where: attribute._tag,
        });
      }
    }
  }

  const subset = Option.getOrElse(
    genome.doctype.pipe(Option.flatMap(({ subset: held }) => held)),
    (): readonly Declaration[] => [],
  );
  for (const [at, declaration] of subset.entries()) {
    const replace = (next: Declaration): CodecGenome =>
      withSubset(
        genome,
        subset.map((held, index) => (index === at ? next : held)),
      );
    if (declaration._tag === "entity") {
      sites.push({
        pieces: declaration.pieces,
        put: (pieces) => replace({ ...declaration, pieces }),
        where: "entity",
      });
    } else if (declaration._tag === "attlist" && declaration.default._tag === "value") {
      const held = declaration.default;
      sites.push({
        pieces: held.pieces,
        put: (pieces) => replace({ ...declaration, default: { ...held, pieces } }),
        where: "default",
      });
    }
  }

  return sites;
};

/**
 * The paths of a tree's elements, the root's included.
 *
 * @param root - The root.
 * @returns The paths.
 */
const elementPaths = (root: ElementNode): readonly Path[] =>
  nodesOf(root).flatMap(({ node, path }) => (node._tag === "element" ? [path] : []));

/**
 * Insert a node as a child of the element at a path, at an index drawn among its children.
 *
 * @param root - The root.
 * @param path - The parent's path.
 * @param node - The node.
 * @returns The generator of the new root.
 */
const insertedAt =
  (root: ElementNode, path: Path, node: Node): Gen<ElementNode> =>
  (source) =>
    replacedAt(root, path, (parent) => {
      if (parent._tag !== "element") {
        return [parent];
      }

      const at = source.draw(below(parent.children.length + 1));

      return [
        {
          ...parent,
          children: [...parent.children.slice(0, at), node, ...parent.children.slice(at)],
        },
      ];
    });

/**
 * Draw an attribute-list default.
 *
 * @param declared - The entities the genome declares.
 * @returns The generator.
 */
const attDefaultOf =
  (declared: readonly string[]): Gen<AttDefault> =>
  (source) => {
    switch (source.draw(below(5))) {
      case 0: {
        return { _tag: "implied" };
      }
      case 1: {
        return { _tag: "required" };
      }
      default: {
        return {
          _tag: "value",
          fixed: source.draw(below(4)) === 0,
          pieces: Array.from({ length: 1 + source.draw(below(3)) }, () =>
            source.draw(pieceOf(declared)),
          ),
          quote: source.draw(below(3)) === 0 ? "'" : '"',
        };
      }
    }
  };

/**
 * Draw a new declaration of the internal subset.
 *
 * @param genome - The genome it is added to.
 * @returns The generator.
 */
const declarationOf =
  (genome: CodecGenome): Gen<Declaration> =>
  (source) => {
    const declared = declaredEntities(genome);
    const pieces = (): readonly Piece[] =>
      Array.from({ length: 1 + source.draw(below(3)) }, () => source.draw(pieceOf(declared)));
    const names = namesIn(genome);
    switch (source.draw(below(6))) {
      case 0: {
        return {
          _tag: "attlist",
          attribute: source.draw(oneOf([...names.attributes, ...attributeNames])) ?? "a",
          default: source.draw(attDefaultOf(declared)),
          element: source.draw(oneOf([...names.elements, ...elementNames])) ?? "r",
          type: source.draw(oneOf(attTypes)) ?? "CDATA",
        };
      }
      case 1: {
        return {
          _tag: "elementDecl",
          content: source.draw(oneOf(contentSpecs)) ?? "ANY",
          name: source.draw(oneOf(names.elements)) ?? rootName(genome),
        };
      }
      case 2: {
        const parameter = source.draw(below(4)) === 0;

        return {
          _tag: "entity",
          name: source.draw(oneOf(entityNames)) ?? "e",
          parameter,
          pieces: pieces(),
          quote: source.draw(below(3)) === 0 ? "'" : '"',
        };
      }
      case 3: {
        return { _tag: "peref", name: source.draw(oneOf(entityNames)) ?? "e" };
      }
      case 4: {
        return source.draw(oneOf(miscs)) ?? { _tag: "comment", text: "c" };
      }
      default: {
        return {
          _tag: "entity",
          name: source.draw(oneOf(entityNames)) ?? "e",
          parameter: false,
          pieces: pieces(),
          quote: '"',
        };
      }
    }
  };

/**
 * Draw how many elements a wrap nests a node in: one, a few, or enough to reach and pass the
 * 256 elements a reader holds open by default.
 *
 * @param depth - The depth the node stands at.
 * @returns The generator.
 */
const wrapCount =
  (depth: number): Gen<number> =>
  (source) => {
    switch (source.draw(below(4))) {
      case 0: {
        return 1;
      }
      case 1: {
        return 2 + source.draw(below(6));
      }
      default: {
        // Bring the node to 254 to 258 elements deep, either side of the bound.
        return Math.max(1, 254 + source.draw(below(5)) - depth);
      }
    }
  };

/**
 * Nest a node in `count` new elements of one name.
 *
 * @param node - The node.
 * @param count - How many.
 * @param name - Their name.
 * @returns The outermost element.
 */
const wrapped = (node: Node, count: number, name: string): ElementNode => {
  let inner: ElementNode = { _tag: "element", attributes: [], children: [node], name };
  for (let at = 1; at < count; at += 1) {
    inner = { _tag: "element", attributes: [], children: [inner], name };
  }

  return inner;
};

/**
 * The operations, each one edit of a genome, given a mate to take parts from; none where the edit
 * has no site.
 */
const operations: Readonly<
  Record<
    Operator,
    (genome: CodecGenome, mate: CodecGenome) => Gen<Option.Option<Edited<CodecGenome>>>
  >
> = {
  "add-attribute": (genome) => (source) => {
    const path = source.draw(oneOf(elementPaths(genome.root))) ?? [];
    const name = source.draw(oneOf(attributeNames)) ?? "a";
    const attribute: Attr = {
      _tag: "attribute",
      name,
      pieces: Array.from({ length: 1 + source.draw(below(2)) }, () =>
        source.draw(pieceOf(declaredEntities(genome))),
      ),
      quote: source.draw(below(2)) === 0 ? '"' : "'",
    };

    return edited(
      {
        ...genome,
        root: replacedAt(genome.root, path, (node) =>
          node._tag === "element"
            ? [{ ...node, attributes: [...node.attributes, attribute] }]
            : [node],
        ),
      },
      `add-attribute ${name}`,
    );
  },
  "add-declaration": (genome) => (source) => {
    const declaration = source.draw(declarationOf(genome));
    const subset = subsetOf(genome);
    const at = source.draw(below(subset.length + 1));

    return edited(
      withSubset(genome, [...subset.slice(0, at), declaration, ...subset.slice(at)]),
      `add-declaration ${declaration._tag}`,
    );
  },
  "add-namespace": (genome) => (source) => {
    const path = source.draw(oneOf(elementPaths(genome.root))) ?? [];
    const prefix = source.draw(oneOf(prefixes)) ?? "p";
    const uri = source.draw(oneOf(uris)) ?? "urn:p";
    const declaration: Namespace = {
      _tag: "namespace",
      pieces: uri === "" ? [] : [{ _tag: "text", value: uri }],
      prefix,
    };

    return edited(
      {
        ...genome,
        root: replacedAt(genome.root, path, (node) =>
          node._tag === "element"
            ? [{ ...node, attributes: [...node.attributes, declaration] }]
            : [node],
        ),
      },
      `add-namespace ${prefix === "" ? "xmlns" : `xmlns:${prefix}`}="${uri}"`,
    );
  },
  charset: (genome) => (source) => {
    const charset = source.draw(oneOf(charsets)) ?? "UTF-8";

    return charset === genome.charset
      ? Option.none()
      : edited({ ...genome, charset }, `charset ${charset}`);
  },
  "delete-node": (genome) => (source) => {
    const sites = nodesOf(genome.root).filter(({ path }) => path.length > 0);
    const site = source.draw(oneOf(sites));

    return site === undefined
      ? Option.none()
      : edited(
          { ...genome, root: replacedAt(genome.root, site.path, () => []) },
          `delete-node ${site.node._tag}`,
        );
  },
  "drop-attribute": (genome) => (source) => {
    const sites = nodesOf(genome.root).flatMap(({ node, path }) =>
      node._tag === "element" ? node.attributes.map((_, at) => ({ at, node, path })) : [],
    );
    const site = source.draw(oneOf(sites));

    return site === undefined
      ? Option.none()
      : edited(
          {
            ...genome,
            root: replacedAt(genome.root, site.path, () => [
              {
                ...site.node,
                attributes: site.node.attributes.filter((_, index) => index !== site.at),
              },
            ]),
          },
          "drop-attribute",
        );
  },
  "drop-declaration": (genome) => (source) => {
    const subset = subsetOf(genome);
    if (subset.length === 0) {
      return Option.none();
    }

    const at = source.draw(below(subset.length));

    return edited(
      withSubset(
        genome,
        subset.filter((_, index) => index !== at),
      ),
      `drop-declaration ${subset[at]?._tag ?? ""}`,
    );
  },
  "duplicate-node": (genome) => (source) => {
    const site = source.draw(oneOf(nodesOf(genome.root).filter(({ path }) => path.length > 0)));

    return site === undefined
      ? Option.none()
      : edited(
          { ...genome, root: replacedAt(genome.root, site.path, (node) => [node, node]) },
          `duplicate-node ${site.node._tag}`,
        );
  },
  "edit-attlist": (genome) => (source) => {
    const subset = subsetOf(genome);
    const sites = subset.flatMap((declaration, at) =>
      declaration._tag === "attlist" ? [{ at, declaration }] : [],
    );
    const site = source.draw(oneOf(sites));
    if (site === undefined) {
      return Option.none();
    }

    const next: Declaration =
      source.draw(below(2)) === 0
        ? { ...site.declaration, type: source.draw(oneOf(attTypes)) ?? "CDATA" }
        : { ...site.declaration, default: source.draw(attDefaultOf(declaredEntities(genome))) };

    return edited(
      withSubset(
        genome,
        subset.map((held, index) => (index === site.at ? next : held)),
      ),
      "edit-attlist",
    );
  },
  "edit-pieces": (genome) => (source) => {
    const site = source.draw(oneOf(pieceSites(genome)));
    if (site === undefined) {
      return Option.none();
    }

    const piece = source.draw(pieceOf(declaredEntities(genome)));
    const at = source.draw(below(site.pieces.length + 1));
    const action = site.pieces.length === 0 ? 0 : source.draw(below(3));
    const last = Math.min(at, site.pieces.length - 1);
    const edits: readonly (readonly Piece[])[] = [
      [...site.pieces.slice(0, at), piece, ...site.pieces.slice(at)],
      site.pieces.filter((_, index) => index !== last),
      site.pieces.map((held, index) => (index === last ? piece : held)),
    ];
    const pieces = edits[action] ?? site.pieces;

    return edited(
      site.put(pieces),
      `edit-pieces ${site.where} ${["insert", "delete", "replace"][action] ?? ""} ${piece._tag}`,
    );
  },
  "edit-xml-declaration": (genome) => (source) => {
    const held = Option.getOrElse(genome.declaration, (): Declared => ({
      encoding: Option.none(),
      standalone: Option.none(),
    }));
    switch (source.draw(below(3))) {
      case 0: {
        return edited(
          {
            ...genome,
            declaration: Option.isSome(genome.declaration) ? Option.none() : Option.some(held),
          },
          "edit-xml-declaration toggle",
        );
      }
      case 1: {
        const standalone =
          source.draw(
            oneOf([Option.none(), Option.some("yes" as const), Option.some("no" as const)]),
          ) ?? Option.none();

        return edited(
          { ...genome, declaration: Option.some({ ...held, standalone }) },
          "edit-xml-declaration standalone",
        );
      }
      default: {
        const encoding =
          source.draw(below(3)) === 0
            ? Option.none()
            : Option.some(source.draw(oneOf([...labels, charsetLabel[genome.charset]])) ?? "UTF-8");

        return edited(
          { ...genome, declaration: Option.some({ ...held, encoding }) },
          "edit-xml-declaration encoding",
        );
      }
    }
  },
  graft: (genome, mate) => (source) => {
    const donor = source.draw(oneOf(nodesOf(mate.root).filter(({ path }) => path.length > 0)));
    const path = source.draw(oneOf(elementPaths(genome.root)));
    if (donor === undefined || path === undefined) {
      return Option.none();
    }

    const subset = subsetOf(mate).filter((declaration) => declaration._tag === "entity");
    const root = source.draw(insertedAt(genome.root, path, donor.node));
    // A grafted subtree brings the mate's general entities, which its references may name.
    const merged =
      subset.length === 0 ? genome : withSubset(genome, [...subsetOf(genome), ...subset]);

    return edited({ ...merged, root }, `graft ${donor.node._tag}`);
  },
  "insert-element": (genome) => (source) => {
    const path = source.draw(oneOf(elementPaths(genome.root))) ?? [];
    const names = namesIn(genome).elements;
    const name = source.draw(oneOf([...names, ...elementNames])) ?? "a";

    return edited(
      {
        ...genome,
        root: source.draw(
          insertedAt(genome.root, path, { _tag: "element", attributes: [], children: [], name }),
        ),
      },
      `insert-element ${name}`,
    );
  },
  "insert-leaf": (genome) => (source) => {
    const path = source.draw(oneOf(elementPaths(genome.root))) ?? [];
    const declared = declaredEntities(genome);
    const leaf: Node = (() => {
      switch (source.draw(below(3))) {
        case 0: {
          return { _tag: "cdata", value: source.draw(oneOf(cdatas)) ?? "c" } as const;
        }
        case 1: {
          return source.draw(oneOf(miscs)) ?? { _tag: "comment", text: "c" };
        }
        default: {
          return {
            _tag: "text",
            pieces: Array.from({ length: 1 + source.draw(below(3)) }, () =>
              source.draw(pieceOf(declared)),
            ),
          } as const;
        }
      }
    })();

    return edited(
      { ...genome, root: source.draw(insertedAt(genome.root, path, leaf)) },
      `insert-leaf ${leaf._tag}`,
    );
  },
  misc: (genome) => (source) => {
    const misc = source.draw(oneOf(miscs)) ?? { _tag: "comment", text: "c" };

    return source.draw(below(2)) === 0
      ? edited({ ...genome, prolog: [...genome.prolog, misc] }, `misc prolog ${misc._tag}`)
      : edited({ ...genome, epilog: [...genome.epilog, misc] }, `misc epilog ${misc._tag}`);
  },
  "move-declaration": (genome) => (source) => {
    const subset = subsetOf(genome);
    if (subset.length < 2) {
      return Option.none();
    }

    const from = source.draw(below(subset.length));
    const moved = subset[from];
    const rest = subset.filter((_, index) => index !== from);
    const to = source.draw(below(rest.length + 1));

    return moved === undefined
      ? Option.none()
      : edited(
          withSubset(genome, [...rest.slice(0, to), moved, ...rest.slice(to)]),
          `move-declaration ${moved._tag}`,
        );
  },
  "move-node": (genome) => (source) => {
    const site = source.draw(oneOf(nodesOf(genome.root).filter(({ path }) => path.length > 0)));
    if (site === undefined) {
      return Option.none();
    }

    const without = replacedAt(genome.root, site.path, () => []);
    const path = source.draw(oneOf(elementPaths(without)));

    return path === undefined
      ? Option.none()
      : edited(
          { ...genome, root: source.draw(insertedAt(without, path, site.node)) },
          `move-node ${site.node._tag}`,
        );
  },
  "re-encode": (genome) => (source) => {
    const charset = source.draw(oneOf(charsets)) ?? "UTF-8";
    const held = Option.getOrElse(genome.declaration, (): Declared => ({
      encoding: Option.none(),
      standalone: Option.none(),
    }));

    return edited(
      {
        ...genome,
        charset,
        declaration: Option.some({ ...held, encoding: Option.some(charsetLabel[charset]) }),
      },
      `re-encode ${charset}`,
    );
  },
  "rename-element": (genome) => (source) => {
    const path = source.draw(oneOf(elementPaths(genome.root))) ?? [];
    const name = source.draw(oneOf(elementNames)) ?? "a";
    const doctype =
      path.length === 0
        ? genome.doctype.pipe(Option.map((held) => ({ ...held, name })))
        : genome.doctype;

    return edited(
      {
        ...genome,
        doctype,
        root: replacedAt(genome.root, path, (node) =>
          node._tag === "element" ? [{ ...node, name }] : [node],
        ),
      },
      `rename-element ${name}`,
    );
  },
  "swap-attributes": (genome) => (source) => {
    const sites = nodesOf(genome.root).flatMap(({ node, path }) =>
      node._tag === "element" && node.attributes.length > 1 ? [{ node, path }] : [],
    );
    const site = source.draw(oneOf(sites));
    if (site === undefined) {
      return Option.none();
    }

    const at = source.draw(below(site.node.attributes.length - 1));
    const attributes = [...site.node.attributes];
    const [left, right] = [attributes[at], attributes[at + 1]];
    if (left === undefined || right === undefined) {
      return Option.none();
    }

    attributes[at] = right;
    attributes[at + 1] = left;

    return edited(
      { ...genome, root: replacedAt(genome.root, site.path, () => [{ ...site.node, attributes }]) },
      "swap-attributes",
    );
  },
  "take-declaration": (genome, mate) => (source) => {
    const declaration = source.draw(oneOf(subsetOf(mate)));
    if (declaration === undefined) {
      return Option.none();
    }

    const subset = subsetOf(genome);
    const at = source.draw(below(subset.length + 1));

    return edited(
      withSubset(genome, [...subset.slice(0, at), declaration, ...subset.slice(at)]),
      `take-declaration ${declaration._tag}`,
    );
  },
  "toggle-doctype": (genome) => () =>
    edited(
      {
        ...genome,
        doctype: Option.isSome(genome.doctype)
          ? Option.none()
          : Option.some({ external: false, name: rootName(genome), subset: Option.none() }),
      },
      "toggle-doctype",
    ),
  "toggle-external": (genome) => () =>
    Option.isNone(genome.doctype)
      ? edited(
          {
            ...genome,
            doctype: Option.some({ external: true, name: rootName(genome), subset: Option.none() }),
          },
          "toggle-external",
        )
      : edited(
          {
            ...genome,
            doctype: genome.doctype.pipe(
              Option.map((held) => ({ ...held, external: !held.external })),
            ),
          },
          "toggle-external",
        ),
  "toggle-subset": (genome) => () =>
    edited(
      {
        ...genome,
        doctype: Option.some(
          Option.match(genome.doctype, {
            onNone: (): Doctype => ({
              external: false,
              name: rootName(genome),
              subset: Option.some([]),
            }),
            onSome: (held) => ({
              ...held,
              subset: Option.isSome(held.subset) ? Option.none() : Option.some([]),
            }),
          }),
        ),
      },
      "toggle-subset",
    ),
  wrap: (genome) => (source) => {
    const site = source.draw(oneOf(nodesOf(genome.root)));
    if (site === undefined) {
      return Option.none();
    }

    const count = source.draw(wrapCount(site.path.length + 1));
    const name = source.draw(oneOf(["w", "p:w"] as const)) ?? "w";
    const root =
      site.path.length === 0
        ? wrapped(genome.root, count, genome.root.name)
        : replacedAt(genome.root, site.path, (node) => [wrapped(node, count, name)]);

    return edited({ ...genome, root }, `wrap ${String(count)}`);
  },
};

/**
 * A run's weight for each operator, 0 for one it leaves off.
 */
export type Weights = ReadonlyMap<Operator, number>;

/**
 * How many times an edit is drawn before a mutation gives up: an edit with no site in the genome
 * draws again.
 */
const attempts = 4;

/**
 * The mutation a run breeds by: an operator drawn by the run's weights three times in four and
 * uniformly the fourth, retried when it has no site.
 *
 * @param weights - Each operator's weight, at least one above zero.
 * @returns The mutation.
 */
export const mutationOf =
  (weights: Weights) =>
  (genome: CodecGenome, mate: CodecGenome): Gen<Option.Option<Edited<CodecGenome>>> =>
  (source) => {
    const weighed = operators.flatMap((operator) =>
      Array.from({ length: weights.get(operator) ?? 0 }, () => operator),
    );
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      // A quarter of the edits ignore the run's weights, so an operator the swarm left off is
      // still drawn now and then and no run is closed to a whole class of edit.
      const operator =
        source.draw(oneOf(source.draw(below(4)) === 0 ? operators : weighed)) ?? "edit-pieces";
      const result = source.draw(operations[operator](genome, mate));
      if (Option.isSome(result)) {
        return result;
      }
    }

    return Option.none();
  };

/**
 * Every operator at weight 1.
 */
export const evenWeights: Weights = new Map(operators.map((operator) => [operator, 1] as const));

/**
 * Draw a run's operator weights, swarm-style: each operator off, or weighed 1 to 3, with one
 * operator always on, so no run is left with nothing to breed by and the all-zero trap is closed.
 *
 * @returns The generator.
 */
export const weightsOf: Gen<Weights> = (source) => {
  const kept = source.draw(below(operators.length));

  return new Map(
    operators.map((operator, at) => {
      const weight = source.draw(below(4));

      return [operator, at === kept ? Math.max(1, weight) : weight] as const;
    }),
  );
};

/**
 * The genomes one cut smaller than a genome in its prolog: no doctype, no external or internal
 * subset, no XML declaration or none of its pseudo-attributes, no comments or processing
 * instructions around the root, and UTF-8.
 *
 * @param genome - The genome.
 * @returns The smaller genomes.
 */
const prologSmaller = (genome: CodecGenome): readonly CodecGenome[] => {
  const out: CodecGenome[] = [];
  if (Option.isSome(genome.doctype)) {
    out.push({ ...genome, doctype: Option.none() });

    const held = genome.doctype.value;
    if (held.external) {
      out.push({ ...genome, doctype: Option.some({ ...held, external: false }) });
    }

    if (Option.isSome(held.subset)) {
      out.push({ ...genome, doctype: Option.some({ ...held, subset: Option.none() }) });
    }
  }

  if (Option.isSome(genome.declaration)) {
    out.push({ ...genome, declaration: Option.none() });

    const held = genome.declaration.value;
    if (Option.isSome(held.encoding)) {
      out.push({ ...genome, declaration: Option.some({ ...held, encoding: Option.none() }) });
    }

    if (Option.isSome(held.standalone)) {
      out.push({ ...genome, declaration: Option.some({ ...held, standalone: Option.none() }) });
    }
  }

  if (genome.prolog.length > 0) {
    out.push({ ...genome, prolog: [] });
  }

  if (genome.epilog.length > 0) {
    out.push({ ...genome, epilog: [] });
  }

  if (genome.charset !== "UTF-8") {
    out.push({ ...genome, charset: "UTF-8" });
  }

  return out;
};

/**
 * The genomes one cut smaller than a genome, the largest cuts first: the doctype, then its
 * subsets, the declaration, the prolog and the epilog, the charset to UTF-8 ({@link
 * prologSmaller}), each subset declaration, each subtree from the root down, each element
 * unwrapped into its children, each attribute, and each piece. The reducer keeps the first that
 * still fails.
 *
 * @param genome - The genome.
 * @returns The smaller genomes.
 */
export const smallerOf = (genome: CodecGenome): readonly CodecGenome[] => {
  const out: CodecGenome[] = [...prologSmaller(genome)];

  const subset = subsetOf(genome);
  for (const at of subset.keys()) {
    out.push(
      withSubset(
        genome,
        subset.filter((_, index) => index !== at),
      ),
    );
  }

  const nodes = nodesOf(genome.root);
  for (const { path } of nodes) {
    if (path.length > 0) {
      out.push({ ...genome, root: replacedAt(genome.root, path, () => []) });
    }
  }

  for (const { node, path } of nodes) {
    if (node._tag === "element" && node.children.length > 0) {
      if (path.length > 0) {
        out.push({ ...genome, root: replacedAt(genome.root, path, () => node.children) });
      } else {
        const only = node.children.find((child): child is ElementNode => child._tag === "element");
        if (only !== undefined) {
          out.push({ ...genome, root: only });
        }
      }
    }
  }

  for (const { node, path } of nodes) {
    if (node._tag === "element") {
      for (const at of node.attributes.keys()) {
        out.push({
          ...genome,
          root: replacedAt(genome.root, path, () => [
            { ...node, attributes: node.attributes.filter((_, index) => index !== at) },
          ]),
        });
      }
    }
  }

  for (const site of pieceSites(genome)) {
    for (const at of site.pieces.keys()) {
      out.push(site.put(site.pieces.filter((_, index) => index !== at)));
    }

    for (const [at, piece] of site.pieces.entries()) {
      if (piece._tag === "text" && piece.value.length > 1) {
        out.push(
          site.put(
            site.pieces.map((held, index) =>
              index === at ? { ...piece, value: piece.value.slice(0, 1) } : held,
            ),
          ),
        );
      }
    }
  }

  return out;
};

/**
 * The deepest element of a tree, the root at depth 1.
 *
 * @param root - The root.
 * @returns The depth.
 */
export const depthOf = (root: ElementNode): number => {
  let most = 0;
  for (const { node, path } of nodesOf(root)) {
    if (node._tag === "element") {
      most = Math.max(most, path.length + 1);
    }
  }

  return most;
};

/**
 * The predefined entities' names (XML 1.0 section 4.6).
 */
export const predefinedNames: ReadonlySet<string> = new Set(["amp", "apos", "gt", "lt", "quot"]);

/**
 * The control characters XML 1.0's `Char` production admits, by name: the tab and the two line
 * ends.
 */
const lineEnds: ReadonlyMap<number, string> = new Map([
  [0x9, "tab"],
  [0xa, "lf"],
  [0xd, "cr"],
]);

/**
 * Class a code point as XML 1.0's productions do: a forbidden one, a line end or the tab, a
 * character an escape turns on, ASCII, the rest of the BMP's characters, a surrogate, a private
 * use character, a noncharacter, a supplementary one, or a number past Unicode.
 *
 * @param code - The code point.
 * @returns Its class.
 */
const codeClass = (code: number): string => {
  if (code > 0x10_ff_ff) {
    return "beyond";
  }

  if (code >= 0xd8_00 && code <= 0xdf_ff) {
    return "surrogate";
  }

  if (code === 0xff_fe || code === 0xff_ff) {
    return "noncharacter";
  }

  if (code < 0x20) {
    return lineEnds.get(code) ?? "forbidden";
  }

  if ([0x22, 0x25, 0x26, 0x27, 0x3c, 0x3e].includes(code)) {
    return "markup";
  }

  if (code < 0x80) {
    return "ascii";
  }

  if ((code >= 0xe0_00 && code <= 0xf8_ff) || code >= 0xf_00_00) {
    return code >= 0x1_00_00 && code < 0xf_00_00 ? "astral" : "private";
  }

  return code >= 0x1_00_00 ? "astral" : "bmp";
};

/**
 * Class a piece by its entity use: a character reference by the class of character it names, a
 * reference by what it names (a predefined entity, one the subset declares before the use, one it
 * declares after, or none), an escaped reference, or a token by itself.
 *
 * @param piece - The piece.
 * @param before - The entities declared before the piece stands.
 * @param all - Every entity the subset declares.
 * @returns The class.
 */
const useOf = (piece: Piece, before: ReadonlySet<string>, all: ReadonlySet<string>): string => {
  switch (piece._tag) {
    case "charref": {
      return `charref-${codeClass(piece.code)}`;
    }
    case "escaped": {
      return `escaped-${piece.spelling}`;
    }
    case "ref": {
      if (predefinedNames.has(piece.name)) {
        return before.has(piece.name) ? "ref-predefined-redeclared" : "ref-predefined";
      }

      if (before.has(piece.name)) {
        return "ref-declared";
      }

      return all.has(piece.name) ? "ref-declared-later" : "ref-undeclared";
    }
    case "text": {
      return "text";
    }
    case "token": {
      return `token-${piece.value}`;
    }
    default: {
      return piece satisfies never;
    }
  }
};

/**
 * Class a piece list's characters: empty, plain, holding whitespace other than the space, holding
 * a character markup turns on, above ASCII, or outside the BMP.
 *
 * @param pieces - The pieces.
 * @returns The class.
 */
const armOf = (pieces: readonly Piece[]): string => {
  const text = pieces
    .map((piece) => (piece._tag === "text" || piece._tag === "token" ? piece.value : ""))
    .join("");
  if (pieces.length === 0) {
    return "empty";
  }

  if (/[\t\n\r]/u.test(text)) {
    return "ws";
  }

  if (/[&<>"'%]/u.test(text)) {
    return "markup";
  }

  if (/[\u{10000}-\u{10FFFF}]/u.test(text)) {
    return "astral";
  }

  return /[\u0080-\u{10FFFF}]/u.test(text) ? "nonascii" : "plain";
};

/**
 * Class a qualified name: plain, prefixed, under the reserved `xml` or `xmlns` prefix or the
 * `xmlns` name itself, or above ASCII.
 *
 * @param name - The name.
 * @returns The class.
 */
const nameClass = (name: string): string => {
  if (name === "xmlns") {
    return "xmlns";
  }

  if (name.startsWith("xmlns:")) {
    return "xmlns-prefixed";
  }

  if (name.startsWith("xml:")) {
    return "xml";
  }

  if (name.includes(":")) {
    return "prefixed";
  }

  return /[\u0080-\u{10FFFF}]/u.test(name) ? "nonascii" : "plain";
};

/**
 * Bucket an element depth: the root alone, shallow, deep, near the 256 a reader holds open by
 * default, at it, and past it.
 *
 * @param depth - The depth.
 * @returns The bucket.
 */
const depthBucket = (depth: number): string => {
  if (depth <= 1) {
    return "1";
  }

  if (depth <= 8) {
    return "2-8";
  }

  if (depth < 250) {
    return "9-249";
  }

  if (depth < 256) {
    return "250-255";
  }

  return depth === 256 ? "256" : "257+";
};

/**
 * The attribute-list declarations a genome's tree reads, by `element attribute`: the first of each
 * pair, the one XML 1.0 section 3.3 binds.
 */
type Attlists = ReadonlyMap<string, Declaration & { readonly _tag: "attlist" }>;

/**
 * The features of an internal subset's declarations: each by its construct, its type and default,
 * and each entity use its literal makes, references to an entity declared after it among them.
 *
 * @param subset - The declarations.
 * @param all - Every general entity the subset declares.
 * @returns The features, the family `dtd`.
 */
const subsetFeatures = (
  subset: readonly Declaration[],
  all: ReadonlySet<string>,
): readonly string[] => {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const declaration of subset) {
    if (declaration._tag === "attlist") {
      const fixed =
        declaration.default._tag === "value" && declaration.default.fixed ? "-fixed" : "";
      found.push(
        `dtd attlist ${declaration.type} ${declaration.default._tag}${fixed} ${nameClass(declaration.attribute)}`,
      );

      const pieces = declaration.default._tag === "value" ? declaration.default.pieces : [];
      found.push(...pieces.map((piece) => `dtd default ${useOf(piece, seen, all)}`));
    } else if (declaration._tag === "entity") {
      found.push(
        ...declaration.pieces.map(
          (piece) =>
            `dtd ${declaration.parameter ? "parameter" : "entity"} ${useOf(piece, seen, all)}`,
        ),
      );
      if (!declaration.parameter && seen.has(declaration.name)) {
        found.push("dtd entity redeclared");
      }

      if (!declaration.parameter) {
        seen.add(declaration.name);
      }
    } else if (declaration._tag === "peref") {
      const declared = subset.some(
        (held) => held._tag === "entity" && held.parameter && held.name === declaration.name,
      );
      found.push(`dtd peref ${declared ? "declared" : "undeclared"}`);
    } else {
      found.push(
        declaration._tag === "elementDecl"
          ? `dtd element ${declaration.content}`
          : `dtd ${declaration._tag}`,
      );
    }
  }

  return found;
};

/**
 * The feature of a genome's prolog: its charset, its XML declaration's form, whether its label
 * names the charset, and its doctype's form.
 *
 * @param genome - The genome.
 * @returns The feature, the family `prolog`.
 */
const prologFeature = (genome: CodecGenome): string => {
  const standalone = genome.declaration.pipe(Option.flatMap(({ standalone: held }) => held));
  const label = genome.declaration.pipe(Option.flatMap(({ encoding }) => encoding));
  const declared = Option.isNone(genome.declaration)
    ? "no-declaration"
    : `standalone-${Option.getOrElse(standalone, () => "absent")}`;
  const labelled = Option.match(label, {
    onNone: () => "no-label",
    onSome: (held) =>
      held.toUpperCase() === charsetLabel[genome.charset] ? "label-matches" : "label-differs",
  });
  const doctype = Option.match(genome.doctype, {
    onNone: () => "no-doctype",
    onSome: ({ external, subset }) =>
      `doctype${external ? "-external" : ""}${Option.isSome(subset) ? "-subset" : ""}`,
  });

  return `prolog ${genome.charset} ${declared} ${labelled} ${doctype}`;
};

/**
 * Class a CDATA section's text: holding `]]`, holding a CR, empty, or plain.
 *
 * @param value - The text.
 * @returns The class.
 */
const cdataArm = (value: string): string => {
  if (value.includes("]]")) {
    return "brackets";
  }

  if (value.includes("\r")) {
    return "cr";
  }

  return value === "" ? "empty" : "plain";
};

/**
 * The namespace context an element's own declarations make for itself and what it holds: the one
 * it stands in, or an undeclared default, a default or a prefix it declares.
 *
 * @param element - The element.
 * @param scope - The context it stands in.
 * @returns Its context.
 */
const scopeOf = (element: ElementNode, scope: string): string => {
  const declarations = element.attributes.filter((attribute) => attribute._tag === "namespace");
  if (declarations.length === 0) {
    return scope;
  }

  if (declarations.some(({ pieces, prefix }) => prefix === "" && pieces.length === 0)) {
    return "undeclared-default";
  }

  return declarations.some(({ prefix }) => prefix === "") ? "default" : "prefixed";
};

/**
 * The name an attribute or a namespace declaration is written under.
 *
 * @param attribute - The attribute or declaration.
 * @returns Its qualified name.
 */
const writtenName = (attribute: Attr | Namespace): string => {
  if (attribute._tag === "attribute") {
    return attribute.name;
  }

  return attribute.prefix === "" ? "xmlns" : `xmlns:${attribute.prefix}`;
};

/**
 * The feature of each piece of a list, or of the list's emptiness, under a prefix.
 *
 * @param prefix - The feature's words before the piece's use.
 * @param pieces - The pieces.
 * @param all - Every general entity the subset declares.
 * @returns The features.
 */
const pieceFeatures = (
  prefix: string,
  pieces: readonly Piece[],
  all: ReadonlySet<string>,
): readonly string[] =>
  pieces.length === 0
    ? [`${prefix} none`]
    : pieces.map((piece) => `${prefix} ${useOf(piece, all, all)}`);

/**
 * The features of one element of a genome's tree: its own, each attribute's and declaration's,
 * each written attribute's declared type, and each default it does not write, which a reader adds.
 *
 * @param element - The element.
 * @param inner - The namespace context it makes.
 * @param attlists - The attribute-list declarations its tree reads.
 * @param all - Every general entity the subset declares.
 * @returns The features, the family `node`.
 */
const elementFeatures = (
  element: ElementNode,
  inner: string,
  attlists: Attlists,
  all: ReadonlySet<string>,
): readonly string[] => {
  const written = new Set(element.attributes.map((attribute) => writtenName(attribute)));
  const defaults = [...attlists]
    .filter(
      ([key, declaration]) =>
        key.startsWith(`${element.name} `) && !written.has(declaration.attribute),
    )
    .flatMap(([, declaration]) =>
      declaration.default._tag === "value"
        ? pieceFeatures(
            `node defaulted ${declaration.type} ${armOf(declaration.default.pieces)} ${nameClass(declaration.attribute)} ${inner}`,
            declaration.default.pieces,
            all,
          )
        : [],
    );
  const attributes = element.attributes.flatMap((attribute) => {
    const named =
      attribute._tag === "attribute"
        ? nameClass(attribute.name)
        : `declares-${attribute.prefix === "" ? "default" : nameClass(attribute.prefix)}`;
    const declared =
      attribute._tag === "attribute"
        ? attlists.get(`${element.name} ${attribute.name}`)
        : undefined;

    return [
      ...pieceFeatures(
        `node ${attribute._tag} ${armOf(attribute.pieces)} ${named}`,
        attribute.pieces,
        all,
      ),
      ...(declared === undefined
        ? []
        : pieceFeatures(
            `node declared ${declared.type} ${armOf(attribute.pieces)}`,
            attribute.pieces,
            all,
          )),
    ];
  });

  return [
    `node element ${element.children.length === 0 ? "empty" : "content"} ${nameClass(element.name)} ${inner}`,
    ...defaults,
    ...attributes,
  ];
};

/**
 * The features of a genome's tree, node by node, without recursion: each node by its kind, its
 * text arm, its namespace context and each entity use its pieces make.
 *
 * @param genome - The genome.
 * @param attlists - The attribute-list declarations its tree reads.
 * @param all - Every general entity the subset declares.
 * @returns The features, the family `node`.
 */
const treeFeatures = (
  genome: CodecGenome,
  attlists: Attlists,
  all: ReadonlySet<string>,
): readonly string[] => {
  const found: string[] = [];
  const stack: { readonly node: Node; readonly scope: string }[] = [
    { node: genome.root, scope: "none" },
  ];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, scope } = next;
    if (node._tag === "element") {
      const inner = scopeOf(node, scope);
      found.push(...elementFeatures(node, inner, attlists, all));
      stack.push(...node.children.map((child) => ({ node: child, scope: inner })));
    } else if (node._tag === "text") {
      found.push(
        ...node.pieces.map(
          (piece) => `node text ${armOf(node.pieces)} ${scope} ${useOf(piece, all, all)}`,
        ),
      );
    } else {
      found.push(
        node._tag === "cdata"
          ? `node cdata ${cdataArm(node.value)} ${scope}`
          : `node ${node._tag} ${scope}`,
      );
    }
  }

  return found;
};

/**
 * The features a genome shows, before any oracle reads it, by family:
 *
 * - `node`: each node by its kind, its text arm, its namespace context (the declarations in scope
 *   where it stands, or its name's class) and each entity use its pieces make;
 * - `dtd`: each internal-subset declaration by its construct, its type and default, and each entity
 *   use its literal makes, references to an entity declared after it among them;
 * - `prolog`: the charset, the XML declaration's form, whether its label names the charset, and the
 *   doctype's form;
 * - `depth`: the tree's depth, bucketed at the reader's bound.
 *
 * @param genome - The genome.
 * @returns The features, each a family's name, a space, and its value.
 */
export const genomeFeatures = (genome: CodecGenome): ReadonlySet<string> => {
  const subset = subsetOf(genome);
  const all = new Set(declaredEntities(genome));
  const attlists = new Map<string, Declaration & { readonly _tag: "attlist" }>();
  for (const declaration of subset) {
    const key =
      declaration._tag === "attlist"
        ? `${declaration.element} ${declaration.attribute}`
        : undefined;
    if (declaration._tag === "attlist" && key !== undefined && !attlists.has(key)) {
      attlists.set(key, declaration);
    }
  }

  return new Set([
    ...subsetFeatures(subset, all),
    prologFeature(genome),
    `depth ${depthBucket(depthOf(genome.root))}`,
    ...treeFeatures(genome, attlists, all),
  ]);
};
