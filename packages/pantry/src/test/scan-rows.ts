/**
 * The scan of one document as the database delivers it, built from the rows `flatten` writes
 * without the code under test, so the export's tests (`src/export/pages.test.ts`,
 * `src/export/render.test.ts`) feed `#pantry/export/pages.ts` and `#pantry/export/render.ts`
 * rows no export code produced.
 */
import { Option } from "effect";
import type { ScanRow } from "#pantry/export/pages.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";

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
 * Build one document's scan rows: each node row in `start` order with its characters (a text or
 * whitespace run's, an entity reference's `&name;`) and the rows keyed by it attached (its
 * governing type an `ElementType`, or a foreign element's `OpenElementType`), the document row with
 * its XML declaration and the declaration with its encoding and standalone, its attributes and
 * namespace declarations in `at` order, and an attribute's entity references in offset order with
 * its open name.
 *
 * @param rows - The rows `flatten` writes for a document.
 * @returns The document's scan rows, in `start` order.
 */
export const scanRowsOf = (rows: FlatRows<Composed>): readonly ScanRow<Composed>[] => {
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
      elementType: openElementNames.has(node.id)
        ? Option.none()
        : node.governs.pipe(Option.map((type) => ({ type }))),
      namespaces: (namespaces.get(node.id) ?? [])
        .toSorted(bySlot)
        .map(({ at, prefix, uri }) => ({ at, prefix, uri })),
      openElementName: Option.fromNullishOr(openElementNames.get(node.id)).pipe(
        Option.map(({ local, namespace }) => ({ local, namespace })),
      ),
      openElementType: openElementNames.has(node.id)
        ? node.governs.pipe(Option.map((type) => ({ type })))
        : Option.none(),
      pi: Option.fromNullishOr(pis.get(node.id)).pipe(
        Option.map(({ data, target }) => ({ data, target })),
      ),
    }));
};
