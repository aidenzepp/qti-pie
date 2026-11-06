/**
 * Three of MathML's checks that read one node and its siblings, not its content model: the range
 * of `m:maction/@selection`, the two attributes `m:mglyph` requires, and the `m:bvar` an
 * `m:condition` qualifier follows.
 *
 * Each is pure over the rows of one tree. {@link actionFinding} refuses the first node, in document
 * order, that fails one, as {@link ImportRefused} under the rule that names the failure.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";

import { edgesByParent, notElements } from "#pantry/import/guards/mathml-edges.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { familyRelation } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import { attributeTypeOf } from "#pantry/schema/seed/mathml-attribute-type.ts";

/**
 * The family relation that holds one MathML attribute.
 *
 * @param kind - The element's kind handle.
 * @param attribute - The attribute's name.
 * @returns The relation whose rows carry the attribute's values.
 * @throws {Error} When the matrix has no family for the pair: that is a gap in the seed, not a
 *   finding about the tree.
 */
const relationOf = (kind: string, attribute: string): AnyRelation => {
  const relation = familyRelation.get(attributeTypeOf.get(`${kind} ${attribute}`) ?? "");
  if (relation === undefined) {
    throw new Error(
      `The MathML attribute ${kind} ${attribute} has no family in the matrix; add it to schema/mathml/values.ts.`,
    );
  }

  return relation;
};

/**
 * The values one attribute holds, by node.
 *
 * @param rows - The rows of the import.
 * @param kind - The element's kind handle.
 * @param attribute - The attribute's name.
 * @returns Each node's value for the attribute, for the nodes that write one.
 */
const valuesOf = (rows: Rows, kind: string, attribute: string): ReadonlyMap<string, string> => {
  const values = new Map<string, string>();
  for (const row of Rows.of(rows, relationOf(kind, attribute))) {
    if ("attribute" in row && "node" in row && "value" in row && row.attribute === attribute) {
      values.set(String(row.node), String(row.value));
    }
  }

  return values;
};

/**
 * Refuse one node.
 *
 * @param rule - The rule the node breaks.
 * @param detail - What the node is and what was read, ending in what to hold instead.
 * @returns The refusal.
 */
const refuse = (rule: "required-attribute" | "union-count", detail: string): ImportRefused =>
  new ImportRefused({ detail, rule });

/**
 * Check an `m:maction`'s `selection` against its element-child count.
 *
 * `c3#id.3.7.1.1`: "If the value specified is out of range, it is an error." The value is a
 * MathML integer, unbounded, so it is read as a `bigint`.
 *
 * @param node - The node: its id and version.
 * @param node.id - The node's id.
 * @param node.version - The schema version the node is read under.
 * @param selection - The text the node's `selection` holds, when written.
 * @param count - How many element children the node holds.
 * @returns The refusal, when the selection is out of range.
 */
const selectionFinding = (
  node: { readonly id: string; readonly version: string },
  selection: string | undefined,
  count: number,
): ImportRefused | undefined => {
  if (selection === undefined) {
    return undefined;
  }

  const chosen = BigInt(selection);
  if (chosen >= 1n && chosen <= BigInt(count)) {
    return undefined;
  }

  return refuse(
    "union-count",
    `m:maction ${node.id} (${node.version}) has selection="${selection}" but holds ${count} element ${count === 1 ? "child" : "children"}: the Recommendation makes a selection out of range an error. Write a selection from 1 to ${count}, or leave it out to select the first child.`,
  );
};

/**
 * Check that an `m:mglyph` carries `src` and `alt`.
 *
 * @param node - The node: its id and version.
 * @param node.id - The node's id.
 * @param node.version - The schema version the node is read under.
 * @param missing - The required attributes the node does not write.
 * @returns The refusal, when any is missing.
 */
const glyphFinding = (
  node: { readonly id: string; readonly version: string },
  missing: readonly string[],
): ImportRefused | undefined =>
  missing.length === 0
    ? undefined
    : refuse(
        "required-attribute",
        `m:mglyph ${node.id} (${node.version}) does not carry ${missing.join(" or ")}, and the Recommendation requires both src and alt. Write the missing attribute${missing.length === 1 ? "" : "s"} on the m:mglyph.`,
      );

/**
 * Where a node sits among its parent's element children: the parent's kind and the kinds of the
 * element siblings before it, in document order.
 */
interface Placed {
  readonly before: readonly string[];
  readonly parentKind: string;
}

/**
 * Check that an `m:condition` follows an `m:bvar` among its siblings.
 *
 * `c4#contm.domainofapplication.qualifier`: condition qualifiers require a preceding `m:bvar`. Only
 * a condition whose parent is an `m:apply` or `m:bind` is judged here.
 *
 * @param node - The condition: its id and version.
 * @param node.id - The node's id.
 * @param node.version - The schema version the node is read under.
 * @param place - Where the node sits among its parent's element children, when it has a parent.
 * @returns The refusal, when no `m:bvar` comes before it.
 */
const conditionFinding = (
  node: { readonly id: string; readonly version: string },
  place: Placed | undefined,
): ImportRefused | undefined =>
  place === undefined ||
  (place.parentKind !== "m:apply" && place.parentKind !== "m:bind") ||
  place.before.includes("m:bvar")
    ? undefined
    : refuse(
        "union-count",
        `m:condition ${node.id} (${node.version}) sits in an ${place.parentKind} with ${place.before.length === 0 ? "nothing" : place.before.join(", ")} before it, but a condition qualifier requires a preceding m:bvar. Put an m:bvar before the m:condition.`,
      );

/**
 * What the checks read of one node besides its kind.
 */
interface Reading {
  readonly alt: boolean;
  readonly count: number;
  readonly place: Placed | undefined;
  readonly selection: string | undefined;
  readonly src: boolean;
}

/**
 * Judge one node by its kind.
 *
 * @param node - The node: its id, kind and version.
 * @param node.id - The node's id.
 * @param node.kind - The node's kind handle.
 * @param node.version - The schema version the node is read under.
 * @param read - What the checks read of the node.
 * @returns The refusal, when the node fails the check its kind has.
 */
const nodeFinding = (
  node: { readonly id: string; readonly kind: string; readonly version: string },
  read: Reading,
): ImportRefused | undefined => {
  if (node.kind === "m:maction") {
    return selectionFinding(node, read.selection, read.count);
  }

  if (node.kind === "m:mglyph") {
    return glyphFinding(node, [...(read.src ? [] : ["src"]), ...(read.alt ? [] : ["alt"])]);
  }

  return node.kind === "m:condition" ? conditionFinding(node, read.place) : undefined;
};

/**
 * Refuse the first node, in document order, whose `m:maction` selection is out of range, whose
 * `m:mglyph` lacks `src` or `alt`, or whose `m:condition` has no `m:bvar` before it.
 *
 * Nodes are visited in preorder from each tree's root, so the first finding is the one earliest in
 * the document. No row is written.
 *
 * @param rows - The rows an import built for one package.
 * @returns The refusal, or nothing when every node passes.
 */
export const actionFinding = (rows: Rows): ImportRefused | undefined => {
  const nodes = Rows.of(rows, Node);
  const allEdges = Rows.of(rows, Edge);
  const edges = edgesByParent(rows);
  const children = new Set(allEdges.map((edge) => edge.child));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const selections = valuesOf(rows, "m:maction", "selection");
  const sources = valuesOf(rows, "m:mglyph", "src");
  const alts = valuesOf(rows, "m:mglyph", "alt");
  const placed = new Map<string, Placed>();
  for (const own of edges.values()) {
    const seen: string[] = [];
    for (const edge of own) {
      if (!notElements.has(edge.childKind)) {
        placed.set(edge.child, { before: [...seen], parentKind: edge.parentKind });
        seen.push(edge.childKind);
      }
    }
  }

  const pending = nodes.filter((node) => !children.has(node.id)).toReversed();
  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      break;
    }

    const own = edges.get(node.id) ?? [];
    const elements = own.map((edge) => edge.childKind).filter((kind) => !notElements.has(kind));
    const finding = nodeFinding(node, {
      alt: alts.has(node.id),
      count: elements.length,
      place: placed.get(node.id),
      selection: selections.get(node.id),
      src: sources.has(node.id),
    });
    if (finding !== undefined) {
      return finding;
    }

    for (const edge of own.toReversed()) {
      const child = byId.get(edge.child);
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }

  return undefined;
};
