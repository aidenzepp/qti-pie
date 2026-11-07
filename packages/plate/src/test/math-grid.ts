/**
 * P7-MP's two grids of `Math` arguments, the fold that digests a list of doubles, and the committed
 * digests of `src/engine/math.ts` over the grids, which `math.test.ts` asserts in Node and
 * `math.dom.test.ts` asserts in Chromium's and WebKit's pages.
 *
 * - {@link singles}: 1,000 doubles, the arguments of `sin cos tan asin acos atan sinh cosh tanh exp
 *   log log10`;
 * - {@link pairs}: 1,000 pairs `[a, b]`, the arguments of `atan2(a, b)` and `pow(a, b)`.
 *
 * Both are the probe's (`p7-mp`), of its composition and in its order: the corpus's own arguments,
 * the special values and each function's edges, multiples of π near the periodic edges, then a
 * seeded fill from SplitMix64 to 1,000 distinct entries. Each is rebuilt from bit patterns and
 * operations ECMA-262 defines exactly, so every conforming engine builds the same grids: the
 * probe's powers of two are literals, its one approximated input, `Math.log(Number.MAX_VALUE)`, is
 * its bit pattern, and an angle is `k * (Math.PI / 180)`, one exact division then one exact
 * multiply.
 *
 * One step reads an approximated algorithm on purpose: the seeded fills' `logUniform` builds each
 * magnitude as ``Number(`${mantissa}e${exponent}`)``, so it reads `String(mantissa)`'s digits,
 * whose last one ECMA-262 leaves to the engine. It is kept as the probe wrote it, so the grids
 * equal the probe's; the two input digests ({@link inputDigests}), asserted in every engine, fail
 * in an engine whose digits differ.
 *
 * {@link fold} is a 64-bit FNV-1a over each double's 64-bit pattern, written most significant byte
 * first, with every NaN folded as `0x7ff8000000000000`: NumericToRawBytes lets an engine write any
 * NaN encoding, so a NaN's payload is not a result of the function, only of the encoding step.
 *
 * Test support, typed in both programs: the root program by its path, and the DOM program through
 * `src/engine/math.dom.test.ts`, whose `types` is empty, so the module imports nothing.
 *
 * @module
 */
/* oxlint-disable no-bitwise -- SplitMix64 and FNV-1a are defined by XOR, shifts and masks over 64-bit integers; the bitwise operators are the specification, not a slip for logical ones. */

/**
 * 2^64 - 1, the mask that reads a `bigint` as an unsigned 64-bit integer.
 */
const mask64 = 0xff_ff_ff_ff_ff_ff_ff_ffn;

/**
 * 2^53, the number of distinct fractions {@link splitMix}'s `unit` draws.
 */
const twoTo53 = 9_007_199_254_740_992;

/**
 * The pattern every NaN is read as, the quiet NaN with no payload.
 */
const canonicalNaN = 0x7f_f8_00_00_00_00_00_00n;

/**
 * The 8 bytes a double is read through, big-endian unless a call says otherwise.
 */
const view = new DataView(new ArrayBuffer(8));

/**
 * Read a double's 64-bit pattern, every NaN as {@link canonicalNaN}.
 *
 * @param x The double.
 * @returns Its pattern, an unsigned 64-bit integer.
 */
export const bitsOf = (x: number): bigint => {
  if (Number.isNaN(x)) {
    return canonicalNaN;
  }

  view.setFloat64(0, x);

  return view.getBigUint64(0);
};

/**
 * Build the double a 64-bit pattern encodes.
 *
 * @param bits The pattern.
 * @returns The double.
 */
export const fromBits = (bits: bigint): number => {
  view.setBigUint64(0, bits);

  return view.getFloat64(0);
};

/**
 * The next double toward +∞ from a finite double that is not NaN.
 *
 * @param x The double.
 * @returns Its successor.
 */
const nextUp = (x: number): number => {
  if (x === 0) {
    return Number.MIN_VALUE;
  }

  const bits = bitsOf(x);

  return fromBits(x > 0 ? bits + 1n : bits - 1n);
};

/**
 * The next double toward -∞ from a finite double that is not NaN.
 *
 * @param x The double.
 * @returns Its predecessor.
 */
const nextDown = (x: number): number => -nextUp(-x);

/**
 * The draws of one SplitMix64 stream, each built from the stream's 64-bit outputs by exact
 * operations, but for `logUniform` (the module's doc says why).
 */
interface Stream {
  /**
   * A magnitude `m * 10^e` with a random sign, `e` uniform in `[low, high]` and `m` uniform in
   * `[1, 10)`, read back from `String(m)`'s digits.
   */
  readonly logUniform: (low: number, high: number) => number;
  /**
   * A double uniform in `[low, high)`.
   */
  readonly uniform: (low: number, high: number) => number;
}

/**
 * Start a SplitMix64 stream from a seed: the state steps by the golden-ratio increment, and each
 * output is the state through SplitMix64's finaliser, all modulo 2^64.
 *
 * @param seed The seed.
 * @returns The stream's draws.
 * @see https://prng.di.unimi.it/splitmix64.c
 */
const splitMix = (seed: bigint): Stream => {
  let state = seed & mask64;

  const next = (): bigint => {
    state = (state + 0x9e_37_79_b9_7f_4a_7c_15n) & mask64;

    const mixed = ((state ^ (state >> 30n)) * 0xbf_58_47_6d_1c_e4_e5_b9n) & mask64;
    const mixedAgain = ((mixed ^ (mixed >> 27n)) * 0x94_d0_49_bb_13_31_11_ebn) & mask64;

    return mixedAgain ^ (mixedAgain >> 31n);
  };

  const unit = (): number => Number(next() >> 11n) / twoTo53;

  return {
    logUniform: (low, high) => {
      const exponent = low + Math.floor(unit() * (high - low + 1));
      const mantissa = 1 + 9 * unit();
      const sign = unit() < 0.5 ? -1 : 1;

      return sign * Number(`${mantissa}e${exponent}`);
    },
    uniform: (low, high) => low + (high - low) * unit(),
  };
};

/**
 * A list of values in first-seen order, one per key: a double's pattern, or a pair's two.
 */
interface Distinct<A> {
  /**
   * Add a value unless its key is already in the list.
   */
  readonly add: (value: A) => void;
  /**
   * The values, in the order first added.
   */
  readonly values: readonly A[];
}

/**
 * Start an empty {@link Distinct} list.
 *
 * @param keyOf The key a value is told apart by.
 * @returns The list.
 */
const distinct = <A>(keyOf: (value: A) => string): Distinct<A> => {
  const seen = new Set<string>();
  const values: A[] = [];

  return {
    add: (value) => {
      const key = keyOf(value);

      if (!seen.has(key)) {
        seen.add(key);
        values.push(value);
      }
    },
    values,
  };
};

/**
 * The size of each grid.
 */
const gridSize = 1000;

/**
 * One degree in radians, as the corpus computes it: the float `pi / 180`.
 */
const degree = Math.PI / 180;

/**
 * 2^-1022, the least normal double.
 */
const minNormal = 2.2250738585072014e-308;

/**
 * `Math.log(Number.MAX_VALUE)` as Node 26 computed it for the probe, `0x40862e42fefa39ef`.
 */
const lnMax = fromBits(0x40_86_2e_42_fe_fa_39_efn);

/**
 * Build the single grid, in the probe's order: the corpus's arguments, the special values and
 * each function's edges, multiples of π, then the seeded fill.
 *
 * @returns 1,000 distinct doubles.
 */
const buildSingles = (): readonly number[] => {
  const single = distinct((x: number) => bitsOf(x).toString(16));
  const add = (...values: readonly number[]): void => {
    for (const value of values) {
      single.add(value);
    }
  };

  // The corpus's arguments: sin(k * pi / 180) for k in 5..170, and exp(1..4).
  for (let k = 5; k <= 170; k += 1) {
    add(k * degree);
  }

  add(1, 2, 3, 4);
  // Zeros, infinities, NaN, subnormals and the normal edges.
  add(
    0,
    -0,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NaN,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    nextDown(minNormal),
    -nextDown(minNormal),
    minNormal,
    -minNormal,
    1e-310,
    -1e-310,
    3e-320,
    -3e-320,
    // 2^-1060
    8.095e-320,
    Number.MAX_VALUE,
    -Number.MAX_VALUE,
    1,
    -1,
    nextUp(1),
    nextDown(1),
    nextUp(-1),
    nextDown(-1),
    0.5,
    -0.5,
    2,
    -2,
    10,
    100,
    1e-8,
    -1e-8,
    1e-16,
    -1e-16,
    1e-300,
    -1e-300,
    1e300,
    -1e300,
  );
  // Each function's own edges: exp's overflow and underflow, log's 1 and e, sinh's and cosh's
  // overflow, tanh's saturation, asin and acos at +-1, log10 at powers of ten.
  add(
    lnMax,
    nextUp(lnMax),
    nextDown(lnMax),
    -lnMax,
    709,
    710,
    -708.3964185322641,
    -745.1332191019411,
    -745.1332191019412,
    -746,
    1e-300,
    Math.E,
    -Math.E,
    Math.LN2,
    Math.LN10,
    710.4758600739439,
    710.476,
    -710.4758600739439,
    19.06,
    22,
    -22,
    1e-9,
    -1e-9,
    Math.SQRT1_2,
    -Math.SQRT1_2,
    0.8660254037844386,
    0.9999999,
    -0.9999999,
    1000,
    1e15,
    1e-5,
    1e22,
    1e23,
    1e-323,
    3,
    0.1,
    -0.1,
    Math.SQRT2,
    Math.SQRT1_2,
  );

  // Multiples of pi near the periodic edges: k * pi / 4 for k in -16..16, then k * pi / 2 and
  // its neighbours one ulp either side, both signs, then large arguments.
  for (let k = -16; k <= 16; k += 1) {
    add(k * (Math.PI / 4));
  }

  for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 10, 20, 50, 100, 1000, 1e4, 1e5, 1e6, 1e9]) {
    const x = k * (Math.PI / 2);

    add(x, nextUp(x), nextDown(x), -x, nextUp(-x), nextDown(-x));
  }

  add(
    Math.PI,
    -Math.PI,
    2 * Math.PI,
    nextUp(Math.PI),
    nextDown(Math.PI),
    1e6 * Math.PI,
    // 2^30 * (pi / 2)
    1_073_741_824 * (Math.PI / 2),
    // 2^52
    4_503_599_627_370_496,
    // 2^53
    twoTo53,
    // 2^53 * pi
    twoTo53 * Math.PI,
    // 2^60
    1_152_921_504_606_846_976,
    // 2^100
    1.2676506002282294e30,
    1e100,
    1.7e308,
    -1e22,
    // 6381956970095103 * 2^797
    6_381_956_970_095_103 * 8.335018041099818e239,
    5.319372648326541e255,
  );

  // The seeded fill: alternately a typical argument in [-10, 10) and a magnitude from 1e-300 to
  // 1e300 with a random sign.
  const seed = splitMix(0x5e_ed_00_01n);
  let turn = 0;

  while (single.values.length < gridSize) {
    add(turn % 2 === 0 ? seed.uniform(-10, 10) : seed.logUniform(-300, 300));
    turn += 1;
  }

  return single.values;
};

/**
 * Build the pair grid, in the probe's order: the special values crossed with themselves, negative
 * bases against integer and fractional exponents, then the seeded fill.
 *
 * @returns 1,000 distinct pairs.
 */
const buildPairs = (): readonly (readonly [number, number])[] => {
  const pair = distinct(
    ([a, b]: readonly [number, number]) => `${bitsOf(a).toString(16)}:${bitsOf(b).toString(16)}`,
  );
  const special = [
    0,
    -0,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NaN,
    1,
    -1,
    0.5,
    -0.5,
    2,
    -2,
    3,
    -3,
    1.5,
    -1.5,
    Number.MIN_VALUE,
    -Number.MIN_VALUE,
    1e300,
    -1e300,
    1e-300,
    nextUp(1),
    nextDown(1),
    Math.PI,
    -Math.PI,
  ];

  for (const a of special) {
    for (const b of special) {
      pair.add([a, b]);
    }
  }

  // Negative bases with integer and non-integer exponents, odd and even large integers among them.
  for (const base of [-2.5, -10, -0.1, -7, -1e-5, -123.456]) {
    for (const exponent of [
      -7,
      -4,
      -1,
      1,
      5,
      31,
      1 / 3,
      2.5,
      -2.5,
      // 2^53
      twoTo53,
      // 2^53 + 2
      twoTo53 + 2,
      1e15 + 1,
      -(1e15 + 1),
      0.1,
    ]) {
      pair.add([base, exponent]);
    }
  }

  // The seeded fill: alternately both coordinates in [-10, 10), and a magnitude from 1e-300 to
  // 1e300 against an exponent in [-50, 50).
  const seed = splitMix(0x5e_ed_00_02n);
  let turn = 0;

  while (pair.values.length < gridSize) {
    pair.add(
      turn % 2 === 0
        ? [seed.uniform(-10, 10), seed.uniform(-10, 10)]
        : [seed.logUniform(-300, 300), seed.uniform(-50, 50)],
    );
    turn += 1;
  }

  return pair.values;
};

/**
 * The single grid: 1,000 distinct doubles, the probe's.
 */
export const singles: readonly number[] = buildSingles();

/**
 * The pair grid: 1,000 distinct pairs `[a, b]`, the probe's.
 */
export const pairs: readonly (readonly [number, number])[] = buildPairs();

/**
 * FNV-1a's 64-bit offset basis.
 */
const offsetBasis = 0xcb_f2_9c_e4_84_22_23_25n;

/**
 * FNV-1a's 64-bit prime, 2^40 + 2^8 + 0xb3.
 */
const prime = 0x1_00_00_00_01_b3n;

/**
 * Digest a list of doubles: a 64-bit FNV-1a over each one's pattern ({@link bitsOf}, every NaN as
 * `0x7ff8000000000000`), its 8 bytes taken most significant first, in the list's order.
 *
 * @param values The doubles.
 * @returns The digest, as 16 lower-case hexadecimal digits.
 * @see http://www.isthe.com/chongo/tech/comp/fnv/index.html#FNV-1a
 */
export const fold = (values: Iterable<number>): string => {
  let hash = offsetBasis;

  for (const value of values) {
    const bits = bitsOf(value);

    for (let shift = 56n; shift >= 0n; shift -= 8n) {
      hash = ((hash ^ ((bits >> shift) & 0xffn)) * prime) & mask64;
    }
  }

  return hash.toString(16).padStart(16, "0");
};

/**
 * The digests of the two grids' inputs, each pair folded as its two doubles in order. A change
 * here means the grids are no longer the probe's.
 */
export const inputDigests = {
  pairs: "42d33bda307be16f",
  singles: "a2f499ff2445ffc1",
} as const;

/**
 * The names of `src/engine/math.ts`'s functions of one argument that {@link singles} runs through.
 */
export const singleNames = [
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "log",
  "log10",
] as const;

/**
 * The names of `src/engine/math.ts`'s functions of two arguments that {@link pairs} runs through.
 */
export const pairNames = ["atan2", "pow"] as const;

/**
 * The digest of each function's results over its grid, in the grid's order: plate's own Math,
 * computed in Node and committed, so a page that computes another digest computes other bits.
 * `expm1` has none: `sinh`, `cosh` and `tanh` run it.
 */
export const resultDigests: Readonly<
  Record<(typeof singleNames)[number] | (typeof pairNames)[number], string>
> = {
  acos: "b6ee00c1d235c53f",
  asin: "25607e7937880ff5",
  atan: "7487ddbd950c0e16",
  atan2: "5838aa4166503322",
  cos: "bf94a0d179357359",
  cosh: "0551dd1de83ce0cd",
  exp: "89ff8b841a0c24c4",
  log: "9c64935dd1cff356",
  log10: "2bdbe7491c47997b",
  pow: "d40831b5a6b71d65",
  sin: "3796d6bf45e5e21d",
  sinh: "c54c47d84f8b0908",
  tan: "0d0cf48dc8c53919",
  tanh: "6b42408490883fdc",
};
