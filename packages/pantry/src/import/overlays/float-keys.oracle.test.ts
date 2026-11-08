/**
 * Which two keys of a float mapping repeat (spec readings 98, 144 and 154), three ways alike: the
 * import's rows (`rowsOf` of `#pantry/import/overlays/mapping.ts`), the law oracle's `Map key`
 * (`documentBreaches` of `#pantry/test/oracle.ts`), and an exact reference written here from the
 * specifications alone.
 *
 * - **The reference** reads a key in XML Schema 1.0's `xs:double` lexical space (Part 2 §3.2.5.1,
 *   reading 71's edition, `+INF` outside it) by a scan of its own, and maps it as XML Schema 1.1's
 *   doubleLexicalMap does (Part 2 §3.3.5.2, reading 144): the decimal's exact value in `BigInt`
 *   rationals, rounded once to binary64, ties to even, an infinity of its sign at or past the
 *   overflow threshold, a zero of its sign at or below half the least subnormal. Two keys repeat
 *   where they are equal or identical (Part 1 §3.11.4): -0 equals 0, and NaN is identical to itself
 *   (Part 2 §3.3.5.1). Where a key has at most 20 significant digits the reference is held to
 *   ECMAScript's `Number`, which ECMA-262 rounds exactly there (RoundMVResult).
 * - **The import** writes every key's typed `MapKeyFloat` row, and tests no key's form: `FloatKey`'s
 *   pattern law refuses a row outside the lexical space, and PostgreSQL generates each other row's
 *   value by grizzle's `Compute.parseDouble`, which grizzle proves and tests, so a row's value is
 *   read here as the reference reads its key, none outside the space, and two keys repeat for the
 *   import where they are one text (`key(mapping, key)`) or both have a row of one value
 *   (`key(mapping, value)`).
 * - **The oracle** names `Map key` where the second key repeats the first.
 *
 * The search draws keys at the edges of grizzle's former bounded form of `double precision` (15
 * significant digits, an exponent of at most 293, zero runs of 255) and past them: 16 to 400
 * digits, exponents from 294 to 400 and far beyond, overflow and underflow, -0 against 0, and each
 * special spelling. Two plants restate the deleted fallback, under which a key outside the bounded
 * form had no typed value and was distinct by its text alone: in the import, a typed row only for
 * a key of that form, and in the oracle, a lexical value for any other key. A third restates the
 * deleted gate, a typed row only for a key in the lexical space, which the database's laws judge
 * now. The search must catch each.
 */
import { lexicalForm, pg } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { boolean, element, int, map, string, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf } from "#pantry/import/overlays/mapping.ts";
import type { MappingIds } from "#pantry/import/overlays/mapping.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";

/**
 * A decimal numeral's exact value: its sign, its significant digits with no leading or trailing
 * zero (empty for zero), and the power of ten they are scaled by.
 */
interface Numeral {
  readonly digits: string;
  readonly exponent: bigint;
  readonly negative: boolean;
}

/**
 * An `xs:double` lexical form as the reference reads it: a numeral, or a special value.
 */
type Literal =
  | { readonly _tag: "numeral"; readonly numeral: Numeral }
  | { readonly _tag: "special"; readonly value: "-INF" | "INF" | "NaN" };

/**
 * Decide whether a character is a decimal digit, `#x30` to `#x39`.
 *
 * @param character - The character, none past the text's end.
 * @returns Whether it is one.
 */
const isDigit = (character: string | undefined): boolean =>
  character !== undefined && character >= "0" && character <= "9";

/**
 * Find where a run of digits that starts at an index ends.
 *
 * @param text - The text.
 * @param from - The index the run starts at.
 * @returns The index past its last digit.
 */
const digitsEnd = (text: string, from: number): number => {
  let end = from;
  while (isDigit(text[end])) {
    end += 1;
  }

  return end;
};

/**
 * Read an exponent: an optional sign and at least one digit (XML Schema 1.0 Part 2 §3.2.5.1: "The
 * exponent must be an integer").
 *
 * @param text - The text.
 * @param from - The index past the `E` or `e`.
 * @returns The exponent and the index past it, none where no integer starts there.
 */
const exponentOf = (
  text: string,
  from: number,
): Option.Option<{ readonly end: number; readonly value: bigint }> => {
  const negative = text[from] === "-";
  const start = text[from] === "-" || text[from] === "+" ? from + 1 : from;
  const end = digitsEnd(text, start);

  return end === start
    ? Option.none()
    : Option.some({ end, value: (negative ? -1n : 1n) * BigInt(text.slice(start, end)) });
};

/**
 * Read a text as an `xs:double` lexical form of XML Schema 1.0 Part 2 §3.2.5.1: a mantissa that is
 * a decimal (an optional sign, digits with an optional point, at least one digit), optionally `E`
 * or `e` and an integer exponent, or `INF`, `-INF` or `NaN`.
 *
 * @param text - The text, as written.
 * @returns The literal, none for a text outside the lexical space.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 */
const literalOf = (text: string): Option.Option<Literal> => {
  if (text === "INF" || text === "-INF" || text === "NaN") {
    return Option.some({ _tag: "special", value: text });
  }

  const negative = text.startsWith("-");
  const start = negative || text.startsWith("+") ? 1 : 0;
  const wholeEnd = digitsEnd(text, start);
  const fractionStart = text[wholeEnd] === "." ? wholeEnd + 1 : wholeEnd;
  const fractionEnd = digitsEnd(text, fractionStart);
  if (wholeEnd - start + fractionEnd - fractionStart === 0) {
    return Option.none();
  }

  const scaled =
    text[fractionEnd] === "e" || text[fractionEnd] === "E"
      ? exponentOf(text, fractionEnd + 1)
      : Option.some({ end: fractionEnd, value: 0n });

  return scaled.pipe(
    Option.filter(({ end }) => end === text.length),
    Option.map(({ value }): Literal => {
      const written = `${text.slice(start, wholeEnd)}${text.slice(fractionStart, fractionEnd)}`;
      const lead = written.replace(/^0+/u, "");
      const digits = lead.replace(/0+$/u, "");
      const exponent =
        value - BigInt(fractionEnd - fractionStart) + BigInt(lead.length - digits.length);

      return {
        _tag: "numeral",
        numeral: { digits, exponent: digits === "" ? 0n : exponent, negative },
      };
    }),
  );
};

/**
 * The bits of a positive whole number.
 *
 * @param value - The number, above 0.
 * @returns Its bit length.
 */
const bitLength = (value: bigint): bigint => BigInt(value.toString(2).length);

/**
 * Write a finite nonzero double as the reference names it, its sign, its odd significand in hex and
 * its power of two, so two doubles are one name exactly when they are one value.
 *
 * @param negative - Its sign.
 * @param significand - A significand above 0.
 * @param power - The power of two it is scaled by.
 * @returns The name.
 */
const finiteName = (negative: boolean, significand: bigint, power: bigint): string => {
  let odd = significand;
  let at = power;
  while (odd % 2n === 0n) {
    odd /= 2n;
    at += 1n;
  }

  return `${negative ? "-" : "+"}0x${odd.toString(16)}p${String(at)}`;
};

/**
 * Round a numeral to binary64 as XML Schema 1.1's floatingPointRound(nV, 53, -1074, 971) does,
 * exactly, over `BigInt` rationals: the nearest of the significands below 2^53 scaled by a power of
 * two from -1074 to 971, ties to the even significand, an infinity past the greatest, and a zero
 * where the nearest is zero, then named as equality compares doubles: every zero one name.
 *
 * @param numeral - The numeral.
 * @returns The double's name: `0`, `+INF`, `-INF`, or {@link finiteName}'s.
 * @see {@link https://www.w3.org/TR/xmlschema11-2/#f-floatingPointRound | XML Schema 1.1 Part 2, floatingPointRound}
 */
const roundedName = ({ digits, exponent, negative }: Numeral): string => {
  const infinity = negative ? "-INF" : "+INF";
  const magnitude = BigInt(digits.length) + exponent;
  // A numeral of `digits.length` digits scaled by 10^exponent lies in
  // [10^(magnitude - 1), 10^magnitude): past 10^309 it overflows, below 10^-325 it is under half the
  // least subnormal, 2^-1075 (about 2.47e-324), and so rounds to zero.
  if (digits === "" || magnitude < -325n) {
    return "0";
  }

  if (magnitude > 310n) {
    return infinity;
  }

  const numerator = BigInt(digits) * 10n ** (exponent > 0n ? exponent : 0n);
  const denominator = 10n ** (exponent < 0n ? -exponent : 0n);
  // The power p with 2^52 <= value / 2^p < 2^53, raised to -1074 for a subnormal.
  let power = bitLength(numerator) - bitLength(denominator) - 53n;
  const scaledBelow = (bound: bigint, at: bigint): boolean =>
    at >= 0n
      ? numerator < bound * denominator * 2n ** at
      : numerator * 2n ** -at < bound * denominator;
  while (!scaledBelow(2n ** 53n, power)) {
    power += 1n;
  }

  while (scaledBelow(2n ** 52n, power)) {
    power -= 1n;
  }

  power = power < -1074n ? -1074n : power;
  const [dividend, divisor] =
    power >= 0n ? [numerator, denominator * 2n ** power] : [numerator * 2n ** -power, denominator];
  const quotient = dividend / divisor;
  const twice = 2n * (dividend % divisor);
  const significand =
    twice > divisor || (twice === divisor && quotient % 2n === 1n) ? quotient + 1n : quotient;
  if (significand === 0n) {
    return "0";
  }

  return bitLength(significand) + power > 1024n
    ? infinity
    : finiteName(negative, significand, power);
};

/**
 * Name the double a text maps to under the reference: XML Schema 1.1's doubleLexicalMap over XML
 * Schema 1.0's lexical space.
 *
 * @param text - The key, as written.
 * @returns The double's name, `NaN` for NaN; none for a text outside the lexical space.
 */
const referenceOf = (text: string): Option.Option<string> =>
  Option.map(literalOf(text), (literal) => {
    if (literal._tag === "numeral") {
      return roundedName(literal.numeral);
    }

    return literal.value === "INF" ? "+INF" : literal.value;
  });

/**
 * Name a JavaScript number as {@link roundedName} names a double, from its IEEE 754 bits.
 *
 * @param value - The number.
 * @returns Its name.
 */
const numberName = (value: number): string => {
  if (Number.isNaN(value)) {
    return "NaN";
  }

  if (value === 0) {
    return "0";
  }

  if (!Number.isFinite(value)) {
    return value > 0 ? "+INF" : "-INF";
  }

  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);

  const bits = view.getBigUint64(0);
  const field = (bits / 2n ** 52n) % 2n ** 11n;
  const fraction = bits % 2n ** 52n;

  return field === 0n
    ? finiteName(value < 0, fraction, -1074n)
    : finiteName(value < 0, fraction + 2n ** 52n, field - 1075n);
};

/**
 * Grizzle's former bounded form of `double precision` (`lexicalForm`, its zero runs unbounded):
 * the plants' test of a key that had a typed value under the deleted fallback.
 */
const boundedForm = new RegExp(lexicalForm(pg["double precision"]), "u");

/**
 * The law oracle's laws over the composed grammar, built once.
 */
const oracleLaws = lawsOf(grammar);

/**
 * The ids every case writes its rows under, each node's by its number, in the context of a
 * document no site names.
 */
const ids: MappingIds = { context: ownContext(idOf(0)), idOf };

/**
 * Write an item whose one multiple float response maps two keys.
 *
 * @param keys - The two keys, each written as an attribute's value.
 * @returns The item's text.
 */
const itemOf = (keys: readonly [string, string]): string =>
  [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false">',
    '<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="float">',
    '<qti-mapping default-value="0">',
    ...keys.map((key) => `<qti-map-entry map-key="${key}" mapped-value="1"/>`),
    "</qti-mapping>",
    "</qti-response-declaration>",
    "</qti-assessment-item>",
  ].join("");

/**
 * One case: two keys of one float mapping, and the adversarial pair it was drawn as, if any.
 */
interface KeyPair {
  readonly keys: readonly [string, string];
  readonly name: Option.Option<AdversarialName>;
}

/**
 * The adversarial pairs, each drawn by name: the edges of the former bounded form and of binary64.
 */
const adversarial = [
  { keys: ["1e400", "2e400"], name: "two overflows" },
  { keys: ["INF", "1e400"], name: "an overflow and INF" },
  { keys: ["-1e309", "-INF"], name: "a negative overflow and -INF" },
  { keys: ["0", "-0"], name: "zero and negative zero" },
  { keys: ["0", "1e-400"], name: "zero and an underflow" },
  { keys: ["-0", "-1e-400"], name: "negative zero and a negative underflow" },
  { keys: ["1.2345678901234567", "1.23456789012345671"], name: "17 digits rounding together" },
  { keys: ["1e294", "10e293"], name: "an exponent of 294" },
  { keys: ["100000000000000e293", "1e+307"], name: "a 15-digit mantissa at 293" },
  { keys: ["9007199254740993", "9007199254740992"], name: "a tie to even" },
  { keys: ["2.4703282292062327e-324", "0"], name: "below half the least subnormal" },
  { keys: ["2.4703282292062328e-324", "4.9e-324"], name: "past half the least subnormal" },
  {
    keys: ["1.7976931348623157e308", "1.7976931348623158e308"],
    name: "below the overflow threshold",
  },
  { keys: ["1.7976931348623159e308", "INF"], name: "past the overflow threshold" },
  { keys: [`1${"0".repeat(300)}`, "1e300"], name: "a zero run past 255" },
  { keys: [`1e${"0".repeat(300)}1`, "10"], name: "an exponent's zero run past 255" },
  { keys: ["NaN", "NaN"], name: "two NaNs" },
  { keys: ["+INF", "INF"], name: "XML Schema 1.1's +INF" },
  { keys: ["1", "1.0000000000000002"], name: "one ulp apart" },
] as const satisfies readonly { readonly keys: readonly [string, string]; readonly name: string }[];

/**
 * An adversarial pair's name.
 */
type AdversarialName = (typeof adversarial)[number]["name"];

/**
 * The significands the values draw from: binary64's named constants as decimals, the tie at 2^53,
 * the old bound's 15 digits and one past it, and a fives' run that sits on a midpoint once scaled.
 */
const namedSignificands = [
  "1",
  "5",
  "9",
  "123456789012345",
  "1234567890123456",
  "12345678901234567",
  "17976931348623157",
  "17976931348623158",
  "17976931348623159",
  "22250738585072014",
  "49406564584124654",
  "24703282292062327",
  "24703282292062328",
  "9007199254740993",
  "9007199254740995",
] as const;

/**
 * The magnitudes a value's leading digit is drawn at, as a power of ten: past either threshold,
 * at each edge of binary64 and of the former form's exponent bound, and plain ones.
 */
const edgeMagnitudes = [
  -400n,
  -340n,
  -325n,
  -324n,
  -323n,
  -308n,
  -307n,
  -294n,
  -293n,
  -1n,
  0n,
  1n,
  15n,
  16n,
  293n,
  294n,
  307n,
  308n,
  309n,
  400n,
] as const;

/**
 * A magnitude: an edge, any power from 10^-400 to 10^400, or one far past every threshold.
 */
const magnitudes: Gen<bigint> = weighted([
  [6, element(edgeMagnitudes)],
  [3, map(int(-400, 400), BigInt)],
  [1, element([-(10n ** 20n), 10n ** 20n] as const)],
]);

/**
 * A run of significant digits: a named significand, or a nonzero digit and up to 399 more.
 */
const significands: Gen<string> = weighted([
  [2, element(namedSignificands)],
  [
    3,
    (source) => {
      const length = source.draw(element([0, 1, 14, 15, 16, 19, 20, 40, 399] as const));

      return `${source.draw(element(["1", "2", "5", "9"] as const))}${source.draw(
        string(element(["0", "1", "4", "5", "9"] as const), { max: length, min: length }),
      )}`;
    },
  ],
]);

/**
 * A numeral at an edge: its significand, the power of ten its leading digit sits at, and its sign;
 * zero one time in ten.
 */
const numerals: Gen<Numeral> = weighted([
  [
    9,
    (source) => {
      const digits = source.draw(significands).replace(/0+$/u, "");

      return {
        digits,
        exponent: source.draw(magnitudes) - BigInt(digits.length - 1),
        negative: source.draw(boolean),
      };
    },
  ],
  [1, (source) => ({ digits: "", exponent: 0n, negative: source.draw(boolean) })],
]);

/**
 * How a numeral is written: a `+` on a nonnegative one, zeros before it and after its digits, the
 * digits after the point, a bare point or none before a fraction, and its exponent's letter, sign
 * and zeros.
 */
interface Spelling {
  readonly bare: boolean;
  readonly expPlus: boolean;
  readonly expZeros: number;
  readonly fraction: number;
  readonly lead: number;
  readonly letter: "E" | "e" | "none";
  readonly plus: boolean;
  readonly point: boolean;
  readonly trail: number;
}

/**
 * The spellings, each run of zeros up to one past the former form's bound of 255.
 */
const spellings: Gen<Spelling> = (source) => ({
  bare: source.draw(boolean),
  expPlus: source.draw(boolean),
  expZeros: source.draw(element([0, 0, 1, 256] as const)),
  fraction: source.draw(element([0, 0, 1, 3, 17, 30] as const)),
  lead: source.draw(element([0, 0, 1, 256] as const)),
  letter: source.draw(element(["e", "E", "none"] as const)),
  plus: source.draw(boolean),
  point: source.draw(boolean),
  trail: source.draw(element([0, 0, 1, 256] as const)),
});

/**
 * Write a numeral in a spelling: a key of its value in `xs:double`'s lexical space.
 *
 * @param numeral - The numeral.
 * @param spelling - How it is written.
 * @returns The key.
 */
const spell = ({ digits, exponent, negative }: Numeral, spelling: Spelling): string => {
  const mantissa = `${digits === "" ? "0" : digits}${"0".repeat(spelling.trail)}`;
  const padded = `${"0".repeat(spelling.lead)}${mantissa.padStart(spelling.fraction + 1, "0")}`;
  const whole = padded.slice(0, padded.length - spelling.fraction);
  const fraction = padded.slice(padded.length - spelling.fraction);
  const written = exponent - BigInt(spelling.trail) + BigInt(spelling.fraction);
  const point = spelling.point ? `${whole}.` : whole;
  const bareWhole = spelling.bare && /^0+$/u.test(whole) ? "" : whole;
  const shown = spelling.fraction === 0 ? point : `${bareWhole}.${fraction}`;
  const letter = spelling.letter === "none" ? "e" : spelling.letter;
  const plus = spelling.expPlus ? "+" : "";
  const sign = written < 0n ? "-" : plus;
  const power = `${"0".repeat(spelling.expZeros)}${String(written < 0n ? -written : written)}`;
  const scale = written === 0n && spelling.letter === "none" ? "" : `${letter}${sign}${power}`;
  const lead = spelling.plus ? "+" : "";

  return `${negative ? "-" : lead}${shown}${scale}`;
};

/**
 * A numeral's neighbour: its digits with a suffix far past the 17th, which may round with it or
 * not, at the same magnitude.
 *
 * @param numeral - The numeral.
 * @param suffix - The digits appended.
 * @returns The neighbour.
 */
const neighbourOf = (numeral: Numeral, suffix: string): Numeral =>
  numeral.digits === ""
    ? { ...numeral, digits: suffix.replace(/^0+/u, "") }
    : {
        ...numeral,
        digits: `${numeral.digits}${suffix}`,
        exponent: numeral.exponent - BigInt(suffix.length),
      };

/**
 * The cases: a numeral spelled twice, a numeral and its neighbour, two numerals at the edges, a
 * special beside a numeral, and the adversarial pairs by name.
 */
const pairs: Gen<KeyPair> = weighted<KeyPair>([
  [
    3,
    (source) => {
      const numeral = source.draw(numerals);

      return {
        keys: [spell(numeral, source.draw(spellings)), spell(numeral, source.draw(spellings))],
        name: Option.none(),
      };
    },
  ],
  [
    2,
    (source) => {
      const numeral = source.draw(numerals);
      const suffix = source.draw(
        element(["1", "01", "5", "50000000000000000001", "49999999999999999999"] as const),
      );

      return {
        keys: [
          spell(numeral, source.draw(spellings)),
          spell(neighbourOf(numeral, suffix), source.draw(spellings)),
        ],
        name: Option.none(),
      };
    },
  ],
  [
    2,
    (source) => ({
      keys: [
        spell(source.draw(numerals), source.draw(spellings)),
        spell(source.draw(numerals), source.draw(spellings)),
      ],
      name: Option.none(),
    }),
  ],
  [
    1,
    (source) => ({
      keys: [
        source.draw(element(["INF", "-INF", "NaN", "+INF"] as const)),
        spell(source.draw(numerals), source.draw(spellings)),
      ],
      name: Option.none(),
    }),
  ],
  [
    2,
    (source) => {
      const { keys, name } = source.draw(element(adversarial));

      return { keys, name: Option.some(name) };
    },
  ],
]);

/**
 * A situation the search must reach: each verdict, each edge a key sits past, and each plant
 * caught.
 */
type Situation =
  | "caught: the import's bounded form"
  | "caught: the import's lexical gate"
  | "caught: the oracle's bounded form"
  | "distinct"
  | "exponent past 293"
  | "negative zero"
  | "outside the lexical space"
  | "overflow"
  | "past 20 digits"
  | "past 15 digits"
  | "repeat"
  | "rounds together"
  | "underflow"
  | "zero run past 255";

/**
 * Name the edges a key sits past.
 *
 * @param key - The key.
 * @returns Its situations.
 */
const edgesOf = (key: string): readonly Situation[] =>
  Option.match(literalOf(key), {
    onNone: () => ["outside the lexical space"],
    onSome: (literal): readonly Situation[] => {
      if (literal._tag === "special") {
        return [];
      }

      const { digits, negative } = literal.numeral;
      const named = roundedName(literal.numeral);
      const written = Option.fromNullishOr(
        /[eE][+-]?(?<power>[0-9]+)$/u.exec(key)?.groups?.["power"],
      );
      const situations: readonly (readonly [Situation, boolean])[] = [
        ["past 15 digits", digits.length > 15],
        ["past 20 digits", digits.length > 20],
        ["exponent past 293", Option.exists(written, (power) => BigInt(power) > 293n)],
        ["zero run past 255", /0{256}/u.test(key)],
        ["overflow", named.endsWith("INF")],
        ["underflow", digits !== "" && named === "0"],
        ["negative zero", negative && named === "0"],
      ];

      return situations.flatMap(([situation, holds]) => (holds ? [situation] : []));
    },
  });

/**
 * Decide whether two keys name one double under the reference: both are in the lexical space, and
 * their doubles have one name.
 *
 * @param name - The first key's double, none outside the lexical space.
 * @param other - The second's.
 * @returns Whether they are one value.
 */
const valued = (name: Option.Option<string>, other: Option.Option<string>): boolean =>
  Option.isSome(name) && Option.isSome(other) && name.value === other.value;

/**
 * Judge a case: the import, the oracle and the reference agree on whether the two keys repeat, the
 * import writes every key's typed row, the reference agrees with `Number` where ECMA-262 rounds
 * exactly, and each plant that disagrees is caught.
 *
 * @param pair - The case.
 * @param note - Where to note its situations.
 * @returns The effect that judges it.
 */
const judged = ({ keys }: KeyPair, note: (situation: Situation) => void) =>
  Effect.gen(function* judgedPair() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(itemOf(keys))));
    const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
    const folded = yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
    const rows = rowsOf(tree, ids);
    const [first, second] = keys;
    const [firstName, secondName] = [referenceOf(first), referenceOf(second)];
    const expected = first === second || valued(firstName, secondName);

    const entries = [...rows.MapKey.values()];
    assert.deepStrictEqual(
      entries.map(({ key }) => key),
      [first, second],
    );
    assert.deepStrictEqual(
      entries.map(({ key, node }) => rows.MapKeyFloat.get(node)?.key === key),
      [true, true],
      "a typed row for every key, in the lexical space or not",
    );

    const repeatsWhere = (typed: (at: 0 | 1) => boolean): boolean =>
      first === second || (typed(0) && typed(1) && valued(firstName, secondName));
    const imported = repeatsWhere((at) =>
      Option.exists(Option.fromNullishOr(entries[at]), ({ node }) => rows.MapKeyFloat.has(node)),
    );
    const judgedByOracle = documentBreaches("item.xml", folded, oracleLaws).some(
      ({ law }) => law === "Map key",
    );

    assert.strictEqual(imported, expected, `the import on ${Formatter.format(keys)}`);
    assert.strictEqual(judgedByOracle, expected, `the oracle on ${Formatter.format(keys)}`);
    for (const [key, name] of [
      [first, firstName],
      [second, secondName],
    ] as const) {
      for (const literal of Option.toArray(literalOf(key))) {
        if (literal._tag === "special" || literal.numeral.digits.length <= 20) {
          assert.strictEqual(
            Option.getOrUndefined(name),
            numberName(Number(key.replace("INF", "Infinity"))),
            `the reference against ECMAScript's Number on ${key.slice(0, 40)}`,
          );
        }
      }
    }

    note(expected ? "repeat" : "distinct");
    if (expected && first !== second) {
      const decimals = keys.map((key) =>
        Option.match(literalOf(key), {
          onNone: () => key,
          onSome: (literal) =>
            literal._tag === "special"
              ? literal.value
              : `${literal.numeral.negative && literal.numeral.digits !== "" ? "-" : ""}${literal.numeral.digits}e${String(literal.numeral.exponent)}`,
        }),
      );
      if (decimals[0] !== decimals[1]) {
        note("rounds together");
      }
    }

    for (const situation of keys.flatMap(edgesOf)) {
      note(situation);
    }

    if (keys.some((key) => Option.isNone(referenceOf(key)))) {
      note("caught: the import's lexical gate");
    }

    const plantedImport = repeatsWhere(
      (at) => boundedForm.test(keys[at]) && Option.isSome(referenceOf(keys[at])),
    );
    if (plantedImport !== expected) {
      note("caught: the import's bounded form");
    }

    const plantedValue = (key: string): string =>
      boundedForm.test(key) && Option.isSome(referenceOf(key))
        ? `typed ${String(Number(key.replace("INF", "Infinity")))}`
        : `lexical ${key}`;
    if ((plantedValue(first) === plantedValue(second)) !== expected) {
      note("caught: the oracle's bounded form");
    }
  });

/**
 * Every situation the search requires, and every adversarial pair by name.
 */
const situations: readonly [Situation | AdversarialName, ...(Situation | AdversarialName)[]] = [
  "repeat",
  "distinct",
  "rounds together",
  "past 15 digits",
  "past 20 digits",
  "exponent past 293",
  "zero run past 255",
  "overflow",
  "underflow",
  "negative zero",
  "outside the lexical space",
  "caught: the import's bounded form",
  "caught: the import's lexical gate",
  "caught: the oracle's bounded form",
  ...adversarial.map(({ name }) => name),
];

describe("import/overlays/mapping.ts and the law oracle, float map keys", () => {
  it.effect(
    "repeat two float keys exactly where the doubles XML Schema 1.1 maps them to are equal or identical, past grizzle's former bounded form, and catch each plant of the lexical fallback",
    (ctx) =>
      // Oracle: the specification as a checker, the exact reference above (XML Schema 1.0's
      // lexical space, 1.1's doubleLexicalMap over BigInt rationals, Part 1 §3.11.4's equal or
      // identical), itself held to ECMAScript's Number up to 20 significant digits.
      // Bound: 2,000 cases, a fifth the 19 adversarial pairs by name, the rest pairs of keys spelled
      // from numerals at the edges: 1 to 400 significant digits, magnitudes from 10^-400 to
      // 10^400 and 10^±1e20, zero runs of 0, 1 and 256.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<Situation | AdversarialName>(situations, {
              cases: 1600,
              sense: notesOnly,
            }),
            draw: drawn(pairs),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema 1.1's doubleLexicalMap over BigInt rationals, keys equal or identical",
            },
            runs: 2000,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/import/float-map-keys",
          },
          (pair, c) =>
            Effect.gen(function* floatKeyCase() {
              for (const name of Option.toArray(pair.name)) {
                c.note(name);
              }

              yield* judged(pair, (situation) => {
                c.note(situation);
              });
            }),
        ),
      ),
    searchTimeout,
  );
});
