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
 * own check, so each refusal names its own law, where a containment from a `Node` selection into
 * an `Attribute` selection would give two of them one identity (`#pantry/import/refusal.ts`
 * `lawIdentity` drops a side's selection). A written `kind` is a value, which `attrs` does not
 * hold, so the other half is a containment between two `Attribute` selections. That a value is a
 * valid non-empty URL, and `srclang` a BCP 47 tag, is each attribute's value domain (AL1's lexical
 * half, readings 124, 125 and 129).
 *
 * Every copy of an attribute into an overlay follows C18 the other way round, as `identity.ts`
 * states it: from `select(Attribute, φ)` into the overlay, beside a key over the same selection
 * whose UNIQUE serves the copy's reverse probe. Every copied text that takes part in a cross-row
 * equality is `keyText` (`#pantry/qti/limits.ts`). Every check is named by its oracle law
 * (`#pantry/test/oracle.ts` `LawName`) with spaces written as underscores.
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
  key,
  Monoid,
  natural,
  on,
  ordered,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  AttributeGrammar,
  GoverningOf,
  NodeKind,
  SchemaVersion,
  SlotSelf,
} from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { DocumentId, idValuePattern, spacePattern } from "#pantry/qti/identity.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * The nil uuid: the start of a header token's owner-axis copy of its cell's table, which every
 * member's owner replaces.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * The kinds of the media elements, whose `source` children carry `src` (reading 124).
 */
export const mediaKinds = ["audio", "video"] as const;

/**
 * The kinds of the table cells, whose `headers` reading 126 reads.
 */
export const cellKinds = ["td", "th"] as const;

/**
 * One element on the way from a table cell an overlay reads up to the table it takes part in,
 * keyed by its node: its {@link nodeRef} tuple and `table`, its nearest `table`, itself included,
 * or the document node for an element no `table` holds. A `table` is its own table, a document's
 * root the document's where it is no `table`, and every other element its parent's, so a cell's
 * table is read up the tree with no copy on `Node`, as `identity.ts`'s `SsmlScope` reads an SSML
 * fragment.
 */
export const TableScope = relation(
  "TableScope",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    table: uuid,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One table cell's `headers`, keyed by the cell's node.
 *
 * - **copied from the attribute:** `node` and `lexical`, the value as written;
 * - **the host's:** `table`, the cell's {@link TableScope};
 * - **drawn:** `tokens`, its {@link HeaderToken} count;
 * - **accumulated:** `tokenText`, the end of its tokens' concatenation.
 */
export const CellHeaders = relation(
  "CellHeaders",
  {
    lexical: keyText,
    node: uuid,
    table: uuid,
    tokenText: accumulated(keyText, ""),
    tokens: drawn(natural),
  },
  ["node"],
);

/**
 * One token of a cell's `headers`, in order, with the whitespace written before and after it, so
 * its `piece` is a stretch of the value and the pieces concatenate to it, as `identity.ts`'s
 * `TextIdref` splits an element's text.
 *
 * - **the host's:** `before`, `token` and `after`, and `piece`, `before ‖ token ‖ after`, which
 *   `E1_derived` proves;
 * - **the family's group:** `node`, the cell;
 * - **drawn:** `at`;
 * - **accumulated:** `table`, its cell's, along the owner axis, which "Table headers" reads;
 *   `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const HeaderToken = relation(
  "HeaderToken",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    node: uuid,
    piece: keyText,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    table: accumulated(uuid, nilUuid),
    token: keyText,
  },
  ["node", "at"],
);

/**
 * One `th` that carries an `id`, keyed by its node: its document, its `id`, the ID's value as its
 * {@link DocumentId} holds it (an `xs:ID` collapsed), with `owner` the node itself, an attribute
 * ID's binding, so its copy shares the superkey `PlacedId` reads; and `table`, its
 * {@link TableScope}.
 */
export const TableHeader = relation(
  "TableHeader",
  { document: uuid, id: keyText, node: uuid, owner: uuid, table: uuid },
  ["node"],
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const htmlRelations = { CellHeaders, HeaderToken, TableHeader, TableScope };

/**
 * Each cell's `headers` tokens in order, counted by `CellHeaders.tokens`.
 */
export const headerTokenFamily = ordered(on(HeaderToken, "node", "at"), fin(CellHeaders, "tokens"));

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
      SlotSelf.row(
        AttributeGrammar.at(
          "position",
          n.version,
          GoverningOf.at("governor", n.version, n.kind, n.governs),
          name,
        ),
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
export const pictureSourceSrcset = check("Picture_source_srcset", Node, (n) =>
  n.or(n.ne(n.kind, "source"), n.ne(n.parentKind, "picture"), carries(n, "srcset")),
);

/**
 * Reading 124's media half (law "Media source src", rule `source-src`; info §5.135.1: "This
 * characteristic must be present", read in a media element as HTML states it): a `source` whose
 * parent is an `audio` or a `video` carries `src`.
 */
export const mediaSourceSrc = check("Media_source_src", Node, (n) =>
  n.or(n.ne(n.kind, "source"), n.not(n.in(n.parentKind, mediaKinds)), carries(n, "src")),
);

/**
 * Reading 125's missing value default (law "Track srclang", rule `track-srclang`): a `track` that
 * writes no `kind` is in the subtitles state, so it carries `srclang`.
 */
export const defaultTrackSrclang = check("Track_srclang", Node, (n) =>
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
export const subtitleTrackSrclang = contained(on(subtitleKinds, "node"), on(trackSrclangs, "node"));

/**
 * A table cell's `headers`, the source of {@link CellHeaders}.
 */
const headersAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, cellKinds), a.eq(a.name, "headers")),
);

/**
 * A `th`'s `id`, the source of {@link TableHeader}.
 */
const headerIds = select(Attribute, (a) => a.and(a.eq(a.kind, "th"), a.eq(a.name, "id")));

/**
 * The scopes whose table is read from the parent: every element but a `table` and a document's
 * root.
 */
const inheritedScopes = select(TableScope, (s) =>
  s.and(s.ne(s.kind, "table"), s.ne(s.parent, s.document)),
);

/**
 * The headers that take part in a table: those whose nearest `table` is one, not the document node.
 */
const tabledHeaders = select(TableHeader, (h) => h.ne(h.table, h.document));

/**
 * Reading 126 (law "Table headers", rule `table-headers`; info §5.140.1): each token of a cell's
 * `headers` is the `id` of a `th` taking part in the cell's table. One containment refuses a token
 * that names no ID, one that names a `td` or another element, and one that names a `th` of another
 * table, nested or enclosing; a cell no `table` holds has its document node as its table, which no
 * {@link tabledHeaders} row holds, so every token it writes is refused.
 */
export const tableHeaders = contained(
  on(HeaderToken, "table", "token"),
  on(tabledHeaders, "table", "id"),
);

/**
 * Every statement over the HTML overlays, each `check` named by its oracle law:
 *
 * - **Reading 124:** {@link pictureSourceSrcset} and {@link mediaSourceSrc};
 * - **Reading 125:** {@link defaultTrackSrclang}, and {@link subtitleTrackSrclang} with the key over
 *   the `srclang` selection it is contained in;
 * - **TableScope:** each scope on its node's {@link nodeRef} tuple, a `table` its own table, a root
 *   that is no `table` the document's and every other element its parent's;
 * - **CellHeaders:** each cell's `headers` copied into its row, both ways, its table its scope's; its
 *   tokens a family whose concatenation is the value, or none for a value of whitespace alone, each
 *   token a maximal run of no whitespace (`E1_derived`), each holding its cell's table;
 * - **TableHeader:** each `th`'s `id` copied into its row, both ways, its value its
 *   {@link DocumentId}'s, its table its scope's; one row per (table, id) among those in a table,
 *   which an ID held twice in a document already breaks;
 * - **Reading 126:** a cell's tokens unique, and {@link tableHeaders}.
 */
export const htmlLaws = [
  pictureSourceSrcset,
  mediaSourceSrc,
  defaultTrackSrclang,
  key(on(trackSrclangs, "node")),
  subtitleTrackSrclang,

  contained(
    on(TableScope, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  check("E1_derived", TableScope, (s) =>
    s.or(
      s.and(s.eq(s.kind, "table"), s.eq(s.table, s.node)),
      s.and(s.ne(s.kind, "table"), s.eq(s.parent, s.document), s.eq(s.table, s.document)),
      s.and(s.ne(s.kind, "table"), s.ne(s.parent, s.document)),
    ),
  ),
  contained(on(inheritedScopes, "parent", "table"), on(TableScope, "node", "table")),

  key(on(headersAttributes, "node")),
  contained(on(headersAttributes, "node", "lexical"), on(CellHeaders, "node", "lexical")),
  contained(on(CellHeaders, "node"), on(headersAttributes, "node")),
  contained(on(CellHeaders, "node", "table"), on(TableScope, "node", "table")),
  headerTokenFamily,
  contained(on(HeaderToken, "node", "table"), on(CellHeaders, "node", "table")),
  fold(
    headerTokenFamily,
    Monoid.concat,
    on(HeaderToken, "node", "piece", "piecesWas", "piecesAfter"),
    on(CellHeaders, "node", "tokenText"),
  ),
  check("E1_derived", CellHeaders, (c) =>
    c.or(
      c.eq(c.lexical, c.tokenText),
      c.and(c.eq(c.tokens, 0n), Compute.matches(c.lexical, spacePattern)),
    ),
  ),
  check("E1_derived", HeaderToken, (t) =>
    t.and(
      t.eq(t.piece, Compute.concat(Compute.concat(t.before, t.token), t.after)),
      Compute.matches(t.token, idValuePattern),
      t.or(t.eq(t.at, 0n), t.ne(t.before, "")),
    ),
  ),

  key(on(headerIds, "node")),
  contained(on(headerIds, "node", "document"), on(TableHeader, "node", "document")),
  contained(on(TableHeader, "node"), on(headerIds, "node")),
  contained(
    on(TableHeader, "node", "document", "id", "owner"),
    on(DocumentId, "node", "document", "id", "owner"),
  ),
  check("E1_derived", TableHeader, (h) => h.eq(h.owner, h.node)),
  contained(on(TableHeader, "node", "table"), on(TableScope, "node", "table")),
  key(on(tabledHeaders, "table", "id")),

  key(on(HeaderToken, "node", "token")),
  tableHeaders,
] as const;
