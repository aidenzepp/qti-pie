/**
 * The read half of export, without a database: the rows one document's scan delivers, paged
 * (fin.md §4.6, trees.md §3), folded into the rows `assemble` rebuilds the document from.
 *
 * `#pantry/export/scan.ts` states the scan: `Node` at one document's key, its package and path,
 * ordered by `start`, each row with its own characters, its comment, instruction, doctype and
 * foreign element's name at most once each, the document node with the document's `Document` row,
 * its XML declaration and the declaration's encoding and standalone at most once each, and its
 * attributes and open attributes, each with its entity references, and its namespace declarations.
 * A page is a run of those rows; {@link scannedRows} follows a page's cursor to the next until none
 * follows, so the stream it gives is the scan's rows, whatever the cuts.
 *
 * Every row is folded by its own key, never by where it arrives: a node by its `start`, an
 * attribute by its element's `start` and its name, an open attribute by its element's `start` and
 * its expanded name, a namespace declaration by its element's `start` and its prefix, an entity
 * reference by its attribute's key and its offset, as the read (`readDocument` of
 * `#pantry/model/assemble.ts`) places them. Attributes and namespace declarations are sets, so no
 * order of theirs is read either. So paging is invisible: the same rows cut into any pages give the
 * same document.
 */
import { Effect, Option, Result, Schema, Stream } from "effect";
import type { Page, PageCursor, PageRequest } from "@bjornpagen/grizzle";
import { readDocument } from "#pantry/model/assemble.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import type {
  AttributeEntityRow,
  AttributeRow,
  CharacterRow,
  ClosedName,
  DocumentRow,
  EncodingDeclRow,
  EntityRefRow,
  NamespaceRow,
  NodeRow,
  OpenAttributeEntityRow,
  OpenAttributeRow,
  OpenClass,
  OpenElementNameRow,
  PiRow,
  SdDeclRow,
  XdmDocument,
  XdmVocabulary,
  XmlDeclRow,
} from "#pantry/model/xdm.ts";

/**
 * A document's key, as `Document` holds it: its package's manifest identifier and its path in the
 * package, which its scan is filtered by.
 */
export interface DocumentKey {
  readonly package: string;
  readonly path: string;
}

/**
 * An entity reference as the scan delivers it under its attribute: the entity's name and the offset
 * of its `&` in the attribute's lexical form, its key within the attribute.
 */
type ScannedEntity = Pick<AttributeEntityRow<XdmVocabulary>, "entity" | "offset">;

/**
 * An attribute of a closed name as the scan delivers it under its element: its name handle, the
 * prefix its name is written with and its lexical form, with its entity references. The handle is
 * of `Attribute.name`'s type, the whole `AttributeName` roster, open classes included, which
 * {@link closedNameOf} reads as the closed name it is.
 */
interface ScannedAttribute<V extends XdmVocabulary> extends Omit<
  AttributeRow<V>,
  "name" | "start"
> {
  readonly entities: readonly ScannedEntity[];
  readonly name: V["name"];
}

/**
 * An attribute of an open name as the scan delivers it under its element: its class, its expanded
 * name, the prefix its name is written with and its lexical form, with its entity references. The
 * class is of `OpenAttribute.class`'s type, the whole `AttributeName` roster, which
 * {@link openClassOf} reads as the open class it is.
 */
interface ScannedOpenAttribute<V extends XdmVocabulary> extends Omit<
  OpenAttributeRow,
  "class" | "start"
> {
  readonly class: V["name"];
  readonly entities: readonly ScannedEntity[];
}

/**
 * Read a stored attribute's name handle as the closed name it is.
 *
 * SAFETY: the law "AL4 open names" (`#pantry/qti/attributes.ts`) holds every `Attribute` row's
 * `name` to no open class, and the database refused every write that broke it, so a stored handle
 * is a closed name. grizzle types the field as its roster, `AttributeName`, whose handles the open
 * classes are too.
 *
 * @param name - The handle an `Attribute` row holds.
 * @returns The handle, as a closed name.
 */
const closedNameOf = <V extends XdmVocabulary>(name: V["name"]): ClosedName<V> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  name as ClosedName<V>;

/**
 * Read a stored open attribute's class as the open class it is.
 *
 * SAFETY: the law "AL4 open names" (`#pantry/qti/attributes.ts`) holds every `OpenAttribute` row's
 * `class` to an open class, and the database refused every write that broke it. grizzle types the
 * field as its roster, `AttributeName`, whose handles the closed names are too.
 *
 * @param name - The handle an `OpenAttribute` row holds as its class.
 * @returns The handle, as an open class.
 */
const openClassOf = (name: XdmVocabulary["name"]): OpenClass =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  name as OpenClass;

/**
 * A document's `XmlDecl` row as the scan delivers it under the `Document` row: its fields as
 * `assemble` reads them, its version the `VersionNum` grizzle types `XmlDecl.version` as (the text
 * type `XmlVersion` of `#pantry/qti/chardata.ts`, whose host type is `1.${number}`), with its
 * `EncodingDecl` and `SdDecl` rows attached, each at most once, keyed by the document.
 */
interface ScannedDeclaration extends XmlDeclRow {
  readonly encoding: Option.Option<EncodingDeclRow>;
  readonly standalone: Option.Option<SdDeclRow>;
}

/**
 * A document's `Document` row as the scan delivers it on the document node: its fields as
 * `assemble` reads them, with its `XmlDecl` row attached, none where the document writes no
 * declaration.
 */
interface ScannedDocument extends DocumentRow {
  readonly declaration: Option.Option<ScannedDeclaration>;
}

/**
 * One row of a document's scan: a `Node` row of the document, with what the node owns attached.
 *
 * The node's own fields are those `assemble` reads but its governing type, and `chars`: a text or
 * whitespace node's characters and an entity reference's `&name;`, empty for every other kind
 * (`Node.chars`, whose row checks in `#pantry/qti/chardata.ts` hold each arm's characters to that
 * form). A comment, an instruction, the doctype, a foreign element's expanded name and an element's
 * governing type are rows keyed by the node, so each is there at most once, and exactly for the
 * nodes of its kind by the mirror laws; the `Document` row is the document's, there on the document
 * node alone; the attributes, the open attributes and the namespace declarations are the node's
 * families, sets.
 */
export interface ScanRow<V extends XdmVocabulary> extends Omit<NodeRow<V>, "governs"> {
  readonly attributes: readonly ScannedAttribute<V>[];
  readonly chars: string;
  readonly comment: Option.Option<Pick<CharacterRow, "value">>;
  readonly doctype: Option.Option<Pick<CharacterRow, "value">>;
  /**
   * The document's `Document` row on the document node; none on every other node. Its
   * declaration's version is the `VersionNum` the `XmlDecl` row holds, which {@link assembleScan}
   * reads.
   */
  readonly documentRow: Option.Option<ScannedDocument>;
  /**
   * A vocabulary element's named governing type (`ElementType`); none on every other node, and on
   * an element no named type governs.
   */
  readonly elementType: Option.Option<{ readonly type: string }>;
  readonly namespaces: readonly Omit<NamespaceRow, "start">[];
  readonly openAttributes: readonly ScannedOpenAttribute<V>[];
  readonly openElementName: Option.Option<Omit<OpenElementNameRow, "start">>;
  /**
   * A foreign element's governing type (`OpenElementType`); none on every other node, and on a
   * foreign element no type governs.
   */
  readonly openElementType: Option.Option<{ readonly type: string }>;
  readonly pi: Option.Option<Omit<PiRow, "start">>;
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
  readonly attributeEntities: AttributeEntityRow<V>[];
  readonly attributes: AttributeRow<V>[];
  readonly comments: CharacterRow[];
  readonly doctypes: CharacterRow[];
  readonly documents: DocumentRow[];
  readonly encodingDecls: EncodingDeclRow[];
  readonly entityRefs: EntityRefRow[];
  readonly namespaces: NamespaceRow[];
  readonly nodes: NodeRow<V>[];
  readonly openAttributeEntities: OpenAttributeEntityRow[];
  readonly openAttributes: OpenAttributeRow[];
  readonly openElementNames: OpenElementNameRow[];
  readonly pis: PiRow[];
  readonly sdDecls: SdDeclRow[];
  readonly texts: CharacterRow[];
  readonly whitespace: CharacterRow[];
  readonly xmlDecls: XmlDeclRow[];
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
  openAttributeEntities: [],
  openAttributes: [],
  openElementNames: [],
  pis: [],
  sdDecls: [],
  texts: [],
  whitespace: [],
  xmlDecls: [],
});

/**
 * Append a row keyed by its node, when the scan delivered one.
 *
 * @param start - The node's `start`, the row's key within the document.
 * @param fields - The row's other fields, none when the node has no such row.
 * @param into - The list the row belongs in, appended to in place.
 */
const keyedAt = <Fields extends object>(
  start: bigint,
  fields: Option.Option<Fields>,
  into: (Fields & { readonly start: bigint })[],
): void => {
  if (Option.isSome(fields)) {
    into.push({ ...fields.value, start });
  }
};

/**
 * Fold one scanned row into the rows of its document.
 *
 * The node's row goes in as it is, and a text, whitespace or entity reference node's characters
 * as the row of its kind, the reference's name inside its `&` and `;`. Each attached row goes in
 * keyed by the node's `start`, the `Document` row and its declaration's as the document's, and an
 * attribute's entity references by the attribute's key. Nothing is read from the order rows arrive
 * in.
 *
 * @param scan - The rows folded so far, appended to in place.
 * @param row - The scanned row.
 * @returns The same accumulator, now holding the row's rows.
 */
export const addRow = <V extends XdmVocabulary>(scan: Scan<V>, row: ScanRow<V>): Scan<V> => {
  const { at, end, kind, parent, prefix, start, version } = row;
  const governs = Option.map(
    Option.orElse(row.elementType, () => row.openElementType),
    ({ type }) => type,
  );
  scan.nodes.push({ at, end, governs, kind, parent, prefix, start, version });
  switch (kind) {
    case "text": {
      scan.texts.push({ start, value: row.chars });
      break;
    }
    case "ws": {
      scan.whitespace.push({ start, value: row.chars });
      break;
    }
    case "entityRef": {
      scan.entityRefs.push({ name: row.chars.slice(1, -1), start });
      break;
    }
    default: {
      break;
    }
  }

  keyedAt(start, row.comment, scan.comments);
  keyedAt(start, row.pi, scan.pis);
  keyedAt(start, row.doctype, scan.doctypes);
  keyedAt(start, row.openElementName, scan.openElementNames);
  for (const { charset, declaration, exportCharset } of Option.toArray(row.documentRow)) {
    scan.documents.push({ charset, exportCharset });
    for (const { encoding, standalone, version: declared } of Option.toArray(declaration)) {
      scan.xmlDecls.push({ version: declared });
      scan.encodingDecls.push(...Option.toArray(encoding));
      scan.sdDecls.push(...Option.toArray(standalone));
    }
  }

  for (const { entities, lexical, name, prefix: written } of row.attributes) {
    const closed = closedNameOf<V>(name);
    scan.attributes.push({ lexical, name: closed, prefix: written, start });
    for (const { entity, offset } of entities) {
      scan.attributeEntities.push({ entity, name: closed, offset, start });
    }
  }

  for (const {
    class: open,
    entities,
    lexical,
    local,
    prefix: written,
    uri,
  } of row.openAttributes) {
    scan.openAttributes.push({
      class: openClassOf(open),
      lexical,
      local,
      prefix: written,
      start,
      uri,
    });
    for (const { entity, offset } of entities) {
      scan.openAttributeEntities.push({ entity, local, offset, start, uri });
    }
  }

  for (const { prefix: declared, uri } of row.namespaces) {
    scan.namespaces.push({ prefix: declared, start, uri });
  }

  return scan;
};

/**
 * A document's scan held no `Document` row, or more than one: the document node carries exactly
 * one, the document's, and every other node none.
 */
export class DocumentRowCount extends Schema.TaggedError<DocumentRowCount>()("DocumentRowCount", {
  found: Schema.Number,
  /**
   * The manifest identifier of the document's package.
   */
  package: Schema.String,
  /**
   * The document's path in its package.
   */
  path: Schema.String,
}) {
  /**
   * The document, how many rows its scan held, and the repair.
   */
  override get message(): string {
    return `The scan of document ${this.path} of package ${this.package} held ${String(this.found)} Document rows, but a document's scan holds exactly one, on its document node, so the document cannot be assembled. Scan every page of the document, each once, as the scan's cursors give them.`;
  }
}

/**
 * Assemble a document from the rows its scan folded.
 *
 * Each row is as the database holds it, every law the schema states held of it, so no law is read
 * again here: the rows are read into the tree (`readDocument`), never held to `flatten`'s image of
 * it, and an `XmlDecl` row's version is a `VersionNum` by its type, which its pattern law holds.
 * Only the scan's own paging is checked, its one `Document` row.
 *
 * @param document - The document's key, which its scan was filtered by.
 * @param scan - The rows the whole scan folded.
 * @returns The document the rows stand for; or `DocumentRowCount` when the scan did not hold
 *   exactly one `Document` row, or the read's refusal of rows it cannot build the tree from.
 */
export const assembleScan = <V extends XdmVocabulary>(
  document: DocumentKey,
  scan: Scan<V>,
): Result.Result<XdmDocument<V>, AssembleError | DocumentRowCount> => {
  const [only, ...rest] = scan.documents;
  if (only === undefined || rest.length > 0) {
    return Result.fail(
      new DocumentRowCount({
        found: scan.documents.length,
        package: document.package,
        path: document.path,
      }),
    );
  }

  return readDocument<V>({
    attributeEntities: scan.attributeEntities,
    attributes: scan.attributes,
    comments: scan.comments,
    doctypes: scan.doctypes,
    document: only,
    encodingDecls: scan.encodingDecls,
    entityRefs: scan.entityRefs,
    namespaces: scan.namespaces,
    nodes: scan.nodes,
    openAttributeEntities: scan.openAttributeEntities,
    openAttributes: scan.openAttributes,
    openElementNames: scan.openElementNames,
    pis: scan.pis,
    sdDecls: scan.sdDecls,
    texts: scan.texts,
    whitespace: scan.whitespace,
    xmlDecls: scan.xmlDecls,
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
 * @param page - Reads one page of the query for a request: a workload handle's `page`, with the
 *   query's parameters bound.
 * @param size - The rows each page asks for, at least 1.
 * @returns The rows of every page, in order; fails with the first page's read error.
 */
// GRIZZLE-PENDING: Q15 (a stream over an ordered query): grizzle pages an ordered query and streams none, so the export follows the cursors itself.
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
