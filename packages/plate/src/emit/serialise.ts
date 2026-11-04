import type { Element, Node } from "#plate/emit/node.ts";

/**
 * A destination for serialised HTML, written to in order, one chunk at a time.
 *
 * The serialiser never buffers, so a sink that forwards each chunk streams the document as it is
 * produced.
 */
export interface Sink {
  /**
   * Append the next run of HTML after every chunk already written.
   *
   * @param chunk Serialised, already escaped HTML.
   */
  readonly write: (chunk: string) => void;
}

/**
 * The defect of a void element built with children, which HTML cannot write because a void element
 * has no end tag to close them.
 *
 * The tree is built by code, never by content, so this is a defect in the code that built it and no
 * caller recovers: it is thrown, not returned.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- The phase-1 slice list fixes this name for every emitter slice; an `Error` suffix would rename a shared interface.
export class VoidElementChildren extends Error {
  /**
   * The void element's tag.
   */
  readonly tag: string;

  /**
   * Construct the defect for the void element `tag`.
   *
   * @param tag The void element's tag.
   */
  constructor(tag: string) {
    super(
      `<${tag}> is a void element and cannot hold children: build it with no children, or put them in a non-void element.`,
    );
    this.name = "VoidElementChildren";
    this.tag = tag;
  }
}

/**
 * HTML's void elements, which have a start tag and never an end tag.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#void-elements
 */
const voidElements: ReadonlySet<string> = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/**
 * The elements after whose start tag the HTML parser drops one line feed, so content that starts
 * with a line feed needs one more written before it.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
 */
const lineFeedDropping: ReadonlySet<string> = new Set(["listing", "pre", "textarea"]);

/**
 * Escape character data for an HTML text position.
 *
 * @param value The characters as they read.
 * @returns `value` with `&`, `<` and `>` as character references.
 */
const escapeText = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

/**
 * Escape an attribute value for a double-quoted position.
 *
 * @param value The value as it reads.
 * @returns `value` with `&` and `"` as character references.
 */
const escapeAttribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

/**
 * Write an element's start tag, its attributes in the object's key order.
 *
 * @param element The element whose tag and attributes are written.
 * @returns The start tag, a `true` attribute as its bare name and every value double-quoted.
 */
const startTag = (element: Element): string => {
  const attributes = Object.entries(element.attrs).map(([name, value]) =>
    value === true ? ` ${name}` : ` ${name}="${escapeAttribute(value)}"`,
  );

  return `<${element.tag}${attributes.join("")}>`;
};

/**
 * Decide whether an element's content begins with a line feed.
 *
 * An empty text node writes nothing, so the content's first character comes from the first child
 * that is an element or non-empty text.
 *
 * @param children The element's children.
 * @returns Whether the first character written for `children` is a line feed.
 */
const startsWithLineFeed = (children: readonly Node[]): boolean => {
  const first = children.find((child) => child.kind === "element" || child.text !== "");

  return first?.kind === "text" && first.text.startsWith("\n");
};

/**
 * Write a node of the output tree to `sink` as HTML, in more than one chunk.
 *
 * The same tree always gives the same bytes: no whitespace is added, every non-void element (`svg`,
 * `math` and their descendants included) gets an explicit end tag and nothing is self-closed. Text
 * is written as it reads, escaped.
 *
 * @param node The node to write, with its descendants.
 * @param sink The destination of the chunks.
 * @throws {VoidElementChildren} When `node` or a descendant is a void element with children.
 */
export const serialise = (node: Node, sink: Sink): void => {
  if (node.kind === "text") {
    sink.write(escapeText(node.text));

    return;
  }

  if (voidElements.has(node.tag)) {
    if (node.children.length > 0) {
      throw new VoidElementChildren(node.tag);
    }

    sink.write(startTag(node));

    return;
  }

  sink.write(startTag(node));

  if (lineFeedDropping.has(node.tag) && startsWithLineFeed(node.children)) {
    sink.write("\n");
  }

  for (const child of node.children) {
    serialise(child, sink);
  }

  sink.write(`</${node.tag}>`);
};

/**
 * Write a node of the output tree as one HTML string.
 *
 * @param node The node to write, with its descendants.
 * @returns The bytes {@link serialise} writes for `node`, joined.
 * @throws {VoidElementChildren} When `node` or a descendant is a void element with children.
 */
export const toHtml = (node: Node): string => {
  const chunks: string[] = [];

  serialise(node, {
    write: (chunk) => {
      chunks.push(chunk);
    },
  });

  return chunks.join("");
};
