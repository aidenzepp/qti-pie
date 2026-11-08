/**
 * The mutations of the law oracle's laws over a document's tree and folds (§1.3), each a named
 * corruption of the every-relation item's folded rows (`#pantry/test/gen/xdm.ts` `corrupt`) at a
 * target drawn among those the rows hold, judged by `documentBreaches`
 * (`src/test/complete.oracle.test.ts`).
 *
 * No package text breaks these laws: the folds write the rows they read. So each mutation edits the
 * rows the folds wrote, with the generator's own corruptions, whose law `lawOf` names, at a target
 * drawn from the item's rows: a node number in document order, the start each node holds, or an
 * attribute's place among the attribute rows.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { Option } from "effect";
import { admissionOf } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedAttribute, FoldedRows } from "#pantry/model/folds.ts";
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
 * An attribute row's typing: its domain, and that domain's identity type.
 */
interface Typing {
  /**
   * The domain its owner's copy admits its name in, none where none admits it.
   */
  readonly domain: Option.Option<string>;
  /**
   * The domain's identity, `ID`, `IDREF` or `IDREFS`, none for a domain that has none.
   */
  readonly identity: Option.Option<string>;
}

/**
 * How an attribute row is typed by the copy of its owner it holds: the domain its (version, kind,
 * governing type) admits its name in, none where none admits it, and that domain's identity, `ID`
 * for a context declaration's `identifier` as the oracle's ID table reads it (spec reading 74).
 *
 * @param grammar - The composed grammar.
 * @param attribute - The attribute row.
 * @returns Its domain and its identity.
 */
const typingOf = (grammar: ComposedGrammar, attribute: FoldedAttribute<Composed>): Typing => {
  const domain = admissionOf(grammar.attributes, {
    governs: attribute.governs,
    kind: attribute.kind,
    name: attribute.name,
    version: attribute.version,
  }).pipe(Option.map((admitted) => admitted.domain));

  return {
    domain,
    identity:
      attribute.kind === "qti-context-declaration" && attribute.name === "identifier"
        ? Option.some("ID")
        : domain.pipe(
            Option.flatMap((held) => grammar.attributes.identity.lookup({ domain: held })),
            Option.map(({ identity }) => identity),
          ),
  };
};

/**
 * Decide whether an owner-copy corruption of one attribute breaks AL1 owner alone: the attribute is
 * no ID or IDREF before or after it, so the document's ids and references stand as they were, and
 * under the copy it holds after it its name is admitted in the same domain or in none, so no value
 * domain (attribute-lexical, ranked ahead of attribute-admission) judges its value otherwise. An
 * admission the copy loses breaks AL1 admission and AL2 fold, AL1 owner's own rule.
 *
 * @param grammar - The composed grammar.
 * @param before - The attribute row.
 * @param after - The row the corruption leaves.
 * @returns Whether the corruption isolates AL1 owner.
 */
const ownerCopyIsolates = (
  grammar: ComposedGrammar,
  before: FoldedAttribute<Composed>,
  after: FoldedAttribute<Composed> | undefined,
): boolean => {
  const was = typingOf(grammar, before);
  const is = after === undefined ? was : typingOf(grammar, after);

  return (
    Option.isNone(was.identity) &&
    Option.isNone(is.identity) &&
    Option.match(is.domain, {
      onNone: () => true,
      onSome: (domain) => Option.contains(was.domain, domain),
    })
  );
};

/**
 * The owner-copy fields AL1 owner's mutation corrupts.
 */
const ownerCopyFields = ["kind", "version", "document"] as const;

/**
 * Each law's mutation, by law.
 */
export const rowMutations = {
  // AL1 owner (AL1): an attribute's copy of its owner's kind, version or document that is not
  // its owner's, drawn among the attributes whose every such corruption breaks AL1 owner alone
  // ({@link ownerCopyIsolates}): the context declaration's identifier, an ID a context variable
  // names, copied as its item's would leave CTX no ID and raise Idref target ahead of it.
  "AL1 owner": {
    document: item,
    mutate: (rows, grammar) => (source) => {
      const isolated = rows.attributes.flatMap((attribute, index) =>
        ownerCopyFields.every((field) =>
          ownerCopyIsolates(
            grammar,
            attribute,
            corrupt(rows, { _tag: "ownerCopy", attribute: index, field }).attributes[index],
          ),
        )
          ? [index]
          : [],
      );

      return corrupt(rows, {
        _tag: "ownerCopy",
        attribute: source.draw(oneOf(isolated)),
        field: source.draw(element(ownerCopyFields)),
      });
    },
    over: "rows",
  },
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
