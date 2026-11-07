import { createHmac } from "node:crypto";
import { assert, describe, it } from "@effect/vitest";
import { hmac, hmacKey, hmacSha256, sha256 } from "#plate/engine/sha256.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * The encoder of a test message's UTF-8 bytes.
 */
const utf8 = new TextEncoder();

/**
 * Write bytes as lowercase hexadecimal, two digits a byte.
 *
 * @param bytes The bytes.
 * @returns The hexadecimal.
 */
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");

/**
 * Bytes that each hold one value.
 *
 * @param length How many bytes.
 * @param value The value of each.
 * @returns The bytes.
 */
const filled = (length: number, value: number): Uint8Array => new Uint8Array(length).fill(value);

/**
 * Bytes that count up from 1: 0x01, 0x02, ….
 *
 * @param length How many bytes.
 * @returns The bytes.
 */
const counting = (length: number): Uint8Array =>
  Uint8Array.from({ length }, (_, index) => (index + 1) % 256);

/**
 * RFC 4231's HMAC-SHA-256 test cases 1 to 4, 6 and 7: the case, its key, its data and its tag.
 *
 * @see https://www.rfc-editor.org/rfc/rfc4231#section-4
 */
const rfc4231: readonly (readonly [number, Uint8Array, Uint8Array, string])[] = [
  [
    1,
    filled(20, 0x0b),
    utf8.encode("Hi There"),
    "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
  ],
  [
    2,
    utf8.encode("Jefe"),
    utf8.encode("what do ya want for nothing?"),
    "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
  ],
  [
    3,
    filled(20, 0xaa),
    filled(50, 0xdd),
    "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe",
  ],
  [
    4,
    counting(25),
    filled(50, 0xcd),
    "82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b",
  ],
  [
    6,
    filled(131, 0xaa),
    utf8.encode("Test Using Larger Than Block-Size Key - Hash Key First"),
    "60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54",
  ],
  [
    7,
    filled(131, 0xaa),
    utf8.encode(
      "This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.",
    ),
    "9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2",
  ],
];

/**
 * Key lengths around SHA-256's 64-byte block: none, one byte, one short of a block, a block, one
 * over (hashed first), and RFC 4231's 131.
 */
const keyLengths: readonly number[] = [0, 1, 63, 64, 65, 131];

/**
 * Message lengths around the padding's edges: 55 bytes is the longest that pads into one block and
 * 56 the shortest that takes two; 63, 64 and 65 cross a block; 119 and 120 are the same edge one
 * block on.
 */
const messageLengths: readonly number[] = [0, 55, 56, 63, 64, 65, 119, 120];

describe("sha256", () => {
  it('[I-9a] gives FIPS 180-4\'s digest of "abc"', () => {
    assert.strictEqual(
      hex(sha256(utf8.encode("abc"))),
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("[I-9a] gives the digest of the empty message", () => {
    assert.strictEqual(
      hex(sha256(new Uint8Array())),
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("[I-9a] gives FIPS 180-4's digest of its two-block 448-bit message", () => {
    assert.strictEqual(
      hex(sha256(utf8.encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))),
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });
});

describe("hmacSha256", () => {
  for (const [testCase, key, data, tag] of rfc4231) {
    it(`[I-9a] gives RFC 4231's tag of test case ${String(testCase)}`, () => {
      assert.strictEqual(hex(hmacSha256(key, data)), tag);
    });
  }

  it("[I-9a] gives the first 128 bits of RFC 4231's tag of test case 5", () => {
    assert.strictEqual(
      hex(hmacSha256(filled(20, 0x0c), utf8.encode("Test With Truncation"))).slice(0, 32),
      "a3b6167473100ee06e0c796c2955552b",
    );
  });

  it("[I-9a] agrees with node:crypto around the block's edges, through one key's states or afresh", () => {
    for (const keyLength of keyLengths) {
      const key = counting(keyLength);
      const states = hmacKey(key);

      for (const messageLength of messageLengths) {
        const message = filled(messageLength, (keyLength + messageLength) % 256);
        const expected = createHmac("sha256", key).update(message).digest("hex");

        assert.strictEqual(
          hex(hmacSha256(key, message)),
          expected,
          `${keyLength}, ${messageLength}`,
        );
        assert.strictEqual(hex(hmac(states, message)), expected, `${keyLength}, ${messageLength}`);
      }
    }
  });
});

describe("the hash module", () => {
  it("[I-9a] passes the browser allowlist as a root", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/engine/sha256.ts"]), []);
  });
});
