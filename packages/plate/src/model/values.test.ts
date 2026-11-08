import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type * as plate from "#plate/index.ts";
import {
  format,
  isModelled,
  isNcName,
  isNull,
  isNullResponse,
  isRecordValue,
  match,
  nullOf,
  parseElementText,
  parseLexical,
  sameRecord,
} from "#plate/model/values.ts";
import type {
  ModelledBaseType,
  RecordField,
  RecordValue,
  ResponseValue,
  Single,
  Value,
} from "#plate/model/values.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";

/**
 * Construct a value for a test.
 *
 * @param baseType The value's base type.
 * @param cardinality The value's cardinality.
 * @param values Its values.
 * @returns The value.
 */
const value = (
  baseType: ModelledBaseType,
  cardinality: Value["cardinality"],
  values: readonly Single[],
): Value => ({ baseType, cardinality, values });

/**
 * Construct identifier values for a test.
 *
 * @param names The identifiers, in order.
 * @returns One identifier value for each name.
 */
const identifiers = (...names: readonly string[]): readonly Single[] =>
  names.map((name) => ({ baseType: "identifier", value: name }));

/**
 * Construct a single pair or directed pair value for a test.
 *
 * @param baseType Which of the two to construct.
 * @param source The first identifier.
 * @param destination The second identifier.
 * @returns The value holding the one pair.
 */
const pair = (baseType: "pair" | "directedPair", source: string, destination: string): Value =>
  value(baseType, "single", [{ baseType, value: [source, destination] }]);

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The package's `RecordValue` is this module's; `tsc` refuses this line when they part.
 */
const recordExported: Equals<plate.RecordValue, RecordValue> = true;

/**
 * The package's `ResponseValue` is this module's; `tsc` refuses this line when they part.
 */
const responseExported: Equals<plate.ResponseValue, ResponseValue> = true;

/**
 * Construct a record for a test.
 *
 * @param fields Its fields, in written order.
 * @returns The record.
 */
const record = (...fields: readonly RecordField[]): RecordValue => ({
  cardinality: "record",
  fields,
});

/**
 * Construct a field of a record for a test.
 *
 * @param identifier The field's identifier.
 * @param single Its value.
 * @returns The field.
 */
const field = (identifier: string, single: Single): RecordField => ({ identifier, value: single });

describe("the record types", () => {
  it("[T-14] record types exported: RecordValue and ResponseValue are the package's own", () => {
    assert.isTrue(recordExported && responseExported);
  });
});

describe("sameRecord", () => {
  const stringValue = field("stringValue", { baseType: "string", value: "1.5" });
  const floatValue = field("floatValue", { baseType: "float", value: 1.5 });

  it("is true for the same fields written in another order", () => {
    assert.isTrue(sameRecord(record(stringValue, floatValue), record(floatValue, stringValue)));
    assert.isTrue(
      sameRecord(
        record(field("pair", { baseType: "pair", value: ["A", "B"] })),
        record(field("pair", { baseType: "pair", value: ["B", "A"] })),
      ),
    );
  });

  it("is false for a field of another base type, a missing field, or another value", () => {
    assert.isFalse(
      sameRecord(
        record(field("integerValue", { baseType: "integer", value: 2n })),
        record(field("integerValue", { baseType: "float", value: 2 })),
      ),
    );
    assert.isFalse(sameRecord(record(stringValue, floatValue), record(stringValue)));
    assert.isFalse(sameRecord(record(stringValue), record(stringValue, floatValue)));
    assert.isFalse(
      sameRecord(
        record(stringValue),
        record(field("stringValue", { baseType: "string", value: "1.50" })),
      ),
    );
    assert.isFalse(sameRecord(record(stringValue), record(floatValue)));
  });

  it("is false for NULL against a record that holds a field, either way round", () => {
    assert.isFalse(sameRecord(record(), record(stringValue)));
    assert.isFalse(sameRecord(record(stringValue), record()));
  });
});

describe("isNullResponse and isRecordValue", () => {
  it("[T-14] take a record with no field as NULL and a record with a field as not", () => {
    const filled = record(field("stringValue", { baseType: "string", value: "a" }));

    assert.isTrue(isNullResponse(record()));
    assert.isFalse(isNullResponse(filled));
    assert.isTrue(isNullResponse(nullOf("integer", "single")));
    assert.isFalse(isNullResponse(value("identifier", "single", identifiers("A"))));
    assert.deepStrictEqual(
      [isRecordValue(filled), isRecordValue(record()), isRecordValue(nullOf("string", "single"))],
      [true, true, false],
    );
  });
});

describe("parseElementText", () => {
  it.effect("[I-1] trims an identifier's outer whitespace and keeps a string's", () =>
    Effect.gen(function* trimsByBaseType() {
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("identifier", " completed ")),
        Option.some<Single>({ baseType: "identifier", value: "completed" }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("string", " a ")),
        Option.some<Single>({ baseType: "string", value: " a " }),
      );
    }),
  );

  it.effect("reads an empty string as NULL and a blank one as a value", () =>
    Effect.gen(function* emptyStringIsNull() {
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("string", "")),
        Option.none(),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("string", " ")),
        Option.some<Single>({ baseType: "string", value: " " }),
      );
    }),
  );

  it.effect("trims tabs and line breaks but keeps a no-break space", () =>
    Effect.gen(function* xmlWhitespaceOnly() {
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("boolean", "\n\ttrue\r\n")),
        Option.some<Single>({ baseType: "boolean", value: true }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("pair", " A \n B ")),
        Option.some<Single>({ baseType: "pair", value: ["A", "B"] }),
      );

      const error = yield* Effect.flip(
        Effect.fromResult(parseElementText("identifier", " completed")),
      );
      assert.strictEqual(error._tag, "InvalidValue");
    }),
  );

  it("returns a Result: none for an empty string, and a trimmed integer as itself", () => {
    const empty = parseElementText("string", "");
    assert.isTrue(Result.isResult(empty));
    assert.deepStrictEqual(Result.getSuccess(empty), Option.some(Option.none()));

    const seven = parseElementText("integer", " 7 ");
    assert.isTrue(Result.isResult(seven));
    assert.deepStrictEqual(
      Result.getSuccess(seven),
      Option.some(Option.some<Single>({ baseType: "integer", value: 7n })),
    );
  });

  it.effect("trims a 100,000-character whitespace run in linear time", () =>
    Effect.gen(function* linearTrim() {
      const run = " \t\n\r".repeat(25_000);
      const shorterRun = " \t\n\r".repeat(25_000 / growthFactor);
      const cases: readonly (readonly [
        ModelledBaseType,
        (whitespace: string) => string,
        Single,
      ])[] = [
        ["identifier", (whitespace) => `${whitespace}x`, { baseType: "identifier", value: "x" }],
        [
          "pair",
          (whitespace) => `A${whitespace}B${whitespace}`,
          { baseType: "pair", value: ["A", "B"] },
        ],
      ];
      for (const [baseType, textOf, single] of cases) {
        const fewer = textOf(shorterRun);
        const more = textOf(run);
        assert.deepStrictEqual(
          yield* Effect.fromResult(parseElementText(baseType, more)),
          Option.some(single),
        );
        assert.deepStrictEqual(
          yield* Effect.fromResult(parseElementText(baseType, fewer)),
          Option.some(single),
        );

        const growth = yield* growthRatio(
          () => {
            parseElementText(baseType, fewer);
          },
          () => {
            parseElementText(baseType, more);
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `${baseType}: 8 times the whitespace took ${growth.toFixed(1)} times as long`,
        );
      }
    }),
  );
});

describe("parseLexical", () => {
  it("returns a Result whose failure is an InvalidValue naming the base type and the text", () => {
    const parsed = parseLexical("integer", "abc");
    assert.isTrue(Result.isResult(parsed));
    assert.deepStrictEqual(
      Option.map(Result.getFailure(parsed), ({ _tag, baseType, lexical }) => ({
        _tag,
        baseType,
        lexical,
      })),
      Option.some({ _tag: "InvalidValue", baseType: "integer", lexical: "abc" }),
    );
  });

  it.effect("refuses 1 and 6 as identifiers", () =>
    Effect.gen(function* digitsAreNotIdentifiers() {
      for (const lexical of ["1", "6"]) {
        const error = yield* Effect.flip(Effect.fromResult(parseLexical("identifier", lexical)));
        assert.strictEqual(error._tag, "InvalidValue");
        assert.strictEqual(error.baseType, "identifier");
        assert.strictEqual(error.lexical, lexical);
      }
    }),
  );

  it.effect("reads true and false and refuses 1 and 0 as booleans", () =>
    Effect.gen(function* booleanLexicalSpace() {
      assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("boolean", "true")), {
        baseType: "boolean",
        value: true,
      });
      assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("boolean", "false")), {
        baseType: "boolean",
        value: false,
      });
      for (const lexical of ["1", "0", "TRUE"]) {
        const error = yield* Effect.flip(Effect.fromResult(parseLexical("boolean", lexical)));
        assert.strictEqual(error._tag, "InvalidValue");
        assert.strictEqual(error.lexical, lexical);
      }
    }),
  );

  it.effect("round-trips integers and floats through format, INF included", () =>
    Effect.gen(function* numbersRoundTrip() {
      const cases: readonly (readonly [ModelledBaseType, string])[] = [
        ["integer", "0"],
        ["integer", "-12"],
        ["integer", "+7"],
        ["integer", "9007199254740991"],
        ["float", "2.5"],
        ["float", "1E3"],
        ["float", ".5"],
        ["float", "1e21"],
        ["float", "-0"],
        ["float", "5e-324"],
        ["float", "INF"],
        ["float", "-INF"],
        ["float", "NaN"],
      ];
      for (const [baseType, lexical] of cases) {
        const single = yield* Effect.fromResult(parseLexical(baseType, lexical));
        const again = yield* Effect.fromResult(parseLexical(baseType, format(single)));
        assert.strictEqual(again.baseType, baseType);
        assert.isTrue(Object.is(single.value, again.value), `${baseType} ${lexical}`);
      }
      assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("float", "INF")), {
        baseType: "float",
        value: Number.POSITIVE_INFINITY,
      });
      assert.strictEqual(format({ baseType: "float", value: Number.NEGATIVE_INFINITY }), "-INF");
      assert.strictEqual(
        format({ baseType: "integer", value: 9_007_199_254_740_991n }),
        "9007199254740991",
      );
    }),
  );

  it.effect("refuses abc as a float and 1.5 as an integer", () =>
    Effect.gen(function* numbersRefused() {
      const float = yield* Effect.flip(Effect.fromResult(parseLexical("float", "abc")));
      assert.strictEqual(float._tag, "InvalidValue");
      assert.strictEqual(float.baseType, "float");

      const integer = yield* Effect.flip(Effect.fromResult(parseLexical("integer", "1.5")));
      assert.strictEqual(integer._tag, "InvalidValue");
      assert.strictEqual(integer.baseType, "integer");
    }),
  );

  it.effect("reads an integer of any size exactly and formats its exact digits", () =>
    Effect.gen(function* integersExact() {
      const cases: readonly (readonly [string, bigint, string])[] = [
        ["9007199254740993", 2n ** 53n + 1n, "9007199254740993"],
        ["1000000000000000000000000000000", 10n ** 30n, "1000000000000000000000000000000"],
        ["-1000000000000000000000000000000", -(10n ** 30n), "-1000000000000000000000000000000"],
        [`1${"0".repeat(400)}`, 10n ** 400n, `1${"0".repeat(400)}`],
        ["+0009007199254740993", 2n ** 53n + 1n, "9007199254740993"],
        ["-0", 0n, "0"],
      ];
      for (const [lexical, integer, digits] of cases) {
        const single = yield* Effect.fromResult(parseLexical("integer", lexical));
        assert.deepStrictEqual(single, { baseType: "integer", value: integer });
        assert.strictEqual(format(single), digits);
      }
    }),
  );

  it.effect("reads a float beyond the largest double as the closest finite double, not INF", () =>
    Effect.gen(function* floatOverflowIsFinite() {
      const cases: readonly (readonly [string, number])[] = [
        ["1e400", Number.MAX_VALUE],
        ["-1E400", -Number.MAX_VALUE],
        ["1e-400", 0],
      ];
      for (const [lexical, number] of cases) {
        assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("float", lexical)), {
          baseType: "float",
          value: number,
        });
      }
    }),
  );

  it.effect(
    "[I-9a] reads a duration as its seconds in an xs:double, never truncated, and refuses an ISO 8601 duration",
    () =>
      Effect.gen(function* durationLexicalSpace() {
        const cases: readonly (readonly [string, number, string])[] = [
          ["90.5", 90.5, "90.5"],
          ["89.95", 89.95, "89.95"],
          ["-1.5", -1.5, "-1.5"],
          ["1E3", 1000, "1000"],
          ["INF", Number.POSITIVE_INFINITY, "INF"],
          ["-INF", Number.NEGATIVE_INFINITY, "-INF"],
          ["NaN", Number.NaN, "NaN"],
        ];
        for (const [lexical, seconds, written] of cases) {
          const single = yield* Effect.fromResult(parseLexical("duration", lexical));
          assert.strictEqual(single.baseType, "duration", lexical);
          assert.isTrue(Object.is(single.value, seconds), lexical);
          assert.strictEqual(format(single), written, lexical);
        }
        for (const lexical of ["PT1M30.5S", "P1D", "PT90S", "90s", ""]) {
          const error = yield* Effect.flip(Effect.fromResult(parseLexical("duration", lexical)));
          assert.strictEqual(error._tag, "InvalidValue", lexical);
          assert.strictEqual(error.baseType, "duration", lexical);
          assert.strictEqual(error.lexical, lexical);
        }
      }),
  );

  it.effect("reads a pair as written and refuses one with outer whitespace", () =>
    Effect.gen(function* pairsAsWritten() {
      const directed = yield* Effect.fromResult(parseLexical("directedPair", "A B"));
      assert.deepStrictEqual(directed, { baseType: "directedPair", value: ["A", "B"] });
      assert.strictEqual(format(directed), "A B");
      for (const lexical of [" A B", "A", "A B C", "A 1"]) {
        const error = yield* Effect.flip(Effect.fromResult(parseLexical("pair", lexical)));
        assert.strictEqual(error._tag, "InvalidValue");
      }
    }),
  );
});

describe("point values", () => {
  it.effect("reads two integers separated by whitespace as an exact point", () =>
    Effect.gen(function* pointRead() {
      assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("point", "102 113")), {
        baseType: "point",
        value: [102n, 113n],
      });
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("point", " 102  113 ")),
        Option.some<Single>({ baseType: "point", value: [102n, 113n] }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(parseElementText("point", "\n\t9007199254740993\r\n-12\t")),
        Option.some<Single>({ baseType: "point", value: [2n ** 53n + 1n, -12n] }),
      );
    }),
  );

  it.effect("reads every point value of the corpus's point items", () =>
    Effect.gen(function* corpusPoints() {
      const cases: readonly (readonly [string, bigint, bigint])[] = [
        ["118 184", 118n, 184n],
        ["150 235", 150n, 235n],
        ["96 114", 96n, 114n],
        ["93 111", 93n, 111n],
        ["216 90", 216n, 90n],
        ["102 113", 102n, 113n],
      ];
      for (const [text, x, y] of cases) {
        assert.deepStrictEqual(
          yield* Effect.fromResult(parseElementText("point", text)),
          Option.some<Single>({ baseType: "point", value: [x, y] }),
          text,
        );
      }
    }),
  );

  it.effect("refuses a non-integer coordinate, one coordinate, words, three and outer space", () =>
    Effect.gen(function* pointsRefused() {
      for (const lexical of ["1.5 2", "102", "a b", "1 2 3", " 102 113", "102,113", ""]) {
        const error = yield* Effect.flip(Effect.fromResult(parseLexical("point", lexical)));
        assert.strictEqual(error._tag, "InvalidValue", JSON.stringify(lexical));
        assert.strictEqual(error.baseType, "point");
        assert.strictEqual(error.lexical, lexical);
      }
      const trimmed = yield* Effect.flip(Effect.fromResult(parseElementText("point", " 1 2 3 ")));
      assert.strictEqual(trimmed.lexical, "1 2 3");
    }),
  );

  it.effect("round-trips a point through format as two runs of decimal digits", () =>
    Effect.gen(function* pointRoundTrip() {
      for (const [lexical, written] of [
        ["102 113", "102 113"],
        ["+0102\t\n-0", "102 0"],
        [`1${"0".repeat(30)} -7`, `1${"0".repeat(30)} -7`],
      ] as const) {
        const single = yield* Effect.fromResult(parseLexical("point", lexical));
        assert.strictEqual(format(single), written, lexical);
        assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("point", written)), single);
      }
    }),
  );
});

describe("format", () => {
  it.effect("writes every value the parser accepts, one case per base type", () =>
    Effect.gen(function* formatIsTotal() {
      const cases: readonly (readonly [ModelledBaseType, string, string])[] = [
        ["identifier", "RESPONSE_1", "RESPONSE_1"],
        ["boolean", "false", "false"],
        ["integer", "-9007199254740991", "-9007199254740991"],
        ["float", "1e400", "1.7976931348623157e+308"],
        ["float", "-INF", "-INF"],
        ["float", "NaN", "NaN"],
        ["string", "a b", "a b"],
        ["pair", "A B", "A B"],
        ["directedPair", "B A", "B A"],
        ["point", "-3 +07", "-3 7"],
        ["duration", "90.50", "90.5"],
        ["uri", "https://example.org/a b", "https://example.org/a b"],
      ];
      for (const [baseType, lexical, written] of cases) {
        const single = yield* Effect.fromResult(parseLexical(baseType, lexical));
        assert.strictEqual(format(single), written, `${baseType} ${lexical}`);
        assert.deepStrictEqual(
          yield* Effect.fromResult(parseLexical(baseType, format(single))),
          single,
        );
      }
    }),
  );
});

describe("isNcName", () => {
  it("accepts NCNames and refuses colons, leading digits and empty text", () => {
    for (const name of ["completed", "_x", "a-b.c", "é1", "χ", "RESPONSE_1"]) {
      assert.isTrue(isNcName(name), name);
    }
    for (const text of ["", "1", "6", "a:b", "-a", ".a", "a b", "a\n"]) {
      assert.isFalse(isNcName(text), JSON.stringify(text));
    }
  });
});

describe("isModelled", () => {
  it("holds every base type but file", () => {
    const modelled = [
      "identifier",
      "boolean",
      "integer",
      "float",
      "string",
      "point",
      "pair",
      "directedPair",
      "duration",
      "uri",
    ];
    for (const baseType of modelled) {
      assert.isTrue(isModelled(baseType), baseType);
    }
    for (const baseType of ["file", "record"]) {
      assert.isFalse(isModelled(baseType), baseType);
    }
  });
});

describe("match", () => {
  it("compares multiple as a multiset and ordered as a sequence", () => {
    const abb = identifiers("A", "B", "B");
    const bab = identifiers("B", "A", "B");
    assert.isTrue(
      match(value("identifier", "multiple", abb), value("identifier", "multiple", bab)),
    );
    assert.isFalse(match(value("identifier", "ordered", abb), value("identifier", "ordered", bab)));
    assert.isTrue(match(value("identifier", "ordered", abb), value("identifier", "ordered", abb)));
    assert.isFalse(
      match(
        value("identifier", "multiple", abb),
        value("identifier", "multiple", identifiers("A", "A", "B")),
      ),
    );
  });

  it("compares a pair in either order and a directedPair in order", () => {
    assert.isTrue(match(pair("pair", "A", "B"), pair("pair", "B", "A")));
    assert.isFalse(match(pair("directedPair", "A", "B"), pair("directedPair", "B", "A")));
    assert.isTrue(match(pair("directedPair", "A", "B"), pair("directedPair", "A", "B")));
  });

  it("holds two points equal only when both coordinates are", () => {
    const point = (x: bigint, y: bigint): Value =>
      value("point", "single", [{ baseType: "point", value: [x, y] }]);
    assert.isTrue(match(point(102n, 113n), point(102n, 113n)));
    assert.isFalse(match(point(102n, 113n), point(113n, 102n)));
    assert.isFalse(match(point(102n, 113n), point(102n, 114n)));
    assert.isFalse(match(point(102n, 113n), point(101n, 113n)));
    assert.isTrue(
      match(
        value("point", "multiple", [
          { baseType: "point", value: [1n, 2n] },
          { baseType: "point", value: [3n, 4n] },
        ]),
        value("point", "multiple", [
          { baseType: "point", value: [3n, 4n] },
          { baseType: "point", value: [1n, 2n] },
        ]),
      ),
    );
  });

  it("is false when either value is NULL", () => {
    const a = value("identifier", "single", identifiers("A"));
    assert.isFalse(match(nullOf("identifier", "single"), nullOf("identifier", "single")));
    assert.isFalse(match(a, nullOf("identifier", "single")));
    assert.isFalse(match(nullOf("identifier", "single"), a));
    assert.isTrue(isNull(nullOf("string", "multiple")));
    assert.isFalse(isNull(a));
  });

  it("compares numbers by value and strings by code point, within one base type", () => {
    const integer = (whole: bigint): Value =>
      value("integer", "single", [{ baseType: "integer", value: whole }]);
    const float = (number: number): Value =>
      value("float", "single", [{ baseType: "float", value: number }]);
    const string = (text: string): Value =>
      value("string", "single", [{ baseType: "string", value: text }]);
    assert.isTrue(match(integer(1n), integer(1n)));
    assert.isTrue(match(float(0), float(-0)));
    assert.isFalse(match(float(Number.NaN), float(Number.NaN)));
    assert.isFalse(match(integer(1n), float(1)));
    assert.isFalse(match(string("a"), string("A")));
    assert.isFalse(
      match(
        value("identifier", "single", identifiers("A")),
        value("identifier", "multiple", identifiers("A")),
      ),
    );
  });
});
