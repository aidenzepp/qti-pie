/**
 * Assemble: the rows one document is stored as, back to the tree they were written from (fin.md
 * §4.6, trees.md §6), the inverse of `flatten` in `#pantry/model/xdm.ts`.
 *
 * Assembly reads the rows leniently into a tree, then holds them to the rows `flatten` writes for
 * that tree. Rows are a set: each list is first keyed by its relation's key, a key held twice
 * refused, and no row is read by the order it arrives in.
 *
 * Every row is keyed within its document by positions and names, never by a minted id: a node by
 * its `start`, its pre-order position (the document node's 0), a row a node owns by the node's
 * `start`, an attribute by its element's `start` and its name (a closed name's handle, or an open
 * attribute's namespace name and local name), a namespace declaration by its element's `start` and
 * its prefix, an entity reference by its attribute's key and its offset, and the XML declaration's
 * rows by the document itself, at most one each.
 *
 * The read takes the document node's row at `start` 0, and every other node row in `start` order,
 * with a stack of the elements whose intervals are open (trees.md §3): each row closes every open
 * element whose interval ends at or before its start, and is the next child of the innermost
 * element still open, or of the document node when none is. A node's content is the row of its
 * kind, an element's attributes, open attributes and namespace declarations are its rows of each
 * family, and an attribute's entity references are the rows at its key, in offset order. An
 * element's attributes and namespace declarations are sets (XML Information Set §2.2), so the read
 * lists them in an order of its own, by key, which no row states and the export does not read
 * (`#pantry/model/unshred.ts` writes Canonical XML's): the closed names by handle, then the open
 * names by namespace name and local name, and the declarations by prefix. The read takes nothing
 * else from a node row: its `parent`, its `at` and the document node's interval are the image's to
 * judge.
 *
 * The tree read is then flattened again, and the rows are its image exactly when the two agree,
 * list by list, on every key and on every field `flatten` writes at it.
 *
 * So assembly succeeds on exactly the rows `flatten` writes for some tree, in any row order, and
 * gives back that tree, its attributes and declarations listed by key. Accepted rows are that image
 * by the comparison. And rows `flatten` wrote for a tree read back as that tree: their starts
 * number its nodes in document order, and an element's interval holds exactly its subtree's, so the
 * stack makes each node the child of the element it was written under, in slot order; each
 * attribute's offsets order its references as they were written; and the families are sets, which
 * `flatten` writes as the same rows in any order. So the second flatten writes the rows again.
 *
 * {@link assemble} is that inverse of `flatten`, the specification the tests hold every writer of
 * a document's rows to. The export reads a document with {@link readDocument}, the read alone: its
 * rows are a database's, whose laws hold every agreement the image states, so serving them checks
 * the image again nowhere (the stored data was checked once, where it entered).
 *
 * Every relation is grouped by its owner once, and the read keeps its own stack, so a tree of any
 * depth or width assembles in time linear in its rows, but for sorting each element's attributes
 * and declarations. Each refusal ({@link AssembleError}) is a defect wherever the rows are a
 * database's.
 */
import { Array as Arr, Option, Order, Record, Result, Schema } from "effect";
import { isForeignKind } from "#pantry/grammar/kinds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { OpenName } from "#pantry/vocab/open.ts";
import type {
  AttributeEntityRow,
  AttributeRow,
  CharacterRow,
  DocumentRow,
  EntityRefRow,
  FlatRows,
  NamespaceRow,
  NodeRow,
  OpenAttributeEntityRow,
  OpenAttributeRow,
  OpenClass,
  OpenElementNameRow,
  PiRow,
  XdmAttribute,
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
  "openAttributes",
  "attributeEntities",
  "openAttributeEntities",
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
 * character-data node's row of its kind, a foreign element's expanded name, or the document node's
 * own `Node` row.
 */
export class RowMissing extends Schema.TaggedError<RowMissing>()("RowMissing", {
  /**
   * The missing row's key as its relation spells it: its node's `start`.
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
export class RootMissing extends Schema.TaggedError<RootMissing>()("RootMissing", {}) {
  /**
   * The rule, and the repair.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  override get message(): string {
    return "The document node holds no root element, and every document holds one. Assemble the rows of one document as its scans returned them.";
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
     * The `start` of the node the read places it under: the innermost element whose interval holds
     * its start, or the document node.
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

        return `Node ${this.key}, of kind ${kind}, reads as a child of node ${under}, which cannot hold a node of its kind: the document node holds one doctype, first, its comments and processing instructions, and one root element of a kind; an element holds elements and character data, but no doctype; and only the document node is of kind document. ${repair}`;
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
 * Spell the key of a row keyed by its node: the node's `start`.
 *
 * @param row - The row.
 * @param row.start - Its node's `start`.
 * @returns The start.
 */
const byStart = ({ start }: { readonly start: bigint }): string => String(start);

/**
 * Spell the key of a row of the document itself, at most one in a list: the document.
 *
 * @returns `document`.
 */
const ofDocument = (): string => "document";

/**
 * Spell the key of an attribute of a closed name, or of a row keyed by it: its element's `start`
 * and its name's handle. A handle holds no `, `, so the key is spelled once for each.
 *
 * @param row - The row.
 * @param row.name - The attribute's name handle.
 * @param row.start - Its element's `start`.
 * @returns The key.
 */
const attributeKey = ({ name, start }: { readonly name: string; readonly start: bigint }): string =>
  `${String(start)}, ${name}`;

/**
 * Spell the key of an attribute of an open name, or of a row keyed by it: its element's `start`,
 * its namespace name and its local name. A local name is an NCName, which holds no `, `, so the key
 * is spelled once for each.
 *
 * @param row - The row.
 * @param row.local - The attribute's local name.
 * @param row.start - Its element's `start`.
 * @param row.uri - The attribute's namespace name.
 * @returns The key.
 */
const openAttributeKey = ({
  local,
  start,
  uri,
}: {
  readonly local: string;
  readonly start: bigint;
  readonly uri: string;
}): string => `${String(start)}, ${uri}, ${local}`;

/**
 * The fields of a row of character data or the doctype.
 */
const characterFields = { start: true, value: true } as const;

/**
 * Each list's relation: its key, and every field of its row.
 */
const relations = {
  attributeEntities: {
    fields: { entity: true, name: true, offset: true, start: true },
    key: (row) => `${attributeKey(row)}, ${String(row.offset)}`,
  },
  attributes: {
    fields: { lexical: true, name: true, prefix: true, start: true },
    key: attributeKey,
  },
  comments: { fields: characterFields, key: byStart },
  doctypes: { fields: characterFields, key: byStart },
  encodingDecls: { fields: { encoding: true }, key: ofDocument },
  entityRefs: { fields: { name: true, start: true }, key: byStart },
  namespaces: {
    fields: { prefix: true, start: true, uri: true },
    key: ({ prefix, start }) => `${String(start)}, ${prefix}`,
  },
  nodes: {
    fields: {
      at: true,
      end: true,
      governs: true,
      kind: true,
      parent: true,
      prefix: true,
      start: true,
      version: true,
    },
    key: byStart,
  },
  openAttributeEntities: {
    fields: { entity: true, local: true, offset: true, start: true, uri: true },
    key: (row) => `${openAttributeKey(row)}, ${String(row.offset)}`,
  },
  openAttributes: {
    fields: { class: true, lexical: true, local: true, prefix: true, start: true, uri: true },
    key: openAttributeKey,
  },
  openElementNames: { fields: { local: true, namespace: true, start: true }, key: byStart },
  pis: { fields: { data: true, start: true, target: true }, key: byStart },
  sdDecls: { fields: { standalone: true }, key: ofDocument },
  texts: { fields: characterFields, key: byStart },
  whitespace: { fields: characterFields, key: byStart },
  xmlDecls: { fields: { version: true }, key: ofDocument },
} as const satisfies { readonly [K in RowList]: Relation<FlatRows<XdmVocabulary>[K][number]> };

/**
 * The document row's relation: one row, the document's.
 */
const documentRelation = {
  fields: { charset: true, exportCharset: true },
  key: ofDocument,
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
      openAttributeEntities: yield* keyedIn(
        "openAttributeEntities",
        rows.openAttributeEntities,
        relations.openAttributeEntities,
      ),
      openAttributes: yield* keyedIn(
        "openAttributes",
        rows.openAttributes,
        relations.openAttributes,
      ),
      openElementNames: yield* keyedIn(
        "openElementNames",
        rows.openElementNames,
        relations.openElementNames,
      ),
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
    outsideIn("document", new Map([[ofDocument(), document]]), [image.document], documentRelation),
    outsideIn("nodes", keyed.nodes, image.nodes, relations.nodes),
    outsideIn("attributes", keyed.attributes, image.attributes, relations.attributes),
    outsideIn(
      "openAttributes",
      keyed.openAttributes,
      image.openAttributes,
      relations.openAttributes,
    ),
    outsideIn(
      "attributeEntities",
      keyed.attributeEntities,
      image.attributeEntities,
      relations.attributeEntities,
    ),
    outsideIn(
      "openAttributeEntities",
      keyed.openAttributeEntities,
      image.openAttributeEntities,
      relations.openAttributeEntities,
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
const startOrder = Order.mapInput(Order.BigInt, (row: { readonly start: bigint }) => row.start);

/**
 * The order the read lists an element's attributes of closed names in: by handle. It is the
 * read's own, which no row states (the attributes are a set).
 */
const handleOrder = Order.mapInput(Order.String, (row: { readonly name: string }) => row.name);

/**
 * The order the read lists an element's attributes of open names in, after its closed ones: by
 * namespace name, then local name, the read's own as {@link handleOrder} is.
 */
const expandedOrder = Order.combine(
  Order.mapInput(Order.String, (row: OpenAttributeRow) => row.uri),
  Order.mapInput(Order.String, (row: OpenAttributeRow) => row.local),
);

/**
 * The order the read lists an element's namespace declarations in: by prefix, the read's own as
 * {@link handleOrder} is.
 */
const prefixOrder = Order.mapInput(Order.String, (row: NamespaceRow) => row.prefix);

/**
 * The order of an attribute's entity references: by offset, their key within the attribute.
 */
const offsetOrder = Order.mapInput(Order.BigInt, (row: { readonly offset: bigint }) => row.offset);

/**
 * A document's rows grouped by the owner each is looked up under: leaves and a foreign element's
 * name by their node's `start`, an element's attributes, open attributes and namespace
 * declarations by the element's `start`, and an attribute's entity references by the attribute's
 * key as its relation spells it.
 */
interface Index<V extends XdmVocabulary> {
  readonly attributes: ReadonlyMap<bigint, readonly AttributeRow<V>[]>;
  readonly comments: ReadonlyMap<bigint, CharacterRow>;
  readonly doctypes: ReadonlyMap<bigint, CharacterRow>;
  readonly entityRefs: ReadonlyMap<bigint, EntityRefRow>;
  readonly namespaces: ReadonlyMap<bigint, readonly NamespaceRow[]>;
  readonly openAttributes: ReadonlyMap<bigint, readonly OpenAttributeRow[]>;
  readonly openElementNames: ReadonlyMap<bigint, OpenElementNameRow>;
  readonly openReferences: ReadonlyMap<string, readonly OpenAttributeEntityRow[]>;
  readonly pis: ReadonlyMap<bigint, PiRow>;
  readonly references: ReadonlyMap<string, readonly AttributeEntityRow<V>[]>;
  readonly texts: ReadonlyMap<bigint, CharacterRow>;
  readonly whitespace: ReadonlyMap<bigint, CharacterRow>;
}

/**
 * Key a list of rows each keyed by its node, by the node's `start`.
 *
 * @param rows - The rows.
 * @returns Each row by its node's `start`.
 */
const atStart = <Row extends { readonly start: bigint }>(
  rows: readonly Row[],
): ReadonlyMap<bigint, Row> => new Map(rows.map((row) => [row.start, row]));

/**
 * Group a document's rows by the owner each is looked up under.
 *
 * @param rows - The document's rows.
 * @returns The rows by owner, each group in the order its rows arrived.
 */
const indexOf = <V extends XdmVocabulary>(rows: FlatRows<V>): Index<V> => ({
  attributes: Map.groupBy(rows.attributes, ({ start }) => start),
  comments: atStart(rows.comments),
  doctypes: atStart(rows.doctypes),
  entityRefs: atStart(rows.entityRefs),
  namespaces: Map.groupBy(rows.namespaces, ({ start }) => start),
  openAttributes: Map.groupBy(rows.openAttributes, ({ start }) => start),
  openElementNames: atStart(rows.openElementNames),
  openReferences: Map.groupBy(rows.openAttributeEntities, openAttributeKey),
  pis: atStart(rows.pis),
  references: Map.groupBy(rows.attributeEntities, attributeKey),
  texts: atStart(rows.texts),
  whitespace: atStart(rows.whitespace),
});

/**
 * Take the row of a node.
 *
 * @param rows - The list the row belongs in, which a refusal names.
 * @param map - The list's rows by their node's `start`.
 * @param start - The node's `start`.
 * @returns The row, or the refusal of its absence.
 */
const take = <Row>(
  rows: RowList,
  map: ReadonlyMap<bigint, Row>,
  start: bigint,
): Result.Result<Row, RowMissing> =>
  Result.fromNullishOr(map.get(start), () => new RowMissing({ key: String(start), rows }));

/**
 * The builder of each open class's names: the class as the name's tag, with what the class keeps of
 * the exact name its row holds and the prefix it is written with. A name in no namespace has no
 * prefix or namespace name to read.
 */
const openNameOf = {
  "data-*": ({ local }) => ({ _tag: "data-*", local }),
  foreign: ({ local, prefix, uri }) => ({ _tag: "foreign", local, prefix, uri }),
  "no-namespace": ({ local }) => ({ _tag: "no-namespace", local }),
  "own-namespace": ({ local, prefix, uri }) => ({ _tag: "own-namespace", local, prefix, uri }),
} as const satisfies {
  readonly [K in OpenClass]: (
    row: Pick<OpenAttributeRow, "local" | "prefix" | "uri">,
  ) => Extract<OpenName, { readonly _tag: K }>;
};

/**
 * Write an attribute's entity references as the tree holds them, in offset order.
 *
 * @param references - The attribute's entity reference rows, in any order.
 * @returns Each reference's entity name and offset, by offset.
 */
const referencesOf = (
  references: readonly Pick<AttributeEntityRow<XdmVocabulary>, "entity" | "offset">[],
): XdmAttribute<XdmVocabulary>["references"] =>
  references
    .toSorted(offsetOrder)
    .map(({ entity, offset }) => ({ name: entity, offset: Number(offset) }));

/**
 * Build what every element holds but its children: its attributes, the closed names by handle and
 * then the open names by expanded name, each with its entity references, its namespace
 * declarations by prefix, and its prefix.
 *
 * @param index - The document's rows by owner.
 * @param row - The element's row.
 * @returns The element's content.
 */
const contentOf = <V extends XdmVocabulary>(
  index: Index<V>,
  row: NodeRow<V>,
): Pick<XdmClosedElement<V>, "attributes" | "namespaces" | "prefix"> => {
  const closed = (index.attributes.get(row.start) ?? [])
    .toSorted(handleOrder)
    .map((attribute): XdmAttribute<V> => {
      const { lexical, name, prefix } = attribute;

      return {
        lexical,
        name: { _tag: "closed", handle: name, prefix },
        references: referencesOf(index.references.get(attributeKey(attribute)) ?? []),
      };
    });
  const open = (index.openAttributes.get(row.start) ?? [])
    .toSorted(expandedOrder)
    .map((attribute): XdmAttribute<V> => ({
      lexical: attribute.lexical,
      name: openNameOf[attribute.class](attribute),
      references: referencesOf(index.openReferences.get(openAttributeKey(attribute)) ?? []),
    }));
  const namespaces: XdmNamespace[] = (index.namespaces.get(row.start) ?? [])
    .toSorted(prefixOrder)
    .map(({ prefix, uri }) => ({ prefix, uri }));

  return { attributes: [...closed, ...open], namespaces, prefix: row.prefix };
};

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
    departure: { _tag: "unplaced", kind: row.kind, under: String(under.start) },
    key: String(row.start),
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
  comment: (index, start) =>
    Result.map(take("comments", index.comments, start), ({ value }) => ({
      _tag: "character",
      node: { _tag: "comment", value },
    })),
  doctype: (index, start) =>
    Result.map(take("doctypes", index.doctypes, start), ({ value }) => ({
      _tag: "doctype",
      value,
    })),
  entityRef: (index, start) =>
    Result.map(take("entityRefs", index.entityRefs, start), ({ name }) => ({
      _tag: "character",
      node: { _tag: "entityRef", name },
    })),
  pi: (index, start) =>
    Result.map(take("pis", index.pis, start), ({ data, target }) => ({
      _tag: "character",
      node: { _tag: "pi", data, target },
    })),
  text: (index, start) =>
    Result.map(take("texts", index.texts, start), ({ value }) => ({
      _tag: "character",
      node: { _tag: "text", value },
    })),
  ws: (index, start) =>
    Result.map(take("whitespace", index.whitespace, start), ({ value }) => ({
      _tag: "character",
      node: { _tag: "ws", value },
    })),
} as const satisfies {
  readonly [K in LeafKind]: (
    index: Index<XdmVocabulary>,
    start: bigint,
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
 * @param row - The node's row.
 * @returns The node, or the refusal of a leaf without its row or a foreign element without its
 *   name.
 */
const builtOf = <V extends XdmVocabulary>(
  index: Index<V>,
  row: NodeRow<V>,
): Result.Result<Built<V>, RowMissing> => {
  const { kind, start } = row;
  if (isLeafKind(kind)) {
    return leaves[kind](index, start);
  }

  if (kind === "document") {
    return Result.succeed({ _tag: "document" });
  }

  const content = contentOf(index, row);
  const children: XdmChild<V>[] = [];
  if (isForeignKind(kind)) {
    return Result.map(
      take("openElementNames", index.openElementNames, start),
      ({ local, namespace }) =>
        ({
          _tag: "element",
          children,
          node: {
            _tag: kind,
            ...content,
            children,
            governs: row.governs,
            name: { local, namespace },
          },
        }) as const,
    );
  }

  return Result.succeed({
    _tag: "element",
    children,
    node: { _tag: "element", ...content, children, governs: row.governs, kind },
  } as const);
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
 * Read the document's XML declaration back from its rows: its `XmlDecl` row, and its
 * `EncodingDecl` and `SdDecl` rows, each the document's, at most one each. A second row of a part
 * is left for the image to refuse.
 *
 * @param rows - The document's rows.
 * @returns The declaration, none when the rows hold no `XmlDecl` row.
 */
const declarationOf = (
  rows: Pick<FlatRows<XdmVocabulary>, "encodingDecls" | "sdDecls" | "xmlDecls">,
): Option.Option<XdmDeclaration> =>
  Option.map(Arr.head(rows.xmlDecls), ({ version }) => ({
    encoding: Option.map(Arr.head(rows.encodingDecls), ({ encoding }) => encoding),
    standalone: Option.map(Arr.head(rows.sdDecls), ({ standalone }) => standalone),
    version,
  }));

/**
 * A node whose interval the read holds open: its row, and how a child is placed in it, by its
 * element's content or by the `document` production, saying whether it holds the child.
 */
interface Open<V extends XdmVocabulary> {
  readonly place: (child: Built<V>) => boolean;
  readonly row: NodeRow<V>;
}

/**
 * Read a document's rows into a tree, taking from each row only what the tree holds.
 *
 * @param rows - Every row of one document, no key of a list held twice.
 * @returns The tree; or the refusal of a row the read needs and does not find, a node of a kind its
 *   place cannot hold, or a document node with no root element.
 */
const readOf = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<XdmDocument<V>, AssembleError> =>
  Result.gen(function* read() {
    const { document } = rows;
    const sentinel = yield* Result.fromNullishOr(
      rows.nodes.find(({ start }) => start === 0n),
      () => new RowMissing({ key: "0", rows: "nodes" }),
    );
    const order = rows.nodes.filter((row) => row !== sentinel).toSorted(startOrder);
    const index = indexOf(rows);
    const parsed: DocumentChildren<V> = {
      doctype: Option.none(),
      epilog: [],
      prolog: [],
      root: Option.none(),
    };
    // The nodes the read holds open, innermost last: the document node at the bottom, never closed,
    // since every row is placed under it.
    const stack: Arr.NonEmptyArray<Open<V>> = [
      { place: (child) => placeInDocument(parsed, child), row: sentinel },
    ];
    for (const row of order) {
      while (stack.length > 1 && Arr.lastNonEmpty(stack).row.end <= row.start) {
        stack.pop();
      }

      const open = Arr.lastNonEmpty(stack);
      const child = yield* builtOf(index, row);
      if (!open.place(child)) {
        return yield* Result.fail(unplaced(row, open.row));
      }

      if (child._tag === "element") {
        stack.push({ place: (built) => appendTo(child, built), row });
      }
    }

    const element = yield* Result.fromOption(parsed.root, () => new RootMissing({}));

    return {
      _tag: "document",
      charset: document.charset,
      declaration: declarationOf(rows),
      doctype: parsed.doctype,
      epilog: parsed.epilog,
      exportCharset: document.exportCharset,
      prolog: parsed.prolog,
      root: element,
      version: sentinel.version,
    };
  });

/**
 * Read a lawful document's rows back into its tree: the read of {@link assemble}, without the
 * keying and the image it holds the rows to. Rows a database holds for one document are that
 * image by its laws, so the export reads them with this.
 *
 * @param rows - Every row of one document, in any order, as a database holds them.
 * @returns The document the rows stand for; or the refusal of a row the read needs and does not
 *   find, a node of a kind its place cannot hold, or no root element.
 */
export const readDocument = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<XdmDocument<V>, AssembleError> => readOf(rows);

/**
 * Assemble a document's rows back into its tree, holding them to `flatten`'s image of it.
 *
 * Each list is keyed, the rows are read into a tree, and that tree is flattened again and held to
 * the rows.
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
    const document = yield* readOf(rows);
    const left = outsideImage(rows.document, keyed, flatten(document));
    if (Option.isSome(left)) {
      return yield* Result.fail(left.value);
    }

    return document;
  });
