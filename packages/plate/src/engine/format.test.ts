import { assert, describe, it } from "@effect/vitest";
import { formatPrinted } from "#plate/engine/format.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * A single value.
 *
 * @param value The one value.
 * @returns The single value holding it.
 */
const single = (value: Single): Value => ({
  baseType: value.baseType,
  cardinality: "single",
  values: [value],
});

/**
 * A single integer.
 *
 * @param value The integer.
 * @returns The value.
 */
const integer = (value: bigint): Value => single({ baseType: "integer", value });

/**
 * A single float.
 *
 * @param value The float.
 * @returns The value.
 */
const float = (value: number): Value => single({ baseType: "float", value });

/**
 * A container of integers.
 *
 * @param cardinality `multiple` or `ordered`.
 * @param values The integers, in order.
 * @returns The value.
 */
const integers = (cardinality: "multiple" | "ordered", values: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality,
  values: values.map((value) => ({ baseType: "integer", value })),
});

/**
 * An ordered container that holds one string a number of times.
 *
 * @param text The string.
 * @param count How many times the container holds it.
 * @returns The value.
 */
const repeatedText = (text: string, count: number): Value => ({
  baseType: "string",
  cardinality: "ordered",
  values: Array.from({ length: count }, () => ({ baseType: "string", value: text })),
});

/**
 * The integer rows of the worked table, `B#format-attribute-of-printed-variable` (Appendix E), as
 * R§4.5 transcribes them: the format, the integer and the text it prints. A `_` in the table is a
 * space here.
 */
const integerRows: readonly (readonly [string, bigint, string])[] = [
  ["%i", -987n, "-987"],
  ["%.4i", -987n, "-0987"],
  ["%.0i", 0n, ""],
  ["%8i", 987n, "     987"],
  ["%2i", 987n, "987"],
  ["%-8i", 987n, "987     "],
  ["%08i", 987n, "00000987"],
  ["%+i", 987n, "+987"],
  ["% i", 987n, " 987"],
  ["%o", 987n, "1733"],
  ["%#o", 987n, "01733"],
  ["%x", 987n, "3db"],
  ["%#x", 987n, "0x3db"],
  ["%X", 987n, "3DB"],
  ["%#X", 987n, "0X3DB"],
];

/**
 * The float rows of the same table: the format, the float and the text it prints.
 */
const floatRows: readonly (readonly [string, number, string])[] = [
  ["%f", 987.654, "987.654000"],
  ["%.2f", 987.654, "987.65"],
  ["%#.0f", 987, "987."],
  ["%e", 987.654, "9.876540e+02"],
  ["%.2e", 987.654, "9.88e+02"],
  ["%E", 987.654, "9.876540E+02"],
  ["%g", 987_654.321, "987654"],
  ["%g", 987, "987"],
  ["%g", 987_654_321, "9.87654e+08"],
  ["%g", 0.0000987654321, "9.87654e-05"],
  ["%#g", 987, "987.000"],
  ["%G", 0.0000987654321, "9.87654E-05"],
  ["%r", 0.0000987654321, "0.0000987654"],
  ["%R", 0.0000987654321, "0.0000987654"],
];

describe("formatPrinted: the worked table (Appendix E)", () => {
  for (const [format, input, output] of integerRows) {
    it(`[I-5] ${format} of the integer ${input.toString()} prints ${JSON.stringify(output)}`, () => {
      assert.strictEqual(formatPrinted(integer(input), { format }), output);
    });
  }

  for (const [format, input, output] of floatRows) {
    it(`[I-5] ${format} of the float ${JSON.stringify(input)} prints ${JSON.stringify(output)}`, () => {
      assert.strictEqual(formatPrinted(float(input), { format }), output);
    });
  }
});

describe("formatPrinted: exact ties round the decimal as written, halves away from zero (G-R2, pending)", () => {
  const ties: readonly (readonly [string, number, string])[] = [
    ["%.1f", 0.25, "0.3"],
    ["%.1f", -0.25, "-0.3"],
    ["%.2f", 2.675, "2.68"],
    ["%.1e", 2.25, "2.3e+00"],
    ["%.2g", 0.125, "0.13"],
    ["%.2r", 0.125, "0.13"],
  ];

  for (const [format, input, output] of ties) {
    it(`[I-5] ${format} of ${JSON.stringify(input)} prints ${output}, not the double's expansion or ties to even`, () => {
      assert.strictEqual(formatPrinted(float(input), { format }), output);
    });
  }

  it("[I-5] a carry past the leading digit moves the exponent: %.1e of 9.96 prints 1.0e+01", () => {
    assert.strictEqual(formatPrinted(float(9.96), { format: "%.1e" }), "1.0e+01");
    assert.strictEqual(formatPrinted(float(0.0996), { format: "%.2g" }), "0.1");
  });
});

describe("formatPrinted: the format's text around the conversion (G-R2, pending)", () => {
  it("[I-5] prints literal text as written and the value in the first conversion: Score: %.1f", () => {
    assert.strictEqual(formatPrinted(float(2.5), { format: "Score: %.1f" }), "Score: 2.5");
  });

  it("[I-5] prints a later conversion as written text: %i of %i", () => {
    assert.strictEqual(formatPrinted(integer(3n), { format: "%i of %i" }), "3 of %i");
  });

  it("[I-5] prints a format with no conversion as written", () => {
    assert.strictEqual(formatPrinted(integer(3n), { format: "points" }), "points");
  });
});

describe("formatPrinted: the default form, with no format (G-R2, pending)", () => {
  it("[I-5] prints an integer as its decimal digits, exactly past 2^53", () => {
    assert.strictEqual(formatPrinted(integer(-987n)), "-987");
    assert.strictEqual(formatPrinted(integer(2n ** 53n + 1n)), "9007199254740993");
  });

  it("[I-5] prints a float as reading 54 writes it, its shortest decimal", () => {
    assert.strictEqual(formatPrinted(float(1.5)), "1.5");
    assert.strictEqual(formatPrinted(float(100)), "100");
    assert.strictEqual(formatPrinted(float(0.1 + 0.2)), "0.30000000000000004");
    assert.strictEqual(formatPrinted(float(1e21)), "1e+21");
  });

  it("[I-5] prints -0 as -0, and the non-finite floats by name", () => {
    assert.strictEqual(formatPrinted(float(-0)), "-0");
    assert.strictEqual(formatPrinted(float(Number.NaN)), "NaN");
    assert.strictEqual(formatPrinted(float(Number.POSITIVE_INFINITY)), "INF");
    assert.strictEqual(formatPrinted(float(Number.NEGATIVE_INFINITY)), "-INF");
  });

  it("[I-5] prints an identifier, a boolean, a string and a point as the value model writes them", () => {
    assert.strictEqual(
      formatPrinted(single({ baseType: "identifier", value: "choiceA" })),
      "choiceA",
    );
    assert.strictEqual(formatPrinted(single({ baseType: "boolean", value: true })), "true");
    assert.strictEqual(formatPrinted(single({ baseType: "string", value: "a b" })), "a b");
    assert.strictEqual(formatPrinted(single({ baseType: "point", value: [3n, -4n] })), "3 -4");
  });

  it("[I-5] prints a non-numeric value in its default form under a format", () => {
    assert.strictEqual(
      formatPrinted(single({ baseType: "identifier", value: "choiceA" }), { format: "%.1f" }),
      "choiceA",
    );
  });
});

describe("formatPrinted: NULL and containers (G-R2, pending)", () => {
  it("[I-5] prints nothing for NULL, with or without a format", () => {
    assert.strictEqual(formatPrinted(nullOf("float", "single")), "");
    assert.strictEqual(formatPrinted(nullOf("integer", "ordered"), { format: "Score: %i" }), "");
  });

  it("[I-5] joins a multiple's values with the delimiter, ; by default", () => {
    assert.strictEqual(formatPrinted(integers("multiple", [1n, 2n, 3n])), "1;2;3");
    assert.strictEqual(
      formatPrinted(integers("multiple", [1n, 2n, 3n]), { delimiter: ", ", format: "%02i" }),
      "01, 02, 03",
    );
  });

  it("[I-5] prints an ordered value's index-th member, counting from 1", () => {
    assert.strictEqual(formatPrinted(integers("ordered", [7n, 8n, 9n]), { index: 1n }), "7");
    assert.strictEqual(formatPrinted(integers("ordered", [7n, 8n, 9n]), { index: 3n }), "9");
  });

  it("[I-5] prints every member joined when the index is out of range or absent", () => {
    const ordered = integers("ordered", [7n, 8n, 9n]);

    assert.strictEqual(formatPrinted(ordered, { index: 4n }), "7;8;9");
    assert.strictEqual(formatPrinted(ordered, { index: 0n }), "7;8;9");
    assert.strictEqual(formatPrinted(ordered), "7;8;9");
  });

  it("[I-5] reads index only for an ordered value, as the information model scopes it", () => {
    assert.strictEqual(formatPrinted(integers("multiple", [7n, 8n]), { index: 1n }), "7;8");
  });
});

describe("formatPrinted: power-form (G-R2, pending)", () => {
  it("[I-5] writes a float's exponent as a power of 10 with the standard's ASCII x when no format is given", () => {
    assert.strictEqual(
      formatPrinted(float(1.5e21), { powerForm: true }),
      "1.5 x 10 to the power 21",
    );
    assert.strictEqual(formatPrinted(float(1e-7), { powerForm: true }), "1 x 10 to the power -7");
  });

  it("[I-5] leaves a float with no exponent, an integer, and any formatted value as they are", () => {
    assert.strictEqual(formatPrinted(float(2.5), { powerForm: true }), "2.5");
    assert.strictEqual(
      formatPrinted(integer(10n ** 22n), { powerForm: true }),
      "10000000000000000000000",
    );
    assert.strictEqual(
      formatPrinted(float(1.5e21), { format: "%e", powerForm: true }),
      "1.500000e+21",
    );
  });
});

describe("formatPrinted: the conversions beyond the worked table", () => {
  it("[I-5] i writes in the base given, and in base 10 for a base outside 2 to 36", () => {
    assert.strictEqual(formatPrinted(integer(987n), { base: 16n, format: "%i" }), "3db");
    assert.strictEqual(formatPrinted(integer(-5n), { base: 2n, format: "%i" }), "-101");
    assert.strictEqual(formatPrinted(integer(987n), { base: 37n, format: "%i" }), "987");
    assert.strictEqual(formatPrinted(integer(987n), { base: 16n, format: "%x" }), "3db");
  });

  it("[I-5] writes an integer's exact value under a float conversion", () => {
    assert.strictEqual(
      formatPrinted(integer(2n ** 53n + 1n), { format: "%.2f" }),
      "9007199254740993.00",
    );
    assert.strictEqual(formatPrinted(integer(-25n), { format: "%.1e" }), "-2.5e+01");
  });

  it("[I-5] truncates a float toward zero under an integer conversion", () => {
    assert.strictEqual(formatPrinted(float(-2.7), { format: "%i" }), "-2");
    assert.strictEqual(formatPrinted(float(255.9), { format: "%#x" }), "0xff");
  });

  it("[I-5] truncates a float's shortest decimal under an integer conversion, never the double's binary value (G-R2, pending)", () => {
    assert.strictEqual(formatPrinted(float(1e23), { format: "%i" }), "100000000000000000000000");
    assert.strictEqual(formatPrinted(float(1e23), { format: "%.0f" }), "100000000000000000000000");
    assert.strictEqual(
      formatPrinted(float(Number(2n ** 53n + 2n)), { format: "%i" }),
      "9007199254740994",
    );
    assert.strictEqual(formatPrinted(float(1.5e300), { format: "%i" }), `15${"0".repeat(299)}`);
    assert.strictEqual(formatPrinted(float(1e21), { format: "%x" }), (10n ** 21n).toString(16));
  });

  it("[I-5] writes the non-finite floats as C does under a conversion, padded with spaces", () => {
    assert.strictEqual(formatPrinted(float(Number.POSITIVE_INFINITY), { format: "%f" }), "inf");
    assert.strictEqual(formatPrinted(float(Number.NEGATIVE_INFINITY), { format: "%E" }), "-INF");
    assert.strictEqual(formatPrinted(float(Number.NaN), { format: "%05g" }), "  nan");
    assert.strictEqual(formatPrinted(float(Number.POSITIVE_INFINITY), { format: "%+i" }), "+inf");
  });

  it("[I-5] keeps the sign of -0 and of a negative that rounds to zero, as C does", () => {
    assert.strictEqual(formatPrinted(float(-0), { format: "%.1f" }), "-0.0");
    assert.strictEqual(formatPrinted(float(-0.04), { format: "%.1f" }), "-0.0");
    assert.strictEqual(formatPrinted(float(-0.5), { format: "%i" }), "0");
  });

  it("[I-5] pads with zeros after the sign, and ignores 0 beside - or an integer precision", () => {
    assert.strictEqual(formatPrinted(float(-2.5), { format: "%08.2f" }), "-0002.50");
    assert.strictEqual(formatPrinted(integer(-42n), { format: "%-06i" }), "-42   ");
    assert.strictEqual(formatPrinted(integer(42n), { format: "%06.3i" }), "   042");
    assert.strictEqual(formatPrinted(integer(255n), { format: "%#08x" }), "0x0000ff");
  });

  it("[I-5] r uses scientific form only when the significant figures are fewer than the integer digits", () => {
    assert.strictEqual(formatPrinted(float(987), { format: "%.2r" }), "9.9e+02");
    assert.strictEqual(formatPrinted(float(987), { format: "%.3r" }), "987");
    assert.strictEqual(formatPrinted(float(987), { format: "%#.4R" }), "987.0");
  });

  it("[I-5] g and r read a precision of 0 as 1, and . alone as 0", () => {
    assert.strictEqual(formatPrinted(float(987), { format: "%.0g" }), "1e+03");
    assert.strictEqual(formatPrinted(float(2.5), { format: "%.f" }), "3");
  });

  it("[I-5] i writes base 10 for any base outside 2 to 36 (G-R2, pending)", () => {
    for (const base of [1n, 0n, -16n, 37n]) {
      assert.strictEqual(formatPrinted(integer(35n), { base, format: "%i" }), "35");
    }
  });

  it("[I-5] writes a negative under o, x or X as - and its magnitude's digits (G-R2, pending)", () => {
    assert.strictEqual(formatPrinted(integer(-255n), { format: "%x" }), "-ff");
    assert.strictEqual(formatPrinted(integer(-8n), { format: "%o" }), "-10");
  });

  it("[I-5] writes an infinity or NaN under i, o, x or X as C writes it under a floating conversion (G-R2, pending)", () => {
    assert.strictEqual(formatPrinted(float(Number.NaN), { format: "%i" }), "nan");
    assert.strictEqual(formatPrinted(float(Number.POSITIVE_INFINITY), { format: "%X" }), "INF");
    assert.strictEqual(formatPrinted(float(Number.NEGATIVE_INFINITY), { format: "%i" }), "-inf");
  });

  it("[I-5] prints nothing, the format's literal text included, for a width or precision past 1,000,000 (G-R2, pending)", () => {
    assert.strictEqual(formatPrinted(integer(5n), { format: "x %1000001i" }), "");
    assert.strictEqual(formatPrinted(float(1.5), { format: "%.1000001f" }), "");
  });

  it("[I-5] prints nothing for a width or precision past 1,000,000, which no host could hold", () => {
    assert.strictEqual(formatPrinted(integer(1n), { format: "%1000001i" }), "");
    assert.strictEqual(formatPrinted(float(1), { format: "%.1000001f" }), "");
    assert.lengthOf(formatPrinted(integer(1n), { format: "%1000000i" }), 1_000_000);
  });
});

describe("formatPrinted: the whole text is bounded at 1,000,000 characters (G-R2, pending)", () => {
  it("[I-5] prints nothing, without throwing, for 600 integers under %999999i and for 1,000,000 strings of 600 characters, whose joined text passes the longest string an engine holds", () => {
    const ones = integers(
      "ordered",
      Array.from({ length: 600 }, () => 1n),
    );

    assert.strictEqual(formatPrinted(ones, { format: "%999999i" }).length, 0);
    assert.strictEqual(formatPrinted(repeatedText("y".repeat(600), 1_000_000)).length, 0);
  });

  it("[I-5] counts each delimiter in the whole text and prints nothing past 1,000,000 characters, a single value included", () => {
    const thousand = repeatedText("y".repeat(999), 1000);
    const long = single({ baseType: "string", value: "y".repeat(1_000_001) });

    assert.strictEqual(formatPrinted(thousand, { delimiter: ";;" }).length, 0);
    assert.strictEqual(formatPrinted(long).length, 0);
  });

  it("[I-5] prints a whole text of up to 1,000,000 characters", () => {
    const longest = single({ baseType: "string", value: "y".repeat(1_000_000) });

    assert.strictEqual(formatPrinted(repeatedText("y".repeat(999), 1000)).length, 999_999);
    assert.strictEqual(formatPrinted(longest).length, 1_000_000);
    assert.strictEqual(
      formatPrinted(integers("ordered", [1n]), { format: "%999999i" }).length,
      999_999,
    );
  });
});
