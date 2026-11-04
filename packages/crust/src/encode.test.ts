/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { encode } from "#crust/encode.ts";
import { readXml } from "#crust/read.ts";
import { withoutBuffer } from "#crust/test/without-buffer.ts";

/**
 * Whether `bytes` holds `run` as a contiguous run, at any offset.
 */
const contains = (bytes: Uint8Array, run: readonly number[]): boolean => {
  for (let start = 0; start + run.length <= bytes.length; start += 1) {
    if (run.every((value, offset) => bytes[start + offset] === value)) {
      return true;
    }
  }

  return false;
};

const declared = (label: string, body: readonly number[]): Uint8Array =>
  Uint8Array.from([
    ...new TextEncoder().encode(`<?xml version="1.0" encoding="${label}"?><a>`),
    ...body,
    ...new TextEncoder().encode("</a>"),
  ]);

/**
 * A tree read from UTF-8 bytes. The declaration stays UTF-8: the encoder writes it as the document
 * carries it, and a UTF-8 document cannot declare UTF-16.
 */
const utf8Tree = () =>
  readXml(new TextEncoder().encode('<?xml version="1.0" encoding="UTF-8"?><a>a\u{1F600}</a>'));

describe("encode runs without Node's Buffer", () => {
  it.effect("writes ISO-8859-1 as single bytes", () =>
    Effect.gen(function* encodesLatin1() {
      const doc = yield* readXml(declared("ISO-8859-1", [0x85, 0xe9]));
      const bytes = yield* withoutBuffer(
        Effect.gen(function* encodeLatin1() {
          assert.isFalse("Buffer" in globalThis);

          return yield* encode(doc, "ISO-8859-1");
        }),
      );

      assert.isTrue(contains(bytes, [0x3e, 0x85, 0xe9, 0x3c]));
    }),
  );

  it.effect("writes US-ASCII with references for every byte at or above 0x80", () =>
    Effect.gen(function* encodesAscii() {
      const doc = yield* readXml(declared("ISO-8859-1", [0x85, 0xe9]));
      const bytes = yield* withoutBuffer(
        Effect.gen(function* encodeAscii() {
          assert.isFalse("Buffer" in globalThis);

          return yield* encode(doc, "US-ASCII");
        }),
      );

      assert.isTrue(bytes.every((byte) => byte < 0x80));
    }),
  );

  it.effect("writes UTF-16LE with a mark and surrogate pairs little-endian", () =>
    Effect.gen(function* encodesUtf16le() {
      const doc = yield* utf8Tree();
      const bytes = yield* withoutBuffer(
        Effect.gen(function* encodeUtf16le() {
          assert.isFalse("Buffer" in globalThis);

          return yield* encode(doc, "UTF-16LE");
        }),
      );

      assert.deepStrictEqual([...bytes.subarray(0, 4)], [0xff, 0xfe, 0x3c, 0x00]);
      assert.isTrue(contains(bytes, [0x61, 0x00, 0x3d, 0xd8, 0x00, 0xde]));
    }),
  );

  it.effect("writes UTF-16BE with a mark and surrogate pairs big-endian", () =>
    Effect.gen(function* encodesUtf16be() {
      const doc = yield* utf8Tree();
      const bytes = yield* withoutBuffer(
        Effect.gen(function* encodeUtf16be() {
          assert.isFalse("Buffer" in globalThis);

          return yield* encode(doc, "UTF-16BE");
        }),
      );

      assert.deepStrictEqual([...bytes.subarray(0, 4)], [0xfe, 0xff, 0x00, 0x3c]);
      assert.isTrue(contains(bytes, [0x00, 0x61, 0xd8, 0x3d, 0xde, 0x00]));
    }),
  );
});
