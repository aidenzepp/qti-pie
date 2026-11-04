/**
 * QTI values and NULL as phase 1 holds them: a base type, a cardinality and the values, with the
 * lexical parse and format of each base type and the equality `qti-match` uses.
 *
 * The session record, the engine and the form encoding all carry a {@link Value}, so this module
 * owns the one value representation, and the one NCName rule the validator reuses.
 */
import { Data, Option, Result } from "effect";

/**
 * The base types phase 1 holds values of: every QTI base type but `point`, `duration` and `file`.
 */
export const modelledBaseTypes = [
  "identifier",
  "boolean",
  "integer",
  "float",
  "string",
  "pair",
  "directedPair",
  "uri",
] as const;

/**
 * A base type phase 1 holds values of.
 */
export type ModelledBaseType = (typeof modelledBaseTypes)[number];

/**
 * The cardinalities a phase-1 value takes. Records are not modelled.
 */
export const modelledCardinalities = ["single", "multiple", "ordered"] as const;

/**
 * Report whether phase 1 holds values of a base type.
 *
 * `point`, `duration` and `file` are valid QTI base types the value model does not hold, so their
 * declarations are marked unsupported rather than refused.
 *
 * @param baseType A `base-type` attribute value.
 * @returns Whether `baseType` is a {@link ModelledBaseType}.
 */
export const isModelled = (baseType: string): baseType is ModelledBaseType =>
  modelledBaseTypes.some((name) => name === baseType);

/**
 * An XML NCName: a `Name` of XML 1.0 (Fifth Edition), `NameStartChar` then `NameChar`s, with the
 * colon removed from both. The `u` flag makes each range a range of code points, so a character
 * outside the Basic Multilingual Plane matches as one character and a lone surrogate never does.
 *
 * @see https://www.w3.org/TR/2008/REC-xml-20081126/#NT-NameStartChar
 * @see https://www.w3.org/TR/xml-names/#NT-NCName
 */
const ncName =
  /^[A-Z_a-z\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}][-.0-9A-Z_a-z\u{B7}\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{37D}\u{37F}-\u{1FFF}\u{200C}-\u{200D}\u{203F}-\u{2040}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}]*$/u;

/**
 * Report whether text is an XML NCName, the lexical space of a QTI identifier.
 *
 * @param text The text as written; no whitespace is removed first.
 * @returns Whether `text` is an NCName.
 */
export const isNcName = (text: string): boolean => ncName.test(text);

/**
 * Report whether a character is XML whitespace: space, tab, carriage return or line feed. No other
 * character counts, so a no-break space stays part of the value it pads.
 *
 * @param character One character of the text.
 * @returns Whether it is one of the four.
 */
const isXmlSpace = (character: string): boolean =>
  character === " " || character === "\t" || character === "\n" || character === "\r";

/**
 * Remove outer XML whitespace from text, stepping in from each end once, so the time is linear in
 * the length of the text.
 *
 * @param text The text as written.
 * @returns The text without its leading and trailing XML whitespace.
 */
const trimXmlSpace = (text: string): string => {
  let start = 0;
  let end = text.length;
  while (start < end && isXmlSpace(text.charAt(start))) {
    start += 1;
  }

  while (end > start && isXmlSpace(text.charAt(end - 1))) {
    end -= 1;
  }

  return text.slice(start, end);
};

/**
 * Two runs of non-whitespace separated by XML whitespace: the lexical form of a pair, before each
 * side is checked as an NCName.
 */
const pairLexical = /^(?<source>[^\t\n\r ]+)[\t\n\r ]+(?<destination>[^\t\n\r ]+)$/u;

/**
 * The lexical space of a QTI integer: an optional sign and decimal digits, as many as written.
 *
 * QTI 3.0 states no range for its integer base type (the integer primitive type is "derived from
 * the decimal data-type"), so the value model holds every integer exactly, as a `bigint`
 * (operator reading A).
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#AppA1
 */
const integerLexical = /^[+-]?[0-9]+$/u;

/**
 * The lexical space of xs:double (XML Schema 1.0), which a QTI float uses: a decimal with an
 * optional exponent, `INF`, `-INF` or `NaN`.
 *
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#double
 */
const doubleLexical = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * One QTI value, tagged by its base type: a string for `identifier`, `string` and `uri`; a
 * `bigint` for `integer`; a number for `float`; a boolean for `boolean`; and two identifiers for
 * `pair` and `directedPair`, the source first.
 *
 * An integer is exact at any size. A float is an xs:double. `SingleSchema` in
 * `#plate/codec/values.ts` checks and encodes this type at the boundaries.
 */
export type Single =
  | { readonly baseType: "identifier"; readonly value: string }
  | { readonly baseType: "boolean"; readonly value: boolean }
  | { readonly baseType: "integer"; readonly value: bigint }
  | { readonly baseType: "float"; readonly value: number }
  | { readonly baseType: "string"; readonly value: string }
  | { readonly baseType: "pair"; readonly value: readonly [string, string] }
  | { readonly baseType: "directedPair"; readonly value: readonly [string, string] }
  | { readonly baseType: "uri"; readonly value: string };

/**
 * A QTI value of a modelled base type, as the session record, the engine and the form encoding
 * carry it: a base type, a cardinality and its values, none for NULL.
 *
 * NULL is `values: []` at any cardinality, because QTI treats an empty string and an empty
 * container as NULL; there is no other spelling of NULL, so an empty string is never one of the
 * values. A `single` holds at most one value, and every value carries the value's own base type.
 * `ValueSchema` in `#plate/codec/values.ts` checks these rules at the boundaries.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Variables
 */
export interface Value {
  readonly baseType: ModelledBaseType;
  readonly cardinality: (typeof modelledCardinalities)[number];
  readonly values: readonly Single[];
}

/**
 * Construct the NULL value of a base type and cardinality.
 *
 * @param baseType The value's base type.
 * @param cardinality The value's cardinality.
 * @returns The value with no values.
 */
export const nullOf = (baseType: ModelledBaseType, cardinality: Value["cardinality"]): Value => ({
  baseType,
  cardinality,
  values: [],
});

/**
 * Report whether a value is NULL.
 *
 * @param value The value to test.
 * @returns Whether `value` holds no values.
 */
export const isNull = (value: Value): boolean => value.values.length === 0;

/**
 * The lexical form each base type takes, in the words a parse failure uses to say what to write.
 */
const expected = {
  boolean: "true or false",
  directedPair: "two NCNames separated by whitespace, such as A B",
  float: "a decimal or exponent number such as 2.5 or 1E3, or INF, -INF or NaN",
  identifier: "an NCName: a letter or _ first, then letters, digits, -, _ or .",
  integer: "decimal digits with an optional sign, such as -12",
  pair: "two NCNames separated by whitespace, such as A B",
  string: "any text",
  uri: "any text",
} satisfies Record<ModelledBaseType, string>;

/**
 * The failure of reading text as a value of a base type: the text is outside the base type's
 * lexical space. A document that holds it is invalid.
 */
export class InvalidValue extends Data.TaggedError("InvalidValue")<{
  readonly baseType: ModelledBaseType;
  readonly lexical: string;
}> {
  /**
   * The text and the lexical form its base type takes, in one line.
   */
  override get message(): string {
    return `${JSON.stringify(this.lexical)} is not a ${this.baseType} value; write ${expected[this.baseType]}`;
  }
}

/**
 * Give a value when a lexical check holds.
 *
 * @param holds Whether the text is in the base type's lexical space.
 * @param single The value the text names.
 * @returns `single` when `holds`, otherwise none.
 */
const valueIf = (holds: boolean, single: Single): Option.Option<Single> =>
  holds ? Option.some(single) : Option.none();

/**
 * Read an xs:double lexical form, which {@link doubleLexical} has already admitted, as a number.
 *
 * XML Schema 1.0 maps a decimal to the value of the basic value space closest to it, and the
 * infinities are special values outside that space that only `INF` and `-INF` name. So a decimal
 * beyond the largest double, such as `1e400`, reads as the largest finite double of its sign, where
 * `Number` would round it to an infinity.
 *
 * @param lexical The lexical form.
 * @returns The number it names; `INF` and `-INF` are the infinities and `NaN` is NaN.
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#double
 */
const readDouble = (lexical: string): number => {
  if (lexical === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  if (lexical === "-INF") {
    return Number.NEGATIVE_INFINITY;
  }

  const number = Number(lexical);
  if (number === Number.POSITIVE_INFINITY) {
    return Number.MAX_VALUE;
  }

  return number === Number.NEGATIVE_INFINITY ? -Number.MAX_VALUE : number;
};

/**
 * Read a QTI integer lexical form as the exact integer it names, at any size.
 *
 * `BigInt` reads only text {@link integerLexical} has admitted, which it always accepts, so it
 * never throws.
 *
 * @param lexical The lexical form.
 * @returns The integer it names, or none when the text is not an integer.
 */
const readInteger = (lexical: string): Option.Option<Single> =>
  integerLexical.test(lexical)
    ? Option.some({ baseType: "integer", value: BigInt(lexical) })
    : Option.none();

/**
 * Read the lexical form of a pair or directed pair.
 *
 * @param baseType Which of the two to read.
 * @param lexical The lexical form, with no outer whitespace removed.
 * @returns The two identifiers in written order, or none when the text is not two NCNames
 *   separated by whitespace.
 */
const readPair = (baseType: "pair" | "directedPair", lexical: string): Option.Option<Single> => {
  const sides = pairLexical.exec(lexical)?.groups;
  const source = sides?.["source"] ?? "";
  const destination = sides?.["destination"] ?? "";

  return valueIf(isNcName(source) && isNcName(destination), {
    baseType,
    value: [source, destination],
  });
};

/**
 * How each base type reads its lexical form: the value it names, or none when the text is outside
 * the lexical space.
 */
const readers = {
  boolean: (lexical: string) =>
    valueIf(lexical === "true" || lexical === "false", {
      baseType: "boolean",
      value: lexical === "true",
    }),
  directedPair: (lexical: string) => readPair("directedPair", lexical),
  float: (lexical: string) =>
    valueIf(doubleLexical.test(lexical), { baseType: "float", value: readDouble(lexical) }),
  identifier: (lexical: string) =>
    valueIf(isNcName(lexical), { baseType: "identifier", value: lexical }),
  integer: readInteger,
  pair: (lexical: string) => readPair("pair", lexical),
  string: (lexical: string) => valueIf(true, { baseType: "string", value: lexical }),
  uri: (lexical: string) => valueIf(true, { baseType: "uri", value: lexical }),
} satisfies Record<ModelledBaseType, (lexical: string) => Option.Option<Single>>;

/**
 * Read text as a value of a base type, exactly as written.
 *
 * No whitespace is removed, so a padded attribute value is refused, as spec reading 7 rules for
 * typed values in attributes. A boolean is `true` or `false` only; `1` and `0` are refused.
 *
 * @param baseType The base type to read.
 * @param lexical The text, as written.
 * @returns The value the text names, or a failure with {@link InvalidValue} when the text is
 *   outside the base type's lexical space.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Enumerated_BaseTypeEnum
 */
export const parseLexical = (
  baseType: ModelledBaseType,
  lexical: string,
): Result.Result<Single, InvalidValue> =>
  Result.fromOption(readers[baseType](lexical), () => new InvalidValue({ baseType, lexical }));

/**
 * Read the text content of an element, such as `qti-value`, as a value of a base type.
 *
 * Spec reading 7: outer XML whitespace is formatting for every base type but `string`, so it is
 * removed before the text is read, in time linear in the text; for `string` it is part of the
 * value. An empty `string` is NULL, not a value.
 *
 * @param baseType The base type to read.
 * @param text The element's text content, as written.
 * @returns The value the text names, none for NULL, or a failure with {@link InvalidValue} when
 *   the trimmed text is outside the base type's lexical space.
 */
export const parseElementText = (
  baseType: ModelledBaseType,
  text: string,
): Result.Result<Option.Option<Single>, InvalidValue> =>
  baseType === "string"
    ? Result.succeed(valueIf(text !== "", { baseType, value: text }))
    : Result.map(parseLexical(baseType, trimXmlSpace(text)), Option.some);

/**
 * Write a float in the lexical space of xs:double.
 *
 * `String` already writes the shortest digits that read back to the same number, in a form
 * xs:double admits (`2.5`, `1e+21`); the infinities, NaN and negative zero are written by name.
 *
 * @param number The float to write.
 * @returns Its lexical form, which {@link parseLexical} reads back to the same number.
 */
const formatFloat = (number: number): string => {
  if (Number.isNaN(number)) {
    return "NaN";
  }

  if (number === Number.POSITIVE_INFINITY) {
    return "INF";
  }

  if (number === Number.NEGATIVE_INFINITY) {
    return "-INF";
  }

  return Object.is(number, -0) ? "-0" : String(number);
};

/**
 * Write a value in its base type's lexical form.
 *
 * `String` writes the exact decimal digits of an integer of any size, never an exponent: no `+`,
 * no leading zeros, and `0` for a written `-0`.
 *
 * @param single The value to write.
 * @returns The lexical form, which {@link parseLexical} reads back to the same value; a pair is its
 *   two identifiers separated by one space.
 */
export const format = (single: Single): string => {
  if (single.baseType === "boolean") {
    return single.value ? "true" : "false";
  }

  if (single.baseType === "integer") {
    return String(single.value);
  }

  if (single.baseType === "float") {
    return formatFloat(single.value);
  }

  if (single.baseType === "pair" || single.baseType === "directedPair") {
    return `${single.value[0]} ${single.value[1]}`;
  }

  return single.value;
};

/**
 * Report whether two values are equal.
 *
 * @param left One value.
 * @param right The other value.
 * @returns Whether they share a base type and are equal: a `pair` in either order, a
 *   `directedPair` in order, integers and floats by value (`===` compares two bigints by value)
 *   and strings by code point.
 */
const sameSingle = (left: Single, right: Single): boolean => {
  if (left.baseType === "pair" && right.baseType === "pair") {
    const [a, b] = left.value;
    const [c, d] = right.value;

    return (a === c && b === d) || (a === d && b === c);
  }

  if (left.baseType === "directedPair" && right.baseType === "directedPair") {
    return left.value[0] === right.value[0] && left.value[1] === right.value[1];
  }

  return left.baseType === right.baseType && left.value === right.value;
};

/**
 * Report whether two equally long lists hold the same values as multisets.
 *
 * @param left One list.
 * @param right The other list, of the same length.
 * @returns Whether each value of `left` pairs with its own equal value of `right`.
 */
const sameMultiset = (left: readonly Single[], right: readonly Single[]): boolean => {
  const unmatched = [...right];

  return left.every((single) => {
    const index = unmatched.findIndex((other) => sameSingle(single, other));
    if (index === -1) {
      return false;
    }

    unmatched.splice(index, 1);

    return true;
  });
};

/**
 * Report whether two values match, as `qti-match` and `match_correct` compare a response with its
 * correct response.
 *
 * The values must share a base type and a cardinality. `single` compares the one value, `multiple`
 * compares as a multiset (repeats count), and `ordered` as a sequence.
 *
 * @param left One value.
 * @param right The other value.
 * @returns Whether they match; false when either is NULL.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 */
export const match = (left: Value, right: Value): boolean => {
  if (
    isNull(left) ||
    isNull(right) ||
    left.baseType !== right.baseType ||
    left.cardinality !== right.cardinality ||
    left.values.length !== right.values.length
  ) {
    return false;
  }

  return left.cardinality === "multiple"
    ? sameMultiset(left.values, right.values)
    : left.values.every((single, index) => {
        const other = right.values[index];

        return other !== undefined && sameSingle(single, other);
      });
};
