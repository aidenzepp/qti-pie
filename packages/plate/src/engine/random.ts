/**
 * OD-3's generator: a 32-bit FNV-1a hash of a key seeds a SplitMix32 stream, whose draws order a
 * shuffled Choice by Fisher-Yates and give the random expression kinds their floats and integers.
 *
 * The algorithm is part of the session contract. A session's presented order and every value a
 * random kind draws are replayed from the stored key alone, so the same key gives the same draws in
 * every build, browser and engine. Every step is pinned to the bit, and nothing here may change
 * without a new pin.
 *
 * Arithmetic is modulo 2^32 throughout: `Math.imul` multiplies modulo 2^32 and `>>> 0` reads a
 * result as an unsigned 32-bit integer. The module is pure and synchronous, and imports nothing. It
 * holds no stream: every draw comes from a stream its caller passes, so no result depends on an
 * earlier call.
 *
 * @module
 */
/* oxlint-disable no-bitwise -- FNV-1a, the MurmurHash3 finaliser and the float draw are defined by XOR, shifts and modulo-2^32 multiplication; the bitwise operators are the specification, not a slip for logical ones. */

/**
 * 2^32, the number of distinct draws; a draw divided by it is a fraction in [0, 1).
 */
const drawCount = 4_294_967_296;

/**
 * One stream's draws: each call gives the stream's next draw, an unsigned 32-bit integer, and
 * advances the stream.
 *
 * Every draw of one processing run comes from one stream, in evaluation order, so the run's values
 * depend only on the stream's key ({@link drawStream}).
 */
export type Draw = () => number;

/**
 * The encoder of a key's UTF-8 bytes. A lone surrogate encodes as U+FFFD, as the Encoding
 * Standard's UTF-8 encoder writes it.
 *
 * @see https://encoding.spec.whatwg.org/#utf-8-encoder
 */
const utf8 = new TextEncoder();

/**
 * Hash a key with 32-bit FNV-1a over its UTF-8 bytes: offset basis `0x811c9dc5`, prime
 * `0x01000193`, each byte XORed in before the multiply, modulo 2^32.
 *
 * @param text The key.
 * @returns The hash, an unsigned 32-bit integer.
 * @see http://www.isthe.com/chongo/tech/comp/fnv/index.html#FNV-1a
 */
export const fnv1a32 = (text: string): number => {
  let hash = 0x81_1c_9d_c5;

  for (const byte of utf8.encode(text)) {
    hash = Math.imul(hash ^ byte, 0x01_00_01_93);
  }

  return hash >>> 0;
};

/**
 * Construct a SplitMix32 generator from a seed. Each draw adds `0x9e3779b9` to the state, modulo
 * 2^32, and returns the state mixed by MurmurHash3's 32-bit finaliser.
 *
 * The seed is read as an unsigned 32-bit integer (`seed >>> 0`), so {@link fnv1a32}'s hash seeds
 * it exactly. The returned function holds the state: each call advances it.
 *
 * @param seed The initial state.
 * @returns The next draw on each call, an unsigned 32-bit integer.
 * @see https://github.com/aappleby/smhasher/blob/master/src/MurmurHash3.cpp
 */
export const splitMix32 = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x9e_37_79_b9) >>> 0;

    let mixed = state ^ (state >>> 16);

    mixed = Math.imul(mixed, 0x85_eb_ca_6b);
    mixed ^= mixed >>> 13;
    mixed = Math.imul(mixed, 0xc2_b2_ae_35);
    mixed ^= mixed >>> 16;

    return mixed >>> 0;
  };
};

/**
 * Swap two entries of a list in place.
 *
 * @param list The list.
 * @param left A position in the list.
 * @param right Another position in the list.
 */
const swap = (list: number[], left: number, right: number): void => {
  const leftEntry = list[left];
  const rightEntry = list[right];

  // Both positions are within the list, so neither read is undefined; the check narrows the type.
  if (leftEntry !== undefined && rightEntry !== undefined) {
    list[left] = rightEntry;
    list[right] = leftEntry;
  }
};

/**
 * Give the presented order of a list whose entries may be fixed, shuffled under a key.
 *
 * The key's {@link fnv1a32} hash seeds {@link splitMix32}. Fisher-Yates runs over the list of
 * non-fixed positions, from the last down to the second: the entry at index `i` of that list
 * swaps with the one at `floor(draw * (i + 1) / 2^32)`. A fixed position keeps its own entry. The
 * product of a draw and `i + 1` is exact below 2^53, so the index is exact for any list shorter
 * than 2^21.
 *
 * @param key The key the order is drawn under; the same key gives the same order.
 * @param fixed For each position in document order, whether its entry is fixed.
 * @returns The presented order: at each position, the document index of the entry shown there.
 *   A fixed index is at its own position; an empty or one-element list is the identity.
 */
export const shuffleOrder = (key: string, fixed: readonly boolean[]): readonly number[] => {
  const draw = splitMix32(fnv1a32(key));
  const shuffled = fixed.flatMap((isFixed, index) => (isFixed ? [] : [index]));

  for (let last = shuffled.length - 1; last > 0; last -= 1) {
    swap(shuffled, last, Math.floor((draw() * (last + 1)) / drawCount));
  }

  const presented = shuffled.values();

  // `shuffled` holds one entry per non-fixed position, so the iterator never runs dry here.
  return fixed.map((isFixed, index) => (isFixed ? index : (presented.next().value ?? index)));
};

/**
 * Construct the stream of a key: {@link splitMix32} seeded with the key's {@link fnv1a32} hash, as
 * {@link shuffleOrder} draws.
 *
 * Each call starts a fresh stream, so the same key gives the same draws in every call. The
 * construction is part of OD-3's contract.
 *
 * @param key The key, such as {@link templateKey}'s or {@link responseKey}'s.
 * @returns The stream's draws.
 */
export const drawStream = (key: string): Draw => splitMix32(fnv1a32(key));

/**
 * Draw a float in [0, 1) from two draws `a` and `b`, taken in that order:
 * `((a >>> 5) × 67_108_864 + (b >>> 6)) / 9_007_199_254_740_992`, that is, the top 27 bits of `a`
 * above the top 26 bits of `b`, over 2^53.
 *
 * The 53-bit numerator is exact in a `number` and the division by 2^53 is exact, so the float is
 * the same in every engine: one of the 2^53 multiples of 2^-53 below 1, each equally likely. The
 * formula is part of OD-3's contract.
 *
 * @param draw The stream; the float takes its next two draws.
 * @returns The float, at least 0 and below 1.
 */
export const drawFloat = (draw: Draw): number => {
  const high = draw() >>> 5;
  const low = draw() >>> 6;

  return (high * 67_108_864 + low) / 9_007_199_254_740_992;
};

/**
 * Read one candidate of {@link drawBelow}: ⌈bits / 32⌉ draws as one big-endian number, the first
 * draw the most significant 32-bit word and the last the least, masked to its low `bits` bits.
 *
 * @param draw The stream.
 * @param bits The number of low bits kept, 1 or more.
 * @returns The candidate, below 2^bits.
 */
const candidateOf = (draw: Draw, bits: number): bigint => {
  let whole = 0n;
  for (let read = 0; read < bits; read += 32) {
    whole = whole * BigInt(drawCount) + BigInt(draw());
  }

  return BigInt.asUintN(bits, whole);
};

/**
 * Draw an integer below a count, each equally likely, by rejection: with `k` the bit length of
 * `count − 1`, read ⌈k / 32⌉ draws as one big-endian number (the first draw the most significant
 * 32-bit word, the last the least), mask it to its low `k` bits, and draw again while the result is
 * not below `count`.
 *
 * A candidate is below 2^k, which is less than twice `count`, so each candidate is accepted with
 * probability above one half. A count of 1 has `k` 0: it draws nothing and gives 0. The procedure
 * is part of OD-3's contract.
 *
 * @param draw The stream; each candidate takes its next ⌈k / 32⌉ draws.
 * @param count The number of values to draw among, 1 or more. A count below 1 is read as 1, so the
 *   draw always ends.
 * @returns The integer, at least 0 and below `count`.
 */
export const drawBelow = (draw: Draw, count: bigint): bigint => {
  if (count <= 1n) {
    return 0n;
  }

  const bits = (count - 1n).toString(2).length;
  let candidate = candidateOf(draw, bits);
  while (candidate >= count) {
    candidate = candidateOf(draw, bits);
  }

  return candidate;
};

/**
 * The separator of a key's fields, U+001F INFORMATION SEPARATOR ONE, as a shuffled Choice's key
 * joins its fields (`choiceOrder` in `#plate/payload.ts`).
 */
const keySeparator = "\u001F";

/**
 * Construct the key an item's template processing draws under:
 * `<seed>\u001F<instance>\u001Ftemplate\u001F<item>`.
 *
 * @param seed The record's seed: the host's seed written with `String`, the empty string when the
 *   host gave none.
 * @param instance The item's instance.
 * @param item The item's identifier.
 * @returns The key, for {@link drawStream}.
 */
export const templateKey = (seed: string, instance: string, item: string): string =>
  [seed, instance, "template", item].join(keySeparator);

/**
 * Construct the key an attempt's response processing draws under:
 * `<seed>\u001F<instance>\u001Fresponse\u001F<numAttempts>`, the count written with `String`.
 *
 * @param seed The record's seed: the host's seed written with `String`, the empty string when the
 *   host gave none.
 * @param instance The item's instance.
 * @param numAttempts The attempt's count, the built-in `numAttempts` its processing reads.
 * @returns The key, for {@link drawStream}.
 */
export const responseKey = (seed: string, instance: string, numAttempts: number): string =>
  [seed, instance, "response", String(numAttempts)].join(keySeparator);
