import { Effect, Option } from "effect";
import { EncodeError } from "#qti/xml/errors.ts";
import type { Attribute, Child, XmlDocument, XmlDeclaration } from "#qti/xml/tree.ts";

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
 * The characters an attribute value always escapes, with the reference each becomes.
 */
const attributeEscapes: ReadonlyMap<string, string> = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  ['"', "&quot;"],
  ["\t", "&#x9;"],
  ["\n", "&#xA;"],
  ["\r", "&#xD;"],
]);

/**
 * The text of a numeric character reference to `codePoint`.
 */
const characterReference = (codePoint: number): string =>
  `&#x${codePoint.toString(16).toUpperCase()};`;

/**
 * Whether `character` lies above the threshold; with no threshold nothing does.
 */
const isAbove = (character: string, threshold: number): boolean =>
  (character.codePointAt(0) ?? 0) > threshold;

/**
 * Escape an attribute value, writing each code point above `threshold` as a character reference.
 */
const escapeAttribute = (value: string, threshold: number): string => {
  let escaped = "";

  for (const character of value) {
    escaped += isAbove(character, threshold)
      ? characterReference(character.codePointAt(0) ?? 0)
      : (attributeEscapes.get(character) ?? character);
  }

  return escaped;
};

/**
 * Render an attribute value with each recorded entity reference as `&name;` and the text between
 * them escaped.
 */
const renderValue = (attribute: Attribute, threshold: number): string => {
  let rendered = "";
  let position = 0;

  for (const reference of attribute.references) {
    rendered += escapeAttribute(attribute.value.slice(position, reference.offset), threshold);
    rendered += `&${reference.name};`;
    position = reference.offset + reference.name.length + 2;
  }

  return rendered + escapeAttribute(attribute.value.slice(position), threshold);
};

/**
 * Escape a plain text run: `&`, `<`, the `>` that ends `]]>`, and CR; code points above `threshold`
 * become character references.
 */
const escapeText = (value: string, threshold: number): string => {
  let escaped = "";
  let previous = "";

  for (const character of value) {
    if (isAbove(character, threshold)) {
      escaped += characterReference(character.codePointAt(0) ?? 0);
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
 * `threshold` closes the section, is written as a reference, and the section reopens after it; an
 * empty section is omitted, except that a run with no characters is still one empty section.
 */
const renderCdata = (value: string, threshold: number): string => {
  let rendered = "";
  let current = "";

  for (const character of value) {
    if (isAbove(character, threshold)) {
      rendered += current === "" ? "" : section(current);
      rendered += characterReference(character.codePointAt(0) ?? 0);
      current = "";
    } else {
      current += character;
    }
  }

  return current === "" && rendered !== "" ? rendered : rendered + section(current);
};

/**
 * Render a node: an element with its attributes in stored order, as `<x/>` when it has no children,
 * or one of the leaf kinds.
 */
const renderNode = (node: Child, threshold: number): string => {
  if (node.kind === "text") {
    return node.cdata ? renderCdata(node.value, threshold) : escapeText(node.value, threshold);
  }

  if (node.kind === "comment") {
    return `<!--${node.text}-->`;
  }

  if (node.kind === "pi") {
    return `<?${node.target}${node.data === "" ? "" : ` ${node.data}`}?>`;
  }

  if (node.kind === "entityRef") {
    return `&${node.name};`;
  }

  const attributes = node.attributes
    .map((attribute) => ` ${attribute.qname}="${renderValue(attribute, threshold)}"`)
    .join("");

  if (node.children.length === 0) {
    return `<${node.qname}${attributes}/>`;
  }

  const children = node.children.map((child) => renderNode(child, threshold)).join("");

  return `<${node.qname}${attributes}>${children}</${node.qname}>`;
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
 * The first code point of `value` above `threshold`, or `undefined` when there is none.
 */
const firstAbove = (value: string, threshold: number): number | undefined => {
  for (const character of value) {
    if (isAbove(character, threshold)) {
      return character.codePointAt(0);
    }
  }

  return undefined;
};

/**
 * An `EncodeError` for the first code point of `value` above `threshold`, or `undefined`.
 */
const unwritable = (
  value: string,
  where: EncodeError["where"],
  threshold: number,
): EncodeError | undefined => {
  const codePoint = firstAbove(value, threshold);

  return codePoint === undefined ? undefined : new EncodeError({ codePoint, threshold, where });
};

/**
 * The first construct under `node`, itself included, that cannot carry a character reference and
 * holds a code point above `threshold`, in document order.
 */
const findInNode = (node: Child, threshold: number): EncodeError | undefined => {
  if (node.kind === "text") {
    return undefined;
  }

  if (node.kind === "comment") {
    return unwritable(node.text, "comment", threshold);
  }

  if (node.kind === "pi") {
    return unwritable(node.target, "pi", threshold) ?? unwritable(node.data, "pi", threshold);
  }

  if (node.kind === "entityRef") {
    return unwritable(node.name, "name", threshold);
  }

  const own = unwritable(node.qname, "name", threshold);

  if (own !== undefined) {
    return own;
  }

  for (const attribute of node.attributes) {
    const found =
      unwritable(attribute.qname, "name", threshold) ??
      attribute.references
        .map((reference) => unwritable(reference.name, "name", threshold))
        .find((error) => error !== undefined);

    if (found !== undefined) {
      return found;
    }
  }

  return node.children
    .map((child) => findInNode(child, threshold))
    .find((error) => error !== undefined);
};

/**
 * The first unwritable construct in the prolog, the root and the epilog.
 */
const findUnwritable = (doc: XmlDocument, threshold: number): EncodeError | undefined =>
  [...doc.prolog, doc.root, ...doc.epilog]
    .map((node) => findInNode(node, threshold))
    .find((error) => error !== undefined);

/**
 * Serialize a document: the declaration as stored, the doctype text as stored, the prolog, the root
 * and the epilog, each prolog item followed by a newline and each epilog item preceded by one.
 *
 * Without `options` every character is written as itself. With a `threshold`, a code point above it
 * in a text run or an attribute value becomes a numeric character reference (a CDATA run is closed
 * around it), and one anywhere else cannot be written, because no reference can carry it there.
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
  const failure = findUnwritable(doc, threshold);

  if (failure !== undefined) {
    return Effect.fail(failure);
  }

  const declaration = Option.match(doc.declaration, {
    onNone: () => "",
    onSome: (value) => `${renderDeclaration(value)}\n`,
  });
  const doctype = Option.match(doc.doctype, {
    onNone: () => "",
    onSome: (value) => `${value}\n`,
  });
  const prolog = doc.prolog.map((misc) => `${renderNode(misc, threshold)}\n`).join("");
  const epilog = doc.epilog.map((misc) => `\n${renderNode(misc, threshold)}`).join("");

  return Effect.succeed(
    `${declaration}${doctype}${prolog}${renderNode(doc.root, threshold)}${epilog}`,
  );
};
