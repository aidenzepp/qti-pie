/**
 * The bounds grizzle's own representability rule puts on the text a key holds, in UTF-8 bytes, the
 * one measure, stated here once, so every overlay's key text shares one bound and no slice chooses
 * its own.
 *
 * Every key, every containment's target, every containment's source and every family's hidden
 * columns lower to a B-tree index (`laws/model/plan.ts` of the vendored engine emits a
 * `ReverseIndex` beside each foreign key), and grizzle refuses an index whose entry can pass
 * PostgreSQL's `BTMaxItemSize` (`UnrepresentableKey`). A text field with no byte bound can sit in
 * no index at all. So a text value that takes part in a cross-row equality (an ID or IDREF, an
 * identifier, an href) is copied into a field of type {@link keyText}, and a longer value is
 * refused where its copy is written: a stated limit of the representation, not a law of the
 * specification. Free text no law compares across rows is never copied, and stays on `Attribute`
 * or `Node`.
 *
 * Each bound is grizzle's `str.bytes(n, pattern)`, a refinement as a pattern is and no part of the
 * text's type, so a bounded copy meets the unbounded text it copies in a containment, and its `n`
 * is grizzle's own `keyTextBytes(fields)` (`public/text.ts` of the vendored engine), the UTF-8
 * bytes a text holds beside its key's other fields, read exactly as the schema's compilation reads
 * the key. No PostgreSQL constant is re-spelled here.
 *
 * @see {@link https://github.com/postgres/postgres/blob/REL_19_STABLE/src/include/access/nbtree.h | PostgreSQL, nbtree.h BTMaxItemSize}
 */
import {
  closedId,
  keyTextBytes as bytesBeside,
  lexicalForm,
  natural,
  pg,
  str,
} from "@bjornpagen/grizzle";
import { anyText, Position } from "#pantry/grammar/install.ts";

/**
 * The fields beside the key texts in the widest key any slice puts a key text in: the tree's
 * member superkey on `Node` and the predecessor and last axes' foreign keys over it, `(package,
 * path, parent, at, elements, end, the two hidden count-fold afters, state)` beside the string
 * value's running text, where `Node`'s `Monoid.concat` fold over its characters rides
 * (`#pantry/qti/node.ts`, grizzle's tree lowering merges each fold's pair into the axis's one
 * foreign key). `package` and `path` are the two identity texts ({@link identityText}); these are
 * the rest, `parent` the parent's position.
 */
const besideIdentity = [
  natural,
  natural,
  natural,
  natural,
  natural,
  natural,
  closedId(Position),
] as const;

/**
 * The empty text, a text field's own overhead in a key, at no byte of content.
 */
const emptyText = str.bytes(0, anyText);

/**
 * The most UTF-8 bytes a package's manifest identifier and an entry's path each hold, the two
 * texts of every key over a document or an element (`(package, path)`, `(package, path, start)`):
 * the widest key's six texts (a reading's package, assembly, path, source, named document and
 * variable) share its entry evenly, a sixth each of what grizzle's `keyTextBytes` leaves beside
 * {@link besideIdentity} and six empty texts. XML and IMS Content Packaging put no
 * bound on either, so a longer one is refused as a stated limit of the representation. 1EdTech's
 * corpus's longest is under 70 bytes.
 */
export const identityBytes = Math.floor(
  bytesBeside([...besideIdentity, emptyText, emptyText, emptyText, emptyText, emptyText]) / 6,
);

/**
 * An identity text at its bound, as the key rules count it: what `ManifestIdentifier`
 * (`#pantry/qti/package.ts`) and `EntryPath` (`#pantry/qti/chardata.ts`) are, each with its own
 * pattern, which no key's width reads.
 */
const identityText = str.bytes(identityBytes, anyText);

/**
 * An NCName (Namespaces in XML 1.0, §3): XML 1.0's `NameStartChar` without the colon, then its
 * `NameChar`s without the colon, written as classes, since grizzle's pattern grammar has no `\p`.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#NT-NCName | Namespaces in XML 1.0, NCName}
 */
const ncName =
  "[A-Z_a-z\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2FF}\\u{370}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}][\\-.0-9A-Z_a-z\\u{B7}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{203F}-\\u{2040}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}]*";

/**
 * A package's identity: its manifest's `identifier` (IMS Content Packaging 1.2, §6.11.4), the
 * `cp:manifest/@identifier` value whitespace-collapsed, since it is an `xs:ID` (decision 457 (3)),
 * so an NCName, at {@link identityBytes} UTF-8 bytes. `Package` is keyed by it, and every row of
 * the package holds it as its `package`. The importer refuses a manifest that writes none, or one
 * that is no NCName, under the rule its attribute's law names, so no row is built without it.
 */
export const ManifestIdentifier = str.bytes(identityBytes, str.regex(`^${ncName}$`));

/**
 * A package entry's path, relative to the package root, as the package reader gives it: no leading
 * `/`, its segments `/`-separated, any other character allowed, at most {@link identityBytes} UTF-8
 * bytes.
 *
 * The reader refuses an absolute path, a backslash and a `..` segment (`#pantry/package/zip.ts`,
 * `#pantry/package/read.ts`); the pattern restates none of that, and the byte bound bounds the
 * length alone. A file's identity in its package: `Entry`, `Document` and every row of a document
 * hold it as their `path`, and a reference resolved in the package names its target by one.
 */
export const EntryPath = str.bytes(identityBytes, str.regex("^[^/].*$", "su"));

/**
 * The widest key any slice puts a key text in, its other fields as grizzle types them: five
 * identity texts and {@link besideIdentity}, as a reading's containment in `Reading`. It
 * covers the narrower keys too: `Idref`'s `(package, path, start, attribute, index)`
 * (`#pantry/qti/attributes.ts`), a counted family's `(group, text, hidden index)` such as `File`'s
 * (`#pantry/qti/package.ts`), and a plain `(package, path, start, text)`. One bound for all of them
 * keeps a value one relation holds from being refused by another. A slice that puts key text in a
 * wider key widens this; until it does, grizzle's compile of `Qti` refuses the wider key as past
 * PostgreSQL's index row limit, so every test that compiles the schema fails.
 */
export const widestTextKey = [
  identityText,
  identityText,
  identityText,
  identityText,
  identityText,
  ...besideIdentity,
] as const;

/**
 * The most UTF-8 bytes a key text holds: what grizzle's `keyTextBytes` leaves beside
 * {@link widestTextKey}.
 */
export const keyTextBytes = bytesBeside(widestTextKey);

/**
 * The type of a copied text that takes part in a cross-row equality: any text of at most
 * {@link keyTextBytes} UTF-8 bytes, newlines included.
 *
 * A longer value is refused under one schema-wide oracle law, "Key text bound"
 * (`src/test/oracle.ts` `lawSources`), a stated limit of the representation and never a QTI law:
 * its domain's check refuses the row it is written in, at the database as in the oracle.
 */
export const keyText = str.bytes(keyTextBytes, anyText);

/**
 * The fields beside an open attribute's two name texts in the widest key they ride:
 * `OpenAttributeEntity(package, path, start, uri, local, offset)` (`#pantry/qti/attributes.ts`),
 * whose counted family's member key is as wide.
 */
const besideOpenName = [identityText, identityText, natural, natural] as const;

/**
 * The most UTF-8 bytes a name holds where a key holds it beside a namespace name, as
 * `OpenAttribute(package, path, start, uri, local)` holds an open attribute's local name: the two
 * share what `keyTextBytes` leaves beside {@link besideOpenName} and an empty text evenly. XML puts
 * no bound on a name (reading 94), so a longer one is refused as a stated limit of the
 * representation.
 */
export const localNameBytes = Math.floor(bytesBeside([...besideOpenName, emptyText]) / 2);

/**
 * The most UTF-8 bytes a namespace name holds: what `keyTextBytes` leaves beside the widest key it
 * rides, `OpenAttributeEntity`'s, {@link besideOpenName} and a local name of
 * {@link localNameBytes}; `OpenElementName(package, path, start, namespace)`, the containment of
 * an open attribute's element namespace into it, and the foreign class checks are narrower. One
 * bound for every one of them keeps a namespace name one relation holds from being refused by
 * another. `limits.test.ts` holds it to `keyTextBytes` over the local name's own type.
 */
export const namespaceBytes = bytesBeside([...besideOpenName, str.bytes(localNameBytes, anyText)]);

/**
 * The type of a namespace name a key holds: any text of at most {@link namespaceBytes} UTF-8
 * bytes. A longer one is refused under the oracle's "Key text bound" law, as a longer
 * {@link keyText} is.
 */
export const namespaceText = str.bytes(namespaceBytes, anyText);

/**
 * The most UTF-8 bytes a namespace prefix holds: what `keyTextBytes` leaves beside the other
 * fields of the key `Namespace(package, path, start, prefix)`.
 */
export const prefixBytes = bytesBeside([identityText, identityText, natural]);

/**
 * The encoder {@link utf8Length} counts with.
 */
const utf8 = new TextEncoder();

/**
 * Count a text's UTF-8 bytes, as PostgreSQL's `octet_length` counts a text of the UTF-8 database
 * encoding grizzle requires: the one measure every bound of this module is stated in.
 *
 * @param text - The text.
 * @returns Its bytes.
 */
export const utf8Length = (text: string): number => utf8.encode(text).length;

/**
 * The lexical form of an integer `Compute.cast` reads exactly: `xs:integer`'s, within PostgreSQL's
 * signed 64-bit range, a stated limit of the representation as the key-text bounds are. Spec
 * reading 46 holds a `qti-equal-rounded` `figures` to that range, so every integer AL1's lexical
 * half admits is in it, and a MathML alignment `selection` outside it counts as 0, which no child
 * has. The schema's casts (`#pantry/qti/operators.ts`, `#pantry/qti/mathml-align.ts`) and the
 * importer's reading of a selection (`#pantry/import/overlays/mathml-align.ts`) share this one
 * statement.
 */
export const integerForm = lexicalForm(pg.bigint);
