/**
 * The relational XDM: a parsed document as the tree the model shreds into, folds over and unshreds
 * from, and the flat rows the tree is stored as and scanned back from.
 *
 * The document node is a real node of kind `document` above the root element (fin.md §13, P1). The
 * prolog and epilog (comments, processing instructions and the doctype) are its children beside the
 * root element, and the XML declaration is fields of it. So every node but the document node is an
 * ordered child of one parent, and a tree is one node shape whose rows are `Node(parent, at)`, with
 * the document node self-parented as the sentinel the family laws select out (fin.md §12, entry 8).
 *
 * A tree is written in a vocabulary's closed handles ({@link XdmVocabulary}) and holds no ids, so
 * two reads of one document are equal trees; {@link flatten} draws the ids when it writes the rows.
 * Order is the array order of each list: children, namespaces and attributes are in source order.
 */

/**
 * The closed handle types a tree is written in: for each roster the grammar composes, the union of
 * its handles.
 *
 * `kind` is the whole `NodeKind` roster, the kinds {@link FixedKind} names included, and `name` is
 * the whole `AttributeName` roster, the {@link OpenClass} handles included; the tree's types take
 * the element kinds and the closed names out of them. Instantiate it with the composed rosters'
 * handle types for production trees, and with a few literals for generated ones.
 */
export interface XdmVocabulary {
  /**
   * The `ValueDomain` handles: one per distinct lexical definition an attribute value is read
   * under.
   */
  readonly domain: string;
  readonly kind: string;
  readonly name: string;
  /**
   * The `SchemaVersion` handles: the QTI versions a document can be written in.
   */
  readonly version: string;
}

/**
 * The node kinds the XDM fixes whatever the vocabulary: the document node and the six kinds of
 * character data. Each is its own `NodeKind` handle and the `_tag` of its node, so a vocabulary's
 * `NodeKind` roster holds these seven handles as written.
 */
export type FixedKind = "document" | "text" | "ws" | "comment" | "pi" | "entityRef" | "doctype";

/**
 * The `NodeKind` handles of a vocabulary's elements: every handle of its roster but the fixed
 * kinds.
 */
export type ElementKind<V extends XdmVocabulary> = Exclude<V["kind"], FixedKind>;

/**
 * The `NodeKind` handle a node row carries: an element kind, or one of the kinds the XDM fixes.
 */
export type XdmKind<V extends XdmVocabulary> = ElementKind<V> | FixedKind;

/**
 * The `AttributeName` handles that stand for a class of open names rather than one name (fin.md,
 * D2): `data-*` for a `data-*` attribute, `foreign` for an attribute in a namespace no vocabulary
 * models, and `lax` for a no-namespace attribute a lax wildcard admits. An attribute under one
 * keeps its exact name beside the handle, in {@link XdmOpenName}.
 */
export type OpenClass = "data-*" | "foreign" | "lax";

/**
 * The `AttributeName` handles that each name exactly one attribute: every handle of the roster but
 * the open classes. A handle spells its own qualified name, as `xml:lang` and `xsi:schemaLocation`
 * do, so a closed name carries no prefix of its own.
 */
export type ClosedName<V extends XdmVocabulary> = Exclude<V["name"], OpenClass>;

/**
 * The null object of the document node's optional closed fields (fin.md, D7): what `xmlVersion`
 * and `standalone` hold when the document does not write them. Neither field's written values
 * contain it, so it can never be read as one.
 */
export const none = "none";

/**
 * The type of {@link none}.
 */
export type None = typeof none;

/**
 * A `VersionNum` of an XML declaration, as written.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-VersionNum | XML 1.0, VersionNum}
 */
export type XmlVersion = `1.${number}`;

/**
 * The value an XML declaration's `standalone` pseudo-attribute is written with.
 *
 * @see {@link https://www.w3.org/TR/xml/#sec-rmd | XML 1.0, Standalone Document Declaration}
 */
export type Standalone = "yes" | "no";

/**
 * A document node: the XML declaration and the charsets as its fields, and its children in document
 * order.
 *
 * Its fields are total, each optional one through a null object (fin.md, D7), so it is one row of
 * `Document` beside its row of `Node`. The children hold exactly one element, the root, and at most
 * one doctype, before the root; comments and processing instructions sit on either side. Those are
 * the document kind's content model, which the grammar's laws state as they state every element's.
 */
export interface XdmDocument<V extends XdmVocabulary> {
  readonly _tag: "document";
  /**
   * The label the bytes were decoded under, exactly as read.
   */
  readonly charset: string;
  readonly children: readonly XdmDocumentChild<V>[];
  /**
   * The `encoding` the XML declaration writes, as written; the empty label when it writes none or
   * the document has no declaration. `none` is itself a legal encoding name, so the null object
   * here is the empty label, which an encoding name's leading letter excludes.
   *
   * @see {@link https://www.w3.org/TR/xml/#NT-EncName | XML 1.0, EncName}
   */
  readonly encoding: string;
  /**
   * The label the document is written back in: the read label when its encoder can write every
   * character the document holds where no character reference reaches, and `UTF-8` otherwise.
   * Every document has one, so it is a value, never a null object.
   *
   * @see {@link https://www.w3.org/TR/xml/#charencoding | XML 1.0, Character Encoding in Entities}
   */
  readonly exportCharset: string;
  /**
   * The `standalone` the XML declaration writes; `none` when it writes none or the document has no
   * declaration.
   */
  readonly standalone: Standalone | None;
  /**
   * The QTI version the document is written in, which every node below it carries.
   */
  readonly version: V["version"];
  /**
   * The XML declaration's `version`; `none` when the document has no declaration, which is also
   * when `encoding` is empty and `standalone` is `none`.
   */
  readonly xmlVersion: XmlVersion | None;
}

/**
 * Anything a document node holds: its root element, comments, processing instructions and its
 * doctype. Text, whitespace and entity references outside the root element are not XML.
 */
export type XdmDocumentChild<V extends XdmVocabulary> =
  | XdmElement<V>
  | XdmComment
  | XdmPi
  | XdmDoctype;

/**
 * Anything an element holds.
 */
export type XdmChild<V extends XdmVocabulary> =
  | XdmElement<V>
  | XdmText
  | XdmWhitespace
  | XdmComment
  | XdmPi
  | XdmEntityRef;

/**
 * An element: its kind, the prefix its name was written with, and its namespace declarations,
 * attributes and children, each in source order.
 *
 * The kind handle stands for the element's namespace and local name under its parent's kind, so the
 * element keeps no name of its own beside the prefix. Namespace declarations are not attributes:
 * they are a family of their own.
 */
export interface XdmElement<V extends XdmVocabulary> {
  readonly _tag: "element";
  readonly attributes: readonly XdmAttribute<V>[];
  readonly children: readonly XdmChild<V>[];
  readonly kind: ElementKind<V>;
  readonly namespaces: readonly XdmNamespace[];
  /**
   * The prefix of the element's name as written, empty when it has none.
   */
  readonly prefix: string;
}

/**
 * A namespace declaration as written on its element: `xmlns:prefix="uri"`, or `xmlns="uri"` with
 * an empty prefix. An empty `uri` occurs only with an empty prefix, where it undeclares the default
 * namespace.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#ns-decl | Namespaces in XML 1.0, Declaring Namespaces}
 */
export interface XdmNamespace {
  readonly prefix: string;
  readonly uri: string;
}

/**
 * An attribute: its name, the value domain its kind admits it under, and its lexical form.
 *
 * The lexical form is the record: the value as the reader left it after attribute-value
 * normalization, each unexpanded entity reference kept in its lexical form `&name;`. Any typed
 * value is derived from it, never stored beside it.
 */
export interface XdmAttribute<V extends XdmVocabulary> {
  readonly domain: V["domain"];
  readonly lexical: string;
  readonly name: XdmAttributeName<V>;
  /**
   * The unexpanded entity references in `lexical`, in offset order; empty when it holds none.
   */
  readonly references: readonly XdmAttributeReference[];
}

/**
 * An attribute's name: a closed name's handle, or an open name, which always carries its exact
 * name.
 */
export type XdmAttributeName<V extends XdmVocabulary> = XdmClosedName<V> | XdmOpenName;

/**
 * The name of an attribute a closed handle names. Its tag is `closed`, and its `AttributeName`
 * handle is `handle`, as an element's tag is `element` and its handle is its `kind`.
 */
export interface XdmClosedName<V extends XdmVocabulary> {
  readonly _tag: "closed";
  readonly handle: ClosedName<V>;
}

/**
 * The exact name of an attribute under an open class, tagged with that class: its `AttributeName`
 * handle, as a character-data node's tag is its `NodeKind` handle.
 *
 * A `data-*` or `lax` attribute is in no namespace, so it has no prefix and no namespace name; a
 * `foreign` attribute has both, since an unprefixed attribute is in no namespace.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#custom-data-attribute | HTML, custom data attributes}
 */
export type XdmOpenName =
  | { readonly _tag: "data-*"; readonly local: `data-${string}` }
  | { readonly _tag: "lax"; readonly local: string }
  | {
      readonly _tag: "foreign";
      readonly local: string;
      readonly prefix: string;
      readonly uri: string;
    };

/**
 * One unexpanded entity reference inside an attribute's lexical form.
 */
export interface XdmAttributeReference {
  readonly name: string;
  /**
   * The offset in the attribute's lexical form of the reference's `&`.
   */
  readonly offset: number;
}

/**
 * A run of character data holding at least one character that is not XML whitespace.
 *
 * A CDATA section is character data like any other, so the node keeps no record of which form a run
 * was written in.
 */
export interface XdmText {
  readonly _tag: "text";
  readonly value: string;
}

/**
 * A non-empty run of character data made only of XML whitespace: spaces, tabs, carriage returns and
 * line feeds.
 */
export interface XdmWhitespace {
  readonly _tag: "ws";
  readonly value: string;
}

/**
 * A comment, holding the text between `<!--` and `-->`.
 */
export interface XdmComment {
  readonly _tag: "comment";
  readonly value: string;
}

/**
 * A processing instruction: its target, and the data after it, empty when it has none.
 */
export interface XdmPi {
  readonly _tag: "pi";
  readonly data: string;
  readonly target: string;
}

/**
 * A reference to an entity the document does not declare, kept by name and written back as
 * `&name;`.
 */
export interface XdmEntityRef {
  readonly _tag: "entityRef";
  readonly name: string;
}

/**
 * The document type declaration, the whole `<!DOCTYPE ... >` text as written.
 */
export interface XdmDoctype {
  readonly _tag: "doctype";
  readonly value: string;
}

/**
 * A node id: the language of a uuid's hyphenated spelling, which is the type of
 * `crypto.randomUUID()` and of grizzle's `Uuid`, so an id of either kind is a node id.
 */
export type NodeId = `${string}-${string}-${string}-${string}-${string}`;

/**
 * One node's `Node` row: its id, its parent and its slot among the parent's children, its kind, the
 * prefix its name was written with, and its document's version.
 *
 * The document node is its own parent at slot 0, so `parent` is total. It alone is of kind
 * `document`, the one node at depth 0, and the children family selects it out. A node that is not
 * an element has the empty prefix.
 */
export interface NodeRow<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly id: NodeId;
  readonly kind: XdmKind<V>;
  readonly parent: NodeId;
  readonly prefix: string;
  readonly version: V["version"];
}

/**
 * The document node's `Document` row, keyed by the node: its {@link XdmDocument} fields but its
 * children and its version, which its `Node` row carries.
 */
export interface DocumentRow {
  readonly charset: string;
  readonly encoding: string;
  readonly exportCharset: string;
  readonly node: NodeId;
  readonly standalone: Standalone | None;
  readonly xmlVersion: XmlVersion | None;
}

/**
 * The row of a character-data node whose content is one text: a `Text`, `Whitespace`, `Comment` or
 * `Doctype` row, keyed by the node.
 */
export interface CharacterRow {
  readonly node: NodeId;
  readonly value: string;
}

/**
 * A processing instruction's `Pi` row, keyed by its node.
 */
export interface PiRow {
  readonly data: string;
  readonly node: NodeId;
  readonly target: string;
}

/**
 * An entity reference's `EntityRef` row, keyed by its node.
 */
export interface EntityRefRow {
  readonly name: string;
  readonly node: NodeId;
}

/**
 * A namespace declaration's `Namespace` row, at its slot among its element's declarations.
 */
export interface NamespaceRow {
  readonly at: bigint;
  readonly node: NodeId;
  readonly prefix: string;
  readonly uri: string;
}

/**
 * An attribute's `Attribute` row, at its slot among its element's attributes: its name handle, an
 * open class's included, and its value domain.
 */
export interface AttributeRow<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly domain: V["domain"];
  readonly name: ClosedName<V> | OpenClass;
  readonly node: NodeId;
}

/**
 * An attribute's lexical form, keyed by its attribute row: the record field of the value relation
 * its domain names.
 */
export interface LexicalRow {
  readonly at: bigint;
  readonly lexical: string;
  readonly node: NodeId;
}

/**
 * The exact name of an attribute under an open class, keyed by its attribute row. A `data-*` or
 * `lax` name has the empty prefix and the empty namespace name.
 */
export interface OpenNameRow {
  readonly at: bigint;
  readonly local: string;
  readonly node: NodeId;
  readonly prefix: string;
  readonly uri: string;
}

/**
 * An unexpanded entity reference inside an attribute's lexical form, keyed by its attribute row and
 * its offset.
 */
export interface AttributeEntityRow {
  readonly at: bigint;
  readonly name: string;
  readonly node: NodeId;
  readonly offset: bigint;
}

/**
 * The rows one document is stored as, by relation: the record fields of the document layer, every
 * field the database or the host folds derive left out.
 *
 * They are what an export's scans of one document return and what a tree is rebuilt from. Any row
 * that carries at least these fields is one of these rows, so the schema's own inferred rows stand
 * in for them as they are.
 */
export interface FlatRows<V extends XdmVocabulary> {
  readonly attributeEntities: readonly AttributeEntityRow[];
  readonly attributes: readonly AttributeRow<V>[];
  readonly comments: readonly CharacterRow[];
  readonly doctypes: readonly CharacterRow[];
  readonly document: DocumentRow;
  readonly entityRefs: readonly EntityRefRow[];
  readonly lexicals: readonly LexicalRow[];
  readonly namespaces: readonly NamespaceRow[];
  readonly nodes: readonly NodeRow<V>[];
  readonly openNames: readonly OpenNameRow[];
  readonly pis: readonly PiRow[];
  readonly texts: readonly CharacterRow[];
  readonly whitespace: readonly CharacterRow[];
}

/**
 * A node below the document node waiting to be written: the node, its parent's id and its slot.
 */
interface Placed<V extends XdmVocabulary> {
  readonly at: number;
  readonly node: XdmChild<V> | XdmDoctype;
  readonly parent: NodeId;
}

/**
 * Push a parent's children onto the walk's stack, last first, so they leave it in document order.
 *
 * @param stack - The walk's stack of nodes still to write.
 * @param children - The parent's children, in document order.
 * @param parent - The parent's id.
 */
const pushChildren = <V extends XdmVocabulary>(
  stack: Placed<V>[],
  children: readonly (XdmChild<V> | XdmDoctype)[],
  parent: NodeId,
): void => {
  for (let at = children.length - 1; at >= 0; at -= 1) {
    const node = children[at];
    if (node !== undefined) {
      stack.push({ at, node, parent });
    }
  }
};

/**
 * Write a document as its rows.
 *
 * Nodes are numbered in document order, the document node 0, and `nodes` lists them in that order,
 * so `nodes[i]` is the node numbered `i` and its id is `idOf(i)`. Every other list is in document
 * order of its rows' nodes, then slot order. The walk keeps its own stack, so a tree of any depth
 * is written without recursion.
 *
 * @param document - The tree to write.
 * @param idOf - Draws the id of the node numbered by its argument; called once per node, in order.
 * @returns The document's rows: the document node at slot 0 as its own parent, each other node at
 *   its slot under its parent with its document's version, and one row of each attribute, lexical
 *   form, open name, entity reference, namespace declaration and character-data node.
 */
export const flatten = <V extends XdmVocabulary>(
  document: XdmDocument<V>,
  idOf: (index: number) => NodeId,
): FlatRows<V> => {
  const { version } = document;
  const self = idOf(0);
  const nodes: NodeRow<V>[] = [
    { at: 0n, id: self, kind: document._tag, parent: self, prefix: "", version },
  ];
  const attributeEntities: AttributeEntityRow[] = [];
  const attributes: AttributeRow<V>[] = [];
  const comments: CharacterRow[] = [];
  const doctypes: CharacterRow[] = [];
  const entityRefs: EntityRefRow[] = [];
  const lexicals: LexicalRow[] = [];
  const namespaces: NamespaceRow[] = [];
  const openNames: OpenNameRow[] = [];
  const pis: PiRow[] = [];
  const texts: CharacterRow[] = [];
  const whitespace: CharacterRow[] = [];
  const valued = { comment: comments, doctype: doctypes, text: texts, ws: whitespace };

  const stack: Placed<V>[] = [];
  pushChildren(stack, document.children, self);
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, parent } = next;
    const id = idOf(nodes.length);
    const at = BigInt(next.at);
    if (node._tag === "element") {
      nodes.push({ at, id, kind: node.kind, parent, prefix: node.prefix, version });
      for (const [slot, { prefix, uri }] of node.namespaces.entries()) {
        namespaces.push({ at: BigInt(slot), node: id, prefix, uri });
      }

      for (const [slot, attribute] of node.attributes.entries()) {
        const key = { at: BigInt(slot), node: id };
        const { domain, name } = attribute;
        if (name._tag === "closed") {
          attributes.push({ ...key, domain, name: name.handle });
        } else {
          attributes.push({ ...key, domain, name: name._tag });
          openNames.push(
            name._tag === "foreign"
              ? { ...key, local: name.local, prefix: name.prefix, uri: name.uri }
              : { ...key, local: name.local, prefix: "", uri: "" },
          );
        }

        lexicals.push({ ...key, lexical: attribute.lexical });
        for (const reference of attribute.references) {
          attributeEntities.push({
            ...key,
            name: reference.name,
            offset: BigInt(reference.offset),
          });
        }
      }

      pushChildren(stack, node.children, id);
    } else {
      nodes.push({ at, id, kind: node._tag, parent, prefix: "", version });
      if (node._tag === "pi") {
        pis.push({ data: node.data, node: id, target: node.target });
      } else if (node._tag === "entityRef") {
        entityRefs.push({ name: node.name, node: id });
      } else {
        valued[node._tag].push({ node: id, value: node.value });
      }
    }
  }

  return {
    attributeEntities,
    attributes,
    comments,
    doctypes,
    document: {
      charset: document.charset,
      encoding: document.encoding,
      exportCharset: document.exportCharset,
      node: self,
      standalone: document.standalone,
      xmlVersion: document.xmlVersion,
    },
    entityRefs,
    lexicals,
    namespaces,
    nodes,
    openNames,
    pis,
    texts,
    whitespace,
  };
};
