import type { Attribute, Child, Element, Misc, XmlDocument } from "#crust/tree.ts";

/**
 * The namespace name that every namespace declaration's attribute is in.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The namespace declarations in scope, from prefix to namespace name; the default namespace is the
 * empty prefix. A prefix that is absent is not declared, and an empty name is only ever the
 * default.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * Compare two strings by code point, which is the byte order of their UTF-8 form.
 */
const compareCodePoints = (left: string, right: string): number => {
  const a = Array.from(left, (character) => character.codePointAt(0) ?? 0);
  const b = Array.from(right, (character) => character.codePointAt(0) ?? 0);
  const shared = Math.min(a.length, b.length);

  for (let index = 0; index < shared; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return a.length - b.length;
};

/**
 * Escape `&`, `<`, `>` and CR the way canonical XML writes a text run.
 */
const escapeText = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");

/**
 * Escape `&`, `<`, `"`, TAB, LF and CR the way canonical XML writes an attribute value.
 */
const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");

/**
 * Render an attribute value with each recorded entity reference as `&name;` and the text between
 * them escaped.
 */
const renderValue = (attribute: Attribute): string => {
  let rendered = "";
  let position = 0;

  for (const reference of attribute.references) {
    rendered += escapeAttribute(attribute.value.slice(position, reference.offset));
    rendered += `&${reference.name};`;
    position = reference.offset + reference.name.length + 2;
  }

  return rendered + escapeAttribute(attribute.value.slice(position));
};

/**
 * The scope an element's own declarations make on top of its parent's.
 */
const scopeOf = (element: Element, parent: Scope): Scope => {
  const declared = new Map(parent);

  for (const attribute of element.attributes) {
    if (attribute.namespace === xmlnsNamespace) {
      declared.set(attribute.prefix === "xmlns" ? attribute.local : "", attribute.value);
    }
  }

  return declared;
};

/**
 * The ` xmlns` declarations an element renders: each one in scope that its parent's scope does not
 * already give the same name, the default first, then by prefix. An empty default is rendered only
 * when the parent's default is not empty.
 */
const renderNamespaces = (scope: Scope, parent: Scope): string =>
  [...scope]
    .filter(([prefix, name]) => (parent.get(prefix) ?? "") !== name)
    .toSorted(([left], [right]) => compareCodePoints(left, right))
    .map(([prefix, name]) => (prefix === "" ? ` xmlns="${name}"` : ` xmlns:${prefix}="${name}"`))
    .join("");

/**
 * Render the attribute axis: the non-declaration attributes by namespace name, then local name.
 */
const renderAttributes = (element: Element): string =>
  element.attributes
    .filter((attribute) => attribute.namespace !== xmlnsNamespace)
    .toSorted(
      (left, right) =>
        compareCodePoints(left.namespace, right.namespace) ||
        compareCodePoints(left.local, right.local),
    )
    .map((attribute) => ` ${attribute.qname}="${renderValue(attribute)}"`)
    .join("");

/**
 * Render a comment or a processing instruction.
 */
const renderMisc = (item: Misc): string =>
  item.kind === "comment"
    ? `<!--${item.text}-->`
    : `<?${item.target}${item.data === "" ? "" : ` ${item.data}`}?>`;

/**
 * Render an element, its namespace axis, its attribute axis and its children, always with a
 * separate end tag.
 */
const renderElement = (element: Element, parent: Scope): string => {
  const scope = scopeOf(element, parent);
  const children = element.children
    .map((child: Child): string => {
      if (child.kind === "element") {
        return renderElement(child, scope);
      }

      if (child.kind === "text") {
        return escapeText(child.value);
      }

      if (child.kind === "entityRef") {
        return `&${child.name};`;
      }

      return renderMisc(child);
    })
    .join("");

  return `<${element.qname}${renderNamespaces(scope, parent)}${renderAttributes(element)}>${children}</${element.qname}>`;
};

/**
 * Canonicalize a document as Canonical XML 1.0 with comments, in UTF-8.
 *
 * One extension of the specification: an entity the document never declares stays a reference, so
 * an `EntityRef` child renders as `&name;` and an attribute's recorded references render as
 * `&name;` unescaped at their offsets. The XML declaration and the DOCTYPE are dropped, and every
 * prolog item is followed, and every epilog item preceded, by a line feed.
 *
 * @param doc - The document to canonicalize.
 * @returns The canonical form's bytes.
 */
export const canonicalize = (doc: XmlDocument): Uint8Array => {
  const prolog = doc.prolog.map((item) => `${renderMisc(item)}\n`).join("");
  const epilog = doc.epilog.map((item) => `\n${renderMisc(item)}`).join("");

  return new TextEncoder().encode(`${prolog}${renderElement(doc.root, new Map())}${epilog}`);
};
