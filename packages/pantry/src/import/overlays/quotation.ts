/**
 * The quotation overlay's rows (spec reading 127, `#pantry/qti/quotation.ts`): from one document's
 * XDM tree and the ids its nodes are written under, one `Quotation` row per `q`, keyed by its node.
 *
 * The rows restate what the tree says and nothing else: each `q`'s node tuple (C18), its slot and
 * child count and its parent's, and the four characters beside and inside it, each the end of its
 * neighbour's own characters as `Node` holds them (`endsOf`). The database proves every one of them
 * (`quotationLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import type { Ends } from "#pantry/model/folds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { Quotation } from "#pantry/qti/quotation.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface QuotationIds {
  /**
   * The document's context (spec reading 117), `ownContext` of `#pantry/import/fold.ts` for a
   * document no site names: an included fragment's nodes take the interaction their includes stand
   * in as their nearest.
   */
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's quotation rows: a keyed set from the text of a row's key, its `q`'s node id, to the
 * row as its writer writes it.
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
 * Read each node's own characters as `Node.chars` holds them (`charactersOf` of
 * `#pantry/model/folds.ts`): a text's or a run of whitespace's value, an entity reference as
 * `&name;`, and none for any other kind.
 *
 * @param rows - The document's flat rows.
 * @returns The reader.
 * @throws {Error} When a node of a character kind has no row of its kind, which `flatten` writes for
 *   every such node: a defect of the rows, never of the document.
 */
const charactersIn = (rows: FlatRows<Composed>) => {
  const held = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);

  return (node: NodeRow<Composed>): string => {
    if (!characterKinds.has(node.kind)) {
      return "";
    }

    const chars = held.get(node.id);
    if (chars === undefined) {
      throw new Error(
        `Node ${node.id} is a ${node.kind} with no row of its characters, and flatten writes one for every such node. Read the characters from flatten's rows of the same document.`,
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
    `The q ${node.id} names parent ${node.parent}, but flatten's rows hold no ${missing}. Read a q from the rows of its own document.`,
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
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Its `Quotation` rows, keyed by node.
 * @throws {Error} When a `q`'s parent or its parent's children are not among the document's rows,
 *   which `flatten` writes in one pass: a defect of the rows, never of the document.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: QuotationIds): QuotationRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const folds = foldOf(rows.nodes, ids.context);
  const charsOf = charactersIn(rows);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const familyOf = Map.groupBy(
    rows.nodes.filter(({ id }) => id !== document),
    ({ parent }) => parent,
  );
  const endsAt = (member: Option.Option<NodeRow<Composed>>): Ends =>
    Option.match(member, { onNone: () => noEnds, onSome: (node) => endsOf(charsOf(node)) });
  const contentOf = (node: NodeRow<Composed>): Content =>
    Option.match(Option.fromNullishOr(familyOf.get(node.id)), {
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
        Option.fromNullishOr(byId.get(node.parent)),
        defect(node, "node of that id"),
      );
      const siblings = Option.getOrThrowWith(
        Option.fromNullishOr(familyOf.get(node.parent)),
        defect(node, "children of that parent"),
      );
      const at = Number(node.at);
      quotations.set(node.id, {
        ...contentOf(node),
        after: endsAt(Arr.get(siblings, at + 1)).first,
        at: node.at,
        before: endsAt(Arr.get(siblings, at - 1)).last,
        document,
        firstAt: 0n,
        kind: node.kind,
        nearest: foldAt(folds, node.id).nearest,
        nextAt: node.at + 1n,
        node: node.id,
        parent: node.parent,
        parentAt: parent.at,
        siblings: BigInt(siblings.length),
        start: node.start,
        version: node.version,
      });
    }
  }

  return { Quotation: quotations };
};
