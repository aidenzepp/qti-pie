import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element, int, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Formatter, Option, Result } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { assemble } from "#pantry/model/assemble.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import { foldGrammarOf, namesOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { flatten, none } from "#pantry/model/xdm.ts";
import type {
  DocumentRow,
  FlatRows,
  NodeId,
  NodeRow,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
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
 * Read a refusal as the list it names and how its row leaves the image, or its tag when it is not
 * a row outside the image.
 *
 * @param refusal - The refusal.
 * @returns The list and the departure's tag, or the refusal's tag.
 */
const departureOf = (refusal: AssembleError): readonly [string, string] =>
  refusal._tag === "RowsOutsideImage"
    ? [refusal.rows, refusal.departure._tag]
    : [refusal._tag, refusal.message];

/**
 * The versions, prefixes and governing types the small box's trees draw from, every value a single
 * edit of a node row's field gives it.
 */
const smallVersions = ["3.0.0", "3.0.1"] as const satisfies readonly Composed["version"][];

/**
 * The prefixes an element of the small box is written with.
 */
const smallPrefixes = ["", "q"] as const;

/**
 * The governing types an element of the small box has, {@link none} among them.
 */
const smallGoverns = ["g", "h", none] as const;

/**
 * Every element of the small box over its children: of kind `p`, under each prefix and governing
 * type.
 *
 * @param children - Its children.
 * @returns The elements.
 */
const elementsOver = (
  children: readonly XdmChild<Composed>[],
): readonly XdmClosedElement<Composed>[] =>
  smallPrefixes.flatMap((prefix) =>
    smallGoverns.map((governs): XdmClosedElement<Composed> => ({
      _tag: "element",
      attributes: [],
      children,
      governs,
      kind: "p",
      namespaces: [],
      prefix,
    })),
  );

/**
 * Every forest of the small box of exactly `size` nodes: each first subtree, then each forest of
 * the rest. A subtree of one node is a text, a comment or an empty element, and one of more is an
 * element over a forest of the rest.
 *
 * @param size - The nodes the forest holds.
 * @returns The forests.
 */
const forestsOf = (size: number): readonly (readonly XdmChild<Composed>[])[] =>
  size === 0
    ? [[]]
    : Array.from({ length: size }, (_, at) => at + 1).flatMap((first) =>
        [
          ...(first === 1
            ? ([
                { _tag: "text", value: "t" },
                { _tag: "comment", value: "c" },
              ] as const)
            : []),
          ...forestsOf(first - 1).flatMap(elementsOver),
        ].flatMap((tree) => forestsOf(size - first).map((rest) => [tree, ...rest])),
      );

/**
 * The nodes the small box's documents hold below the document node, at most.
 */
const SMALL_NODES = 3;

/**
 * Every document of the small box: at most {@link SMALL_NODES} nodes below the document node, the
 * root element's subtree and a doctype and comments around it, in each version.
 */
const smallDocuments: readonly XdmDocument<Composed>[] = smallVersions.flatMap((version) =>
  Array.from({ length: SMALL_NODES }, (_, below) => below).flatMap((below) =>
    forestsOf(below)
      .flatMap(elementsOver)
      .flatMap((root) =>
        Array.from({ length: SMALL_NODES - below }, (_, around) => around).flatMap((around) =>
          [false, true]
            .filter((doctype) => Number(doctype) <= around)
            .flatMap((doctype) =>
              Array.from({ length: around - Number(doctype) + 1 }, (_, prolog) => prolog).map(
                (prolog): XdmDocument<Composed> => ({
                  _tag: "document",
                  charset: "utf-8",
                  declaration: Option.none(),
                  doctype: doctype ? Option.some("<!DOCTYPE p>") : Option.none(),
                  epilog: Array.from({ length: around - Number(doctype) - prolog }, () => ({
                    _tag: "comment",
                    value: "e",
                  })),
                  exportCharset: "utf-8",
                  prolog: Array.from({ length: prolog }, () => ({ _tag: "comment", value: "c" })),
                  root,
                  version,
                }),
              ),
            ),
        ),
      ),
  ),
);

/**
 * A row's text: every field, by name, as a string.
 *
 * @param row - The row.
 * @returns The text.
 */
const lineOf = (row: DocumentRow | FlatRows<Composed>[RowList][number]): string =>
  Object.entries(row)
    .toSorted(([left], [right]) => (left < right ? -1 : 1))
    .map(([field, value]) => `${field}=${String(value)}`)
    .join(";");

/**
 * The rows' canonical form, the oracle's key: each node renamed to {@link idOf} its start, every
 * list's rows as sorted text. Rows `flatten` writes number their nodes by start, 0 to N − 1 once
 * each, under ids held once, and every id they hold is a node's, so rows with no such renaming have
 * none, and are no tree's.
 *
 * @param rows - The rows, with no attribute rows.
 * @returns The canonical form, none when the rows have no renaming by start.
 */
const canonicalOf = (rows: FlatRows<Composed>): Option.Option<string> => {
  const starts = rows.nodes
    .map(({ start }) => Number(start))
    .toSorted((left, right) => left - right);
  const ids = new Map(rows.nodes.map(({ id, start }) => [id, idOf(Number(start))]));
  if (!starts.every((start, at) => start === at) || ids.size !== rows.nodes.length) {
    return Option.none();
  }

  const renamed = (id: NodeId): Option.Option<NodeId> => Option.fromNullishOr(ids.get(id));
  const byNode = <Row extends { readonly node: NodeId }>(list: readonly Row[]) =>
    Option.all(list.map((row) => Option.map(renamed(row.node), (node) => ({ ...row, node }))));

  return Option.map(
    Option.all({
      comments: byNode(rows.comments),
      doctypes: byNode(rows.doctypes),
      document: Option.map(renamed(rows.document.node), (node) => [{ ...rows.document, node }]),
      nodes: Option.all(
        rows.nodes.map((row) =>
          Option.map(Option.all([renamed(row.id), renamed(row.parent)]), ([id, parent]) => ({
            ...row,
            id,
            parent,
          })),
        ),
      ),
      texts: byNode(rows.texts),
    }),
    (lists) =>
      Object.entries(lists)
        .toSorted(([left], [right]) => (left < right ? -1 : 1))
        .map(([list, held]) => `${list}: ${held.map(lineOf).toSorted().join(" | ")}`)
        .join("\n"),
  );
};

/**
 * Every document of the small box by its rows' canonical form: the image the oracle reads.
 */
const smallImage: ReadonlyMap<string, XdmDocument<Composed>> = new Map(
  smallDocuments.map((document) => [
    Option.getOrThrow(canonicalOf(flatten(document, idOf))),
    document,
  ]),
);

/**
 * An edit of one field of one node row, to a value of the field's type.
 */
type NodeEdit =
  | { readonly field: "at" | "end" | "start"; readonly value: bigint }
  | { readonly field: "id" | "parent"; readonly value: NodeId }
  | { readonly field: "kind"; readonly value: NodeRow<Composed>["kind"] }
  | { readonly field: "governs" | "prefix"; readonly value: string }
  | { readonly field: "version"; readonly value: Composed["version"] };

/**
 * Apply an edit to a node row.
 *
 * @param row - The row.
 * @param edit - The edit.
 * @returns The row with the edited field.
 */
const editedRow = (row: NodeRow<Composed>, edit: NodeEdit): NodeRow<Composed> => {
  switch (edit.field) {
    case "at":
    case "end":
    case "start":
    case "id":
    case "parent":
    case "governs":
    case "prefix": {
      return { ...row, [edit.field]: edit.value };
    }
    case "kind": {
      return { ...row, kind: edit.value };
    }
    case "version": {
      return { ...row, version: edit.value };
    }
    default: {
      return edit satisfies never;
    }
  }
};

/**
 * Every edit of a node row's fields the small box makes: each slot and interval bound from 0 to 4,
 * each id of the document's nodes and one no node holds as the row's id or parent, each kind of the
 * box, and each prefix, governing type and version, all but the row's own value.
 *
 * @param row - The row.
 * @param nodes - The document's node rows.
 * @returns The edits.
 */
const editsOf = (
  row: NodeRow<Composed>,
  nodes: readonly NodeRow<Composed>[],
): readonly NodeEdit[] => {
  const bounds = [0n, 1n, 2n, 3n, 4n];
  const ids = [...nodes.map(({ id }) => id), idOf(99)];
  const kinds = ["document", "p", "text", "comment", "doctype"] as const;
  const edits: readonly NodeEdit[] = [
    ...(["at", "end", "start"] as const).flatMap((field) =>
      bounds.map((value): NodeEdit => ({ field, value })),
    ),
    ...(["id", "parent"] as const).flatMap((field) =>
      ids.map((value): NodeEdit => ({ field, value })),
    ),
    ...kinds.map((value): NodeEdit => ({ field: "kind", value })),
    ...smallPrefixes.map((value): NodeEdit => ({ field: "prefix", value })),
    ...smallGoverns.map((value): NodeEdit => ({ field: "governs", value })),
    ...smallVersions.map((value): NodeEdit => ({ field: "version", value })),
  ];

  return edits.filter((edit) => row[edit.field] !== edit.value);
};

/**
 * One case of the small box: a document's rows, unedited or with one node row's field edited.
 */
interface SmallCase {
  readonly document: number;
  readonly edit: Option.Option<{ readonly edit: NodeEdit; readonly node: number }>;
}

/**
 * The documents the small box edits: each shape once, every element unprefixed and governed by
 * `g`, in 3.0.1.
 */
const editedDocuments = smallDocuments.filter((document) =>
  flatten(document, idOf).nodes.every(
    ({ governs, kind, prefix, version }) =>
      version === "3.0.1" && prefix === "" && (kind !== "p" || governs === "g"),
  ),
);

/**
 * Every case of the small box.
 */
const smallCases: readonly SmallCase[] = editedDocuments.flatMap((document, at) => {
  const { nodes } = flatten(document, idOf);

  return [
    { document: at, edit: Option.none() },
    ...nodes.flatMap((row, node) =>
      editsOf(row, nodes).map((edit) => ({ document: at, edit: Option.some({ edit, node }) })),
    ),
  ];
});

/**
 * Write a small case's rows.
 *
 * @param drawnCase - The case.
 * @returns The rows of its document, with its edit applied.
 */
const smallRowsOf = ({ document, edit }: SmallCase): FlatRows<Composed> => {
  const rows = flatten(Arr.getUnsafe(editedDocuments, document), idOf);

  return Option.match(edit, {
    onNone: () => rows,
    onSome: ({ edit: change, node }) => ({
      ...rows,
      nodes: rows.nodes.map((row, at) => (at === node ? editedRow(row, change) : row)),
    }),
  });
};

/**
 * What the small box must reach: rows the image holds and rows it does not, and an edit of every
 * field.
 */
type SmallFeature = "inside" | "outside" | NodeEdit["field"];

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
            oracle: {
              kind: "universal",
              name: "the round trip assemble ∘ flatten = id, to the same canonical bytes",
            },
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

  it.effect("refuses each named row variant as a node row outside flatten's image", (ctx) =>
    // Oracle: the specification as a checker, trees.md §6: every row variant edits a node's id,
    // parent, slot or interval so that no tree's rows hold it, and the document row and every
    // other list are as the tree wrote them, so the nodes list is the first to leave the image.
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
          oracle: {
            kind: "specification",
            name: "trees.md §6: a row variant's node rows are no tree's, its other rows its tree's",
          },
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

            assert.deepStrictEqual(
              [refusal._tag, refusal._tag === "RowsOutsideImage" ? refusal.rows : ""],
              ["RowsOutsideImage", "nodes"],
              `${variant._tag}: ${refusal.message}`,
            );
          }),
      ),
    ),
  );

  /**
   * The ways a set of rows leaves flatten's image beside the row variants: a row another names is
   * missing, a row is repeated, a node is of a kind its parent cannot hold, or an attribute or
   * namespace declaration stands past its family's last slot.
   */
  type Outside = "missing" | "repeated" | "misplaced" | "slot";

  it.effect(
    "refuses rows outside flatten's image: a row another names missing, any row repeated, a node of a kind its parent cannot hold, a family row past its last slot",
    (ctx) =>
      // Oracle: the specification as a checker, the rows flatten writes for some tree.
      // Bound: the generator's drawn bounds, one edit a case.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Outside>(["missing", "repeated", "misplaced", "slot"], {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the rows flatten writes for some tree: a row missing, repeated, misplaced or past its family's slots leaves that image",
            },
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
              const slotted = (["attributes", "namespaces"] as const).filter(
                (list) => rows[list].length > 0,
              );
              const edit = c.draw(
                element([
                  "repeated",
                  ...(Arr.isReadonlyArrayNonEmpty(named) ? (["missing"] as const) : []),
                  ...(Arr.isReadonlyArrayNonEmpty(runs) ? (["misplaced"] as const) : []),
                  ...(Arr.isReadonlyArrayNonEmpty(slotted) ? (["slot"] as const) : []),
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

                  assert.deepStrictEqual(departureOf(refusal), [list, "repeated"]);
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

                  const parent =
                    rows.nodes.find(({ id }) => id === run.node)?.parent ??
                    assert.fail("drew a run whose node has no row");

                  assert.deepStrictEqual(
                    refusal._tag === "RowsOutsideImage"
                      ? { departure: refusal.departure, key: refusal.key, rows: refusal.rows }
                      : refusal._tag,
                    {
                      departure: { _tag: "unplaced", kind: "doctype", under: parent },
                      key: run.node,
                      rows: "nodes",
                    },
                  );
                  break;
                }
                case "slot": {
                  if (!Arr.isReadonlyArrayNonEmpty(slotted)) {
                    assert.fail("drew a family row past its slots from rows with no family rows");
                  }

                  const list = c.draw(element(slotted));
                  const held: readonly { readonly at: bigint; readonly node: NodeId }[] =
                    rows[list];
                  const moved = Arr.getUnsafe(held, c.draw(int(0, held.length - 1)));
                  const past = BigInt(held.filter(({ node }) => node === moved.node).length);
                  const bump = <Row extends { readonly at: bigint; readonly node: NodeId }>(
                    row: Row,
                  ): Row => (Object.is(row, moved) ? { ...row, at: past } : row);
                  const refusal = yield* refusalOf(
                    list === "attributes"
                      ? { ...rows, attributes: rows.attributes.map(bump) }
                      : { ...rows, namespaces: rows.namespaces.map(bump) },
                  );
                  const [rowsOf, departure] = departureOf(refusal);

                  assert.strictEqual(rowsOf, list);
                  assert.include(["differs", "lacked"], departure);
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

  it.effect(
    "assembles exactly the rows flatten writes for some tree, over every small document and every single-field edit of a node row",
    (ctx) =>
      // Oracle: the image, enumerated: every document of at most three nodes below the document
      // node, its rows' canonical form, renamed by start, against the edited rows'. Rows the image
      // holds assemble to their document; rows it does not are refused.
      // Bound: every such document in each version, prefix and governing type, and every edit of
      // one field of one node row to each value of the box.
      searched(
        ctx,
        exhaust(
          {
            box: `every document of at most ${String(SMALL_NODES)} nodes below the document node, unedited and with each single-field edit of a node row: ${String(smallCases.length)} cases`,
            caseHang,
            coverage: requiredInSpace<SmallFeature>([
              "inside",
              "outside",
              "at",
              "end",
              "start",
              "id",
              "parent",
              "kind",
              "prefix",
              "governs",
              "version",
            ]),
            generator: (source) =>
              Arr.getUnsafe(smallCases, source.draw(int(0, smallCases.length - 1))),
            limit: smallCases.length,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the image of every small document, enumerated, by canonical form",
            },
            suite: "model/assemble-small-image",
          },
          (drawnCase, c) =>
            Effect.sync(() => {
              const rows = smallRowsOf(drawnCase);
              const inside = Option.flatMap(canonicalOf(rows), (key) =>
                Option.fromNullishOr(smallImage.get(key)),
              );
              const got = assemble(rows);
              c.note(Option.isSome(inside) ? "inside" : "outside");
              if (Option.isSome(drawnCase.edit)) {
                c.note(drawnCase.edit.value.edit.field);
              }

              Option.match(inside, {
                onNone: () => {
                  assert.isTrue(Result.isFailure(got), "rows outside the image assembled");
                },
                onSome: (document) => {
                  assert.deepStrictEqual(Result.getOrThrow(got), document);
                },
              });
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, smallCases.length);
          }),
        ),
      ),
  );
});
