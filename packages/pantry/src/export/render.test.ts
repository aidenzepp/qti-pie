import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { addRow, emptyScan } from "#pantry/export/pages.ts";
import type { ScanRow } from "#pantry/export/pages.ts";
import { documentXml, scanXml } from "#pantry/export/render.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";
import { scrambledIdOf } from "#pantry/test/gen/xdm.ts";

/**
 * A small item with a declaration naming its encoding and standalone, a comment and a processing
 * instruction in its prolog, namespace declarations, attributes in more than one namespace, text,
 * whitespace and nesting, so its scan carries every kind of row a document's scan attaches to a
 * node.
 */
const item = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!-- one item -->
<?render keep?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="i" title="Render" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>Pick <em>one</em>.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>
`;

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
 * the code under test, as `src/export/pages.test.ts` builds it: each node row in `start` order
 * with its characters and the rows keyed by it attached.
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
  const xmlDecls = byNode(rows.xmlDecls);
  const encodingDecls = byNode(rows.encodingDecls);
  const sdDecls = byNode(rows.sdDecls);
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
              declaration: Option.fromNullishOr(xmlDecls.get(node.id)).pipe(
                Option.map(({ version }) => ({
                  encoding: Option.fromNullishOr(encodingDecls.get(node.id)).pipe(
                    Option.map(({ encoding }) => ({ encoding })),
                  ),
                  node: node.id,
                  standalone: Option.fromNullishOr(sdDecls.get(node.id)).pipe(
                    Option.map(({ standalone }) => ({ standalone })),
                  ),
                  version,
                })),
              ),
              exportCharset: rows.document.exportCharset,
              node: node.id,
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
 * Read the item into its tree and its scan rows, with ids out of document order as drawn ids are.
 *
 * @returns The item's document node, the bytes `unshred` writes for its tree, and its scan rows in
 *   `start` order.
 */
const itemScan = Effect.fnUntraced(function* itemScan() {
  const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
  const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));
  const rows = flatten(tree, scrambledIdOf);

  return {
    document: rows.document.node,
    expected: yield* Effect.orDie(unshred(tree, namesOf(grammar))),
    scan: scanOf(rows),
  };
});

describe("export/render.ts", () => {
  it.effect(
    "writes one document's bytes from its scan rows in order, reversed, interleaved and folded alike",
    () =>
      // Oracle: `unshred` of the tree the rows were flattened from, which no scan row reaches;
      // and a metamorphic relation: each row is folded by its own key, so the rows' order and the
      // fold `scanXml` takes are invisible.
      Effect.gen(function* everyOrderAlike() {
        const { document, expected, scan } = yield* itemScan();
        const interleaved = [
          ...scan.filter((_, index) => index % 2 === 1),
          ...scan.filter((_, index) => index % 2 === 0),
        ];

        const written = yield* documentXml(document, scan);

        assert.deepStrictEqual(written, expected);
        assert.deepStrictEqual(yield* documentXml(document, scan.toReversed()), expected);
        assert.deepStrictEqual(yield* documentXml(document, interleaved), expected);
        assert.deepStrictEqual(
          yield* scanXml(document, Arr.reduce(scan, emptyScan<Composed>(), addRow)),
          expected,
        );
      }),
  );
});
