/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Assemble: the rows one document is stored as, back to the tree they were written from (fin.md
 * §4.6, trees.md §6), the inverse of `flatten` in `#pantry/model/xdm.ts`.
 *
 * Rows are a set: assembly reads each row by its key, never by the order it arrives in. The node
 * rows are placed by `start`, so a document of N nodes holds each start from 0 to N − 1 once, and
 * then read in that order, document order, in one scan with a stack of the elements whose
 * intervals are open (trees.md §3). Each row first closes every open element whose interval ends
 * at or before its start, and is then the next child of the innermost element still open, or of the
 * document node when none is: so a row whose parent is not that element, whose slot is not that
 * element's next, or whose interval leaves that element's is refused, and so is an interval that
 * holds no node, a leaf's that holds more than the leaf, a second row of one id, and a document
 * node whose interval is not `[0, N)`.
 *
 * Each node is built as the scan meets it. Its attributes and namespace declarations go into its
 * element's families at their own `at`, where a family of n rows has the slots 0 to n − 1, and an
 * attribute's open name and entity references are found by the attribute's id, the references in
 * offset order. A row keyed by a node or an attribute the scan never builds is left over.
 *
 * So assembly succeeds on exactly the rows `flatten` writes for some tree, up to the ids drawn and
 * the order of the rows, and gives back that tree. The starts are a permutation of 0 to N − 1, and
 * the scan makes each row the child of the element it sits in, so the rows met while an element is
 * open are its subtree: by the end and size checks they are the starts its interval holds, so its
 * `start` is its place in document order and `end − start` its subtree's size, as `flatten` writes
 * them. The refusals ({@link AssembleError}) are the checks that fail. Assembly re-checks no field
 * the database's laws state and the scan does not read: a node's version beside its document's, or
 * the empty prefix of a node that is not an element. Every relation is grouped by its owner once,
 * and the scan keeps its own stack, so a tree of any depth or width assembles in time linear in its
 * rows.
 */
import { Option, Order, Result, Schema } from "effect";
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import { none } from "#pantry/model/xdm.ts";
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
 * Every list of {@link FlatRows} but the document row, in the order a refusal reports them.
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
] as const satisfies readonly RowList[];

/**
 * The lists whose rows are keyed by a node or an attribute the scan builds: every list but the
 * nodes, which the scan reads itself.
 */
const keyedLists = [
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
] as const satisfies readonly RowList[];

/**
 * A row another row names is not among the rows: a character-data node's row of its kind, an
 * open-class attribute's exact name, a foreign element's expanded name, or the document node's own
 * `Node` row.
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
 * A node of a kind its parent cannot hold: a doctype or a document node under an element, an
 * element under the document node but one root element of a kind, or anything else there but its
 * doctype first, its comments and processing instructions, and one root element of a kind. The
 * document node's own row is misplaced when it is not of kind `document`, its own parent at slot 0.
 */
export class NodeMisplaced extends Schema.TaggedError<NodeMisplaced>()("NodeMisplaced", {
  at: Schema.BigInt,
  kind: Schema.String,
  node: Schema.String,
  parent: Schema.String,
}) {
  /**
   * The node, its kind and its place, the rule that refuses them, and the repair.
   */
  override get message(): string {
    return `Node ${this.node}, of kind ${this.kind}, sits under ${this.parent} at slot ${String(this.at)}, where no node of its kind can: the document node is its own parent at slot 0 and holds its doctype first, its comments and processing instructions, and one root element; and an element, of a kind or foreign, holds elements and character data but no doctype. Assemble the rows of one document as its scans returned them.`;
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
 * Two node rows hold one start (T1): each node of a document has its own place in document order.
 */
export class StartTaken extends Schema.TaggedError<StartTaken>()("StartTaken", {
  node: Schema.String,
  /**
   * The node whose row holds the start already.
   */
  other: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The start, the two nodes, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} starts at ${String(this.start)}, where node ${this.other} starts too, but each node of a document has its own start, its place in document order. Assemble the rows of one document, each once, as its scans returned them.`;
  }
}

/**
 * A node row's start is outside its document: a document of N nodes numbers them from 0 to N − 1,
 * so a start at N or beyond leaves a place below it empty.
 */
export class StartBeyond extends Schema.TaggedError<StartBeyond>()("StartBeyond", {
  count: Schema.Number,
  node: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The node, its start, the document's size, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} starts at ${String(this.start)}, but its document's ${String(this.count)} nodes start from 0 to ${String(this.count - 1)}, one each, in document order. Assemble every node row of one document, none filtered out.`;
  }
}

/**
 * The document node's interval is not `[0, N)`: it is the root, so it starts its document and its
 * subtree holds every node.
 */
export class DocumentInterval extends Schema.TaggedError<DocumentInterval>()("DocumentInterval", {
  count: Schema.Number,
  end: Schema.BigInt,
  node: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The document node, its interval, the one it must have, and the repair.
   */
  override get message(): string {
    return `The document node ${this.node} has the interval [${String(this.start)}, ${String(this.end)}), but it is the root of its document's ${String(this.count)} nodes, so its interval is [0, ${String(this.count)}). Assemble every node row of one document, none filtered out.`;
  }
}

/**
 * A node row whose parent is not the element its start sits in: in document order, a node is the
 * child of the innermost element whose interval holds its start, or of the document node when no
 * element's does.
 */
export class ParentNotOpen extends Schema.TaggedError<ParentNotOpen>()("ParentNotOpen", {
  node: Schema.String,
  /**
   * The innermost node whose interval holds the row's start: the parent its interval gives it.
   */
  open: Schema.String,
  parent: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The node, the parent it names, the one its start gives it, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} starts at ${String(this.start)} and names ${this.parent} as its parent, but the innermost node whose interval holds that start is ${this.open}, so the node is a child of ${this.open} or of no node. A node's parent is the nearest node before it in document order whose interval holds it; assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A node row whose slot is not its parent's next: in document order a family's slots run from 0
 * up, one each, so a node's slot is the number of its siblings that start before it.
 */
export class SlotOutOfTurn extends Schema.TaggedError<SlotOutOfTurn>()("SlotOutOfTurn", {
  at: Schema.BigInt,
  /**
   * The number of the node's siblings that start before it: the slot its start gives it.
   */
  expected: Schema.BigInt,
  node: Schema.String,
  parent: Schema.String,
}) {
  /**
   * The node, its slot, the one its start gives it, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} is at slot ${String(this.at)} of ${this.parent}'s family, but ${String(this.expected)} of its siblings start before it, so its slot is ${String(this.expected)}. A family's slots follow document order from 0, with no gap and none twice; assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A node row whose interval leaves its parent's: a node's subtree lies inside its parent's, so it
 * ends at or before its parent ends.
 */
export class EndBeyondParent extends Schema.TaggedError<EndBeyondParent>()("EndBeyondParent", {
  end: Schema.BigInt,
  node: Schema.String,
  parent: Schema.String,
  parentEnd: Schema.BigInt,
}) {
  /**
   * The node, its end, its parent's, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} ends at ${String(this.end)}, past the end of its parent ${this.parent} at ${String(this.parentEnd)}, so its interval leaves its parent's, which holds its whole subtree. Assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A node row whose interval holds no node: an interval holds at least its own node, so it ends
 * after it starts.
 */
export class IntervalEmpty extends Schema.TaggedError<IntervalEmpty>()("IntervalEmpty", {
  end: Schema.BigInt,
  node: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The node, its interval, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} has the interval [${String(this.start)}, ${String(this.end)}), which holds no node, but a node's interval holds at least the node itself. Assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A leaf's interval holds more than the leaf: character data and the doctype hold no children, so
 * a leaf's interval is `[start, start + 1)`.
 */
export class LeafOversized extends Schema.TaggedError<LeafOversized>()("LeafOversized", {
  end: Schema.BigInt,
  kind: Schema.String,
  node: Schema.String,
  start: Schema.BigInt,
}) {
  /**
   * The leaf, its interval, the one it must have, and the repair.
   */
  override get message(): string {
    return `Node ${this.node}, of kind ${this.kind}, has the interval [${String(this.start)}, ${String(this.end)}), but a ${this.kind} holds no children, so its interval holds only itself: [${String(this.start)}, ${String(this.start + 1n)}). Assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * Two node rows of one id: each node is one row.
 */
export class IdRepeated extends Schema.TaggedError<IdRepeated>()("IdRepeated", {
  node: Schema.String,
  /**
   * The start of the second row, in document order, of the id.
   */
  start: Schema.BigInt,
}) {
  /**
   * The node, its second row's start, and the repair.
   */
  override get message(): string {
    return `Node ${this.node} has a second row, starting at ${String(this.start)}, but each node is one row. Assemble the rows of one document, each once, as its scans returned them.`;
  }
}

/**
 * The families of an element a slot is placed in besides its children: its attributes and its
 * namespace declarations.
 */
const families = ["attributes", "namespaces"] as const;

/**
 * A row's slot is held by another row of its family: two rows of one family share a slot, as a
 * duplicated `at` does.
 */
export class SlotTaken extends Schema.TaggedError<SlotTaken>()("SlotTaken", {
  at: Schema.BigInt,
  /**
   * The key of the row that cannot be placed.
   */
  key: Schema.String,
  owner: Schema.String,
  rows: Schema.Literals(families),
}) {
  /**
   * The family, the slot, the row, and the repair.
   */
  override get message(): string {
    return `The ${this.rows} row (${this.key}) is at slot ${String(this.at)} of ${this.owner}'s family, which another of its rows holds. Each row of a family holds its own slot; assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A row's slot is past its family's last: a family of n rows holds the slots 0 to n − 1, so a slot
 * at n or beyond leaves a slot below it empty, as a gap in `at` does.
 */
export class SlotBeyond extends Schema.TaggedError<SlotBeyond>()("SlotBeyond", {
  at: Schema.BigInt,
  count: Schema.Number,
  /**
   * The key of the row that cannot be placed.
   */
  key: Schema.String,
  owner: Schema.String,
  rows: Schema.Literals(families),
}) {
  /**
   * The family, the slot, the row, and the repair.
   */
  override get message(): string {
    return `The ${this.rows} row (${this.key}) is at slot ${String(this.at)} of ${this.owner}'s family of ${String(this.count)} rows, whose slots run from 0 to ${String(this.count - 1)}. A family's slots have no gap; assemble the rows of one document as its scans returned them.`;
  }
}

/**
 * A row keyed by a node or an attribute the scan does not build, or a second row at one key.
 */
export class RowUnreached extends Schema.TaggedError<RowUnreached>()("RowUnreached", {
  /**
   * The row's key as its relation spells it: its node's id, its attribute's id, or its element's
   * id and slot.
   */
  key: Schema.String,
  rows: Schema.Literals(keyedLists),
}) {
  /**
   * The list, the row, and the repair.
   */
  override get message(): string {
    return `The ${this.rows} row at (${this.key}) belongs to no node or attribute of the document the node rows build, so the rows are not one document's. Assemble the rows of one document, each once, as its scans returned them.`;
  }
}

/**
 * The ways a document's rows fail to assemble.
 */
export type AssembleError =
  | DocumentInterval
  | EndBeyondParent
  | IdRepeated
  | IntervalEmpty
  | LeafOversized
  | NodeMisplaced
  | ParentNotOpen
  | RootMissing
  | RowMissing
  | RowUnreached
  | SlotBeyond
  | SlotOutOfTurn
  | SlotTaken
  | StartBeyond
  | StartTaken;

/**
 * Spell the key of a family row: its owner's id and its slot.
 *
 * @param row - The row.
 * @param row.at - Its slot.
 * @param row.node - Its owner.
 * @returns The key.
 */
const slotKeyOf = ({ at, node }: { readonly at: bigint; readonly node: NodeId }): string =>
  `${node}, ${String(at)}`;

/**
 * The order of an attribute's entity references: by offset, their key within the attribute.
 */
const byOffset = Order.mapInput(Order.BigInt, (row: AttributeEntityRow) => row.offset);

/**
 * Place rows at the slots their own field names, each once and none past the last.
 *
 * @param rows - The rows, in any order.
 * @param slotOf - The slot a row names.
 * @param refuse - The refusals of a row past the last slot and of a row at a slot another holds.
 * @param refuse.beyond - Refuse a row at a slot of n or more, for n rows.
 * @param refuse.taken - Refuse a row at a slot another row holds.
 * @returns The rows in slot order, or the refusal of the first that cannot be placed.
 */
const slotted = <Row, Beyond, Taken>(
  rows: readonly Row[],
  slotOf: (row: Row) => bigint,
  refuse: {
    readonly beyond: (row: Row) => Beyond;
    readonly taken: (row: Row, held: Row) => Taken;
  },
): Result.Result<readonly Row[], Beyond | Taken> => {
  const slots: (Row | undefined)[] = Array.from({ length: rows.length });
  for (const row of rows) {
    const slot = slotOf(row);
    if (slot < 0n || slot >= BigInt(rows.length)) {
      return Result.fail(refuse.beyond(row));
    }

    const held = slots[Number(slot)];
    if (held !== undefined) {
      return Result.fail(refuse.taken(row, held));
    }

    slots[Number(slot)] = row;
  }

  return Result.succeed(slots.filter((row) => row !== undefined));
};

/**
 * Place an element's family at its slots.
 *
 * @param rows - The family's rows, in any order.
 * @param family - Which family they are.
 * @param owner - The family's owner.
 * @param keyOfRow - A row's key, which a refusal names.
 * @returns The rows in slot order, or the refusal of the first that cannot be placed.
 */
const placed = <Row extends { readonly at: bigint }>(
  rows: readonly Row[],
  family: (typeof families)[number],
  owner: NodeId,
  keyOfRow: (row: Row) => string,
): Result.Result<readonly Row[], SlotBeyond | SlotTaken> =>
  slotted(rows, ({ at }) => at, {
    beyond: (row) =>
      new SlotBeyond({ at: row.at, count: rows.length, key: keyOfRow(row), owner, rows: family }),
    taken: (row) => new SlotTaken({ at: row.at, key: keyOfRow(row), owner, rows: family }),
  });

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
 * The rows other than node rows that the scan has taken, each once.
 */
type Reached = Set<object>;

/**
 * Take the row at a key, recording that the scan reached it.
 *
 * @param reached - The rows reached.
 * @param rows - The list the row belongs in, which a refusal names.
 * @param map - The list's rows by key.
 * @param key - The key.
 * @returns The row, or the refusal of its absence.
 */
const take = <Row extends object>(
  reached: Reached,
  rows: RowList,
  map: ReadonlyMap<string, Row>,
  key: string,
): Result.Result<Row, RowMissing> =>
  Result.map(
    Result.fromNullishOr(map.get(key), () => new RowMissing({ key, rows })),
    (row) => {
      reached.add(row);

      return row;
    },
  );

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
 * the exact name its open-name row holds. A name in no namespace has no prefix or namespace name to
 * read.
 */
const openNameOf = {
  "data-*": ({ local }) => ({ _tag: "data-*", local }),
  foreign: ({ local, prefix, uri }) => ({ _tag: "foreign", local, prefix, uri }),
  "no-namespace": ({ local }) => ({ _tag: "no-namespace", local }),
  "own-namespace": ({ local, prefix, uri }) => ({ _tag: "own-namespace", local, prefix, uri }),
} as const satisfies {
  readonly [K in OpenClass]: (row: OpenNameRow) => Extract<OpenName, { readonly _tag: K }>;
};

/**
 * Build an attribute from its row and the rows keyed by its id.
 *
 * @param index - The document's rows by owner.
 * @param reached - The rows reached, which the attribute's rows join.
 * @param row - The attribute's row.
 * @returns The attribute, or the refusal of an open-class one without its open name.
 */
const attributeOf = <V extends XdmVocabulary>(
  index: Index<V>,
  reached: Reached,
  row: AttributeRow<V>,
): Result.Result<XdmAttribute<V>, RowMissing> => {
  reached.add(row);

  return Result.gen(function* attribute() {
    const { id, lexical, name } = row;
    const named: XdmAttributeName<V> = isOpenClass(name)
      ? yield* Result.map(take(reached, "openNames", index.openNames, id), (open) =>
          openNameOf[name](open),
        )
      : { _tag: "closed", handle: name };
    const references = (index.references.get(id) ?? []).toSorted(byOffset);
    for (const reference of references) {
      reached.add(reference);
    }

    return {
      lexical,
      name: named,
      references: references.map(({ name: entity, offset }) => ({
        name: entity,
        offset: Number(offset),
      })),
    };
  });
};

/**
 * Build what every element holds but its children: its attributes and namespace declarations,
 * each at its slot, and its prefix.
 *
 * @param index - The document's rows by owner.
 * @param reached - The rows reached.
 * @param row - The element's row.
 * @returns The element's content, or the refusal of a family that cannot be placed or an attribute
 *   without its rows.
 */
const contentOf = <V extends XdmVocabulary>(
  index: Index<V>,
  reached: Reached,
  row: NodeRow<V>,
): Result.Result<
  Pick<XdmClosedElement<V>, "attributes" | "namespaces" | "prefix">,
  RowMissing | SlotBeyond | SlotTaken
> =>
  Result.gen(function* elementContent() {
    const attributeRows = yield* placed(
      index.attributes.get(row.id) ?? [],
      "attributes",
      row.id,
      ({ id }) => id,
    );
    const attributes = yield* Result.all(
      attributeRows.map((attribute) => attributeOf(index, reached, attribute)),
    );
    const declarations = yield* placed(
      index.namespaces.get(row.id) ?? [],
      "namespaces",
      row.id,
      slotKeyOf,
    );
    const namespaces: XdmNamespace[] = [];
    for (const declaration of declarations) {
      reached.add(declaration);
      namespaces.push({ prefix: declaration.prefix, uri: declaration.uri });
    }

    return { attributes, namespaces, prefix: row.prefix };
  });

/**
 * A node built from its row, with the list its children are appended to: an element of a kind or a
 * foreign one, which holds any child but a doctype; or character data and the doctype, which hold
 * nothing.
 */
type Built<V extends XdmVocabulary> =
  | {
      readonly _tag: "element";
      readonly children: XdmChild<V>[];
      readonly node: XdmElement<V>;
    }
  | { readonly _tag: "character"; readonly node: XdmCharacter }
  | { readonly _tag: "doctype"; readonly value: string };

/**
 * A built node that holds children: an element of either shape, whose family the scan appends to.
 */
type Owner<V extends XdmVocabulary> = Extract<Built<V>, { readonly _tag: "element" }>;

/**
 * Refuse a node where its row places it.
 *
 * @param row - The node's row.
 * @returns The refusal, naming the node, its kind and its place.
 */
const misplaced = <V extends XdmVocabulary>(row: NodeRow<V>): NodeMisplaced =>
  new NodeMisplaced({ at: row.at, kind: row.kind, node: row.id, parent: row.parent });

/**
 * A node that holds no children and keeps its content in one row of a list of its kind: character
 * data or the doctype.
 */
type LeafKind = XdmCharacter["_tag"] | "doctype";

/**
 * The builder of each leaf kind's node from the row of its kind.
 */
const leaves = {
  comment: (index, reached, id) =>
    Result.map(take(reached, "comments", index.comments, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "comment", value },
    })),
  doctype: (index, reached, id) =>
    Result.map(take(reached, "doctypes", index.doctypes, id), ({ value }) => ({
      _tag: "doctype",
      value,
    })),
  entityRef: (index, reached, id) =>
    Result.map(take(reached, "entityRefs", index.entityRefs, id), ({ name }) => ({
      _tag: "character",
      node: { _tag: "entityRef", name },
    })),
  pi: (index, reached, id) =>
    Result.map(take(reached, "pis", index.pis, id), ({ data, target }) => ({
      _tag: "character",
      node: { _tag: "pi", data, target },
    })),
  text: (index, reached, id) =>
    Result.map(take(reached, "texts", index.texts, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "text", value },
    })),
  ws: (index, reached, id) =>
    Result.map(take(reached, "whitespace", index.whitespace, id), ({ value }) => ({
      _tag: "character",
      node: { _tag: "ws", value },
    })),
} as const satisfies {
  readonly [K in LeafKind]: (
    index: Index<XdmVocabulary>,
    reached: Reached,
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
 * @param reached - The rows reached, which the node's rows join.
 * @param row - The node's row.
 * @returns The node, or the refusal of a leaf without its row, a foreign element without its name,
 *   an element with a family that cannot be placed or an attribute without its rows, or a document
 *   node below the document node.
 */
const builtOf = <V extends XdmVocabulary>(
  index: Index<V>,
  reached: Reached,
  row: NodeRow<V>,
): Result.Result<Built<V>, AssembleError> => {
  const { id, kind } = row;
  if (isLeafKind(kind)) {
    return leaves[kind](index, reached, id);
  }

  if (kind === "document") {
    return Result.fail(misplaced(row));
  }

  return Result.gen(function* element() {
    const content = yield* contentOf(index, reached, row);
    const children: XdmChild<V>[] = [];
    if (isForeignKind(kind)) {
      const { local, namespace } = yield* take(
        reached,
        "openElementNames",
        index.openElementNames,
        id,
      );

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
 * Append a built node to the element it sits in, or refuse it there.
 *
 * @param parent - The element.
 * @param child - The built node.
 * @param row - The node's row, which a refusal names.
 * @returns Nothing once the node is appended.
 */
const appendTo = <V extends XdmVocabulary>(
  parent: Owner<V>,
  child: Built<V>,
  row: NodeRow<V>,
): Result.Result<void, NodeMisplaced> => {
  switch (child._tag) {
    case "doctype": {
      return Result.fail(misplaced(row));
    }
    case "element":
    case "character": {
      parent.children.push(child.node);

      return Result.void;
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
 * Place one of the document node's children by its place in XML's `document` production, or
 * refuse it there.
 *
 * @param parsed - The document node's children so far.
 * @param child - The built child.
 * @param row - The child's row, which a refusal names.
 * @returns Nothing once the child is placed.
 * @see {@link https://www.w3.org/TR/xml/#NT-document | XML 1.0, document}
 */
const placeInDocument = <V extends XdmVocabulary>(
  parsed: DocumentChildren<V>,
  child: Built<V>,
  row: NodeRow<V>,
): Result.Result<void, NodeMisplaced> => {
  switch (child._tag) {
    case "doctype": {
      if (row.at !== 0n) {
        return Result.fail(misplaced(row));
      }

      parsed.doctype = Option.some(child.value);

      return Result.void;
    }
    case "element": {
      const { node } = child;
      if (node._tag !== "element" || Option.isSome(parsed.root)) {
        return Result.fail(misplaced(row));
      }

      parsed.root = Option.some(node);

      return Result.void;
    }
    case "character": {
      const { node } = child;
      if (node._tag !== "comment" && node._tag !== "pi") {
        return Result.fail(misplaced(row));
      }

      (Option.isSome(parsed.root) ? parsed.epilog : parsed.prolog).push(node);

      return Result.void;
    }
    default: {
      return child satisfies never;
    }
  }
};

/**
 * Read the document row's declaration fields back from their null objects.
 *
 * @param row - The document row.
 * @returns The declaration, none when `xmlVersion` is {@link none}.
 */
const declarationOf = (row: DocumentRow): Option.Option<XdmDeclaration> =>
  row.xmlVersion === none
    ? Option.none()
    : Option.some({
        encoding: row.encoding === "" ? Option.none() : Option.some(row.encoding),
        standalone: row.standalone === none ? Option.none() : Option.some(row.standalone),
        version: row.xmlVersion,
      });

/**
 * Find the first row of a list the scan did not reach: one it never took, or one the list holds a
 * second time, which the scan takes once.
 *
 * @param rows - The list's rows.
 * @param reached - The rows reached.
 * @param list - Which list they are.
 * @param key - A row's key as its relation spells it.
 * @returns The refusal of the first row not reached, none when every row was.
 */
const unreachedIn = <Row extends object>(
  rows: readonly Row[],
  reached: Reached,
  list: (typeof keyedLists)[number],
  key: (row: Row) => string,
): Option.Option<RowUnreached> => {
  const counted = new Set<object>();

  return Option.map(
    Option.fromNullishOr(
      rows.find((row) => {
        const once = reached.has(row) && !counted.has(row);
        counted.add(row);

        return !once;
      }),
    ),
    (row) => new RowUnreached({ key: key(row), rows: list }),
  );
};

/**
 * Spell the key of a row keyed by its node.
 *
 * @param row - The row.
 * @param row.node - Its node.
 * @returns The node's id.
 */
const byNode = ({ node }: { readonly node: NodeId }): string => node;

/**
 * Find the first row the scan did not reach, by the lists in {@link keyedLists} order.
 *
 * @param rows - The document's rows.
 * @param reached - The rows reached.
 * @returns The refusal of the first row not reached, none when every row was.
 */
const unreached = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
  reached: Reached,
): Option.Option<RowUnreached> =>
  Option.firstSomeOf([
    unreachedIn(rows.attributes, reached, "attributes", ({ id }) => id),
    unreachedIn(rows.openNames, reached, "openNames", ({ attribute }) => attribute),
    unreachedIn(
      rows.attributeEntities,
      reached,
      "attributeEntities",
      ({ attribute, offset }) => `${attribute}, ${String(offset)}`,
    ),
    unreachedIn(rows.namespaces, reached, "namespaces", slotKeyOf),
    unreachedIn(rows.openElementNames, reached, "openElementNames", byNode),
    unreachedIn(rows.texts, reached, "texts", byNode),
    unreachedIn(rows.whitespace, reached, "whitespace", byNode),
    unreachedIn(rows.comments, reached, "comments", byNode),
    unreachedIn(rows.pis, reached, "pis", byNode),
    unreachedIn(rows.entityRefs, reached, "entityRefs", byNode),
    unreachedIn(rows.doctypes, reached, "doctypes", byNode),
  ]);

/**
 * A node whose interval the scan holds open: its row, how many of its children the scan has
 * placed, and how a child is placed in it, by its element's content or by the `document`
 * production.
 */
interface Open<V extends XdmVocabulary> {
  count: bigint;
  readonly place: (child: Built<V>, row: NodeRow<V>) => Result.Result<void, NodeMisplaced>;
  readonly row: NodeRow<V>;
}

/**
 * Assemble a document's rows back into its tree.
 *
 * The node rows are placed by `start` and read in that order, with a stack of the elements whose
 * intervals hold the row read: each row closes the elements whose intervals end at or before its
 * start, is checked against the innermost one left, or the document node, is built, and when it is
 * an element is opened in turn. The document node's own interval, `[0, N)`, holds every start, so
 * it is never closed and is the bottom of the stack.
 *
 * @param rows - Every row of one document, in any order.
 * @returns The document `flatten` writes as these rows; or the refusal of the first rows, in
 *   document order, that fail a check: two node rows at one start or one past the last, a document
 *   node misplaced or not over `[0, N)`, a node whose parent, slot or interval is not the one its
 *   start gives it, an empty interval or an oversized leaf, a repeated id, a node of a kind where
 *   none can sit, a row another names missing, a family of attributes or declarations that cannot
 *   be placed, no root element, or a row of no node or attribute the scan builds.
 */
export const assemble = <V extends XdmVocabulary>(
  rows: FlatRows<V>,
): Result.Result<XdmDocument<V>, AssembleError> =>
  Result.gen(function* assembleDocument() {
    const { document } = rows;
    const self = document.node;
    const count = rows.nodes.length;
    const nodes = yield* slotted(rows.nodes, ({ start }) => start, {
      beyond: (row) => new StartBeyond({ count, node: row.id, start: row.start }),
      taken: (row, held) => new StartTaken({ node: row.id, other: held.id, start: row.start }),
    });
    const sentinel = yield* Result.fromNullishOr(
      rows.nodes.find(({ id }) => id === self),
      () => new RowMissing({ key: self, rows: "nodes" }),
    );
    if (sentinel.kind !== "document" || sentinel.parent !== self || sentinel.at !== 0n) {
      return yield* Result.fail(misplaced(sentinel));
    }

    if (sentinel.start !== 0n || sentinel.end !== BigInt(count)) {
      return yield* Result.fail(
        new DocumentInterval({ count, end: sentinel.end, node: self, start: sentinel.start }),
      );
    }

    const index = indexOf(rows);
    const reached: Reached = new Set();
    const ids = new Set<NodeId>([self]);
    const parsed: DocumentChildren<V> = {
      doctype: Option.none(),
      epilog: [],
      prolog: [],
      root: Option.none(),
    };
    const root: Open<V> = {
      count: 0n,
      place: (child, row) => placeInDocument(parsed, child, row),
      row: sentinel,
    };
    const stack: Open<V>[] = [];
    const innermost = (): Open<V> => stack.at(-1) ?? root;
    for (const row of nodes.slice(1)) {
      while (stack.length > 0 && innermost().row.end <= row.start) {
        stack.pop();
      }

      const open = innermost();
      if (ids.has(row.id)) {
        return yield* Result.fail(new IdRepeated({ node: row.id, start: row.start }));
      }

      ids.add(row.id);
      if (row.parent !== open.row.id) {
        return yield* Result.fail(
          new ParentNotOpen({
            node: row.id,
            open: open.row.id,
            parent: row.parent,
            start: row.start,
          }),
        );
      }

      if (row.at !== open.count) {
        return yield* Result.fail(
          new SlotOutOfTurn({ at: row.at, expected: open.count, node: row.id, parent: row.parent }),
        );
      }

      if (row.end > open.row.end) {
        return yield* Result.fail(
          new EndBeyondParent({
            end: row.end,
            node: row.id,
            parent: row.parent,
            parentEnd: open.row.end,
          }),
        );
      }

      if (row.end <= row.start) {
        return yield* Result.fail(
          new IntervalEmpty({ end: row.end, node: row.id, start: row.start }),
        );
      }

      if (isLeafKind(row.kind) && row.end !== row.start + 1n) {
        return yield* Result.fail(
          new LeafOversized({ end: row.end, kind: row.kind, node: row.id, start: row.start }),
        );
      }

      const child = yield* builtOf(index, reached, row);
      yield* open.place(child, row);
      open.count += 1n;
      if (child._tag === "element") {
        stack.push({ count: 0n, place: (built, at) => appendTo(child, built, at), row });
      }
    }

    const element = yield* Result.fromOption(parsed.root, () => new RootMissing({ node: self }));
    const left = unreached(rows, reached);
    if (Option.isSome(left)) {
      return yield* Result.fail(left.value);
    }

    return {
      _tag: "document",
      charset: document.charset,
      declaration: declarationOf(document),
      doctype: parsed.doctype,
      epilog: parsed.epilog,
      exportCharset: document.exportCharset,
      prolog: parsed.prolog,
      root: element,
      version: sentinel.version,
    };
  });
