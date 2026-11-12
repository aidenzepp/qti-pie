import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, increasing } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Brand, Effect, Formatter, Option, Result, Stream } from "effect";
import type { Page, PageCursor } from "@bjornpagen/grizzle";
import {
  DocumentRowCount,
  addRow,
  assembleScan,
  emptyScan,
  scannedRows,
} from "#pantry/export/pages.ts";
import type { DocumentKey, ScanRow } from "#pantry/export/pages.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, XdmDocument } from "#pantry/model/xdm.ts";
import { caseHang, featuresOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
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
 * The key every case's document is scanned at: the scan's rows carry none, so any key will do,
 * and the refusal names it.
 */
const key: DocumentKey = { package: "MANIFEST-1", path: "item.xml" };

/**
 * The query a fake page is of, which only its cursors' type names.
 */
type FakeScan = "fake document scan";

/**
 * A cursor of the fake scan: `<page>:<row>`, the boundary after one row of one page.
 */
const cursorOf = Brand.nominal<PageCursor<FakeScan>>();

/**
 * Key a list of rows by their node's `start`.
 *
 * @param list - Rows keyed by a node, one each.
 * @returns The rows by `start`.
 */
const atStart = <Row extends { readonly start: bigint }>(list: readonly Row[]) =>
  new Map(list.map((row) => [row.start, row]));

/**
 * The order a scan delivers an element's attributes and namespace declarations in: as `flatten`
 * lists them, or reversed. They are sets, so no order of theirs may reach the document.
 */
type SetOrder = <Row>(rows: readonly Row[]) => readonly Row[];

/**
 * Order two rows by their `offset`, least first.
 *
 * @param left - The one row.
 * @param right - The other.
 * @returns A negative number where `left` comes first, positive where `right` does, zero for one
 *   offset.
 */
const byOffset = (left: { readonly offset: bigint }, right: { readonly offset: bigint }) =>
  Number(left.offset - right.offset);

/**
 * The scan of one document as the database delivers it, built from the document's rows without
 * the code under test: each node row in `start` order with its characters (a text or whitespace
 * run's, an entity reference's `&name;`) and the rows keyed by it attached (its governing type an
 * `ElementType`, or a foreign element's `OpenElementType`), the document row on the document node
 * with its XML declaration and the declaration with its encoding and standalone, its attributes,
 * open attributes and namespace declarations in the order `order` gives, and an attribute's entity
 * references in offset order.
 *
 * @param rows - The rows `flatten` writes for a document.
 * @param order - The order each element's sets are delivered in.
 * @returns The document's scan rows, in `start` order.
 */
const scanOf = (rows: FlatRows<Composed>, order: SetOrder): readonly ScanRow<Composed>[] => {
  const texts = atStart(rows.texts);
  const whitespace = atStart(rows.whitespace);
  const comments = atStart(rows.comments);
  const pis = atStart(rows.pis);
  const entityRefs = atStart(rows.entityRefs);
  const doctypes = atStart(rows.doctypes);
  const openElementNames = atStart(rows.openElementNames);
  const attributes = Map.groupBy(rows.attributes, ({ start }) => start);
  const openAttributes = Map.groupBy(rows.openAttributes, ({ start }) => start);
  const namespaces = Map.groupBy(rows.namespaces, ({ start }) => start);

  const charsOf = (start: bigint): string => {
    const reference = entityRefs.get(start);

    return (
      texts.get(start)?.value ??
      whitespace.get(start)?.value ??
      (reference === undefined ? "" : `&${reference.name};`)
    );
  };

  return rows.nodes
    .toSorted((left, right) => Number(left.start - right.start))
    .map((node): ScanRow<Composed> => ({
      ...node,
      attributes: order(attributes.get(node.start) ?? []).map((attribute) => ({
        entities: rows.attributeEntities
          .filter(({ name, start }) => start === node.start && name === attribute.name)
          .toSorted(byOffset)
          .map(({ entity, offset }) => ({ entity, offset })),
        lexical: attribute.lexical,
        name: attribute.name,
        prefix: attribute.prefix,
      })),
      chars: charsOf(node.start),
      comment: Option.fromNullishOr(comments.get(node.start)).pipe(
        Option.map(({ value }) => ({ value })),
      ),
      doctype: Option.fromNullishOr(doctypes.get(node.start)).pipe(
        Option.map(({ value }) => ({ value })),
      ),
      documentRow:
        node.start === 0n
          ? Option.some({
              charset: rows.document.charset,
              declaration: Option.map(Arr.head(rows.xmlDecls), ({ version }) => ({
                encoding: Arr.head(rows.encodingDecls),
                standalone: Arr.head(rows.sdDecls),
                version,
              })),
              exportCharset: rows.document.exportCharset,
            })
          : Option.none(),
      elementType: openElementNames.has(node.start)
        ? Option.none()
        : node.governs.pipe(Option.map((type) => ({ type }))),
      namespaces: order(namespaces.get(node.start) ?? []).map(({ prefix, uri }) => ({
        prefix,
        uri,
      })),
      openAttributes: order(openAttributes.get(node.start) ?? []).map((attribute) => ({
        class: attribute.class,
        entities: rows.openAttributeEntities
          .filter(
            ({ local, start, uri }) =>
              start === node.start && uri === attribute.uri && local === attribute.local,
          )
          .toSorted(byOffset)
          .map(({ entity, offset }) => ({ entity, offset })),
        lexical: attribute.lexical,
        local: attribute.local,
        prefix: attribute.prefix,
        uri: attribute.uri,
      })),
      openElementName: Option.fromNullishOr(openElementNames.get(node.start)).pipe(
        Option.map(({ local, namespace }) => ({ local, namespace })),
      ),
      openElementType: openElementNames.has(node.start)
        ? node.governs.pipe(Option.map((type) => ({ type })))
        : Option.none(),
      pi: Option.fromNullishOr(pis.get(node.start)).pipe(
        Option.map(({ data, target }) => ({ data, target })),
      ),
    }));
};

/**
 * A document's rows as sets: each list's rows, each written as text, in sorted order. Two
 * documents are one document exactly when their rows are one set (`flatten` writes every field the
 * tree holds), whatever order each lists its attributes and namespace declarations in.
 *
 * @param document - The document.
 * @returns Each list of `flatten`'s rows as sorted text, and the document row.
 */
const rowSetOf = (document: XdmDocument<Composed>) =>
  Object.fromEntries(
    Object.entries(flatten(document)).map(([list, rows]) => [
      list,
      Array.isArray(rows) ? rows.map((row) => Formatter.format(row)).toSorted() : rows,
    ]),
  );

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
 * @param pages - The pages the fake scan serves.
 * @returns The document, or the refusal of the rows the pages held.
 */
const assembledFrom = (pages: readonly (readonly ScanRow<Composed>[])[]) =>
  Effect.map(Stream.runFold(scannedRows(pager(pages), 1), emptyScan<Composed>, addRow), (scan) =>
    assembleScan(key, scan),
  );

/**
 * The most nodes a document has for every cut of its scan to be tried: its N − 1 boundaries give
 * 2^(N − 1) cut sets, 32 at this bound, which already holds a page of one, two and three rows
 * beside one of the rest.
 */
const exhaustiveNodes = 6;

/**
 * How many cut sets are drawn for a document past {@link exhaustiveNodes}, beside its single
 * cuts' extremes and its uniform pages.
 */
const drawnCuts = 3;

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
 * an attribute, whether the document writes an XML declaration, how its cuts were chosen, and the
 * order its sets were delivered in.
 */
type PagingFeature =
  | XdmFeature
  | "attributeReference"
  | "declared"
  | "undeclared"
  | "every cut"
  | "drawn cuts"
  | "one page"
  | "a page per row"
  | "sets as written"
  | "sets reversed";

/**
 * The orders a scan delivers an element's sets in, by the feature each notes.
 */
const setOrders = [
  ["sets as written", (rows) => rows],
  ["sets reversed", (rows) => rows.toReversed()],
] as const satisfies readonly (readonly [PagingFeature, SetOrder])[];

describe("export/pages.ts", { timeout: searchTimeout }, () => {
  it.effect(
    "assembles every generated document to itself from its scan cut into pages at any boundaries and its sets in any order, as from one page",
    (ctx) =>
      // Oracle: a universal one, a metamorphic relation: paging and set order are invisible, so
      // the scan served as one page and as every cut of it, its attributes and declarations in
      // either order, assembles to the same document, the generated one up to the order of its
      // sets (its rows are one set). Bound: the generator's drawn bounds, up to 200 nodes a tree;
      // every cut set of a document of at most 6 nodes, and past that the uniform pages of 1, 2
      // and 3 rows, a cut after the first row and before the last, and 3 drawn cut sets.
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
                "sets as written",
                "sets reversed",
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

              const rows = flatten(generated.document);
              if (rows.attributeEntities.length + rows.openAttributeEntities.length > 0) {
                c.note("attributeReference");
              }

              const [ordered, order] = c.draw(element(setOrders));
              c.note(ordered);

              const scan = scanOf(rows, order);
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

              const one = yield* assembledFrom([scan]);

              assert.deepStrictEqual(
                rowSetOf(Result.getOrThrow(one)),
                rowSetOf(generated.document),
              );
              for (const cut of cuts) {
                if (cut.length === 0) {
                  c.note("one page");
                }

                if (cut.length === count - 1) {
                  c.note("a page per row");
                }

                const paged = yield* assembledFrom(pagesOf(scan, cut));

                assert.deepStrictEqual(paged, one, `cut at ${cut.join(", ")}`);
              }
            }),
        ),
      ),
  );

  it.effect("refuses the document when a second node carries a Document row", (ctx) =>
    // Oracle: the specification as a checker: a document holds one Document row, on its document
    // node, which the read takes the document's charsets from. A page stream is the database's,
    // read as grizzle's cursors give it (the cuts above), so no page variant is judged here; an
    // XmlDecl row's version is the database's to hold, by its pattern law, so no case breaks it.
    // Bound: the generator's drawn bounds, one document a case.
    searched(
      ctx,
      explore(
        {
          caseHang,
          concurrency: 1,
          coverage: required<"secondDocumentRow">(["secondDocumentRow"], {
            cases: 200,
            sense: notesOnly,
          }),
          draw: drawn(documents),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "specification",
            name: "a document's scan holds one Document row, on its document node",
          },
          runs: 50,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "export/pages-variants",
        },
        (generated, c) =>
          Effect.gen(function* secondDocumentRow() {
            const rows = flatten(generated.document);
            const [root, ...below] = scanOf(rows, (list) => list);
            const last = below.at(-1);
            if (root === undefined || last === undefined) {
              assert.fail("a scan holds the document node and its root element");
            }

            c.note("secondDocumentRow");

            const assembled = yield* assembledFrom([
              [root, ...below.slice(0, -1), { ...last, documentRow: root.documentRow }],
            ]);

            assert.deepStrictEqual(
              Result.isFailure(assembled) ? assembled.failure : undefined,
              new DocumentRowCount({ found: 2, package: key.package, path: key.path }),
            );
          }),
      ),
    ),
  );
});
