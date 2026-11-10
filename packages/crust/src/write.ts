import { Effect, Option } from "effect";
import { codePointOf, unwritableIn } from "#crust/charset.ts";
import type { EncodeError } from "#crust/errors.ts";
import { attributeValue, characterReference, miscMarkup } from "#crust/markup.ts";
import { tour } from "#crust/tour.ts";
import type { Leaf, Step } from "#crust/tour.ts";
import type { Element, XmlDocument, XmlDeclaration } from "#crust/tree.ts";

/**
 * How the writer treats code points above the highest one the label's encoder represents.
 */
interface WriteOptions {
  /**
   * The highest code point the encoder can carry as itself; a code point above it in a text run or
   * an attribute value becomes a numeric character reference.
   */
  readonly threshold: number;
}

/**
 * Whether `character` lies above the threshold; with no threshold nothing does.
 */
const isAbove = (character: string, threshold: number): boolean =>
  codePointOf(character) > threshold;

/**
 * Escape a plain text run: `&`, `<`, the `>` that ends `]]>`, and CR; code points above `threshold`
 * become character references.
 *
 * XML 1.0 section 2.4 has a `>` escaped "when it appears in the string "]]>" in content", a string
 * the content's characters make whatever text runs hold them, so a `>` that opens a run is escaped
 * after a plain run that ends `]]`.
 *
 * @param value - The run's text.
 * @param threshold - The highest code point the run writes as itself.
 * @param before - The last two characters of the plain text run written just before, empty when
 *   anything else came before.
 * @returns The run's markup.
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#syntax | XML 1.0 (Fifth Edition), section 2.4}
 */
const escapeText = (value: string, threshold: number, before: string): string => {
  let escaped = "";
  let previous = before;

  for (const character of value) {
    if (isAbove(character, threshold)) {
      escaped += characterReference(codePointOf(character));
    } else if (character === "&") {
      escaped += "&amp;";
    } else if (character === "<") {
      escaped += "&lt;";
    } else if (character === ">" && previous.endsWith("]]")) {
      escaped += "&gt;";
    } else if (character === "\r") {
      escaped += "&#xD;";
    } else {
      escaped += character;
    }

    previous = (previous + character).slice(-2);
  }

  return escaped;
};

/**
 * One CDATA section; a `]]>` inside it is split across two sections so the section does not end
 * early.
 */
const section = (value: string): string =>
  `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

/**
 * Write a CDATA run. A section cannot hold a character reference, so each code point above
 * `threshold`, and each CR (a re-read turns a raw CR into a line feed, XML 1.0 section 2.11),
 * closes the section, is written as a reference, and the section reopens after it; an empty
 * section is omitted, except that a run with no characters is still one empty section.
 */
const renderCdata = (value: string, threshold: number): string => {
  let rendered = "";
  let current = "";

  for (const character of value) {
    if (isAbove(character, threshold) || character === "\r") {
      rendered += current === "" ? "" : section(current);
      rendered += characterReference(codePointOf(character));
      current = "";
    } else {
      current += character;
    }
  }

  return current === "" && rendered !== "" ? rendered : rendered + section(current);
};

/**
 * Render a node that holds no other node: a plain text run escaped as the content it continues, a
 * CDATA run, a comment, a processing instruction or an entity reference.
 *
 * @param node - The node to render.
 * @param threshold - The highest code point a text run writes as itself.
 * @param before - The last two characters of the plain text run written just before, empty when
 *   anything else came before.
 * @returns The node's markup.
 */
const renderLeaf = (node: Leaf, threshold: number, before: string): string => {
  if (node.kind === "text") {
    return node.cdata
      ? renderCdata(node.value, threshold)
      : escapeText(node.value, threshold, before);
  }

  return node.kind === "entityRef" ? `&${node.name};` : miscMarkup(node);
};

/**
 * Render an element's attributes in stored order, each led by a space.
 *
 * @param element - The element whose attributes to render.
 * @param threshold - The highest code point an attribute value writes as itself.
 * @returns The attributes' markup, empty when the element has none.
 */
const renderAttributes = (element: Element, threshold: number): string =>
  element.attributes
    .map((attribute) => ` ${attribute.qname}="${attributeValue(attribute, threshold)}"`)
    .join("");

/**
 * Render one step of a tour: an element's start tag with its attributes in stored order, as `<x/>`
 * when it has no children and with nothing at its close, else its end tag at its close; or a leaf.
 *
 * @param step - The step.
 * @param threshold - The highest code point a text run or an attribute value writes as itself.
 * @param before - The last two characters of the plain text run written just before, empty when
 *   anything else came before.
 * @returns The step's markup.
 */
const renderStep = (step: Step, threshold: number, before: string): string => {
  if (step.kind === "leaf") {
    return renderLeaf(step.node, threshold, before);
  }

  const { element } = step;
  if (step.kind === "close") {
    return element.children.length === 0 ? "" : `</${element.qname}>`;
  }

  return `<${element.qname}${renderAttributes(element, threshold)}${element.children.length === 0 ? "/" : ""}>`;
};

/**
 * Render an element and everything below it, in document order, by its {@link tour}, so a tree of
 * any depth or width renders without recursion.
 *
 * Adjacent plain text runs are one stretch of content, so each run is escaped knowing the last two
 * characters of the plain run just before it ({@link escapeText}).
 *
 * @param root - The element to render.
 * @param threshold - The highest code point a text run or an attribute value writes as itself.
 * @returns The element's markup.
 */
const renderElement = (root: Element, threshold: number): string => {
  const parts: string[] = [];
  let before = "";
  for (const step of tour(root)) {
    parts.push(renderStep(step, threshold, before));
    before =
      step.kind === "leaf" && step.node.kind === "text" && !step.node.cdata
        ? (before + step.node.value).slice(-2)
        : "";
  }

  return parts.join("");
};

/**
 * Render the XML declaration with only the pseudo-attributes it has, in the order version,
 * encoding, standalone.
 */
const renderDeclaration = (declaration: XmlDeclaration): string => {
  const encoding = Option.match(declaration.encoding, {
    onNone: () => "",
    onSome: (value) => ` encoding="${value}"`,
  });
  const standalone = Option.match(declaration.standalone, {
    onNone: () => "",
    onSome: (value) => ` standalone="${value}"`,
  });

  return `<?xml version="${declaration.version}"${encoding}${standalone}?>`;
};

/**
 * Serialize a document: the declaration as stored, the doctype text as stored, the prolog, the root
 * and the epilog, each prolog item followed by a newline and each epilog item preceded by one.
 *
 * Without `options` every character is written as itself. With a `threshold`, a code point above it
 * in a text run or an attribute value becomes a numeric character reference (a CDATA run is closed
 * around it), and one anywhere else, the doctype text included, cannot be written, because no
 * reference can carry it there. A CR in a CDATA run is closed around and written `&#xD;`, as in a
 * text run, so a re-read keeps it.
 *
 * @param doc - The tree to serialize.
 * @param options - The threshold of the encoder that will carry the string, when it has one.
 * @returns The XML text, or an `EncodeError` naming the first construct, in document order, that
 *   holds a code point above the threshold where no character reference is possible.
 */
export const writeXml = (
  doc: XmlDocument,
  options?: WriteOptions,
): Effect.Effect<string, EncodeError> => {
  const threshold = options?.threshold ?? Number.POSITIVE_INFINITY;
  const failure = options === undefined ? Option.none() : unwritableIn(doc, options.threshold);

  if (Option.isSome(failure)) {
    return Effect.fail(failure.value);
  }

  const declaration = Option.match(doc.declaration, {
    onNone: () => "",
    onSome: (value) => `${renderDeclaration(value)}\n`,
  });
  const doctype = Option.match(doc.doctype, {
    onNone: () => "",
    onSome: (value) => `${value}\n`,
  });
  const prolog = doc.prolog.map((misc) => `${miscMarkup(misc)}\n`).join("");
  const epilog = doc.epilog.map((misc) => `\n${miscMarkup(misc)}`).join("");

  return Effect.succeed(
    `${declaration}${doctype}${prolog}${renderElement(doc.root, threshold)}${epilog}`,
  );
};
