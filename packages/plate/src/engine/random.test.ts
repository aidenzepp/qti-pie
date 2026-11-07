import { assert, describe, it } from "@effect/vitest";
import {
  drawBelow,
  drawFloat,
  drawStream,
  fnv1a32,
  responseKey,
  shuffleOrder,
  splitMix32,
  templateKey,
} from "#plate/engine/random.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * Five positions with the third fixed, the shape every permutation case shuffles.
 */
const thirdFixed: readonly boolean[] = [false, false, true, false, false];

/**
 * 2^32, the value of one 32-bit word above the next in a big-endian number.
 */
const wordCount = 4_294_967_296n;

/**
 * Read draws as one big-endian number, the first the most significant 32-bit word, masked to its
 * low bits: the candidate `drawBelow` reads, computed here apart from it.
 *
 * @param draws The draws, in the order they were taken.
 * @param bits The number of low bits kept.
 * @returns The candidate.
 */
const candidateOf = (draws: readonly number[], bits: number): bigint => {
  let whole = 0n;
  for (const word of draws) {
    whole = whole * wordCount + BigInt(word);
  }

  return BigInt.asUintN(bits, whole);
};

/**
 * Take a stream's next draws.
 *
 * @param draw The stream.
 * @param count How many draws to take.
 * @returns The draws, in the order they were taken.
 */
const take = (draw: () => number, count: number): readonly number[] =>
  Array.from({ length: count }, () => draw());

/**
 * The count of 2^69 + 1 values, whose `k` is 70: a candidate is three draws masked to 70 bits, and
 * close to half of all candidates are not below it.
 */
const redrawCount = 2n ** 69n + 1n;

/**
 * A key whose first candidate under {@link redrawCount} is not below it and whose second is: the
 * first key `redraw-<n>`, counting from 0, with that property, found by {@link candidateOf} once
 * and named here.
 */
const redrawKey = "redraw-16";

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

describe("drawStream", () => {
  it("[I-9a] draws what SplitMix32 seeded with the key's FNV-1a hash draws", () => {
    const expected = take(splitMix32(fnv1a32("k")), 3);

    assert.deepStrictEqual(take(drawStream("k"), 3), expected);
    assert.deepStrictEqual(expected, [0xc0_f9_34_19, 0x75_62_cb_e1, 0xc6_cd_ae_84]);
  });

  it("[I-9a] draws the same values from the same key every time", () => {
    const first = drawStream("same");
    const second = drawStream("same");

    assert.deepStrictEqual(
      [drawFloat(first), drawBelow(first, 2n ** 70n), drawBelow(first, 6n), first()],
      [drawFloat(second), drawBelow(second, 2n ** 70n), drawBelow(second, 6n), second()],
    );
  });
});

describe("drawFloat", () => {
  it("[I-9a] reads the stream's next two draws as 53 bits over 2^53", () => {
    const [a = 0, b = 0, third] = take(drawStream("f"), 3);
    const draw = drawStream("f");
    const float = drawFloat(draw);

    // oxlint-disable-next-line no-bitwise -- the formula OD-3 pins, written as random.ts's doc writes it.
    assert.strictEqual(float, ((a >>> 5) * 67_108_864 + (b >>> 6)) / 9_007_199_254_740_992);
    assert.strictEqual(float, 0.4765747664532872);
    assert.strictEqual(draw(), third);
  });

  it("[I-9a] lies in [0, 1)", () => {
    const draw = drawStream("plate");
    const floats = Array.from({ length: 1000 }, () => drawFloat(draw));

    assert.isTrue(floats.every((float) => float >= 0 && float < 1));
  });
});

describe("drawBelow", () => {
  it("[I-9a] over 2^70 values reads three draws, the first the most significant, masked to 70 bits", () => {
    const expected = candidateOf(take(drawStream("range"), 3), 70);

    assert.strictEqual(drawBelow(drawStream("range"), 2n ** 70n), expected);
    assert.strictEqual(expected, 617_981_431_749_679_864_578n);
  });

  it("[I-9a] draws again while the candidate is not below the count", () => {
    const draws = take(drawStream(redrawKey), 7);
    const draw = drawStream(redrawKey);

    assert.isTrue(candidateOf(draws.slice(0, 3), 70) >= redrawCount);
    assert.strictEqual(drawBelow(draw, redrawCount), candidateOf(draws.slice(3, 6), 70));
    assert.strictEqual(candidateOf(draws.slice(3, 6), 70), 121_846_576_565_791_598_454n);
    assert.strictEqual(draw(), draws[6]);
  });

  it("[I-9a] gives 0 for a count of 1 and draws nothing", () => {
    const draw = drawStream("one");

    assert.strictEqual(drawBelow(draw, 1n), 0n);
    assert.strictEqual(draw(), 0x53_4d_7f_f5);
  });
});

describe("templateKey and responseKey", () => {
  it("[I-9a] join their parts with U+001F", () => {
    assert.strictEqual(templateKey("7", "i", "item"), "7\u001Fi\u001Ftemplate\u001Fitem");
    assert.strictEqual(responseKey("7", "i", 2), "7\u001Fi\u001Fresponse\u001F2");
  });
});

describe("the generator module", () => {
  it("passes the browser allowlist as a root", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/engine/random.ts"]), []);
  });
});
