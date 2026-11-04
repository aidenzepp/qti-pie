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
 * The defect of an element whose tag is not a lower-case name, which the serialiser cannot write
 * without the tag ending early or reading as another element.
 *
 * Like {@link VoidElementChildren}, it is a defect in the code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class MalformedTagName extends Error {
  /**
   * The tag as the tree spells it.
   */
  readonly tag: string;

  /**
   * Construct the defect for the tag `tag`.
   *
   * @param tag The tag as the tree spells it.
   */
  constructor(tag: string) {
    super(
      `Tag ${JSON.stringify(tag)} is not an element name the serialiser writes: give the element a lower-case name that starts with a letter and holds only a to z, 0 to 9 and "-".`,
    );
    this.name = "MalformedTagName";
    this.tag = tag;
  }
}

/**
 * The defect of an attribute whose name is empty or holds a character that would end the name or
 * the tag early, so the written attribute would read back as other attributes or other markup.
 *
 * Like {@link VoidElementChildren}, it is a defect in the code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class MalformedAttributeName extends Error {
  /**
   * The attribute name as the tree spells it.
   */
  readonly attribute: string;

  /**
   * The tag of the element that carries the attribute.
   */
  readonly tag: string;

  /**
   * Construct the defect for the attribute `attribute` on the element `tag`.
   *
   * @param tag The tag of the element that carries the attribute.
   * @param attribute The attribute name as the tree spells it.
   */
  constructor(tag: string, attribute: string) {
    super(
      `Attribute name ${JSON.stringify(attribute)} on <${tag}> cannot be written as HTML: give the attribute a non-empty name with no whitespace, quote, apostrophe, ">", "/", "=" or control character.`,
    );
    this.name = "MalformedAttributeName";
    this.attribute = attribute;
    this.tag = tag;
  }
}

/**
 * The defect of a raw-text element built with children, whose content HTML reads with no character
 * reference decoded, so no escaping writes a child that reads back as itself.
 *
 * Like {@link VoidElementChildren}, it is a defect in the code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class RawTextChildren extends Error {
  /**
   * The raw-text element's tag.
   */
  readonly tag: string;

  /**
   * Construct the defect for the raw-text element `tag`.
   *
   * @param tag The raw-text element's tag.
   */
  constructor(tag: string) {
    super(
      `<${tag}> is a raw-text element, whose content HTML reads without decoding character references, so the serialiser cannot escape it: build it with no children.`,
    );
    this.name = "RawTextChildren";
    this.tag = tag;
  }
}

/**
 * The defect of an escapable raw-text element (`textarea`, `title`) built with an element child,
 * which HTML would read back as text rather than as an element.
 *
 * Its text children are written escaped, as anywhere else. Like {@link VoidElementChildren}, it is a
 * defect in the code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class EscapableRawTextElementChild extends Error {
  /**
   * The tag of the element child.
   */
  readonly child: string;

  /**
   * The escapable raw-text element's tag.
   */
  readonly tag: string;

  /**
   * Construct the defect for the element child `child` of the escapable raw-text element `tag`.
   *
   * @param tag The escapable raw-text element's tag.
   * @param child The tag of the element child.
   */
  constructor(tag: string, child: string) {
    super(
      `<${tag}> holds only text, and HTML would read its child <${child}> as text: build <${tag}> with text children only.`,
    );
    this.name = "EscapableRawTextElementChild";
    this.child = child;
    this.tag = tag;
  }
}

/**
 * The defect of a `plaintext` element, whose start tag makes HTML read the whole rest of the
 * document as its text, so nothing written after it reads back as written.
 *
 * It is refused with or without children, because what follows it is out of the serialiser's sight.
 * Like {@link VoidElementChildren}, it is a defect in the code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class PlaintextElement extends Error {
  /**
   * Construct the defect for a `plaintext` element.
   */
  constructor() {
    super(
      "<plaintext> makes HTML read the rest of the document as its text, so the serialiser never writes it: build the text in another element, such as <pre>.",
    );
    this.name = "PlaintextElement";
  }
}

/**
 * The defect of an attribute whose name starts with `on` in any case, which HTML reads as an
 * event-handler attribute and runs as script.
 *
 * No part, emitter or runtime writes one, so like {@link VoidElementChildren} it is a defect in the
 * code that built the tree and is thrown.
 */
// oxlint-disable-next-line unicorn/custom-error-definition -- Named in the family of `VoidElementChildren`, whose name the phase-1 slice list fixes, so the serialiser's defects read alike.
export class EventHandlerAttribute extends Error {
  /**
   * The attribute name as the tree spells it.
   */
  readonly attribute: string;

  /**
   * The tag of the element that carries the attribute.
   */
  readonly tag: string;

  /**
   * Construct the defect for the event-handler attribute `attribute` on the element `tag`.
   *
   * @param tag The tag of the element that carries the attribute.
   * @param attribute The attribute name as the tree spells it.
   */
  constructor(tag: string, attribute: string) {
    super(
      `Attribute ${JSON.stringify(attribute)} on <${tag}> names an event handler, which the serialiser never writes: remove it, and attach behaviour with addEventListener instead.`,
    );
    this.name = "EventHandlerAttribute";
    this.attribute = attribute;
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
 * The elements whose content the HTML parser reads as text with no character reference decoded, up
 * to their end tag (`script`, `style`, `xmp`, `iframe`, `noembed`, `noframes`, and `noscript` when
 * scripting is on) or to the end of the document (`plaintext`).
 *
 * No escaping writes their content so that it reads back as written, so the serialiser refuses any
 * child of one.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
 */
const rawText: ReadonlySet<string> = new Set([
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
  "script",
  "style",
  "xmp",
]);

/**
 * The escapable raw-text elements, whose content the HTML parser reads as text with character
 * references decoded: escaped text reads back as written, an element child reads back as text.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#elements-2
 */
const escapableRawText: ReadonlySet<string> = new Set(["textarea", "title"]);

/**
 * The tags the serialiser writes: a lower-case ASCII letter, then lower-case ASCII letters, digits
 * and hyphens, so no tag can end early or carry an attribute.
 */
const writableTag = /^[a-z][a-z0-9-]*$/u;

/**
 * The characters no attribute name holds: whitespace, `"`, `'`, `>`, `/`, `=` and the controls
 * (`\p{Cc}`, U+0000 to U+001F and U+007F to U+009F), each of which HTML reads as the end of the
 * name, the attribute or the tag, or which HTML forbids in a name.
 *
 * @see https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
 */
const refusedInAttributeName = /[\s"'/=>\p{Cc}]/u;

/**
 * The attribute names HTML reads as event handlers: any name that starts with `on`, in any case.
 *
 * @see https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes
 */
const eventHandlerName = /^on/iu;

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
 * @returns `value` with `&`, `"`, `<` and `>` as character references.
 */
const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

/**
 * Refuse an element that HTML cannot write so that it reads back as the same tree, before any of
 * its bytes are written.
 *
 * @param element The element about to be written; each descendant is checked when it is written.
 * @throws {MalformedTagName} When the tag is not a lower-case letter followed by lower-case
 *   letters, digits and hyphens.
 * @throws {MalformedAttributeName} When an attribute name is empty or holds whitespace, a quote, an
 *   apostrophe, `>`, `/`, `=` or a control.
 * @throws {EventHandlerAttribute} When an attribute name starts with `on`, in any case.
 * @throws {VoidElementChildren} When a void element has children.
 * @throws {RawTextChildren} When a raw-text element has children.
 * @throws {PlaintextElement} When the element is a `plaintext` element with no children.
 * @throws {EscapableRawTextElementChild} When `textarea` or `title` has an element child.
 */
const refuseUnwritable = (element: Element): void => {
  if (!writableTag.test(element.tag)) {
    throw new MalformedTagName(element.tag);
  }

  const malformed = Object.keys(element.attrs).find(
    (name) => name === "" || refusedInAttributeName.test(name),
  );

  if (malformed !== undefined) {
    throw new MalformedAttributeName(element.tag, malformed);
  }

  const eventHandler = Object.keys(element.attrs).find((name) => eventHandlerName.test(name));

  if (eventHandler !== undefined) {
    throw new EventHandlerAttribute(element.tag, eventHandler);
  }

  if (element.children.length > 0 && voidElements.has(element.tag)) {
    throw new VoidElementChildren(element.tag);
  }

  if (element.children.length > 0 && rawText.has(element.tag)) {
    throw new RawTextChildren(element.tag);
  }

  if (element.tag === "plaintext") {
    throw new PlaintextElement();
  }

  const elementChild = escapableRawText.has(element.tag)
    ? element.children.find((child) => child.kind === "element")
    : undefined;

  if (elementChild !== undefined) {
    throw new EscapableRawTextElementChild(element.tag, elementChild.tag);
  }
};

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
 * is written as it reads, escaped. An element HTML cannot write so that it reads back as the same
 * tree is refused before any of its bytes are written; chunks already written for its ancestors
 * stay written.
 *
 * Tag and attribute names are checked, not rewritten, and no attribute or URL is dropped here: an
 * event-handler attribute and a `plaintext` element are refused, never dropped, and what else a
 * part may carry is the emitter's to decide.
 *
 * @param node The node to write, with its descendants.
 * @param sink The destination of the chunks.
 * @throws {MalformedTagName} When `node` or a descendant has a tag that is not a lower-case name.
 * @throws {MalformedAttributeName} When `node` or a descendant has an attribute name HTML cannot
 *   write.
 * @throws {EventHandlerAttribute} When `node` or a descendant has an attribute name that starts
 *   with `on`, in any case.
 * @throws {VoidElementChildren} When `node` or a descendant is a void element with children.
 * @throws {RawTextChildren} When `node` or a descendant is a raw-text element with children.
 * @throws {PlaintextElement} When `node` or a descendant is a `plaintext` element with no children.
 * @throws {EscapableRawTextElementChild} When `node` or a descendant is a `textarea` or `title`
 *   with an element child.
 */
export const serialise = (node: Node, sink: Sink): void => {
  if (node.kind === "text") {
    sink.write(escapeText(node.text));

    return;
  }

  refuseUnwritable(node);
  sink.write(startTag(node));

  if (voidElements.has(node.tag)) {
    return;
  }

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
 * @throws {MalformedTagName} When `node` or a descendant has a tag that is not a lower-case name.
 * @throws {MalformedAttributeName} When `node` or a descendant has an attribute name HTML cannot
 *   write.
 * @throws {EventHandlerAttribute} When `node` or a descendant has an attribute name that starts
 *   with `on`, in any case.
 * @throws {VoidElementChildren} When `node` or a descendant is a void element with children.
 * @throws {RawTextChildren} When `node` or a descendant is a raw-text element with children.
 * @throws {PlaintextElement} When `node` or a descendant is a `plaintext` element with no children.
 * @throws {EscapableRawTextElementChild} When `node` or a descendant is a `textarea` or `title`
 *   with an element child.
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
