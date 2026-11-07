/**
 * The MathML apply laws (spec reading 2, MathML 3 validity): the laws "MathML arity" and "MathML
 * head qualifier", stated over the `m:apply` elements of Content MathML.
 *
 * An `m:apply` applies its first element child, the operator, to the element children after it. A
 * class of operators takes a fixed number of arguments (MathML 3 §4.3.4.5 and §4.3.4.6, and each
 * operator's syntax table in §4.4), which {@link MathArity} holds; `degree`, `momentabout` and
 * `logbase` stand only beside an operator whose syntax table lists them (spec reading R6-head-
 * qualifiers), which {@link HeadQualifier} holds. The importer refused neither before: only the
 * law oracle judged them.
 *
 * - **{@link MathApply}**, one row per `m:apply` with an element child, keyed by its node: its
 *   `nodeRef` tuple (C18), its element rank and element count (`nodeCounts`), its `operator`, the
 *   kind of its first element child, and two counts of the rows below it, `arguments` and `owned`.
 *   Both ways between the rows and the `m:apply` nodes that have an element child, so no
 *   application escapes the law.
 * - **{@link MathArgument}**, one row per element child after the operator that is none of Content
 *   MathML's qualifier kinds ({@link mathQualifiers}), counted by `MathApply.arguments`. Both ways
 *   between the rows and exactly those nodes, so the host's count is proved.
 * - **{@link MathQualifier}**, one row per `degree`, `momentabout` or `logbase` after the operator of
 *   an `m:apply` whose operator is a {@link MathHeadOperator}, with that operator as its `head`,
 *   counted by `MathApply.owned`. Its pair `(head, kind)` is contained in {@link HeadQualifier}, so
 *   a pair the syntax tables do not list is refused; that containment is "MathML head qualifier"
 *   (`#pantry/import/refusal.ts` names it). A head that is no built-in operator has no row: nothing
 *   is judged beside it.
 *
 * `MathML_arity` is the law's check over {@link MathApply}: the arguments lie between the
 * operator's `min` and `max` in {@link MathArity}. It is not judged where the application holds a
 * qualifier that is none of its operator's own, the qualifiers of {@link mathQualifiers} that no
 * {@link MathQualifier} row owns: such an application is a binding or qualified one whose argument
 * count no class states (`elementChildren` is the operator, the arguments, the owned qualifiers and
 * any other qualifier, so the check is judged exactly where it holds no other). An operator
 * {@link MathArity} does not hold is not judged either.
 *
 * Every statement but the head qualifier's containment is a restatement of the tree, "E1 derived";
 * the check is named by its law, as `#pantry/qti/expressions.ts` names `Arity`.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter4.html#contm.unary | MathML 3 §4.3.4.6, Unary operators}
 * @see {@link https://www.w3.org/TR/MathML3/chapter4.html#contm.binary | MathML 3 §4.3.4.5, Binary operators}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  key,
  mirrors,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { mathArities, mathHeadQualifiers, mathQualifiers } from "#pantry/grammar/expression.ts";
import {
  HeadQualifier,
  MathArity,
  MathHeadOperator,
  NodeKind,
  nonElementKinds,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";

/**
 * The `NodeKind` handles among some names, so a selection and a check read them as handles.
 *
 * @param names - Kind names.
 * @returns The handles of the roster the names spell, in the roster's order.
 */
const handlesOf = (names: ReadonlySet<string>): readonly (typeof NodeKind.handles)[number][] =>
  NodeKind.handles.filter((handle) => names.has(handle));

/**
 * The qualifier kinds of Content MathML's `apply` ({@link mathQualifiers}): an element child of one
 * of them is no argument.
 */
const qualifierKinds = handlesOf(mathQualifiers);

/**
 * The qualifiers that belong to a head, `degree`, `momentabout` and `logbase`
 * ({@link mathHeadQualifiers}): the kinds a {@link MathQualifier} row is written for.
 */
const headQualifierKinds = handlesOf(new Set(mathHeadQualifiers.map(({ qualifier }) => qualifier)));

/**
 * The operators {@link MathArity} holds, the only operators the arity law judges.
 */
const arityKinds = handlesOf(new Set(mathArities.keys()));

/**
 * One `m:apply` with an element child, keyed by its node.
 *
 * - **the host's:** the `nodeRef` tuple (`node`, `document`, `kind`, `start`, `nearest`, `version`,
 *   `parent`), proved by containment; `elements` and `elementChildren`, the node's own element rank
 *   and element count, which `nodeCounts` proves; and `operator`, its first element child's kind,
 *   proved by containment into the first element children;
 * - **drawn:** `arguments`, the count of its {@link MathArgument} rows, and `owned`, the count of its
 *   {@link MathQualifier} rows.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const MathApply = relation(
  "MathApply",
  {
    arguments: drawn(natural),
    document: uuid,
    elementChildren: natural,
    elements: natural,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    operator: closedId(NodeKind),
    owned: drawn(natural),
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One argument of an `m:apply`: an element child after its operator that is no qualifier, keyed by
 * its node, with the `nodeRef` tuple of the node, whose `parent` is the application.
 */
export const MathArgument = relation(
  "MathArgument",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One head qualifier of an `m:apply` whose operator is a {@link MathHeadOperator}: a `degree`,
 * `momentabout` or `logbase` after the operator, keyed by its node, with the `nodeRef` tuple of the
 * node, whose `parent` is the application, and its operator as `head`. Its `kind` is the qualifier.
 */
export const MathQualifier = relation(
  "MathQualifier",
  {
    document: uuid,
    head: closedId(NodeKind),
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The relations the apply laws declare, each under its own name, as `#pantry/qti/schema.ts`
 * composes them.
 */
export const applyRelations = { MathApply, MathArgument, MathQualifier };

/**
 * The `m:apply` nodes with an element child, each of which holds a {@link MathApply} row.
 */
const applications = select(Node, (n) =>
  n.and(n.eq(n.kind, "m:apply"), n.gt(n.elementChildren, 0n)),
);

/**
 * The first element child of an `m:apply`: an element whose element rank is 1. A parent has one,
 * so `(parent, kind)` is a key of them and a {@link MathApply} row's `operator` is among them.
 */
const operators = select(Node, (n) =>
  n.and(n.not(n.in(n.kind, nonElementKinds)), n.eq(n.parentKind, "m:apply"), n.eq(n.elements, 1n)),
);

/**
 * The element children of an `m:apply` after its operator that are no qualifier: the nodes that
 * hold a {@link MathArgument} row.
 */
const argumentNodes = select(Node, (n) =>
  n.and(
    n.not(n.in(n.kind, nonElementKinds)),
    n.eq(n.parentKind, "m:apply"),
    n.gt(n.elements, 1n),
    n.not(n.in(n.kind, qualifierKinds)),
  ),
);

/**
 * The element children of an `m:apply` after its operator that are of a kind a head's syntax table
 * may list: the nodes a {@link MathQualifier} row may name.
 */
const headQualifierNodes = select(Node, (n) =>
  n.and(
    n.not(n.in(n.kind, nonElementKinds)),
    n.eq(n.parentKind, "m:apply"),
    n.gt(n.elements, 1n),
    n.in(n.kind, headQualifierKinds),
  ),
);

/**
 * The family of an application's arguments, counted by `MathApply.arguments`.
 */
export const argumentFamily = counted(on(MathArgument, "parent"), fin(MathApply, "arguments"));

/**
 * The family of an application's head qualifiers, counted by `MathApply.owned`.
 */
export const qualifierFamily = counted(on(MathQualifier, "parent"), fin(MathApply, "owned"));

/**
 * An application's head qualifier is a pair the syntax tables list: each {@link MathQualifier}'s
 * `(head, kind)` is contained in {@link HeadQualifier}. It is the law "MathML head qualifier",
 * which `#pantry/import/refusal.ts` names with a row of its own, apart from the module's other
 * statements.
 */
export const headQualifierLaw = contained(
  on(MathQualifier, "head", "kind"),
  on(HeadQualifier, "head", "qualifier"),
);

/**
 * Every statement over {@link MathApply}, {@link MathArgument} and {@link MathQualifier}, each
 * `check` named by its law:
 *
 * - **the applications:** each row's node `nodeRef` tuple and counts, one row for each `m:apply` with
 *   an element child and no other node (both ways), and its `operator`, the kind of the first
 *   element child;
 * - **the arguments:** each row's node `nodeRef` tuple, one row for each non-qualifier element child
 *   after the operator and no other node (both ways), and the family;
 * - **the head qualifiers:** each row's node `nodeRef` tuple, a node of a head qualifier kind, its
 *   head the application's operator and a {@link MathHeadOperator}, and the family; and its pair
 *   `(head, kind)` contained in {@link HeadQualifier}, which is "MathML head qualifier";
 * - **`MathML_arity`:** an application is not judged where it holds a qualifier no row owns or an
 *   operator {@link MathArity} lacks, and otherwise holds between `min` and `max` arguments.
 */
export const applyLaws = [
  contained(
    on(MathApply, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(MathApply, "node", "elements", "elementChildren"), nodeCounts),
  mirrors(on(MathApply, "node"), on(applications, "id")),
  key(on(operators, "parent", "kind")),
  contained(on(MathApply, "node", "operator"), on(operators, "parent", "kind")),

  contained(
    on(MathArgument, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(MathArgument, "node"), on(argumentNodes, "id")),
  argumentFamily,

  contained(
    on(MathQualifier, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(MathQualifier, "node"), on(headQualifierNodes, "id")),
  contained(on(MathQualifier, "parent", "head"), on(MathApply, "node", "operator")),
  contained(on(MathQualifier, "head"), on(MathHeadOperator, "kind")),
  qualifierFamily,
  headQualifierLaw,

  check("MathML_arity", MathApply, (a) =>
    a.or(
      a.ne(
        Compute.base(a.elementChildren),
        Compute.add(Compute.add(Compute.base(a.arguments), Compute.base(a.owned)), 1n),
      ),
      a.not(a.in(a.operator, arityKinds)),
      a.between(a.arguments, MathArity.at("min", a.operator), MathArity.at("max", a.operator)),
    ),
  ),
] as const;
