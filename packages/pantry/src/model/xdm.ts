/**
 * The relational XDM: a parsed document as the tree the model shreds into, folds over and unshreds
 * from, and the flat rows the tree is stored as and scanned back from.
 *
 * The document node is a real node of kind `document` above the root element (fin.md §13, P1). Its
 * children are the doctype, the prolog's comments and processing instructions, the root element
 * and the epilog's, and the XML declaration is fields of it. So every node but the document node is
 * an ordered child of one parent, and a tree is one node shape whose rows are `Node(parent, at)`,
 * with the document node self-parented as the sentinel the family laws select out (fin.md §12,
 * entry 8). Each row also carries its pre-order interval `[start, end)` (trees.md §1), so the rows
 * of one document, sorted by `start`, are the document in order, and a node's descendants are the
 * rows whose `start` its interval holds.
 *
 * The tree states the shape of each node's children in its type, so a tree a type admits is a tree
 * XML admits: a document holds exactly one root element, a doctype at most once and first, and no
 * character data; and an element holds no doctype. The rows cannot carry that shape in their
 * types, so `assemble` parses rows into it once. A foreign element holds what any element holds:
 * XML Schema assesses its content laxly, against `xs:anyType`, whose content is a `##any` `lax`
 * wildcard, so its children are elements of a kind where a global declaration names them and
 * foreign elements otherwise (XML Schema 1.0 Part 1, §3.4.7 and §3.10.4; spec readings 30 and 57).
 *
 * A tree is written in a vocabulary's closed handles ({@link XdmVocabulary}) and holds no ids, so
 * two reads of one document are equal trees; {@link flatten} draws the ids when it writes the rows.
 * A name no handle stands for, an open attribute's or a foreign element's, is kept exactly beside
 * the handle of its class, and every element and attribute keeps the prefix its name is written
 * with, so the document is written back under the names it was read under (spec reading 47). Order
 * is the array order of each list: children, namespaces and attributes are in source order. Each
 * element's `children`, `attributes` and `namespaces` are the families `Node`'s count fields of
 * those names count (plan §1.3), so the tree is the nested shape a family write takes.
 */
import { Option } from "effect";
import type { Types } from "effect";
import type { ForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { OpenName } from "#pantry/vocab/open.ts";
import { xlinkNamespace, xmlNamespace, xsiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The closed handle types a tree is written in: for each roster the grammar composes, the union of
 * its handles.
 *
 * `kind` is the whole `NodeKind` roster, the kinds {@link FixedKind} and `ForeignKind` name
 * included, and `name` is the whole `AttributeName` roster, the {@link OpenClass} handles included;
 * the tree's types take the element kinds and the closed names out of them. Instantiate it with
 * the composed rosters' handle types for production trees, and with a few literals for generated
 * ones.
 */
export interface XdmVocabulary {
  readonly kind: string;
  readonly name: string;
  /**
   * The `SchemaVersion` handles: the QTI versions a document can be written in.
   */
  readonly version: string;
}

/**
 * The node kinds the XDM fixes whatever the vocabulary: the document node, the doctype and the five
 * kinds of character data. Each is its own `NodeKind` handle, and the `_tag` of a character-data
 * node, so a vocabulary's `NodeKind` roster holds these seven handles as written.
 */
export type FixedKind = "document" | "text" | "ws" | "comment" | "pi" | "entityRef" | "doctype";

/**
 * The `NodeKind` handles a vocabulary names its elements by: every handle of its roster but the
 * fixed kinds and the three foreign kinds (`foreignKinds` of `#pantry/grammar/kinds.ts`).
 */
export type ElementKind<V extends XdmVocabulary> = Exclude<V["kind"], FixedKind | ForeignKind>;

/**
 * The `NodeKind` handle a node row carries: an element kind, or one of the kinds the XDM fixes.
 */
export type XdmKind<V extends XdmVocabulary> = ElementKind<V> | ForeignKind | FixedKind;

/**
 * The `AttributeName` handles that stand for a class of open names rather than one name (fin.md,
 * D2), the roster's own {@link openClasses}. An attribute under one keeps what its class leaves of
 * its exact name beside the handle, in an `OpenName` (`#pantry/vocab/open.ts`).
 */
export type OpenClass = (typeof openClasses)[number];

/**
 * The `AttributeName` handles that each name exactly one attribute: every handle of the roster but
 * the open classes. A handle spells its expanded name, its namespace by that namespace's own prefix
 * in {@link handlePrefixes}, as `xml:lang`, `xsi:schemaLocation` and `xlink:href` do. That prefix is
 * the handle's, not the document's: a document may bind any prefix to XML Schema's instance
 * namespace or to XLink's, so a closed name keeps the prefix it is written with beside its handle
 * ({@link XdmClosedName}).
 */
export type ClosedName<V extends XdmVocabulary> = Exclude<V["name"], OpenClass>;

/**
 * The namespaces a closed handle's prefix stands for: the XML namespace's own `xml`, `xsi` for XML
 * Schema's instance attributes, and `xlink` for XLink's global attributes, which the
 * content-packaging extension imports. A closed handle without a prefix names an attribute in no
 * namespace, and no attribute in any other namespace has a closed handle. The codec spells a
 * handle and names it back through this one table.
 */
export const handlePrefixes = [
  { namespace: xmlNamespace, prefix: "xml" },
  { namespace: xsiNamespace, prefix: "xsi" },
  { namespace: xlinkNamespace, prefix: "xlink" },
] as const;

/**
 * Read the prefix a closed handle spells its namespace with: the {@link handlePrefixes} prefix it
 * begins with, followed by its colon.
 *
 * @param handle - The handle.
 * @returns The prefix, or the empty string for a handle of a name in no namespace.
 */
export const handlePrefixOf = (handle: string): string =>
  handlePrefixes.find(({ prefix }) => handle.startsWith(`${prefix}:`))?.prefix ?? "";

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
 * An XML declaration: the version it declares, and the `encoding` and `standalone` it writes, each
 * as written. Neither can be written without the declaration, so they are its fields.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-XMLDecl | XML 1.0, XMLDecl}
 */
export interface XdmDeclaration {
  readonly encoding: Option.Option<string>;
  readonly standalone: Option.Option<Standalone>;
  readonly version: XmlVersion;
}

/**
 * A document node: the XML declaration and the charsets as its fields, and its children by their
 * place in XML's `document` production.
 *
 * It is one row of `Document` beside its row of `Node`, the row's null objects standing for what
 * the declaration does not write (fin.md, D7). Its children are the doctype, first when it has one,
 * then the prolog, the root element and the epilog, each in document order.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-document | XML 1.0, document}
 */
export interface XdmDocument<V extends XdmVocabulary> {
  readonly _tag: "document";
  /**
   * The label the bytes were decoded under, exactly as read.
   */
  readonly charset: string;
  /**
   * The XML declaration, none when the document writes none.
   */
  readonly declaration: Option.Option<XdmDeclaration>;
  /**
   * The document type declaration, the whole `<!DOCTYPE ... >` text as written; none when the
   * document has none. It is the document node's first child.
   */
  readonly doctype: Option.Option<string>;
  /**
   * The comments and processing instructions after the root element.
   */
  readonly epilog: readonly XdmMisc[];
  /**
   * The label the document is written back in: the read label when its encoder can write every
   * character the document holds where no character reference reaches, and `UTF-8` otherwise.
   * Every document has one, so it is a value, never a null object.
   *
   * @see {@link https://www.w3.org/TR/xml/#charencoding | XML 1.0, Character Encoding in Entities}
   */
  readonly exportCharset: string;
  /**
   * The comments and processing instructions before the root element, after the doctype.
   */
  readonly prolog: readonly XdmMisc[];
  /**
   * The root element. No element wildcard sits above it, so it is always an element a vocabulary
   * names.
   */
  readonly root: XdmClosedElement<V>;
  /**
   * The QTI version the document is written in, which every node below it carries.
   */
  readonly version: V["version"];
}

/**
 * What a prolog or an epilog holds: comments and processing instructions.
 */
export type XdmMisc = XdmComment | XdmPi;

/**
 * A node of character data: text, whitespace, a comment, a processing instruction or an entity
 * reference. It holds no children.
 */
export type XdmCharacter = XdmText | XdmWhitespace | XdmComment | XdmPi | XdmEntityRef;

/**
 * Anything an element holds, of a kind or foreign: elements of either shape, and character data.
 */
export type XdmChild<V extends XdmVocabulary> =
  | XdmClosedElement<V>
  | XdmForeignElement<V>
  | XdmCharacter;

/**
 * An element: one a vocabulary names, which its kind stands for ({@link XdmClosedElement}), or a
 * foreign element, which carries its own name ({@link XdmForeignElement}). The tag tells them
 * apart, as a node row's kind does.
 */
export type XdmElement<V extends XdmVocabulary> = XdmClosedElement<V> | XdmForeignElement<V>;

/**
 * An element a vocabulary names: its kind, the prefix its name was written with, and its namespace
 * declarations, attributes and children, each in source order.
 *
 * The kind handle stands for the element's namespace and local name under its parent's kind, so the
 * element keeps no name of its own beside the prefix. Namespace declarations are not attributes:
 * they are a family of their own.
 */
export interface XdmClosedElement<V extends XdmVocabulary> {
  readonly _tag: "element";
  readonly attributes: readonly XdmAttribute<V>[];
  readonly children: readonly XdmChild<V>[];
  /**
   * The element's governing type (XML Schema 1.0 Part 1, §3.3.4 clause 4), a `TypeName` handle of
   * `#pantry/grammar/xsi.ts`: the type its `xsi:type` names, resolved against its in-scope
   * namespaces, or its declared type without one, `none` for an anonymous declared type. It is a
   * property of the element, as its kind is, and stands beside the `xsi:type` lexical form as the
   * kind stands beside the element's name: the codec writes it, the law reads it.
   */
  readonly governs: string;
  readonly kind: ElementKind<V>;
  readonly namespaces: readonly XdmNamespace[];
  /**
   * The prefix of the element's name as written, empty when it has none.
   */
  readonly prefix: string;
}

/**
 * A name as a namespace-aware reader resolves it: its local name and the namespace name it is in,
 * empty when it is in none.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#dt-expname | Namespaces in XML 1.0, expanded name}
 */
export interface ExpandedName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * An element no declaration names where it sits, which an element wildcard admits (fin.md, D2):
 * tagged with its `ForeignKind`, the class of its namespace against its parent's
 * (`namespaceClassOf` of `#pantry/vocab/namespaces.ts`): `foreign-element` in another namespace,
 * `no-namespace-element` in none, `own-namespace-element` in its parent's. One kind stands for
 * every foreign element of a class, so it keeps its expanded name, as an open attribute keeps its
 * exact name beside its class; the prefix completes its qualified name.
 *
 * Its name's namespace is the one its class says: empty for `no-namespace-element`, its parent's
 * for `own-namespace-element`, and another for `foreign-element`. Shred writes them so, and the
 * foreign-namespace law states it over the stored rows. Its children are read as anywhere else, so
 * an element below it that a global declaration names is of that kind.
 */
export interface XdmForeignElement<V extends XdmVocabulary> {
  readonly _tag: ForeignKind;
  readonly attributes: readonly XdmAttribute<V>[];
  readonly children: readonly XdmChild<V>[];
  /**
   * The element's governing type, a `TypeName` handle of `#pantry/grammar/xsi.ts`: the type its
   * `xsi:type` names, where that resolves to a type its document's schema set holds or a built-in,
   * and `none` otherwise. No declaration assesses a foreign element, so its `xsi:type` alone gives
   * it a type, against which XML Schema then assesses it (XML Schema 1.0 Part 1, §3.3.4,
   * Schema-Validity Assessment (Element), clause 1.2; spec reading 60): a simple type's text is
   * checked, a complex one's is reading 50's limit.
   */
  readonly governs: string;
  readonly name: ExpandedName;
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
 * An attribute: its name and its lexical form.
 *
 * The lexical form is the record: the value as the reader left it after attribute-value
 * normalization, each unexpanded entity reference kept in its lexical form `&name;`. Its value
 * domain is no field of it: the grammar applies the domain its kind admits its name under
 * (`AttributeGrammar.at(version, kind, name)`, U1), whose pattern reads the lexical form as it is,
 * and any typed value is derived from that, never stored beside it.
 */
export interface XdmAttribute<V extends XdmVocabulary> {
  readonly lexical: string;
  readonly name: XdmAttributeName<V>;
  /**
   * The unexpanded entity references in `lexical`, in offset order; empty when it holds none.
   */
  readonly references: readonly XdmAttributeReference[];
}

/**
 * An attribute's name: a closed name's handle, or an open name (`OpenName` of
 * `#pantry/vocab/open.ts`), which carries what its class leaves of its exact name. Each keeps the
 * prefix the name is written with, where its namespace has one, so the attribute is written back
 * under the name it was read under (spec reading 47).
 */
export type XdmAttributeName<V extends XdmVocabulary> = XdmClosedName<V> | OpenName;

/**
 * The name of an attribute a closed handle names. Its tag is `closed`, and its `AttributeName`
 * handle is `handle`, as an element's tag is `element` and its handle is its `kind`.
 */
export interface XdmClosedName<V extends XdmVocabulary> {
  readonly _tag: "closed";
  readonly handle: ClosedName<V>;
  /**
   * The prefix the name is written with: empty for a name in no namespace, which Namespaces in XML
   * writes unprefixed (§6.2), and `xml` for the XML namespace's, which no other prefix is bound to
   * (§3). An `xsi:` or `xlink:` handle's name keeps the prefix its document binds to that
   * namespace, which need not be the handle's own: `zs:nil` is the handle `xsi:nil`, written
   * `zs:nil`.
   *
   * @see {@link https://www.w3.org/TR/xml-names/#ns-qualnames | Namespaces in XML 1.0, §3 and §6.2}
   */
  readonly prefix: string;
}

/**
 * Name an attribute by a closed handle, written with the prefix the handle spells unless another is
 * given: the closed name a tree built by hand holds. It is typed by the handle, so it is the
 * {@link XdmClosedName} of every vocabulary whose closed names hold that handle.
 *
 * @param handle - The handle.
 * @param prefix - The prefix the name is written with; {@link handlePrefixOf} the handle by
 *   default, the only prefix a name in no namespace or in the XML namespace is written with.
 * @returns The closed name.
 */
export const closedName = <const Handle extends string>(
  handle: Handle,
  prefix: string = handlePrefixOf(handle),
) => ({ _tag: "closed", handle, prefix }) as const;

/**
 * Read the prefix an attribute's name is written with.
 *
 * @param name - The name.
 * @returns A closed name's prefix, and a namespaced open name's; the empty prefix of a `data-*` or
 *   `no-namespace` name, which is in no namespace.
 */
export const attributePrefixOf = <V extends XdmVocabulary>(name: XdmAttributeName<V>): string => {
  switch (name._tag) {
    case "closed":
    case "own-namespace":
    case "foreign": {
      return name.prefix;
    }
    case "data-*":
    case "no-namespace": {
      return "";
    }
    default: {
      return name satisfies never;
    }
  }
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
 * was written in, and no two runs are adjacent: a stretch of character data between two other nodes
 * is one node, as in the XPath data model.
 *
 * @see {@link https://www.w3.org/TR/xpath-datamodel/#TextNodeOverview | XDM 3.1, Text Nodes}
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
 * The document node's doctype child, as its family holds it ({@link documentFamily}): the doctype
 * text a document's {@link XdmDocument.doctype} holds.
 */
export interface XdmDoctype {
  readonly _tag: "doctype";
  readonly value: string;
}

/**
 * A child of the document node, as its family holds it: the doctype, a comment or processing
 * instruction, or the root element.
 */
export type XdmDocumentChild<V extends XdmVocabulary> = XdmClosedElement<V> | XdmMisc | XdmDoctype;

/**
 * List the document node's children family: the doctype, the prolog, the root element and the
 * epilog, in document order, the slots `flatten` writes them at.
 *
 * @param document - The document.
 * @returns Its children, the doctype first when it has one.
 */
export const documentFamily = <V extends XdmVocabulary>(
  document: XdmDocument<V>,
): readonly XdmDocumentChild<V>[] => [
  ...Option.match(document.doctype, {
    onNone: (): readonly XdmDoctype[] => [],
    onSome: (value): readonly XdmDoctype[] => [{ _tag: "doctype", value }],
  }),
  ...document.prolog,
  document.root,
  ...document.epilog,
];

/**
 * The null object of the document row's optional closed fields (fin.md, D7): what `xmlVersion` and
 * `standalone` hold when the document does not write them. Neither field's written values contain
 * it, so it can never be read as one.
 */
export const none = "none";

/**
 * The type of {@link none}.
 */
export type None = typeof none;

/**
 * A node id: the language of a uuid's hyphenated spelling, which is the type of
 * `crypto.randomUUID()` and of grizzle's `Uuid`, so an id of either kind is a node id.
 */
export type NodeId = `${string}-${string}-${string}-${string}-${string}`;

/**
 * An attribute id, a uuid as a node's is. An attribute is a row of its own, and the rows that
 * belong to it, its open name and its entity references, name it by its id: its slot among its
 * element's attributes is its place, never its identity.
 */
export type AttributeId = NodeId;

/**
 * One node's `Node` row: its id, its parent and its slot among the parent's children, its pre-order
 * interval, its kind, the prefix its name was written with, and its document's version.
 *
 * The document node is its own parent at slot 0, so `parent` is total. It alone is of kind
 * `document` and its own parent, and the children family selects it out. A node that is not an
 * element has the empty prefix.
 *
 * `[start, end)` is the node's pre-order interval within its document (trees.md, T1 to T6):
 * `start` is its index in document order, the document node's 0, and `end − start` is the number
 * of nodes its subtree holds, itself included. So the document node's interval is `[0, N)` for a
 * document of N nodes, a leaf's holds only itself, a node is below another exactly when the other's
 * interval holds its `start`, and a node's children tile `[start + 1, end)` in slot order.
 */
export interface NodeRow<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly end: bigint;
  /**
   * The element's governing type ({@link XdmClosedElement}'s or {@link XdmForeignElement}'s), and
   * {@link none} for a node that is no element, which no named type governs.
   */
  readonly governs: string;
  readonly id: NodeId;
  readonly kind: XdmKind<V>;
  readonly parent: NodeId;
  readonly prefix: string;
  readonly start: bigint;
  readonly version: V["version"];
}

/**
 * The document node's `Document` row, keyed by the node: the charsets, and the XML declaration's
 * fields through their null objects (fin.md, D7), since a row's fields are total.
 *
 * `xmlVersion` is {@link none} when the document writes no declaration, and then `encoding` is
 * empty and `standalone` is `none` too. `encoding` is empty when the declaration writes none:
 * `none` is itself a legal encoding name, so its null object is the empty label, which an encoding
 * name's leading letter excludes.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-EncName | XML 1.0, EncName}
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
 * An attribute's `Attribute` row, its id at its slot among its element's attributes: its name
 * handle, an open class's included, the prefix its name is written with, and its lexical form, the
 * record (U1). Its value domain is the grammar's to apply, so the row stores none.
 *
 * The prefix is every attribute's, closed or open, so it is stored once, here, and an open name's
 * row keeps only what its class leaves of the rest of its name.
 */
export interface AttributeRow<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly id: AttributeId;
  readonly lexical: string;
  readonly name: ClosedName<V> | OpenClass;
  readonly node: NodeId;
  readonly prefix: string;
}

/**
 * The exact name of an attribute under an open class, keyed by its attribute's id: what its class
 * leaves of its name beside the prefix its attribute row keeps. A name in no namespace has the
 * empty namespace name; an `own-namespace` or `foreign` name keeps its namespace as written
 * whatever its class, which the foreign attribute class law reads against its element's.
 */
export interface OpenNameRow {
  readonly attribute: AttributeId;
  readonly local: string;
  readonly uri: string;
}

/**
 * A foreign element's expanded name, keyed by its node: the `OpenElementName` row beside a node of
 * one of the foreign kinds, whose class its namespace agrees with. The prefix is the node row's
 * own.
 */
export interface OpenElementNameRow {
  readonly local: string;
  readonly namespace: string;
  readonly node: NodeId;
}

/**
 * An unexpanded entity reference inside an attribute's lexical form, keyed by its attribute's id
 * and its offset.
 */
export interface AttributeEntityRow {
  readonly attribute: AttributeId;
  readonly name: string;
  readonly offset: bigint;
}

/**
 * The rows one document is stored as, by relation: the record fields of the document layer and each
 * node's pre-order interval, every other field the database or the host folds derive left out.
 *
 * They are what an export's scans of one document return and what a tree is rebuilt from, the node
 * rows in `start` order (trees.md §3), with no recursive read. Any row that carries at least these
 * fields is one of these rows, so the schema's own inferred rows stand in for them as they are.
 */
export interface FlatRows<V extends XdmVocabulary> {
  readonly attributeEntities: readonly AttributeEntityRow[];
  readonly attributes: readonly AttributeRow<V>[];
  readonly comments: readonly CharacterRow[];
  readonly doctypes: readonly CharacterRow[];
  readonly document: DocumentRow;
  readonly entityRefs: readonly EntityRefRow[];
  readonly namespaces: readonly NamespaceRow[];
  readonly nodes: readonly NodeRow<V>[];
  readonly openElementNames: readonly OpenElementNameRow[];
  readonly openNames: readonly OpenNameRow[];
  readonly pis: readonly PiRow[];
  readonly texts: readonly CharacterRow[];
  readonly whitespace: readonly CharacterRow[];
}

/**
 * A step of `flatten`'s walk: a node below the document node to write, with its parent's id and
 * its slot; or an element whose subtree the walk has written, whose interval it closes.
 */
type Step<V extends XdmVocabulary> =
  | {
      readonly _tag: "open";
      readonly at: number;
      readonly node: XdmChild<V> | XdmDocumentChild<V>;
      readonly parent: NodeId;
    }
  | { readonly _tag: "close"; readonly row: Types.Mutable<NodeRow<V>> };

/**
 * Push a parent's children onto the walk's stack, last first, so they leave it in document order.
 *
 * @param stack - The walk's stack of steps still to take.
 * @param children - The parent's children, in document order.
 * @param parent - The parent's id.
 */
const pushChildren = <V extends XdmVocabulary>(
  stack: Step<V>[],
  children: readonly (XdmChild<V> | XdmDocumentChild<V>)[],
  parent: NodeId,
): void => {
  for (const [at, node] of children.entries().toArray().toReversed()) {
    stack.push({ _tag: "open", at, node, parent });
  }
};

/**
 * An attribute the walk has met, waiting for its id, which is numbered after every node's: its
 * element's id and its slot there.
 */
interface MetAttribute<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly attribute: XdmAttribute<V>;
  readonly node: NodeId;
}

/**
 * Write a document's XML declaration as its row's fields, each through its null object.
 *
 * @param declaration - The declaration, none when the document writes none.
 * @returns `xmlVersion`, `encoding` and `standalone` as the `Document` row holds them.
 */
const declarationRow = (
  declaration: Option.Option<XdmDeclaration>,
): Pick<DocumentRow, "encoding" | "standalone" | "xmlVersion"> =>
  Option.match(declaration, {
    onNone: () => ({ encoding: "", standalone: none, xmlVersion: none }),
    onSome: ({ encoding, standalone, version }) => ({
      encoding: Option.getOrElse(encoding, () => ""),
      standalone: Option.getOrElse(standalone, (): None => none),
      xmlVersion: version,
    }),
  });

/**
 * Write an open name as its `OpenAttributeName` row: what its class leaves of the name beside its
 * prefix, the namespace name empty for a class in no namespace.
 *
 * @param name - The open name.
 * @param attribute - Its attribute's id.
 * @returns The row: the local name, and the namespace name its class keeps.
 */
const openNameRowOf = (name: OpenName, attribute: AttributeId): OpenNameRow => {
  switch (name._tag) {
    case "data-*":
    case "no-namespace": {
      return { attribute, local: name.local, uri: "" };
    }
    case "own-namespace":
    case "foreign": {
      return { attribute, local: name.local, uri: name.uri };
    }
    default: {
      return name satisfies never;
    }
  }
};

/**
 * Write a document as its rows.
 *
 * Nodes are numbered in document order, the document node 0, and `nodes` lists them in that order,
 * so `nodes[i]` is the node numbered `i`, its `start` is `i` and its id is `idOf(i)`. Each node
 * opens with the interval of itself alone, `[start, start + 1)`, and an element's grows to the
 * count of nodes written when the walk closes its subtree, so `end` is `start` plus the subtree's
 * size. The attributes are numbered after the nodes, in document order of their elements, then
 * slot order: attribute `j` of `attributes` has the id `idOf(N + j)` for a document of N nodes.
 * Every other list is in document order of its rows' nodes, then slot order. The walk keeps its
 * own stack, so a tree of any depth is written without recursion.
 *
 * @param document - The tree to write.
 * @param idOf - Draws the id of the row numbered by its argument: called once per node, in
 *   document order, then once per attribute, in order.
 * @returns The document's rows: the document node at slot 0 as its own parent, over `[0, N)`, each
 *   other node at its slot under its parent over its pre-order interval with its document's
 *   version, and one row of each attribute with its lexical form, open name, entity reference,
 *   namespace declaration, character-data node and foreign element's name.
 */
export const flatten = <V extends XdmVocabulary>(
  document: XdmDocument<V>,
  idOf: (index: number) => NodeId,
): FlatRows<V> => {
  const { version } = document;
  const self = idOf(0);
  const sentinel: Types.Mutable<NodeRow<V>> = {
    at: 0n,
    end: 1n,
    governs: none,
    id: self,
    kind: document._tag,
    parent: self,
    prefix: "",
    start: 0n,
    version,
  };
  const nodes: NodeRow<V>[] = [sentinel];
  const met: MetAttribute<V>[] = [];
  const comments: CharacterRow[] = [];
  const doctypes: CharacterRow[] = [];
  const entityRefs: EntityRefRow[] = [];
  const namespaces: NamespaceRow[] = [];
  const openElementNames: OpenElementNameRow[] = [];
  const pis: PiRow[] = [];
  const texts: CharacterRow[] = [];
  const whitespace: CharacterRow[] = [];
  const valued = { comment: comments, doctype: doctypes, text: texts, ws: whitespace };
  const stack: Step<V>[] = [{ _tag: "close", row: sentinel }];
  const element = (node: XdmElement<V>, row: Types.Mutable<NodeRow<V>>): void => {
    for (const [slot, { prefix, uri }] of node.namespaces.entries()) {
      namespaces.push({ at: BigInt(slot), node: row.id, prefix, uri });
    }

    for (const [slot, attribute] of node.attributes.entries()) {
      met.push({ at: BigInt(slot), attribute, node: row.id });
    }

    nodes.push(row);
    stack.push({ _tag: "close", row });
    pushChildren(stack, node.children, row.id);
  };

  pushChildren(stack, documentFamily(document), self);
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    if (next._tag === "close") {
      next.row.end = BigInt(nodes.length);
      continue;
    }

    const { node, parent } = next;
    const start = nodes.length;
    const id = idOf(start);
    const row = {
      at: BigInt(next.at),
      end: BigInt(start + 1),
      governs: none,
      id,
      parent,
      start: BigInt(start),
      version,
    };
    switch (node._tag) {
      case "element": {
        element(node, { ...row, governs: node.governs, kind: node.kind, prefix: node.prefix });
        break;
      }
      case "foreign-element":
      case "no-namespace-element":
      case "own-namespace-element": {
        openElementNames.push({ local: node.name.local, namespace: node.name.namespace, node: id });
        element(node, { ...row, governs: node.governs, kind: node._tag, prefix: node.prefix });
        break;
      }
      case "pi": {
        nodes.push({ ...row, kind: node._tag, prefix: "" });
        pis.push({ data: node.data, node: id, target: node.target });
        break;
      }
      case "entityRef": {
        nodes.push({ ...row, kind: node._tag, prefix: "" });
        entityRefs.push({ name: node.name, node: id });
        break;
      }
      case "comment":
      case "doctype":
      case "text":
      case "ws": {
        nodes.push({ ...row, kind: node._tag, prefix: "" });
        valued[node._tag].push({ node: id, value: node.value });
        break;
      }
      default: {
        return node satisfies never;
      }
    }
  }

  const attributeEntities: AttributeEntityRow[] = [];
  const attributes: AttributeRow<V>[] = [];
  const openNames: OpenNameRow[] = [];
  for (const [index, { at, attribute, node }] of met.entries()) {
    const id = idOf(nodes.length + index);
    const { lexical, name } = attribute;
    const prefix = attributePrefixOf(name);
    if (name._tag === "closed") {
      attributes.push({ at, id, lexical, name: name.handle, node, prefix });
    } else {
      attributes.push({ at, id, lexical, name: name._tag, node, prefix });
      openNames.push(openNameRowOf(name, id));
    }

    for (const reference of attribute.references) {
      attributeEntities.push({
        attribute: id,
        name: reference.name,
        offset: BigInt(reference.offset),
      });
    }
  }

  return {
    attributeEntities,
    attributes,
    comments,
    doctypes,
    document: {
      charset: document.charset,
      exportCharset: document.exportCharset,
      node: self,
      ...declarationRow(document.declaration),
    },
    entityRefs,
    namespaces,
    nodes,
    openElementNames,
    openNames,
    pis,
    texts,
    whitespace,
  };
};
