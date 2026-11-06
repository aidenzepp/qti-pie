/**
 * The MathML `m:share` guard: its `src` names an element of the same document, and no element
 * dominates itself through child edges and `share` targets (spec 4.8a, MA18: C16 and C17).
 *
 * Neither check is a match over one node's children. `m:share/@src` "is a URI specifying the id
 * attribute of the root node of the expression tree" (`c4#contm.share`), and "An element may not
 * dominate itself" (`c4#contm.acyclicity`), so both read the document's id rows and walk the tree
 * with the `share` edges added to it.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { HtmlId } from "#pantry/schema/document.ts";
import { MathmlSrc } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * A node as a refusal names it: its kind, and its `id` when it has one, else its row id.
 */
interface Named {
  readonly id: Uuid;
  readonly kind: string;
}

/**
 * Name a node for a refusal.
 *
 * @param node - The node.
 * @param ids - The `id` attribute of each node that has one.
 * @returns The kind and the `id` attribute, or the row id when the node has none.
 */
const nameOf = (node: Named, ids: ReadonlyMap<Uuid, string>): string => {
  const id = ids.get(node.id);

  return id === undefined ? `${node.kind} ${node.id}` : `${node.kind} id="${id}"`;
};

/**
 * The element a fragment reference names.
 *
 * @param src - The `src` text.
 * @returns The `id` after the `#`, or nothing when the text is not a same-document fragment of
 *   one or more characters.
 */
const fragmentOf = (src: string): string | undefined =>
  src.startsWith("#") && src.length > 1 ? src.slice(1) : undefined;

/**
 * One step of the walk: a node and the nodes it leads to, with how far along them the walk is.
 */
interface Frame {
  next: number;
  readonly node: Named;
  readonly onward: readonly Uuid[];
}

/**
 * Refuse the first cycle over child edges and `share` targets (C17), walking from each root in
 * document order.
 *
 * @param roots - The nodes no edge leads to, in document order.
 * @param edges - Every `Edge` row by parent id, each list in `position` order.
 * @param targets - The node each resolved `m:share` points at, by the `share`'s id.
 * @param byId - Every node by id.
 * @param ids - The `id` attribute of each node that has one.
 * @returns The refusal naming the cycle, or nothing when the walk finds none.
 */
const cycleFinding = (
  roots: readonly Named[],
  edges: ReadonlyMap<Uuid, readonly { readonly child: Uuid }[]>,
  targets: ReadonlyMap<Uuid, Uuid>,
  byId: ReadonlyMap<Uuid, Named>,
  ids: ReadonlyMap<Uuid, string>,
): ImportRefused | undefined => {
  const onward = (node: Named): readonly Uuid[] => {
    const target = targets.get(node.id);

    return [
      ...(edges.get(node.id) ?? []).map((edge) => edge.child),
      ...(target === undefined ? [] : [target]),
    ];
  };
  const done = new Set<Uuid>();
  for (const root of roots) {
    const path: Frame[] = [{ next: 0, node: root, onward: onward(root) }];
    const visiting = new Set<Uuid>([root.id]);
    while (path.length > 0) {
      const frame = path.at(-1);
      if (frame === undefined) {
        break;
      }

      const id = frame.onward[frame.next];
      frame.next += 1;
      if (id === undefined) {
        visiting.delete(frame.node.id);
        done.add(frame.node.id);
        path.pop();
        continue;
      }

      const node = byId.get(id);
      if (node === undefined || done.has(id)) {
        continue;
      }

      if (visiting.has(id)) {
        const from = path.findIndex((step) => step.node.id === id);
        const cycle = [
          ...path.slice(from).map((step) => nameOf(step.node, ids)),
          nameOf(node, ids),
        ];

        return new ImportRefused({
          detail: `${nameOf(node, ids)} dominates itself: ${cycle.join(" -> ")}. An element may not contain, directly or through an m:share, the element it shares. Point the m:share at an element that does not contain it.`,
          rule: "document-key",
        });
      }

      visiting.add(id);
      path.push({ next: 0, node, onward: onward(node) });
    }
  }

  return undefined;
};

/**
 * Refuse the first `m:share`, in document order, whose `src` is not a same-document fragment that
 * names an `id` of its document (C16), then the first cycle over child edges and `share` targets
 * (C17).
 *
 * Both refuse as `document-key`: the `src` is a reference into the document's `id` space, which is
 * keyed by `(document, id)`. A `share` with no `src` row has nothing to resolve and is left to the
 * required-attribute rule. The cycle is found by a depth-first walk from each root that keeps the
 * path it is on; a `share` whose target is on that path closes a cycle, and the detail names it.
 * No row is written.
 *
 * @param rows - The rows an import built for one package.
 * @returns The refusal for the first dangling `share`, else for the first cycle, or nothing.
 */
export const shareFinding = (rows: Rows): ImportRefused | undefined => {
  const nodes = Rows.of(rows, Node);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges = Map.groupBy(
    Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );
  const ids = new Map(Rows.of(rows, HtmlId).map((row) => [row.node, row.id]));
  const owners = new Map(
    Rows.of(rows, HtmlId).map((row) => [`${row.document} ${row.id}`, row.node]),
  );
  const sources = new Map(
    Rows.of(rows, MathmlSrc)
      .filter((row) => row.kind === "m:share" && row.attribute === "src")
      .map((row) => [row.node, row.value]),
  );

  const targets = new Map<Uuid, Uuid>();
  const children = new Set(Rows.of(rows, Edge).map((edge) => edge.child));
  const roots = nodes.filter((node) => !children.has(node.id));
  const pending = roots.toReversed();
  const preorder: (typeof nodes)[number][] = [];
  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      break;
    }

    preorder.push(node);
    for (const edge of (edges.get(node.id) ?? []).toReversed()) {
      const child = byId.get(edge.child);
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }

  for (const node of preorder) {
    const src = sources.get(node.id);
    if (node.kind !== "m:share" || src === undefined) {
      continue;
    }

    const fragment = fragmentOf(src);
    const target = fragment === undefined ? undefined : owners.get(`${node.tree} ${fragment}`);
    if (target === undefined) {
      return new ImportRefused({
        detail: `${nameOf(node, ids)} has src ${JSON.stringify(src)}, which is ${fragment === undefined ? "not a same-document fragment of the form #id" : `a fragment that names no element with id="${fragment}" in this document`}. Point src at the id of an element of the same document, written #id.`,
        rule: "document-key",
      });
    }

    targets.set(node.id, target);
  }

  return cycleFinding(roots, edges, targets, byId, ids);
};
