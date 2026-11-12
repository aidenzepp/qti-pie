/**
 * The quotation overlay's rows (spec reading 127, `#pantry/qti/quotation.ts`): from one document's
 * view (`DocumentView` of `#pantry/import/fold.ts`), one `Quotation` row per `q`, keyed by the
 * `q`, `(package, path, start)`.
 *
 * The rows restate what the tree says and nothing else: each `q`'s node tuple (C18), its slot and
 * child count and its parent's, and the four characters beside and inside it, each the end of its
 * neighbour's own characters as `Node` holds them (`endsOf`). The database proves every one of them
 * (`quotationLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { keyTextOf } from "#pantry/import/key-text.ts";
import type { Place } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import type { Ends } from "#pantry/model/folds.ts";
import type { FlatRows, NodeRow } from "#pantry/model/xdm.ts";
import type { Quotation } from "#pantry/qti/quotation.ts";

/**
 * A document's quotation rows: a keyed set from the text of a row's key, its `q`'s `(package, path,
 * start)` as a JSON array, to the row as its writer writes it.
 */
export interface QuotationRows {
  readonly Quotation: ReadonlyMap<string, Addition<typeof Quotation>>;
}

/**
 * The kinds whose node holds characters of its own, each in one row of its kind: a text, a run of
 * whitespace and an entity reference crust keeps.
 */
const characterKinds: ReadonlySet<string> = new Set(["entityRef", "text", "ws"]);

/**
 * The ends of a member that does not exist: empty, as `E1_derived` on `Quotation` holds each end
 * whose member does not exist (`#pantry/qti/quotation.ts`), the same ends `Node` gives a node with
 * no characters.
 */
const noEnds: Ends = endsOf("");

/**
 * The document node's position in its document, which no `q` is a child of but as its root's
 * parent, and which is no member of any family of siblings.
 */
const documentNode = 0n;

/**
 * Read each node's own characters as `Node.chars` holds them (`charactersOf` of
 * `#pantry/model/folds.ts`): a text's or a run of whitespace's value, an entity reference as
 * `&name;`, and none for any other kind.
 *
 * @param rows - The document's flat rows.
 * @returns The reader.
 * @throws {Error} When a node of a character kind has no row of its kind, which `flatten` writes for
 *   every such node: a defect of the rows, never of the document.
 */
export const charactersIn = (rows: FlatRows<Composed>) => {
  const held = new Map<bigint, string>([
    ...rows.texts.map(({ start, value }) => [start, value] as const),
    ...rows.whitespace.map(({ start, value }) => [start, value] as const),
    ...rows.entityRefs.map(({ name, start }) => [start, `&${name};`] as const),
  ]);

  return (node: NodeRow<Composed>): string => {
    if (!characterKinds.has(node.kind)) {
      return "";
    }

    const chars = held.get(node.start);
    if (chars === undefined) {
      throw new Error(
        `The node at ${String(node.start)} is a ${node.kind} with no row of its characters, and flatten writes one for every such node. Read the characters from flatten's rows of the same document.`,
      );
    }

    return chars;
  };
};

/**
 * The defect a `q` whose parent is missing from its document's rows is.
 *
 * @param node - The `q`.
 * @param missing - What the rows lack.
 * @returns The error's thunk.
 */
const defect = (node: NodeRow<Composed>, missing: string) => () =>
  new Error(
    `The q at ${String(node.start)} names a parent at ${String(node.parent)}, but flatten's rows hold no ${missing}. Read a q from the rows of its own document.`,
  );

/**
 * A `q`'s count of children and the two ends of its content: none, and no ends, where nothing names
 * it as parent, as `E1_derived` on `Quotation` holds a `q` with no child; else the first
 * character of its first child and the last of its last.
 */
type Content = Pick<Addition<typeof Quotation>, "children" | "first" | "last">;

/**
 * Build the quotation overlay's rows of one document: a row for each `q`, with the last character
 * of its sibling before it, the first of its sibling after it, and the first and last of its first
 * and last child, each empty where that node does not exist or holds no characters.
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @param ids - Where it stands in its package: its `package` and `path`, every row's.
 * @param ids.package - The package's manifest identifier.
 * @param ids.path - The document's entry path.
 * @returns Its `Quotation` rows, keyed by the `q`.
 * @throws {Error} When a `q`'s parent or its parent's children are not among the document's rows,
 *   which `flatten` writes in one pass: a defect of the rows, never of the document.
 */
export const rowsOf = (view: DocumentView, ids: Place): QuotationRows => {
  const { folds, rows } = view;
  const charsOf = charactersIn(rows);
  const byStart = new Map(rows.nodes.map((node) => [node.start, node] as const));
  const familyOf = Map.groupBy(
    rows.nodes.filter(({ start }) => start !== documentNode),
    ({ parent }) => parent,
  );
  const endsAt = (member: Option.Option<NodeRow<Composed>>): Ends =>
    Option.match(member, { onNone: () => noEnds, onSome: (node) => endsOf(charsOf(node)) });
  const contentOf = (node: NodeRow<Composed>): Content =>
    Option.match(Option.fromNullishOr(familyOf.get(node.start)), {
      onNone: () => ({ children: 0n, first: noEnds.first, last: noEnds.last }),
      onSome: (children) => ({
        children: BigInt(children.length),
        first: endsAt(Arr.head(children)).first,
        last: endsAt(Arr.last(children)).last,
      }),
    });
  const quotations = new Map<string, Addition<typeof Quotation>>();
  for (const node of rows.nodes) {
    if (node.kind === "q") {
      const parent = Option.getOrThrowWith(
        Option.fromNullishOr(byStart.get(node.parent)),
        defect(node, "node at that position"),
      );
      const siblings = Option.getOrThrowWith(
        Option.fromNullishOr(familyOf.get(node.parent)),
        defect(node, "children of that parent"),
      );
      const at = Number(node.at);
      quotations.set(keyTextOf(ids.package, ids.path, node.start), {
        ...contentOf(node),
        after: endsAt(Arr.get(siblings, at + 1)).first,
        at: node.at,
        before: endsAt(Arr.get(siblings, at - 1)).last,
        firstAt: 0n,
        kind: node.kind,
        nearest: foldAt(folds, node.start).nearest,
        nextAt: node.at + 1n,
        package: ids.package,
        parent: node.parent,
        parentAt: parent.at,
        path: ids.path,
        siblings: BigInt(siblings.length),
        start: node.start,
        version: node.version,
      });
    }
  }

  return { Quotation: quotations };
};
