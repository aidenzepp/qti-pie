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
  it("[I-5] writes a float's exponent as a power of 10 when no format is given", () => {
    assert.strictEqual(
      formatPrinted(float(1.5e21), { powerForm: true }),
      "1.5 × 10 to the power 21",
    );
    assert.strictEqual(formatPrinted(float(1e-7), { powerForm: true }), "1 × 10 to the power -7");
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

  it("[I-5] prints nothing for a width or precision past 1,000,000, which no host could hold", () => {
    assert.strictEqual(formatPrinted(integer(1n), { format: "%1000001i" }), "");
    assert.strictEqual(formatPrinted(float(1), { format: "%.1000001f" }), "");
    assert.lengthOf(formatPrinted(integer(1n), { format: "%1000000i" }), 1_000_000);
  });
});
