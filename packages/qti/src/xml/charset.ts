/* oxlint-disable unicorn/text-encoding-identifier-case -- The XML 1.0 section 4.3.3 label spellings (`UTF-8`, `US-ASCII`) and the closed encoder-class names (`utf8`) are this module's data, not identifiers passed to a Node encoding API. */
import { Option } from "effect";
import type { Child, XmlDocument } from "#qti/xml/tree.ts";

/**
 * How a label's characters become bytes: `decode-only` marks a label the reader can decode but the
 * writer cannot encode.
 */
export type EncoderClass = "utf8" | "utf16" | "latin1" | "ascii" | "decode-only";

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
  { aliases: [], canonical: "UTF-16LE", class: "utf16" },
  { aliases: [], canonical: "UTF-16BE", class: "utf16" },
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
 * Test whether `text` holds a code point above `limit`.
 *
 * @param limit - The highest code point the label's encoder writes as a single byte.
 * @param text - The text to inspect, a lone surrogate counting as one code point.
 * @returns `true` when some code point of `text` exceeds `limit`.
 */
const holdsAbove = (limit: number, text: string): boolean => {
  for (const character of text) {
    if ((character.codePointAt(0) ?? 0) > limit) {
      return true;
    }
  }

  return false;
};

/**
 * Test whether a node holds, in a place a character reference cannot reach, a code point above
 * `limit`: comment text, a processing instruction's target or data, or an element's name or an
 * attribute's name, anywhere in the element's subtree.
 *
 * @param limit - The highest code point the label's encoder writes as a single byte.
 * @param node - The node to inspect; text runs and entity references are skipped, and an
 *   attribute's value is not read.
 * @returns `true` when anything inspected in the node's subtree exceeds `limit`.
 */
const nodeHoldsAbove = (limit: number, node: Child): boolean => {
  if (node.kind === "element") {
    return (
      holdsAbove(limit, node.qname) ||
      node.attributes.some((attribute) => holdsAbove(limit, attribute.qname)) ||
      node.children.some((child) => nodeHoldsAbove(limit, child))
    );
  }

  if (node.kind === "comment") {
    return holdsAbove(limit, node.text);
  }

  if (node.kind === "pi") {
    return holdsAbove(limit, node.target) || holdsAbove(limit, node.data);
  }

  return false;
};

/**
 * Decide the label an exported document is encoded in, from the label it was read under.
 *
 * The decision is made once, at import, so the encoder never falls back silently: a character it
 * cannot reference in the label it is given is an `EncodeError`. A character above the threshold of
 * `latin1` or `ascii` can be written as a numeric character reference in a text run or an attribute
 * value, but nowhere else, so only comment text, processing-instruction targets and data, and
 * element and attribute names are inspected.
 *
 * @param label - The label the document was read under, as read.
 * @param doc - The document whose prolog, root subtree and epilog are inspected.
 * @returns `label` when its class is `utf8` or `utf16`, or is `latin1` or `ascii` and nothing
 *   inspected exceeds the class's threshold; `"UTF-8"` for a `decode-only` label and for a `latin1`
 *   or `ascii` document holding such a character.
 */
export const exportCharset = (label: string, doc: XmlDocument): string => {
  const { class: encoderClass } = classify(label);
  const limit = threshold(encoderClass);

  if (encoderClass === "decode-only") {
    return "UTF-8";
  }

  if (Option.isNone(limit)) {
    return label;
  }

  const holdsAboveLimit = [...doc.prolog, doc.root, ...doc.epilog].some((node) =>
    nodeHoldsAbove(limit.value, node),
  );

  return holdsAboveLimit ? "UTF-8" : label;
};
