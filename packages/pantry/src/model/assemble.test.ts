import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, int, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Formatter, Result } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { assemble } from "#pantry/model/assemble.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import { foldGrammarOf, namesOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows } from "#pantry/model/xdm.ts";
import {
  caseHang,
  searchTimeout,
  corrupt,
  corruption,
  familiesOf,
  featuresOf,
  idOf,
  isRowCorruption,
  rowVariants,
  scrambledIdOf,
  situationsOf,
  xdmDocument,
} from "#pantry/test/gen/xdm.ts";
import type {
  GeneratedXdm,
  InvalidVariant,
  Placed,
  RowCorruption,
  VariantField,
  VariantTarget,
  XdmFamily,
  XdmFeature,
} from "#pantry/test/gen/xdm.ts";

/**
 * The composed grammar every property draws its trees over.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The names every tree is converted back to a crust tree under.
 */
const names = namesOf(grammar);

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The lists of {@link FlatRows} other than the document row.
 */
type RowList = Exclude<keyof FlatRows<Composed>, "document">;

/**
 * Every list of rows, each shuffled by the case.
 */
const rowLists = [
  "attributeEntities",
  "attributes",
  "comments",
  "doctypes",
  "entityRefs",
  "namespaces",
  "nodes",
  "openElementNames",
  "openNames",
  "pis",
  "texts",
  "whitespace",
] as const satisfies readonly RowList[];

/**
 * The lists whose rows another row names by key, so each must be there: the rows of character
 * data and the doctype, an attribute's open name, and a foreign element's name.
 */
const keyedLists = [
  "comments",
  "doctypes",
  "entityRefs",
  "openElementNames",
  "openNames",
  "pis",
  "texts",
  "whitespace",
] as const satisfies readonly RowList[];

/**
 * The refusal a repeated row of each list meets: a node row takes its own start twice, the
 * document node's too; an attribute or a namespace declaration its own slot twice; and any other
 * row is taken once, so its second is left over.
 */
const repeatedRefusal = {
  attributeEntities: "RowUnreached",
  attributes: "SlotTaken",
  comments: "RowUnreached",
  doctypes: "RowUnreached",
  entityRefs: "RowUnreached",
  namespaces: "SlotTaken",
  nodes: "StartTaken",
  openElementNames: "RowUnreached",
  openNames: "RowUnreached",
  pis: "RowUnreached",
  texts: "RowUnreached",
  whitespace: "RowUnreached",
} as const satisfies Readonly<Record<RowList, AssembleError["_tag"]>>;

/**
 * Shuffle every list of a document's rows, as a scan in any order returns them.
 *
 * @param rows - The rows.
 * @returns A generator of the same rows, each list in a drawn order.
 */
const shuffledRows =
  (rows: FlatRows<Composed>): Gen<FlatRows<Composed>> =>
  (source) => {
    const shuffle = <Row>(list: readonly Row[]): readonly Row[] =>
      source.draw(shuffled(list, { max: list.length, min: list.length }));

    return {
      attributeEntities: shuffle(rows.attributeEntities),
      attributes: shuffle(rows.attributes),
      comments: shuffle(rows.comments),
      doctypes: shuffle(rows.doctypes),
      document: rows.document,
      entityRefs: shuffle(rows.entityRefs),
      namespaces: shuffle(rows.namespaces),
      nodes: shuffle(rows.nodes),
      openElementNames: shuffle(rows.openElementNames),
      openNames: shuffle(rows.openNames),
      pis: shuffle(rows.pis),
      texts: shuffle(rows.texts),
      whitespace: shuffle(rows.whitespace),
    };
  };

/**
 * Fold a generated tree, which is total on the trees the generator builds.
 *
 * @param generated - The case.
 * @returns Its folded rows, under {@link idOf}.
 */
const foldedOf = (generated: GeneratedXdm) =>
  Effect.orDie(Effect.fromResult(fold(generated.document, idOf, foldGrammarOf(grammar))));

/**
 * Assemble rows that must be refused.
 *
 * @param rows - The rows.
 * @returns The refusal; a failure with the document when they assemble.
 */
const refusalOf = (rows: FlatRows<Composed>) => Effect.flip(Effect.fromResult(assemble(rows)));

/**
 * The nodes a refusal names: the row that failed its check, and for two rows at one start the
 * row that held it first.
 *
 * @param refusal - The refusal.
 * @returns The ids it names.
 */
const namedBy = (refusal: AssembleError): ReadonlySet<string> => {
  switch (refusal._tag) {
    case "StartTaken": {
      return new Set([refusal.node, refusal.other]);
    }
    case "SlotBeyond":
    case "SlotTaken": {
      return new Set([refusal.owner]);
    }
    case "RowUnreached":
    case "RowMissing": {
      return new Set([refusal.key]);
    }
    case "DocumentInterval":
    case "EndBeyondParent":
    case "IdRepeated":
    case "IntervalEmpty":
    case "LeafOversized":
    case "NodeMisplaced":
    case "ParentNotOpen":
    case "RootMissing":
    case "SlotOutOfTurn":
    case "StartBeyond": {
      return new Set([refusal.node]);
    }
    default: {
      return refusal satisfies never;
    }
  }
};

/**
 * The kinds of node that hold no children and keep their content in a row of their kind.
 */
const leafKinds: ReadonlySet<string> = new Set([
  "comment",
  "doctype",
  "entityRef",
  "pi",
  "text",
  "ws",
]);

/**
 * The refusal a row variant meets, as the refusal's tag and the model number of the node it names,
 * from the scan's checks in document order: the first row, by start, that a variant's edit makes
 * fail is the one refused.
 *
 * - A slot out of order fails the slot check at the node itself.
 * - A second row of an id over a start of its own is a repeated id, and a start taken from the node
 *   before collides where the rows are placed by start.
 * - A second root, a cycle or an orphan names a parent that is not open at the node's start.
 * - A doctype after the root element sits at a slot of the document node other than its first, where
 *   XML's `document` production places none.
 * - A wrong size moves every later start on, so the last node starts past the document's last start;
 *   when the node is itself the last, the document node's interval grows past `[0, N)`.
 * - A predecessor that overlaps its successor is an oversized leaf when it is one, and otherwise an
 *   element still open at the successor's start, which is not the successor's parent.
 * - A predecessor that ends early holds no node when it has no children, and otherwise its last child
 *   leaves its interval: past its end when that child starts inside it, and outside it altogether
 *   when the child is childless, so it starts at the end.
 * - A parent that ends inside its last child leaves that child's end beyond its own.
 *
 * @param model - The valid tree's model.
 * @param variant - The variant.
 * @returns The refusals it may meet, each a tag and a node's number.
 */
const expectedFor = (
  model: readonly Placed[],
  variant: RowCorruption,
): readonly (readonly [AssembleError["_tag"], number])[] => {
  const numbered = model.map((placed, number) => ({ ...placed, number }));
  const childrenOf = Map.groupBy(numbered.slice(1), ({ parent }) => parent);
  const isChildless = (number: number) => !childrenOf.has(number);
  const lastOf = (number: number) => childrenOf.get(number)?.at(-1)?.number ?? -1;
  const before = (number: number) =>
    (childrenOf.get(model[number]?.parent ?? -1) ?? []).find(
      ({ at }) => at === (model[number]?.at ?? 0) - 1,
    )?.number ?? -1;
  switch (variant._tag) {
    case "gap":
    case "duplicateSlot": {
      return [["SlotOutOfTurn", variant.node]];
    }
    case "secondParent": {
      return [["IdRepeated", variant.node]];
    }
    case "startTaken": {
      return [
        ["StartTaken", variant.node],
        ["StartTaken", variant.node - 1],
      ];
    }
    case "secondRoot":
    case "cycle":
    case "orphan": {
      return [["ParentNotOpen", variant.node]];
    }
    case "doctypeNotFirst": {
      return [["NodeMisplaced", variant.node]];
    }
    case "wrongSize": {
      return variant.node === model.length - 1
        ? [["DocumentInterval", 0]]
        : [["StartBeyond", model.length - 1]];
    }
    case "overlappingSiblings": {
      const predecessor = before(variant.node);

      return leafKinds.has(model[predecessor]?.kind ?? "")
        ? [["LeafOversized", predecessor]]
        : [["ParentNotOpen", variant.node]];
    }
    case "gapBetweenSiblings": {
      const predecessor = before(variant.node);
      if (isChildless(predecessor)) {
        return [["IntervalEmpty", predecessor]];
      }

      const last = lastOf(predecessor);

      return isChildless(last) ? [["ParentNotOpen", last]] : [["EndBeyondParent", last]];
    }
    case "childOutsideParent": {
      return [["EndBeyondParent", lastOf(variant.node)]];
    }
    default: {
      return variant satisfies never;
    }
  }
};

describe("assemble", { timeout: searchTimeout }, () => {
  it.effect(
    "gives back every generated tree from its rows, under ids in any order and every list in any order, to the same canonical bytes",
    (ctx) =>
      // Oracle: a universal one, the round trip assemble ∘ flatten = id, and the canonical bytes of
      // the tree assembled equal to the source tree's; row order is not data.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<XdmFeature | XdmFamily>(
              [
                "element",
                "wildcard",
                "text",
                "ws",
                "comment",
                "pi",
                "entityRef",
                "attribute",
                "openName",
                "repeatedOpenClass",
                "doctype",
              ],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/assemble-round-trip",
          },
          (generated, c) =>
            Effect.gen(function* roundTrip() {
              c.noteAll(featuresOf(generated.document));
              c.noteAll(familiesOf(generated.model));

              const ids = c.draw(element([idOf, scrambledIdOf]));
              const rows = c.draw(shuffledRows(flatten(generated.document, ids)));
              const assembled = yield* Effect.fromResult(assemble(rows));

              assert.deepStrictEqual(assembled, generated.document);
              assert.deepStrictEqual(
                canonicalize(toXmlDocument(assembled, names)),
                canonicalize(toXmlDocument(generated.document, names)),
              );
            }),
        ),
      ),
  );

  it.effect(
    "refuses each named row variant by the first check its edit fails in document order, naming its node",
    (ctx) =>
      // Oracle: the specification as a checker, trees.md §6: rows sorted by start rebuild the
      // document with one stack, refusing a row whose start is taken or past the last, whose parent
      // is not the open element, whose slot is not that element's next, or whose interval leaves
      // its parent's, is empty, or holds more than a leaf; each variant's first failing row is
      // read off the valid tree's model ({@link expectedFor}).
      // Bound: the generator's drawn bounds, every row variant a tree admits.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<InvalidVariant | VariantField | VariantTarget>(rowVariants, {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/assemble-row-variants",
          },
          (generated, c) =>
            Effect.gen(function* rowVariant() {
              const variant = c.draw(corruption(generated, rowVariants));
              if (!isRowCorruption(variant)) {
                assert.fail(`drew ${variant._tag}, which is no row variant`);
              }

              c.noteAll(situationsOf(generated, variant));

              const rows = yield* foldedOf(generated);
              const refusal = yield* refusalOf(c.draw(shuffledRows(corrupt(rows, variant))));
              const named = namedBy(refusal);

              assert.isTrue(
                expectedFor(generated.model, variant).some(
                  ([tag, number]) => tag === refusal._tag && named.has(idOf(number)),
                ),
                `${variant._tag}: ${refusal._tag} naming ${[...named].join(", ")}`,
              );
            }),
        ),
      ),
  );

  /**
   * The ways a set of rows leaves flatten's image beside the row variants: a row another names is
   * missing, a row is repeated, or a node is of a kind its parent cannot hold.
   */
  type Outside = "missing" | "repeated" | "misplaced";

  it.effect(
    "refuses rows outside flatten's image: a row another names missing, any row repeated, a node of a kind its parent cannot hold",
    (ctx) =>
      // Oracle: the specification as a checker, the rows flatten writes for some tree.
      // Bound: the generator's drawn bounds, one edit a case.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Outside>(["missing", "repeated", "misplaced"], {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/assemble-outside-image",
          },
          (generated, c) =>
            Effect.gen(function* outsideImage() {
              const rows = flatten(generated.document, idOf);
              const named = keyedLists.filter((list) => rows[list].length > 0);
              const listed = rowLists.filter((list) => rows[list].length > 0);
              const runs = [...rows.texts, ...rows.whitespace];
              const edit = c.draw(
                element([
                  "repeated",
                  ...(Arr.isReadonlyArrayNonEmpty(named) ? (["missing"] as const) : []),
                  ...(Arr.isReadonlyArrayNonEmpty(runs) ? (["misplaced"] as const) : []),
                ] as const),
              );
              c.note(edit);
              switch (edit) {
                case "missing": {
                  if (!Arr.isReadonlyArrayNonEmpty(named)) {
                    assert.fail("drew a missing row from rows with no keyed list");
                  }

                  const list = c.draw(element(named));
                  const at = c.draw(int(0, rows[list].length - 1));
                  const refusal = yield* refusalOf({
                    ...rows,
                    [list]: rows[list].filter((_, index) => index !== at),
                  });

                  assert.deepStrictEqual(
                    [refusal._tag, refusal._tag === "RowMissing" ? refusal.rows : ""],
                    ["RowMissing", list],
                  );
                  break;
                }
                case "repeated": {
                  if (!Arr.isReadonlyArrayNonEmpty(listed)) {
                    assert.fail("drew a repeated row from rows with no list");
                  }

                  const list = c.draw(element(listed));
                  const at = c.draw(int(0, rows[list].length - 1));
                  const refusal = yield* refusalOf({
                    ...rows,
                    [list]: [...rows[list], ...rows[list].slice(at, at + 1)],
                  });

                  assert.strictEqual(refusal._tag, repeatedRefusal[list]);
                  break;
                }
                case "misplaced": {
                  if (!Arr.isReadonlyArrayNonEmpty(runs)) {
                    assert.fail("drew a misplaced node from rows with no character data");
                  }

                  const run = c.draw(element(runs));
                  const refusal = yield* refusalOf({
                    ...rows,
                    doctypes: [...rows.doctypes, run],
                    nodes: rows.nodes.map((row) =>
                      row.id === run.node ? { ...row, kind: "doctype" } : row,
                    ),
                    texts: rows.texts.filter((row) => row !== run),
                    whitespace: rows.whitespace.filter((row) => row !== run),
                  });

                  assert.deepStrictEqual(
                    [refusal._tag, [...namedBy(refusal)]],
                    ["NodeMisplaced", [run.node]],
                  );
                  break;
                }
                default: {
                  assert.fail(`no edit ${String(edit satisfies never)}`);
                }
              }
            }),
        ),
      ),
  );
});
