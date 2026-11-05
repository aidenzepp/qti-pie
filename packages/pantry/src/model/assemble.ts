/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Assemble: the rows one document is stored as, back to the tree they were written from (fin.md
 * §4.6), the inverse of `flatten` in `#pantry/model/xdm.ts`.
 *
 * Reads return each family's rows in (owner, at) order, the key's index order, and an attribute's
 * entity references in offset order. Assembly takes each owner's rows in the order they arrive, so
 * a node's place among its siblings is its row's place among theirs, and it never sorts; the only
 * slots it reads are attributes', which key the rows that hang off an attribute. Owners may come in
 * any order and interleave: rows in key order and rows in document order, as `flatten` writes them,
 * assemble to the same tree. Every relation is grouped by its owner and every node placed into its
 * parent's children in one pass each, with no stack and no recursion, so a tree of any depth or
 * width assembles in time linear in its rows.
 *
 * The document layer's laws give every node the row of its kind, every attribute its lexical form
 * and every open name its exact name, and put every node under an owner that holds it. A list of
 * rows cannot carry those laws in its type, so assembly refuses rows that break one with a typed
 * error, at this one boundary. The laws whose breach no lookup here meets, the children family's
 * slots and the rank law's parent links reaching the document node, it leaves to the database.
 */
import { Result, Schema } from "effect";
import type {
  AttributeEntityRow,
  AttributeRow,
  ElementKind,
  FlatRows,
  LexicalRow,
  NamespaceRow,
  NodeId,
  NodeRow,
  OpenClass,
  OpenNameRow,
  XdmAttribute,
  XdmAttributeName,
  XdmChild,
  XdmComment,
  XdmDoctype,
  XdmDocument,
  XdmDocumentChild,
  XdmElement,
  XdmEntityRef,
  XdmOpenName,
  XdmPi,
  XdmText,
  XdmVocabulary,
  XdmWhitespace,
} from "#pantry/model/xdm.ts";

/**
 * A row another row names is not among the rows: a character-data node's row of its kind, an
 * attribute's lexical form, an open-class attribute's exact name, or the document node's own
 * `Node` row.
 */
export class RowMissing extends Schema.TaggedError<RowMissing>()("RowMissing", {
  /**
   * The missing row's key as its relation spells it: the node's id, or the attribute's element id
   * and slot.
   */
  key: Schema.String,
  /**
   * The list of {@link FlatRows} the row belongs in.
   */
  rows: Schema.Literals([
    "comments",
    "doctypes",
    "entityRefs",
    "lexicals",
    "nodes",
    "openNames",
    "pis",
    "texts",
    "whitespace",
  ]),
}) {
  /**
   * The list, the key another row names, and the repair.
   */
  override get message(): string {
    return `The rows hold no ${this.rows} row at (${this.key}), though another of their rows names it, so the document cannot be assembled. Assemble every row the scans of one document returned, none filtered out.`;
  }
}

/**
 * A node under a parent that cannot hold it: text, whitespace or an entity reference under the
 * document node, a doctype under an element, a document node below any node, or any node under a
 * parent that is neither an element nor the document node of the rows.
 */
export class NodeMisplaced extends Schema.TaggedError<NodeMisplaced>()("NodeMisplaced", {
  kind: Schema.String,
  node: Schema.String,
  parent: Schema.String,
}) {
  /**
   * The node, its kind and its parent, the rule that refuses them, and the repair.
   */
  override get message(): string {
    return `Node ${this.node}, of kind ${this.kind}, sits under ${this.parent}, and no node of the rows by that id can hold it: the document node holds elements, comments, processing instructions and the doctype, an element holds elements and character data but no doctype, and nothing else holds children. Assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * The exact name of a `data-*` attribute that does not begin with `data-`, which is the name every
 * attribute of that class has.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/dom.html#custom-data-attribute | HTML, custom data attributes}
 */
export class OpenNameMalformed extends Schema.TaggedError<OpenNameMalformed>()(
  "OpenNameMalformed",
  {
    /**
     * The attribute's key: its element id and slot.
     */
    key: Schema.String,
    local: Schema.String,
  },
) {
  /**
   * The attribute, the name it holds, and the repair.
   */
  override get message(): string {
    return `The data attribute at (${this.key}) is named ${this.local}, and a data attribute's name begins with "data-". Store an attribute under the data class only when its name begins with "data-".`;
  }
}

/**
 * The ways a document's rows fail to assemble.
 */
export type AssembleError = NodeMisplaced | OpenNameMalformed | RowMissing;

/**
 * A node below the document node: an element, character data, or the doctype.
 */
type Below<V extends XdmVocabulary> = XdmChild<V> | XdmDoctype;

/**
 * A node that holds no children and keeps its content in one row of a list of its kind: character
 * data or the doctype.
 */
type Leaf = XdmComment | XdmDoctype | XdmEntityRef | XdmPi | XdmText | XdmWhitespace;

/**
 * The `NodeKind` handles of the leaves, each the tag of its nodes.
 */
type LeafKind = Leaf["_tag"];

/**
 * The list of {@link FlatRows} each leaf kind's rows come in, which a missing leaf row names.
 */
const leafRows = {
  comment: "comments",
  doctype: "doctypes",
  entityRef: "entityRefs",
  pi: "pis",
  text: "texts",
  ws: "whitespace",
} as const satisfies { readonly [K in LeafKind]: RowMissing["rows"] };

/**
 * A document's rows grouped by the owner each is looked up under: leaves by their node, each
 * already its tree node; an element's attributes and namespace declarations by the element, in
 * slot order; and an attribute's lexical form, open name and entity references by the attribute's
 * key, the references in offset order.
 */
interface Index<V extends XdmVocabulary> {
  readonly attributes: ReadonlyMap<NodeId, readonly AttributeRow<V>[]>;
  readonly leaves: { readonly [K in LeafKind]: ReadonlyMap<NodeId, Extract<Leaf, { _tag: K }>> };
  readonly lexicals: ReadonlyMap<string, LexicalRow>;
  readonly namespaces: ReadonlyMap<NodeId, readonly NamespaceRow[]>;
  readonly openNames: ReadonlyMap<string, OpenNameRow>;
  readonly references: ReadonlyMap<string, readonly AttributeEntityRow[]>;
}

/**
 * Places a node, built from its row, as the next child of the owner it belongs to, or refuses it
 * when the owner cannot hold a node of its kind.
 *
 * @param node - The node.
 * @param row - The node's row, which a refusal names.
 * @returns Nothing once the node is placed.
 */
type Owner<V extends XdmVocabulary> = (
  node: Below<V>,
  row: NodeRow<V>,
) => Result.Result<void, NodeMisplaced>;

/**
 * Spell the key of an attribute-keyed row: its element's id and its slot.
 *
 * @param row - An attribute row, or a row keyed by one.
 * @param row.at - The attribute's slot.
 * @param row.node - The attribute's element.
 * @returns The key, the same for every row of one attribute.
 */
const keyOf = ({ at, node }: { readonly at: bigint; readonly node: NodeId }): string =>
  `${node}, ${String(at)}`;

/**
 * Refuse a node where its row places it.
 *
 * @param row - The node's row.
 * @returns The refusal, naming the node, its kind and its parent.
 */
const misplaced = <V extends XdmVocabulary>(row: NodeRow<V>): NodeMisplaced =>
  new NodeMisplaced({ kind: row.kind, node: row.id, parent: row.parent });

/**
 * Test whether an open name is a `data-*` attribute's: whether it begins with `data-`.
 *
 * @param local - The exact name.
 * @returns Whether the name begins with `data-`.
 */
const isDataName = (local: string): local is `data-${string}` => local.startsWith("data-");

/**
 * The open classes, the attribute name handles whose attributes carry an exact name beside them.
 */
const openClasses: ReadonlySet<string> = new Set<OpenClass>(["data-*", "foreign", "lax"]);

/**
 * Test whether an attribute name handle is an open class.
 *
 * @param name - An `AttributeName` handle.
 * @returns Whether the handle is `data-*`, `foreign` or `lax`.
 */
const isOpenClass = (name: string): name is OpenClass => openClasses.has(name);

/**
 * Test whether a node kind is a leaf's: character data or the doctype.
 *
 * @param kind - A `NodeKind` handle.
 * @returns Whether the kind has a list of rows of its own in {@link FlatRows}.
 */
const isLeafKind = (kind: string): kind is LeafKind => Object.hasOwn(leafRows, kind);

/**
 * Construct the owner of the document node's children, which holds elements, comments,
 * processing instructions and the doctype.
 *
 * @param children - The document node's children, which placing appends to.
 * @returns The owner.
 */
const documentOwner =
  <V extends XdmVocabulary>(children: XdmDocumentChild<V>[]): Owner<V> =>
  (node, row) => {
    if (node._tag === "text" || node._tag === "ws" || node._tag === "entityRef") {
      return Result.fail(misplaced(row));
    }

    children.push(node);

    return Result.void;
  };

/**
 * Construct the owner of an element's children, which holds every node but a doctype.
 *
 * @param children - The element's children, which placing appends to.
 * @returns The owner.
 */
const elementOwner =
  <V extends XdmVocabulary>(children: XdmChild<V>[]): Owner<V> =>
  (node, row) => {
    if (node._tag === "doctype") {
      return Result.fail(misplaced(row));
    }

    children.push(node);

    return Result.void;
  };

/**
 * Group a document's rows by the owner each is looked up under.
 *
 * @param rows - The document's rows.
 * @returns The rows by owner, each group in the order its rows arrived.
 */
const indexOf = <V extends XdmVocabulary>(rows: FlatRows<V>): Index<V> => ({
  attributes: Map.groupBy(rows.attributes, ({ node }) => node),
  leaves: {
    comment: new Map(rows.comments.map(({ node, value }) => [node, { _tag: "comment", value }])),
    doctype: new Map(rows.doctypes.map(({ node, value }) => [node, { _tag: "doctype", value }])),
    entityRef: new Map(
      rows.entityRefs.map(({ name, node }) => [node, { _tag: "entityRef", name }]),
    ),
    pi: new Map(rows.pis.map(({ data, node, target }) => [node, { _tag: "pi", data, target }])),
    text: new Map(rows.texts.map(({ node, value }) => [node, { _tag: "text", value }])),
    ws: new Map(rows.whitespace.map(({ node, value }) => [node, { _tag: "ws", value }])),
  },
  lexicals: new Map(rows.lexicals.map((row) => [keyOf(row), row])),
  namespaces: Map.groupBy(rows.namespaces, ({ node }) => node),
  openNames: new Map(rows.openNames.map((row) => [keyOf(row), row])),
  references: Map.groupBy(rows.attributeEntities, keyOf),
});

/**
 * The builder of each open class's names: the class as the name's tag, with the exact name its
 * open-name row holds. A `data-*` or `lax` name is in no namespace, so its row's prefix and
 * namespace name are not read; a `data-*` name that does not begin with `data-` is refused.
 */
const openNameOf = {
  "data-*": ({ local }, key) =>
    isDataName(local)
      ? Result.succeed({ _tag: "data-*", local })
      : Result.fail(new OpenNameMalformed({ key, local })),
  foreign: ({ local, prefix, uri }) => Result.succeed({ _tag: "foreign", local, prefix, uri }),
  lax: ({ local }) => Result.succeed({ _tag: "lax", local }),
} as const satisfies {
  readonly [K in OpenClass]: (
    row: OpenNameRow,
    key: string,
  ) => Result.Result<Extract<XdmOpenName, { _tag: K }>, OpenNameMalformed>;
};

/**
 * Build an attribute's name from its name handle: a closed handle as it is, an open class with the
 * exact name its open-name row holds.
 *
 * @param index - The document's rows by owner.
 * @param name - The attribute's `AttributeName` handle.
 * @param key - The attribute's key.
 * @returns The name, or the refusal of an open class without its open-name row or with a malformed
 *   one.
 */
const nameOf = <V extends XdmVocabulary>(
  index: Index<V>,
  name: AttributeRow<V>["name"],
  key: string,
): Result.Result<XdmAttributeName<V>, OpenNameMalformed | RowMissing> => {
  if (!isOpenClass(name)) {
    return Result.succeed({ _tag: "closed", handle: name });
  }

  return Result.flatMap(
    Result.fromNullishOr(
      index.openNames.get(key),
      () => new RowMissing({ key, rows: "openNames" }),
    ),
    (row): Result.Result<XdmOpenName, OpenNameMalformed> => openNameOf[name](row, key),
  );
};

/**
 * Build an attribute from its row and the rows keyed by it.
 *
 * @param index - The document's rows by owner.
 * @param row - The attribute's row.
 * @returns The attribute, or the refusal of one without its lexical form or its open name.
 */
const attributeOf = <V extends XdmVocabulary>(
  index: Index<V>,
  row: AttributeRow<V>,
): Result.Result<XdmAttribute<V>, OpenNameMalformed | RowMissing> => {
  const key = keyOf(row);

  return Result.gen(function* attribute() {
    const { lexical } = yield* Result.fromNullishOr(
      index.lexicals.get(key),
      () => new RowMissing({ key, rows: "lexicals" }),
    );
    const name = yield* nameOf(index, row.name, key);

    return {
      domain: row.domain,
      lexical,
      name,
      references: (index.references.get(key) ?? []).map((reference) => ({
        name: reference.name,
        offset: Number(reference.offset),
      })),
    };
  });
};

/**
 * Build an element from its row, its attributes and its namespace declarations, holding the
 * children list the placing pass fills.
 *
 * @param index - The document's rows by owner.
 * @param row - The element's row.
 * @param kind - The element's kind, the row's kind as an element kind.
 * @param children - The element's children, empty until the placing pass appends them.
 * @returns The element, or the refusal of one of its attributes.
 */
const elementOf = <V extends XdmVocabulary>(
  index: Index<V>,
  row: NodeRow<V>,
  kind: ElementKind<V>,
  children: XdmChild<V>[],
): Result.Result<XdmElement<V>, OpenNameMalformed | RowMissing> =>
  Result.map(
    Result.all(
      (index.attributes.get(row.id) ?? []).map((attribute) => attributeOf(index, attribute)),
    ),
    (attributes) => ({
      _tag: "element",
      attributes,
      children,
      kind,
      namespaces: (index.namespaces.get(row.id) ?? []).map(({ prefix, uri }) => ({ prefix, uri })),
      prefix: row.prefix,
    }),
  );

/**
 * Build the node a row below the document node stands for, with no children yet, and register an
 * element as the owner of the nodes under it.
 *
 * @param index - The document's rows by owner.
 * @param owners - The owners by node id, which an element's owner joins.
 * @param row - The node's row.
 * @returns The node, or the refusal of a leaf without its row, an element with a refused attribute,
 *   or a document node below another.
 */
const nodeOf = <V extends XdmVocabulary>(
  index: Index<V>,
  owners: Map<NodeId, Owner<V>>,
  row: NodeRow<V>,
): Result.Result<Below<V>, AssembleError> => {
  const { id, kind } = row;
  if (isLeafKind(kind)) {
    const list = leafRows[kind];

    return Result.fromNullishOr(
      index.leaves[kind].get(id),
      () => new RowMissing({ key: id, rows: list }),
    );
  }

  if (kind === "document") {
    return Result.fail(misplaced(row));
  }

  const children: XdmChild<V>[] = [];
  owners.set(id, elementOwner(children));

  return elementOf(index, row, kind, children);
};

/**
 * Assemble a document's rows back into its tree.
 *
 * Every node is built once, and then placed as the next child of its parent, in the order its rows
 * arrive. The document node is the owner of its children like any element, under its own id, and
 * is the one node not placed: its row is its own parent.
 *
 * @param rows - Every row of one document, each owner's rows in slot order and an attribute's entity
 *   references in offset order, as a scan in key order returns them and as `flatten` writes them.
 * @returns The document `flatten` writes as these rows, or the refusal of rows that lack a row
 *   another names, place a node under a parent that cannot hold it, or name a `data-*` attribute
 *   without its prefix.
 */
export const assemble = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<XdmDocument<V>, AssembleError> =>
  Result.gen(function* assembleDocument() {
    const { document } = rows;
    const self = document.node;
    const { version } = yield* Result.fromNullishOr(
      rows.nodes.find(({ id }) => id === self),
      () => new RowMissing({ key: self, rows: "nodes" }),
    );
    const index = indexOf(rows);
    const children: XdmDocumentChild<V>[] = [];
    const owners = new Map<NodeId, Owner<V>>([[self, documentOwner(children)]]);
    const built: { readonly node: Below<V>; readonly row: NodeRow<V> }[] = [];
    for (const row of rows.nodes.filter(({ id }) => id !== self)) {
      built.push({ node: yield* nodeOf(index, owners, row), row });
    }

    for (const { node, row } of built) {
      const owner = yield* Result.fromNullishOr(owners.get(row.parent), () => misplaced(row));
      yield* owner(node, row);
    }

    return {
      _tag: "document",
      charset: document.charset,
      children,
      encoding: document.encoding,
      exportCharset: document.exportCharset,
      standalone: document.standalone,
      version,
      xmlVersion: document.xmlVersion,
    };
  });
