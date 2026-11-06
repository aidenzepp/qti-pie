/**
 * The bounds grizzle's own representability rule puts on the text a key holds, stated here once, so
 * every overlay's key text shares one bound and no slice chooses its own.
 *
 * Every key, every containment's target, every containment's source and every family's hidden
 * columns lower to a B-tree index (`laws/model/plan.ts` of the vendored engine emits a
 * `ReverseIndex` beside each foreign key), and grizzle refuses an index whose entry can pass
 * PostgreSQL's `BTMaxItemSize` (`UnrepresentableKey`). A text field with no bounded pattern can sit
 * in no index at all. So a text value that takes part in a cross-row equality (an ID or IDREF, an
 * identifier, an href) is copied into a field of type {@link keyText}, whose pattern bounds it, and
 * a longer value finds no row to equal: the copy's own foreign key refuses it, a stated limit of
 * the representation, not a law of the specification. Free text no law compares across rows is
 * never copied, and stays on `Attribute` or `Node`.
 *
 * Each bound is the most grizzle represents, read from grizzle's own rule, `keyTextBytes(fields)`
 * (`public/text.ts` of the vendored engine), which measures a key's B-tree entry exactly as the
 * schema's compilation does: `limits.test.ts` holds each bound to fit beside its key's other fields
 * and one code point more to be refused, so no re-spelled PostgreSQL constant can drift from it.
 *
 * @see {@link https://github.com/postgres/postgres/blob/REL_19_STABLE/src/include/access/nbtree.h | PostgreSQL, nbtree.h BTMaxItemSize}
 */
import { closedId, natural, str, uuid } from "@bjornpagen/grizzle";
import { Position } from "#pantry/grammar/install.ts";

/**
 * The longest counted repetition a pattern may write, PostgreSQL's `DUPMAX`, which grizzle's
 * pattern grammar enforces; a longer bound is written as consecutive repetitions.
 */
const repetitionMax = 255;

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
 * The most code points a key text holds: the most whose UTF-8 form, at most four bytes a code point
 * (RFC 3629, §3), fits the bytes grizzle's `keyTextBytes` leaves beside {@link widestTextKey}, 2,587
 * at the vendored grizzle, so 646. `limits.test.ts` holds 646 to fit and 647 not to.
 */
export const keyTextCodePoints = 646;

/**
 * The most code points a name holds where a key holds it beside another text: an NCName written as
 * its start character and one counted repetition of the rest, which `DUPMAX` bounds, as
 * `OpenAttributeName`'s `local` is (`#pantry/qti/attributes.ts`). XML puts no bound on a name
 * (reading 94), so a longer one is refused as a stated limit of the representation.
 */
export const localNameCodePoints = repetitionMax;

/**
 * The most code points a namespace name holds: the most whose UTF-8 form fits the bytes grizzle's
 * `keyTextBytes` leaves beside the widest key it rides, `OpenAttributeName`'s `(node, uri, local)`,
 * where a uuid and a local name of {@link localNameCodePoints} share the entry: 1,638 bytes at the
 * vendored grizzle, so 409;
 * `OpenElementName(node, namespace)`, the containment of an open attribute's element namespace into
 * it, and the foreign class checks are narrower. One bound for every one of them keeps a namespace
 * name one relation holds from being refused by another. `limits.test.ts` holds 409 to fit and 410
 * not to.
 */
export const namespaceCodePoints = 409;

/**
 * Write an anchored pattern of any text of at most `codePoints` code points, as consecutive
 * repetitions of at most `DUPMAX` each.
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
 * The pattern of {@link namespaceText}: {@link boundedTextPattern} of {@link namespaceCodePoints},
 * written as the literal `str.regex` reads; `limits.test.ts` holds the two equal.
 */
export const namespaceTextPattern = "^.{0,255}.{0,154}$";

/**
 * The type of a namespace name a key holds: any text of at most {@link namespaceCodePoints} code
 * points. A longer one is refused under the oracle's "Key text bound" law, as a longer
 * {@link keyText} is.
 */
export const namespaceText = str.regex(namespaceTextPattern, "su");

/**
 * The pattern of {@link keyText}: {@link boundedTextPattern} of {@link keyTextCodePoints}, written
 * as the literal it computes, since `str.regex` reads its source's language at the type level and
 * refuses a source typed `string`. `limits.test.ts` holds the two equal, so a change of shape that
 * moves the bound fails there until this literal follows it.
 */
export const keyTextPattern = "^.{0,255}.{0,255}.{0,136}$";

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
