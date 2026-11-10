/* oxlint-disable unicorn/text-encoding-identifier-case -- The XML 1.0 section 4.3.3 label spellings (`UTF-8`, `US-ASCII`) and the closed encoder-class names (`utf8`) are this module's data, not identifiers passed to a Node encoding API. */
import { Array as Arr, Option } from "effect";
import { EncodeError } from "#crust/errors.ts";
import { preorder } from "#crust/tour.ts";
import type { Child, XmlDocument } from "#crust/tree.ts";

/**
 * How a label's characters become bytes: `decode-only` marks a label the reader can decode but the
 * writer cannot encode.
 *
 * Each of UTF-16's three Unicode encoding schemes is its own class, because each begins its bytes
 * differently (Unicode 16.0 section 3.10, D96 to D98): `utf16` is the UTF-16 scheme, which an XML
 * document begins with a byte order mark (XML 1.0 section 4.3.3), and `utf16be` and `utf16le` are
 * UTF-16BE and UTF-16LE, which never begin with one, an initial `FE FF` or `FF FE` being the
 * character U+FEFF (RFC 2781 sections 3.3, 4.1 and 4.2).
 */
export type EncoderClass =
  | "utf8"
  | "utf16"
  | "utf16be"
  | "utf16le"
  | "latin1"
  | "ascii"
  | "decode-only";

/**
 * A label's canonical name and encoder class.
 */
export interface LabelClass {
  /**
   * The IANA preferred name for a label in the table, and the label itself, as spelled, for any
   * other label.
   */
  readonly canonical: string;
  readonly class: EncoderClass;
}

/**
 * The labels XML 1.0 section 4.3.3 lets a document declare that this package can both decode and
 * encode, grouped by the IANA name they share.
 *
 * Every other label is `decode-only`: the reader admits it when a `TextDecoder` knows it, and the
 * writer never encodes it.
 */
const groups: readonly {
  readonly aliases: readonly string[];
  readonly canonical: string;
  readonly class: EncoderClass;
}[] = [
  { aliases: [], canonical: "UTF-8", class: "utf8" },
  { aliases: [], canonical: "UTF-16", class: "utf16" },
  { aliases: [], canonical: "UTF-16LE", class: "utf16le" },
  { aliases: [], canonical: "UTF-16BE", class: "utf16be" },
  {
    aliases: [
      "ISO8859-1",
      "ISO_8859-1",
      "latin1",
      "l1",
      "IBM819",
      "CP819",
      "csISOLatin1",
      "iso-ir-100",
    ],
    canonical: "ISO-8859-1",
    class: "latin1",
  },
  {
    aliases: [
      "ASCII",
      "ANSI_X3.4-1968",
      "ANSI_X3.4-1986",
      "ISO646-US",
      "us",
      "IBM367",
      "cp367",
      "csASCII",
    ],
    canonical: "US-ASCII",
    class: "ascii",
  },
];

/**
 * The label table keyed by lower-cased label, because XML 1.0 section 4.3.3 compares encoding names
 * case-insensitively.
 */
const table: ReadonlyMap<string, LabelClass> = new Map(
  groups.flatMap(({ aliases, canonical, class: encoderClass }) =>
    [canonical, ...aliases].map((label) => [
      label.toLowerCase(),
      { canonical, class: encoderClass },
    ]),
  ),
);

/**
 * Classify an XML encoding label by the encoder that can write it.
 *
 * @param label - The label as read from the document, in any letter case.
 * @returns The label's canonical name and encoder class; `decode-only` for a label outside the
 *   table, which `xml/decode.ts` admits only when a `TextDecoder` knows it under that exact name.
 */
export const classify = (label: string): LabelClass =>
  table.get(label.toLowerCase()) ?? { canonical: label, class: "decode-only" };

/**
 * The highest code point each encoder class writes as a single byte, absent for a class with no
 * such limit.
 */
const thresholds: Readonly<Record<EncoderClass, Option.Option<number>>> = {
  ascii: Option.some(0x7f),
  "decode-only": Option.none(),
  latin1: Option.some(0xff),
  utf16: Option.none(),
  utf16be: Option.none(),
  utf16le: Option.none(),
  utf8: Option.none(),
};

/**
 * Give the highest code point an encoder class writes as a single byte.
 *
 * @param cls - The encoder class.
 * @returns U+00FF for `latin1` and U+007F for `ascii`; `None` for a class with no such limit.
 */
export const threshold = (cls: EncoderClass): Option.Option<number> => thresholds[cls];

/**
 * Read the code point of one character of a string's iteration, a lone surrogate counting as one.
 *
 * A string's iterator never yields the empty string, the one input `codePointAt(0)` gives no number
 * for, so an empty `character` is its caller's defect and is thrown as one.
 *
 * @param character - One character, as a string's iterator or a one-character match yields it.
 * @returns Its code point.
 */
export const codePointOf = (character: string): number => {
  const point = character.codePointAt(0);
  if (point === undefined) {
    throw new RangeError("codePointOf reads one character, and was given the empty string.");
  }

  return point;
};

/**
 * Find the first code point of `value` above `limit`, as the failure of the construct `where`
 * that holds it.
 *
 * @param value - The construct's text, a lone surrogate counting as one code point.
 * @param where - The construct, for the failure.
 * @param limit - The highest code point the encoder carries as itself.
 * @returns The failure; `None` when no code point of `value` exceeds `limit`.
 */
const unwritableText = (
  value: string,
  where: EncodeError["where"],
  limit: number,
): Option.Option<EncodeError> =>
  Arr.findFirst(value, (character) => {
    const codePoint = codePointOf(character);

    return codePoint > limit
      ? Option.some(new EncodeError({ codePoint, threshold: limit, where }))
      : Option.none();
  });

/**
 * Find the first construct of `node` itself, its children aside, that holds a code point above
 * `limit` where no character reference can write one: a comment's text, a processing
 * instruction's target then data, an entity reference's name, or an element's name, then each
 * attribute's name and the names of its recorded references, in stored order. A text run and the
 * text of an attribute value carry any code point as a reference, so neither is read.
 *
 * @param node - The node to search.
 * @param limit - The highest code point the encoder carries as itself.
 * @returns The failure for the first such construct; `None` when there is none.
 */
const unwritableOwn = (node: Child, limit: number): Option.Option<EncodeError> => {
  if (node.kind === "text") {
    return Option.none();
  }

  if (node.kind === "comment") {
    return unwritableText(node.text, "comment", limit);
  }

  if (node.kind === "pi") {
    return Option.orElse(unwritableText(node.target, "pi", limit), () =>
      unwritableText(node.data, "pi", limit),
    );
  }

  if (node.kind === "entityRef") {
    return unwritableText(node.name, "name", limit);
  }

  return Option.orElse(unwritableText(node.qname, "name", limit), () =>
    Arr.findFirst(node.attributes, (attribute) =>
      Option.orElse(unwritableText(attribute.qname, "name", limit), () =>
        Arr.findFirst(attribute.references, (reference) =>
          unwritableText(reference.name, "name", limit),
        ),
      ),
    ),
  );
};

/**
 * Find the first construct of a document, in writing order, that holds a code point above
 * `limit` where no character reference can write one: the doctype text, which is source text
 * kept verbatim, then each node of the prolog, the root and the epilog by its {@link preorder}, so
 * a tree of any depth is searched without recursion, and the search stops at the first failure.
 *
 * This is the one rule of what an encoder's label cannot carry: the writer refuses a document by
 * it, and {@link exportCharset} picks a label it finds nothing for.
 *
 * @param doc - The document to search.
 * @param limit - The highest code point the encoder carries as itself.
 * @returns The `EncodeError` naming the first such construct; `None` when the document is writable.
 */
export const unwritableIn = (doc: XmlDocument, limit: number): Option.Option<EncodeError> =>
  Option.orElse(
    doc.doctype.pipe(Option.flatMap((doctype) => unwritableText(doctype, "doctype", limit))),
    () =>
      Arr.findFirst([...doc.prolog, doc.root, ...doc.epilog], (node) =>
        Arr.findFirst(preorder(node), (visited) => unwritableOwn(visited, limit)),
      ),
  );

/**
 * Decide the label an exported document is encoded in, from the label it was read under.
 *
 * The decision is made once, at import, so the encoder never falls back silently: the label is kept
 * only when its encoder writes the whole document, which {@link unwritableIn} decides for a
 * single-byte label, so `encode` under the label this returns never fails.
 *
 * @param label - The label the document was read under, as read.
 * @param doc - The document.
 * @returns `label` when its class is `utf8` or one of UTF-16's, or is `latin1` or `ascii` and
 *   {@link unwritableIn} finds nothing; `"UTF-8"` for a `decode-only` label and for a `latin1` or
 *   `ascii` document it finds a construct in.
 */
export const exportCharset = (label: string, doc: XmlDocument): string => {
  const { class: encoderClass } = classify(label);
  if (encoderClass === "decode-only") {
    return "UTF-8";
  }

  return Option.match(threshold(encoderClass), {
    onNone: () => label,
    onSome: (limit) => (Option.isSome(unwritableIn(doc, limit)) ? "UTF-8" : label),
  });
};
