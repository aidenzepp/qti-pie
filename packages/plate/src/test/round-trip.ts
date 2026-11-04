import { defaultTreeAdapter, parseFragment } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Node } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";

/**
 * Name an attribute as its source spelled it: `prefix:name` for a foreign attribute that parse5
 * gives a prefix (`xlink:href`, `xml:lang`), and the bare name otherwise (parse5 gives `xmlns` an
 * empty prefix).
 *
 * @param attribute The attribute as parse5 gives it.
 * @returns The attribute's name in the output tree.
 */
const attributeName = (attribute: { readonly name: string; readonly prefix?: string }): string =>
  attribute.prefix === undefined || attribute.prefix === ""
    ? attribute.name
    : `${attribute.prefix}:${attribute.name}`;

/**
 * The child nodes of a parse5 parent, where a `template` holds its children in its `content`.
 *
 * @param parent The parse5 node whose children are read.
 * @returns The children the parser placed under `parent`.
 */
const childNodesOf = (
  parent: DefaultTreeAdapterTypes.ParentNode,
): readonly DefaultTreeAdapterTypes.ChildNode[] =>
  "content" in parent ? parent.content.childNodes : parent.childNodes;

/**
 * Map parse5 child nodes to the output tree's nodes, dropping comments (the serialiser writes none)
 * and doctypes.
 *
 * @param nodes The parse5 nodes, in document order.
 * @returns The output tree's nodes for `nodes`, in the same order.
 */
const fromParse5 = (nodes: readonly DefaultTreeAdapterTypes.ChildNode[]): readonly Node[] =>
  nodes.flatMap((node): readonly Node[] => {
    if (defaultTreeAdapter.isTextNode(node)) {
      return [text(node.value)];
    }

    if (defaultTreeAdapter.isElementNode(node)) {
      const attributes: Attributes = Object.fromEntries(
        node.attrs.map((attribute) => [attributeName(attribute), attribute.value]),
      );

      return [h(node.tagName, attributes, fromParse5(childNodesOf(node)))];
    }

    return [];
  });

/**
 * Parse HTML as a fragment, the way a browser parses `innerHTML`, into the emitter's node tree.
 *
 * Test support: it is the oracle's reading of what the serialiser wrote, so nothing outside
 * `src/test/` imports it, and `parse5` is never reachable from the core.
 *
 * @param html The HTML to parse.
 * @returns The fragment's top-level nodes: elements with every attribute value a string and text as
 *   the parser gives it, without comments.
 */
export const parseHtml = (html: string): readonly Node[] =>
  fromParse5(parseFragment(html).childNodes);

/**
 * Rewrite a node into HTML's own text model, which is what the parser gives back: adjacent text
 * children merged, empty text children dropped, and a `true` attribute as the empty string a bare
 * attribute name parses to.
 *
 * @param node The node to normalise, with its descendants.
 * @returns The node as the parser would give it back if the serialiser's output read as intended.
 */
const normalise = (node: Node): Node => {
  if (node.kind === "text") {
    return node;
  }

  const attributes: Attributes = Object.fromEntries(
    Object.entries(node.attrs).map(([name, value]) => [name, value === true ? "" : value]),
  );
  const children: Node[] = [];

  for (const child of node.children.map(normalise)) {
    const previous = children.at(-1);

    if (child.kind === "text" && child.text === "") {
      continue;
    }

    if (child.kind === "text" && previous?.kind === "text") {
      children[children.length - 1] = text(previous.text + child.text);
    } else {
      children.push(child);
    }
  }

  return h(node.tag, attributes, children);
};

/**
 * Decide whether two nodes are the same tree: the same kinds, tags and text, the same attribute
 * names with the same values in any order, and the same children in the same order.
 *
 * @param left One node.
 * @param right The other node.
 * @returns Whether `left` and `right` are structurally equal.
 */
const sameNode = (left: Node, right: Node): boolean => {
  if (left.kind === "text" || right.kind === "text") {
    return left.kind === "text" && right.kind === "text" && left.text === right.text;
  }

  const leftAttributes = Object.entries(left.attrs);

  return (
    left.tag === right.tag &&
    leftAttributes.length === Object.keys(right.attrs).length &&
    leftAttributes.every(
      ([name, value]) => Object.hasOwn(right.attrs, name) && right.attrs[name] === value,
    ) &&
    left.children.length === right.children.length &&
    left.children.every((child, index) => {
      const other = right.children[index];

      return other !== undefined && sameNode(child, other);
    })
  );
};

/**
 * The round-trip oracle: decide whether the serialiser's HTML for `node` parses back to `node`.
 *
 * It is true when `parseHtml(toHtml(node))` is exactly one node that equals `node` read in HTML's
 * text model (adjacent text merged, empty text dropped, a `true` attribute as `""`). It is false
 * when the parser restructures the tree (a `div` inside a `p`, a `tr` with no `tbody`) or changes
 * its text (a CR, which the parser turns into a line feed).
 *
 * @param node The tree to write and read back.
 * @returns Whether the tree survives a write and a parse unchanged.
 * @throws {VoidElementChildren} When `node` or a descendant is a void element with children, as
 *   {@link toHtml} does.
 */
export const roundTrips = (node: Node): boolean => {
  const parsed = parseHtml(toHtml(node));
  const [only] = parsed;

  return parsed.length === 1 && only !== undefined && sameNode(only, normalise(node));
};
