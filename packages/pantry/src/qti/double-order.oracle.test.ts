/**
 * The two orders of `xs:double` bounds, `Slider bounds` and `Mastery range` (spec reading 9: the
 * Schematron's rule 14Ba and RULE SPECIFIC CLASS OUTCOMEDEC 1), judged three ways alike over bounds
 * at and past grizzle's former bounded form of `double precision` (15 significant digits, an
 * exponent of at most 293, zero runs of at most 255):
 *
 * - **The schema's checks**, `Slider_bounds` (`#pantry/qti/interactions.ts`) and `Mastery_range`
 *   (`#pantry/qti/declarations.ts`), read from `Qti`'s statements, so the predicate judged is the
 *   one the database installs, and evaluated over each row of the case on the host as PostgreSQL
 *   evaluates it (`breaks` of `#pantry/test/predicates.ts`): a `Compute.matches` guard as a regular
 *   expression under `u`, `Compute.parseDouble` as the double the decimal text names, and
 *   `float8`'s order, in which NaN equals NaN and is above every other value. A term of any other
 *   kind fails the case, so no predicate is ever judged in part. The rows are the case's bounds as
 *   the import copies them: a slider's collapsed (`InteractionAttribute.value`), a scale
 *   attribute's as written (`Attribute.lexical`), which the check collapses; the copies themselves
 *   are their containments' (C18), which other tests hold.
 * - **The law oracle** (`documentBreaches` of `#pantry/test/oracle.ts`) names `Slider bounds` or
 *   `Mastery range` over the item that writes the case's bounds.
 * - **The reference** written here from the specifications: a form is read where, once collapsed as
 *   `xs:double`'s whiteSpace collapses it (Part 2 §4.3.6; reading 7), it is in XML Schema 1.0's
 *   `xs:double` lexical space (Part 2 §3.2.5.1, reading 71's edition, `+INF` outside it), as the
 *   double XML Schema 1.1's doubleLexicalMap maps it to (Part 2 §3.3.5.2, reading 144).
 *   ECMAScript's `Number` rounds a decimal of at most 20 significant digits exactly so, to nearest
 *   with ties to even, an infinity of its sign past the overflow threshold and a zero of its sign
 *   below half the least subnormal (ECMA-262 §7.1.4.1.1, RoundMVResult, and §6.1.6.1), so every
 *   numeral drawn has at most 20, its zero runs and its exponent of any length. A pair breaks its
 *   order where both forms have a value, neither is NaN, and the lower is above the upper.
 *
 * Five plants restate the deleted readings. Three restate the fallback under which a form outside
 * the bounded form stood as the end of the order that holds it: the schema's former checks, built
 * here as they were and evaluated as the installed ones are; the oracle's former `Mastery range`
 * reading, the bounded form; and its former `Slider bounds` reading, which read any collapsed text
 * as JavaScript's `Number` does, `+INF` and `0x10` among them. Two restate the scale read as
 * written, under which a form with outer whitespace stood as the end of the order that holds it,
 * a stated limit while grizzle's `Compute.matches` guard proved nothing of a `Compute.collapse`
 * subject (lifted by grizzle `c899acca`): the schema's uncollapsed `Mastery_range`, and the
 * oracle's uncollapsed reading. The search must catch each.
 */
import { check, Compute, lexicalForm, pg } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { boolean, element, int, map, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { MasteryCeiling, MasteryFloor } from "#pantry/qti/declarations.ts";
import { Slider } from "#pantry/qti/interactions.ts";
import { doublePattern } from "#pantry/qti/operators.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";
import { Qti } from "#pantry/qti/own.ts";
import { breaks, checksOf, closedOf, doubleNamed } from "#pantry/test/predicates.ts";
import type { ReadCheck, Row } from "#pantry/test/predicates.ts";

/**
 * The checks of the two double orders that `Qti` installs, by the relation each is stated on.
 */
const installed = checksOf(Qti.statements).filter(({ name }) =>
  ["Slider_bounds", "Mastery_range"].includes(name),
);

/**
 * Qti's closed relations, which a check's closed reads look up: these checks read none.
 */
const closed = closedOf(Qti.relations);

/**
 * Grizzle's former bounded form of `double precision`: the form the deleted checks guarded their
 * casts with, and the oracle's former `Mastery range` reading.
 */
const formerForm = lexicalForm(pg["double precision"]);

/**
 * The same, as the host tests it.
 */
const formerRegex = new RegExp(formerForm.source, "u");

/**
 * The deleted checks, restated as they were: each bound cast through the former form, `NaN` ordered
 * against nothing, and a text outside the form read as the end of the order that holds it.
 */
const former: readonly ReadCheck[] = checksOf([
  check("Slider_bounds", Slider, (s) =>
    s.or(
      s.eq(s.lower, "NaN"),
      s.eq(s.upper, "NaN"),
      s.le(
        Compute.when(
          Compute.matches(s.lower, formerForm),
          (lower) => Compute.cast(lower, pg["double precision"]),
          Number.NEGATIVE_INFINITY,
        ),
        Compute.when(
          Compute.matches(s.upper, formerForm),
          (upper) => Compute.cast(upper, pg["double precision"]),
          Number.POSITIVE_INFINITY,
        ),
      ),
    ),
  ),
  check("Mastery_range", MasteryFloor, (r) =>
    r.or(
      r.eq(r.normalMinimum, "NaN"),
      r.eq(r.masteryValue, "NaN"),
      r.le(
        Compute.when(
          Compute.matches(r.normalMinimum, formerForm),
          (low) => Compute.cast(low, pg["double precision"]),
          Number.NEGATIVE_INFINITY,
        ),
        Compute.when(
          Compute.matches(r.masteryValue, formerForm),
          (mastery) => Compute.cast(mastery, pg["double precision"]),
          Number.POSITIVE_INFINITY,
        ),
      ),
    ),
  ),
  check("Mastery_range", MasteryCeiling, (r) =>
    r.or(
      r.eq(r.masteryValue, "NaN"),
      r.eq(r.normalMaximum, "NaN"),
      r.le(
        Compute.when(
          Compute.matches(r.masteryValue, formerForm),
          (mastery) => Compute.cast(mastery, pg["double precision"]),
          Number.NEGATIVE_INFINITY,
        ),
        Compute.when(
          Compute.matches(r.normalMaximum, formerForm),
          (high) => Compute.cast(high, pg["double precision"]),
          Number.POSITIVE_INFINITY,
        ),
      ),
    ),
  ),
]);

/**
 * The scale's checks before its forms were collapsed, restated as they were: each form read by
 * `Compute.parseDouble` where it is in `doublePattern` as written, `NaN` ordered against nothing,
 * and any other form, one with outer whitespace among them, read as the end of the order that
 * holds it.
 */
const uncollapsed: readonly ReadCheck[] = checksOf([
  check("Mastery_range", MasteryFloor, (r) =>
    r.or(
      r.eq(r.normalMinimum, "NaN"),
      r.eq(r.masteryValue, "NaN"),
      r.le(
        Compute.when(
          Compute.matches(r.normalMinimum, doublePattern),
          (low) => Compute.parseDouble(low),
          Number.NEGATIVE_INFINITY,
        ),
        Compute.when(
          Compute.matches(r.masteryValue, doublePattern),
          (mastery) => Compute.parseDouble(mastery),
          Number.POSITIVE_INFINITY,
        ),
      ),
    ),
  ),
  check("Mastery_range", MasteryCeiling, (r) =>
    r.or(
      r.eq(r.masteryValue, "NaN"),
      r.eq(r.normalMaximum, "NaN"),
      r.le(
        Compute.when(
          Compute.matches(r.masteryValue, doublePattern),
          (mastery) => Compute.parseDouble(mastery),
          Number.NEGATIVE_INFINITY,
        ),
        Compute.when(
          Compute.matches(r.normalMaximum, doublePattern),
          (high) => Compute.parseDouble(high),
          Number.POSITIVE_INFINITY,
        ),
      ),
    ),
  ),
]);

/**
 * XML Schema 1.0's `xs:double` lexical space (Part 2 §3.2.5.1), the reference's.
 */
const xsDouble = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * XML Schema's whiteSpace collapse (Part 2 §4.3.6): each run of XML whitespace one space, and none
 * at either end.
 *
 * @param form - The form.
 * @returns It collapsed.
 */
const collapsed = (form: string): string =>
  form
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * The reference's value of a form: the double it names where it is in {@link xsDouble}.
 *
 * @param form - The form, as the law reads it.
 * @returns The double, none outside the lexical space.
 */
const referenceOf = (form: string): Option.Option<number> =>
  xsDouble.test(form) ? Option.some(doubleNamed(form)) : Option.none();

/**
 * Whether the reference breaks the order of two values: both present, and the first above the
 * second, which NaN on either side never is.
 *
 * @param low - The value that must not be above.
 * @param high - The value that must not be below.
 * @returns Whether the order is broken.
 */
const above = (low: Option.Option<number>, high: Option.Option<number>): boolean =>
  Option.isSome(low) && Option.isSome(high) && low.value > high.value;

/**
 * Where a case's two forms are written: a slider's `lower-bound` and `upper-bound`; an outcome
 * declaration's `normal-minimum` and `mastery-value`; or its `mastery-value` and `normal-maximum`.
 */
type Carrier = "ceiling" | "floor" | "slider";

/**
 * A numeral's exact value: its sign, its significant digits with no leading or trailing zero (empty
 * for zero), and the power of ten its last digit stands at.
 */
interface Numeral {
  readonly digits: string;
  readonly exponent: bigint;
  readonly negative: boolean;
}

/**
 * How a numeral is written: a `+` on a nonnegative one, zeros before it and after its digits, the
 * digits after the point, a bare point or none before a fraction, its exponent's letter, sign and
 * zeros, and spaces around it.
 */
interface Spelling {
  readonly bare: boolean;
  readonly expPlus: boolean;
  readonly expZeros: number;
  readonly fraction: number;
  readonly lead: number;
  readonly letter: "E" | "e" | "none";
  readonly padded: boolean;
  readonly plus: boolean;
  readonly point: boolean;
  readonly trail: number;
}

/**
 * Write a sign: `-` before a negative number, else `+` where the spelling writes one, else none.
 *
 * @param negative - Whether the number is negative.
 * @param plus - Whether a nonnegative one is written with `+`.
 * @returns The sign.
 */
const signOf = (negative: boolean, plus: boolean): string => {
  if (negative) {
    return "-";
  }

  return plus ? "+" : "";
};

/**
 * Write a numeral in a spelling: a form of its value, in `xs:double`'s lexical space unless padded.
 *
 * @param numeral - The numeral.
 * @param spelling - How it is written.
 * @returns The form.
 */
const spell = ({ digits, exponent, negative }: Numeral, spelling: Spelling): string => {
  const mantissa = `${digits === "" ? "0" : digits}${"0".repeat(spelling.trail)}`;
  const padded = `${"0".repeat(spelling.lead)}${mantissa.padStart(spelling.fraction + 1, "0")}`;
  const whole = padded.slice(0, padded.length - spelling.fraction);
  const fraction = padded.slice(padded.length - spelling.fraction);
  const written = exponent - BigInt(spelling.trail) + BigInt(spelling.fraction);
  const bareWhole = spelling.bare && /^0+$/u.test(whole) ? "" : whole;
  const shown =
    spelling.fraction === 0 ? `${whole}${spelling.point ? "." : ""}` : `${bareWhole}.${fraction}`;
  const letter = spelling.letter === "none" ? "e" : spelling.letter;
  const sign = signOf(written < 0n, spelling.expPlus);
  const power = `${"0".repeat(spelling.expZeros)}${String(written < 0n ? -written : written)}`;
  const scale = written === 0n && spelling.letter === "none" ? "" : `${letter}${sign}${power}`;
  const form = `${signOf(negative, spelling.plus)}${shown}${scale}`;

  return spelling.padded ? ` ${form} ` : form;
};

/**
 * The significands a numeral draws from: binary64's edges as decimals of at most 17 digits, the tie
 * at 2^53, the former form's 15 digits and one and two past it.
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
] as const;

/**
 * The powers of ten a numeral's leading digit is drawn at: past either threshold of binary64, at
 * each edge of it and of the former form's exponent bound, and plain ones.
 */
const edgeMagnitudes = [
  -400n,
  -325n,
  -324n,
  -323n,
  -308n,
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
 * A run of significant digits: a named significand, or a nonzero digit and up to 19 more, so a
 * numeral has at most 20.
 */
const significands: Gen<string> = weighted([
  [2, element(namedSignificands)],
  [
    3,
    (source) => {
      const length = source.draw(element([0, 1, 14, 15, 16, 18, 19] as const));
      const lead = source.draw(element(["1", "2", "5", "9"] as const));
      const rest = Array.from({ length }, () =>
        source.draw(element(["0", "1", "4", "5", "9"] as const)),
      );

      return `${lead}${rest.join("")}`;
    },
  ],
]);

/**
 * A numeral at an edge, zero one time in ten.
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
 * The spellings, each run of zeros up to one past the former form's bound of 255.
 */
const spellings: Gen<Spelling> = (source) => ({
  bare: source.draw(boolean),
  expPlus: source.draw(boolean),
  expZeros: source.draw(element([0, 0, 1, 256] as const)),
  fraction: source.draw(element([0, 0, 1, 3, 17, 30] as const)),
  lead: source.draw(element([0, 0, 1, 256] as const)),
  letter: source.draw(element(["e", "E", "none"] as const)),
  padded: source.draw(
    weighted([
      [9, element([false] as const)],
      [1, element([true] as const)],
    ]),
  ),
  plus: source.draw(boolean),
  point: source.draw(boolean),
  trail: source.draw(element([0, 0, 1, 256] as const)),
});

/**
 * A numeral's neighbour: its digits run out to 16 to 20 significant digits and ended by a 1, a 5 or
 * a 9, at the same magnitude, so binary64 may round the two together or apart.
 *
 * @param numeral - The numeral.
 * @param length - The neighbour's significant digits.
 * @param last - Its last digit.
 * @returns The neighbour.
 */
const neighbourOf = (numeral: Numeral, length: number, last: string): Numeral => {
  const lead = numeral.digits === "" ? "1" : numeral.digits;
  const digits = `${lead.padEnd(length - 1, "0")}${last}`;

  return {
    ...numeral,
    digits,
    exponent: numeral.exponent - BigInt(digits.length - lead.length),
  };
};

/**
 * The forms outside `xs:double`'s lexical space a case may write: XML Schema 1.1's `+INF`, texts
 * JavaScript's `Number` reads (`0x10`, `Infinity`, the empty text), and texts nothing reads.
 */
const outsideForms = ["+INF", "0x10", "Infinity", "", "1e", ".", "abc", "1 0"] as const;

/**
 * The adversarial pairs, each drawn by name: the edges of the former form and of binary64.
 */
const adversarial = [
  { forms: ["10000000000000001", "1"], name: "17 digits above 1" },
  { forms: ["1.0000000000000001", "1"], name: "17 digits rounding to 1" },
  { forms: ["1.00000000000000012", "1"], name: "18 digits rounding past 1" },
  { forms: ["1e294", "1e293"], name: "an exponent of 294" },
  { forms: ["1e400", "INF"], name: "an overflow and INF" },
  { forms: ["1e400", "1.7976931348623157e308"], name: "an overflow above the greatest double" },
  { forms: ["1.7976931348623159e308", "1.7976931348623157e308"], name: "past the threshold" },
  { forms: ["1.7976931348623158e308", "1.7976931348623157e308"], name: "below the threshold" },
  { forms: ["-1e400", "-INF"], name: "a negative overflow and -INF" },
  { forms: ["1e-300", "-1e-400"], name: "a positive above a negative underflow" },
  { forms: ["1e-400", "-0"], name: "an underflow and -0" },
  { forms: ["2.4703282292062328e-324", "0"], name: "past half the least subnormal" },
  { forms: ["2.4703282292062327e-324", "0"], name: "below half the least subnormal" },
  { forms: [`1${"0".repeat(300)}`, "1e299"], name: "a zero run past 255" },
  { forms: [`1e${"0".repeat(300)}2`, "10"], name: "an exponent's zero run past 255" },
  { forms: ["9007199254740993", "9007199254740992"], name: "a tie to even" },
  { forms: ["+INF", "1"], name: "XML Schema 1.1's +INF" },
  { forms: ["0x10", "1"], name: "a hexadecimal text" },
  { forms: ["NaN", "-INF"], name: "NaN above -INF" },
  { forms: [" 2 ", "1"], name: "a padded form above" },
  { forms: ["2", "\t1\n"], name: "a form above a padded one" },
] as const satisfies readonly {
  readonly forms: readonly [string, string];
  readonly name: string;
}[];

/**
 * An adversarial pair's name.
 */
type AdversarialName = (typeof adversarial)[number]["name"];

/**
 * One case: its carrier, its two forms, the lower first, and the adversarial pair it was drawn as.
 */
interface OrderCase {
  readonly carrier: Carrier;
  readonly forms: readonly [string, string];
  readonly name: Option.Option<AdversarialName>;
}

/**
 * Draw a form: a numeral spelled at an edge, a special value, or a form outside the lexical space.
 */
const forms: Gen<string> = weighted([
  [8, (source) => spell(source.draw(numerals), source.draw(spellings))],
  [1, element(["INF", "-INF", "NaN"] as const)],
  [1, element(outsideForms)],
]);

/**
 * The cases: a numeral spelled twice, a numeral and its neighbour either way round, two forms at
 * the edges, and the adversarial pairs by name, each on a carrier.
 */
const cases: Gen<OrderCase> = (source) => {
  const carrier = source.draw(element(["slider", "floor", "ceiling"] as const));
  const pair = source.draw(
    weighted<Pick<OrderCase, "forms" | "name">>([
      [
        2,
        (inner) => {
          const numeral = inner.draw(numerals);

          return {
            forms: [spell(numeral, inner.draw(spellings)), spell(numeral, inner.draw(spellings))],
            name: Option.none(),
          };
        },
      ],
      [
        3,
        (inner) => {
          const numeral = inner.draw(numerals);
          const neighbour = neighbourOf(
            numeral,
            inner.draw(element([16, 17, 18, 19, 20] as const)),
            inner.draw(element(["1", "5", "9"] as const)),
          );
          const written = [
            spell(numeral, inner.draw(spellings)),
            spell(neighbour, inner.draw(spellings)),
          ] as const;

          return {
            forms: inner.draw(boolean) ? written : [written[1], written[0]],
            name: Option.none(),
          };
        },
      ],
      [2, (inner) => ({ forms: [inner.draw(forms), inner.draw(forms)], name: Option.none() })],
      [
        2,
        (inner) => {
          const { forms: named, name } = inner.draw(element(adversarial));

          return { forms: named, name: Option.some(name) };
        },
      ],
    ]),
  );

  return { carrier, ...pair };
};

/**
 * The scale attributes and slider bounds a case writes: its two forms where its carrier is, a
 * normal minimum of `-INF` beside a ceiling's pair so the floor it implies holds, and a slider of
 * 0 to 10 beside a scale's pair.
 *
 * @param drawnCase - The case.
 * @returns Each attribute's form, by name, the slider's under `lower-bound` and `upper-bound`.
 */
const attributesOf = ({ carrier, forms: [low, high] }: OrderCase): ReadonlyMap<string, string> => {
  switch (carrier) {
    case "slider": {
      return new Map([
        ["lower-bound", low],
        ["upper-bound", high],
      ]);
    }
    case "floor": {
      return new Map([
        ["lower-bound", "0"],
        ["upper-bound", "10"],
        ["normal-minimum", low],
        ["mastery-value", high],
      ]);
    }
    case "ceiling": {
      return new Map([
        ["lower-bound", "0"],
        ["upper-bound", "10"],
        ["normal-minimum", "-INF"],
        ["mastery-value", low],
        ["normal-maximum", high],
      ]);
    }
    default: {
      return carrier satisfies never;
    }
  }
};

/**
 * Write the item of a case: one slider interaction and one outcome declaration, each with the
 * attributes it writes.
 *
 * @param attributes - The case's attributes.
 * @returns The item's text.
 */
const itemOf = (attributes: ReadonlyMap<string, string>): string => {
  const written = (names: readonly string[]): string =>
    names
      .flatMap((name) =>
        Option.toArray(
          Option.map(Option.fromUndefinedOr(attributes.get(name)), (form) => ` ${name}="${form}"`),
        ),
      )
      .join("");

  return [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false">',
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/>',
    `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"${written(["normal-minimum", "mastery-value", "normal-maximum"])}/>`,
    `<qti-item-body><qti-slider-interaction response-identifier="RESPONSE"${written(["lower-bound", "upper-bound"])}/></qti-item-body>`,
    "</qti-assessment-item>",
  ].join("");
};

/**
 * The rows a case's item has for the two orders, by relation: its slider's bounds collapsed, and
 * each pair of its scale attributes as written (`Attribute.lexical`), where it writes both.
 *
 * @param attributes - The case's attributes.
 * @returns The rows.
 */
const rowsOf = (attributes: ReadonlyMap<string, string>): ReadonlyMap<string, Row[]> => {
  const form = (name: string): Option.Option<string> =>
    Option.fromUndefinedOr(attributes.get(name));
  const pair = (first: string, second: string, fields: readonly [string, string]): readonly Row[] =>
    Option.toArray(
      Option.map(Option.all([form(first), form(second)]), ([a, b]) => ({
        [fields[0]]: a,
        [fields[1]]: b,
      })),
    );

  return new Map([
    [
      Slider.name,
      Option.toArray(
        Option.map(Option.all([form("lower-bound"), form("upper-bound")]), ([lower, upper]) => ({
          lower: collapsed(lower),
          upper: collapsed(upper),
        })),
      ),
    ],
    [
      MasteryFloor.name,
      [...pair("normal-minimum", "mastery-value", ["normalMinimum", "masteryValue"])],
    ],
    [
      MasteryCeiling.name,
      [...pair("mastery-value", "normal-maximum", ["masteryValue", "normalMaximum"])],
    ],
  ]);
};

/**
 * The law oracle's laws over the composed grammar, built once.
 */
const oracleLaws = lawsOf(grammar);

/**
 * The oracle's former `Slider bounds` reading of a collapsed bound: any text as JavaScript's
 * `Number` reads it, `INF` and `+INF` infinite.
 *
 * @param form - The bound, collapsed.
 * @returns Its value.
 */
const formerSliderNumber = (form: string): number =>
  form === "INF" || form === "+INF" ? Number.POSITIVE_INFINITY : doubleNamed(form);

/**
 * The oracle's former `Mastery range` reading of a scale attribute as written: its double where its
 * form is in the bounded form, and the end of the order that holds it otherwise.
 *
 * @param form - The attribute, as written.
 * @param otherwise - What a form outside stands as.
 * @returns Its value.
 */
const formerScale = (form: string, otherwise: number): number =>
  formerRegex.test(form) ? doubleNamed(form) : otherwise;

/**
 * The oracle's uncollapsed `Mastery range` reading of a scale attribute: its double where its form
 * as written is in `xs:double`'s lexical space, of any digits, and the end of the order that holds
 * it otherwise, a form with outer whitespace among them.
 *
 * @param form - The attribute, as written.
 * @param otherwise - What a form outside stands as.
 * @returns Its value.
 */
const writtenScale = (form: string, otherwise: number): number =>
  xsDouble.test(form) ? doubleNamed(form) : otherwise;

/**
 * Whether a scale reading orders two forms as written the wrong way round, `NaN` against nothing.
 *
 * @param read - The reading of one form, given what a form it cannot read stands as.
 * @param forms - The two forms, as written, the lower first.
 * @returns Whether it breaks the order.
 */
const scaleAbove = (
  read: (form: string, otherwise: number) => number,
  [low, high]: readonly [string, string],
): boolean =>
  low !== "NaN" &&
  high !== "NaN" &&
  read(low, Number.NEGATIVE_INFINITY) > read(high, Number.POSITIVE_INFINITY);

/**
 * A situation the search must reach: each carrier and verdict, each edge a form sits past, and each
 * plant caught.
 */
type Situation =
  | Carrier
  | "broken"
  | "caught: the oracle's former Mastery range reading"
  | "caught: the oracle's former Slider bounds reading"
  | "caught: the oracle's uncollapsed scale"
  | "caught: the schema's former bounded form"
  | "caught: the schema's uncollapsed scale"
  | "exponent past 293"
  | "held"
  | "outside the lexical space"
  | "overflow"
  | "padded"
  | "past 15 digits"
  | "rounds together"
  | "underflow"
  | "zero run past 255";

/**
 * A numeral's parts as written: its digits and its exponent.
 */
const numeralParts =
  /^[+-]?(?<whole>[0-9]*)(?:\.(?<fraction>[0-9]*))?(?:[Ee](?<power>[+-]?[0-9]+))?$/u;

/**
 * Name the edges a form, as the law reads it, sits past.
 *
 * @param form - The form.
 * @returns Its situations.
 */
const edgesOf = (form: string): readonly Situation[] => {
  if (!xsDouble.test(form)) {
    return ["outside the lexical space"];
  }

  const groups = numeralParts.exec(form)?.groups;
  if (groups === undefined) {
    return [];
  }

  const digits = `${groups["whole"] ?? ""}${groups["fraction"] ?? ""}`
    .replace(/^0+/u, "")
    .replace(/0+$/u, "");
  const value = doubleNamed(form);
  const situations: readonly (readonly [Situation, boolean])[] = [
    ["past 15 digits", digits.length > 15],
    [
      "exponent past 293",
      Option.exists(Option.fromUndefinedOr(groups["power"]), (power) => {
        const magnitude = BigInt(power);

        return magnitude > 293n || magnitude < -293n;
      }),
    ],
    ["zero run past 255", /0{256}/u.test(form)],
    ["overflow", !Number.isFinite(value)],
    ["underflow", digits !== "" && value === 0],
  ];

  return situations.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * A case's two forms as its law reads them: collapsed.
 *
 * @param drawnCase - The case.
 * @returns The lower form and the upper.
 */
const formsRead = ({ forms: [low, high] }: OrderCase): readonly [string, string] => [
  collapsed(low),
  collapsed(high),
];

/**
 * Whether two different forms name one finite double.
 *
 * @param forms - The two forms, as the law reads them.
 * @returns Whether they round together.
 */
const roundsTogether = ([low, high]: readonly [string, string]): boolean =>
  low !== high &&
  Option.exists(
    Option.all([referenceOf(low), referenceOf(high)]),
    ([first, second]) => Number.isFinite(first) && first === second,
  );

/**
 * The situations a case reaches: its carrier and verdict, each edge its forms sit past, a padded
 * form, and two forms rounding together.
 *
 * @param drawnCase - The case.
 * @param expected - The reference's verdict, whether the order is broken.
 * @returns Its situations.
 */
const situationsOf = (drawnCase: OrderCase, expected: boolean): readonly Situation[] => {
  const read = formsRead(drawnCase);
  const padded = drawnCase.forms.some(
    (form) => form !== collapsed(form) && xsDouble.test(collapsed(form)),
  );

  return [
    drawnCase.carrier,
    expected ? "broken" : "held",
    ...read.flatMap(edgesOf),
    ...(padded ? ["padded" as const] : []),
    ...(roundsTogether(read) ? ["rounds together" as const] : []),
  ];
};

/**
 * The plants a case catches: each former reading of its carrier's law whose verdict on it differs
 * from the reference's.
 *
 * @param drawnCase - The case.
 * @param rows - Its rows for the two orders.
 * @param expected - The reference's verdict.
 * @returns The plants caught.
 */
const caughtOf = (
  drawnCase: OrderCase,
  rows: ReadonlyMap<string, readonly Row[]>,
  expected: boolean,
): readonly Situation[] => {
  const [low, high] = formsRead(drawnCase);
  const scale = (verdict: () => boolean): Option.Option<boolean> =>
    drawnCase.carrier === "slider" ? Option.none() : Option.some(verdict());
  const plants: readonly (readonly [Situation, Option.Option<boolean>])[] = [
    ["caught: the schema's former bounded form", Option.some(breaks(former, rows, closed))],
    [
      "caught: the oracle's former Slider bounds reading",
      drawnCase.carrier === "slider"
        ? Option.some(formerSliderNumber(high) < formerSliderNumber(low))
        : Option.none(),
    ],
    [
      "caught: the oracle's former Mastery range reading",
      scale(() => scaleAbove(formerScale, drawnCase.forms)),
    ],
    ["caught: the schema's uncollapsed scale", scale(() => breaks(uncollapsed, rows, closed))],
    [
      "caught: the oracle's uncollapsed scale",
      scale(() => scaleAbove(writtenScale, drawnCase.forms)),
    ],
  ];

  return plants.flatMap(([plant, broken]) =>
    Option.exists(broken, (verdict) => verdict !== expected) ? [plant] : [],
  );
};

/**
 * Judge a case: the schema's checks, the oracle and the reference agree on whether its order is
 * broken, and each plant that disagrees with the reference is caught.
 *
 * @param drawnCase - The case.
 * @param note - Where to note its situations.
 * @returns The effect that judges it.
 */
const judged = (drawnCase: OrderCase, note: (situation: Situation) => void) =>
  Effect.gen(function* judgedCase() {
    const attributes = attributesOf(drawnCase);
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(itemOf(attributes))));
    const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
    const folded = yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
    const rows = rowsOf(attributes);
    const [low, high] = formsRead(drawnCase);
    const expected = above(referenceOf(low), referenceOf(high));
    const label = `${drawnCase.carrier} ${Formatter.format(drawnCase.forms)}`;

    assert.strictEqual(
      breaks(installed, rows, closed),
      expected,
      `the schema's checks on ${label}`,
    );
    assert.strictEqual(
      documentBreaches("item.xml", folded, oracleLaws).some(
        ({ law }) => law === "Slider bounds" || law === "Mastery range",
      ),
      expected,
      `the oracle on ${label}`,
    );

    for (const situation of [
      ...situationsOf(drawnCase, expected),
      ...caughtOf(drawnCase, rows, expected),
    ]) {
      note(situation);
    }
  });

/**
 * Every situation the search requires, and every adversarial pair by name.
 */
const situations: readonly [Situation | AdversarialName, ...(Situation | AdversarialName)[]] = [
  "slider",
  "floor",
  "ceiling",
  "broken",
  "held",
  "past 15 digits",
  "exponent past 293",
  "zero run past 255",
  "overflow",
  "underflow",
  "rounds together",
  "outside the lexical space",
  "padded",
  "caught: the schema's former bounded form",
  "caught: the oracle's former Slider bounds reading",
  "caught: the oracle's former Mastery range reading",
  "caught: the schema's uncollapsed scale",
  "caught: the oracle's uncollapsed scale",
  ...adversarial.map(({ name }) => name),
];

describe("qti/interactions.ts and qti/declarations.ts, the double orders", () => {
  it("reads the installed Slider_bounds and Mastery_range checks, and their former statements, one over each relation", () => {
    // Oracle: the schema's statements, which `Qti` holds once each, and the five restated here.
    for (const checks of [installed, former]) {
      assert.deepStrictEqual(
        checks.map(({ relation }) => relation).toSorted(),
        [MasteryCeiling.name, MasteryFloor.name, Slider.name].toSorted(),
      );
    }
    assert.deepStrictEqual(
      uncollapsed.map(({ relation }) => relation).toSorted(),
      [MasteryCeiling.name, MasteryFloor.name].toSorted(),
    );
  });

  it.effect(
    "breaks a slider's or a scale's order exactly where the doubles XML Schema 1.1 maps its collapsed forms to are out of order, past grizzle's former bounded form and around outer whitespace, and catches each plant of the former readings",
    (ctx) =>
      // Oracle: the specification as a checker, the reference above (XML Schema's collapse, 1.0's
      // lexical space, 1.1's doubleLexicalMap through ECMAScript's Number, exact to 20 significant
      // digits).
      // Bound: 1,500 cases on three carriers, a fifth of the pairs the 21 adversarial ones by name,
      // the rest numerals of 1 to 20 significant digits at magnitudes from 10^-400 to 10^400 and
      // 10^±1e20, zero runs of 0, 1 and 256, one form in ten padded, spelled twice, beside a 16- to
      // 20-digit neighbour, or beside a special or a form outside the lexical space.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<Situation | AdversarialName>(situations, {
              cases: 1200,
              sense: notesOnly,
            }),
            draw: drawn(cases),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema 1.1's doubleLexicalMap through Number, the order broken where both forms have a value",
            },
            runs: 1500,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/qti/double-order",
          },
          (drawnCase, c) =>
            Effect.gen(function* orderCase() {
              for (const name of Option.toArray(drawnCase.name)) {
                c.note(name);
              }

              yield* judged(drawnCase, (situation) => {
                c.note(situation);
              });
            }),
        ),
      ),
    searchTimeout,
  );
});
