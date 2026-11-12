/**
 * An element's place in its package, as the tests that read the import's rows name it: its
 * document's path and its `start`, its pre-order position there, the key `(package, path, start)`
 * every relation over a node holds it by beside the package's manifest identifier, which one
 * import's rows share.
 *
 * The import's inputs are keyed sets whose key text is the writer's, so a test reads a row by its
 * fields ({@link byPlace}), never by that text. `Node`'s rows are one insert per document, the tree
 * nested, and grizzle draws each node's `start` and `end` from the nesting, so {@link nodePlacesOf}
 * numbers them as grizzle does.
 */
import { Schema } from "effect";
import type { PackageInputs } from "#pantry/import/write.ts";

/**
 * Write an element's place as one text.
 *
 * @param path - Its document's path.
 * @param start - Its pre-order position in the document, the document node 0.
 * @returns The text.
 */
export const placeKey = (path: string, start: bigint): string => `${path} ${String(start)}`;

/**
 * Index a relation's rows by their element's place.
 *
 * @param rows - The rows, a keyed set by `(package, path, start)`, or by a key that holds it.
 * @returns Each row at its place, the last row where two share one.
 */
export const byPlace = <Row extends { readonly path: string; readonly start: bigint }>(
  rows: ReadonlyMap<string, Row>,
): ReadonlyMap<string, Row> =>
  new Map([...rows.values()].map((row) => [placeKey(row.path, row.start), row]));

/**
 * One node of the import's `Node` inserts with what grizzle draws for it: its document's path, its
 * `start`, `end` and `parent`, and its kind.
 */
export interface PlacedNode {
  readonly end: bigint;
  readonly kind: string;
  readonly parent: bigint;
  readonly path: string;
  readonly start: bigint;
}

/**
 * A node of a `Node` insert as this module reads it: its kind and its children, nested in slot
 * order.
 */
const TreeRead = Schema.Struct({ children: Schema.Array(Schema.Unknown), kind: Schema.String });

/**
 * A document's `Node` insert, its root: the document's path beside what any node holds.
 */
const RootRead = Schema.Struct({ path: Schema.String });

/**
 * Number each document's nodes as grizzle draws them: the document node at 0, each node before its
 * children and its children in slot order, `end` one past the node's last descendant, and `parent`
 * its parent's `start`, the document node its own.
 *
 * @param inputs - The import's rows.
 * @returns Every node of every document, by its place ({@link placeKey}).
 */
export const nodePlacesOf = (inputs: PackageInputs): ReadonlyMap<string, PlacedNode> => {
  const places = new Map<string, PlacedNode>();
  for (const root of inputs.Node.values()) {
    const { path } = Schema.decodeUnknownSync(RootRead)(root);
    let next = 0n;
    const stack: (
      | { readonly node: unknown; readonly open: true; readonly parent: bigint }
      | {
          readonly kind: string;
          readonly open: false;
          readonly parent: bigint;
          readonly start: bigint;
        }
    )[] = [{ node: root, open: true, parent: 0n }];
    for (let step = stack.pop(); step !== undefined; step = stack.pop()) {
      if (!step.open) {
        const { kind, parent, start } = step;
        places.set(placeKey(path, start), { end: next, kind, parent, path, start });
        continue;
      }

      const { children, kind } = Schema.decodeUnknownSync(TreeRead)(step.node);
      const start = next;
      next += 1n;
      stack.push(
        { kind, open: false, parent: step.parent, start },
        ...children.toReversed().map((node) => ({ node, open: true as const, parent: start })),
      );
    }
  }

  return places;
};
