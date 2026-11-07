/**
 * The mutations of the law oracle's laws over a document's tree and folds (§1.3), each a named
 * corruption of the every-relation item's folded rows (`#pantry/test/gen/xdm.ts` `corrupt`) at a
 * target drawn among those the rows hold, judged by `documentBreaches`
 * (`src/test/oracle.complete.test.ts`).
 *
 * No package text breaks these laws: the folds write the rows they read. So each mutation edits the
 * rows the folds wrote, with the generator's own corruptions, whose law `lawOf` names, at a target
 * drawn from the item's rows: a node number in document order, the start each node holds, or an
 * attribute's place among the attribute rows.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import { corrupt } from "#pantry/test/gen/xdm.ts";
import type { Corruption } from "#pantry/test/gen/xdm.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation item, whose folded rows the corruptions edit.
 */
const item = "items/item.xml";

/**
 * Draw one number of a list.
 *
 * @param numbers - The numbers.
 * @returns A generator of one of them. Throws when the list is empty, a base without the target.
 */
const oneOf = (numbers: readonly number[]): Gen<number> => {
  const [first, ...rest] = numbers;
  if (first === undefined) {
    throw new Error("the base's rows hold no target for the corruption");
  }

  return element([first, ...rest]);
};

/**
 * A corruption drawn over a document's rows, applied.
 *
 * @param document - The document whose rows it edits.
 * @param draw - The corruption, drawn from the rows.
 * @returns The mutation.
 */
const corrupting = (
  document: string,
  draw: (rows: FoldedRows<Composed>) => Gen<Corruption>,
): Mutation => ({
  document,
  mutate: (rows) => (source) => corrupt(rows, source.draw(draw(rows))),
  over: "rows",
});

/**
 * The numbers of a document's nodes, in document order, that a predicate keeps.
 *
 * @param rows - The rows.
 * @param keep - The predicate, over a node and its number.
 * @returns The numbers.
 */
const numbersOf = (
  rows: FoldedRows<Composed>,
  keep: (node: FoldedRows<Composed>["nodes"][number], number: number) => boolean,
): readonly number[] => rows.nodes.flatMap((node, number) => (keep(node, number) ? [number] : []));

/**
 * Each law's mutation, by law.
 */
export const rowMutations = {
  // N1 sentinel (N1): the document node's nearest kind that is not its own. Its parentAncestry
  // also feeds E1's derived ancestry, which ranks ahead, so it is not drawn.
  "N1 sentinel": corrupting(item, () => (source) => ({
    _tag: "sentinelCopy",
    field: source.draw(element(["nearestKind"] as const)),
  })),
  // N5 fold (N5): the stimulus's doctype moved from its first slot to its last, after the root
  // element, whose state it never folded from.
  "N5 fold": corrupting("items/stimulus.xml", (rows) => (source) => ({
    _tag: "doctypeNotFirst",
    node: source.draw(oneOf(numbersOf(rows, (node) => node.kind === "doctype"))),
  })),
  // T1 document order (T1): a node starting where the node before it starts.
  "T1 document order": corrupting(item, (rows) => (source) => ({
    _tag: "startTaken",
    node: source.draw(int(2, rows.nodes.length - 1)),
  })),
  // T3 first child (T3): a text's or whitespace's copy of its parent's document that is not its
  // parent's. An element's copy feeds its attributes' owner copies (AL1), and its other parent
  // fields the admission, nearest and ancestry laws, each ranked ahead, so none is drawn.
  "T3 first child": corrupting(item, (rows) => (source) => ({
    _tag: "parentCopy",
    field: "document",
    node: source.draw(oneOf(numbersOf(rows, (node) => node.kind === "text" || node.kind === "ws"))),
  })),
  // T6 nonempty and leaf (T6): a childless node whose interval holds more than itself.
  "T6 nonempty and leaf": corrupting(item, (rows) => (source) => ({
    _tag: "wrongSize",
    node: source.draw(oneOf(numbersOf(rows, (node, number) => number > 0 && node.children === 0n))),
  })),
} as const satisfies Readonly<Record<string, Mutation>>;
