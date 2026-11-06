import { assert, describe, it } from "@effect/vitest";
import { fnv1a32, shuffleOrder, splitMix32 } from "#plate/engine/random.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * Five positions with the third fixed, the shape every permutation case shuffles.
 */
const thirdFixed: readonly boolean[] = [false, false, true, false, false];

/**
 * Two hundred distinct keys, shaped as a shuffled Choice's key is (seed, instance and response,
 * separated by U+001F).
 */
const keys: readonly string[] = Array.from(
  { length: 200 },
  (_, index) => `${index}\u001Finstance-${index}\u001FRESPONSE`,
);

describe("fnv1a32", () => {
  it("gives FNV-1a's 32-bit test vectors", () => {
    assert.strictEqual(fnv1a32(""), 0x81_1c_9d_c5);
    assert.strictEqual(fnv1a32("a"), 0xe4_0c_29_2c);
    assert.strictEqual(fnv1a32("foobar"), 0xbf_9c_f9_68);
  });

  it("hashes the key's UTF-8 bytes, not its UTF-16 code units", () => {
    // U+00E9 is the bytes C3 A9; U+1F600 is F0 9F 98 80 (a surrogate pair in UTF-16).
    assert.strictEqual(fnv1a32("é"), 0x1e_9d_e8_c1);
    assert.strictEqual(fnv1a32("\u{1F600}"), 0x33_a2_96_08);
  });

  it("hashes a lone surrogate as U+FFFD, as the UTF-8 encoder writes it", () => {
    assert.strictEqual(fnv1a32("\uD800"), fnv1a32("\uFFFD"));
  });
});

describe("splitMix32", () => {
  it("draws the pinned sequence from a seed", () => {
    const draw = splitMix32(0);

    assert.deepStrictEqual([draw(), draw(), draw()], [0x92_ca_2f_0e, 0x3c_d6_e3_f3, 0x1b_14_7d_cc]);
  });

  it("draws unsigned 32-bit integers", () => {
    const draw = splitMix32(fnv1a32("plate"));
    const draws = Array.from({ length: 1000 }, () => draw());

    assert.isTrue(draws.every((value) => Number.isInteger(value) && value >= 0 && value < 2 ** 32));
  });
});

describe("shuffleOrder", () => {
  it("presents one key's five positions, the third fixed, in the pinned order", () => {
    assert.deepStrictEqual(shuffleOrder("plate", thirdFixed), [0, 4, 2, 1, 3]);
  });

  it("over 200 keys keeps a fixed index in place and brings every other index first", () => {
    const orders = keys.map((key) => shuffleOrder(key, thirdFixed));

    assert.isTrue(
      orders.every(
        (order) => order.toSorted((left, right) => left - right).join(",") === "0,1,2,3,4",
      ),
    );
    assert.isTrue(orders.every((order) => order[2] === 2));
    assert.deepStrictEqual(new Set(orders.map((order) => order[0])), new Set([0, 1, 3, 4]));
  });

  it("gives the identity for an empty or one-element list", () => {
    assert.deepStrictEqual(shuffleOrder("plate", []), []);
    assert.deepStrictEqual(shuffleOrder("plate", [false]), [0]);
    assert.deepStrictEqual(shuffleOrder("plate", [true]), [0]);
  });
});

describe("the generator module", () => {
  it("passes the browser allowlist as a root", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/engine/random.ts"]), []);
  });
});
