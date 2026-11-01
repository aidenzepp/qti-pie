import { Effect } from "effect";
import { SaxesParser } from "saxes";
import type { SaxesAttributeNS } from "saxes";
import { decode } from "#qti/xml/decode.ts";
import type { Decoded } from "#qti/xml/decode.ts";
import { lexProlog, substitute } from "#qti/xml/dtd.ts";
import type { Prolog, Substituted } from "#qti/xml/dtd.ts";
import { WellFormednessError } from "#qti/xml/errors.ts";
import type { ReaderRefusal } from "#qti/xml/errors.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "#qti/xml/tree.ts";

/**
 * An element whose start tag has been read and whose end tag has not.
 */
interface OpenElement {
  readonly attributes: readonly Attribute[];
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
 * Run `saxes` over `substituted.body` and build the root element with the comments and processing
 * instructions around it.
 *
 * `saxes` throws its first well-formedness error; that error becomes a `WellFormednessError` at
 * the position the parser had reached.
 */
const parse = (substituted: Substituted): Effect.Effect<Built, WellFormednessError> => {
  const parser = new SaxesParser({ position: true, xmlns: true });

  return Effect.try({
    catch: (error) =>
      new WellFormednessError({
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

      parser.on("opentag", (tag) => {
        // The attribute record's insertion order is the order the attributes were written in,
        // namespace declarations included.
        open.push({
          attributes: Object.values(tag.attributes).map(toAttribute),
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
 * Assemble the document from what the earlier stages read and the tree `saxes` built.
 */
const assemble = (decoded: Decoded, prolog: Prolog, built: Built): XmlDocument => ({
  charset: decoded.label,
  declaration: prolog.declaration,
  doctype: prolog.doctype,
  epilog: built.epilog,
  prolog: built.prolog,
  root: built.root,
});

/**
 * Read a document's bytes into its tree.
 *
 * The bytes are decoded, the prolog is lexed and the declared entities are substituted into the
 * body, then `saxes` parses the result with namespaces on and the tree is built from its events:
 * adjacent text events become one `Text`, a CDATA section stays its own `Text`, and the
 * empty-element form is dropped. ATTLIST defaults, non-CDATA attribute normalization and undeclared
 * entity references are not handled here.
 *
 * @param bytes - The document as read from storage.
 * @returns The tree; a `ReaderRefusal` from decoding or the prolog, or a `WellFormednessError`
 *   whose position is the parser's and whose `afterSubstitution` says whether a substitution
 *   precedes it.
 */
export const readXml = Effect.fn("xml.read")(function* readXml(
  bytes: Uint8Array,
): Effect.fn.Return<XmlDocument, WellFormednessError | ReaderRefusal> {
  const decoded = yield* decode(bytes);
  const prolog = yield* lexProlog(decoded.text);
  const substituted = yield* substitute(decoded.text, prolog);
  const built = yield* parse(substituted);

  return assemble(decoded, prolog, built);
});
