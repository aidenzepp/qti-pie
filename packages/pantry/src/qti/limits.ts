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
import { closedId, keyTextBytes as bytesBeside, natural, str, uuid } from "@bjornpagen/grizzle";
import { Position } from "#pantry/grammar/install.ts";

/**
 * Any text, line ends included: the language every byte-bounded text of this module cuts.
 */
const anyText = str.regex("^.*$", "su");

/**
 * The widest key any slice puts a key text in, its other fields as grizzle types them: the tree's
 * member superkey on `Node` and the predecessor and last axes' foreign keys over it, `(parent, at,
 * elements, end, the two hidden count-fold afters, state)` beside the string value's running text,
 * where `Node`'s `Monoid.concat` fold over its characters rides (`#pantry/qti/node.ts`, grizzle's
 * tree lowering merges each fold's pair into the axis's one foreign key). It covers the narrower
 * keys too: `Idref`'s `(node, attribute, index)` (`#pantry/qti/attributes.ts`), a counted family's
 * `(group, text, hidden index)` such as `File`'s (`#pantry/qti/package.ts`), and a plain `(uuid,
 * text)`. One bound for all of them keeps a value one relation holds from being refused by
 * another. A slice that puts key text in a wider key widens this, and `limits.test.ts` fails until
 * it does.
 */
export const widestTextKey = [
  uuid,
  natural,
  natural,
  natural,
  natural,
  natural,
  closedId(Position),
] as const;

/**
 * The most UTF-8 bytes a key text holds: what grizzle's `keyTextBytes` leaves beside
 * {@link widestTextKey}, 2,587 at the vendored grizzle (about 2,587 ASCII, 1,293 two-byte, 862 CJK
 * or 646 astral characters).
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
 * The most UTF-8 bytes a name holds where a key holds it beside another text and a uuid, as
 * `OpenAttributeName(node, uri, local)` holds an open attribute's local name beside its namespace
 * name: the two share the entry evenly, each half of what `keyTextBytes` leaves beside a uuid and
 * an empty text, 1,329 at the vendored grizzle. XML puts no bound on a name (reading 94), so a
 * longer one is refused as a stated limit of the representation.
 */
export const localNameBytes = Math.floor(bytesBeside([uuid, str.bytes(0, anyText)]) / 2);

/**
 * The most UTF-8 bytes a namespace name holds: what `keyTextBytes` leaves beside the widest key it
 * rides, `OpenAttributeName`'s `(node, uri, local)`, a uuid and a local name of
 * {@link localNameBytes}, 1,329 at the vendored grizzle; `OpenElementName(node, namespace)`, the
 * containment of an open attribute's element namespace into it, and the foreign class checks are
 * narrower. One bound for every one of them keeps a namespace name one relation holds from being
 * refused by another. `limits.test.ts` holds it to `keyTextBytes` over the local name's own type.
 */
export const namespaceBytes = bytesBeside([uuid, str.bytes(localNameBytes, anyText)]);

/**
 * The type of a namespace name a key holds: any text of at most {@link namespaceBytes} UTF-8
 * bytes. A longer one is refused under the oracle's "Key text bound" law, as a longer
 * {@link keyText} is.
 */
export const namespaceText = str.bytes(namespaceBytes, anyText);

/**
 * The most UTF-8 bytes a namespace prefix holds: what `keyTextBytes` leaves beside a uuid, the
 * other field of the key `Namespace(node, prefix)`, 2,665 at the vendored grizzle.
 */
export const prefixBytes = bytesBeside([uuid]);

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
