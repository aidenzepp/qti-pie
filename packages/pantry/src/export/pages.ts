/**
 * The read half of export, without a database: the rows one document's scan delivers, paged
 * (fin.md §4.6, trees.md §3), folded into the rows `assemble` rebuilds the document from.
 *
 * `#pantry/export/scan.ts` states the scan: `Node` where `document = $document`, ordered by
 * `start`, each row with its own characters, its comment, instruction, doctype, `Document` row and
 * foreign element's name at most once each, the `Document` row with its XML declaration and the
 * declaration with its encoding and standalone at most once each, and its attributes, each with its
 * entity references and its open name, and its namespace declarations. A page is a run of those
 * rows; {@link scannedRows} follows a page's cursor to the next until none follows, so the stream it
 * gives is the scan's rows, whatever the cuts.
 *
 * Every row is folded by its own key, never by where it arrives: a node by its `start`, an
 * attribute or a namespace declaration by its `at`, an entity reference by its offset, as
 * `assemble` places them. So paging is invisible: the same rows cut into any pages give the same
 * document, and a page repeated or left out leaves rows `assemble` refuses.
 */
import { Effect, Option, Result, Schema, Stream } from "effect";
import type { Page, PageCursor, PageRequest } from "@bjornpagen/grizzle";
import { assemble } from "#pantry/model/assemble.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import type {
  AttributeEntityRow,
  AttributeId,
  AttributeRow,
  CharacterRow,
  DocumentRow,
  EncodingDeclRow,
  EntityRefRow,
  NamespaceRow,
  NodeId,
  NodeRow,
  OpenElementNameRow,
  OpenNameRow,
  PiRow,
  SdDeclRow,
  XdmDocument,
  XdmVocabulary,
  XmlDeclRow,
  XmlVersion,
} from "#pantry/model/xdm.ts";

/**
 * One attribute as the scan delivers it under its element: its id, its slot, name handle, the
 * prefix its name is written with and its lexical form, its entity references and its open name,
 * each list in `at` order.
 *
 * The open name is a family of at most one member (`openName` ≤ 1 on `Attribute`), so no key
 * proves it at most one and the scan delivers it as a list.
 */
export interface ScannedAttribute<V extends XdmVocabulary> {
  readonly at: bigint;
  readonly entities: readonly Pick<AttributeEntityRow, "name" | "offset">[];
  readonly id: AttributeId;
  readonly lexical: string;
  readonly name: AttributeRow<V>["name"];
  readonly openName: readonly Omit<OpenNameRow, "attribute">[];
  readonly prefix: string;
}

/**
 * A document's `XmlDecl` row as the scan delivers it under the `Document` row: its fields as
 * `assemble` reads them, but for the version, which is the text `XmlDecl.version` holds, and with
 * its `EncodingDecl` and `SdDecl` rows attached, each at most once, keyed by the node.
 */
export interface ScannedDeclaration extends Omit<XmlDeclRow, "version"> {
  readonly encoding: Option.Option<Pick<EncodingDeclRow, "encoding">>;
  readonly standalone: Option.Option<Pick<SdDeclRow, "standalone">>;
  readonly version: string;
}

/**
 * A document node's `Document` row as the scan delivers it: its fields as `assemble` reads them,
 * with its `XmlDecl` row attached, none where the document writes no declaration.
 */
export interface ScannedDocument extends DocumentRow {
  readonly declaration: Option.Option<ScannedDeclaration>;
}

/**
 * One row of a document's scan: a `Node` row of the document, with what the node owns attached.
 *
 * The node's own fields are those `assemble` reads but its governing type, and `chars`: a text or
 * whitespace node's characters and an entity reference's `&name;`, empty for every other kind
 * (`Node.chars`, whose row checks in `#pantry/qti/chardata.ts` hold each arm's characters to that
 * form). A comment, an instruction, the doctype, the `Document` row, a foreign element's expanded
 * name and an element's governing type are rows keyed by the node, so each is there at most once,
 * and exactly for the nodes of its kind by the mirror laws; the attributes and the namespace
 * declarations are the node's families.
 */
export interface ScanRow<V extends XdmVocabulary> extends Omit<NodeRow<V>, "governs"> {
  readonly attributes: readonly ScannedAttribute<V>[];
  readonly chars: string;
  readonly comment: Option.Option<Pick<CharacterRow, "value">>;
  readonly doctype: Option.Option<Pick<CharacterRow, "value">>;
  /**
   * The document node's `Document` row; none on every other node. Its declaration's version is the
   * text the `XmlDecl` row holds, which {@link assembleScan} reads.
   */
  readonly documentRow: Option.Option<ScannedDocument>;
  /**
   * A vocabulary element's named governing type (`ElementType`); none on every other node, and on
   * an element no named type governs.
   */
  readonly elementType: Option.Option<{ readonly type: string }>;
  readonly namespaces: readonly Omit<NamespaceRow, "node">[];
  readonly openElementName: Option.Option<Omit<OpenElementNameRow, "node">>;
  /**
   * A foreign element's governing type (`OpenElementType`); none on every other node, and on a
   * foreign element no type governs.
   */
  readonly openElementType: Option.Option<{ readonly type: string }>;
  readonly pi: Option.Option<Omit<PiRow, "node">>;
}

/**
 * The rows of one document folded from its scan so far, by relation, as `assemble` reads them, the
 * `Document` rows met, which a whole scan holds exactly one of, and the `XmlDecl` rows met, each
 * version as the row holds it.
 *
 * It is a fold's accumulator: {@link addRow} appends to its lists in place and returns it, so a
 * fold over a stream starts each run from a new {@link emptyScan}.
 */
export interface Scan<V extends XdmVocabulary> {
  readonly attributeEntities: AttributeEntityRow[];
  readonly attributes: AttributeRow<V>[];
  readonly comments: CharacterRow[];
  readonly doctypes: CharacterRow[];
  readonly documents: DocumentRow[];
  readonly encodingDecls: EncodingDeclRow[];
  readonly entityRefs: EntityRefRow[];
  readonly namespaces: NamespaceRow[];
  readonly nodes: NodeRow<V>[];
  readonly openElementNames: OpenElementNameRow[];
  readonly openNames: OpenNameRow[];
  readonly pis: PiRow[];
  readonly sdDecls: SdDeclRow[];
  readonly texts: CharacterRow[];
  readonly whitespace: CharacterRow[];
  readonly xmlDecls: Omit<ScannedDeclaration, "encoding" | "standalone">[];
}

/**
 * Construct the fold of no rows.
 *
 * @returns An accumulator whose every list is empty.
 */
export const emptyScan = <V extends XdmVocabulary>(): Scan<V> => ({
  attributeEntities: [],
  attributes: [],
  comments: [],
  doctypes: [],
  documents: [],
  encodingDecls: [],
  entityRefs: [],
  namespaces: [],
  nodes: [],
  openElementNames: [],
  openNames: [],
  pis: [],
  sdDecls: [],
  texts: [],
  whitespace: [],
  xmlDecls: [],
});

/**
 * Append a row keyed by its node, when the scan delivered one.
 *
 * @param node - The node the row is keyed by.
 * @param fields - The row's other fields, none when the node has no such row.
 * @param into - The list the row belongs in, appended to in place.
 */
const keyedBy = <Fields extends object>(
  node: NodeId,
  fields: Option.Option<Fields>,
  into: (Fields & { readonly node: NodeId })[],
): void => {
  if (Option.isSome(fields)) {
    into.push({ ...fields.value, node });
  }
};

/**
 * Fold one scanned row into the rows of its document.
 *
 * The node's row goes in as it is, and a text, whitespace or entity reference node's characters
 * as the row of its kind, the reference's name inside its `&` and `;`. Each attached row goes in
 * keyed by the node, and an attribute's open name and entity references by the attribute's id.
 * Nothing is read from the order rows arrive in.
 *
 * @param scan - The rows folded so far, appended to in place.
 * @param row - The scanned row.
 * @returns The same accumulator, now holding the row's rows.
 */
export const addRow = <V extends XdmVocabulary>(scan: Scan<V>, row: ScanRow<V>): Scan<V> => {
  const { at, end, id: node, kind, parent, prefix, start, version } = row;
  const governs = Option.map(
    Option.orElse(row.elementType, () => row.openElementType),
    ({ type }) => type,
  );
  scan.nodes.push({ at, end, governs, id: node, kind, parent, prefix, start, version });
  switch (kind) {
    case "text": {
      scan.texts.push({ node, value: row.chars });
      break;
    }
    case "ws": {
      scan.whitespace.push({ node, value: row.chars });
      break;
    }
    case "entityRef": {
      scan.entityRefs.push({ name: row.chars.slice(1, -1), node });
      break;
    }
    default: {
      break;
    }
  }

  keyedBy(node, row.comment, scan.comments);
  keyedBy(node, row.pi, scan.pis);
  keyedBy(node, row.doctype, scan.doctypes);
  keyedBy(node, row.openElementName, scan.openElementNames);
  for (const { charset, declaration, exportCharset } of Option.toArray(row.documentRow)) {
    scan.documents.push({ charset, exportCharset, node });
    for (const { encoding, standalone, version: declared } of Option.toArray(declaration)) {
      scan.xmlDecls.push({ node, version: declared });
      keyedBy(node, encoding, scan.encodingDecls);
      keyedBy(node, standalone, scan.sdDecls);
    }
  }

  for (const attribute of row.attributes) {
    const { id } = attribute;
    scan.attributes.push({
      at: attribute.at,
      id,
      lexical: attribute.lexical,
      name: attribute.name,
      node,
      prefix: attribute.prefix,
    });
    for (const open of attribute.openName) {
      scan.openNames.push({ ...open, attribute: id });
    }

    for (const reference of attribute.entities) {
      scan.attributeEntities.push({
        attribute: id,
        name: reference.name,
        offset: reference.offset,
      });
    }
  }

  for (const declaration of row.namespaces) {
    scan.namespaces.push({ ...declaration, node });
  }

  return scan;
};

/**
 * A document's scan held no `Document` row, or more than one: the document node carries exactly
 * one, keyed by the node, and every other node none.
 */
export class DocumentRowCount extends Schema.TaggedError<DocumentRowCount>()("DocumentRowCount", {
  document: Schema.String,
  found: Schema.Number,
}) {
  /**
   * The document, how many rows its scan held, and the repair.
   */
  override get message(): string {
    return `The scan of document ${this.document} held ${String(this.found)} Document rows, but a document's scan holds exactly one, on its document node, so the document cannot be assembled. Scan every page of the document, each once, as the scan's cursors give them.`;
  }
}

/**
 * Read an `XmlDecl` row as `assemble` reads it, its version a `VersionNum`.
 *
 * @param row - The row as the scan delivered it.
 * @returns The row, its version typed as the `VersionNum` it is.
 * @see {@link https://www.w3.org/TR/xml/#NT-VersionNum | XML 1.0, VersionNum}
 */
const xmlDeclOf = ({ node, version }: Scan<XdmVocabulary>["xmlDecls"][number]): XmlDeclRow => ({
  node,
  // SAFETY: `XmlDecl.version` is of the text type `XmlVersion` (`#pantry/qti/chardata.ts`,
  // `str.regex("^1\\.[0-9]+$")`), whose pattern law, "XML production", the database holds on every
  // row it stores, so every version a scan reads is `1.` and digits.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  version: version as XmlVersion,
});

/**
 * Assemble a document from the rows its scan folded.
 *
 * Each row is as the database holds it, every law the schema states held of it, so no law is read
 * again here: an `XmlDecl` row's version is a `VersionNum` by its pattern law ({@link xmlDeclOf}).
 * Only the scan's own paging is checked, its one `Document` row.
 *
 * @param document - The id of the document's node, which its scan was filtered by.
 * @param scan - The rows the whole scan folded.
 * @returns The document the rows stand for; or `DocumentRowCount` when the scan did not hold
 *   exactly one `Document` row, or `assemble`'s refusal of rows that are not one document's.
 */
export const assembleScan = <V extends XdmVocabulary>(
  document: NodeId,
  scan: Scan<V>,
): Result.Result<XdmDocument<V>, AssembleError | DocumentRowCount> => {
  const [only, ...rest] = scan.documents;
  if (only === undefined || rest.length > 0) {
    return Result.fail(new DocumentRowCount({ document, found: scan.documents.length }));
  }

  return assemble<V>({
    attributeEntities: scan.attributeEntities,
    attributes: scan.attributes,
    comments: scan.comments,
    doctypes: scan.doctypes,
    document: only,
    encodingDecls: scan.encodingDecls,
    entityRefs: scan.entityRefs,
    namespaces: scan.namespaces,
    nodes: scan.nodes,
    openElementNames: scan.openElementNames,
    openNames: scan.openNames,
    pis: scan.pis,
    sdDecls: scan.sdDecls,
    texts: scan.texts,
    whitespace: scan.whitespace,
    xmlDecls: scan.xmlDecls.map(xmlDeclOf),
  });
};

/**
 * Stream an ordered query's rows page by page, each page starting after the one before ends.
 *
 * The first request is `{ first: size }`; while a page says another follows, the next request is
 * `{ first: size, after }` with that page's end cursor. Each page's rows are emitted in the page's
 * order, and nothing is buffered beyond the page being read. A page that says another follows but
 * has no end cursor ends the stream there: no request can name what follows it.
 *
 * @param page - Reads one page of the query for a request: `db.page` or a workload handle's `page`,
 *   with the query's parameters bound.
 * @param size - The rows each page asks for, at least 1.
 * @returns The rows of every page, in order; fails with the first page's read error.
 */
export const scannedRows = <Row, Q, E, R>(
  page: (request: PageRequest) => Effect.Effect<Page<Row, Q>, E, R>,
  size: number,
): Stream.Stream<Row, E, R> => {
  const first: PageRequest = { first: size };

  return Stream.paginate(first, (request: PageRequest) =>
    Effect.map(
      page(request),
      ({ edges, pageInfo }) =>
        [
          edges.map((edge) => edge.node),
          pageInfo.hasNextPage
            ? pageInfo.endCursor.pipe(
                Option.map((after: PageCursor<Q>): PageRequest => ({ after, first: size })),
              )
            : Option.none(),
        ] as const,
    ),
  );
};
