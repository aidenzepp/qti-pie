/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Assemble: the rows one document is stored as, back to the tree they were written from (fin.md
 * §4.6, trees.md §6), the inverse of `flatten` in `#pantry/model/xdm.ts`.
 *
 * Assembly reads the rows leniently into a tree, then holds them to the rows `flatten` writes for
 * that tree. Rows are a set: each list is first keyed by its relation's key, a key held twice
 * refused, and no row is read by the order it arrives in.
 *
 * The read takes the document node's row by the document row's node, and every other node row in
 * `start` order, with a stack of the elements whose intervals are open (trees.md §3): each row
 * closes every open element whose interval ends at or before its start, and is the next child of
 * the innermost element still open, or of the document node when none is. A node's content is the
 * row of its kind, an element's attributes and namespace declarations are its rows of each family
 * in `at` order, and an attribute's open name and entity references are the rows keyed by its id,
 * the references in offset order. The read takes nothing else from a node row: its `parent`, its
 * `at` and the document node's interval are the image's to judge.
 *
 * The tree read is then flattened again, under the rows' own ids: node i, in the order read, takes
 * its row's id, and each attribute its row's. The rows are its image exactly when the two agree,
 * list by list, on every key and on every field `flatten` writes at it.
 *
 * So assembly succeeds on exactly the rows `flatten` writes for some tree, under ids distinct
 * within each relation and in any row order, and gives back that tree. Accepted rows are that image
 * by the comparison. And rows `flatten` wrote for a tree read back as that tree: their starts
 * number its nodes in document order, and an element's interval holds exactly its subtree's, so the
 * stack makes each node the child of the element it was written under, in slot order; each family's
 * slots, and each attribute's offsets, order its rows as they were written. So the second flatten
 * writes them again, drawing the ids they were written under.
 *
 * Every relation is grouped by its owner once, and the read keeps its own stack, so a tree of any
 * depth or width assembles in time linear in its rows. Each refusal ({@link AssembleError}) is a
 * defect wherever the rows are a database's, whose laws hold every agreement the image states.
 */
import { Array as Arr, Option, Order, Record, Result, Schema } from "effect";
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { OpenName } from "#pantry/vocab/open.ts";
import type {
  AttributeEntityRow,
  AttributeId,
  AttributeRow,
  DocumentRow,
  FlatRows,
  NamespaceRow,
  NodeId,
  NodeRow,
  OpenClass,
  OpenElementNameRow,
  OpenNameRow,
  XdmAttribute,
  XdmAttributeName,
  XdmCharacter,
  XdmChild,
  XdmClosedElement,
  XdmDeclaration,
  XdmDocument,
  XdmElement,
  XdmMisc,
  XdmNamespace,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";

/**
 * A list of {@link FlatRows} other than the document row.
 */
type RowList = Exclude<keyof FlatRows<XdmVocabulary>, "document">;

/**
 * Every list of {@link FlatRows} but the document row, in the order the image compares them.
 */
const rowLists = [
  "nodes",
  "attributes",
  "openNames",
  "attributeEntities",
  "namespaces",
  "openElementNames",
  "texts",
  "whitespace",
  "comments",
  "pis",
  "entityRefs",
  "doctypes",
  "xmlDecls",
  "encodingDecls",
  "sdDecls",
] as const satisfies readonly RowList[];

/**
 * A row another row names is not among the rows, so the read cannot build the node: a
 * character-data node's row of its kind, an open-class attribute's exact name, a foreign element's
 * expanded name, or the document node's own `Node` row.
 */
export class RowMissing extends Schema.TaggedError<RowMissing>()("RowMissing", {
  /**
   * The missing row's key as its relation spells it: the node's id, or the attribute's.
   */
  key: Schema.String,
  /**
   * The list of {@link FlatRows} the row belongs in.
   */
  rows: Schema.Literals(rowLists),
}) {
  /**
   * The list, the key another row names, and the repair.
   */
  override get message(): string {
    return `The rows hold no ${this.rows} row at (${this.key}), though another of their rows names it, so the document cannot be assembled. Assemble every row the scans of one document returned, none filtered out.`;
  }
}

/**
 * The document node holds no root element.
 */
export class RootMissing extends Schema.TaggedError<RootMissing>()("RootMissing", {
  node: Schema.String,
}) {
  /**
   * The document node, the rule, and the repair.
   */
  override get message(): string {
    return `The document node ${this.node} holds no root element, and every document holds one. Assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * How a row leaves the image: its key held by a second row of its list; its node of a kind the
 * node the read places it under cannot hold; a key the tree read writes no row at; a key the tree
 * writes a row at, which the rows lack; or a field the row at a key holds otherwise than the tree
 * writes it.
 */
const Departure = Schema.Union([
  Schema.TaggedStruct("repeated", {}),
  Schema.TaggedStruct("unplaced", {
    /**
     * The node's kind.
     */
    kind: Schema.String,
    /**
     * The node the read places it under: the innermost element whose interval holds its start, or
     * the document node.
     */
    under: Schema.String,
  }),
  Schema.TaggedStruct("unwritten", {}),
  Schema.TaggedStruct("lacked", {}),
  Schema.TaggedStruct("differs", {
    field: Schema.String,
    /**
     * The field's value in the row.
     */
    found: Schema.String,
    /**
     * The field's value in the row the tree writes at the key.
     */
    written: Schema.String,
  }),
]);

/**
 * The rows are not `flatten`'s image of the tree they read as: the first row that leaves it, by the
 * read's checks and then list by list, the document row first and the rest in {@link rowLists}
 * order. Every such refusal is one cause, a row no tree's rows hold, and differs only in the list,
 * the key and how the row leaves the image, which it holds as data.
 */
export class RowsOutsideImage extends Schema.TaggedError<RowsOutsideImage>()("RowsOutsideImage", {
  /**
   * How the row leaves the image.
   */
  departure: Departure,
  /**
   * The row's key as its relation spells it.
   */
  key: Schema.String,
  /**
   * The list of {@link FlatRows} the row is in, or the document row.
   */
  rows: Schema.Literals(["document", ...rowLists]),
}) {
  /**
   * The row, how it leaves the image, why no document's rows hold it, and the repair.
   */
  override get message(): string {
    const repair =
      "So they are the rows of no document. Assemble the rows of one document, each once, as its scans returned them.";
    switch (this.departure._tag) {
      case "repeated": {
        return `The rows hold two ${this.rows} rows at (${this.key}), but a document's rows hold one row at each key of a list. ${repair}`;
      }
      case "unplaced": {
        const { kind, under } = this.departure;

        return `Node ${this.key}, of kind ${kind}, reads as a child of ${under}, which cannot hold a node of its kind: the document node holds one doctype, first, its comments and processing instructions, and one root element of a kind; an element holds elements and character data, but no doctype; and only the document node is of kind document. ${repair}`;
      }
      case "unwritten": {
        return `The rows hold a ${this.rows} row at (${this.key}), where the tree they read as writes none. ${repair}`;
      }
      case "lacked": {
        return `The rows hold no ${this.rows} row at (${this.key}), where the tree they read as writes one. ${repair}`;
      }
      case "differs": {
        const { field, found, written } = this.departure;

        return `The ${this.rows} row at (${this.key}) holds ${field} ${found}, where the tree the rows read as writes ${written}. ${repair}`;
      }
      default: {
        return this.departure satisfies never;
      }
    }
  }
}

/**
 * Every way {@link assemble} can refuse rows.
 */
export type AssembleError = RootMissing | RowMissing | RowsOutsideImage;

/**
 * A list's relation as the image is held to it: the key the relation gives a row, and every field
 * `flatten` writes, which a row and the image's row at its key agree on.
 */
interface Relation<Row extends object> {
  readonly fields: Readonly<Record<keyof Row & string, true>>;
  readonly key: (row: Row) => string;
}

/**
 * Spell the key of a row keyed by its node.
 *
 * @param row - The row.
 * @param row.node - Its node.
 * @returns The node's id.
 */
const byNode = ({ node }: { readonly node: NodeId }): string => node;

/**
 * Spell the key of a row keyed by its own id.
 *
 * @param row - The row.
 * @param row.id - Its id.
 * @returns The id.
 */
const byId = ({ id }: { readonly id: NodeId }): string => id;

/**
 * The fields of a row of character data or the doctype.
 */
const characterFields = { node: true, value: true } as const;

/**
 * Each list's relation: its key, and every field of its row.
 */
const relations = {
  attributeEntities: {
    fields: { attribute: true, name: true, offset: true },
    key: ({ attribute, offset }) => `${attribute}, ${String(offset)}`,
  },
  attributes: {
    fields: { at: true, id: true, lexical: true, name: true, node: true, prefix: true },
    key: byId,
  },
  comments: { fields: characterFields, key: byNode },
  doctypes: { fields: characterFields, key: byNode },
  encodingDecls: { fields: { encoding: true, node: true }, key: byNode },
  entityRefs: { fields: { name: true, node: true }, key: byNode },
  namespaces: {
    fields: { at: true, node: true, prefix: true, uri: true },
    key: ({ at, node }) => `${node}, ${String(at)}`,
  },
  nodes: {
    fields: {
      at: true,
      end: true,
      governs: true,
      id: true,
      kind: true,
      parent: true,
      prefix: true,
      start: true,
      version: true,
    },
    key: byId,
  },
  openElementNames: { fields: { local: true, namespace: true, node: true }, key: byNode },
  openNames: {
    fields: { attribute: true, local: true, uri: true },
    key: ({ attribute }) => attribute,
  },
  pis: { fields: { data: true, node: true, target: true }, key: byNode },
  sdDecls: { fields: { node: true, standalone: true }, key: byNode },
  texts: { fields: characterFields, key: byNode },
  whitespace: { fields: characterFields, key: byNode },
  xmlDecls: { fields: { node: true, version: true }, key: byNode },
} as const satisfies { readonly [K in RowList]: Relation<FlatRows<XdmVocabulary>[K][number]> };

/**
 * The document row's relation, keyed by its node.
 */
const documentRelation = {
  fields: { charset: true, exportCharset: true, node: true },
  key: byNode,
} as const satisfies Relation<DocumentRow>;

/**
 * Each list's rows by their keys.
 */
type Keyed = { readonly [K in RowList]: ReadonlyMap<string, FlatRows<XdmVocabulary>[K][number]> };

/**
 * Key a list's rows, each once.
 *
 * @param rows - Which list they are.
 * @param list - The rows.
 * @param relation - The list's relation.
 * @returns The rows by key, or the refusal of the first key held twice.
 */
const keyedIn = <Row extends object>(
  rows: RowList,
  list: readonly Row[],
  { key }: Relation<Row>,
): Result.Result<ReadonlyMap<string, Row>, RowsOutsideImage> => {
  const keyed = new Map<string, Row>();
  for (const row of list) {
    const at = key(row);
    if (keyed.has(at)) {
      return Result.fail(new RowsOutsideImage({ departure: { _tag: "repeated" }, key: at, rows }));
    }

    keyed.set(at, row);
  }

  return Result.succeed(keyed);
};

/**
 * Key every list of a document's rows.
 *
 * @param rows - The rows.
 * @returns Each list's rows by key, or the refusal of the first key held twice.
 */
const keyedOf = (rows: FlatRows<XdmVocabulary>): Result.Result<Keyed, RowsOutsideImage> =>
  Result.gen(function* keyed() {
    return {
      attributeEntities: yield* keyedIn(
        "attributeEntities",
        rows.attributeEntities,
        relations.attributeEntities,
      ),
      attributes: yield* keyedIn("attributes", rows.attributes, relations.attributes),
      comments: yield* keyedIn("comments", rows.comments, relations.comments),
      doctypes: yield* keyedIn("doctypes", rows.doctypes, relations.doctypes),
      encodingDecls: yield* keyedIn("encodingDecls", rows.encodingDecls, relations.encodingDecls),
      entityRefs: yield* keyedIn("entityRefs", rows.entityRefs, relations.entityRefs),
      namespaces: yield* keyedIn("namespaces", rows.namespaces, relations.namespaces),
      nodes: yield* keyedIn("nodes", rows.nodes, relations.nodes),
      openElementNames: yield* keyedIn(
        "openElementNames",
        rows.openElementNames,
        relations.openElementNames,
      ),
      openNames: yield* keyedIn("openNames", rows.openNames, relations.openNames),
      pis: yield* keyedIn("pis", rows.pis, relations.pis),
      sdDecls: yield* keyedIn("sdDecls", rows.sdDecls, relations.sdDecls),
      texts: yield* keyedIn("texts", rows.texts, relations.texts),
      whitespace: yield* keyedIn("whitespace", rows.whitespace, relations.whitespace),
      xmlDecls: yield* keyedIn("xmlDecls", rows.xmlDecls, relations.xmlDecls),
    };
  });

/**
 * Hold a list's rows to the image's: every row the image writes is at its key with every field
 * alike, and no other key is held.
 *
 * @param rows - Which list they are.
 * @param held - The rows by key.
 * @param written - The image's rows.
 * @param relation - The list's relation.
 * @returns The refusal of the first row that leaves the image, none when the rows are its image.
 */
const outsideIn = <Row extends object>(
  rows: RowList | "document",
  held: ReadonlyMap<string, Row>,
  written: readonly Row[],
  { fields, key }: Relation<Row>,
): Option.Option<RowsOutsideImage> => {
  const writtenKeys = new Set<string>();
  for (const row of written) {
    const at = key(row);
    writtenKeys.add(at);

    const found = held.get(at);
    if (found === undefined) {
      return Option.some(new RowsOutsideImage({ departure: { _tag: "lacked" }, key: at, rows }));
    }

    const field = Record.keys(fields).find((name) => found[name] !== row[name]);
    if (field !== undefined) {
      return Option.some(
        new RowsOutsideImage({
          departure: {
            _tag: "differs",
            field,
            found: String(found[field]),
            written: String(row[field]),
          },
          key: at,
          rows,
        }),
      );
    }
  }

  return Option.map(
    Option.fromNullishOr([...held.keys()].find((at) => !writtenKeys.has(at))),
    (at) => new RowsOutsideImage({ departure: { _tag: "unwritten" }, key: at, rows }),
  );
};

/**
 * Hold a document's rows to the image of the tree they read as.
 *
 * @param document - The document row.
 * @param keyed - The other rows by key.
 * @param image - The rows `flatten` writes for the tree.
 * @returns The refusal of the first row, the document row and then list by list, that leaves the
 *   image; none when the rows are the image.
 */
const outsideImage = (
  document: DocumentRow,
  keyed: Keyed,
  image: FlatRows<XdmVocabulary>,
): Option.Option<RowsOutsideImage> =>
  Option.firstSomeOf([
    outsideIn("document", new Map([[document.node, document]]), [image.document], documentRelation),
    outsideIn("nodes", keyed.nodes, image.nodes, relations.nodes),
    outsideIn("attributes", keyed.attributes, image.attributes, relations.attributes),
    outsideIn("openNames", keyed.openNames, image.openNames, relations.openNames),
    outsideIn(
      "attributeEntities",
      keyed.attributeEntities,
      image.attributeEntities,
      relations.attributeEntities,
    ),
    outsideIn("namespaces", keyed.namespaces, image.namespaces, relations.namespaces),
    outsideIn(
      "openElementNames",
      keyed.openElementNames,
      image.openElementNames,
      relations.openElementNames,
    ),
    outsideIn("texts", keyed.texts, image.texts, relations.texts),
    outsideIn("whitespace", keyed.whitespace, image.whitespace, relations.whitespace),
    outsideIn("comments", keyed.comments, image.comments, relations.comments),
    outsideIn("pis", keyed.pis, image.pis, relations.pis),
    outsideIn("entityRefs", keyed.entityRefs, image.entityRefs, relations.entityRefs),
    outsideIn("doctypes", keyed.doctypes, image.doctypes, relations.doctypes),
    outsideIn("xmlDecls", keyed.xmlDecls, image.xmlDecls, relations.xmlDecls),
    outsideIn("encodingDecls", keyed.encodingDecls, image.encodingDecls, relations.encodingDecls),
    outsideIn("sdDecls", keyed.sdDecls, image.sdDecls, relations.sdDecls),
  ]);

/**
 * The order the read takes node rows in: by start.
 */
const byStart = Order.mapInput(Order.BigInt, (row: { readonly start: bigint }) => row.start);

/**
 * The order of a family's rows: by slot.
 */
const bySlot = Order.mapInput(Order.BigInt, (row: { readonly at: bigint }) => row.at);

/**
 * The order of an attribute's entity references: by offset, their key within the attribute.
 */
const byOffset = Order.mapInput(Order.BigInt, (row: AttributeEntityRow) => row.offset);

/**
 * A document's rows grouped by the owner each is looked up under: leaves and a foreign element's
 * name by their node, an element's attributes and namespace declarations by the element, and an
 * attribute's open name and entity references by the attribute's id.
 */
interface Index<V extends XdmVocabulary> {
  readonly attributes: ReadonlyMap<NodeId, readonly AttributeRow<V>[]>;
  readonly comments: ReadonlyMap<NodeId, FlatRows<V>["comments"][number]>;
  readonly doctypes: ReadonlyMap<NodeId, FlatRows<V>["doctypes"][number]>;
  readonly entityRefs: ReadonlyMap<NodeId, FlatRows<V>["entityRefs"][number]>;
  readonly namespaces: ReadonlyMap<NodeId, readonly NamespaceRow[]>;
  readonly openElementNames: ReadonlyMap<NodeId, OpenElementNameRow>;
  readonly openNames: ReadonlyMap<AttributeId, OpenNameRow>;
  readonly pis: ReadonlyMap<NodeId, FlatRows<V>["pis"][number]>;
  readonly references: ReadonlyMap<AttributeId, readonly AttributeEntityRow[]>;
  readonly texts: ReadonlyMap<NodeId, FlatRows<V>["texts"][number]>;
  readonly whitespace: ReadonlyMap<NodeId, FlatRows<V>["whitespace"][number]>;
}

/**
 * Group a document's rows by the owner each is looked up under.
 *
 * @param rows - The document's rows.
 * @returns The rows by owner, each group in the order its rows arrived.
 */
const indexOf = <V extends XdmVocabulary>(rows: FlatRows<V>): Index<V> => ({
  attributes: Map.groupBy(rows.attributes, ({ node }) => node),
  comments: new Map(rows.comments.map((row) => [row.node, row])),
  doctypes: new Map(rows.doctypes.map((row) => [row.node, row])),
  entityRefs: new Map(rows.entityRefs.map((row) => [row.node, row])),
  namespaces: Map.groupBy(rows.namespaces, ({ node }) => node),
  openElementNames: new Map(rows.openElementNames.map((row) => [row.node, row])),
  openNames: new Map(rows.openNames.map((row) => [row.attribute, row])),
  pis: new Map(rows.pis.map((row) => [row.node, row])),
  references: Map.groupBy(rows.attributeEntities, ({ attribute }) => attribute),
  texts: new Map(rows.texts.map((row) => [row.node, row])),
  whitespace: new Map(rows.whitespace.map((row) => [row.node, row])),
});

/**
 * Take the row at a key.
 *
 * @param rows - The list the row belongs in, which a refusal names.
 * @param map - The list's rows by key.
 * @param key - The key.
 * @returns The row, or the refusal of its absence.
 */
const take = <Row>(
  rows: RowList,
  map: ReadonlyMap<string, Row>,
  key: string,
): Result.Result<Row, RowMissing> =>
  Result.fromNullishOr(map.get(key), () => new RowMissing({ key, rows }));

/**
 * The open classes, the attribute name handles whose attributes carry an exact name beside them.
 */
const openHandles: ReadonlySet<string> = new Set<OpenClass>(openClasses);

/**
 * Test whether an attribute name handle is an open class.
 *
 * @param name - An `AttributeName` handle.
 * @returns Whether the handle is one of {@link openClasses}.
 */
const isOpenClass = (name: string): name is OpenClass => openHandles.has(name);

/**
 * The builder of each open class's names: the class as the name's tag, with what the class keeps of
 * the exact name its open-name row holds and the prefix its attribute row holds. A name in no
 * namespace has no prefix or namespace name to read.
 */
const openNameOf = {
  "data-*": ({ local }) => ({ _tag: "data-*", local }),
  foreign: ({ local, uri }, prefix) => ({ _tag: "foreign", local, prefix, uri }),
  "no-namespace": ({ local }) => ({ _tag: "no-namespace", local }),
  "own-namespace": ({ local, uri }, prefix) => ({ _tag: "own-namespace", local, prefix, uri }),
} as const satisfies {
  readonly [K in OpenClass]: (
    row: OpenNameRow,
    prefix: string,
  ) => Extract<OpenName, { readonly _tag: K }>;
};

/**
 * Build an attribute from its row and the rows keyed by its id.
 *
 * @param index - The document's rows by owner.
 * @param row - The attribute's row.
 * @returns The attribute, or the refusal of an open-class one without its open name.
 */
const attributeOf = <V extends XdmVocabulary>(
  index: Index<V>,
  row: AttributeRow<V>,
): Result.Result<XdmAttribute<V>, RowMissing> =>
  Result.gen(function* attribute() {
    const { id, lexical, name, prefix } = row;
    const named: XdmAttributeName<V> = isOpenClass(name)
      ? yield* Result.map(take("openNames", index.openNames, id), (open) =>
          openNameOf[name](open, prefix),
        )
      : { _tag: "closed", handle: name, prefix };

    return {
      lexical,
      name: named,
      references: (index.references.get(id) ?? [])
        .toSorted(byOffset)
        .map(({ name: entity, offset }) => ({ name: entity, offset: Number(offset) })),
    };
  });

/**
 * Build what every element holds but its children: its attributes and namespace declarations,
 * each family in slot order, and its prefix.
 *
 * @param index - The document's rows by owner.
 * @param attributeIds - The ids of the attributes read so far, which the element's join in slot
 *   order.
 * @param row - The element's row.
 * @returns The element's content, or the refusal of an attribute without its open name.
 */
const contentOf = <V extends XdmVocabulary>(
  index: Index<V>,
  attributeIds: AttributeId[],
  row: NodeRow<V>,
): Result.Result<Pick<XdmClosedElement<V>, "attributes" | "namespaces" | "prefix">, RowMissing> =>
  Result.gen(function* elementContent() {
    const attributeRows = (index.attributes.get(row.id) ?? []).toSorted(bySlot);
    attributeIds.push(...attributeRows.map(({ id }) => id));

    const attributes = yield* Result.all(
      attributeRows.map((attribute) => attributeOf(index, attribute)),
    );
    const namespaces: XdmNamespace[] = (index.namespaces.get(row.id) ?? [])
      .toSorted(bySlot)
      .map(({ prefix, uri }) => ({ prefix, uri }));

    return { attributes, namespaces, prefix: row.prefix };
  });

/**
 * A node built from its row, with the list its children are appended to: an element of a kind or a
 * foreign one, which holds any child but a doctype; character data and the doctype, which hold
 * nothing; or a node of kind document below the document node, which no node holds.
 */
type Built<V extends XdmVocabulary> =
  | {
      readonly _tag: "element";
      readonly children: XdmChild<V>[];
      readonly node: XdmElement<V>;
    }
  | { readonly _tag: "character"; readonly node: XdmCharacter }
  | { readonly _tag: "doctype"; readonly value: string }
  | { readonly _tag: "document" };

/**
 * A built node that holds children: an element of either shape, whose family the read appends to.
 */
type Owner<V extends XdmVocabulary> = Extract<Built<V>, { readonly _tag: "element" }>;

/**
 * Refuse a node under the node the read places it under.
 *
 * @param row - The node's row.
 * @param under - The row of the node it would be a child of.
 * @returns The refusal, naming the node, its kind and the node it would be a child of.
 */
const unplaced = <V extends XdmVocabulary>(row: NodeRow<V>, under: NodeRow<V>): RowsOutsideImage =>
  new RowsOutsideImage({
    departure: { _tag: "unplaced", kind: row.kind, under: under.id },
    key: row.id,
    rows: "nodes",
  });

/**
 * A node that holds no children and keeps its content in one row of a list of its kind: character
 * data or the doctype.
 */
type LeafKind = XdmCharacter["_tag"] | "doctype";

/**
 * The builder of each leaf kind's node from the row of its kind.
 */
const leaves = {
  comment: (index, id) =>
    Result.map(take("comments", index.comments, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "comment", value },
    })),
  doctype: (index, id) =>
    Result.map(take("doctypes", index.doctypes, id), ({ value }) => ({ _tag: "doctype", value })),
  entityRef: (index, id) =>
    Result.map(take("entityRefs", index.entityRefs, id), ({ name }) => ({
      _tag: "character",
      node: { _tag: "entityRef", name },
    })),
  pi: (index, id) =>
    Result.map(take("pis", index.pis, id), ({ data, target }) => ({
      _tag: "character",
      node: { _tag: "pi", data, target },
    })),
  text: (index, id) =>
    Result.map(take("texts", index.texts, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "text", value },
    })),
  ws: (index, id) =>
    Result.map(take("whitespace", index.whitespace, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "ws", value },
    })),
} as const satisfies {
  readonly [K in LeafKind]: (
    index: Index<XdmVocabulary>,
    id: NodeId,
  ) => Result.Result<
    Extract<Built<XdmVocabulary>, { readonly _tag: "character" | "doctype" }>,
    RowMissing
  >;
};

/**
 * Test whether a node kind is a leaf's: character data or the doctype.
 *
 * @param kind - A `NodeKind` handle.
 * @returns Whether its node keeps its content in one row of a list of its kind.
 */
const isLeafKind = (kind: string): kind is LeafKind => Object.hasOwn(leaves, kind);

/**
 * Build the node a row below the document node stands for, with no children yet.
 *
 * @param index - The document's rows by owner.
 * @param attributeIds - The ids of the attributes read so far.
 * @param row - The node's row.
 * @returns The node, or the refusal of a leaf without its row, a foreign element without its name,
 *   or an attribute without its open name.
 */
const builtOf = <V extends XdmVocabulary>(
  index: Index<V>,
  attributeIds: AttributeId[],
  row: NodeRow<V>,
): Result.Result<Built<V>, RowMissing> => {
  const { id, kind } = row;
  if (isLeafKind(kind)) {
    return leaves[kind](index, id);
  }

  if (kind === "document") {
    return Result.succeed({ _tag: "document" });
  }

  return Result.gen(function* element() {
    const content = yield* contentOf(index, attributeIds, row);
    const children: XdmChild<V>[] = [];
    if (isForeignKind(kind)) {
      const { local, namespace } = yield* take("openElementNames", index.openElementNames, id);

      return {
        _tag: "element",
        children,
        node: {
          _tag: kind,
          ...content,
          children,
          governs: row.governs,
          name: { local, namespace },
        },
      } as const;
    }

    return {
      _tag: "element",
      children,
      node: { _tag: "element", ...content, children, governs: row.governs, kind },
    } as const;
  });
};

/**
 * Append a built node to the element it sits in, where an element holds it: an element or
 * character data, but no doctype or document node.
 *
 * @param parent - The element.
 * @param child - The built node.
 * @returns Whether the node is appended.
 */
const appendTo = <V extends XdmVocabulary>(parent: Owner<V>, child: Built<V>): boolean => {
  switch (child._tag) {
    case "doctype":
    case "document": {
      return false;
    }
    case "element":
    case "character": {
      parent.children.push(child.node);

      return true;
    }
    default: {
      return child satisfies never;
    }
  }
};

/**
 * The document node's children parsed by their place in XML's `document` production: the doctype,
 * the prolog, the root element and the epilog.
 */
interface DocumentChildren<V extends XdmVocabulary> {
  doctype: Option.Option<string>;
  readonly epilog: XdmMisc[];
  readonly prolog: XdmMisc[];
  root: Option.Option<XdmClosedElement<V>>;
}

/**
 * Place one of the document node's children by its place in XML's `document` production, where
 * the document node holds it: one doctype, the first root element of a kind, and comments and
 * processing instructions, before the root in the prolog and after it in the epilog.
 *
 * @param parsed - The document node's children so far.
 * @param child - The built child.
 * @returns Whether the child is placed.
 * @see {@link https://www.w3.org/TR/xml/#NT-document | XML 1.0, document}
 */
const placeInDocument = <V extends XdmVocabulary>(
  parsed: DocumentChildren<V>,
  child: Built<V>,
): boolean => {
  switch (child._tag) {
    case "doctype": {
      if (Option.isSome(parsed.doctype)) {
        return false;
      }

      parsed.doctype = Option.some(child.value);

      return true;
    }
    case "element": {
      const { node } = child;
      if (node._tag !== "element" || Option.isSome(parsed.root)) {
        return false;
      }

      parsed.root = Option.some(node);

      return true;
    }
    case "character": {
      const { node } = child;
      if (node._tag !== "comment" && node._tag !== "pi") {
        return false;
      }

      (Option.isSome(parsed.root) ? parsed.epilog : parsed.prolog).push(node);

      return true;
    }
    case "document": {
      return false;
    }
    default: {
      return child satisfies never;
    }
  }
};

/**
 * Read the document node's XML declaration back from its rows: its `XmlDecl` row, and its
 * `EncodingDecl` and `SdDecl` rows, each keyed by the document node. A part's row at another key
 * is left for the image to refuse.
 *
 * @param rows - The document's rows.
 * @param node - The document node's id.
 * @returns The declaration, none when the rows hold no `XmlDecl` row at the node.
 */
const declarationOf = (
  rows: Pick<FlatRows<XdmVocabulary>, "encodingDecls" | "sdDecls" | "xmlDecls">,
  node: NodeId,
): Option.Option<XdmDeclaration> => {
  const at = <Row extends { readonly node: NodeId }>(list: readonly Row[]): Option.Option<Row> =>
    Arr.findFirst(list, (row) => row.node === node);

  return Option.map(at(rows.xmlDecls), ({ version }) => ({
    encoding: Option.map(at(rows.encodingDecls), ({ encoding }) => encoding),
    standalone: Option.map(at(rows.sdDecls), ({ standalone }) => standalone),
    version,
  }));
};

/**
 * A node whose interval the read holds open: its row, and how a child is placed in it, by its
 * element's content or by the `document` production, saying whether it holds the child.
 */
interface Open<V extends XdmVocabulary> {
  readonly place: (child: Built<V>) => boolean;
  readonly row: NodeRow<V>;
}

/**
 * A document read from its rows: the tree, and the ids it was read under, each node's in the order
 * read and each attribute's in its element's order, then slot order.
 */
interface Read<V extends XdmVocabulary> {
  readonly document: XdmDocument<V>;
  readonly ids: readonly NodeId[];
}

/**
 * Read a document's rows into a tree, taking from each row only what the tree holds.
 *
 * @param rows - Every row of one document, no key of a list held twice.
 * @returns The tree and its ids; or the refusal of a row the read needs and does not find, a node
 *   of a kind its place cannot hold, or a document node with no root element.
 */
const readOf = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<Read<V>, AssembleError> =>
  Result.gen(function* read() {
    const { document } = rows;
    const self = document.node;
    const sentinel = yield* Result.fromNullishOr(
      rows.nodes.find(({ id }) => id === self),
      () => new RowMissing({ key: self, rows: "nodes" }),
    );
    const order = [sentinel, ...rows.nodes.filter((row) => row !== sentinel).toSorted(byStart)];
    const index = indexOf(rows);
    const attributeIds: AttributeId[] = [];
    const parsed: DocumentChildren<V> = {
      doctype: Option.none(),
      epilog: [],
      prolog: [],
      root: Option.none(),
    };
    const root: Open<V> = {
      place: (child) => placeInDocument(parsed, child),
      row: sentinel,
    };
    const stack: Open<V>[] = [];
    const innermost = (): Open<V> => stack.at(-1) ?? root;
    for (const row of order.slice(1)) {
      while (stack.length > 0 && innermost().row.end <= row.start) {
        stack.pop();
      }

      const open = innermost();
      const child = yield* builtOf(index, attributeIds, row);
      if (!open.place(child)) {
        return yield* Result.fail(unplaced(row, open.row));
      }

      if (child._tag === "element") {
        stack.push({ place: (built) => appendTo(child, built), row });
      }
    }

    const element = yield* Result.fromOption(parsed.root, () => new RootMissing({ node: self }));

    return {
      document: {
        _tag: "document",
        charset: document.charset,
        declaration: declarationOf(rows, self),
        doctype: parsed.doctype,
        epilog: parsed.epilog,
        exportCharset: document.exportCharset,
        prolog: parsed.prolog,
        root: element,
        version: sentinel.version,
      },
      ids: [...order.map(({ id }) => id), ...attributeIds],
    };
  });

/**
 * Assemble a document's rows back into its tree.
 *
 * Each list is keyed, the rows are read into a tree, and that tree is flattened again under the
 * ids it was read under and held to the rows.
 *
 * @param rows - Every row of one document, in any order.
 * @returns The document `flatten` writes as these rows; or the refusal of a key held twice, a row
 *   the read needs and does not find, a node of a kind its place cannot hold, no root element, or
 *   the first row outside the image of the tree read.
 */
export const assemble = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<XdmDocument<V>, AssembleError> =>
  Result.gen(function* assembleDocument() {
    const keyed = yield* keyedOf(rows);
    const { document, ids } = yield* readOf(rows);
    const left = outsideImage(
      rows.document,
      keyed,
      flatten(document, (index) => Arr.getUnsafe(ids, index)),
    );
    if (Option.isSome(left)) {
      return yield* Result.fail(left.value);
    }

    return document;
  });
