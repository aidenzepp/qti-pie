/**
 * The MathML align laws (spec reading 2, MathML 3 validity): the laws "MathML maction selection",
 * "MathML align placement" and "MathML align first", stated over `m:maction` and the table cells
 * (`m:mtd`) whose alignment groups (`m:maligngroup`) MathML 3 §3.5.5 places.
 *
 * An `maction` shows one child, the one its `selection` numbers (MathML 3 §3.7.1.1, "If the value
 * specified is out of range, it is an error"). In a table cell, an alignment group stands directly
 * or inside an `mrow` or `mstyle` that changes no direction, `mphantom`, `mfenced`, the selected
 * child of an `maction`, or `semantics` (§3.5.5.2), and a cell with a group that stands there
 * starts with one: its first complete element, the first element with no element child, is a group.
 * Only an `maction`'s selected child is checked (§3.5.5.9), a group outside every cell is ignored,
 * and a change of direction is a `dir` other than the one the element inherits (operator decision
 * 321). The importer refused none of it before: only the law oracle judged it.
 *
 * - **{@link MathAction}**, one row per `m:maction`, keyed by its node: the node's `elements` and
 *   `elementChildren` (C18), and its `selection`, 1 where the element writes none, with the lexical
 *   form of the attribute that gave it. `MathML_maction_selection` is the check over it: the action
 *   has a child and its selection is at least 1 and at most their number.
 * - **{@link MathAlignScope}**, one row per element inside an `m:mtd`, keyed by its node and read up
 *   the tree as `#pantry/qti/identity.ts` reads {@link SsmlScope} a fragment: its `cell`, the
 *   nearest `m:mtd` (the cell itself for an `m:mtd`), and its `state` there, {@link AlignState}:
 *
 *   - `open` stands in the cell: the cell itself; a child of an open `mrow` or `mstyle` that changes no
 *     direction, of an open `mphantom`, `mfenced` or `semantics`, or the selected child of an open
 *     `maction`;
 *   - `unjudged` is not checked: any child of an `maction` but the selected one, and whatever stands
 *     below it;
 *   - `closed` is any other. Each row is tied to its parent's by a containment, so the state is proved
 *     step by step: what its parent `passes` to its children is copied as `received`, and a row's own
 *     `passes` and `state` follow from its kind, its direction and the state it received. The
 *     direction a row `inherited` is its parent's `own`, the `dir` the parent writes or else the one
 *     it inherited. An `m:mtd` is the root of its own scope, its state `open`; its direction is the
 *     host's, since no row stands above a cell. `MathML_align_placement` is the check over it: an
 *     `m:maligngroup`'s state is not `closed`.
 * - **{@link MathAlignGroup}**, one row per `m:maligngroup` whose state is `open`, with its `cell`,
 *   counted by {@link MathCell}`.groups`.
 * - **{@link MathCell}**, one row per `m:mtd`, keyed by its node: its `groups`, the count of its
 *   {@link MathAlignGroup} rows, its `leaves`, the count of its {@link CellLeaf} rows, and
 *   `lastStart`, the greatest start among them.
 * - **{@link CellLeaf}**, one row per complete element of a cell, keyed by its cell and its slot, the
 *   slots in document order: its `start` exceeds its predecessor's, so slot 0 is the cell's first
 *   complete element. It copies its cell's `groups`, and `MathML_align_first` is the check over it:
 *   a leaf in slot 0 is a group where its cell holds a group that stands.
 *
 * A complete element is an element with no element child, an `m:mtd` apart, so an empty cell nested
 * in another is no leaf of the outer one; the oracle counts it (`#pantry/test/oracle.ts`
 * `contentOfCell`). The rows of {@link MathAlignScope} are the host's: a scope row no document
 * needs is not refused, and an element inside a cell with no row there escapes the laws, as the
 * other overlays' absent rows do (the phase-6 audit list). The same holds of a written `dir` the
 * row omits.
 *
 * Every statement but the three checks is a restatement of the tree, "E1 derived"; the checks are
 * named by their laws, as `#pantry/qti/expressions.ts` names `Arity`.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter3.html#presm.maction | MathML 3 §3.7.1, maction}
 * @see {@link https://www.w3.org/TR/MathML3/chapter3.html#presm.malign.group | MathML 3 §3.5.5.2, maligngroup}
 */
import {
  accumulated,
  check,
  closed,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  mirrors,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { integerForm, keyText } from "#pantry/qti/limits.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";

/**
 * The `AlignState` roster: where an element stands in its table cell, `closed` where an element
 * between it and the cell stops an alignment group, `open` where one lets it through, and
 * `unjudged` where an `maction` shows another child (MathML 3 §3.5.5.2 and §3.5.5.9).
 */
export const AlignState = closed("AlignState", ["closed", "open", "unjudged"]);

/**
 * The `AlignDirection` roster: the directions a `dir` takes (MathML 3 §3.1.5.1).
 */
export const AlignDirection = closed("AlignDirection", ["ltr", "rtl"]);

/**
 * What spells each {@link AlignDirection} a row's `own` direction is, as a pattern over the
 * attribute's raw value: the direction's name, in XML whitespace (MathML 3 §2.1.7). A literal for
 * each handle, since a pattern in a check is a literal source; the test holds each to the name its
 * handle spells.
 */
export const directionSpellings = [
  ["ltr", Compute.pattern("^[ \\t\\n\\r]*ltr[ \\t\\n\\r]*$")],
  ["rtl", Compute.pattern("^[ \\t\\n\\r]*rtl[ \\t\\n\\r]*$")],
] as const;

/**
 * The kinds that let an alignment group through to its cell whatever their direction
 * (MathML 3 §3.5.5.2): an `m:mtd` is the cell itself, and an `maction` lets its selected child
 * through.
 */
const letKinds = ["m:maction", "m:mfenced", "m:mphantom", "m:semantics", "m:mtd"] as const;

/**
 * The kinds that let an alignment group through where they change no direction (MathML 3 §3.5.5.2).
 */
const directedKinds = ["m:mrow", "m:mstyle"] as const;

/**
 * One `m:maction`, keyed by its node.
 *
 * - **the host's:** `elements` and `elementChildren`, the node's own element rank and element count,
 *   which `nodeCounts` proves; `selectionLexical` and `selectionWritten`, the lexical form of the
 *   `selection` attribute and whether the node writes one, which the attribute proves; and
 *   `selectionText`, the form collapsed, and `selection`, its integer (1 where none is written, 0
 *   where it is no integer or a negative one), which `E1_derived` proves.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const MathAction = relation.generated(
  "MathAction",
  {
    elementChildren: natural,
    elements: natural,
    node: uuid,
    selection: natural,
    selectionLexical: keyText,
    selectionWritten: pg.boolean,
  },
  ["node"],
  (m) => ({
    selectionText: generated(keyText, Compute.cast(Compute.collapse(m.selectionLexical), keyText)),
  }),
);

/**
 * One element inside a table cell, keyed by its node, as {@link AlignState} defines.
 *
 * - **the host's:** the `nodeRef` tuple (`node`, `document`, `kind`, `start`, `nearest`, `version`,
 *   `parent`) and the node's `elements` and `elementChildren`, proved by containment; and
 *   `dirLexical`, the lexical form of its `dir`, empty where it writes none;
 * - **copied from the parent's row:** `cell`, `parentKind`, `received` (the parent's `passes`) and
 *   `inherited` (the parent's `own`); and `chosen`, the `selection` of a parent `maction`, 0 under
 *   any other parent. An `m:mtd`'s row copies none of them;
 * - **derived by `E1_derived`:** `state`, `own` and `passes`.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const MathAlignScope = relation(
  "MathAlignScope",
  {
    cell: uuid,
    chosen: natural,
    dirLexical: keyText,
    document: uuid,
    elementChildren: natural,
    elements: natural,
    inherited: closedId(AlignDirection),
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    own: closedId(AlignDirection),
    parent: uuid,
    parentKind: closedId(NodeKind),
    passes: closedId(AlignState),
    received: closedId(AlignState),
    start: natural,
    state: closedId(AlignState),
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One `m:maligngroup` whose state is `open`, keyed by its node, with the `cell` it stands in.
 */
export const MathAlignGroup = relation("MathAlignGroup", { cell: uuid, node: uuid }, ["node"]);

/**
 * One `dir` attribute of any element, in a cell or not, keyed by its node: its lexical form as
 * written, copied so that a law can compare it in a key. A value over `keyText`'s bound is refused
 * under "Key text bound", a stated limit, as the `InteractionAttribute` copies are
 * (`#pantry/qti/interactions.ts`); the schemas enumerate `dir`, so no valid document is refused.
 */
export const MathDir = relation("MathDir", { lexical: keyText, node: uuid }, ["node"]);

/**
 * One `m:mtd`, keyed by its node: `groups`, the count of its {@link MathAlignGroup} rows, `leaves`,
 * the count of its {@link CellLeaf} rows, both drawn, and `lastStart`, the greatest `start` among
 * its leaves, which the fold of their starts proves (0 where it has none).
 */
export const MathCell = relation(
  "MathCell",
  {
    groups: drawn(natural),
    lastStart: accumulated(natural, 0n),
    leaves: drawn(natural),
    node: uuid,
  },
  ["node"],
);

/**
 * One complete element of a table cell, in document order: keyed by its `cell` and its slot `at`.
 *
 * - **the host's:** the `nodeRef` tuple, proved by containment, and `cell` and `groups`, its cell's
 *   and its cell's group count;
 * - **drawn:** `at`;
 * - **accumulated:** `startWas` and `startAfter`, the greatest start of the leaves before it and
 *   through it.
 */
export const CellLeaf = relation(
  "CellLeaf",
  {
    at: drawn(natural),
    cell: uuid,
    document: uuid,
    groups: natural,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    startAfter: accumulated(natural, 0n),
    startWas: accumulated(natural, 0n),
    version: closedId(SchemaVersion),
  },
  ["cell", "at"],
);

/**
 * The relations and rosters the align laws declare, each under its own name, as
 * `#pantry/qti/schema.ts` composes them.
 */
export const alignRelations = {
  AlignDirection,
  AlignState,
  CellLeaf,
  MathAction,
  MathAlignGroup,
  MathAlignScope,
  MathCell,
  MathDir,
};

/**
 * The `m:maction` nodes, each of which holds a {@link MathAction} row.
 */
const actions = select(Node, (n) => n.eq(n.kind, "m:maction"));

/**
 * The `m:mtd` nodes, each of which holds a {@link MathCell} row.
 */
const cells = select(Node, (n) => n.eq(n.kind, "m:mtd"));

/**
 * The `selection` attributes of an `m:maction`, the source of {@link MathAction}'s lexical form.
 */
const selectionAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "m:maction"), a.eq(a.name, "selection")),
);

/**
 * The `dir` attributes of an element a {@link MathAlignScope} row may name.
 */
const dirAttributes = select(Attribute, (a) => a.eq(a.name, "dir"));

/**
 * The {@link MathAction} rows of an action that writes its `selection`.
 */
const writtenSelections = select(MathAction, (m) => m.eq(m.selectionWritten, true));

/**
 * The {@link MathAlignScope} rows of an `m:mtd`, each the root of its cell's scope.
 */
const cellScopes = select(MathAlignScope, (s) => s.eq(s.kind, "m:mtd"));

/**
 * The {@link MathAlignScope} rows below a cell's root: every row but an `m:mtd`'s, each tied to its
 * parent's row.
 */
const innerScopes = select(MathAlignScope, (s) => s.ne(s.kind, "m:mtd"));

/**
 * The {@link MathAlignScope} rows below an `m:maction`, each of which copies that action's
 * selection.
 */
const actionChildren = select(MathAlignScope, (s) =>
  s.and(s.ne(s.kind, "m:mtd"), s.eq(s.parentKind, "m:maction")),
);

/**
 * The {@link MathAlignScope} rows of an `m:maligngroup` whose state is `open`, each of which holds a
 * {@link MathAlignGroup} row.
 */
const openGroups = select(MathAlignScope, (s) =>
  s.and(s.eq(s.kind, "m:maligngroup"), s.eq(s.state, "open")),
);

/**
 * The {@link MathAlignScope} rows of a complete element of a cell: no element child, and no
 * `m:mtd`. Each holds a {@link CellLeaf} row.
 */
const leafScopes = select(MathAlignScope, (s) =>
  s.and(s.eq(s.elementChildren, 0n), s.ne(s.kind, "m:mtd")),
);

/**
 * The family of a cell's leaves in document order, slot `at` of `MathCell.leaves`.
 */
export const leafFamily = ordered(on(CellLeaf, "cell", "at"), fin(MathCell, "leaves"));

/**
 * The family of a cell's open alignment groups, counted by `MathCell.groups`.
 */
export const groupFamily = counted(on(MathAlignGroup, "cell"), fin(MathCell, "groups"));

/**
 * The fold of a cell's leaves' starts, the greatest through each leaf (`startAfter`) and before it
 * (`startWas`), ending at `MathCell.lastStart`. With `E1_derived`'s `start > startWas`, the slots
 * are in document order, since a pre-order interval starts after every one that came before it.
 */
export const leafStartFold = fold(
  leafFamily,
  Monoid.max,
  on(CellLeaf, "cell", "start", "startWas", "startAfter"),
  on(MathCell, "node", "lastStart"),
);

/**
 * Every statement over the module's relations, each `check` named by its law:
 *
 * - **the action:** one row for each `m:maction` and no other node (both ways), its counts proved by
 *   `nodeCounts`, its `selection` the attribute's integer, 1 where unwritten, and
 *   `MathML_maction_selection`: it has a child and its selection lies from 1 to their number;
 * - **the scope:** each row's `nodeRef` tuple and counts proved; a cell's root row for each `m:mtd`
 *   and no other (both ways), open, its own cell; every other row's `cell`, `parentKind`,
 *   `received` and `inherited` copied from its parent's `cell`, `kind`, `passes` and `own`, its
 *   `chosen` its parent action's selection under an `maction` and 0 elsewhere, its `state` what it
 *   received but unjudged under an `maction` where its rank is not the chosen one, its `own` the
 *   `dir` it writes or else the one it inherited, and its `passes` closed once it stands where no
 *   group passes through it, and `MathML_align_placement`: an `m:maligngroup`'s state is not
 *   `closed`;
 * - **the directions:** a {@link MathDir} row for each `dir` attribute and no other (both ways), its
 *   lexical form the attribute's, and a scope's non-empty `dirLexical` held to its element's row;
 * - **the groups:** a {@link MathAlignGroup} row for each open group and no other (both ways), and
 *   the family;
 * - **the cells:** one row for each `m:mtd` and no other (both ways), and the groups' family;
 * - **the leaves:** a {@link CellLeaf} row for each complete element of a cell and no other (both
 *   ways), its cell the scope's, its `groups` its cell's, the ordered family and the fold of the
 *   starts, and `MathML_align_first`: in slot 0, a leaf is a group where its cell holds one that
 *   stands.
 */
export const alignLaws = [
  mirrors(on(MathAction, "node"), on(actions, "id")),
  contained(on(MathAction, "node", "elements", "elementChildren"), nodeCounts),
  key(on(selectionAttributes, "node")),
  contained(
    on(selectionAttributes, "node", "lexical"),
    on(writtenSelections, "node", "selectionLexical"),
  ),
  contained(on(writtenSelections, "node"), on(selectionAttributes, "node")),
  check("E1_derived", MathAction, (m) =>
    m.and(
      m.or(
        m.and(m.eq(m.selectionWritten, false), m.eq(m.selectionLexical, ""), m.eq(m.selection, 1n)),
        m.and(
          m.eq(m.selectionWritten, true),
          m.or(
            m.and(m.eq(Compute.startsWith(m.selectionText, "-"), true), m.eq(m.selection, 0n)),
            m.and(
              m.eq(Compute.startsWith(m.selectionText, "-"), false),
              m.eq(
                Compute.base(m.selection),
                Compute.when(
                  Compute.matches(m.selectionText, integerForm),
                  (text) => Compute.cast(text, pg.bigint),
                  0n,
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
  check("MathML_maction_selection", MathAction, (m) =>
    m.and(m.gt(m.elementChildren, 0n), m.ge(m.selection, 1n), m.le(m.selection, m.elementChildren)),
  ),

  contained(
    on(MathAlignScope, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(MathAlignScope, "node", "elements", "elementChildren"), nodeCounts),
  key(on(dirAttributes, "node")),
  contained(on(dirAttributes, "node", "lexical"), on(MathDir, "node", "lexical")),
  contained(on(MathDir, "node"), on(dirAttributes, "node")),
  contained(
    on(
      select(MathAlignScope, (s) => s.ne(s.dirLexical, "")),
      "node",
      "dirLexical",
    ),
    on(MathDir, "node", "lexical"),
  ),
  contained(on(cells, "id"), on(cellScopes, "node")),
  contained(on(cellScopes, "node"), on(cells, "id")),
  contained(
    on(innerScopes, "parent", "cell", "received", "parentKind", "inherited"),
    on(MathAlignScope, "node", "cell", "passes", "kind", "own"),
  ),
  contained(on(actionChildren, "parent", "chosen"), on(MathAction, "node", "selection")),
  check("E1_derived", MathAlignScope, (s) =>
    s.and(
      s.or(
        s.and(s.eq(s.kind, "m:mtd"), s.eq(s.cell, s.node), s.eq(s.state, "open")),
        s.and(
          s.ne(s.kind, "m:mtd"),
          s.ne(s.cell, s.node),
          s.or(s.eq(s.parentKind, "m:maction"), s.eq(s.chosen, 0n)),
          s.or(
            s.and(
              s.eq(s.parentKind, "m:maction"),
              s.ne(s.elements, s.chosen),
              s.eq(s.state, "unjudged"),
            ),
            s.and(
              s.or(s.ne(s.parentKind, "m:maction"), s.eq(s.elements, s.chosen)),
              s.eq(s.state, s.received),
            ),
          ),
        ),
      ),
      s.or(
        s.and(s.eq(s.dirLexical, ""), s.eq(s.own, s.inherited)),
        s.and(
          s.ne(s.dirLexical, ""),
          s.or(
            ...directionSpellings.map(([direction, spelling]) =>
              s.and(s.eq(s.own, direction), Compute.matches(s.dirLexical, spelling)),
            ),
          ),
        ),
      ),
      s.or(
        s.and(s.eq(s.state, "unjudged"), s.eq(s.passes, "unjudged")),
        s.and(s.eq(s.state, "closed"), s.eq(s.passes, "closed")),
        s.and(
          s.eq(s.state, "open"),
          s.eq(s.passes, "open"),
          s.or(
            s.in(s.kind, letKinds),
            s.and(s.in(s.kind, directedKinds), s.eq(s.own, s.inherited)),
          ),
        ),
        s.and(
          s.eq(s.state, "open"),
          s.eq(s.passes, "closed"),
          s.not(s.in(s.kind, letKinds)),
          s.or(s.not(s.in(s.kind, directedKinds)), s.ne(s.own, s.inherited)),
        ),
      ),
    ),
  ),
  check("MathML_align_placement", MathAlignScope, (s) =>
    s.or(s.ne(s.kind, "m:maligngroup"), s.ne(s.state, "closed")),
  ),

  contained(on(MathAlignGroup, "node", "cell"), on(MathAlignScope, "node", "cell")),
  contained(on(MathAlignGroup, "node"), on(openGroups, "node")),
  contained(on(openGroups, "node", "cell"), on(MathAlignGroup, "node", "cell")),
  groupFamily,

  mirrors(on(MathCell, "node"), on(cells, "id")),

  contained(
    on(CellLeaf, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(CellLeaf, "node", "cell"), on(leafScopes, "node", "cell")),
  key(on(CellLeaf, "node")),
  contained(on(leafScopes, "node"), on(CellLeaf, "node")),
  contained(on(CellLeaf, "cell", "groups"), on(MathCell, "node", "groups")),
  leafFamily,
  leafStartFold,
  check("E1_derived", CellLeaf, (l) => l.gt(l.start, l.startWas)),
  check("MathML_align_first", CellLeaf, (l) =>
    l.or(l.ne(l.at, 0n), l.eq(l.groups, 0n), l.eq(l.kind, "m:maligngroup")),
  ),
];
