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
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
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
  // AL1 owner (AL1): an attribute's copy of its owner's kind, version or document that is not
  // its owner's.
  "AL1 owner": corrupting(item, (rows) => (source) => ({
    _tag: "ownerCopy",
    attribute: source.draw(int(0, rows.attributes.length - 1)),
    field: source.draw(element(["kind", "version", "document"] as const)),
  })),
  // AL2 distinct (AL2): an attribute of the lead division given the closed name and the value of
  // one before it, so no value domain judges it otherwise than the first.
  "AL2 distinct": {
    document: item,
    mutate: (rows) => (source) => {
      // The lead division's optional, unread attributes: renaming one of them drops no attribute
      // another law reads, as renaming an identifier, a tool name or a bound would.
      const unread = new Set(["aria-labelledby", "aria-valuemax", "aria-valuemin", "label"]);
      const pairs = rows.attributes.flatMap((attribute, index) =>
        rows.attributes.flatMap((earlier, at) =>
          at < index &&
          earlier.node === attribute.node &&
          earlier.name !== attribute.name &&
          unread.has(attribute.name) &&
          unread.has(earlier.name)
            ? [{ attribute: index, earlier: at }]
            : [],
        ),
      );
      const pair = pairs[source.draw(int(0, pairs.length - 1))] ?? { attribute: 1, earlier: 0 };
      const renamed = corrupt(rows, { _tag: "repeatedName", ...pair });

      return {
        ...renamed,
        attributes: renamed.attributes.map((attribute, index) =>
          index === pair.attribute
            ? { ...attribute, lexical: rows.attributes[pair.earlier]?.lexical ?? attribute.lexical }
            : attribute,
        ),
      };
    },
    over: "rows",
  },
  // Foreign attribute class (AL4): an open-class attribute given a class its stored namespace
  // contradicts.
  "Foreign attribute class": corrupting(item, (rows) => (source) => ({
    _tag: "wrongAttributeClass",
    attribute: source.draw(
      oneOf(
        rows.attributes.flatMap((attribute, index) =>
          openClasses.some((open) => open === attribute.name) ? [index] : [],
        ),
      ),
    ),
  })),
  // Foreign element class (§1.4): a foreign element given a class its stored namespace
  // contradicts.
  "Foreign element class": corrupting(item, (rows) => (source) => ({
    _tag: "wrongClass",
    node: source.draw(oneOf(numbersOf(rows, (node) => isForeignKind(node.kind)))),
  })),
  // N1 sentinel (N1): the document node's nearest kind that is not its own. Its parentAncestry
  // also feeds E1's derived ancestry, which ranks ahead, so it is not drawn.
  "N1 sentinel": corrupting(item, () => (source) => ({
    _tag: "sentinelCopy",
    field: source.draw(element(["nearestKind"] as const)),
  })),
  // N5 first slot (N5): a first child copying an accumulator other than its identity.
  "N5 first slot": corrupting(item, (rows) => (source) => ({
    _tag: "slotZeroAccumulator",
    field: source.draw(element(["was", "elementsWas"] as const)),
    node: source.draw(oneOf(numbersOf(rows, (node, number) => number > 0 && node.at === 0n))),
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
  // T4 next sibling (T4): a sibling that starts other than where its predecessor ends.
  "T4 next sibling": corrupting(item, (rows) => (source) => ({
    _tag: source.draw(element(["overlappingSiblings", "gapBetweenSiblings"] as const)),
    node: source.draw(oneOf(numbersOf(rows, (node, number) => number > 0 && node.at > 0n))),
  })),
  // T5 last child (T5): a node ending before its last child, which has children, ends.
  "T5 last child": corrupting(item, (rows) => (source) => {
    const lastWithChildren = numbersOf(rows, (node, number) => {
      if (number === 0 || node.children === 0n) {
        return false;
      }

      const last = rows.nodes.find(
        (held) => held.parent === node.id && held.at === node.children - 1n && held.start > 0n,
      );

      return last !== undefined && last.children > 0n;
    });

    return { _tag: "childOutsideParent", node: source.draw(oneOf(lastWithChildren)) };
  }),
  // T6 nonempty and leaf (T6): a childless node whose interval holds more than itself.
  "T6 nonempty and leaf": corrupting(item, (rows) => (source) => ({
    _tag: "wrongSize",
    node: source.draw(oneOf(numbersOf(rows, (node, number) => number > 0 && node.children === 0n))),
  })),
} as const satisfies Readonly<Record<string, Mutation>>;
