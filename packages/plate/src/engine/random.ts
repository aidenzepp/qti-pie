/**
 * The owned generator: a 32-bit FNV-1a hash of a key seeds a SplitMix32 generator, whose draws
 * order a shuffled Choice by Fisher-Yates.
 *
 * Every step is pinned to the bit, because the order is replayed: M2 restores a session's
 * presented order and its `choiceSequence` from the stored key alone, so the same key must give
 * the same order in every build, browser and engine. The generator is a placeholder for OD-3,
 * which M3.b settles; until then nothing here may change without a new pin.
 *
 * Arithmetic is modulo 2^32 throughout: `Math.imul` multiplies modulo 2^32 and `>>> 0` reads a
 * result as an unsigned 32-bit integer. The module is pure and synchronous, and imports nothing.
 *
 * @module
 */
/* oxlint-disable no-bitwise -- FNV-1a and the MurmurHash3 finaliser are defined by XOR, shifts and modulo-2^32 multiplication; the bitwise operators are the specification, not a slip for logical ones. */

/**
 * 2^32, the number of distinct draws; a draw divided by it is a fraction in [0, 1).
 */
const drawCount = 2 ** 32;

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
