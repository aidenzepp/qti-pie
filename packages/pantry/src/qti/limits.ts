/**
 * The bounds grizzle's own representability rule puts on the text a key holds, derived here once
 * from that rule, so every overlay's key text shares one bound and no slice chooses its own.
 *
 * Every key, every containment's target, every containment's source and every family's hidden
 * columns lower to a B-tree index (`laws/model/plan.ts` of the vendored engine emits a
 * `ReverseIndex` beside each foreign key), and grizzle refuses an index whose entry can pass
 * PostgreSQL's `BTMaxItemSize` (`UnrepresentableKey`, `schema/representability.ts` `keyLayout` and
 * `physical/indexes/engine.ts` `createIndex`). A text field with no bounded pattern can sit in no
 * index at all. So a text value that takes part in a cross-row equality (an ID or IDREF, an
 * identifier, an href) is copied into a field of type {@link keyText}, whose pattern proves the
 * bound below, and a longer value finds no row to equal: the copy's own foreign key refuses it,
 * a stated limit of the representation, not a law of the specification. Free text no law compares
 * across rows is never copied, and stays on `Attribute` or `Node`.
 *
 * @see {@link https://github.com/postgres/postgres/blob/REL_19_STABLE/src/include/access/nbtree.h | PostgreSQL, nbtree.h BTMaxItemSize}
 */
import { str } from "@bjornpagen/grizzle";

/**
 * One datum of a B-tree index entry as grizzle's `btreeEntryBytes` counts it: the most bytes it
 * takes, and the alignment its type is stored at, whose worst-case padding precedes it.
 */
export interface KeyDatum {
  readonly align: number;
  readonly bytes: number;
}

/**
 * PostgreSQL's block size, `BLCKSZ`, at the build grizzle pins (`core/limits.ts` `blockSize`).
 */
const blockSize = 8192;

/**
 * PostgreSQL's `MAXALIGN` on a 64-bit build: every index tuple and page part is padded to it.
 */
const maxAlign = 8;

/**
 * `SizeOfPageHeaderData`, the page header every B-tree page starts with.
 */
const pageHeaderBytes = 24;

/**
 * `sizeof(ItemIdData)`, one line pointer.
 */
const itemIdBytes = 4;

/**
 * `sizeof(BTPageOpaqueData)`, a B-tree page's special space.
 */
const btreeOpaqueBytes = 16;

/**
 * `sizeof(ItemPointerData)`, the heap tuple identifier a pivot tuple keeps.
 */
const itemPointerBytes = 6;

/**
 * `sizeof(IndexTupleData)`, the header of every index tuple: its heap tuple identifier and its
 * two-byte `t_info`.
 */
const indexTupleHeaderBytes = 8;

/**
 * `VARHDRSZ`, a variable-length datum's header at its longest: grizzle counts a text uncompressed,
 * since no compression ratio is guaranteed.
 */
const varlenaHeaderBytes = 4;

/**
 * The most bytes UTF-8 encodes one code point in (RFC 3629, §3), the database encoding grizzle
 * requires.
 */
const utf8MaxBytes = 4;

/**
 * The alignment of a text datum, `typalign = 'i'`.
 */
const textAlign = 4;

/**
 * The longest counted repetition a pattern may write, PostgreSQL's `DUPMAX`, which grizzle's
 * pattern grammar enforces; a longer bound is written as consecutive repetitions.
 */
const repetitionMax = 255;

/**
 * Round a byte count up to an alignment.
 *
 * @param n - The bytes.
 * @param align - The alignment, a power of two.
 * @returns The least multiple of `align` at or above `n`.
 */
const alignUp = (n: number, align: number): number => Math.ceil(n / align) * align;

/**
 * Round a byte count down to an alignment.
 *
 * @param n - The bytes.
 * @param align - The alignment, a power of two.
 * @returns The greatest multiple of `align` at or below `n`.
 */
const alignDown = (n: number, align: number): number => Math.floor(n / align) * align;

/**
 * `BTMaxItemSize`, the most bytes one B-tree entry may take: a third of a page less its header and
 * special space, `MAXALIGN_DOWN`ed, less the pivot's heap tuple identifier. 2,704 at `BLCKSZ` 8192,
 * as grizzle derives it (`schema/representability.ts` `btreeMaxItemSize`).
 */
export const btreeMaxItemSize =
  alignDown(
    (blockSize -
      alignUp(pageHeaderBytes + 3 * itemIdBytes, maxAlign) -
      alignUp(btreeOpaqueBytes, maxAlign)) /
      3,
    maxAlign,
  ) - alignUp(itemPointerBytes, maxAlign);

/**
 * The datums of the non-text fields a key may hold, at grizzle's widths and alignments
 * (`schema/representability.ts` `datumBound`): a `uuid` (16 bytes, `typalign = 'c'`), a closed
 * id's smallint code, a bigint, which every `natural` and every family's hidden index, count copy
 * and predecessor are, and a boolean (1 byte, `typalign = 'c'`), which a lookup's verdict is.
 */
export const keyDatums = {
  bigint: { align: 8, bytes: 8 },
  boolean: { align: 1, bytes: 1 },
  code: { align: 2, bytes: 2 },
  uuid: { align: 1, bytes: 16 },
} as const satisfies Readonly<Record<string, KeyDatum>>;

/**
 * Measure a B-tree entry over these datums as grizzle's `btreeEntryBytes` does: the index tuple
 * header, then each datum after its worst-case alignment padding, the whole `MAXALIGN`ed.
 *
 * @param datums - The entry's datums, in any order.
 * @returns The most bytes the entry can take.
 */
export const btreeEntryBytes = (datums: readonly KeyDatum[]): number =>
  alignUp(
    datums.reduce((size, { align, bytes }) => size + align - 1 + bytes, indexTupleHeaderBytes),
    maxAlign,
  );

/**
 * The datum of a text of at most `codePoints` code points.
 *
 * @param codePoints - The bound.
 * @returns Its varlena header and four UTF-8 bytes a code point.
 */
export const textDatum = (codePoints: number): KeyDatum => ({
  align: textAlign,
  bytes: varlenaHeaderBytes + utf8MaxBytes * codePoints,
});

/**
 * Compute the most code points a text may hold in a key beside these other datums and still fit
 * one B-tree entry.
 *
 * @param others - The key's other datums.
 * @returns The greatest bound whose entry is at most {@link btreeMaxItemSize}, 0 when none fits.
 */
export const keyTextBound = (others: readonly KeyDatum[]): number => {
  let bound = Math.floor(btreeMaxItemSize / utf8MaxBytes);

  while (bound > 0 && btreeEntryBytes([...others, textDatum(bound)]) > btreeMaxItemSize) {
    bound -= 1;
  }

  return bound;
};

/**
 * The widest key any slice puts a key text in: the tree's member superkey on `Node` and the
 * predecessor and last axes' foreign keys over it, `(parent uuid, at, elements, end, two hidden
 * count-fold afters as bigints, state code, the string value's running text)`, where `Node`'s
 * `Monoid.concat` fold over its characters rides (`#pantry/qti/node.ts`, grizzle's tree lowering
 * merges each fold's pair into the axis's one foreign key). It covers the narrower keys too:
 * `Idref`'s `(node, attribute, bigint index, text)` (`#pantry/qti/attributes.ts`), a counted
 * family's `(group uuid, text, hidden bigint)` such as `File`'s `(package, href, ‹i›)`
 * (`#pantry/qti/package.ts`), and a plain `(uuid, text)`. One bound for all of them keeps a value
 * one relation holds from being refused by another. A slice that puts key text in a wider key
 * widens this, and `limits.test.ts` fails until it does.
 */
export const widestTextKey: readonly KeyDatum[] = [
  keyDatums.uuid,
  keyDatums.bigint,
  keyDatums.bigint,
  keyDatums.bigint,
  keyDatums.bigint,
  keyDatums.bigint,
  keyDatums.code,
];

/**
 * The most code points a key text holds: {@link keyTextBound} of {@link widestTextKey}, 648.
 */
export const keyTextCodePoints = keyTextBound(widestTextKey);

/**
 * The most code points a name holds where a key holds it beside another text: an NCName written as
 * its start character and one counted repetition of the rest, which `DUPMAX` bounds, as
 * `OpenAttributeName`'s `local` is (`#pantry/qti/attributes.ts`). XML puts no bound on a name
 * (reading 94), so a longer one is refused as a stated limit of the representation.
 */
export const localNameCodePoints = repetitionMax;

/**
 * The most code points a namespace name holds: the least the keys it rides leave it. The widest is
 * `OpenAttributeName`'s `(node, uri, local)`, where a uuid and a local name of
 * {@link localNameCodePoints} share the entry; `OpenElementName(node, namespace)`, the containment
 * of an open attribute's element namespace into it, and the foreign class checks are narrower. One
 * bound for every one of them keeps a namespace name one relation holds from being refused by
 * another.
 */
export const namespaceCodePoints = keyTextBound([keyDatums.uuid, textDatum(localNameCodePoints)]);

/**
 * The pattern of {@link namespaceText}: {@link boundedTextPattern} of {@link namespaceCodePoints},
 * written as the literal `str.regex` reads; `limits.test.ts` holds the two equal.
 */
export const namespaceTextPattern = "^.{0,255}.{0,156}$";

/**
 * The type of a namespace name a key holds: any text of at most {@link namespaceCodePoints} code
 * points. A longer one is refused under the oracle's "Key text bound" law, as a longer
 * {@link keyText} is.
 */
export const namespaceText = str.regex(namespaceTextPattern, "su");

/**
 * Write an anchored pattern of any text of at most `codePoints` code points, as consecutive
 * repetitions of at most {@link repetitionMax} each.
 *
 * @param codePoints - The bound.
 * @returns The pattern, read under the flags `su` so `.` is every code point.
 */
export const boundedTextPattern = (codePoints: number): string => {
  const parts: string[] = [];
  for (let left = codePoints; left > 0; left -= repetitionMax) {
    parts.push(`.{0,${Math.min(left, repetitionMax)}}`);
  }

  return `^${parts.join("")}$`;
};

/**
 * The pattern of {@link keyText}: {@link boundedTextPattern} of {@link keyTextCodePoints}, written
 * as the literal it computes, since `str.regex` reads its source's language at the type level and
 * refuses a source typed `string`. `limits.test.ts` holds the two equal, so a change of shape that
 * moves the bound fails there until this literal follows it.
 */
export const keyTextPattern = "^.{0,255}.{0,255}.{0,138}$";

/**
 * The type of a copied text that takes part in a cross-row equality: any text of at most
 * {@link keyTextCodePoints} code points, newlines included. Patterns are no part of a text's type
 * in grizzle, so it meets an attribute's lexical form and a package path in a containment.
 *
 * A longer value is refused under one schema-wide oracle law, "Key text bound"
 * (`src/test/oracle.ts` `lawSources`), a stated limit of the representation and never a QTI law:
 * the field's pattern refuses it where it is written, or the copy's foreign key finds no row that
 * can hold it.
 */
export const keyText = str.regex(keyTextPattern, "su");

/**
 * The hrefs this representation resolves to package entries: a relative path of plain segments,
 * which names the entry at the referring document's directory followed by the href as written
 * (RFC 3986, §5.2.2 and §5.2.3, where such a reference merges with the base's directory and its
 * dot-segment removal changes nothing). A segment is a nonempty run of characters other than `/`,
 * `?`, `#`, `%`, `\` and XML whitespace, and neither `.` nor `..`; the first segment holds no `:`,
 * which would make the href a URI with a scheme.
 *
 * It is a stated limit of the representation, never a law of QTI: every href law compares an href
 * with an entry's path exactly, by `Compute.concat`, so no relation can percent-decode a name or
 * remove a dot segment from the middle of a path. So it refuses valid input: `a%20b.xml`,
 * `a/../b.xml`, and a path that holds whitespace (`a b.xml`, which XLink's escaping admits as an
 * `xs:anyURI`) are each a valid URI reference refused under the limit's law, "Href form" (rule
 * `href-form`). It is the form of a path: a query or a fragment after it is its params, an
 * external URI is never resolved, and a document's reference may start with `./` and `../`
 * segments, which `#pantry/qti/package.ts` `ReferencePath` removes before reading the rest in this
 * form (spec reading 102).
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.2 | RFC 3986, §5.2}
 */
export const resolvedHref =
  "^(?:[^./?#%\\\\:\\t\\n\\r ][^/?#%\\\\:\\t\\n\\r ]*|\\.[^./?#%\\\\:\\t\\n\\r ][^/?#%\\\\:\\t\\n\\r ]*|\\.\\.[^/?#%\\\\:\\t\\n\\r ]+)(?:/(?:[^./?#%\\\\\\t\\n\\r ][^/?#%\\\\\\t\\n\\r ]*|\\.[^./?#%\\\\\\t\\n\\r ][^/?#%\\\\\\t\\n\\r ]*|\\.\\.[^/?#%\\\\\\t\\n\\r ]+))*$";
