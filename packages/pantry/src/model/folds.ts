/**
 * Host folds: every field of the document layer the host writes, computed from a document and the
 * grammar's closed relations (plan §1.3 and §1.5, fin.md §4.3, §4.5a and §16).
 *
 * A node's fields come from three places, each a containment of `Node` into itself:
 *
 * - **Its parent** (N3, the merged parent copy): copies of the parent's `document`, `kind`, `start`,
 *   `ancestry`, `nearest` and `nearestKind` as `document`, `parentKind`, `parentStart`,
 *   `parentAncestry`, `parentNearest` and `parentNearestKind`. A first child starts one past its
 *   parent, `parentStart + 1` (T3). Its own `nearest` is the parent when the parent is an
 *   interaction, else the parent's `nearest` (N8), so it is the nearest interaction above the node,
 *   or the document node when there is none.
 * - **Its predecessor among its parent's children** (N5): `was` and `elementsWas` copy the
 *   predecessor's `state` and `elements`, and the first child reads the empty fold: the content
 *   automaton's start, and no element. The same containment carries the predecessor's `end` into
 *   the node's `start` (T4), so no field of its own holds it.
 * - **Its last child** (N7): `childState` and `elementChildren` copy the last child's fold, the end
 *   values of the family, and an empty family reads the empty fold. The same containment carries
 *   the last child's `end` into the node's `end` (T5).
 *
 * The node's pre-order interval, `start` and `end` (trees.md §1), is drawn by `flatten`'s walk,
 * which numbers the nodes in the order this one folds them, so every copy above reads the interval
 * it writes.
 *
 * Beside those, a node carries its family counts (`children`, `attributes`, `namespaces`), the
 * first and last code points of its own characters (`first`, `last`, {@link endsOf}), and
 * `attrs`, the end value of its attribute family (AL2), where each attribute copies its owner's
 * `kind`, `governs`, `version` and `document` and its predecessor's `attrs` as `attrsWas`. An
 * open class is one position for many names, and the database's fold steps over closed names only
 * (the W5 amendment's C9), so an open-class attribute adds nothing to `attrs`.
 *
 * A node's `state`, `ancestry` and `elements`, and an attribute's `attrs`, are fields closed
 * relations determine from the row's own fields, so PostgreSQL derives them (fin.md
 * §17, E1). The host computes the same values from the same relations, because the copies above
 * need them before the write (§4.5a), and keeps them apart in `derived`: a write leaves them out.
 *
 * The document node is the sentinel at the head of every fold (fin.md §12, entry 8): it is its own
 * parent at start 0, its own `document` and `nearest`, its copies of its parent are its own fields,
 * and its `parentAncestry` is empty, so its children's copies come from it as every other child's
 * come from its parent, and no node's copy is a special case.
 *
 * A family's state is its parent's content automaton's, by Glushkov positions
 * (`#pantry/grammar/content.ts`): each child's state is the position its `Admission` cell names,
 * its predecessor's state for character data, and for a kind several positions name the one
 * `Symbol` gives it that follows its predecessor's. A fold reads that cell for each child and one
 * for each attribute, its row of `AttributeAdmission` under its element's kind. A child or an
 * attribute with no cell has nothing to derive, so the fold refuses it ({@link FoldRefusal}): a
 * missing cell is a refusal, never a skip. Every other law the folds leave to the database: a child
 * out of its content model's order still folds to its position, and the database refuses it by
 * `Follow(version, parent, was, state)`, and a family that cannot end where it does by `Last`,
 * each with that law's name.
 *
 * A foreign element is a node like any other, of the foreign kind of its namespace class whatever
 * its name: it folds by the rows the closed relations hold at that kind, and its subtree folds
 * below it. Its name is a row of its own beside it, which the folds pass through as `flatten`
 * writes it.
 *
 * The folds read each family from the tree, where it is nested under its owner as a family write
 * nests it (fin.md §4.5a), and never regroup flat rows by their owner.
 */
import { Option, Result, Schema } from "effect";
import { step as enter } from "#pantry/grammar/ancestry.ts";
import type { Ancestry, AncestrySets } from "#pantry/grammar/ancestry.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { documentFamily, flatten, none } from "#pantry/model/xdm.ts";
import type {
  AttributeRow,
  FlatRows,
  NodeId,
  NodeRow,
  XdmChild,
  XdmDocument,
  XdmDocumentChild,
  XdmKind,
  XdmVocabulary,
} from "#pantry/model/xdm.ts";

/**
 * A closed relation as the folds read it: the row at a key, none where the relation holds none.
 * Every `Closed` the grammar's generators return is one (`#pantry/grammar/closed.ts`).
 */
export interface Lookup<Key, Row> {
  /**
   * Find the row at a key.
   *
   * @param key - A value for each key field.
   * @returns The row, or none where the relation holds none.
   */
  readonly lookup: (key: Key) => Option.Option<Row>;
}

/**
 * A child's kind under its parent's kind in one schema version: the key of `Admission`.
 */
export interface ChildKey<V extends XdmVocabulary> {
  readonly child: XdmKind<V>;
  readonly parent: XdmKind<V>;
  readonly version: V["version"];
}

/**
 * An attribute's name under its element's kind and governing type in one schema version: the key
 * an attribute's position is read under, `GovernedAttribute`'s where the element's governing type
 * is a governor of its kind, else `AttributeAdmission`'s (spec reading 84).
 */
export interface AttributeKey<V extends XdmVocabulary> {
  readonly governs: string;
  readonly kind: XdmKind<V>;
  readonly name: NameHandle<V>;
  readonly version: V["version"];
}

/**
 * Why a child has no state: its parent does not admit its kind, or its kind is one several of the
 * content model's positions name and none of them follows its predecessor's.
 */
export type Unplaced = "unadmitted" | "unfollowed";

/**
 * The closed relations the folds read, each a cell lookup the grammar's relations answer.
 */
export interface FoldGrammar<V extends XdmVocabulary> {
  /**
   * The child's state in its parent's content automaton (`#pantry/grammar/content.ts`): its
   * `Admission` position; its predecessor's state for character data, which no position names;
   * and for a kind several positions name, the one `Symbol` gives it that follows its
   * predecessor's.
   *
   * @param key - The version, the parent's kind and the child's.
   * @param was - The predecessor's state, 0 (the start) for the first child.
   * @returns The state, or why the child has none.
   */
  readonly state: (key: ChildKey<V>, was: number) => Result.Result<number, Unplaced>;
  /**
   * The ancestry grammar of `#pantry/grammar/ancestry.ts`. The folds read `Enters`: a node's
   * `ancestry` is `parentAncestry | Enters[kind]`.
   */
  readonly ancestry: AncestrySets;
  /**
   * The position of an attribute's name in its element's `attrs` (D8), from
   * `#pantry/grammar/attributes.ts`: its governor's `GovernedAttribute` position where one governs
   * the element, else its kind's `AttributeAdmission` position (`admissionOf`).
   *
   * @param key - The version, the element's kind and governing type, and the attribute's name
   *   handle.
   * @returns The position, or none when the element does not admit the name.
   */
  readonly attributePosition: (key: AttributeKey<V>) => Option.Option<number>;
  /**
   * `Interaction`, from `#pantry/grammar/kinds.ts`: a node whose parent is one takes the parent
   * as its `nearest`.
   */
  readonly interaction: Lookup<{ readonly kind: XdmKind<V> }, unknown>;
  /**
   * `IsElement`, from `#pantry/grammar/kinds.ts`: each element child adds one to `elements`.
   */
  readonly isElement: Lookup<{ readonly kind: XdmKind<V> }, unknown>;
}

/**
 * A child with no state: its parent does not admit it, so `Admission` holds no cell for it, or its
 * kind is one several positions name and none follows its predecessor's, so `Symbol` and
 * `Follow` hold no cell for it. No fold of it exists.
 */
export class ChildUnadmitted extends Schema.TaggedError<ChildUnadmitted>()("ChildUnadmitted", {
  kind: Schema.String,
  node: Schema.String,
  parent: Schema.String,
  reason: Schema.Literals(["unadmitted", "unfollowed"]),
  version: Schema.String,
}) {
  /**
   * The child, its parent, why it has no state, and the repair.
   */
  override get message(): string {
    return this.reason === "unadmitted"
      ? `Node ${this.node}, of kind ${this.kind}, sits under a ${this.parent}, which admits no ${this.kind} in ${this.version}, so it has no fold. Move it under a kind that admits it, or remove it.`
      : `Node ${this.node}, of kind ${this.kind}, sits under a ${this.parent} where no position of its content model that names ${this.kind} follows its predecessor in ${this.version}, so it has no fold. Reorder the ${this.parent}'s children to its content model.`;
  }
}

/**
 * An attribute its element's kind does not admit: `AttributeAdmission` holds no cell for it, so it
 * has no position in the element's `attrs`.
 */
export class AttributeUnadmitted extends Schema.TaggedError<AttributeUnadmitted>()(
  "AttributeUnadmitted",
  {
    at: Schema.BigInt,
    kind: Schema.String,
    name: Schema.String,
    node: Schema.String,
    version: Schema.String,
  },
) {
  /**
   * The attribute, its element, and the repair.
   */
  override get message(): string {
    return `The attribute ${this.name} at slot ${String(this.at)} of node ${this.node} is on a ${this.kind}, which admits no ${this.name} in ${this.version}, so it has no position. Remove it, or carry it on a kind that admits it.`;
  }
}

/**
 * The ways a document has no folds: a cell a fold reads is missing.
 */
export type FoldRefusal = AttributeUnadmitted | ChildUnadmitted;

/**
 * A set of positions among the names an element's kind admits (D8): an element's `attrs` and an
 * attribute's `attrsWas`.
 */
export type Positions = ReadonlySet<number>;

/**
 * An `AttributeName` handle as an attribute row carries it: a closed name, or the class of an open
 * one.
 */
export type NameHandle<V extends XdmVocabulary> = AttributeRow<V>["name"];

/**
 * A children family's fold after one slot: the content automaton's state, the last position a child
 * took, and the element count, which arity reads (O4). A node's own fold is what it hands its
 * successor (N5) and, as the last child, its parent (N7).
 */
export interface Slot {
  readonly elements: bigint;
  readonly state: number;
}

/**
 * The fields of a node PostgreSQL derives from the row's own fields and the closed relations
 * (E1): its fold after its slot, and the ancestry it hands its children.
 */
export interface NodeDerived extends Slot {
  /**
   * `parentAncestry | Enters[kind]`.
   */
  readonly ancestry: Ancestry;
}

/**
 * A node's `Node` row with every field the host writes, and the fields PostgreSQL derives, which
 * the host computes to fill the copies.
 *
 * `at` is the node's slot and `children`, `attributes` and `namespaces` its families' sizes,
 * which grizzle's family write may draw itself (plan A5); the rest are copies, the order state the
 * node was folded in, and its families' end values.
 */
export interface FoldedNode<V extends XdmVocabulary> extends NodeRow<V> {
  /**
   * The number of the node's attributes.
   */
  readonly attributes: bigint;
  /**
   * The positions of the node's attributes' names among those its kind admits (D8): its attribute
   * family's end value, empty when it has none.
   */
  readonly attrs: Positions;
  /**
   * The last child's state, `Last`'s cell with the node's (version, kind), 0 for an empty family.
   */
  readonly childState: number;
  /**
   * The number of the node's children.
   */
  readonly children: bigint;
  /**
   * The fields PostgreSQL derives; a write leaves them out.
   */
  readonly derived: NodeDerived;
  /**
   * The id of the node's document node.
   */
  readonly document: NodeId;
  readonly elementChildren: bigint;
  readonly elementsWas: bigint;
  /**
   * The first code point of the node's own characters ({@link charactersOf}), empty when it holds
   * none: `Node.first`, which `E1_derived` proves and the `q` quotation law reads (spec reading
   * 127).
   */
  readonly first: string;
  /**
   * The last code point of the node's own characters, empty when it holds none: `Node.last`.
   */
  readonly last: string;
  /**
   * The number of the node's namespace declarations.
   */
  readonly namespaces: bigint;
  /**
   * The nearest interaction above the node, or the document node when there is none.
   */
  readonly nearest: NodeId;
  readonly nearestKind: XdmKind<V>;
  readonly parentAncestry: Ancestry;
  readonly parentKind: XdmKind<V>;
  readonly parentNearest: NodeId;
  readonly parentNearestKind: XdmKind<V>;
  /**
   * The parent's `start`, which a first child's `start` is one past (T3); the document node's own.
   */
  readonly parentStart: bigint;
  /**
   * The node's string value as its children write it: its text, whitespace and entity-reference
   * children's characters in order, each reference as `&name;`, as an attribute's lexical form
   * keeps one, and the empty string when it holds none. For an element of simple content it is the
   * element's value, total, so `TextDomain` judges it under its kind's domain, whose pattern
   * absorbs the domain's `whiteSpace` class (`#pantry/grammar/domains.ts`), and an empty element is
   * judged on `''`.
   */
  readonly stringValue: string;
  /**
   * The predecessor's state, 0 (the content automaton's start) for the first child; `Follow`'s
   * cell is (version, parentKind, was, state).
   */
  readonly was: number;
}

/**
 * An attribute's `Attribute` row with every field the host writes: its owner's `kind`, `governs`,
 * `version` and `document`, and its predecessor's `attrs`.
 */
export interface FoldedAttribute<V extends XdmVocabulary> extends AttributeRow<V> {
  /**
   * The positions of the names of the attributes before this one on its element, empty at the
   * first.
   */
  readonly attrsWas: Positions;
  /**
   * The field PostgreSQL derives, `attrsWas | {position}` for a closed name and `attrsWas` for an
   * open class, which the fold steps over no position of (C9); a write leaves it out.
   */
  readonly derived: { readonly attrs: Positions };
  readonly document: NodeId;
  /**
   * The owner's governing type, which with its kind decides the attribute's position and domain
   * (spec reading 84).
   */
  readonly governs: string;
  readonly kind: XdmKind<V>;
  readonly version: V["version"];
}

/**
 * A document's rows with every field the host writes: {@link flatten}'s rows, with its node and
 * attribute rows folded. Every list is in `flatten`'s order, so the rows are a document's
 * `FlatRows` as they are.
 */
export interface FoldedRows<V extends XdmVocabulary> extends FlatRows<V> {
  readonly attributes: readonly FoldedAttribute<V>[];
  readonly nodes: readonly FoldedNode<V>[];
}

/**
 * A node with its copies and its own fold, before its families are folded: every field of
 * {@link FoldedNode} but the counts, the end values and the string value its children write, and
 * its own characters' first and last, which the walk reads off the node in the tree.
 */
type Head<V extends XdmVocabulary> = Omit<
  FoldedNode<V>,
  | "attributes"
  | "attrs"
  | "childState"
  | "children"
  | "elementChildren"
  | "first"
  | "last"
  | "namespaces"
  | "stringValue"
>;

/**
 * The fold before a family's first slot, the identity of each of its folds: the content automaton's
 * start, state 0, and no element. The first child copies it, and an empty family's end values are
 * it.
 */
const emptyFold: Slot = { elements: 0n, state: 0 };

/**
 * The ancestry the document node sits in: no flag (N1).
 */
const noFlags: Ancestry = new Set();

/**
 * Add a member to a set, keeping the set itself when it already holds the member, so an
 * unchanged fold shares its predecessor's set.
 *
 * @param set - The set.
 * @param member - The member.
 * @returns The set with the member.
 */
const adding = <T>(set: ReadonlySet<T>, member: T): ReadonlySet<T> =>
  set.has(member) ? set : new Set(set).add(member);

/**
 * Decide whether a set over `NodeKind` holds a kind.
 *
 * @param set - The set.
 * @param kind - The kind.
 * @returns Whether the set has a row at the kind.
 */
const holds = <Kind>(set: Lookup<{ readonly kind: Kind }, unknown>, kind: Kind): boolean =>
  Option.isSome(set.lookup({ kind }));

/**
 * Fold one child into its family, as PostgreSQL derives its fields (E1): its state in its
 * parent's content automaton, its element count, and its ancestry (`step` of
 * `#pantry/grammar/ancestry.ts`).
 *
 * The state is its position, never judged against its predecessor's: `Follow(version, parent,
 * was, state)` is N5's law, which the database checks.
 *
 * @param grammar - The closed relations.
 * @param row - The child's row.
 * @param parentKind - Its parent's kind.
 * @param parentAncestry - The ancestry it sits in, its parent's own.
 * @param was - Its predecessor's fold, {@link emptyFold} for the first child.
 * @returns The child's derived fields, or its refusal when it has no state.
 */
const derive = <V extends XdmVocabulary>(
  grammar: FoldGrammar<V>,
  row: NodeRow<V>,
  parentKind: XdmKind<V>,
  parentAncestry: Ancestry,
  was: Slot,
): Result.Result<NodeDerived, ChildUnadmitted> =>
  Result.mapBoth(
    grammar.state({ child: row.kind, parent: parentKind, version: row.version }, was.state),
    {
      onFailure: (reason) =>
        new ChildUnadmitted({
          kind: row.kind,
          node: row.id,
          parent: parentKind,
          reason,
          version: row.version,
        }),
      onSuccess: (state) => ({
        ancestry: enter(grammar.ancestry, parentAncestry, row.kind),
        elements: was.elements + (holds(grammar.isElement, row.kind) ? 1n : 0n),
        state,
      }),
    },
  );

/**
 * Copy a predecessor's fold onto its successor, as N5's fold does.
 *
 * @param was - The predecessor's fold, {@link emptyFold} for the first child.
 * @returns The successor's `was` and `elementsWas`.
 */
const wasOf = (was: Slot) => ({ elementsWas: was.elements, was: was.state });

/**
 * Copy a family's last fold onto its owner, as N7's last slot does.
 *
 * @param end - The last child's fold, {@link emptyFold} for an empty family.
 * @returns The owner's `childState` and `elementChildren`.
 */
const endOf = (end: Slot) => ({ childState: end.state, elementChildren: end.elements });

/**
 * Construct the document node's head: the sentinel whose copies of its parent are its own fields
 * (N1), at start 0, folded from the empty fold.
 *
 * @param grammar - The closed relations.
 * @param row - The document node's row, its own parent at slot 0 over `[0, N)`.
 * @returns The head.
 */
const sentinelOf = <V extends XdmVocabulary>(
  grammar: FoldGrammar<V>,
  row: NodeRow<V>,
): Head<V> => ({
  ...row,
  ...wasOf(emptyFold),
  derived: { ...emptyFold, ancestry: enter(grammar.ancestry, noFlags, row.kind) },
  document: row.id,
  nearest: row.id,
  nearestKind: row.kind,
  parentAncestry: noFlags,
  parentKind: row.kind,
  parentNearest: row.id,
  parentNearestKind: row.kind,
  parentStart: row.start,
});

/**
 * Construct a child's head from its parent's and its predecessor's fold: the merged parent copy
 * (N3), the owner copy (N8) and the predecessor copy (N5).
 *
 * @param grammar - The closed relations.
 * @param parent - The parent's head.
 * @param was - The predecessor's fold, {@link emptyFold} for the first child.
 * @param row - The child's row.
 * @returns The head, or the refusal of a child its parent does not admit.
 */
const headOf = <V extends XdmVocabulary>(
  grammar: FoldGrammar<V>,
  parent: Head<V>,
  was: Slot,
  row: NodeRow<V>,
): Result.Result<Head<V>, ChildUnadmitted> =>
  Result.map(derive(grammar, row, parent.kind, parent.derived.ancestry, was), (derived) => ({
    ...row,
    ...(holds(grammar.interaction, parent.kind)
      ? { nearest: parent.id, nearestKind: parent.kind }
      : { nearest: parent.nearest, nearestKind: parent.nearestKind }),
    ...wasOf(was),
    derived,
    document: parent.document,
    parentAncestry: parent.derived.ancestry,
    parentKind: parent.kind,
    parentNearest: parent.nearest,
    parentNearestKind: parent.nearestKind,
    parentStart: parent.start,
  }));

/**
 * A node of the tree as the walk meets it: the document node, or a node below it.
 */
type Walked<V extends XdmVocabulary> = XdmDocument<V> | XdmChild<V> | XdmDocumentChild<V>;

/**
 * A node's families as the tree nests them: its children, and how many attributes and namespace
 * declarations it holds.
 */
interface Families<V extends XdmVocabulary> {
  readonly attributes: number;
  readonly children: readonly (XdmChild<V> | XdmDocumentChild<V>)[];
  readonly namespaces: number;
}

/**
 * Write the characters a child adds to its parent's string value: a text or whitespace node's
 * own, an entity reference as `&name;`, and nothing for any other node.
 *
 * @param child - The child.
 * @returns Its characters in the string value.
 */
const charactersOf = <V extends XdmVocabulary>(
  child: XdmChild<V> | XdmDocumentChild<V>,
): string => {
  switch (child._tag) {
    case "text":
    case "ws": {
      return child.value;
    }
    case "entityRef": {
      return `&${child.name};`;
    }
    case "element":
    case "foreign-element":
    case "no-namespace-element":
    case "own-namespace-element":
    case "comment":
    case "pi":
    case "doctype": {
      return "";
    }
    default: {
      return child satisfies never;
    }
  }
};

/**
 * The first and last characters of a node's own characters, as `Node` holds them in `first` and
 * `last`.
 */
export interface Ends {
  readonly first: string;
  readonly last: string;
}

/**
 * Read the first and last code points of a node's characters, `Node.chars`, each empty when the
 * characters are, which `E1_derived` proves with `startsWith` and `endsWith`
 * (`#pantry/qti/node.ts`).
 *
 * A code point past U+FFFF is two UTF-16 code units, a surrogate pair, and XML's `Char` holds no
 * lone surrogate, so the last code point is the pair that starts two units from the end where one
 * does, and the last unit otherwise: where the characters are shorter than two units, no code point
 * starts two units from the end.
 *
 * @param chars - The node's characters.
 * @returns Its first and last code points.
 */
export const endsOf = (chars: string): Ends => {
  const head = chars.codePointAt(0);
  const pair = Option.filter(
    Option.fromUndefinedOr(chars.codePointAt(chars.length - 2)),
    (point) => point > 0xff_ff,
  );

  return {
    first: head === undefined ? "" : String.fromCodePoint(head),
    last: Option.match(pair, {
      onNone: () => chars.slice(-1),
      onSome: (point) => String.fromCodePoint(point),
    }),
  };
};

/**
 * Write a node's own characters as `Node.chars` holds them: a child's {@link charactersOf}, and
 * nothing for the document node.
 *
 * @param node - The node.
 * @returns Its characters.
 */
const ownCharactersOf = <V extends XdmVocabulary>(node: Walked<V>): string =>
  node._tag === "document" ? "" : charactersOf(node);

/**
 * List a node's families in the tree: its children, its attributes and its namespace declarations.
 *
 * @param node - The node.
 * @returns Its children family, the document node's by its place in the `document` production,
 *   and its attributes and declarations; empty for character data and the doctype.
 */
const familiesOf = <V extends XdmVocabulary>(node: Walked<V>): Families<V> => {
  switch (node._tag) {
    case "document": {
      return { attributes: 0, children: documentFamily(node), namespaces: 0 };
    }
    case "element":
    case "foreign-element":
    case "no-namespace-element":
    case "own-namespace-element": {
      return {
        attributes: node.attributes.length,
        children: node.children,
        namespaces: node.namespaces.length,
      };
    }
    case "doctype":
    case "text":
    case "ws":
    case "comment":
    case "pi":
    case "entityRef": {
      return { attributes: 0, children: [], namespaces: 0 };
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * A family the walk is folding: its owner's head, and the fold after its last child folded so
 * far, {@link emptyFold} before the first. Once the walk has folded every child, it is the family's
 * end values.
 */
interface Folding<V extends XdmVocabulary> {
  readonly owner: Head<V>;
  was: Slot;
}

/**
 * A node waiting to be folded: the node in the tree, and the family it is a child of.
 */
interface Pending<V extends XdmVocabulary> {
  readonly family: Folding<V>;
  readonly node: XdmChild<V> | XdmDocumentChild<V>;
}

/**
 * A node the walk has met: the family it owns, its families' counts, its attributes' names, its
 * string value and its own characters' ends.
 */
interface Met<V extends XdmVocabulary> {
  readonly counts: Pick<
    FoldedNode<V>,
    "attributes" | "attrs" | "children" | "first" | "last" | "namespaces" | "stringValue"
  >;
  readonly family: Folding<V>;
}

/**
 * Fold a document: its rows as {@link flatten} writes them, each node and attribute row with every
 * field the host writes and the fields PostgreSQL derives from them.
 *
 * The walk reads each node's children from the tree, where they are nested, and its row and its
 * attributes' rows from `flatten`'s, which number the nodes in the same document order and list
 * each element's attributes together, in slot order. It visits the nodes in that order with its
 * own stack, so each child is folded from its parent's head and its predecessor's fold in hand, a
 * family's end values are its last child's fold, and a tree of any depth folds without recursion,
 * in time linear in its rows.
 *
 * @param document - The tree to fold.
 * @param idOf - Draws the id of the row numbered by its argument, as `flatten` reads it: called
 *   once per node, in document order, then once per attribute.
 * @param grammar - The closed relations the folds read.
 * @returns The document's rows, nodes and attributes folded, every list in `flatten`'s order; or the
 *   refusal of the first child, in document order, its parent does not admit, or the first
 *   attribute its kind does not admit.
 */
export const fold = <V extends XdmVocabulary>(
  document: XdmDocument<V>,
  idOf: (index: number) => NodeId,
  grammar: FoldGrammar<V>,
): Result.Result<FoldedRows<V>, FoldRefusal> =>
  Result.gen(function* foldDocument() {
    const rows = flatten(document, idOf);
    const self = rows.document.node;
    const met: Met<V>[] = [];
    const attributes: FoldedAttribute<V>[] = [];
    const stack: Pending<V>[] = [];
    const visit = (node: Walked<V>, head: Head<V>): Result.Result<void, AttributeUnadmitted> =>
      Result.gen(function* visitNode() {
        const families = familiesOf(node);
        let attrs: Positions = new Set();
        for (
          let row = rows.attributes[attributes.length];
          row !== undefined && row.node === head.id;
          row = rows.attributes[attributes.length]
        ) {
          const { at, name } = row;
          const position = yield* Result.fromOption(
            grammar.attributePosition({
              governs: head.governs,
              kind: head.kind,
              name,
              version: head.version,
            }),
            () =>
              new AttributeUnadmitted({
                at,
                kind: head.kind,
                name,
                node: head.id,
                version: head.version,
              }),
          );
          const next = openClasses.some((open) => open === name) ? attrs : adding(attrs, position);
          attributes.push({
            ...row,
            attrsWas: attrs,
            derived: { attrs: next },
            document: head.document,
            governs: head.governs,
            kind: head.kind,
            version: head.version,
          });
          attrs = next;
        }

        const family: Folding<V> = { owner: head, was: emptyFold };
        met.push({
          counts: {
            attributes: BigInt(families.attributes),
            attrs,
            children: BigInt(families.children.length),
            ...endsOf(ownCharactersOf(node)),
            namespaces: BigInt(families.namespaces),
            stringValue: families.children.map(charactersOf).join(""),
          },
          family,
        });
        for (const child of families.children.toReversed()) {
          stack.push({ family, node: child });
        }
      });

    yield* visit(
      document,
      sentinelOf(grammar, {
        at: 0n,
        end: BigInt(rows.nodes.length),
        governs: none,
        id: self,
        kind: document._tag,
        parent: self,
        prefix: "",
        start: 0n,
        version: document.version,
      }),
    );
    for (const row of rows.nodes.slice(1)) {
      const next = stack.pop();
      if (next === undefined) {
        break;
      }

      const head = yield* headOf(grammar, next.family.owner, next.family.was, row);
      next.family.was = head.derived;
      yield* visit(next.node, head);
    }

    return {
      ...rows,
      attributes,
      nodes: met.map(({ counts, family }) => ({
        ...family.owner,
        ...endOf(family.was),
        ...counts,
      })),
    };
  });
