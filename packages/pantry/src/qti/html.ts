/**
 * The HTML element laws (spec readings 124 to 126; Aiden's review of PR #46, items 6 to 8 and L3):
 * what the information model asks of a `source`, a `track` and a table cell's `headers` beyond the
 * XSD, whose attributes there are all optional. Where the two differ, the stricter source is the
 * rule (readings 16 and 17).
 *
 * - **Reading 124** (rules `source-srcset` and `source-src`): a `source` in a `picture` carries
 *   `srcset` ("This attribute is required when 'source' is used in 'picture'", info §5.135.3), and
 *   one in an `audio` or a `video` carries `src`. §5.135.1's "This characteristic must be present"
 *   is read in a media element alone, as the HTML Standard it restates splits it: there "The src
 *   attribute must be present", and in a `picture` "The src attribute must not be present". A
 *   `source` elsewhere (a template's content, a wildcard's) is bound by neither.
 * - **Reading 125** (rule `track-srclang`): a `track` in the subtitles state carries `srclang` (info
 *   §5.163.3). §5.163.1 maps `kind`'s keywords to HTML's states and states no default, so a `track`
 *   with no `kind` is in HTML's missing value default, the subtitles state. `kind`'s domain is an
 *   enumeration under whiteSpace `preserve`, so a written `kind` is in the subtitles state exactly
 *   where its lexical form is `subtitles`, and AL1's lexical half refuses every other form.
 * - **Reading 126** (rule `table-headers`): each token of a `td`'s or a `th`'s `headers` is the ID of
 *   a `th` that takes part in the cell's table, and the tokens are unique ("an unordered set of
 *   unique space-separated tokens that are case-sensitive, each of which must have the value of an
 *   ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag", info §5.140.1). A
 *   cell's table is its nearest `table`, nested tables included ({@link TableScope}); a cell no
 *   `table` holds takes part in no table, so none of its tokens names a header.
 *
 * Reading 124 and the missing-`kind` half of reading 125 are presence laws, AL3's pattern: a row
 * check on `Node` that a slot is in `attrs`, the fold of its attributes' slots (AL2). Each is its
 * own check, so each refusal names its own law. A written `kind` is a value, which `attrs` does not
 * hold, so the other half is a containment between two `Attribute` selections. That a value is a
 * valid non-empty URL, and `srclang` a BCP 47 tag, is each attribute's value domain (AL1's lexical
 * half, readings 124, 125 and 129).
 *
 * Every copy of an attribute into an overlay follows C18 the other way round, as `identity.ts`
 * states it: from `select(Attribute, φ)` into the overlay, keyed by `Attribute`'s own key,
 * `(package, path, start, name)` (`#pantry/qti/attributes.ts`), but a `th`'s `id`: it lies inside
 * the ID values (`namingIdAttributes` of `#pantry/qti/identity.ts`), which the key over the
 * ID-typed attributes holds to one per element, and the copy back from its {@link TableHeader}
 * meets them at the `th` kind ({@link namingIdAttributesOf}). Every overlay is keyed by its
 * element, `(package, path, start)`, and names another element of its document by its position.
 * Every copied text that takes part in a cross-row equality is `keyText` (`#pantry/qti/limits.ts`).
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Source | QTI 3.0 information model, §5.135 Source}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Track | QTI 3.0 information model, §5.163 Track}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_TDH | QTI 3.0 information model, §5.140 TDH}
 * @see {@link https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element | HTML, the source element}
 * @see {@link https://html.spec.whatwg.org/multipage/media.html#the-track-element | HTML, the track element}
 * @see {@link https://html.spec.whatwg.org/multipage/tables.html#attr-tdth-headers | HTML, the headers attribute}
 */
import {
  accumulated,
  check,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  fold,
  generated,
  key,
  Monoid,
  natural,
  on,
  ordered,
  relation,
  select,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  AttributeGrammar,
  AttributeModelOf,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Attribute, namingPattern, Space } from "#pantry/qti/attributes.ts";
import {
  DocumentId,
  idValuePattern,
  namingIdAttributesOf,
  spacePattern,
} from "#pantry/qti/identity.ts";
import { EntryPath, keyText, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { cellKinds } from "#pantry/vocab/terms/html.ts";

/**
 * The kinds of the media elements, whose `source` children carry `src` (reading 124).
 */
const mediaKinds = ["audio", "video"] as const;

/**
 * The document node's position in its document, `Node.start` of the root: the table of an element
 * no `table` holds, and the parent a document's root element names.
 */
const documentNode = 0n;

/**
 * One element on the way from a table cell an overlay reads up to the table it takes part in, keyed
 * by the element: its {@link nodeRef} tuple and `table`, the position of its nearest `table`, itself
 * included, or of the document node for an element no `table` holds. A `table` is its own table, a
 * document's root the document's where it is no `table`, and every other element its parent's, so a
 * cell's table is read up the tree with no copy on `Node`, as `identity.ts`'s `SsmlScope` reads an
 * SSML fragment.
 */
export const TableScope = relation(
  "TableScope",
  {
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    table: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * One table cell's `headers`, keyed by the cell.
 *
 * - **copied from the attribute:** `package`, `path`, `start` and `lexical`, the value as written;
 * - **the host's:** `table`, the cell's {@link TableScope};
 * - **drawn:** `tokens`, its {@link HeaderToken} count;
 * - **accumulated:** `tokenText`, the end of its tokens' concatenation.
 */
export const CellHeaders = relation(
  "CellHeaders",
  {
    lexical: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    table: natural,
    tokenText: accumulated(keyText, ""),
    tokens: drawn(natural),
  },
  ["package", "path", "start"],
);

/**
 * One token of a cell's `headers`, in order, with the whitespace written before and after it, so
 * its `piece` is a stretch of the value and the pieces concatenate to it, as `identity.ts`'s
 * `TextIdref` splits an element's text.
 *
 * The tokens are a set (reading 126: "an unordered set of unique space-separated tokens"), which
 * the key over `(package, path, start, token)` holds; the order is the lexical form's, the order of
 * its stretches, which the concatenation that proves the split against the value reads.
 *
 * - **the host's:** `before`, `token` and `after`;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step, a `keyText` whose
 *   domain refuses a piece past the bound;
 * - **the family's group:** `package`, `path` and `start`, the cell's;
 * - **drawn:** `at`;
 * - **accumulated:** `table`, its cell's, along the owner axis, which "Table headers" reads;
 *   `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const HeaderToken = relation.generated(
  "HeaderToken",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    package: ManifestIdentifier,
    path: EntryPath,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    start: natural,
    table: accumulated(natural, documentNode),
    token: keyText,
  },
  ["package", "path", "start", "at"],
  (t) => ({
    piece: generated(keyText, Compute.concat(Compute.concat(t.before, t.token), t.after)),
  }),
);

/**
 * One `th` that carries an ID, an `id` whose value is an NCName, keyed by the `th`: its `id`, the
 * ID's value as its {@link DocumentId} holds it (an `xs:ID` collapsed), with `owner` its own
 * position, an attribute ID's binding, so its copy shares the superkey `PlacedId` reads; and
 * `table`, the position of its {@link TableScope}.
 *
 * The import writes its rows where its form names something (`namedBy` of
 * `#pantry/import/names.ts`, which lists every such relation), until it is a query over
 * `Attribute`.
 */
export const TableHeader = relation(
  "TableHeader",
  {
    id: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    table: natural,
  },
  ["package", "path", "start"],
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const htmlRelations = { CellHeaders, HeaderToken, TableHeader, TableScope };

/**
 * Each cell's `headers` tokens in order, counted by `CellHeaders.tokens`.
 */
const headerTokenFamily = ordered(
  on(HeaderToken, "package", "path", "start", "at"),
  fin(CellHeaders, "tokens"),
);

/**
 * A `Node` row as a row check reads it.
 */
type NodeRow = RowScalars<typeof Node>;

/**
 * State that an element carries a closed attribute: the name's slot under its governor is in its
 * `attrs`, the fold of its attributes' slots (AL2), as AL3 reads a required one.
 *
 * Every kind this module asks it of declares the name under its one governor in both versions, so
 * the read is total where its check asks it; elsewhere the check's kind disjunct holds first.
 *
 * @param n - The row.
 * @param name - The attribute's name.
 * @returns The predicate.
 */
const carries = (n: NodeRow, name: "kind" | "src" | "srclang" | "srcset") =>
  n.eq(
    Compute.subset(
      Compute.singleton(
        AttributeGrammar.at("slot", AttributeModelOf.at("model", n.version, n.governor), name),
      ),
      n.attrs,
    ),
    true,
  );

/**
 * Reading 124's picture half (law "Picture source srcset", rule `source-srcset`; info §5.135.3:
 * "This attribute is required when 'source' is used in 'picture'"): a `source` whose parent is a
 * `picture` carries `srcset`.
 */
const pictureSourceSrcset = check("Picture_source_srcset", Node, (n) =>
  n.or(n.ne(n.kind, "source"), n.ne(n.parentKind, "picture"), carries(n, "srcset")),
);

/**
 * Reading 124's media half (law "Media source src", rule `source-src`; info §5.135.1: "This
 * characteristic must be present", read in a media element as HTML states it): a `source` whose
 * parent is an `audio` or a `video` carries `src`.
 */
const mediaSourceSrc = check("Media_source_src", Node, (n) =>
  n.or(n.ne(n.kind, "source"), n.not(n.in(n.parentKind, mediaKinds)), carries(n, "src")),
);

/**
 * Reading 125's missing value default (law "Track srclang", rule `track-srclang`): a `track` that
 * writes no `kind` is in the subtitles state, so it carries `srclang`.
 */
const defaultTrackSrclang = check("Track_srclang", Node, (n) =>
  n.or(n.ne(n.kind, "track"), carries(n, "kind"), carries(n, "srclang")),
);

/**
 * A `track`'s `kind` written as `subtitles`, the one lexical form of the subtitles state.
 */
const subtitleKinds = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "track"), a.eq(a.name, "kind"), a.eq(a.lexical, "subtitles")),
);

/**
 * A `track`'s `srclang`, one per element.
 */
const trackSrclangs = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "track"), a.eq(a.name, "srclang")),
);

/**
 * Reading 125's written state (law "Track srclang", rule `track-srclang`; info §5.163.3: "This
 * attribute must be present if the tag's kind attribute is in the subtitles state"): a `track`
 * whose `kind` is `subtitles` carries `srclang`.
 */
export const subtitleTrackSrclang = contained(
  on(subtitleKinds, "package", "path", "start"),
  on(trackSrclangs, "package", "path", "start"),
);

/**
 * A table cell's `headers`, the source of {@link CellHeaders}.
 */
const headersAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, cellKinds), a.eq(a.name, "headers")),
);

/**
 * A `th`'s `id` that is one of its document's IDs, its lexical form naming something once collapsed
 * ({@link namingPattern}), the source of {@link TableHeader}: any other names no header, as it has
 * no {@link DocumentId}, and its value domain refuses it alone (spec reading 156).
 */
const headerIds = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "th"), a.eq(a.name, "id"), Compute.matches(a.lexical, namingPattern)),
);

/**
 * The scopes whose table is read from the parent: every element but a `table` and a document's
 * root.
 */
const inheritedScopes = select(TableScope, (s) =>
  s.and(s.ne(s.kind, "table"), s.ne(s.parent, documentNode)),
);

/**
 * The headers that take part in a table: those whose nearest `table` is one, not the document node.
 */
const tabledHeaders = select(TableHeader, (h) => h.ne(h.table, documentNode));

/**
 * Reading 126 (law "Table headers", rule `table-headers`; info §5.140.1): each token of a cell's
 * `headers` is the `id` of a `th` taking part in the cell's table. One containment refuses a token
 * that names no ID, one that names a `td` or another element, and one that names a `th` of another
 * table, nested or enclosing; a cell no `table` holds has its document node as its table, which no
 * {@link tabledHeaders} row holds, so every token it writes is refused.
 */
export const tableHeaders = contained(
  on(HeaderToken, "package", "path", "table", "token"),
  on(tabledHeaders, "package", "path", "table", "id"),
);

/**
 * Every statement over the HTML overlays, each `check` named by its oracle law:
 *
 * - **Reading 124:** {@link pictureSourceSrcset} and {@link mediaSourceSrc};
 * - **Reading 125:** {@link defaultTrackSrclang}, and {@link subtitleTrackSrclang}, whose target, the
 *   `srclang` selection, is keyed by `Attribute`'s own key at its fixed name
 *   (`#pantry/qti/attributes.ts`);
 * - **TableScope:** each scope on its node's {@link nodeRef} tuple, a `table` its own table, a root
 *   that is no `table` the document's and every other element its parent's;
 * - **CellHeaders:** each cell's `headers` copied into its row, both ways, its table its scope's; its
 *   tokens a family whose concatenation is the value, or none for a value of whitespace alone, each
 *   token a maximal run of no whitespace (`E1_derived`), each holding its cell's table;
 * - **TableHeader:** each `th`'s `id` that is an ID value copied into its row, both ways, the way
 *   back an ID value of a `th` at its node, since a `th`'s one ID-typed attribute is its `id`
 *   (`#pantry/qti/identity.copyback.test.ts`); its value its {@link DocumentId}'s, its table its
 *   scope's; one row per (table, id) among those in a table, which an ID held twice in a document
 *   already breaks;
 * - **Reading 126:** a cell's tokens unique, and {@link tableHeaders}.
 */
export const htmlLawsByName = {
  "DocumentId key": [key(on(tabledHeaders, "package", "path", "table", "id"))],
  "E1 derived": [
    contained(
      on(TableScope, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", TableScope, (s) =>
      s.or(
        s.and(s.eq(s.kind, "table"), s.eq(s.table, s.start)),
        s.and(s.ne(s.kind, "table"), s.eq(s.parent, documentNode), s.eq(s.table, documentNode)),
        s.and(s.ne(s.kind, "table"), s.ne(s.parent, documentNode)),
      ),
    ),
    contained(
      on(inheritedScopes, "package", "path", "parent", "table"),
      on(TableScope, "package", "path", "start", "table"),
    ),
    contained(
      on(headersAttributes, "package", "path", "start", "lexical"),
      on(CellHeaders, "package", "path", "start", "lexical"),
    ),
    contained(
      on(CellHeaders, "package", "path", "start"),
      on(headersAttributes, "package", "path", "start"),
    ),
    contained(
      on(CellHeaders, "package", "path", "start", "table"),
      on(TableScope, "package", "path", "start", "table"),
    ),
    headerTokenFamily,
    contained(
      on(HeaderToken, "package", "path", "start", "table"),
      on(CellHeaders, "package", "path", "start", "table"),
    ),
    fold(
      headerTokenFamily,
      Monoid.concat,
      on(HeaderToken, "package", "path", "start", "piece", "piecesWas", "piecesAfter"),
      on(CellHeaders, "package", "path", "start", "tokenText"),
    ),
    check("E1_derived", CellHeaders, (c) =>
      c.or(
        c.eq(c.lexical, c.tokenText),
        c.and(c.eq(c.tokens, 0n), Compute.matches(c.lexical, spacePattern)),
      ),
    ),
    check("E1_derived", HeaderToken, (t) =>
      t.and(Compute.matches(t.token, idValuePattern), t.or(t.eq(t.at, 0n), t.ne(t.before, ""))),
    ),
    contained(
      on(headerIds, "package", "path", "start"),
      on(TableHeader, "package", "path", "start"),
    ),
    contained(
      on(TableHeader, "package", "path", "start"),
      on(namingIdAttributesOf("th"), "package", "path", "start"),
    ),
    contained(
      on(TableHeader, "package", "path", "start", "id", "owner"),
      on(DocumentId, "package", "path", "start", "id", "owner"),
    ),
    check("E1_derived", TableHeader, (h) => h.eq(h.owner, h.start)),
    contained(
      on(TableHeader, "package", "path", "start", "table"),
      on(TableScope, "package", "path", "start", "table"),
    ),
  ],
  "Media source src": [mediaSourceSrc],
  "Picture source srcset": [pictureSourceSrcset],
  "Table headers": [key(on(HeaderToken, "package", "path", "start", "token")), tableHeaders],
  "Track srclang": [defaultTrackSrclang, subtitleTrackSrclang],
} as const;

/**
 * {@link htmlLawsByName}'s statements in one list, the module's laws as the schema composes them.
 */
export const htmlLaws = Object.values(htmlLawsByName).flat();
