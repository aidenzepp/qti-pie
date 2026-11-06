/**
 * The lexical spaces of the built-in datatypes of XML Schema Part 2 that `xsi-judges.ts` judges:
 * the regular expressions of the name, number, binary and URI types, the date and time types with
 * the checks their calendar needs, and the value ranges of the integer types. A pure module; a
 * pattern here has no length bound, as the type has none.
 */
import {
  anyUri,
  ncNameContinuation,
  ncNameStart,
  xsDecimal,
  xsDouble,
  xsInteger,
} from "#pantry/schema/patterns.ts";

/**
 * XML's NCName production, with no length bound.
 */
const ncNameSource = `[${ncNameStart}][${ncNameContinuation}]*`;

/**
 * Part 2's `xs:language` pattern, with no bound on the number of subtags.
 */
export const languagePattern = /^[a-zA-Z]{1,8}(?:-[a-zA-Z0-9]{1,8})*$/u;

/**
 * XML's NCName production, with no length bound.
 */
export const ncNamePattern = new RegExp(`^${ncNameSource}$`, "u");

/**
 * XML's Name production, with no length bound.
 */
export const namePattern = new RegExp(`^[${ncNameStart}:][${ncNameContinuation}:]*$`, "u");

/**
 * XML's Nmtoken production, with no length bound.
 */
export const nmtokenPattern = new RegExp(`^[${ncNameContinuation}:]+$`, "u");

/**
 * Namespaces in XML's QName production, with no length bound.
 */
export const qNamePattern = new RegExp(`^(?:${ncNameSource}:)?${ncNameSource}$`, "u");

/**
 * `xs:integer`'s lexical space.
 */
export const integerPattern = new RegExp(xsInteger, "u");

/**
 * `xs:decimal`'s lexical space.
 */
export const decimalPattern = new RegExp(xsDecimal, "u");

/**
 * `xs:float`'s and `xs:double`'s lexical space.
 */
export const doublePattern = new RegExp(xsDouble, "u");

/**
 * `xs:anyURI`'s lexical space, as `patterns.anyUri` states it.
 */
export const anyUriPattern = new RegExp(anyUri, "u");

/**
 * `xs:boolean`'s lexical space.
 */
export const booleanPattern = /^(?:true|false|1|0)$/u;

/**
 * `xs:duration`'s lexical space (Part 2, 3.2.6.1): at least one component, and a `T` only before
 * at least one time component.
 */
export const durationPattern =
  /^-?P(?=[0-9]|T[0-9])(?:[0-9]+Y)?(?:[0-9]+M)?(?:[0-9]+D)?(?:T(?=[0-9])(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\.[0-9]+)?S)?)?$/u;

/**
 * `xs:hexBinary`'s lexical space: an even number of hexadecimal digits.
 */
export const hexBinaryPattern = /^(?:[0-9A-Fa-f]{2})*$/u;

/**
 * `xs:base64Binary`'s lexical space (Part 2, 3.2.16.1): the Base64Binary production, whose spaces
 * the collapse leaves single.
 */
export const base64Pattern = (() => {
  const b64 = "[A-Za-z0-9+/]";
  const b16 = "[AEIMQUYcgkosw048]";
  const b04 = "[AQgw]";
  const s64 = `${b64} ?`;

  return new RegExp(
    `^(?:(?:${s64}){4})*(?:(?:${s64}){3}${b64}|(?:${s64}){2}${b16} ?=|${s64}${b04} ?= ?=)?$`,
    "u",
  );
})();

/**
 * The year of a date, with an optional sign: four or more digits, no leading zero past four.
 */
const yearSource = "(?<year>-?(?:[1-9][0-9]{3,}|0[0-9]{3}))";

/**
 * The time zone a date or time may end with: `Z`, or an offset of at most 14 hours.
 */
const zoneSource = "(?:Z|[+\\-](?:(?:0[0-9]|1[0-3]):[0-5][0-9]|14:00))?";

/**
 * The month, day and time parts of the date and time types, by group name.
 */
const monthSource = "(?<month>0[1-9]|1[0-2])";

const daySource = "(?<day>[0-9]{2})";

const timeSource =
  "(?<hour>[0-9]{2}):(?<minute>[0-9]{2}):(?<second>[0-9]{2})(?<fraction>\\.[0-9]+)?";

/**
 * Whether the Gregorian calendar year written `year` is a leap year. Year 1 BCE is `-0001`, which
 * is year 0 of the astronomical count.
 */
const isLeap = (year: string): boolean => {
  const count = BigInt(year);
  const astronomical = count < 0n ? count + 1n : count;

  return (astronomical % 4n === 0n && astronomical % 100n !== 0n) || astronomical % 400n === 0n;
};

/**
 * How many days the month has, 29 for February when `year` is absent.
 */
const daysIn = (month: number, year: string | undefined): number => {
  if (month === 2) {
    return year === undefined || isLeap(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/**
 * What a date or time pattern's named groups say is wrong, or `null`: the year is not `0000`, the
 * day exists in the month, and the time is a time of day, `24:00:00` being the end of a day.
 */
const partsDetail = (groups: Readonly<Record<string, string | undefined>>): string | null => {
  const { day, fraction, hour, minute, month, second, year } = groups;

  if (year !== undefined && /^-?0000$/u.test(year)) {
    return "the year 0000 is not allowed";
  }

  if (day !== undefined) {
    const last = daysIn(month === undefined ? 12 : Number(month), month === undefined ? "0" : year);

    if (Number(day) < 1 || Number(day) > last) {
      return `the day ${day} does not exist in the month`;
    }
  }

  if (hour !== undefined) {
    const endOfDay =
      hour === "24" && minute === "00" && second === "00" && /^(?:\.0+)?$/u.test(fraction ?? "");

    if (!endOfDay && (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)) {
      return "it is not a time of day";
    }
  }

  return null;
};

/**
 * The date and time datatypes of Part 2, 3.2.7 to 3.2.14, by local name, with their lexical form.
 * A year-less month and day (`gMonthDay`) takes 29 days in February, and `gDay` 31 days.
 */
export const temporalPatterns: ReadonlyMap<string, RegExp> = new Map(
  [
    ["dateTime", `${yearSource}-${monthSource}-${daySource}T${timeSource}${zoneSource}`],
    ["date", `${yearSource}-${monthSource}-${daySource}${zoneSource}`],
    ["time", `${timeSource}${zoneSource}`],
    ["gYearMonth", `${yearSource}-${monthSource}${zoneSource}`],
    ["gYear", `${yearSource}${zoneSource}`],
    ["gMonthDay", `--${monthSource}-${daySource}${zoneSource}`],
    ["gDay", `---${daySource}${zoneSource}`],
    ["gMonth", `--${monthSource}${zoneSource}`],
  ].map(([local = "", source = ""]) => [local, new RegExp(`^${source}$`, "u")]),
);

/**
 * The first reason `text` is outside the lexical space of the date or time datatype `local`, or
 * `null`.
 */
export const temporalDetail = (local: string, text: string): string | null => {
  const match = temporalPatterns.get(local)?.exec(text);

  if (match === null || match === undefined) {
    return `it is not a ${local}`;
  }

  return partsDetail(match.groups ?? {});
};

/**
 * The value range of each integer type of XML Schema Part 2, 3.3.13 to 3.3.25, inclusive on both
 * ends where one exists.
 */
export const integerRanges: ReadonlyMap<string, { readonly max?: bigint; readonly min?: bigint }> =
  new Map([
    ["integer", {}],
    ["nonPositiveInteger", { max: 0n }],
    ["negativeInteger", { max: -1n }],
    ["long", { max: 2n ** 63n - 1n, min: -(2n ** 63n) }],
    ["int", { max: 2n ** 31n - 1n, min: -(2n ** 31n) }],
    ["short", { max: 32_767n, min: -32_768n }],
    ["byte", { max: 127n, min: -128n }],
    ["nonNegativeInteger", { min: 0n }],
    ["unsignedLong", { max: 2n ** 64n - 1n, min: 0n }],
    ["unsignedInt", { max: 2n ** 32n - 1n, min: 0n }],
    ["unsignedShort", { max: 65_535n, min: 0n }],
    ["unsignedByte", { max: 255n, min: 0n }],
    ["positiveInteger", { min: 1n }],
  ]);
