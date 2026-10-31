/* oxlint-disable unicorn/text-encoding-identifier-case -- The XML 1.0 section 4.3.3 label spellings (`UTF-8`, `UTF-16`) and the closed encoder-class names (`utf8`) are this module's data, not identifiers passed to a Node encoding API. */
import { Effect, Option } from "effect";
import { classify } from "#qti/xml/charset.ts";
import type { EncoderClass } from "#qti/xml/charset.ts";
import { ReaderRefusal } from "#qti/xml/errors.ts";

/**
 * A document's characters and the encoding label it was read under.
 *
 * `label` is the spelling the document gave, with its letter case, and becomes the tree's
 * `charset`; `text` carries no byte order mark.
 */
export interface Decoded {
  readonly label: string;
  readonly text: string;
}

/**
 * The byte order a UTF-16 byte order mark selects, named as `TextDecoder` names the encoding.
 */
type Utf16Order = "utf-16be" | "utf-16le";

/**
 * What the first bytes of a document settle: the bytes left to decode, the label to decode them
 * under, and the byte order a UTF-16 byte order mark chose.
 */
interface Sniffed {
  readonly body: Uint8Array;
  readonly label: string;
  readonly order: Option.Option<Utf16Order>;
}

/**
 * The XML declaration up to and including its `encoding` pseudo-attribute, matched at the start of
 * the document (XML 1.0 sections 2.8 and 4.3.3) so that text which only resembles one, such as a
 * comment further in, never selects the encoding.
 */
const declarationPattern =
  /^<\?xml[ \t\r\n]+version[ \t\r\n]*=[ \t\r\n]*(?:"[^"]*"|'[^']*')[ \t\r\n]+encoding[ \t\r\n]*=[ \t\r\n]*(?<quoted>"[A-Za-z][A-Za-z0-9._-]*"|'[A-Za-z][A-Za-z0-9._-]*')/u;

/**
 * How many leading bytes are searched for the XML declaration.
 */
const declarationWindow = 1024;

/**
 * Read each byte of `bytes` as the character whose code point is the byte's value.
 */
const latin1Text = (bytes: Uint8Array): string =>
  Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("latin1");

/**
 * Test whether `bytes` begins with `prefix`.
 */
const startsWith = (bytes: Uint8Array, prefix: readonly number[]): boolean =>
  prefix.every((byte, index) => bytes[index] === byte);

/**
 * Read the `encoding` an XML declaration gives, if the document starts with one.
 *
 * @param bytes - The document, not starting with a byte order mark.
 * @returns The label exactly as written, from the first 1024 bytes read one byte per character
 *   (an ASCII-compatible reading, so a UTF-16 document, whose declaration interleaves NUL bytes,
 *   yields none); `None` when there is no declaration or it gives no encoding.
 */
const declaredEncoding = (bytes: Uint8Array): Option.Option<string> => {
  const head = latin1Text(bytes.subarray(0, declarationWindow));
  const quoted = declarationPattern.exec(head)?.groups?.["quoted"];

  return Option.map(Option.fromUndefinedOr(quoted), (value) => value.slice(1, -1));
};

/**
 * Settle what the first bytes of a document say about its encoding.
 *
 * A byte order mark decides the encoding and is dropped: `EF BB BF` is UTF-8, `FE FF` UTF-16BE and
 * `FF FE` UTF-16LE, and the document's declaration is not consulted. Without one the XML
 * declaration's `encoding` decides, and a document with neither is UTF-8.
 *
 * @param bytes - The document as read from storage.
 * @returns The bytes after any byte order mark, the label to decode them under (`UTF-16` for a
 *   UTF-16 byte order mark, whichever order it gives), and the byte order a UTF-16 mark chose.
 */
const sniff = (bytes: Uint8Array): Sniffed => {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    return { body: bytes.subarray(3), label: "UTF-8", order: Option.none() };
  }

  if (startsWith(bytes, [0xfe, 0xff])) {
    return { body: bytes.subarray(2), label: "UTF-16", order: Option.some("utf-16be") };
  }

  if (startsWith(bytes, [0xff, 0xfe])) {
    return { body: bytes.subarray(2), label: "UTF-16", order: Option.some("utf-16le") };
  }

  return {
    body: bytes,
    label: Option.getOrElse(declaredEncoding(bytes), () => "UTF-8"),
    order: Option.none(),
  };
};

/**
 * Builds the refusal for bytes the label's decoder could not accept.
 */
const refuse = (rule: ReaderRefusal["rule"], detail: string): ReaderRefusal =>
  new ReaderRefusal({ detail, rule });

/**
 * Decode `body` with the named `TextDecoder` encoding, failing on any malformed sequence.
 *
 * A `TextDecoder` resolves a name through the WHATWG Encoding Standard's label table, which maps
 * some labels onto a different encoding: `ISO-8859-9` constructs a decoder whose `encoding` is
 * `windows-1254`, which assigns different characters to bytes 0x80 to 0x9F and 0xD0, 0xDD and 0xDE.
 * A decoder whose `encoding` is not the name asked for would read some bytes as characters the
 * author did not write, so it is refused. The byte order mark is the caller's, so the decoder keeps
 * any it meets (`ignoreBOM`), and a second one reaches the parser as U+FEFF.
 *
 * @param name - The `TextDecoder` encoding name, lower-case.
 * @param label - The label as the document spelled it, for the refusal's detail.
 * @param body - The bytes to decode.
 * @returns The decoded text; a `decode` refusal when no decoder serves the name, the decoder serves
 *   another encoding, or the bytes are malformed.
 */
const decodeStrictly = (
  name: string,
  label: string,
  body: Uint8Array,
): Effect.Effect<string, ReaderRefusal> =>
  Effect.gen(function* openAndDecode() {
    const decoder = yield* Effect.try({
      catch: () =>
        refuse(
          "decode",
          `No decoder here recognizes the encoding "${label}". Re-save the document as UTF-8, or declare an encoding this reader can decode.`,
        ),
      try: () => new TextDecoder(name, { fatal: true, ignoreBOM: true }),
    });

    if (decoder.encoding !== name) {
      return yield* refuse(
        "decode",
        `The encoding "${label}" is decoded as "${decoder.encoding}" by the decoder that serves that label, so some bytes would read as characters the author did not write. Re-save the document as UTF-8.`,
      );
    }

    return yield* Effect.try({
      catch: () =>
        refuse(
          "decode",
          `The document is read as ${label}, but its bytes are not valid in that encoding. Fix the bytes that are not valid ${label}, or re-save the document as UTF-8.`,
        ),
      try: () => decoder.decode(body),
    });
  });

/**
 * Decodes the bytes after any byte order mark under a label of one encoder class.
 */
type ClassDecoder = (
  body: Uint8Array,
  label: string,
  order: Option.Option<Utf16Order>,
) => Effect.Effect<string, ReaderRefusal>;

/**
 * The decoder for each encoder class `xml/charset.ts` assigns.
 *
 * `latin1` reads each byte as the code point of the same value through `Buffer`, never through a
 * `TextDecoder`: the WHATWG table maps `ISO-8859-1` to `windows-1252`, which turns bytes 0x80 to
 * 0x9F into printable characters where ISO-8859-1 and XML 1.0 section 4.3.3 give the C1 controls
 * U+0080 to U+009F. `ascii` admits only bytes below 0x80 and then reads them the same way. `utf16`
 * needs the byte order a byte order mark chose, so a UTF-16 label without one is `bare-utf16`. A
 * `decode-only` label goes to `TextDecoder` under its own name.
 */
const classDecoders: Readonly<Record<EncoderClass, ClassDecoder>> = {
  ascii: (body, label) => {
    const offset = body.findIndex((byte) => byte >= 0x80);

    return offset === -1
      ? Effect.succeed(latin1Text(body))
      : Effect.fail(
          refuse(
            "decode",
            `The document is read as ${label}, which holds only bytes below 0x80, but the byte at offset ${offset} is 0x${(body[offset] ?? 0).toString(16).toUpperCase()}. Re-save the document as UTF-8, or declare the encoding it was written in.`,
          ),
        );
  },
  "decode-only": (body, label) => decodeStrictly(label.toLowerCase(), label, body),
  latin1: (body) => Effect.succeed(latin1Text(body)),
  utf16: (body, label, order) =>
    Option.match(order, {
      onNone: () =>
        Effect.fail(
          refuse(
            "bare-utf16",
            `The document declares ${label} but does not start with a byte order mark (FF FE or FE FF), so its byte order is unknown. Add the byte order mark, or re-save the document as UTF-8.`,
          ),
        ),
      onSome: (byteOrder) => decodeStrictly(byteOrder, label, body),
    }),
  utf8: (body, label) => decodeStrictly("utf-8", label, body),
};

/**
 * Refuse decoded text that holds U+0000 or an unpaired surrogate, neither of which XML 1.0
 * section 2.2 allows in a document.
 *
 * @param text - The decoded text.
 * @returns `text` itself; a `nul-or-surrogate` refusal naming the first offender and its offset.
 */
const requireXmlCharacters = (text: string): Effect.Effect<string, ReaderRefusal> => {
  const offenders = [text.indexOf("\0"), text.search(/\p{Cs}/u)].filter((offset) => offset !== -1);

  if (offenders.length === 0) {
    return Effect.succeed(text);
  }

  const offset = Math.min(...offenders);
  const unit = text.codePointAt(offset) ?? 0;
  const name = `U+${unit.toString(16).toUpperCase().padStart(4, "0")}`;

  return Effect.fail(
    refuse(
      "nul-or-surrogate",
      unit === 0
        ? `The decoded text holds ${name} at offset ${offset}, a character XML 1.0 forbids anywhere in a document. Remove it from the source.`
        : `The decoded text holds the unpaired surrogate ${name} at offset ${offset}, which is not a character XML 1.0 allows. Re-save the document with the character spelled out.`,
    ),
  );
};

/**
 * Turn a document's bytes into its text, refusing whatever cannot be decoded faithfully.
 *
 * The encoding is a byte order mark if the document starts with one, else the XML declaration's
 * `encoding`, else UTF-8; the declared label is classified by `xml/charset.ts` and decoded with
 * every error fatal, so no byte is ever replaced with U+FFFD. The decoded text must hold neither
 * U+0000 nor an unpaired surrogate.
 *
 * @param bytes - The document as read from storage.
 * @returns The text, without its byte order mark, and the label as the document spelled it, which
 *   becomes the tree's `charset`; a `ReaderRefusal` whose rule is `decode` for a label the reader
 *   cannot decode or bytes that are not valid in it, `bare-utf16` for UTF-16 without a byte order
 *   mark, and `nul-or-surrogate` for text with a character XML 1.0 forbids.
 */
export const decode = Effect.fn("xml.decode")(function* decode(
  bytes: Uint8Array,
): Effect.fn.Return<Decoded, ReaderRefusal> {
  const { body, label, order } = sniff(bytes);
  const text = yield* classDecoders[classify(label).class](body, label, order).pipe(
    Effect.flatMap(requireXmlCharacters),
  );

  return { label, text };
});
