/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `US-ASCII`) the declarations under test carry. */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { decode } from "#crust/decode.ts";
import type { ReaderRefusal } from "#crust/errors.ts";

/**
 * The bytes of ASCII `text`.
 */
const ascii = (text: string): readonly number[] => [...new TextEncoder().encode(text)];

/**
 * Builds the bytes of a document from runs of byte values, in the order given.
 */
const bytesOf = (...parts: readonly (readonly number[])[]): Uint8Array =>
  Uint8Array.from(parts.flat());

/**
 * Builds a UTF-16 document of the Basic Multilingual Plane `text` with its byte order mark, in the
 * byte order named.
 */
const utf16 = (text: string, order: "be" | "le"): Uint8Array => {
  const littleEndian = order === "le";
  const view = new DataView(new ArrayBuffer(text.length * 2));

  for (let index = 0; index < text.length; index += 1) {
    view.setUint16(index * 2, text.codePointAt(index) ?? 0, littleEndian);
  }

  return bytesOf(littleEndian ? [0xff, 0xfe] : [0xfe, 0xff], [...new Uint8Array(view.buffer)]);
};

/**
 * Builds a UTF-16 document of the Basic Multilingual Plane `text` without a byte order mark, in the
 * byte order named.
 */
const utf16Bare = (text: string, order: "be" | "le"): Uint8Array => utf16(text, order).subarray(2);

/**
 * Decodes `input` and returns the refusal it raised, failing the test when `input` decodes.
 */
const refusalOf = (input: Uint8Array): Effect.Effect<ReaderRefusal> =>
  decode(input).pipe(
    Effect.match({
      onFailure: (refusal) => refusal,
      onSuccess: (decoded) => assert.fail(`expected a refusal, decoded ${JSON.stringify(decoded)}`),
    }),
  );

/**
 * A document that declares `encoding` and whose root holds the byte runs of `body`.
 */
const declared = (encoding: string, ...body: readonly (readonly number[])[]): Uint8Array =>
  bytesOf(ascii(`<?xml version="1.0" encoding="${encoding}"?><a>`), ...body, ascii("</a>"));

describe("decode refuses what it cannot decode faithfully", () => {
  it.effect("a label WHATWG remaps, naming the label", () =>
    Effect.gen(function* refusesRemappedLabel() {
      const refusal = yield* refusalOf(declared("ISO-8859-9", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "ISO-8859-9");
    }),
  );

  it.effect("a label no decoder knows, naming the label", () =>
    Effect.gen(function* refusesUnknownLabel() {
      const refusal = yield* refusalOf(declared("no-such-charset", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "no-such-charset");
    }),
  );

  it.effect("a US-ASCII document holding a byte at or above 0x80", () =>
    Effect.gen(function* refusesHighAscii() {
      const refusal = yield* refusalOf(declared("US-ASCII", [0xe9]));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "US-ASCII");
    }),
  );

  it.effect("a declared UTF-16 with no byte order mark", () =>
    Effect.gen(function* refusesBareUtf16() {
      const refusal = yield* refusalOf(declared("UTF-16", ascii("x")));

      assert.strictEqual(refusal.rule, "bare-utf16");
    }),
  );

  it.effect("a declared UTF-16 that Appendix F found an order for, but without a mark", () =>
    Effect.gen(function* refusesUnmarkedUtf16() {
      const refusal = yield* refusalOf(
        utf16Bare('<?xml version="1.0" encoding="UTF-16"?><a>x</a>', "le"),
      );

      assert.strictEqual(refusal.rule, "bare-utf16");
    }),
  );

  it.effect("a declared UTF-16LE whose bytes are not UTF-16", () =>
    Effect.gen(function* refusesNonUtf16() {
      const refusal = yield* refusalOf(declared("UTF-16LE", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "UTF-16LE");
    }),
  );

  it.effect("malformed UTF-8", () =>
    Effect.gen(function* refusesMalformedUtf8() {
      const refusal = yield* refusalOf(declared("UTF-8", [0xff]));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("malformed UTF-8 in a document that declares no encoding", () =>
    Effect.gen(function* refusesMalformedDefaultUtf8() {
      const refusal = yield* refusalOf(bytesOf(ascii("<a>"), [0xc3], ascii("</a>")));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("a UTF-16 document cut in the middle of a code unit", () =>
    Effect.gen(function* refusesTruncatedUtf16() {
      const refusal = yield* refusalOf(utf16("<a/>", "le").subarray(0, -1));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("a NUL in the decoded text", () =>
    Effect.gen(function* refusesNul() {
      const refusal = yield* refusalOf(declared("UTF-8", [0x00]));

      assert.strictEqual(refusal.rule, "nul-or-surrogate");
      assert.include(refusal.detail, "U+0000");
    }),
  );

  it.effect("a NUL that a single-byte label decodes", () =>
    Effect.gen(function* refusesLatin1Nul() {
      const refusal = yield* refusalOf(declared("ISO-8859-1", [0x00]));

      assert.strictEqual(refusal.rule, "nul-or-surrogate");
    }),
  );
});

describe("decode reads the label and the bytes", () => {
  it.effect("admits windows-1252 under its own decoder, and keeps the label as read", () =>
    Effect.gen(function* admitsWindows1252() {
      const decoded = yield* decode(declared("windows-1252", [0x80]));

      assert.strictEqual(decoded.label, "windows-1252");
      assert.include(decoded.text, "<a>€</a>");
    }),
  );

  it.effect("decodes ISO-8859-1 byte for byte, 0x85 included", () =>
    Effect.gen(function* decodesLatin1() {
      const decoded = yield* decode(declared("ISO-8859-1", [0x85, 0xe9]));

      assert.strictEqual(decoded.label, "ISO-8859-1");
      assert.include(decoded.text, "<a>\u0085é</a>");
    }),
  );

  it.effect("keeps a label alias as spelled, quotes and letter case included", () =>
    Effect.gen(function* keepsAliasSpelling() {
      const decoded = yield* decode(
        bytesOf(ascii("<?xml version='1.0' encoding='Latin1'?><a>"), [0xe9], ascii("</a>")),
      );

      assert.strictEqual(decoded.label, "Latin1");
      assert.include(decoded.text, "<a>é</a>");
    }),
  );

  it.effect("decodes US-ASCII when every byte is below 0x80", () =>
    Effect.gen(function* decodesAscii() {
      const decoded = yield* decode(declared("US-ASCII", ascii("plain")));

      assert.strictEqual(decoded.label, "US-ASCII");
      assert.include(decoded.text, "<a>plain</a>");
    }),
  );

  it.effect("strips a UTF-8 byte order mark and labels the document UTF-8", () =>
    Effect.gen(function* stripsUtf8Bom() {
      const decoded = yield* decode(bytesOf([0xef, 0xbb, 0xbf], ascii("<a/>")));

      assert.strictEqual(decoded.label, "UTF-8");
      assert.strictEqual(decoded.text, "<a/>");
    }),
  );

  it.effect("strips only the first of two UTF-8 byte order marks", () =>
    Effect.gen(function* stripsOneBom() {
      const decoded = yield* decode(bytesOf([0xef, 0xbb, 0xbf, 0xef, 0xbb, 0xbf], ascii("<a/>")));

      assert.strictEqual(decoded.text, `${String.fromCodePoint(0xfe_ff)}<a/>`);
    }),
  );

  it.effect("decodes UTF-8 without a declaration and labels it UTF-8", () =>
    Effect.gen(function* defaultsToUtf8() {
      const decoded = yield* decode(bytesOf(ascii("<a>"), [0xc3, 0xa9], ascii("</a>")));

      assert.strictEqual(decoded.label, "UTF-8");
      assert.strictEqual(decoded.text, "<a>é</a>");
    }),
  );

  it.effect("decodes UTF-16 by its byte order mark, in either order, and labels it UTF-16", () =>
    Effect.gen(function* decodesUtf16() {
      for (const order of ["be", "le"] as const) {
        const decoded = yield* decode(utf16("<a>é€</a>", order));

        assert.strictEqual(decoded.label, "UTF-16");
        assert.strictEqual(decoded.text, "<a>é€</a>");
      }
    }),
  );

  it.effect("decodes UTF-16LE and UTF-16BE without a mark, keeping the label as spelled", () =>
    Effect.gen(function* decodesBareUtf16() {
      for (const [label, order] of [
        ["UTF-16LE", "le"],
        ["UTF-16BE", "be"],
      ] as const) {
        const text = `<?xml version="1.0" encoding="${label}"?><a>é€</a>`;
        const decoded = yield* decode(utf16Bare(text, order));

        assert.strictEqual(decoded.label, label);
        assert.strictEqual(decoded.text, text);
      }
    }),
  );

  it.effect("decodes by the byte order Appendix F detects when the label names the other", () =>
    Effect.gen(function* decodesByDetectedOrder() {
      const text = '<?xml version="1.0" encoding="UTF-16LE"?><a>x</a>';
      const decoded = yield* decode(utf16Bare(text, "be"));

      assert.strictEqual(decoded.label, "UTF-16LE");
      assert.strictEqual(decoded.text, text);
    }),
  );

  it.effect("reads the encoding from the declaration at the start, not from later text", () =>
    Effect.gen(function* readsOnlyTheDeclaration() {
      const decoded = yield* decode(
        bytesOf(ascii('<?xml version="1.0"?><!-- encoding="ISO-8859-9" --><a/>')),
      );

      assert.strictEqual(decoded.label, "UTF-8");
    }),
  );
});
