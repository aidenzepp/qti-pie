import { Effect } from "effect";
import type { EncoderClass } from "#qti/xml/charset.ts";
import { classify } from "#qti/xml/charset.ts";
import { EncodeError } from "#qti/xml/errors.ts";
import type { XmlDocument } from "#qti/xml/tree.ts";
import { writeXml } from "#qti/xml/write.ts";

/**
 * The one writer of each encoder class, so a class added to `EncoderClass` is a type error here
 * until it has one.
 */
const encoders: Record<EncoderClass, (doc: XmlDocument) => Effect.Effect<Uint8Array, EncodeError>> =
  {
    ascii: (doc) =>
      Effect.map(writeXml(doc, { threshold: 0x7f }), (text) => Buffer.from(text, "latin1")),
    "decode-only": () =>
      Effect.fail(new EncodeError({ codePoint: 0, threshold: 0, where: "label" })),
    latin1: (doc) =>
      Effect.map(writeXml(doc, { threshold: 0xff }), (text) => Buffer.from(text, "latin1")),
    utf16: (doc) =>
      Effect.map(writeXml(doc), (text) =>
        Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]),
      ),
    utf8: (doc) => Effect.map(writeXml(doc), (text) => new TextEncoder().encode(text)),
  };

/**
 * Encode a document in the label it is given, and never decide a fallback.
 *
 * The label's encoder class sets the form. `utf8` writes the text through `TextEncoder`. `utf16`
 * writes a little-endian byte order mark and then the text little-endian, whatever byte order the
 * document was read in. `latin1` and `ascii` write each code point above the class's threshold as a
 * numeric character reference, where one is possible, and the text as single bytes. The declaration
 * is written as the document carries it, so a caller that exports under another label sets
 * `declaration.encoding` first.
 *
 * @param doc - The tree to encode.
 * @param label - The label to encode in, as `exportCharset` decided it at import.
 * @returns The bytes, or an `EncodeError`: `where: "label"` when the label has no encoder, which
 *   a wrong import decision must surface; otherwise the first construct, in document order, that
 *   holds a code point the label cannot carry and no reference can write.
 */
export const encode = (doc: XmlDocument, label: string): Effect.Effect<Uint8Array, EncodeError> =>
  encoders[classify(label).class](doc);
