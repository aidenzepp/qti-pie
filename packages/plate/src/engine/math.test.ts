import { assert, describe, it } from "@effect/vitest";
import {
  acos,
  asin,
  atan,
  atan2,
  cos,
  cosh,
  exp,
  expm1,
  foldCase,
  log,
  log10,
  pow,
  shortestDecimal,
  sin,
  sinh,
  tan,
  tanh,
} from "#plate/engine/math.ts";
import {
  bitsOf,
  fold,
  fromBits,
  inputDigests,
  pairNames,
  pairs,
  resultDigests,
  singleNames,
  singles,
} from "#plate/test/math-grid.ts";
import { sourceModules } from "#plate/test/imports.ts";

/**
 * Floats and the digits {@link shortestDecimal} must write for each, pinned so a change of the
 * engine's number-to-string conversion, or of its remedy, shows here.
 */
const pinned: readonly (readonly [number, string])[] = [
  [1.5, "1.5"],
  [100, "100"],
  [1e21, "1e+21"],
  [0.1 + 0.2, "0.30000000000000004"],
  [-0, "0"],
  [5e-324, "5e-324"],
  [Number.MAX_VALUE, "1.7976931348623157e+308"],
  [3.175, "3.175"],
  [1.2345e-7, "1.2345e-7"],
];

describe("shortestDecimal", () => {
  for (const [float, written] of pinned) {
    it(`writes ${written}`, () => {
      assert.strictEqual(shortestDecimal(float), written);
    });
  }
});

describe("foldCase", () => {
  it("folds York to york", () => {
    assert.strictEqual(foldCase("York"), "york");
  });

  it("folds ß to ss", () => {
    assert.strictEqual(foldCase("ß"), "ss");
  });
});

/**
 * Plate's functions of one argument, by name.
 */
const singleFunctions: Readonly<Record<(typeof singleNames)[number], (x: number) => number>> = {
  acos,
  asin,
  atan,
  cos,
  cosh,
  exp,
  log,
  log10,
  sin,
  sinh,
  tan,
  tanh,
};

/**
 * Plate's functions of two arguments, by name.
 */
const pairFunctions: Readonly<
  Record<(typeof pairNames)[number], (a: number, b: number) => number>
> = { atan2, pow };

/**
 * Write a double as its 64-bit pattern in hexadecimal, so a failure names the bits.
 *
 * @param x The double.
 * @returns Its pattern, as 16 hexadecimal digits.
 */
const hexOf = (x: number): string => bitsOf(x).toString(16).padStart(16, "0");

/**
 * Assert that a result is exactly a double, its sign of zero and NaN included.
 *
 * @param actual The result.
 * @param expected The double it must be.
 */
const assertExactly = (actual: number, expected: number): void => {
  assert.strictEqual(hexOf(actual), hexOf(expected));
};

describe("math: the digests over P7-MP's grids", () => {
  it("rebuilds the single grid's inputs", () => {
    assert.strictEqual(singles.length, 1000);
    assert.strictEqual(fold(singles), inputDigests.singles);
  });

  it("rebuilds the pair grid's inputs", () => {
    assert.strictEqual(pairs.length, 1000);
    assert.strictEqual(fold(pairs.flat()), inputDigests.pairs);
  });

  for (const name of singleNames) {
    it(`gives ${name}'s digest over the singles`, () => {
      assert.strictEqual(fold(singles.map((x) => singleFunctions[name](x))), resultDigests[name]);
    });
  }

  for (const name of pairNames) {
    it(`gives ${name}'s digest over the pairs`, () => {
      assert.strictEqual(
        fold(pairs.map(([a, b]) => pairFunctions[name](a, b))),
        resultDigests[name],
      );
    });
  }
});

/**
 * π's double, `0x400921fb54442d18`.
 */
const pi = fromBits(0x40_09_21_fb_54_44_2d_18n);

/**
 * π/2's double, `0x3ff921fb54442d18`.
 */
const halfPi = fromBits(0x3f_f9_21_fb_54_44_2d_18n);

/**
 * π/4's double, `0x3fe921fb54442d18`.
 */
const quarterPi = fromBits(0x3f_e9_21_fb_54_44_2d_18n);

/**
 * 3π/4's double, `0x4002d97c7f3321d2`: fdlibm's `3.0 * pi_o_4`.
 */
const threeQuarterPi = fromBits(0x40_02_d9_7c_7f_33_21_d2n);

const infinity = Number.POSITIVE_INFINITY;

/**
 * Known answers of one function of one argument: each argument and the exact double it gives,
 * the IEEE specials and the values the definitions fix.
 */
const singleAnswers: Readonly<
  Record<(typeof singleNames)[number] | "expm1", readonly (readonly [number, number])[]>
> = {
  acos: [
    [1, 0],
    [-1, pi],
    [0, halfPi],
    [-0, halfPi],
    [1.5, Number.NaN],
    [-1.5, Number.NaN],
    [infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  asin: [
    [0, 0],
    [-0, -0],
    [1, halfPi],
    [-1, -halfPi],
    [1.5, Number.NaN],
    [-infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  atan: [
    [0, 0],
    [-0, -0],
    [1, quarterPi],
    [-1, -quarterPi],
    [infinity, halfPi],
    [-infinity, -halfPi],
    [Number.NaN, Number.NaN],
  ],
  cos: [
    [0, 1],
    [-0, 1],
    [infinity, Number.NaN],
    [-infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  cosh: [
    [0, 1],
    [-0, 1],
    [infinity, infinity],
    [-infinity, infinity],
    [Number.NaN, Number.NaN],
  ],
  exp: [
    [0, 1],
    [-0, 1],
    [infinity, infinity],
    [-infinity, 0],
    [1000, infinity],
    [-1000, 0],
    [Number.NaN, Number.NaN],
  ],
  expm1: [
    [0, 0],
    [-0, -0],
    [infinity, infinity],
    [-infinity, -1],
    [Number.NaN, Number.NaN],
  ],
  log: [
    [1, 0],
    [0, -infinity],
    [-0, -infinity],
    [infinity, infinity],
    [-1, Number.NaN],
    [-infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  log10: [
    [0, -infinity],
    [-0, -infinity],
    [infinity, infinity],
    [-1, Number.NaN],
    [Number.NaN, Number.NaN],
    ...Array.from({ length: 23 }, (_, n) => [Number(`1e${n}`), n] as const),
  ],
  sin: [
    [0, 0],
    [-0, -0],
    [infinity, Number.NaN],
    [-infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  sinh: [
    [0, 0],
    [-0, -0],
    [infinity, infinity],
    [-infinity, -infinity],
    [Number.NaN, Number.NaN],
  ],
  tan: [
    [0, 0],
    [-0, -0],
    [infinity, Number.NaN],
    [-infinity, Number.NaN],
    [Number.NaN, Number.NaN],
  ],
  tanh: [
    [0, 0],
    [-0, -0],
    [infinity, 1],
    [-infinity, -1],
    [Number.NaN, Number.NaN],
  ],
};

/**
 * `atan2(y, x)`'s table: each `[y, x]` and the exact double it gives, fdlibm's special cases,
 * which are the table QTI lists.
 */
const atan2Answers: readonly (readonly [number, number, number])[] = [
  [0, 0, 0],
  [-0, 0, -0],
  [0, -0, pi],
  [-0, -0, -pi],
  [0, -1, pi],
  [-0, -1, -pi],
  [0, 1, 0],
  [-0, 1, -0],
  [1, 0, halfPi],
  [1, -0, halfPi],
  [-1, 0, -halfPi],
  [-1, -0, -halfPi],
  [infinity, infinity, quarterPi],
  [-infinity, infinity, -quarterPi],
  [infinity, -infinity, threeQuarterPi],
  [-infinity, -infinity, -threeQuarterPi],
  [1, infinity, 0],
  [-1, infinity, -0],
  [1, -infinity, pi],
  [-1, -infinity, -pi],
  [infinity, 1, halfPi],
  [-infinity, 1, -halfPi],
  [1, 1, quarterPi],
  [Number.NaN, 1, Number.NaN],
  [1, Number.NaN, Number.NaN],
];

/**
 * `pow(base, exponent)`'s known answers: Number::exponentiate's special cases (ECMA-262 6.1.6.1.3),
 * and integer powers whose result is representable, which fdlibm gives exactly.
 */
const powAnswers: readonly (readonly [number, number, number])[] = [
  // The exponent is NaN, or ±0.
  [2, Number.NaN, Number.NaN],
  [1, Number.NaN, Number.NaN],
  [Number.NaN, 0, 1],
  [Number.NaN, -0, 1],
  [-infinity, 0, 1],
  // The base is NaN.
  [Number.NaN, 1, Number.NaN],
  // The base is +∞.
  [infinity, 0.5, infinity],
  [infinity, -0.5, 0],
  // The base is -∞.
  [-infinity, 3, -infinity],
  [-infinity, 2, infinity],
  [-infinity, 0.5, infinity],
  [-infinity, -3, -0],
  [-infinity, -2, 0],
  [-infinity, -0.5, 0],
  // The base is +0.
  [0, 3, 0],
  [0, 0.5, 0],
  [0, -3, infinity],
  [0, -0.5, infinity],
  // The base is -0.
  [-0, 3, -0],
  [-0, 2, 0],
  [-0, 0.5, 0],
  [-0, -3, -infinity],
  [-0, -2, infinity],
  [-0, -0.5, infinity],
  // The exponent is +∞.
  [2, infinity, infinity],
  [-2, infinity, infinity],
  [1, infinity, Number.NaN],
  [-1, infinity, Number.NaN],
  [0.5, infinity, 0],
  [-0.5, infinity, 0],
  // The exponent is -∞.
  [2, -infinity, 0],
  [-2, -infinity, 0],
  [1, -infinity, Number.NaN],
  [-1, -infinity, Number.NaN],
  [0.5, -infinity, infinity],
  [-0.5, -infinity, infinity],
  // A negative finite base and a finite exponent that is not an integer.
  [-2, 0.5, Number.NaN],
  [-8, 1 / 3, Number.NaN],
  // Integer powers.
  [2, 10, 1024],
  [3, 2, 9],
  [-2, 3, -8],
  [3, 33, 5_559_060_566_555_523],
  [10, 22, 1e22],
  [2, -3, 0.125],
];

describe("math: known answers, exact by definition", () => {
  const answered = { ...singleFunctions, expm1 };

  for (const name of [...singleNames, "expm1"] as const) {
    const run = answered[name];

    for (const [argument, expected] of singleAnswers[name]) {
      it(`${name}(${String(argument)}) is ${String(expected)}`, () => {
        assertExactly(run(argument), expected);
      });
    }
  }

  for (const [y, x, expected] of atan2Answers) {
    it(`atan2(${String(y)}, ${String(x)}) is ${hexOf(expected)}`, () => {
      assertExactly(atan2(y, x), expected);
    });
  }

  for (const [base, exponent, expected] of powAnswers) {
    it(`pow(${String(base)}, ${String(exponent)}) is ${String(expected)}`, () => {
      assertExactly(pow(base, exponent), expected);
    });
  }
});

/**
 * The digest of `sin` at the corpus's angles, k * (π/180) for k = 5 to 170, as plate computes
 * them: SineRule-002 and Example04 compute their sines at these.
 */
const corpusSinDigest = "b74506cc65dfc642";

/**
 * `exp(1)` to `exp(4)` as plate computes them, as patterns: Example03 computes these.
 */
const corpusExp: readonly string[] = [
  "4005bf0a8b14576a",
  "401d8e64b8d4ddae",
  "403415e5bf6fb106",
  "404b4c902e273a58",
];

describe("math: pinned bits for the corpus's own arguments", () => {
  it("gives sin's bits at k * (π/180) for k = 5 to 170", () => {
    const degree = Math.PI / 180;

    assert.strictEqual(
      fold(Array.from({ length: 166 }, (_, index) => sin((index + 5) * degree))),
      corpusSinDigest,
    );
  });

  it("gives exp's bits at 1, 2, 3 and 4", () => {
    assert.deepStrictEqual(
      [1, 2, 3, 4].map((x) => hexOf(exp(x))),
      corpusExp,
    );
  });
});

/**
 * The widest distance, in units in the last place, the net allows between plate and Node's `Math`.
 */
const ulpNet = 2;

/**
 * Read a double's pattern as a signed position on the number line, so the distance between two
 * finite doubles of any sign is their difference, in ulps; `+0` and `-0` are both 0.
 *
 * @param x A double that is not NaN.
 * @returns Its position.
 */
const positionOf = (x: number): bigint => (x < 0 || Object.is(x, -0) ? -bitsOf(-x) : bitsOf(x));

/**
 * Measure how far plate's result is from Node's: NaN and the infinities must match by class, and a
 * finite pair is apart by the number of doubles between them.
 *
 * @param ours Plate's result.
 * @param node Node's result.
 * @returns The distance in ulps, or infinity when the classes differ.
 */
const ulpsApart = (ours: number, node: number): number => {
  if (Number.isNaN(ours) || Number.isNaN(node)) {
    return Number.isNaN(ours) && Number.isNaN(node) ? 0 : infinity;
  }

  if (!Number.isFinite(ours) || !Number.isFinite(node)) {
    return ours === node ? 0 : infinity;
  }

  const apart = positionOf(ours) - positionOf(node);

  return Number(apart < 0n ? -apart : apart);
};

/**
 * Node's `Math`, by plate's names: an independent libm, a net for transcription bugs, never a pin.
 */
const nodeSingles: Readonly<Record<(typeof singleNames)[number], (x: number) => number>> = {
  acos: (x) => Math.acos(x),
  asin: (x) => Math.asin(x),
  atan: (x) => Math.atan(x),
  cos: (x) => Math.cos(x),
  cosh: (x) => Math.cosh(x),
  exp: (x) => Math.exp(x),
  log: (x) => Math.log(x),
  log10: (x) => Math.log10(x),
  sin: (x) => Math.sin(x),
  sinh: (x) => Math.sinh(x),
  tan: (x) => Math.tan(x),
  tanh: (x) => Math.tanh(x),
};

/**
 * Node's functions of two arguments, by plate's names.
 */
const nodePairs: Readonly<Record<(typeof pairNames)[number], (a: number, b: number) => number>> = {
  atan2: (a, b) => Math.atan2(a, b),
  pow: (a, b) => a ** b,
};

/**
 * Find the inputs where plate is further from Node than the net allows.
 *
 * @param inputs The grid's inputs.
 * @param ours Plate's function over an input.
 * @param node Node's function over the same input.
 * @returns Each input over the net, with both results' patterns.
 */
const overNet = <A>(
  inputs: readonly A[],
  ours: (input: A) => number,
  node: (input: A) => number,
): readonly string[] =>
  inputs.flatMap((input) => {
    const [plate, theirs] = [ours(input), node(input)];

    return ulpsApart(plate, theirs) > ulpNet
      ? [`${JSON.stringify(input)}: plate ${hexOf(plate)}, Node ${hexOf(theirs)}`]
      : [];
  });

describe("math: within 2 ulp of Node's Math over both grids", () => {
  for (const name of singleNames) {
    it(`${name} is within the net`, () => {
      assert.deepStrictEqual(overNet(singles, singleFunctions[name], nodeSingles[name]), []);
    });
  }

  for (const name of pairNames) {
    it(`${name} is within the net`, () => {
      assert.deepStrictEqual(
        overNet(
          pairs,
          ([a, b]) => pairFunctions[name](a, b),
          ([a, b]) => nodePairs[name](a, b),
        ),
        [],
      );
    });
  }
});

/**
 * The `Math` members ECMA-262 (21.3.2) leaves implementation-approximated, which no engine file
 * names: each goes through `src/engine/math.ts`.
 */
const approximated: ReadonlySet<string> = new Set([
  "acos",
  "acosh",
  "asin",
  "asinh",
  "atan",
  "atanh",
  "atan2",
  "cbrt",
  "cos",
  "cosh",
  "exp",
  "expm1",
  "hypot",
  "log",
  "log1p",
  "log10",
  "log2",
  "pow",
  "sin",
  "sinh",
  "tan",
  "tanh",
]);

/**
 * The `Math` members `src/engine/math.ts` may name: each is exact by its definition.
 */
const exactMembers: ReadonlySet<string> = new Set([
  "abs",
  "floor",
  "ceil",
  "trunc",
  "sign",
  "sqrt",
  "min",
  "max",
  "imul",
  "PI",
  "E",
]);

/**
 * A comment, from `//` to the line's end or from `/*` to its close.
 */
const commentAt = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/uy;

/**
 * A string literal in double or single quotes, its escapes included.
 */
const quotedAt = /"(?:[^"\\\n]|\\[\s\S])*"?|'(?:[^'\\\n]|\\[\s\S])*'?/uy;

/**
 * A regular expression literal, its character classes and escapes included, with its flags.
 */
const regexAt = /\/(?:[^/\\[\n]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[\p{ID_Continue}]*/uy;

/**
 * Template text up to the closing backtick or the `${` that opens a substitution, which the match
 * includes.
 */
const templateAt = /(?:[^`\\$]|\\[\s\S]|\$(?!\{))*(?:`|\$\{)?/uy;

/**
 * The length of a sticky pattern's match at an index.
 *
 * @param pattern A pattern with the `y` flag.
 * @param source The source.
 * @param index Where the match must start.
 * @returns The match's length, or 0 when it does not match there.
 */
const lengthAt = (pattern: RegExp, source: string, index: number): number => {
  pattern.lastIndex = index;

  return pattern.exec(source)?.[0].length ?? 0;
};

/**
 * Blank a module's comments, string literals, template text and regular expression literals, so
 * only its code is searched; a template's substitutions stay code. A `/` starts a regular
 * expression where an expression may start: at the start, after a punctuator that does not close a
 * group, or after `return`.
 *
 * @param source The module's source.
 * @returns The source with those spans replaced by spaces, the same length.
 */
const codeOf = (source: string): string => {
  const code: string[] = [];
  // The open braces, and the template substitutions, innermost last.
  const groups: ("brace" | "substitution")[] = [];
  // The code before the index, its whitespace runs as one space, at most its last 8 characters.
  let tail = "";
  let index = 0;

  const blank = (length: number, value: boolean): void => {
    code.push(" ".repeat(length));
    index += length;
    tail = value ? `${tail}a`.slice(-8) : tail;
  };

  const template = (): void => {
    const length = lengthAt(templateAt, source, index);

    if (source.startsWith("${", index + length - 2)) {
      groups.push("substitution");
    }

    blank(length, true);
  };

  const regexMayStart = (): boolean => {
    const previous = tail.trimEnd();

    return (
      previous === "" ||
      /[(,=:[!&|?{;+\-*%<>~^]$/u.test(previous) ||
      /(?:^|[^\p{ID_Continue}$])return$/u.test(previous)
    );
  };

  while (index < source.length) {
    const character = source.charAt(index);
    const span =
      character === "/"
        ? lengthAt(commentAt, source, index) ||
          (regexMayStart() ? lengthAt(regexAt, source, index) : 0)
        : 0;
    const quoted = character === '"' || character === "'" ? lengthAt(quotedAt, source, index) : 0;

    if (span > 0) {
      blank(span, source.charAt(index + 1) !== "/" && source.charAt(index + 1) !== "*");
    } else if (quoted > 0) {
      blank(quoted, true);
    } else if (character === "`") {
      blank(1, false);
      template();
    } else if (character === "}" && groups.at(-1) === "substitution") {
      groups.pop();
      blank(1, false);
      template();
    } else {
      if (character === "{") {
        groups.push("brace");
      } else if (character === "}") {
        groups.pop();
      }

      code.push(character);
      index += 1;
      tail = /\s/u.test(character)
        ? `${tail.trimEnd()} `.slice(-8)
        : `${tail}${character}`.slice(-8);
    }
  }

  return code.join("");
};

/**
 * What {@link mathMembers} gives for a reach into `Math` whose member the code does not name: a
 * computed member, a computed, quoted or rest key of a destructuring, or `Math` read as a value
 * (an alias, or an argument such as `Reflect.get`'s), which can reach every member.
 */
const unnamedMember = "[unnamed]";

/**
 * Split a list's code at its top-level commas, so a default's call or a nested pattern stays one
 * entry.
 *
 * @param list The code between a list's brackets.
 * @returns Each entry, as written.
 */
const topLevelEntries = (list: string): readonly string[] => {
  const entries: string[] = [];
  let depth = 0;
  let entry = "";

  for (const character of list) {
    if (character === "," && depth === 0) {
      entries.push(entry);
      entry = "";
    } else {
      if ("{[(".includes(character)) {
        depth += 1;
      } else if ("}])".includes(character)) {
        depth -= 1;
      }

      entry += character;
    }
  }

  return [...entries, entry];
};

/**
 * The index of the `{` that a `}` closes.
 *
 * @param code The code.
 * @param close The index of the `}`.
 * @returns The index of its `{`, or -1 when none opens it.
 */
const openingBrace = (code: string, close: number): number => {
  let depth = 0;

  for (let index = close; index >= 0; index -= 1) {
    if (code.charAt(index) === "}") {
      depth += 1;
    } else if (code.charAt(index) === "{") {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
};

/**
 * The keys an object destructuring pattern takes, {@link unnamedMember} for each it does not name.
 *
 * @param pattern The pattern's code between its braces.
 * @returns Each key, in order.
 */
const patternKeys = (pattern: string): readonly string[] =>
  topLevelEntries(pattern)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "")
    .map(
      (entry) =>
        /^(?<key>[\p{ID_Start}$_][\p{ID_Continue}$]*)\s*(?::|=|$)/u.exec(entry)?.groups?.["key"] ??
        unnamedMember,
    );

/**
 * The `Math` members a module's code reaches: through `Math.` or `Math?.`, or by the keys of a
 * destructuring of `Math`; every other reach gives {@link unnamedMember}. `Math` is the identifier
 * alone, so `Mathematics` is not a reach, and `globalThis.Math.sin` is.
 *
 * @param code The module's code, as {@link codeOf} leaves it.
 * @returns Each member reached, in order.
 */
const mathMembers = (code: string): readonly string[] =>
  [
    ...code.matchAll(
      /(?<![\p{ID_Continue}$])Math(?![\p{ID_Continue}$])(?:\s*\??\.\s*(?<member>[\p{ID_Start}$_][\p{ID_Continue}$]*))?/gu,
    ),
  ].flatMap((match) => {
    const member = match.groups?.["member"];

    if (member !== undefined) {
      return [member];
    }

    const destructured = /\}\s*=\s*$/u.exec(code.slice(0, match.index));
    const open = destructured === null ? -1 : openingBrace(code, destructured.index);

    return destructured === null || open === -1
      ? [unnamedMember]
      : patternKeys(code.slice(open + 1, destructured.index));
  });

/**
 * A `bigint` literal at the end of the code before an operator: decimal, hexadecimal, octal or
 * binary, its separators included.
 */
const bigintLiteralBefore =
  /(?<![\p{ID_Continue}$.])(?:0[xX][\da-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*)n\s*$/u;

/**
 * The lines of a module's code that hold `**` (or `**=`) on anything but a `bigint` literal.
 * ECMA-262 leaves `**` on numbers implementation-approximated, as it leaves `Math.pow`; a `bigint`
 * power is exact, and only a literal left operand shows by its spelling that it is one.
 *
 * @param code The module's code, as {@link codeOf} leaves it.
 * @returns The line of each such `**`, counted from 1, in order.
 */
const numberPowers = (code: string): readonly number[] =>
  [...code.matchAll(/\*\*/gu)]
    .map((match) => code.slice(0, match.index))
    .filter((before) => !bigintLiteralBefore.test(before))
    .map((before) => before.split("\n").length);

/**
 * The number of significant digits of a decimal literal: its digits before the exponent, without
 * separators, leading zeros or trailing zeros.
 *
 * @param literal The literal.
 * @returns Its significant digits.
 */
const significantDigits = (literal: string): number => {
  const [mantissa = ""] = literal.replaceAll("_", "").split(/[eE]/u);

  return mantissa.replace(".", "").replace(/^0+/u, "").replace(/0+$/u, "").length;
};

/**
 * The decimal literals of a module's code: hexadecimal, octal, binary and `bigint` literals aside.
 *
 * @param code The module's code, as {@link codeOf} leaves it.
 * @returns Each decimal literal, as written.
 */
const decimalLiterals = (code: string): readonly string[] =>
  [
    ...code.matchAll(
      /(?<![\p{ID_Continue}$.])(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?(?![\p{ID_Continue}$])/gu,
    ),
  ].map(([literal]) => literal);

/**
 * The package's sources, by path under the package, each as its code alone.
 */
const engineCode: ReadonlyMap<string, string> = new Map(
  [...sourceModules()]
    .filter(([path]) => path.startsWith("src/engine/") && path.endsWith(".ts"))
    .map(([path, source]) => [path, codeOf(source)]),
);

/**
 * The code of one engine module.
 *
 * @param path Its path under the package.
 * @returns Its code, or the empty string when there is no such module.
 */
const codeAt = (path: string): string => engineCode.get(path) ?? "";

/**
 * What the source guard refuses in a module's code: each approximated `Math` member it reaches and
 * each reach whose member it does not name, then each `**` whose left operand is not a `bigint`
 * literal, by line.
 *
 * @param code The module's code, as {@link codeOf} leaves it.
 * @returns Each refusal, in order.
 */
const refusedIn = (code: string): readonly string[] => [
  ...mathMembers(code)
    .filter((member) => member === unnamedMember || approximated.has(member))
    .map((member) => `Math.${member}`),
  ...numberPowers(code).map((line) => `** at line ${String(line)}`),
];

/**
 * Sources the source guard refuses, by the rule each seeds, with what it refuses in each: the
 * reaches into `Math` other than `Math.` and `Math[`, and `**` on a number.
 */
const refusedSources: readonly (readonly [string, string, readonly string[]])[] = [
  ["** on a number literal", "const half = 2 ** -1;", ["** at line 1"]],
  [
    "** on a bigint that is not a literal",
    "const square = (base: bigint): bigint => base ** 2n;",
    ["** at line 1"],
  ],
  ["**= on a number", "let scale = 1;\nscale **= 2;", ["** at line 2"]],
  ["destructuring", "const { abs, sin, cos: cosine } = Math;", ["Math.sin", "Math.cos"]],
  ["destructuring with a rest element", "const { abs, ...rest } = Math;", ["Math.[unnamed]"]],
  ["an alias", "const M = Math;\nconst y = M.sin(x);", ["Math.[unnamed]"]],
  ["optional chaining", "const y = Math?.sin(x);", ["Math.sin"]],
  ["optional chaining to a computed member", 'const y = Math?.["sin"](x);', ["Math.[unnamed]"]],
  ["Reflect.get", 'const sine = Reflect.get(Math, "sin");', ["Math.[unnamed]"]],
];

/**
 * Sources the source guard admits, one beside each rule {@link refusedSources} seeds.
 */
const admittedSources: readonly (readonly [string, string])[] = [
  [
    "** on a bigint literal",
    "const top = 2n ** 494n;\nconst ten = 10n ** e;\nconst word = 0x1_0000n ** 2n;\nconst shifted = numerator * 2n ** (shift - 1n);",
  ],
  ["destructuring of exact members", "const { abs, floor } = Math;"],
  ["an identifier that starts with Math", "const M = Mathematics;\nconst y = M.sin(x);"],
  ["optional chaining to an exact member", "const y = Math?.abs(x);"],
  ["Reflect.get on another object", 'const sine = Reflect.get(table, "sin");'],
];

describe("math: the source guard", () => {
  it("finds code, not comments, strings or regular expressions", () => {
    const code = codeOf(
      `const a = Math.sin; // Math.cos\n/* Math.tan */ const b = 'Math.exp';\nconst c = /Math.log/u;\nconst d = \`Math.pow \${Math.cosh(x)}\`;\nconst e = a / Math.atan(b) / 2;`,
    );

    assert.deepStrictEqual(mathMembers(code), ["sin", "cosh", "atan"]);
  });

  it("counts a literal's significant digits", () => {
    assert.deepStrictEqual(
      ["0.6366197723675814", "1e300", "16_777_216", "0.000_012_5", "100.0e-3"].map(
        significantDigits,
      ),
      [16, 1, 8, 3, 1],
    );
  });

  for (const [rule, source, refusals] of refusedSources) {
    it(`refuses ${rule}`, () => {
      assert.deepStrictEqual(refusedIn(codeOf(source)), refusals);
    });
  }

  for (const [rule, source] of admittedSources) {
    it(`admits ${rule}`, () => {
      assert.deepStrictEqual(refusedIn(codeOf(source)), []);
    });
  }

  it("no non-test engine file reaches an approximated Math member or holds ** on a number", () => {
    const refused = [...engineCode]
      .filter(([path]) => !path.endsWith(".test.ts"))
      .flatMap(([path, code]) => refusedIn(code).map((refusal) => `${path}: ${refusal}`));

    assert.isAbove(engineCode.size, 10);
    assert.deepStrictEqual(refused, []);
  });

  it("math.ts names no Math member outside the exact ones", () => {
    assert.deepStrictEqual(
      mathMembers(codeAt("src/engine/math.ts")).filter((member) => !exactMembers.has(member)),
      [],
    );
  });

  it("math.ts and expressions/shapes.ts hold no **", () => {
    for (const path of ["src/engine/math.ts", "src/engine/expressions/shapes.ts"]) {
      assert.include(codeAt(path), "=>", path);
      assert.notInclude(codeAt(path), "**", path);
    }
  });

  it("math.ts holds no decimal literal of more than 17 significant digits", () => {
    const literals = decimalLiterals(codeAt("src/engine/math.ts"));

    assert.isAbove(literals.length, 100);
    assert.deepStrictEqual(
      literals.filter((literal) => significantDigits(literal) > 17),
      [],
    );
  });
});
