/**
 * The document layer beside `Node`: character data, the document row, namespace declarations and
 * foreign elements' names (plan §1.4; the W5 amendment's C13, C17 and C18; the orchestrator's
 * rulings of 2026-11-06).
 *
 * A node's own characters are one place, `Node.chars` (`#pantry/qti/node.ts`): a text or whitespace
 * node's text, an entity reference's `&name;`, empty elsewhere. So {@link Text}, {@link Whitespace}
 * and {@link EntityRef} are selections of `Node` by kind, and each arm's law is a row check over
 * `chars`: no second copy of the text exists, and no containment over unbounded text is needed to
 * prove one, which a B-tree entry could not hold. The string value that TextDomain judges is
 * `Node`'s `Monoid.concat` fold over those characters (Q5.05's law).
 *
 * The other arms, {@link Comment}, {@link Pi} and {@link Doctype}, and the {@link Document} row are
 * narrow relations keyed by `node`, each mirrored with `select(Node, kind = k)`: an arm row names a
 * node of its kind, and a node of its kind has its arm row. A target selected by `kind = k` is a
 * constant selection, so the arm carries the constant and every one of them references one
 * `UNIQUE (id, kind)` on `Node` (`laws/model/plan.ts` of the vendored engine, the recognition
 * table's constant-selection row).
 *
 * Each text field's pattern is XML's own production for what it holds, no tighter, except where a
 * key or an index over the field needs a byte bound, which each such field states.
 *
 * @see {@link https://www.w3.org/TR/xml/ | XML 1.0 (Fifth Edition)}
 * @see {@link https://www.w3.org/TR/xml-names/ | Namespaces in XML 1.0 (Third Edition)}
 */
import {
  accumulated,
  Bits,
  bits,
  check,
  closed,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  key,
  mirrors,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import {
  Flag,
  HeldRootsUnder,
  interactionKinds,
  KindByNameUnder,
  KindNamespace,
  NodeKind,
  nonElementKinds,
  openElementClasses,
  ResourceType,
  SchemaVersion,
  StrictlyHeld,
  TypeAvailable,
  TypeName,
  vocabularyNamespacePattern,
} from "#pantry/grammar/install.ts";
import { keyTextBytes, namespaceBytes, prefixBytes } from "#pantry/qti/limits.ts";
import { Node, nodeContext, nodeRef } from "#pantry/qti/node.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * XML 1.0's `Char` as the body of a class: tab, line feed, carriage return and every scalar from
 * U+0020 but the surrogates, U+FFFE and U+FFFF.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-Char | XML 1.0, Char}
 */
const xmlChar = "\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * XML 1.0's `Char` less its whitespace `S`: what makes a run of character data text rather than
 * whitespace.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const xmlNonSpace = "\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * The start characters of an NCName beyond ASCII: XML 1.0's `NameStartChar` from U+C0.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameStartChar | XML 1.0, NameStartChar}
 */
const nameStartWide =
  "\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2FF}\\u{370}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}";

/**
 * The characters XML 1.0's `NameChar` adds beyond ASCII to `NameStartChar`.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameChar | XML 1.0, NameChar}
 */
const nameCharWide = "\\u{B7}\\u{300}-\\u{36F}\\u{203F}-\\u{2040}";

/**
 * An NCName's first character: `NameStartChar` without the colon (Namespaces in XML 1.0, §3).
 *
 * @see {@link https://www.w3.org/TR/xml-names/#NT-NCName | Namespaces in XML 1.0, NCName}
 */
const ncStart = `A-Z_a-z${nameStartWide}`;

/**
 * An NCName's later characters: `NameChar` without the colon.
 */
const ncChar = `\\-.0-9A-Z_a-z${nameStartWide}${nameCharWide}`;

/**
 * An NCName, unanchored.
 */
const ncName = `[${ncStart}][${ncChar}]*`;

/**
 * The text of a node of kind `text`: a run of character data holding a character that is not
 * whitespace (`XdmText`), its references and CDATA sections expanded. A `<` or `&` in it is data,
 * which the writer escapes, so it holds no markup.
 *
 * @see {@link https://www.w3.org/TR/xml/#syntax | XML 1.0, §2.4 Character Data and Markup}
 */
export const textChars = `^[${xmlChar}]*[${xmlNonSpace}][${xmlChar}]*$`;

/**
 * The text of a node of kind `ws`: a non-empty run of XML whitespace (`XdmWhitespace`).
 */
export const whitespaceChars = "^[ \\t\\n\\r]+$";

/**
 * The characters of a node of kind `entityRef`: the reference as written, `&name;`, its name an
 * NCName, since no entity name holds a colon (Namespaces in XML 1.0, §7).
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-EntityRef | XML 1.0, EntityRef}
 */
export const entityRefChars = `^&${ncName};$`;

/**
 * The nodes of kind `text`, whose characters are {@link textChars}. A selection of `Node`, since a
 * text's characters are its node's `chars`.
 */
export const Text = select(Node, (n) => n.eq(n.kind, "text"));

/**
 * The nodes of kind `ws`, whose characters are {@link whitespaceChars}.
 */
export const Whitespace = select(Node, (n) => n.eq(n.kind, "ws"));

/**
 * The nodes of kind `entityRef`, whose characters are {@link entityRefChars}: the reference's
 * name is read from `chars` by the pattern.
 */
export const EntityRef = select(Node, (n) => n.eq(n.kind, "entityRef"));

/**
 * XML 1.0's `Char` less `-`: a comment's character that no `-` may precede within it.
 */
const charNoDash =
  "\\t\\n\\r\\u{20}-\\u{2C}\\u{2E}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * A comment's text, between `<!--` and `-->`: `Char`s with no `--` and no `-` at the end.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-Comment | XML 1.0, Comment}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const CommentText = str.regex(`^(?:[${charNoDash}]|-[${charNoDash}])*$`);

/**
 * A processing instruction's target: an NCName other than `xml` in any letter case, which XML
 * reserves.
 *
 * Without lookarounds, the reserved name is left out by length: one or two characters, three that
 * spell no case of `xml`, or four and more.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-PITarget | XML 1.0, PITarget}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const PiTarget = str.regex(
  `^(?:[${ncStart}][${ncChar}]?|[A-WYZ_a-wyz${nameStartWide}][${ncChar}]{2}|[Xx](?:[\\-.0-9A-LN-Z_a-ln-z${nameStartWide}${nameCharWide}][${ncChar}]|[Mm][\\-.0-9A-KM-Z_a-km-z${nameStartWide}${nameCharWide}])|[${ncStart}][${ncChar}]{3}[${ncChar}]*)$`,
);

/**
 * XML 1.0's `Char` less `?`: a character of an instruction's data that is no `?`.
 */
const charNoQuestion =
  "\\t\\n\\r\\u{20}-\\u{3E}\\u{40}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * XML 1.0's `Char` less `?` and `>`: the character after a run of `?` in an instruction's data, so
 * that the data holds no `?>`.
 */
const charNoClose =
  "\\t\\n\\r\\u{20}-\\u{3D}\\u{40}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * The rest of an instruction's data after its first character: `Char`s holding no `?>`, unanchored.
 */
const piDataRest = `(?:[${charNoQuestion}]|\\?+[${charNoClose}])*\\?*`;

/**
 * A processing instruction's data after its target and the whitespace that follows it: empty, or
 * `Char`s that start with no whitespace and hold no `?>`.
 *
 * The data starts at its first character that is not whitespace, since the whitespace between the
 * target and the data is `S`, which reads as many characters as it can; a reader gives the data so
 * and a writer puts one space back.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-PI | XML 1.0, PI}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const PiData = str.regex(
  `^(?:[\\u{21}-\\u{3E}\\u{40}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]${piDataRest}|\\?+(?:[${charNoClose}]${piDataRest})?)?$`,
);

/**
 * A document type declaration as written, `<!DOCTYPE` to its closing `>`: its internal subset is
 * kept as text, so its shape past the keyword is the reader's, never re-checked here.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-doctypedecl | XML 1.0, doctypedecl}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const DoctypeText = str.regex(`^<!DOCTYPE[ \\t\\n\\r][${xmlChar}]*>$`);

/**
 * An encoding name, as an XML declaration's `encoding` and the reader's charset labels spell it.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-EncName | XML 1.0, EncName}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const EncName = str.regex("^[A-Za-z][A-Za-z0-9._\\-]*$");

/**
 * The XML declaration's `encoding` as `Document` holds it: an encoding name, or the empty label
 * when the declaration writes none. `none` is itself a legal encoding name, so the empty label,
 * which `EncName`'s leading letter excludes, is the null object (spec reading of q1.02).
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const DeclaredEncoding = str.regex("^(?:[A-Za-z][A-Za-z0-9._\\-]*)?$");

/**
 * The XML declaration's `version` as `Document` holds it: a `VersionNum`, or `none` when the
 * document writes no declaration (D7).
 *
 * The version is text, not a roster, because `VersionNum` is open: any `1.` and digits is XML 1.0
 * (XML 1.0 §2.8), so a list of versions would refuse a well-formed document.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-VersionNum | XML 1.0, VersionNum}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const XmlVersion = str.regex("^(?:none|1\\.[0-9]+)$");

/**
 * The XML declaration's `standalone` as `Document` holds it: `yes` or `no` as written, and the null
 * object `none` where the document writes no declaration or the declaration no `standalone` (D7).
 * `Qti` lists this roster beside its relations.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-SDDecl | XML 1.0, SDDecl}
 */
export const XmlStandalone = closed("XmlStandalone", ["none", "yes", "no"]);

/**
 * A package entry's path, relative to the package root, as the package reader gives it: no leading
 * `/`, its segments `/`-separated, any other character allowed, at most `keyTextBytes` UTF-8 bytes
 * (`#pantry/qti/limits.ts`).
 *
 * The reader refuses an absolute path, a backslash and a `..` segment (`#pantry/package/zip.ts`,
 * `#pantry/package/read.ts`); the pattern restates none of that, and the byte bound bounds the
 * length alone. `Entry.path` (Q5.06) and `Document.path` are both of this type, both sit in keys
 * over `(package, path)`, and a path meets the key texts a manifest's hrefs are copied into, so its
 * bound is the schema-wide key-text bound, read from grizzle's B-tree rule in one place.
 */
export const EntryPath = str.bytes(keyTextBytes, str.regex("^[^/].*$", "su"));

/**
 * A namespace declaration's prefix as written: an NCName, or empty for a default declaration
 * (`xmlns="…"`), of at most `prefixBytes` UTF-8 bytes (`#pantry/qti/limits.ts`), what the key
 * `Namespace(node, prefix)` leaves it beside its element's id.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#ns-decl | Namespaces in XML 1.0, §3 Declaring Namespaces}
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const NamespacePrefix = str.bytes(prefixBytes, str.regex(`^(?:[${ncStart}][${ncChar}]*)?$`));

/**
 * RFC 3986's `unreserved` as the body of a class: `ALPHA / DIGIT / "-" / "." / "_" / "~"`.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#appendix-A | RFC 3986, Appendix A}
 */
const uriUnreserved = "A-Za-z0-9\\-._~";

/**
 * RFC 3986's `sub-delims` as the body of a class.
 */
const uriSubDelims = "!$&'()*+,;=";

/**
 * RFC 3986's `pct-encoded`: `"%" HEXDIG HEXDIG`, a hex digit of either case (RFC 5234 §2.3 reads
 * ABNF's quoted `"A"` to `"F"` without regard to case).
 */
const uriPctEncoded = "%[0-9A-Fa-f]{2}";

/**
 * RFC 3986's `pchar`: `unreserved / pct-encoded / sub-delims / ":" / "@"`.
 */
const uriPchar = `(?:[${uriUnreserved}${uriSubDelims}:@]|${uriPctEncoded})`;

/**
 * RFC 3986's `dec-octet`, 0 to 255 with no leading zero.
 */
const uriDecOctet = "(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])";

/**
 * RFC 3986's `h16`, one to four hex digits.
 */
const uriH16 = "[0-9A-Fa-f]{1,4}";

/**
 * RFC 3986's `ls32`: `( h16 ":" h16 ) / IPv4address`.
 */
const uriLs32 = `(?:${uriH16}:${uriH16}|${uriDecOctet}\\.${uriDecOctet}\\.${uriDecOctet}\\.${uriDecOctet})`;

/**
 * RFC 3986's `IPv6address`, its nine alternatives in the Appendix's order.
 */
const uriIpv6 = `(?:(?:${uriH16}:){6}${uriLs32}|::(?:${uriH16}:){5}${uriLs32}|(?:${uriH16})?::(?:${uriH16}:){4}${uriLs32}|(?:(?:${uriH16}:){0,1}${uriH16})?::(?:${uriH16}:){3}${uriLs32}|(?:(?:${uriH16}:){0,2}${uriH16})?::(?:${uriH16}:){2}${uriLs32}|(?:(?:${uriH16}:){0,3}${uriH16})?::${uriH16}:${uriLs32}|(?:(?:${uriH16}:){0,4}${uriH16})?::${uriLs32}|(?:(?:${uriH16}:){0,5}${uriH16})?::${uriH16}|(?:(?:${uriH16}:){0,6}${uriH16})?::)`;

/**
 * RFC 3986's `host`: an `IP-literal` (`"[" ( IPv6address / IPvFuture ) "]"`, the `"v"` of
 * `IPvFuture` of either case) or a `reg-name`. Its third alternative, `IPv4address`, is left out
 * because every one is a `reg-name` too, of digits and `.`, so the language is the same.
 */
const uriHost = `(?:\\[(?:${uriIpv6}|[Vv][0-9A-Fa-f]+\\.[${uriUnreserved}${uriSubDelims}:]+)\\]|(?:[${uriUnreserved}${uriSubDelims}]|${uriPctEncoded})*)`;

/**
 * RFC 3986's `"//" authority path-abempty`, the branch `hier-part` and `relative-part` share:
 * `[ userinfo "@" ] host [ ":" port ]`, then `*( "/" segment )`.
 */
const uriNetworkPath = `//(?:(?:[${uriUnreserved}${uriSubDelims}:]|${uriPctEncoded})*@)?${uriHost}(?::[0-9]*)?(?:/${uriPchar}*)*`;

/**
 * RFC 3986's `path-absolute`: `"/" [ segment-nz *( "/" segment ) ]`.
 */
const uriPathAbsolute = `/(?:${uriPchar}+(?:/${uriPchar}*)*)?`;

/**
 * RFC 3986's `URI-reference`, `URI / relative-ref`, unanchored: a `URI`'s `scheme ":" hier-part`
 * or a `relative-ref`'s `relative-part`, each path's empty alternative its group's `?`, then the
 * `[ "?" query ] [ "#" fragment ]` both end with. A `relative-part`'s `path-noscheme` begins with
 * a `segment-nz-nc`, a segment with no `:`, so no relative reference reads as a scheme.
 */
const uriReference = `(?:[A-Za-z][A-Za-z0-9+\\-.]*:(?:${uriNetworkPath}|${uriPathAbsolute}|${uriPchar}+(?:/${uriPchar}*)*)?|(?:${uriNetworkPath}|${uriPathAbsolute}|(?:[${uriUnreserved}${uriSubDelims}@]|${uriPctEncoded})+(?:/${uriPchar}*)*)?)(?:\\?(?:${uriPchar}|[/?])*)?(?:#(?:${uriPchar}|[/?])*)?`;

/**
 * A namespace declaration's value as read, after attribute-value normalization: an RFC 3986
 * `URI-reference` (spec reading 131), which Namespaces in XML 1.0 (Third Edition) asks of it ("The
 * attribute's normalized value MUST be either a URI reference — the namespace name identifying the
 * namespace — or an empty string", §3; "An XML namespace is identified by a URI reference
 * [RFC3986]", §2.1). The empty string is one, a `relative-ref` of an empty path; the reader admits
 * it only where an unprefixed declaration undeclares the default namespace. A relative reference is
 * deprecated (§2.2), not refused. Its characters are US-ASCII, so a space, a `%` with no two hex
 * digits after it and any character beyond ASCII are refused, as is an IP literal that is no IPv6
 * or IPvFuture address and a port that is not digits. The foreign names' namespaces
 * (`ForeignNamespace`, the open names' `uri`) come from these declarations, so they need no pattern
 * of their own. `chardata.oracle.test.ts` judges the pattern against the law oracle's own
 * recogniser of Appendix A's grammar (`#pantry/test/uri-reference.ts`).
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#ns-decl | Namespaces in XML 1.0, §3 Declaring Namespaces}
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.1 | RFC 3986, §4.1 URI Reference}
 */
export const NamespaceUri = str.regex(`^${uriReference}$`);

/**
 * A foreign element's namespace name, empty for none, of XML `Char`s and at most `namespaceBytes`
 * UTF-8 bytes (`#pantry/qti/limits.ts`): the one bound every key a namespace name rides leaves it,
 * so a name one relation holds is never refused by another. A foreign parent's namespace is read
 * through a containment into `OpenElementName(node, namespace)`, and an open attribute's element
 * namespace through another.
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const ForeignNamespace = str.bytes(namespaceBytes, str.regex(`^[${xmlChar}]*$`));

/**
 * An NCName: a foreign element's local name.
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const NcName = str.regex(`^${ncName}$`);

/**
 * A comment node's text, keyed by its node (`XdmComment`).
 */
export const Comment = relation("Comment", { node: uuid, value: CommentText }, ["node"]);

/**
 * A processing instruction node's target and data, keyed by its node (`XdmPi`).
 */
export const Pi = relation("Pi", { data: PiData, node: uuid, target: PiTarget }, ["node"]);

/**
 * The document node's doctype child, its declaration as written, keyed by its node (`XdmDoctype`).
 */
export const Doctype = relation("Doctype", { node: uuid, value: DoctypeText }, ["node"]);

/**
 * The document row, one per document node, keyed by the node (plan §1.4): the entry it was read
 * from, the charset it was decoded under and the one it is written back in, the XML declaration's
 * fields through their null objects (D7), its root element's kind, and the type of the resource
 * that lists it.
 *
 * - `package` and `path` are its `Entry`'s, which Q5.06's P3 states, with the key over them.
 * - `xmlVersion` is `none` when the document writes no declaration, and then `encoding` is empty and
 *   `standalone` is `none` (the `Document` check).
 * - `rootKind` is a `NodeKind` handle, the root element's kind, which a containment from the root
 *   element proves. `RootOfType`'s payload is over `NodeKind` too, so P2 compares them directly.
 * - `resourceType` is the type of the resource that lists the document, `none` for the manifest,
 *   which no resource lists (ResourceType's code 0); Q5.06's P1 and P2 judge it.
 * - **its context** (spec readings 85 and 117): the ancestry and nearest interaction its document
 *   node holds, which every node below it inherits along the tree's owner axis, so an included
 *   fragment's content is judged where it is included. `context` is the union of the ancestries of
 *   the sites that name the document (Q5.13's `Site`, counted by `targetedBy` and folded by
 *   `Monoid.or`), empty where none does: a ban is a disjointness, so the union is exact for every
 *   placement. `contextNearest` and `contextNearestKind` are the host's: the document node itself
 *   and `document`, or the one interaction every site that names the document stands in, which
 *   Q5.13's "Fragment context" holds each site to.
 * - **its assembly** (spec readings 85 and 117): `assembled`, the host's, whether the document is in
 *   an assembly (it has a Q5.13 `TestDocument` row: a test or a section, or a document that holds a
 *   site or that a site names), so its IDREFs resolve per instance of its assemblies rather than in
 *   it alone (Q5.07); and the counts its instances copy, drawn: `bindings`, `choices` and
 *   `hottexts` (Q5.09's `BindingName`, `Choice` and `Hottext` rows), `ids` (Q5.07's `DocumentId`
 *   rows), `idrefTargets` (Q5.07's `IdrefTarget` rows), `langs` (Q5.07's `XmlLang` rows) and
 *   `variables` (Q5.10's `VariableRef` rows).
 * - **its document node's copies:** `nodeChildren`, `nodeDocument`, `nodeGoverns`, `nodeKind`,
 *   `nodeParentKind`, `nodeStart` and `version`, the document node's own, so the row states the
 *   node's context through {@link nodeContext}, the owner axis's own UNIQUE, and no other index on
 *   `Node` holds it.
 */
export const Document = relation(
  "Document",
  {
    assembled: pg.boolean,
    bindings: drawn(natural),
    charset: EncName,
    choices: drawn(natural),
    context: accumulated(bits(Flag), Bits.of(Flag, [])),
    contextNearest: uuid,
    contextNearestKind: closedId(NodeKind),
    encoding: DeclaredEncoding,
    exportCharset: EncName,
    hottexts: drawn(natural),
    idrefTargets: drawn(natural),
    ids: drawn(natural),
    langs: drawn(natural),
    node: uuid,
    nodeChildren: natural,
    nodeDocument: uuid,
    nodeGoverns: closedId(TypeName),
    nodeKind: closedId(NodeKind),
    nodeParentKind: closedId(NodeKind),
    nodeStart: natural,
    package: uuid,
    path: EntryPath,
    resourceType: closedId(ResourceType),
    rootKind: closedId(NodeKind),
    standalone: closedId(XmlStandalone),
    targetedBy: drawn(natural),
    variables: drawn(natural),
    version: closedId(SchemaVersion),
    xmlVersion: XmlVersion,
  },
  ["node"],
);

/**
 * A namespace declaration on an element, at its slot among the element's declarations in source
 * order (`XdmNamespace`): a member of {@link namespaceFamily}, written nested at
 * `Node.namespaces`, its `node` and `at` drawn by the nesting.
 */
export const Namespace = relation(
  "Namespace",
  { at: drawn(natural), node: uuid, prefix: NamespacePrefix, uri: NamespaceUri },
  ["node", "at"],
);

/**
 * Each element's namespace declarations, in source order, counted by `Node.namespaces` (fin.md
 * §5.2): the law the oracle names "Namespace family".
 */
export const namespaceFamily = ordered(on(Namespace, "node", "at"), fin(Node, "namespaces"));

/**
 * A foreign element's expanded name, keyed by its node (`OpenElementNameRow`): the namespace name,
 * empty for none, and the local name. Its prefix is its node's.
 *
 * The rest is what its laws read, each written by the host and proved:
 *
 * - `document`, `kind`, `start`, `nearest`, `version` and `parent` are its node's {@link nodeRef}
 *   tuple (C18);
 * - `governs` is its node's governing type, through the `(id, kind, version, document, governs)`
 *   tuple the attribute and identity overlays copy too, so one UNIQUE on `Node` serves them all;
 * - `parentKind` is its parent's kind, through `UNIQUE (id, kind)` on `Node`;
 * - `parentNamespace` is its parent's namespace name: `KindNamespace`'s for a parent of a kind, the
 *   parent's own row's for a foreign parent.
 */
export const OpenElementName = relation(
  "OpenElementName",
  {
    document: uuid,
    governs: closedId(TypeName),
    kind: closedId(NodeKind),
    local: NcName,
    namespace: ForeignNamespace,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    parentNamespace: ForeignNamespace,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The root element of each document: the document node's one child that is an element. Its parent
 * copy reads `document`, and every other child of the document node is a doctype, a comment or an
 * instruction.
 */
const rootElements = select(Node, (n) =>
  n.and(n.eq(n.parentKind, "document"), n.not(n.in(n.kind, nonElementKinds))),
);

/**
 * Every statement over the document layer's character data, documents, namespaces and foreign
 * names, each `check` named by its oracle law with spaces written as underscores:
 *
 * - **the arms both ways** ("text arm" to "doctype arm"): a node of kind text, ws or entityRef holds
 *   its pattern's characters, and `Node`'s own `E1_derived` empties every other node's; a comment,
 *   an instruction and a doctype are each one arm row of their node, and their node is of their
 *   kind.
 * - **"Document":** one row per document node, both ways; its root kind is its root element's; and no
 *   declaration means no `encoding` and no `standalone` (q1.02's hand-off).
 * - **its context** (spec reading 117): its document node's ancestry and nearest interaction are its
 *   `context`, `contextNearest` and `contextNearestKind`, through {@link nodeContext}; and
 *   (`E1_derived`) the nearest is the document node itself, unless sites name the document from
 *   inside one interaction.
 * - **"Namespace family":** each element's declarations in order, and one per prefix on an element
 *   (Namespaces in XML 1.0, §3: a prefix is declared once on an element, since an element's
 *   attributes are distinct by name).
 * - **"OpenElementName":** one row per foreign element, both ways: every node of a foreign kind has
 *   its row, and each row carries its node's tuple, its governing type and its parent's kind, its
 *   own kind one of the three classes, which `Foreign_element_class`'s first conjunct holds.
 * - **"Foreign element class"** (rule `unmodeled-vocabulary`): its stored namespace agrees with its
 *   class against its parent's, as XML Schema 1.0 Part 1 §3.10.4 classes a wildcard's names:
 *   `no-namespace-element` in none, `own-namespace-element` in its parent's, `foreign-element` in
 *   another; the parent's namespace is `KindNamespace`'s for a parent of a kind and the parent's
 *   own row's for a foreign one. And on `Node` (C4), an element in no namespace is written with no
 *   prefix: a prefixed name is in its prefix's namespace, and no prefix binds the empty one
 *   (Namespaces in XML 1.0, §5, "Namespace constraint: No Prefix Undeclaring"), so only an
 *   unprefixed name is in none (§6.2).
 * - **"OpenElementName canonical"** (C8): no foreign element bears the expanded name of an element
 *   kind its parent admits there, since that name resolves to the kind (XML Schema 1.0 Part 1,
 *   §3.3.4 clauses 1.1.1.2 and 1.1.1.3.2, with §3.10.4 clause 2; shred reads it so).
 *   `KindByNameUnder` holds each (version, parent)'s names as one pattern over `namespace}local`,
 *   the subject built by `Compute.concat`, since a closed relation's key is closed ids only.
 * - **"XsiType available"** (C15, C36; spec readings 60 and 81): a foreign element's governing type
 *   is one its document's schema set holds, or XML Schema's own, or `none`, read from its parent's
 *   namespace through `TypeAvailable`; under a parent of no vocabulary's namespace, which stands in
 *   documents of every set, any type stands. Which set a document is assessed against is not on
 *   `Node`, so the parent's namespace stands for it: reading 81's recorded limit.
 * - **"Strictly held"** (C44, C13; spec readings 6 and 81): a foreign element its parent's model
 *   holds only by `strict` wildcards (`StrictlyHeld`) has a governing type, since without one XML
 *   Schema cannot assess it (§3.10.4 clause 2, §3.3.5 [validity] clause 1.1.3), unless its expanded
 *   name is one of reading 6's roots its documents' schema set declares there (`HeldRootsUnder`),
 *   which the wildcard assesses against that declaration (`cp:manifest` under
 *   `drd:accessForAllResource`). shred refuses the rest as `strict-undeclared`.
 * - **"MathML foreign element"** (reading 2): no foreign element is in MathML's namespace.
 */
export const chardataLawsByName = {
  Document: [
    mirrors(
      on(Document, "node"),
      on(
        select(Node, (n) => n.eq(n.kind, "document")),
        "id",
      ),
    ),
    contained(on(rootElements, "document", "kind"), on(Document, "node", "rootKind")),
    check("Document", Document, (d) =>
      d.or(d.ne(d.xmlVersion, "none"), d.and(d.eq(d.encoding, ""), d.eq(d.standalone, "none"))),
    ),
  ],
  "E1 derived": [
    contained(
      on(
        Document,
        "node",
        "nodeChildren",
        "context",
        "nodeDocument",
        "nodeGoverns",
        "nodeKind",
        "contextNearest",
        "contextNearestKind",
        "nodeParentKind",
        "nodeStart",
        "version",
      ),
      nodeContext,
    ),
    check("E1_derived", Document, (d) =>
      d.or(
        d.and(d.eq(d.contextNearestKind, "document"), d.eq(d.contextNearest, d.node)),
        d.and(d.in(d.contextNearestKind, interactionKinds), d.gt(d.targetedBy, 0n)),
      ),
    ),
    contained(
      on(OpenElementName, "node", "kind", "version", "document", "governs"),
      on(Node, "id", "kind", "version", "document", "governs"),
    ),
  ],
  "Foreign element class": [
    contained(on(OpenElementName, "parent", "parentKind"), on(Node, "id", "kind")),
    check("Foreign_element_class", OpenElementName, (o) =>
      o.and(
        o.or(
          o.and(o.eq(o.kind, "no-namespace-element"), o.eq(o.namespace, "")),
          o.and(
            o.eq(o.kind, "own-namespace-element"),
            o.ne(o.namespace, ""),
            o.eq(o.namespace, o.parentNamespace),
          ),
          o.and(
            o.eq(o.kind, "foreign-element"),
            o.ne(o.namespace, ""),
            o.ne(o.namespace, o.parentNamespace),
          ),
        ),
        o.or(
          o.in(o.parentKind, openElementClasses),
          o.eq(o.parentNamespace, KindNamespace.at("namespace", o.parentKind)),
        ),
      ),
    ),
    contained(
      on(
        select(OpenElementName, (o) => o.in(o.parentKind, openElementClasses)),
        "parent",
        "parentNamespace",
      ),
      on(OpenElementName, "node", "namespace"),
    ),
    check("Foreign_element_class", Node, (n) =>
      n.or(n.ne(n.kind, "no-namespace-element"), n.eq(n.prefix, "")),
    ),
  ],
  "MathML foreign element": [
    check("MathML_foreign_element", OpenElementName, (o) => o.ne(o.namespace, mathmlNamespace)),
  ],
  "Namespace family": [namespaceFamily, key(on(Namespace, "node", "prefix"))],
  OpenElementName: [
    contained(
      on(OpenElementName, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) => n.in(n.kind, openElementClasses)),
        "id",
      ),
      on(OpenElementName, "node"),
    ),
  ],
  "OpenElementName canonical": [
    check("OpenElementName_canonical", OpenElementName, (o) =>
      o.not(
        Compute.matches(
          Compute.concat(Compute.concat(o.namespace, "}"), o.local),
          KindByNameUnder.at("names", o.version, o.parentKind),
        ),
      ),
    ),
  ],
  "Strictly held": [
    check("Strictly_held", OpenElementName, (o) =>
      o.or(
        o.not(o.in(o.kind, openElementClasses)),
        ...openElementClasses.map((kind) =>
          o.and(
            o.eq(o.kind, kind),
            o.eq(
              Compute.disjoint(
                StrictlyHeld.row(o.version, o.parentKind),
                Bits.of(NodeKind, [kind]),
              ),
              true,
            ),
          ),
        ),
        o.ne(o.governs, "none"),
        Compute.matches(
          Compute.concat(Compute.concat(o.namespace, "}"), o.local),
          HeldRootsUnder.at("names", o.version, o.parentKind),
        ),
      ),
    ),
  ],
  "XsiType available": [
    check("XsiType_available", OpenElementName, (o) =>
      o.or(
        Compute.matches(o.parentNamespace, TypeAvailable.at("namespaces", o.governs)),
        o.not(Compute.matches(o.parentNamespace, vocabularyNamespacePattern)),
      ),
    ),
  ],
  "comment arm": [
    mirrors(
      on(Comment, "node"),
      on(
        select(Node, (n) => n.eq(n.kind, "comment")),
        "id",
      ),
    ),
  ],
  "doctype arm": [
    mirrors(
      on(Doctype, "node"),
      on(
        select(Node, (n) => n.eq(n.kind, "doctype")),
        "id",
      ),
    ),
  ],
  "entityRef arm": [
    check("entityRef_arm", Node, (n) =>
      n.or(n.ne(n.kind, "entityRef"), Compute.matches(n.chars, entityRefChars)),
    ),
  ],
  "pi arm": [
    mirrors(
      on(Pi, "node"),
      on(
        select(Node, (n) => n.eq(n.kind, "pi")),
        "id",
      ),
    ),
  ],
  "text arm": [
    check("text_arm", Node, (n) => n.or(n.ne(n.kind, "text"), Compute.matches(n.chars, textChars))),
  ],
  "ws arm": [
    check("ws_arm", Node, (n) =>
      n.or(n.ne(n.kind, "ws"), Compute.matches(n.chars, whitespaceChars)),
    ),
  ],
} as const;

/**
 * {@link chardataLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const chardataLaws = Object.values(chardataLawsByName).flat();
