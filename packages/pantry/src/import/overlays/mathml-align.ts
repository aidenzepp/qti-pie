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
 *   in document order within its cell, nested in its cell's `MathCell` row as `leaves`, which the
 *   database numbers by the order they are nested in. An `m:mtd` is no leaf: an empty cell nested
 *   in another is its own cell with no leaf, not a leaf of the outer one, as the oracle's
 *   `contentOfCell` (`#pantry/test/oracle.ts`) reads it too.
 *
 * A direction is the `dir` an element writes where its collapsed form is `ltr` or `rtl`, and else
 * the one its parent holds, except that an `m:math` that writes neither holds `ltr` (MathML 3
 * §2.2.1 and §3.1.5.1, reading 164). A `dir` of any other form, HTML's `auto` among them, has no
 * `AlignDirection`, so it is written as none: the row's `dirLexical` is empty and the element
 * changes no direction. A cell's root takes the direction of the nearest ancestor up to its
 * `m:math` that writes `ltr` or `rtl`, else `ltr`, the host's statement (audit items 1 and 2). An
 * HTML ancestor's `dir` is not read.
 *
 * The rows are built in one pass over the nodes in document order, each parent's before its
 * children's, appending to its lists in place, so a document with one element of many children
 * costs time linear in its nodes (decision 357).
 */
import type { Addition } from "@bjornpagen/grizzle";
import { foldAt, foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folds } from "#pantry/import/fold.ts";
import { nonElements, writtenOf } from "#pantry/import/overlays/mathml-tree.ts";
import { collapse } from "#pantry/grammar/domains.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  CellLeaf,
  MathAction,
  MathAlignGroup,
  MathAlignScope,
  MathCell,
  MathDir,
} from "#pantry/qti/mathml-align.ts";
import { integerForm } from "#pantry/qti/limits.ts";

/**
 * One complete element of a cell as its cell's family nests it: without the `cell` the nesting
 * supplies, nor the `at` the family draws.
 */
export type CellLeafInsert = Omit<Addition<typeof CellLeaf>, "cell">;

/**
 * A cell's row, with its leaves nested at its count field, in document order.
 */
export type MathCellRow = Omit<Addition<typeof MathCell>, "leaves"> & {
  readonly leaves: readonly CellLeafInsert[];
};

/**
 * A document's align rows, one keyed set per relation, each keyed by its node's id.
 */
export interface MathmlAlignRows {
  readonly MathAction: ReadonlyMap<string, Addition<typeof MathAction>>;
  readonly MathAlignGroup: ReadonlyMap<string, Addition<typeof MathAlignGroup>>;
  readonly MathAlignScope: ReadonlyMap<string, Addition<typeof MathAlignScope>>;
  readonly MathCell: ReadonlyMap<string, MathCellRow>;
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
const integerSpelling = new RegExp(integerForm.source, "u");

/**
 * The attributes the alignment builder reads: `dir` and `selection`.
 */
const readAttributes: ReadonlySet<string> = new Set(["dir", "selection"]);

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
   * The document node, which every row copies as its document.
   */
  readonly document: NodeId;
  /**
   * The kind of each node.
   */
  readonly kinds: ReadonlyMap<NodeId, NodeRow<Composed>["kind"]>;
  /**
   * Each node's fold (`#pantry/import/fold.ts`): its nearest interaction (N8), its element rank
   * among its parent's element children, from 1, and its element children's count.
   */
  readonly folds: Folds;
  /**
   * The direction each element holds, the document node's `ltr` above them.
   */
  readonly owns: Map<NodeId, Direction>;
  /**
   * What each row built so far passes on, by its node.
   */
  readonly standing: Map<NodeId, Scope>;
}

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
  nearest: foldAt(reading.folds, node.id).nearest,
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
    elementChildren: foldAt(reading.folds, node.id).elementChildren,
    elements: foldAt(reading.folds, node.id).elements,
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
  const { elements } = foldAt(reading.folds, node.id);
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
      elementChildren: foldAt(reading.folds, node.id).elementChildren,
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
 * Group the complete elements of the cells by their cell, each cell's in document order.
 *
 * @param reading - The document's reading.
 * @param leafNodes - The complete elements, in document order.
 * @param scopes - Each element's scope row, by node id.
 * @param groupsOf - Each cell's count of open groups.
 * @returns Each cell's leaves, by the cell's node id.
 */
const leavesByCell = (
  reading: Reading,
  leafNodes: readonly NodeRow<Composed>[],
  scopes: ReadonlyMap<string, Addition<typeof MathAlignScope>>,
  groupsOf: ReadonlyMap<NodeId, bigint>,
): ReadonlyMap<string, readonly CellLeafInsert[]> => {
  const nested = new Map<string, CellLeafInsert[]>();
  for (const node of leafNodes) {
    const cell = scopes.get(node.id)?.cell ?? node.id;
    const own = nested.get(cell) ?? [];
    own.push({
      ...placed(reading, node),
      groups: groupsOf.get(cell) ?? 0n,
      kind: node.kind,
    });
    nested.set(cell, own);
  }

  return nested;
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
    attributes: writtenOf(flat.attributes, readAttributes),
    document: flat.document.node,
    folds: foldOf(flat.nodes, ids.context ?? ownContext(flat.document.node)),
    kinds: new Map(flat.nodes.map((node) => [node.id, node.kind] as const)),
    owns: new Map<NodeId, Direction>([[flat.document.node, "ltr"]]),
    standing: new Map<NodeId, Scope>(),
  };
  const actions = new Map<string, Addition<typeof MathAction>>();
  const cells = new Map<string, MathCellRow>();
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
        (node.kind === "m:math" ? "ltr" : reading.owns.get(node.parent)) ??
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
      cells.set(node.id, { leaves: [], node: node.id });
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

  const nested = leavesByCell(reading, leafNodes, scopes, groupsOf);
  for (const [node, cell] of cells) {
    cells.set(node, { ...cell, leaves: nested.get(node) ?? [] });
  }

  return {
    MathAction: actions,
    MathAlignGroup: groups,
    MathAlignScope: scopes,
    MathCell: cells,
    MathDir: dirRowsOf(reading.attributes),
  };
};
