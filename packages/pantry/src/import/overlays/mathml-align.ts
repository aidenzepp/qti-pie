/**
 * The MathML align overlay's rows (spec reading 2, §C's `rowsOf`): from one document's XDM tree and
 * the ids its nodes are written under, the rows of every relation `#pantry/qti/mathml-align.ts`
 * declares.
 *
 * - **`MathAction`**, one row for every `m:maction`: its element rank and element count, the lexical
 *   form of its `selection` (empty where it writes none), that form collapsed, and the integer it
 *   reads as: 1 where none is written, the value where the collapsed form is `xs:integer`'s within
 *   the signed 64-bit range, 0 for any other form and for a negative integer, which no child
 *   numbers (so a non-integer or negative selection is refused under "MathML maction selection",
 *   where the oracle skips it: a difference of the law's name only, the document is refused either
 *   way).
 * - **`MathCell`**, one row for every `m:mtd`; the counts and the greatest start are drawn by the
 *   database from the group and leaf families.
 * - **`MathAlignScope`**, one row for every `m:mtd`, the root of its cell's scope (open, its own
 *   cell), and for every element below a cell, in the cell nearest above it. An element below a
 *   cell takes its cell, parent kind, `received` state and `inherited` direction from its parent's
 *   row, its `chosen` index from a parent `maction`, and derives the rest as the schema states: its
 *   state (unjudged under an `maction` but at the selected child, else what it received), its
 *   direction and what it passes on. An element outside every cell has no row.
 * - **`MathAlignGroup`**, one row for every `m:maligngroup` whose state is `open`.
 * - **`MathDir`**, one row for every element that writes a `dir`, in a cell or not, its lexical form
 *   as written (not `dirLexical`'s filtered form: `auto` has a row, while its scope's `dirLexical`
 *   is empty).
 * - **`CellLeaf`**, one row for every complete element of a cell, an element with no element child,
 *   in document order within its cell, which the database numbers by the order the rows are
 *   inserted in. An `m:mtd` is no leaf: an empty cell nested in another is its own cell with no
 *   leaf, not a leaf of the outer one, though the oracle counts it as one (`contentOfCell` in
 *   `#pantry/test/oracle.ts`; the phase-6 audit list's third item, left as the oracle has it).
 *
 * A direction is the `dir` an element writes where its collapsed form is `ltr` or `rtl`, and else
 * the one its parent holds, `ltr` above every element (MathML 3 §3.1.5.1). A `dir` of any other
 * form, HTML's `auto` among them, has no `AlignDirection`, so it is written as none: the row's
 * `dirLexical` is empty and the element changes no direction, and a cell's root takes the direction
 * of the nearest ancestor that writes one of the two, the host's statement (audit items 1 and 2).
 *
 * The rows are built in one pass over the nodes in document order, each parent's before its
 * children's, appending to its lists in place, so a document with one element of many children
 * costs time linear in its nodes (decision 357).
 */
import type { Addition } from "@bjornpagen/grizzle";
import { interactionKinds, nonElementKinds } from "#pantry/grammar/install.ts";
import { collapse } from "#pantry/import/overlays/metadata.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  CellLeaf,
  MathAction,
  MathAlignGroup,
  MathAlignScope,
  MathCell,
  MathDir,
} from "#pantry/qti/mathml-align.ts";
import { integerForm } from "#pantry/qti/operators.ts";

/**
 * A document's align rows, one keyed set per relation, each keyed by its node's id.
 */
export interface MathmlAlignRows {
  readonly CellLeaf: ReadonlyMap<string, Addition<typeof CellLeaf>>;
  readonly MathAction: ReadonlyMap<string, Addition<typeof MathAction>>;
  readonly MathAlignGroup: ReadonlyMap<string, Addition<typeof MathAlignGroup>>;
  readonly MathAlignScope: ReadonlyMap<string, Addition<typeof MathAlignScope>>;
  readonly MathCell: ReadonlyMap<string, Addition<typeof MathCell>>;
  readonly MathDir: ReadonlyMap<string, Addition<typeof MathDir>>;
}

/**
 * A direction a `dir` takes.
 */
type Direction = "ltr" | "rtl";

/**
 * Where an element stands in its cell.
 */
type State = "closed" | "open" | "unjudged";

/**
 * What a scope row passes to the rows of its children.
 */
interface Scope {
  /**
   * The nearest `m:mtd`.
   */
  readonly cell: NodeId;
  /**
   * The direction the row writes or else inherited.
   */
  readonly own: Direction;
  /**
   * The state its children receive.
   */
  readonly passes: State;
  /**
   * The selection of an `m:maction`, 0 for any other element.
   */
  readonly selection: bigint;
}

/**
 * The kinds that are no element.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The kinds that let an alignment group through to its cell whatever their direction
 * (MathML 3 §3.5.5.2): the cell itself, and an `maction`, whose selected child is the one judged.
 */
const letKinds: ReadonlySet<string> = new Set([
  "m:maction",
  "m:mfenced",
  "m:mphantom",
  "m:semantics",
  "m:mtd",
]);

/**
 * The kinds that let an alignment group through where they change no direction.
 */
const directedKinds: ReadonlySet<string> = new Set(["m:mrow", "m:mstyle"]);

/**
 * The lexical space a `selection` is read as an integer in, `xs:integer`'s within the signed 64-bit
 * range.
 */
const integerSpelling = new RegExp(integerForm, "u");

/**
 * Read the `dir` and `selection` attributes each element writes, the first of each by name.
 *
 * @param attributes - A document's attribute rows.
 * @returns Each element's lexical forms, by its id.
 */
const writtenOf = (
  attributes: FlatRows<Composed>["attributes"],
): ReadonlyMap<NodeId, ReadonlyMap<string, string>> => {
  const written = new Map<NodeId, Map<string, string>>();
  for (const { lexical, name, node } of attributes) {
    if (name === "dir" || name === "selection") {
      const values = written.get(node) ?? new Map<string, string>();
      if (!values.has(name)) {
        values.set(name, lexical);
      }

      written.set(node, values);
    }
  }

  return written;
};

/**
 * Read a `dir`'s lexical form as a direction.
 *
 * @param lexical - The attribute's lexical form, none where the element writes none.
 * @returns The direction it spells, none for any other form.
 */
const directionOf = (lexical: string | undefined): Direction | undefined => {
  const text = lexical === undefined ? undefined : collapse(lexical);

  return text === "ltr" || text === "rtl" ? text : undefined;
};

/**
 * Keep a `dir`'s lexical form where it spells a direction, and drop it where it spells none.
 *
 * @param lexical - The attribute's lexical form, none where the element writes none.
 * @returns The form, empty where it spells no direction.
 */
const dirLexicalOf = (lexical: string | undefined): string =>
  directionOf(lexical) === undefined ? "" : (lexical ?? "");

/**
 * Read a `selection`'s lexical form as the integer `MathAction.selection` holds.
 *
 * @param lexical - The attribute's lexical form, none where the action writes none.
 * @returns 1 where none is written, the integer where the collapsed form is one and is not negative
 *   (the column is a `natural`), 0 otherwise.
 */
const selectionOf = (lexical: string | undefined): bigint => {
  if (lexical === undefined) {
    return 1n;
  }

  const text = collapse(lexical);

  if (!integerSpelling.test(text)) {
    return 0n;
  }

  const value = BigInt(text);

  return value < 0n ? 0n : value;
};

/**
 * What a parent's row hands a child's: the state the child stands in, as the schema derives it.
 *
 * @param received - The state the parent passes.
 * @param parentIsAction - Whether the parent is an `m:maction`.
 * @param rank - The child's element rank.
 * @param chosen - The parent action's selection.
 * @returns The child's state.
 */
const stateOf = (received: State, parentIsAction: boolean, rank: bigint, chosen: bigint): State =>
  parentIsAction && rank !== chosen ? "unjudged" : received;

/**
 * What an element of a state passes to its children (MathML 3 §3.5.5.2).
 *
 * @param state - The element's state.
 * @param kind - Its kind.
 * @param changesDirection - Whether its own direction differs from the one it inherited.
 * @returns The state its children receive.
 */
const passesOf = (state: State, kind: string, changesDirection: boolean): State => {
  if (state !== "open") {
    return state;
  }

  return letKinds.has(kind) || (directedKinds.has(kind) && !changesDirection) ? "open" : "closed";
};

/**
 * What the tree's folds give each node, and the attributes its element writes: everything a row
 * builder reads of a document.
 */
interface Reading {
  /**
   * What each node's element writes of `dir` and `selection`.
   */
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  /**
   * The count of each node's element children.
   */
  readonly counts: ReadonlyMap<NodeId, bigint>;
  /**
   * The document node, which every row copies as its document.
   */
  readonly document: NodeId;
  /**
   * The kind of each node.
   */
  readonly kinds: ReadonlyMap<NodeId, NodeRow<Composed>["kind"]>;
  /**
   * Each node's nearest interaction (N8).
   */
  readonly nearest: ReadonlyMap<NodeId, NodeId>;
  /**
   * The direction each element holds, the document node's `ltr` above them.
   */
  readonly owns: Map<NodeId, Direction>;
  /**
   * Each element's rank among its parent's element children, from 1.
   */
  readonly ranks: ReadonlyMap<NodeId, bigint>;
  /**
   * What each row built so far passes on, by its node.
   */
  readonly standing: Map<NodeId, Scope>;
}

/**
 * Compute what the tree's folds give each node, as `Node`'s laws hold it: its nearest interaction
 * (N8), its element rank among its siblings and its element count.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's nearest interaction, its context's; itself where none is
 *   given.
 * @returns The kinds, nearest interactions, ranks and counts, by node id.
 */
const foldsOf = (
  nodes: readonly NodeRow<Composed>[],
  rootNearest: NodeId | undefined,
): Pick<Reading, "counts" | "kinds" | "nearest" | "ranks"> => {
  const kinds = new Map<NodeId, NodeRow<Composed>["kind"]>();
  const nearest = new Map<NodeId, NodeId>();
  const ranks = new Map<NodeId, bigint>();
  const counts = new Map<NodeId, bigint>();
  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    nearest.set(
      node.id,
      interactions.has(kinds.get(node.parent) ?? "")
        ? node.parent
        : (nearest.get(node.parent) ?? node.parent),
    );
    if (!nonElements.has(node.kind)) {
      const rank = (counts.get(node.parent) ?? 0n) + 1n;
      counts.set(node.parent, rank);
      ranks.set(node.id, rank);
    }
  }

  return { counts, kinds, nearest, ranks };
};

/**
 * The selection an element passes to its children: an `m:maction`'s, 0 for any other element.
 *
 * @param kind - The element's kind.
 * @param values - What it writes of `dir` and `selection`.
 * @returns The selection.
 */
const selectionHeld = (kind: string, values: ReadonlyMap<string, string> | undefined): bigint =>
  kind === "m:maction" ? selectionOf(values?.get("selection")) : 0n;

/**
 * Write a node's `nodeRef` tuple as an overlay row copies it.
 *
 * @param reading - The document.
 * @param node - The node.
 * @returns Its `document`, `nearest`, `node`, `parent`, `start` and `version`.
 */
const placed = (reading: Reading, node: NodeRow<Composed>) => ({
  document: reading.document,
  nearest: reading.nearest.get(node.id) ?? reading.document,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * Write an `m:maction`'s row.
 *
 * @param reading - The document.
 * @param node - The `m:maction`.
 * @returns Its row.
 */
const actionOf = (reading: Reading, node: NodeRow<Composed>): Addition<typeof MathAction> => {
  const lexical = reading.attributes.get(node.id)?.get("selection");

  return {
    elementChildren: reading.counts.get(node.id) ?? 0n,
    elements: reading.ranks.get(node.id) ?? 1n,
    node: node.id,
    selection: selectionOf(lexical),
    selectionLexical: lexical ?? "",
    selectionText: collapse(lexical ?? ""),
    selectionWritten: lexical !== undefined,
  };
};

/**
 * Write an element's scope row and what it passes to its children, from the row its parent passed
 * on.
 *
 * @param reading - The document.
 * @param node - The element.
 * @returns The row and what it passes; none for an element no cell holds and no cell itself.
 */
const scopeOf = (
  reading: Reading,
  node: NodeRow<Composed>,
): { readonly row: Addition<typeof MathAlignScope>; readonly scope: Scope } | undefined => {
  const above = reading.standing.get(node.parent);
  const isCell = node.kind === "m:mtd";
  if (!isCell && above === undefined) {
    return undefined;
  }

  const values = reading.attributes.get(node.id);
  const inherited = reading.owns.get(node.parent) ?? "ltr";
  const own = reading.owns.get(node.id) ?? inherited;
  const parentKind = reading.kinds.get(node.parent) ?? node.kind;
  const underAction = parentKind === "m:maction";
  const elements = reading.ranks.get(node.id) ?? 1n;
  const chosen = underAction ? (above?.selection ?? 0n) : 0n;
  const received: State = above?.passes ?? "open";
  const state = isCell ? "open" : stateOf(received, underAction, elements, chosen);
  const passes = passesOf(state, node.kind, own !== inherited);
  const cell = isCell ? node.id : (above?.cell ?? node.id);

  return {
    row: {
      ...placed(reading, node),
      cell,
      chosen,
      dirLexical: dirLexicalOf(values?.get("dir")),
      elementChildren: reading.counts.get(node.id) ?? 0n,
      elements,
      inherited,
      kind: node.kind,
      own,
      parentKind,
      passes,
      received,
      state,
    },
    scope: {
      cell,
      own,
      passes,
      selection: selectionHeld(node.kind, values),
    },
  };
};

/**
 * The {@link MathDir} rows: one for every element that writes a `dir`, its lexical form as written.
 *
 * @param attributes - Each element's written `dir` and `selection`, by its id.
 * @returns The rows, keyed by the element's id.
 */
const dirRowsOf = (
  attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>,
): ReadonlyMap<string, Addition<typeof MathDir>> => {
  const dirs = new Map<string, Addition<typeof MathDir>>();
  for (const [node, values] of attributes) {
    const lexical = values.get("dir");
    if (lexical !== undefined) {
      dirs.set(node, { lexical, node });
    }
  }

  return dirs;
};

/**
 * The align rows of one document.
 *
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under, and its context where it is judged in one.
 * @returns The rows of every relation the align module declares.
 */
export const rowsOf = (
  tree: XdmDocument<Composed>,
  ids: Pick<NodeIds, "idOf"> & Partial<Pick<NodeIds, "context">>,
): MathmlAlignRows => {
  const flat = flatten(tree, ids.idOf);
  const reading: Reading = {
    attributes: writtenOf(flat.attributes),
    document: flat.document.node,
    owns: new Map<NodeId, Direction>([[flat.document.node, "ltr"]]),
    standing: new Map<NodeId, Scope>(),
    ...foldsOf(flat.nodes, ids.context?.nearest),
  };
  const actions = new Map<string, Addition<typeof MathAction>>();
  const cells = new Map<string, Addition<typeof MathCell>>();
  const scopes = new Map<string, Addition<typeof MathAlignScope>>();
  const groups = new Map<string, Addition<typeof MathAlignGroup>>();
  const groupsOf = new Map<NodeId, bigint>();
  const leafNodes: NodeRow<Composed>[] = [];
  for (const node of flat.nodes) {
    if (node.parent === node.id || nonElements.has(node.kind)) {
      continue;
    }

    reading.owns.set(
      node.id,
      directionOf(reading.attributes.get(node.id)?.get("dir")) ??
        reading.owns.get(node.parent) ??
        "ltr",
    );
    if (node.kind === "m:maction") {
      actions.set(node.id, actionOf(reading, node));
    }

    const built = scopeOf(reading, node);
    if (built === undefined) {
      continue;
    }

    const { row, scope } = built;
    reading.standing.set(node.id, scope);
    scopes.set(node.id, row);
    if (node.kind === "m:mtd") {
      cells.set(node.id, { node: node.id });
    } else {
      if (node.kind === "m:maligngroup" && row.state === "open") {
        groups.set(node.id, { cell: row.cell, node: node.id });
        groupsOf.set(row.cell, (groupsOf.get(row.cell) ?? 0n) + 1n);
      }

      if (row.elementChildren === 0n) {
        leafNodes.push(node);
      }
    }
  }

  const leaves = new Map<string, Addition<typeof CellLeaf>>();
  for (const node of leafNodes) {
    const cell = scopes.get(node.id)?.cell ?? node.id;
    leaves.set(node.id, {
      ...placed(reading, node),
      cell,
      groups: groupsOf.get(cell) ?? 0n,
      kind: node.kind,
    });
  }

  return {
    CellLeaf: leaves,
    MathAction: actions,
    MathAlignGroup: groups,
    MathAlignScope: scopes,
    MathCell: cells,
    MathDir: dirRowsOf(reading.attributes),
  };
};
