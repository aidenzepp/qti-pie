/**
 * The alignment-group checks of a table cell: where an `m:maligngroup` may sit and what its cell
 * starts with.
 *
 * Both rules are the Recommendation's prose, not the schemas': `c3#id.3.5.5.2` lets an
 * `maligngroup` appear only inside the elements it lists, "which are themselves contained in the
 * table cell", and says that "within any table cell containing alignment groups, the first
 * complete element must be an maligngroup element, though this may be preceded by the start tags
 * of other elements". Neither schema states them, so {@link alignFinding} reads one tree's rows.
 * A group belongs to the nearest `m:mtd` above it, so a cell of a nested table answers for its
 * own groups and an outer cell does not.
 */
import { notElements } from "#pantry/import/guards/mathml-edges.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { MathmlDir, MathmlSelection } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * The containers that let an alignment group through whatever they carry: `m:mphantom`,
 * `m:mfenced` and `m:semantics`.
 */
const passing: ReadonlySet<string> = new Set(["m:mfenced", "m:mphantom", "m:semantics"]);

/**
 * The containers that let an alignment group through only when they do not change `dir`.
 */
const unlessDir: ReadonlySet<string> = new Set(["m:mrow", "m:mstyle"]);

/**
 * The `selection` of an `m:maction` that states none: its first child.
 */
const defaultSelection = 1n;

/**
 * One element of the tree, as the check reads it.
 */
interface Element {
  readonly id: string;
  readonly kind: string;
}

/**
 * The tree's outline and the two attributes the check reads, indexed once.
 */
interface Outline {
  /**
   * The element children of a node, in document order.
   */
  readonly children: (id: string) => readonly Element[];
  /**
   * The nodes that carry a `dir`.
   */
  readonly directed: ReadonlySet<string>;
  /**
   * Every element, in document order.
   */
  readonly order: readonly Element[];
  /**
   * The node above each node.
   */
  readonly parents: ReadonlyMap<string, Element>;
  /**
   * The `selection` each `m:maction` states, by node.
   */
  readonly selections: ReadonlyMap<string, bigint>;
}

/**
 * Index a tree's rows.
 *
 * @param rows - The rows an import built.
 * @returns The outline of the tree and its `dir` and `selection` values.
 */
const outlineOf = (rows: Rows): Outline => {
  const nodes = Rows.of(rows, Node);
  const edges = Rows.of(rows, Edge)
    .filter((edge) => !notElements.has(edge.childKind))
    .toSorted((a, b) => Number(a.position - b.position));
  const byParent = new Map<string, readonly (typeof edges)[number][]>(
    Map.groupBy(edges, (edge) => edge.parent),
  );
  const kindOf = new Map<string, string>(nodes.map((node) => [node.id, node.kind]));
  const element = (id: string): Element => ({ id, kind: kindOf.get(id) ?? "" });
  const children = (id: string): readonly Element[] =>
    (byParent.get(id) ?? []).map((edge) => element(edge.child));
  const parents = new Map<string, Element>(edges.map((edge) => [edge.child, element(edge.parent)]));
  const pending = nodes
    .filter((node) => !parents.has(node.id))
    .map((node) => element(node.id))
    .toReversed();
  const order: Element[] = [];
  while (pending.length > 0) {
    const next = pending.pop();
    if (next === undefined) {
      break;
    }

    order.push(next);
    pending.push(...children(next.id).toReversed());
  }

  return {
    children,
    directed: new Set(
      Rows.of(rows, MathmlDir)
        .filter((row) => row.attribute === "dir")
        .map((row) => row.node),
    ),
    order,
    parents,
    selections: new Map(
      Rows.of(rows, MathmlSelection)
        .filter((row) => row.attribute === "selection")
        .map((row) => [row.node, BigInt(row.value)]),
    ),
  };
};

/**
 * Whether an ancestor lets an alignment group below it stay within the table cell.
 *
 * @param outline - The tree.
 * @param above - The ancestor.
 * @param below - The ancestor's child on the path down to the group.
 * @returns Whether the Recommendation lists the ancestor for that path.
 */
const lets = (outline: Outline, above: Element, below: Element): boolean => {
  if (passing.has(above.kind)) {
    return true;
  }

  if (unlessDir.has(above.kind)) {
    return !outline.directed.has(above.id);
  }

  if (above.kind === "m:maction") {
    const selected = (outline.selections.get(above.id) ?? defaultSelection) - 1n;

    return outline.children(above.id)[Number(selected)]?.id === below.id;
  }

  return false;
};

/**
 * The ancestors from a group up to its nearest table cell.
 *
 * @param outline - The tree.
 * @param group - The `m:maligngroup`.
 * @returns The path, group first and cell last, or nothing when no `m:mtd` is above the group.
 */
const pathToCell = (outline: Outline, group: Element): readonly Element[] | undefined => {
  const path = [group];
  for (
    let above = outline.parents.get(group.id);
    above !== undefined;
    above = outline.parents.get(above.id)
  ) {
    path.push(above);
    if (above.kind === "m:mtd") {
      return path;
    }
  }

  return undefined;
};

/**
 * Refuse a group that sits under an ancestor the Recommendation does not list.
 *
 * @param path - The ancestors from the group up to its cell.
 * @param blocker - The ancestor that does not let the group through.
 * @returns The refusal, naming the path.
 */
const misplaced = (path: readonly Element[], blocker: Element): ImportRefused =>
  new ImportRefused({
    detail: `m:maligngroup ${path[0]?.id ?? ""} sits inside a table cell under ${path.map((step) => step.kind).join(" in ")}, and ${blocker.kind} ${blocker.id} is not one the Recommendation lets an alignment group sit under: only m:mrow and m:mstyle that carry no dir, m:mphantom, m:mfenced, the selected child of m:maction and m:semantics may lie between the group and its m:mtd. Move the group up to those elements, or out of the cell.`,
    rule: "admission",
  });

/**
 * Refuse a cell whose alignment groups do not come first.
 *
 * @param cell - The `m:mtd`.
 * @param first - The first element of the cell, in document order, with no element child.
 * @returns The refusal, naming the element the cell starts with.
 */
const notFirst = (cell: Element, first: Element): ImportRefused =>
  new ImportRefused({
    detail: `m:mtd ${cell.id} holds an m:maligngroup, but its first complete element is ${first.kind} ${first.id}: the Recommendation requires the first complete element of a cell with alignment groups to be an m:maligngroup, which only the start tags of other elements may precede. Put an m:maligngroup first in the cell.`,
    rule: "ordering",
  });

/**
 * The first element of a subtree, in document order, with no element child.
 *
 * @param outline - The tree.
 * @param root - The subtree's root.
 * @returns The leftmost leaf.
 */
const firstLeaf = (outline: Outline, root: Element): Element => {
  let at = root;
  for (;;) {
    const [next] = outline.children(at.id);
    if (next === undefined) {
      return at;
    }

    at = next;
  }
};

/**
 * Check where the alignment groups of one tree sit, and what their cells start with.
 *
 * Every `m:maligngroup` inside an `m:mtd` is judged first (`admission`), in document order,
 * then every cell that holds a group (`ordering`). No row is written.
 *
 * @param rows - The rows an import built for one tree.
 * @returns The refusal for the first group or cell that breaks a rule, or nothing.
 */
export const alignFinding = (rows: Rows): ImportRefused | undefined => {
  const outline = outlineOf(rows);
  const held = new Map<string, Element>();
  for (const group of outline.order.filter((element) => element.kind === "m:maligngroup")) {
    const path = pathToCell(outline, group);
    const cell = path?.at(-1);
    if (path === undefined || cell === undefined) {
      continue;
    }

    held.set(cell.id, cell);

    const blocker = path
      .slice(1, -1)
      .find((above, index) => !lets(outline, above, path[index] ?? group));
    if (blocker !== undefined) {
      return misplaced(path, blocker);
    }
  }

  for (const cell of outline.order.filter((element) => held.has(element.id))) {
    const first = firstLeaf(outline, cell);
    if (first.kind !== "m:maligngroup") {
      return notFirst(cell, first);
    }
  }

  return undefined;
};
