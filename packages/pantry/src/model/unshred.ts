/**
 * Unshred: a relational XDM tree back to the crust tree it was read as, and to the bytes an export
 * writes.
 *
 * Shred reads a crust tree into an {@link XdmDocument} through the vocabulary's kind and attribute
 * resolution; unshred runs it backwards through the vocabulary's names ({@link XdmNames}), writes
 * each name no handle stands for as the exact name the tree keeps, and hands the tree to crust's
 * encoder. Every value is written as the tree records it: attributes in source order with their
 * lexical forms verbatim, each recorded entity reference as `&name;`, namespace declarations as
 * written, and character data, comments and processing instructions as read.
 *
 * What the tree does not record, the bytes cannot repeat, and canonical XML erases each of these:
 * a CDATA section is written as escaped text, the namespace declarations are written before the
 * attributes, and the doctype is written first in the prolog, where crust's tree holds it. The
 * tree's document node holds its children by their place in XML's `document` production, as
 * crust's tree does, so every tree converts.
 *
 * @see {@link https://www.w3.org/TR/xml-c14n/ | Canonical XML 1.0}
 */
import { Effect, Option } from "effect";
import { encode } from "@qti-pie/crust/encode.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "@qti-pie/crust/tree.ts";
import type {
  ClosedName,
  ElementKind,
  ExpandedName,
  XdmAttribute,
  XdmAttributeName,
  XdmCharacter,
  XdmChild,
  XdmDocument,
  XdmElement,
  XdmMisc,
  XdmNamespace,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";
import { xmlnsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * An attribute's name as written and as resolved: the prefix it is written with, empty when it has
 * none, beside its expanded name.
 */
interface QualifiedName extends ExpandedName {
  readonly prefix: string;
}

/**
 * The names a vocabulary writes its handles under: the inverse of the kind and attribute
 * resolution shred reads a document through, so a handle unshreds to the name it was read from.
 *
 * Open names need no entry: an open attribute and a foreign element carry their exact names in the
 * tree. Neither entry gives a prefix: an element and an attribute keep the prefix they are written
 * with in the tree, whatever prefix the handle spells.
 */
export interface XdmNames<V extends XdmVocabulary> {
  /**
   * Name the attribute a closed handle stands for.
   *
   * @param name - The handle, which spells the attribute's expanded name.
   * @returns The local name and namespace name the attribute is written and read with. The
   *   attribute's own prefix completes its qualified name.
   */
  readonly attribute: (name: ClosedName<V>) => ExpandedName;
  /**
   * Name the elements of a kind.
   *
   * @param kind - The element kind; a context kind names the element it is a context of.
   * @returns The local name and namespace name of every element of the kind. The element's own
   *   prefix completes its qualified name.
   */
  readonly element: (kind: ElementKind<V>) => ExpandedName;
}

/**
 * Spell a qualified name from its prefix and local name.
 *
 * @param name - The name's parts.
 * @param name.local - Its local name.
 * @param name.prefix - Its prefix, empty when it has none.
 * @returns `prefix:local`, or the local name alone when the prefix is empty.
 */
const qualified = ({
  local,
  prefix,
}: {
  readonly local: string;
  readonly prefix: string;
}): string => (prefix === "" ? local : `${prefix}:${local}`);

/**
 * Write a namespace declaration as the attribute crust's reader gives it: `xmlns` for the default
 * namespace, `xmlns:prefix` otherwise, in the `xmlns` namespace.
 *
 * @param declaration - The declaration as written on its element.
 * @returns The attribute, its value the namespace name as written.
 */
const declarationOf = ({ prefix, uri }: XdmNamespace): Attribute =>
  prefix === ""
    ? {
        local: "xmlns",
        namespace: xmlnsNamespace,
        prefix: "",
        qname: "xmlns",
        references: [],
        value: uri,
      }
    : {
        local: prefix,
        namespace: xmlnsNamespace,
        prefix: "xmlns",
        qname: `xmlns:${prefix}`,
        references: [],
        value: uri,
      };

/**
 * Name an attribute: a closed handle through the vocabulary, an open name by the exact name it
 * carries, each under the prefix it is written with.
 *
 * @param name - The attribute's name in the tree.
 * @param names - The vocabulary's names.
 * @returns The attribute's prefix, local name and namespace name. A name of a no-namespace class is
 *   in no namespace and has no prefix.
 */
const attributeName = <V extends XdmVocabulary>(
  name: XdmAttributeName<V>,
  names: XdmNames<V>,
): QualifiedName => {
  switch (name._tag) {
    case "closed": {
      return { ...names.attribute(name.handle), prefix: name.prefix };
    }
    case "data-*":
    case "no-namespace": {
      return { local: name.local, namespace: "", prefix: "" };
    }
    case "own-namespace":
    case "foreign": {
      return { local: name.local, namespace: name.uri, prefix: name.prefix };
    }
    default: {
      return name satisfies never;
    }
  }
};

/**
 * Write an attribute as crust's tree holds it.
 *
 * @param attribute - The attribute in the tree.
 * @param names - The vocabulary's names.
 * @returns The attribute with its lexical form as its value and its entity references at their
 *   offsets, so the writer escapes the text between them and writes each one as `&name;`.
 */
const attributeOf = <V extends XdmVocabulary>(
  attribute: XdmAttribute<V>,
  names: XdmNames<V>,
): Attribute => {
  const { local, namespace, prefix } = attributeName(attribute.name, names);

  return {
    local,
    namespace,
    prefix,
    qname: qualified({ local, prefix }),
    references: attribute.references,
    value: attribute.lexical,
  };
};

/**
 * Write an element as crust's tree holds it, around a children list the walk fills.
 *
 * @param element - The element in the tree.
 * @param names - The vocabulary's names.
 * @param children - The list the element's children are appended to, in document order.
 * @returns The element, named by its kind through the vocabulary, or by its own name when it is
 *   foreign: its namespace declarations, then its attributes, each in source order.
 */
const elementOf = <V extends XdmVocabulary>(
  element: XdmElement<V>,
  names: XdmNames<V>,
  children: readonly Child[],
): Element => {
  const { local, namespace } =
    element._tag === "element" ? names.element(element.kind) : element.name;

  return {
    attributes: [
      ...element.namespaces.map(declarationOf),
      ...element.attributes.map((attribute) => attributeOf(attribute, names)),
    ],
    children,
    kind: "element",
    local,
    namespace,
    prefix: element.prefix,
    qname: qualified({ local, prefix: element.prefix }),
  };
};

/**
 * Write a comment or a processing instruction as crust's tree holds it.
 *
 * @param node - The node in the tree.
 * @returns The comment or processing instruction, its text as read.
 */
const miscOf = (node: XdmMisc): Misc =>
  node._tag === "comment"
    ? { kind: "comment", text: node.value }
    : { data: node.data, kind: "pi", target: node.target };

/**
 * Write a node that is not an element as crust's tree holds it.
 *
 * @param node - The node in the tree.
 * @returns A text run for text and whitespace, which crust's tree does not tell apart; the comment,
 *   processing instruction or entity reference otherwise.
 */
const characterOf = (node: XdmCharacter): Child => {
  switch (node._tag) {
    case "text":
    case "ws": {
      return { cdata: false, kind: "text", value: node.value };
    }
    case "comment":
    case "pi": {
      return miscOf(node);
    }
    case "entityRef": {
      return { kind: "entityRef", name: node.name };
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Append a child to its parent's children, joining a text run to the run before it.
 *
 * Crust's writer escapes each run on its own, and escapes the `>` of `]]>` only when the `]]` is in
 * the same run, so two runs that meet as `]]` and `>` would write a `]]>`, which XML forbids in
 * character data. One run per stretch of character data writes it escaped, and reads back as the
 * same characters.
 *
 * @param into - The parent's children so far, in document order.
 * @param child - The next child.
 * @see {@link https://www.w3.org/TR/xml/#syntax | XML 1.0, Character Data and Markup}
 */
const append = (into: Child[], child: Child): void => {
  const last = into.at(-1);
  if (child.kind === "text" && last?.kind === "text") {
    into[into.length - 1] = { ...last, value: last.value + child.value };
  } else {
    into.push(child);
  }
};

/**
 * A node of the tree waiting to be written, and the children list it is written into.
 */
interface Pending<V extends XdmVocabulary> {
  readonly into: Child[];
  readonly node: XdmChild<V>;
}

/**
 * Push an element's children onto the walk's stack, last first, so they leave it in document
 * order.
 *
 * @param stack - The walk's stack of nodes still to write.
 * @param children - The element's children in the tree, in document order.
 * @param into - The children list of the element's crust counterpart.
 */
const pushChildren = <V extends XdmVocabulary>(
  stack: Pending<V>[],
  children: readonly XdmChild<V>[],
  into: Child[],
): void => {
  for (let at = children.length - 1; at >= 0; at -= 1) {
    const node = children[at];
    if (node !== undefined) {
      stack.push({ into, node });
    }
  }
};

/**
 * Write the root element and everything below it as crust's tree holds it.
 *
 * The walk keeps its own stack, so a tree of any depth is written without recursion. Each children
 * list receives its children in document order, because a child's whole subtree leaves the stack
 * before its next sibling does.
 *
 * @param root - The root element in the tree.
 * @param names - The vocabulary's names.
 * @returns The root element of crust's tree.
 */
const rootOf = <V extends XdmVocabulary>(root: XdmElement<V>, names: XdmNames<V>): Element => {
  const children: Child[] = [];
  const element = elementOf(root, names, children);
  const stack: Pending<V>[] = [];
  pushChildren(stack, root.children, children);
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { into, node } = next;
    switch (node._tag) {
      case "element":
      case "foreign-element":
      case "no-namespace-element":
      case "own-namespace-element": {
        const below: Child[] = [];
        into.push(elementOf(node, names, below));
        pushChildren(stack, node.children, below);
        break;
      }
      case "text":
      case "ws":
      case "comment":
      case "pi":
      case "entityRef": {
        append(into, characterOf(node));
        break;
      }
      default: {
        return node satisfies never;
      }
    }
  }

  return element;
};

/**
 * Convert a tree to the crust tree its document was read as.
 *
 * The result is the tree crust's reader gave the bytes, but for what the XDM does not record: each
 * text run is plain text where the source may have written CDATA, a stretch of character data is
 * one run, and an element's namespace declarations come before its attributes. The XML declaration
 * is as written, so a caller that writes the tree in another label renames its encoding first, as
 * {@link unshred} does.
 *
 * @param document - The tree to convert.
 * @param names - The vocabulary's names, for every kind and closed attribute name the tree holds.
 * @returns The crust tree: the charset as read, the declaration when the document has one, the
 *   doctype, the comments and processing instructions before and after the root element, and the
 *   root element.
 */
export const toXmlDocument = <V extends XdmVocabulary>(
  document: XdmDocument<V>,
  names: XdmNames<V>,
): XmlDocument => ({
  charset: document.charset,
  declaration: document.declaration,
  doctype: document.doctype,
  epilog: document.epilog.map(miscOf),
  prolog: document.prolog.map(miscOf),
  root: rootOf(document.root, names),
});

/**
 * Write a tree back to the bytes of its document, in the label it is exported in.
 *
 * The tree is converted by {@link toXmlDocument} and encoded by crust in `exportCharset`. A
 * document exported in a label other than the one it was read under has its XML declaration name
 * that label, so the bytes decode as they are written; a document without a declaration gains none.
 * The label was decided at import, and nothing falls back to another.
 *
 * @param document - The tree to write.
 * @param names - The vocabulary's names, for every kind and closed attribute name the tree holds.
 * @returns The bytes, or crust's `EncodeError` when `exportCharset` has no encoder, or a comment,
 *   processing instruction, name or the doctype holds a character the label cannot carry and no
 *   character reference can write.
 * @see {@link encode}
 */
export const unshred = Effect.fn("model.unshred")(function* unshred<V extends XdmVocabulary>(
  document: XdmDocument<V>,
  names: XdmNames<V>,
): Effect.fn.Return<Uint8Array, EncodeError> {
  const { charset, exportCharset } = document;
  yield* Effect.annotateCurrentSpan({ charset, exportCharset });

  const tree = toXmlDocument(document, names);
  const relabelled = tree.declaration.pipe(
    Option.map((declaration) => ({ ...declaration, encoding: Option.some(exportCharset) })),
  );

  return yield* encode(
    exportCharset === charset ? tree : { ...tree, declaration: relabelled },
    exportCharset,
  );
});
