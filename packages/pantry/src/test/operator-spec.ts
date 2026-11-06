/**
 * Spec readings 119 and 121 written as checkers, straight from the information model's sentences,
 * for the operator tests to judge the law oracle, the builder's rows and the database's patterns by
 * (`#pantry/qti/operators.test.ts`, `#pantry/import/overlays/operators.test.ts`).
 *
 * Nothing here reads the module under test: each reading is restated from its source, a value's
 * lexical space by a hand-written parser of XML Schema's grammar rather than a pattern, so a
 * pattern of `#pantry/qti/operators.ts` and this parser are two statements of one language.
 *
 * - Reading 119 (info §5.47.2, §5.119.2): "If roundingMode= 'significantFigures', the value of
 *   figures must be a non-zero positive integer. If roundingMode='decimalPlaces', the value of
 *   figures must be an integer greater than or equal to zero", the mode `significantFigures` by
 *   default on a `qti-equal-rounded` (§5.47.1) and required on a `qti-round-to` (§5.119.1).
 * - Reading 121 (info §5.46.2, §9.1.5): "If the tolerance mode is absolute or relative then the
 *   tolerance must be specified. The tolerance consists of two positive numbers, t0 and t1 ... If
 *   only one value is given it is used for both", its values "either strings (must not contain a
 *   space) or numbers", `tolerance-mode` `exact` by default (§5.46.1).
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 * @see {@link https://www.w3.org/TR/xmlschema-2/#integer | XML Schema Part 2, 3.3.13 integer}
 */

/**
 * The two rounding operators.
 */
export type RoundingKind = "qti-equal-rounded" | "qti-round-to";

/**
 * Collapse a text as XML Schema's whiteSpace `collapse` does: tab, line feed and carriage return
 * to space, each run of spaces to one, none at either end.
 *
 * @param text - The text.
 * @returns The collapsed text.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, 4.3.6 whiteSpace}
 */
export const collapsedText = (text: string): string => {
  let out = "";
  let pending = false;
  for (const char of text) {
    if (char === " " || char === "\t" || char === "\n" || char === "\r") {
      pending = out !== "";
    } else {
      out += pending ? ` ${char}` : char;
      pending = false;
    }
  }

  return out;
};

/**
 * Decide whether a character is an ASCII digit.
 *
 * @param char - The character, none past a text's end.
 * @returns Whether it is one of 0 to 9.
 */
const isDigit = (char: string | undefined): boolean =>
  char !== undefined && char >= "0" && char <= "9";

/**
 * Read a `figures` as reading 119 reads it: its value collapsed (the union's `xs:integer` member
 * collapses whitespace), an integer where that is `xs:integer`'s lexical form, `[+-]?` and digits,
 * within the signed 64-bit range spec reading 46 holds `figures` to.
 *
 * @param lexical - The attribute's lexical form.
 * @returns The integer, or none for a variable's name or any form that is no such integer.
 */
export const figuresIntegerOf = (lexical: string): bigint | undefined => {
  const value = collapsedText(lexical);
  const digits = value.startsWith("+") || value.startsWith("-") ? value.slice(1) : value;
  if (!/^[0-9]+$/u.test(digits)) {
    return undefined;
  }

  const integer = BigInt(value.startsWith("-") ? `-${digits}` : digits);

  return integer >= -(2n ** 63n) && integer <= 2n ** 63n - 1n ? integer : undefined;
};

/**
 * Decide whether reading 119 refuses a rounding operator: its `figures` is an integer below the
 * least its mode in force admits, 1 under `significantFigures` and 0 under `decimalPlaces`; the
 * mode is the one written, or `significantFigures` on a `qti-equal-rounded` that writes none. A
 * mode outside the enumeration, and a `qti-round-to`'s missing one, bind no bound.
 *
 * @param kind - The operator.
 * @param mode - Its `rounding-mode` as written, none where it writes none.
 * @param figures - Its `figures` as written, none where it writes none.
 * @returns Whether the reading refuses it.
 */
export const roundingRefused = (
  kind: RoundingKind,
  mode: string | undefined,
  figures: string | undefined,
): boolean => {
  const inForce = mode ?? (kind === "qti-equal-rounded" ? "significantFigures" : undefined);
  const integer = figures === undefined ? undefined : figuresIntegerOf(figures);
  if (integer === undefined) {
    return false;
  }

  if (inForce === "significantFigures") {
    return integer < 1n;
  }

  return inForce === "decimalPlaces" && integer < 0n;
};

/**
 * What a tolerance value is as reading 121 reads it: a number where it is in `xs:double`'s lexical
 * space, and then whether that number is positive.
 */
export interface DoubleReading {
  readonly numeric: boolean;
  readonly positive: boolean;
}

/**
 * Read a value against `xs:double`'s lexical space by hand, XML Schema 1.0 Part 2 §3.2.5.1: a
 * mantissa that is an `xs:decimal` (an optional sign, digits, and a point with digits on at least
 * one side of it or none), optionally `E` or `e` and an `xs:integer` exponent; or `INF`, `-INF`
 * and `NaN`. The number is positive where its sign is no minus and a digit of its mantissa is not
 * 0, or it is `INF`.
 *
 * @param value - The value.
 * @returns Whether it is a number, and whether a positive one.
 */
export const doubleReadingOf = (value: string): DoubleReading => {
  if (value === "INF") {
    return { numeric: true, positive: true };
  }

  if (value === "-INF" || value === "NaN") {
    return { numeric: true, positive: false };
  }

  let at = 0;
  const negative = value[at] === "-";
  if (value[at] === "+" || value[at] === "-") {
    at += 1;
  }

  let digits = "";
  while (isDigit(value[at])) {
    digits += value[at];
    at += 1;
  }

  if (value[at] === ".") {
    at += 1;
    while (isDigit(value[at])) {
      digits += value[at];
      at += 1;
    }
  }

  if (digits === "") {
    return { numeric: false, positive: false };
  }

  if (value[at] === "e" || value[at] === "E") {
    at += 1;
    if (value[at] === "+" || value[at] === "-") {
      at += 1;
    }

    const exponentAt = at;
    while (isDigit(value[at])) {
      at += 1;
    }

    if (at === exponentAt) {
      return { numeric: false, positive: false };
    }
  }

  const numeric = at === value.length;

  return { numeric, positive: numeric && !negative && /[1-9]/u.test(digits) };
};

/**
 * Split a `tolerance` into its values, as XML Schema reads a list's items: at each run of XML
 * whitespace, none for a value of whitespace alone.
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its values, in order.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#atomic-vs-list | XML Schema Part 2, 2.5.1.2 List datatypes}
 */
export const toleranceValuesOf = (lexical: string): readonly string[] => {
  const collapsed = collapsedText(lexical);

  return collapsed === "" ? [] : collapsed.split(" ");
};

/**
 * Decide whether reading 121 refuses a `qti-equal`: it compares in `absolute` or `relative` mode
 * and writes no `tolerance`, or it writes a `tolerance` that is not one or two values, or one of
 * whose values is a number not above 0.
 *
 * @param mode - Its `tolerance-mode` as written, none where it writes none (`exact`).
 * @param tolerance - Its `tolerance` as written, none where it writes none.
 * @returns Whether the reading refuses it.
 */
export const toleranceRefused = (
  mode: string | undefined,
  tolerance: string | undefined,
): boolean => {
  if (tolerance === undefined) {
    return mode === "absolute" || mode === "relative";
  }

  const values = toleranceValuesOf(tolerance);

  return (
    values.length < 1 ||
    values.length > 2 ||
    values.some((value) => {
      const reading = doubleReadingOf(value);

      return reading.numeric && !reading.positive;
    })
  );
};
