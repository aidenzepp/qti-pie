import { Effect, Option } from "effect";
import { SaxesParser } from "saxes";
import type { SaxesAttributeNS } from "saxes";
import { decode } from "#crust/decode.ts";
import type { Decoded } from "#crust/decode.ts";
import { NAME_CHAR, NAME_START, lexProlog, substitute, undeclaredEntity } from "#crust/dtd.ts";
import type { AttlistEntry, Prolog, Substituted, ValuePiece } from "#crust/dtd.ts";
import { ReaderRefusal, WellFormednessError } from "#crust/errors.ts";
import { rebuild } from "#crust/rebuild.ts";
import { SENTINEL_FIRST, SENTINEL_LAST, sentinelsWritten } from "#crust/sentinels.ts";
import type {
  Attribute,
  AttributeReference,
  Child,
  Element,
  EntityRef,
  Misc,
  XmlDocument,
} from "#crust/tree.ts";

/**
 * An element whose start tag has been read and whose end tag has not.
 */
interface OpenElement {
  readonly attributes: readonly Attribute[];
  /**
   * Every namespace binding in scope at the element, its own declarations included, from prefix
   * to namespace name.
   */
  readonly bindings: Readonly<Record<string, string>>;
  readonly children: Child[];
  readonly local: string;
  readonly namespace: string;
  readonly prefix: string;
  readonly qname: string;
}

/**
 * What `parse` builds: the root element and the comments and processing instructions around it.
 */
interface Built {
  readonly epilog: readonly Misc[];
  readonly prolog: readonly Misc[];
  readonly root: Element;
}

/**
 * What the undeclared-reference scan stops at, in document order: a comment, a processing
 * instruction or a CDATA section (skipped whole), a character reference (its value group), or a
 * general entity reference (its name group).
 */
const SCAN = new RegExp(
  String.raw`<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|&#(?:x(?<hex>[0-9A-Fa-f]+)|(?<decimal>[0-9]+));|&(?<name>[${NAME_START}][${NAME_CHAR}]*);`,
  "gu",
);

/**
 * The five entities every XML processor knows (XML 1.0 section 4.6).
 */
const PREDEFINED: ReadonlySet<string> = new Set(["lt", "gt", "amp", "apos", "quot"]);

/**
 * The undeclared entity names the body references, in order of first use, and the code points the
 * body already holds in the sentinel range, whether written out or named by a character reference.
 */
interface Scanned {
  readonly names: readonly string[];
  readonly used: ReadonlySet<number>;
}

/**
 * Scan the body of `substituted` (everything from `bodyStart`) for references to entities that are
 * neither predefined nor declared.
 */
const scanReferences = (body: string, declared: ReadonlyMap<string, string>): Scanned => {
  const names = new Set<string>();
  const used = sentinelsWritten(body);
  for (const match of body.matchAll(SCAN)) {
    const { decimal, hex, name } = match.groups ?? {};
    if (name !== undefined && !PREDEFINED.has(name) && !declared.has(name)) {
      names.add(name);
    } else if (hex !== undefined || decimal !== undefined) {
      used.add(hex === undefined ? Number(decimal) : Number.parseInt(hex, 16));
    }
  }

  return { names: [...names], used };
};

/**
 * Give each undeclared entity name in the body a stand-in character, or refuse.
 *
 * The prolog's {@link Prolog.undeclared} treatment decides, as it decided each attribute default's
 * references: a refused reference is a well-formedness error, refused naming the entity. A kept one
 * may be declared in the external subset, which is never read: the name gets a private use
 * character that occurs nowhere in the body, and the parser appends it as plain text.
 *
 * @returns The stand-in character of each name; the map is empty when the body has no such
 *   reference.
 */
const assignSentinels = (
  substituted: Substituted,
  prolog: Prolog,
): Effect.Effect<ReadonlyMap<string, string>, ReaderRefusal> =>
  Effect.suspend(() => {
    const scanned = scanReferences(substituted.body.slice(prolog.bodyStart), prolog.entities);
    const [firstName] = scanned.names;
    if (firstName === undefined) {
      return Effect.succeed(new Map<string, string>());
    }

    if (prolog.undeclared._tag === "refused") {
      return Effect.fail(undeclaredEntity(firstName, prolog.undeclared.why));
    }

    const sentinels = new Map<string, string>();
    let point = SENTINEL_FIRST;
    for (const name of scanned.names) {
      while (point <= SENTINEL_LAST && scanned.used.has(point)) {
        point += 1;
      }

      if (point > SENTINEL_LAST) {
        return Effect.fail(
          undeclaredEntity(
            name,
            "the document leaves no private use character free to stand for it",
          ),
        );
      }

      sentinels.set(name, String.fromCodePoint(point));
      point += 1;
    }

    return Effect.succeed(sentinels);
  });

/**
 * The UTF-16 index in `text` of the code point at `position`, which `saxes` counts in code points.
 */
const utf16Offset = (text: string, position: number): number => {
  let index = 0;
  for (let seen = 0; seen < position && index < text.length; seen += 1) {
    index += (text.codePointAt(index) ?? 0) > 0xff_ff ? 2 : 1;
  }

  return index;
};

/**
 * The tree attribute for one `saxes` attribute; its value is the parser's, with no references.
 */
const toAttribute = (attribute: SaxesAttributeNS): Attribute => ({
  local: attribute.local,
  namespace: attribute.uri,
  prefix: attribute.prefix,
  qname: attribute.name,
  references: [],
  value: attribute.value,
});

/**
 * The tree element for a closed element and the children collected for it.
 */
const toElement = (open: OpenElement): Element => ({
  attributes: open.attributes,
  children: open.children,
  kind: "element",
  local: open.local,
  namespace: open.namespace,
  prefix: open.prefix,
  qname: open.qname,
});

/**
 * The most elements a document may hold open at once unless its reader says otherwise: `xmllint`'s
 * default depth limit.
 */
export const defaultElementDepth = 256;

/**
 * How {@link readXml} reads a document.
 */
export interface ReadOptions {
  /**
   * The most elements open at once before the document is refused under rule `element-depth`:
   * {@link defaultElementDepth} when absent, and `Number.POSITIVE_INFINITY` for a document of any
   * depth.
   */
  readonly elementDepth?: number;
}

/**
 * The namespace bindings in scope above the root element: the `xml` and `xmlns` prefixes, bound by
 * definition (Namespaces in XML 1.0, section 3), and the empty default, which names no namespace
 * until a declaration gives it one.
 */
const ROOT_BINDINGS = {
  "": "",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
} as const;

/**
 * Run `saxes` over `substituted.body` and build the root element with the comments and processing
 * instructions around it.
 *
 * `saxes` throws its first well-formedness error; that error becomes a `WellFormednessError` at
 * the position the parser had reached. A document that nests more than `elementDepth` elements is
 * refused with a `ReaderRefusal` under rule `element-depth`. The tree is built on a stack of open
 * elements, so a document of any depth within that bound is read without recursion.
 *
 * Each start tag's `ns` record is seeded with every binding in scope, its parent's whole record,
 * before `saxes` reads the tag's attributes. `saxes` resolves a prefix by looking in the open tag's
 * own record, then in every open ancestor's from the innermost out, then in its root record
 * (`SaxesParser.resolve`), so unseeded, a prefix the tag does not itself declare, the empty
 * default included, costs a walk over every open element, and reading costs the square of the
 * depth. Seeded, the tag's own record answers every lookup with the name the walk would find,
 * because `saxes` writes the tag's own declarations into that record after the seed, overriding
 * the inherited ones. A prefix bound nowhere is in no record, and `saxes` refuses it as unbound.
 *
 * @param substituted - The document text with its declared entities substituted.
 * @param sentinels - The stand-in character of each undeclared entity name.
 * @param elementDepth - The most elements open at once.
 * @returns The root element and the comments and processing instructions around it, the
 *   `ReaderRefusal` for an element past `elementDepth`, or the `WellFormednessError` for the first
 *   error `saxes` raises.
 * @see {@link https://github.com/lddubeau/saxes/blob/v6.0.0/src/saxes.ts#L2458-L2479 saxes 6.0.0, SaxesParser.resolve}
 * @see {@link https://github.com/lddubeau/saxes/blob/v6.0.0/src/saxes.ts#L2005-L2009 saxes 6.0.0, the start tag's own record}
 */
const parse = (
  substituted: Substituted,
  sentinels: ReadonlyMap<string, string>,
  elementDepth: number,
): Effect.Effect<Built, WellFormednessError | ReaderRefusal> => {
  const parser = new SaxesParser({ position: true, xmlns: true });
  for (const [name, sentinel] of sentinels) {
    parser.ENTITIES[name] = sentinel;
  }

  return Effect.try({
    catch: (error) =>
      error instanceof ReaderRefusal
        ? error
        : new WellFormednessError({
            afterSubstitution: substituted.afterSubstitution(
              utf16Offset(substituted.body, parser.position),
            ),
            column: parser.column,
            line: parser.line,
            message: error instanceof Error ? error.message : String(error),
          }),
    try: () => {
      const open: OpenElement[] = [];
      const prolog: Misc[] = [];
      const epilog: Misc[] = [];
      let root: Element | undefined;
      const place = (node: Child & Misc): void => {
        const parent = open.at(-1);
        if (parent === undefined) {
          (root ? epilog : prolog).push(node);
        } else {
          parent.children.push(node);
        }
      };

      parser.on("opentagstart", (tag) => {
        const parent = open.at(-1);
        Object.assign(tag.ns, parent === undefined ? ROOT_BINDINGS : parent.bindings);
      });
      parser.on("opentag", (tag) => {
        if (open.length >= elementDepth) {
          throw new ReaderRefusal({
            detail: `The document nests elements more than ${elementDepth} deep: element <${tag.name}> at line ${parser.line}, column ${parser.column} opens past the reader's limit. Flatten the structure so at most ${elementDepth} elements are open at once.`,
            rule: "element-depth",
          });
        }

        // The attribute record's insertion order is the order the attributes were written in,
        // namespace declarations included.
        open.push({
          attributes: Object.values(tag.attributes).map(toAttribute),
          bindings: tag.ns,
          children: [],
          local: tag.local,
          namespace: tag.uri,
          prefix: tag.prefix,
          qname: tag.name,
        });
      });
      parser.on("closetag", () => {
        const closed = open.pop();
        if (closed === undefined) {
          return;
        }

        const element = toElement(closed);
        const parent = open.at(-1);
        if (parent === undefined) {
          root = element;
        } else {
          parent.children.push(element);
        }
      });
      parser.on("text", (value) => {
        const parent = open.at(-1);
        const last = parent?.children.at(-1);
        if (parent === undefined || value === "") {
          return;
        }

        if (last?.kind === "text" && last.cdata) {
          parent.children.push({ cdata: false, kind: "text", value });
        } else if (last?.kind === "text") {
          parent.children[parent.children.length - 1] = { ...last, value: last.value + value };
        } else {
          parent.children.push({ cdata: false, kind: "text", value });
        }
      });
      parser.on("cdata", (value) => {
        open.at(-1)?.children.push({ cdata: true, kind: "text", value });
      });
      parser.on("comment", (text) => {
        place({ kind: "comment", text });
      });
      parser.on("processinginstruction", ({ body, target }) => {
        place({ data: body, kind: "pi", target });
      });
      parser.write(substituted.body).close();

      if (root === undefined) {
        throw new Error("the document has no root element");
      }

      return { epilog, prolog, root };
    },
  });
};

/**
 * A value's pieces after the second normalization step a non-`CDATA` attribute type adds (XML 1.0
 * section 3.3.3): each run of spaces made one, and a space at either end removed. A reference is
 * no space, so a run ends at one; only U+0020 counts, so a tab or other white space a character
 * reference wrote stays.
 *
 * @param pieces - The value's pieces, text and references alternating.
 * @returns The normalized pieces, text and references still alternating.
 */
const collapsed = (pieces: readonly ValuePiece[]): readonly ValuePiece[] =>
  pieces.flatMap((piece, at): readonly ValuePiece[] => {
    if (piece.kind === "reference") {
      return [piece];
    }

    const spaced = piece.text.replaceAll(/ +/gu, " ");
    const start = at === 0 && spaced.startsWith(" ") ? 1 : 0;
    const end =
      at === pieces.length - 1 && spaced.endsWith(" ") ? spaced.length - 1 : spaced.length;
    const text = spaced.slice(start, Math.max(start, end));

    return text === "" ? [] : [{ kind: "text", text }];
  });

/**
 * Split `value` around its stand-in characters: the text between them, and the reference each
 * stand-in stands for.
 *
 * @param value - Text the parser built, holding a stand-in for each undeclared reference.
 * @param names - The entity name each stand-in character stands for.
 * @returns The pieces, text and references alternating, no text piece empty.
 */
const piecesOf = (value: string, names: ReadonlyMap<string, string>): readonly ValuePiece[] => {
  const pieces: ValuePiece[] = [];
  let run = "";
  for (const character of value) {
    const name = names.get(character);
    if (name === undefined) {
      run += character;
    } else {
      if (run !== "") {
        pieces.push({ kind: "text", text: run });
      }

      pieces.push({ kind: "reference", name });
      run = "";
    }
  }

  if (run !== "") {
    pieces.push({ kind: "text", text: run });
  }

  return pieces;
};

/**
 * Write a value's pieces as an attribute value: text as itself, each reference as `&name;`, with
 * where each reference's `&` lands.
 *
 * @param pieces - The value's pieces.
 * @returns The value and its references, in order.
 */
const attributeValueOf = (
  pieces: readonly ValuePiece[],
): Pick<Attribute, "references" | "value"> => {
  const references: AttributeReference[] = [];
  let value = "";
  for (const piece of pieces) {
    if (piece.kind === "text") {
      value += piece.text;
    } else {
      references.push({ name: piece.name, offset: value.length });
      value += `&${piece.name};`;
    }
  }

  return { references, value };
};

/**
 * Normalize a value's pieces as its declared type asks: as given for `CDATA` or an undeclared
 * attribute, {@link collapsed} for any other type.
 *
 * @param pieces - The value's pieces.
 * @param entry - The attribute's declaration, when the ATTLIST table has one.
 * @returns The normalized pieces.
 */
const normalizedAs = (
  pieces: readonly ValuePiece[],
  entry: AttlistEntry | undefined,
): readonly ValuePiece[] =>
  entry === undefined || entry.type === "CDATA" ? pieces : collapsed(pieces);

/**
 * An element's attributes in the finished tree: each written one with its stand-ins restored as
 * references and its value normalized by its declared type, then each declared default the element
 * lacks, in declaration order, built from the default's own pieces.
 *
 * A default never holds a stand-in: its references are pieces the prolog's lexer kept, and its text
 * is the prolog's, which the body's stand-ins are chosen apart from. So a default is appended after
 * the stand-ins are restored, and no character of its text is read as a reference.
 *
 * @param element - The element as `saxes` built it.
 * @param table - The ATTLIST table of the element's name, if any.
 * @param names - The entity name each stand-in character stands for.
 * @returns The attributes.
 */
const attributesOf = (
  element: Element,
  table: ReadonlyMap<string, AttlistEntry> | undefined,
  names: ReadonlyMap<string, string>,
): readonly Attribute[] => {
  const written = element.attributes.map((attribute): Attribute => ({
    ...attribute,
    ...attributeValueOf(
      normalizedAs(piecesOf(attribute.value, names), table?.get(attribute.qname)),
    ),
  }));
  const present = new Set(element.attributes.map((attribute) => attribute.qname));
  const defaulted = [...(table ?? [])].flatMap(([declared, entry]): readonly Attribute[] =>
    !present.has(declared) && Option.isSome(entry.default)
      ? [
          {
            local: declared,
            namespace: "",
            prefix: "",
            qname: declared,
            ...attributeValueOf(normalizedAs(entry.default.value, entry)),
          },
        ]
      : [],
  );

  return [...written, ...defaulted];
};

/**
 * A text run's nodes once its stand-in characters are restored: the text between them as `Text`
 * runs and each stand-in as an `EntityRef`.
 *
 * @param value - The run's text.
 * @param names - The entity name each stand-in character stands for.
 * @returns The nodes, in order.
 */
const restoredText = (value: string, names: ReadonlyMap<string, string>): readonly Child[] =>
  piecesOf(value, names).map((piece): Child =>
    piece.kind === "text"
      ? { cdata: false, kind: "text", value: piece.text }
      : ({ kind: "entityRef", name: piece.name } satisfies EntityRef),
  );

/**
 * Assemble the document from what the earlier stages read and the tree `saxes` built.
 *
 * One walk, without recursion, gives every element its {@link attributesOf} and puts every
 * stand-in character of the content back as the `EntityRef` it stands for; a document with no
 * ATTLIST table and no stand-in keeps the parser's tree.
 *
 * @param decoded - The decoded bytes, for the charset label.
 * @param prolog - The prolog, for its declaration, DOCTYPE and ATTLIST tables.
 * @param built - The root element and the comments and processing instructions around it.
 * @param names - The entity name each stand-in character stands for.
 * @returns The document.
 */
const assemble = (
  decoded: Decoded,
  prolog: Prolog,
  built: Built,
  names: ReadonlyMap<string, string>,
): XmlDocument => ({
  charset: decoded.label,
  declaration: prolog.declaration,
  doctype: prolog.doctype,
  epilog: built.epilog,
  prolog: built.prolog,
  root:
    prolog.attlists.size === 0 && names.size === 0
      ? built.root
      : rebuild(
          built.root,
          (element) => attributesOf(element, prolog.attlists.get(element.qname), names),
          (leaf) =>
            leaf.kind === "text" && !leaf.cdata && names.size > 0
              ? restoredText(leaf.value, names)
              : [leaf],
        ),
});

/**
 * Read a document's bytes into its tree.
 *
 * The bytes are decoded, the prolog is lexed and the declared entities are substituted into the
 * body, then `saxes` parses the result with namespaces on and the tree is built from its events:
 * adjacent text events become one `Text`, a CDATA section stays its own `Text`, and the
 * empty-element form is dropped. The ATTLIST table is then applied: a declared default the element
 * lacks is appended, and a non-`CDATA` attribute value is normalized.
 *
 * A reference to an entity the document does not declare is refused when the document is
 * `standalone="yes"` or has no external subset. Otherwise each such name is registered with
 * `saxes` as one private use character that the document does not contain, and after the parse each
 * character becomes the reference it stood for: an `EntityRef` in content, `&name;` with a recorded
 * offset in an attribute value.
 *
 * At most `options.elementDepth` elements may be open at once, {@link defaultElementDepth} (256,
 * as in `xmllint`) unless the caller gives another bound; a deeper document is refused under rule
 * `element-depth`. Within the bound, a document of any depth or width is read: the tree is built,
 * and then rewritten, on stacks of its own, never by recursion.
 *
 * @param bytes - The document as read from storage.
 * @param options - How to read it: the element depth it is refused past.
 * @returns The tree; a `ReaderRefusal` from decoding, the prolog, an entity reference or the
 *   element depth, or a
 *   `WellFormednessError` whose position is the parser's and whose `afterSubstitution` says whether
 *   a substitution precedes it.
 */
export const readXml = Effect.fn("xml.read")(function* readXml(
  bytes: Uint8Array,
  options: ReadOptions = {},
): Effect.fn.Return<XmlDocument, WellFormednessError | ReaderRefusal> {
  const decoded = yield* decode(bytes);
  const prolog = yield* lexProlog(decoded.text);
  const substituted = yield* substitute(decoded.text, prolog);
  const sentinels = yield* assignSentinels(substituted, prolog);
  const built = yield* parse(substituted, sentinels, options.elementDepth ?? defaultElementDepth);
  const names = new Map([...sentinels].map(([name, sentinel]) => [sentinel, name]));

  return assemble(decoded, prolog, built, names);
});
