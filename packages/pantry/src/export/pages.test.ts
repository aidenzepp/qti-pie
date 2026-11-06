import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, increasing, int } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Brand, Effect, Formatter, Option, Result, Stream } from "effect";
import type { Page, PageCursor } from "@bjornpagen/grizzle";
import {
  DocumentRowCount,
  XmlVersionUnread,
  addRow,
  assembleScan,
  emptyScan,
  scannedRows,
} from "#pantry/export/pages.ts";
import type { ScanRow } from "#pantry/export/pages.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";
import {
  caseHang,
  featuresOf,
  idOf,
  scrambledIdOf,
  searchTimeout,
  xdmDocument,
} from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";

/**
 * The composed grammar every property draws its trees over.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The query a fake page is of, which only its cursors' type names.
 */
type FakeScan = "fake document scan";

/**
 * A cursor of the fake scan: `<page>:<row>`, the boundary after one row of one page.
 */
const cursorOf = Brand.nominal<PageCursor<FakeScan>>();

/**
 * Key a list of rows by their node.
 *
 * @param list - Rows keyed by a node, one each.
 * @returns The rows by node.
 */
const byNode = <Row extends { readonly node: NodeId }>(list: readonly Row[]) =>
  new Map(list.map((row) => [row.node, row]));

/**
 * Order family rows by slot.
 *
 * @param left - One row.
 * @param right - The other.
 * @returns Negative, zero or positive as `left`'s slot is below, at or above `right`'s.
 */
const bySlot = (left: { readonly at: bigint }, right: { readonly at: bigint }): number =>
  Number(left.at - right.at);

/**
 * The scan of one document as the database delivers it, built from the document's rows without
 * the code under test: each node row in `start` order with its characters (a text or whitespace
 * run's, an entity reference's `&name;`) and the rows keyed by it attached, its attributes and
 * namespace declarations in `at` order, and an attribute's entity references in offset order with
 * its open name.
 *
 * @param rows - The rows `flatten` writes for a document.
 * @returns The document's scan rows, in `start` order.
 */
const scanOf = (rows: FlatRows<Composed>): readonly ScanRow<Composed>[] => {
  const texts = byNode(rows.texts);
  const whitespace = byNode(rows.whitespace);
  const comments = byNode(rows.comments);
  const pis = byNode(rows.pis);
  const entityRefs = byNode(rows.entityRefs);
  const doctypes = byNode(rows.doctypes);
  const openElementNames = byNode(rows.openElementNames);
  const attributes = Map.groupBy(rows.attributes, ({ node }) => node);
  const namespaces = Map.groupBy(rows.namespaces, ({ node }) => node);
  const openNames = Map.groupBy(rows.openNames, ({ attribute }) => attribute);
  const references = Map.groupBy(rows.attributeEntities, ({ attribute }) => attribute);

  const charsOf = (node: NodeId): string => {
    const reference = entityRefs.get(node);

    return (
      texts.get(node)?.value ??
      whitespace.get(node)?.value ??
      (reference === undefined ? "" : `&${reference.name};`)
    );
  };

  return rows.nodes
    .toSorted((left, right) => Number(left.start - right.start))
    .map((node): ScanRow<Composed> => ({
      ...node,
      attributes: (attributes.get(node.id) ?? []).toSorted(bySlot).map((attribute) => ({
        at: attribute.at,
        entities: (references.get(attribute.id) ?? [])
          .toSorted((left, right) => Number(left.offset - right.offset))
          .map(({ name, offset }) => ({ name, offset })),
        id: attribute.id,
        lexical: attribute.lexical,
        name: attribute.name,
        openName: (openNames.get(attribute.id) ?? []).map(({ local, uri }) => ({ local, uri })),
        prefix: attribute.prefix,
      })),
      chars: charsOf(node.id),
      comment: Option.fromNullishOr(comments.get(node.id)).pipe(
        Option.map(({ value }) => ({ value })),
      ),
      doctype: Option.fromNullishOr(doctypes.get(node.id)).pipe(
        Option.map(({ value }) => ({ value })),
      ),
      documentRow:
        node.id === rows.document.node
          ? Option.some({
              charset: rows.document.charset,
              encoding: rows.document.encoding,
              exportCharset: rows.document.exportCharset,
              standalone: rows.document.standalone,
              xmlVersion: rows.document.xmlVersion,
            })
          : Option.none(),
      namespaces: (namespaces.get(node.id) ?? [])
        .toSorted(bySlot)
        .map(({ at, prefix, uri }) => ({ at, prefix, uri })),
      openElementName: Option.fromNullishOr(openElementNames.get(node.id)).pipe(
        Option.map(({ local, namespace }) => ({ local, namespace })),
      ),
      pi: Option.fromNullishOr(pis.get(node.id)).pipe(
        Option.map(({ data, target }) => ({ data, target })),
      ),
    }));
};

/**
 * Cut a scan into pages at the given boundaries.
 *
 * @param scan - The scan rows, in order.
 * @param cuts - The boundaries, strictly increasing, each between 1 and the row count less one: a
 *   cut at `k` starts a page at row `k`.
 * @returns The pages, none empty, whose concatenation is the scan.
 */
const pagesOf = <Row>(scan: readonly Row[], cuts: readonly number[]): readonly (readonly Row[])[] =>
  [0, ...cuts].map((from, index) => scan.slice(from, cuts[index] ?? scan.length));

/**
 * Serve pages as `db.page` does, from a fixed list: each edge's cursor is the boundary after its
 * row, no `after` asks for the first page, and an `after` at the end of a page asks for the next;
 * each page says whether another follows. The requested size is not read, so the list's cuts are
 * where the pages end, which `db.page`'s contract leaves to the server.
 *
 * @param pages - The pages served, in order.
 * @returns A page reader over them, which fails the case on a cursor that is no page's end: one
 *   inside a page, so a reader that resumes there reads part of it again, or one it never gave.
 */
const pager =
  <Row>(pages: readonly (readonly Row[])[]) =>
  (request: { readonly after?: PageCursor<unknown> }): Effect.Effect<Page<Row, FakeScan>> =>
    Effect.sync(() => {
      const [page = "", row = ""] = request.after?.split(":") ?? [];
      const ended = pages[Number(page)];
      const number = request.after === undefined ? 0 : Number(page) + 1;
      const rows = pages[number];
      if (
        rows === undefined ||
        (request.after !== undefined && Number(row) !== (ended?.length ?? 0) - 1)
      ) {
        assert.fail(`the scan asked for the rows after ${String(request.after)}, no page's end`);
      }

      const cursors = rows.map((_, index) => cursorOf(`${String(number)}:${String(index)}`));

      return {
        edges: rows.map((node, index) => ({ cursor: cursors[index] ?? cursorOf(""), node })),
        pageInfo: {
          endCursor: Option.fromNullishOr(cursors.at(-1)),
          hasNextPage: number < pages.length - 1,
          hasPreviousPage: number > 0,
          startCursor: Option.fromNullishOr(cursors[0]),
        },
      };
    });

/**
 * Assemble a document from its scan served in the given pages, through the export's own stream
 * and fold.
 *
 * @param document - The document node's id.
 * @param pages - The pages the fake scan serves.
 * @returns The document, or the refusal of the rows the pages held.
 */
const assembledFrom = (document: NodeId, pages: readonly (readonly ScanRow<Composed>[])[]) =>
  Effect.map(Stream.runFold(scannedRows(pager(pages), 1), emptyScan<Composed>, addRow), (scan) =>
    assembleScan(document, scan),
  );

/**
 * The most nodes a document has for every cut of its scan to be tried: its N − 1 boundaries give
 * 2^(N − 1) cut sets, 512 at this bound.
 */
const exhaustiveNodes = 10;

/**
 * How many cut sets are drawn for a document past {@link exhaustiveNodes}, beside its single
 * cuts' extremes and its uniform pages.
 */
const drawnCuts = 6;

/**
 * Every set of boundaries of a scan of `count` rows.
 *
 * @param count - The rows.
 * @returns Each subset of 1 to `count` − 1, strictly increasing.
 */
const everyCut = (count: number): readonly (readonly number[])[] => {
  let sets: readonly (readonly number[])[] = [[]];
  for (let boundary = count - 1; boundary >= 1; boundary -= 1) {
    sets = sets.flatMap((set) => [set, [boundary, ...set]]);
  }

  return sets;
};

/**
 * The uniform cuts of a scan of `count` rows into pages of `size`, as `db.page` with
 * `{ first: size }` makes them.
 *
 * @param count - The rows.
 * @param size - The page size.
 * @returns The boundaries every `size` rows.
 */
const uniformCuts = (count: number, size: number): readonly number[] =>
  Array.from({ length: Math.ceil(count / size) - 1 }, (_, page) => (page + 1) * size);

/**
 * The situations a paging case reaches: the document's kinds of node, an entity reference inside
 * an attribute, whether the document writes an XML declaration, and how its cuts were chosen.
 */
type PagingFeature =
  | XdmFeature
  | "attributeReference"
  | "declared"
  | "undeclared"
  | "every cut"
  | "drawn cuts"
  | "one page"
  | "a page per row";

/**
 * The named ways a page stream departs from the scan: one page served twice in a row, as a page
 * whose lookahead repeats a boundary would; one page left out; a `Document` row on a node besides
 * the document node, which the mirror law of `Document` refuses in the database; and a `Document`
 * row whose XML version is no version, which its pattern refuses there.
 */
type PageVariant = "repeatedPage" | "droppedPage" | "secondDocumentRow" | "badXmlVersion";

describe("export/pages.ts", { timeout: searchTimeout }, () => {
  it.effect(
    "assembles every generated document to itself from its scan cut into pages at any boundaries, as from one page",
    (ctx) =>
      // Oracle: a universal one, a metamorphic relation: paging is invisible, so the scan served
      // as one page and as every cut of it assembles to the same document, the generated one.
      // Bound: the generator's drawn bounds, up to 200 nodes a tree; every cut set of a document
      // of at most 10 nodes, and past that the uniform pages of 1, 2 and 3 rows, a cut after the
      // first row and before the last, and 6 drawn cut sets.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<PagingFeature>(
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
                "attributeReference",
                "declared",
                "undeclared",
                "namespace",
                "doctype",
                "every cut",
                "drawn cuts",
              ],
              { cases: 200, sense: notesOnly },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "universal", name: "paging is invisible: every cut assembles alike" },
            runs: 200,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "export/pages-cuts",
          },
          (generated, c) =>
            Effect.gen(function* everyCutAlike() {
              c.noteAll(featuresOf(generated.document));
              c.note(Option.isSome(generated.document.declaration) ? "declared" : "undeclared");

              const rows = flatten(generated.document, c.draw(element([idOf, scrambledIdOf])));
              if (rows.attributeEntities.length > 0) {
                c.note("attributeReference");
              }

              const scan = scanOf(rows);
              const count = scan.length;
              const cuts =
                count <= exhaustiveNodes
                  ? everyCut(count)
                  : [
                      ...[1, 2, 3].map((size) => uniformCuts(count, size)),
                      [1],
                      [count - 1],
                      ...Array.from({ length: drawnCuts }, () =>
                        c.draw(increasing(1, count - 1, { max: count - 1, min: 1 })),
                      ),
                    ];
              c.note(count <= exhaustiveNodes ? "every cut" : "drawn cuts");

              const one = yield* assembledFrom(rows.document.node, [scan]);

              assert.deepStrictEqual(Result.getOrThrow(one), generated.document);
              for (const cut of cuts) {
                if (cut.length === 0) {
                  c.note("one page");
                }

                if (cut.length === count - 1) {
                  c.note("a page per row");
                }

                const paged = yield* assembledFrom(rows.document.node, pagesOf(scan, cut));

                assert.deepStrictEqual(paged, one, `cut at ${cut.join(", ")}`);
              }
            }),
        ),
      ),
  );

  it.effect(
    "refuses the document when a page of its scan is served twice or left out, a second node carries a Document row, or that row holds no XML version",
    (ctx) =>
      // Oracle: the specification as a checker: a document's rows are a set keyed by start, so a
      // page served twice repeats every start it holds and a page left out leaves its starts
      // empty, and assemble refuses both; and a document holds one Document row, on its document
      // node, whose XML version is none or a VersionNum. No defect of the page stream is absorbed.
      // Bound: the generator's drawn bounds, one drawn cut set, variant and page a case.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<PageVariant>(
              ["repeatedPage", "droppedPage", "secondDocumentRow", "badXmlVersion"],
              {
                cases: 200,
                sense: notesOnly,
              },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "a document's rows are a set keyed by start, with one Document row",
            },
            runs: 200,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "export/pages-variants",
          },
          (generated, c) =>
            Effect.gen(function* pageVariant() {
              const rows = flatten(generated.document, idOf);
              const scan = scanOf(rows);
              const cuts = c.draw(increasing(1, scan.length - 1, { max: scan.length - 1, min: 1 }));
              const pages = pagesOf(scan, cuts);
              const variant = c.draw(
                element([
                  "repeatedPage",
                  "droppedPage",
                  "secondDocumentRow",
                  "badXmlVersion",
                ] as const),
              );
              const at = c.draw(int(0, pages.length - 1));
              c.note(variant);

              switch (variant) {
                case "repeatedPage":
                case "droppedPage": {
                  const served =
                    variant === "repeatedPage"
                      ? [...pages.slice(0, at + 1), ...pages.slice(at)]
                      : [...pages.slice(0, at), ...pages.slice(at + 1)];
                  const assembled = yield* assembledFrom(rows.document.node, served);

                  assert.isTrue(
                    Result.isFailure(assembled),
                    `${variant} of page ${String(at)} of ${String(pages.length)} assembled`,
                  );
                  break;
                }
                case "secondDocumentRow": {
                  const [root, ...below] = scan;
                  const last = below.at(-1);
                  if (root === undefined || last === undefined) {
                    assert.fail("a scan holds the document node and its root element");
                  }

                  const assembled = yield* assembledFrom(rows.document.node, [
                    [root, ...below.slice(0, -1), { ...last, documentRow: root.documentRow }],
                  ]);

                  assert.deepStrictEqual(
                    Result.isFailure(assembled) ? assembled.failure : undefined,
                    new DocumentRowCount({ document: rows.document.node, found: 2 }),
                  );
                  break;
                }
                case "badXmlVersion": {
                  const [root, ...below] = scan;
                  if (root === undefined) {
                    assert.fail("a scan holds the document node");
                  }

                  const documentRow = root.documentRow.pipe(
                    Option.map((fields) => ({ ...fields, xmlVersion: "2.0" })),
                  );
                  const assembled = yield* assembledFrom(rows.document.node, [
                    [{ ...root, documentRow }, ...below],
                  ]);

                  assert.deepStrictEqual(
                    Result.isFailure(assembled) ? assembled.failure : undefined,
                    new XmlVersionUnread({ document: rows.document.node, xmlVersion: "2.0" }),
                  );
                  break;
                }
                default: {
                  assert.fail(`drew ${String(variant satisfies never)}, which is no variant`);
                }
              }
            }),
        ),
      ),
  );
});
