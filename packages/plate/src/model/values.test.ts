import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import {
  Value,
  format,
  isModelled,
  isNcName,
  isNull,
  match,
  nullOf,
  parseElementText,
  parseLexical,
} from "#plate/model/values.ts";
import type { ModelledBaseType, Single } from "#plate/model/values.ts";

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
 * Construct untyped input for the Value Schema, with cardinality `single`.
 *
 * @param baseType The input's base type, possibly not a modelled one.
 * @param values Its values, possibly not ones the base type holds.
 * @returns The input object.
 */
const singleInput = (baseType: string, values: readonly object[]) => ({
  baseType,
  cardinality: "single",
  values,
});

describe("parseElementText", () => {
  it.effect("[I-1] trims an identifier's outer whitespace and keeps a string's", () =>
    Effect.gen(function* trimsByBaseType() {
      assert.deepStrictEqual(
        yield* parseElementText("identifier", " completed "),
        Option.some<Single>({ baseType: "identifier", value: "completed" }),
      );
      assert.deepStrictEqual(
        yield* parseElementText("string", " a "),
        Option.some<Single>({ baseType: "string", value: " a " }),
      );
    }),
  );

  it.effect("reads an empty string as NULL and a blank one as a value", () =>
    Effect.gen(function* emptyStringIsNull() {
      assert.deepStrictEqual(yield* parseElementText("string", ""), Option.none());
      assert.deepStrictEqual(
        yield* parseElementText("string", " "),
        Option.some<Single>({ baseType: "string", value: " " }),
      );
    }),
  );

  it.effect("trims tabs and line breaks but keeps a no-break space", () =>
    Effect.gen(function* xmlWhitespaceOnly() {
      assert.deepStrictEqual(
        yield* parseElementText("boolean", "\n\ttrue\r\n"),
        Option.some<Single>({ baseType: "boolean", value: true }),
      );
      assert.deepStrictEqual(
        yield* parseElementText("pair", " A \n B "),
        Option.some<Single>({ baseType: "pair", value: ["A", "B"] }),
      );

      const error = yield* Effect.flip(parseElementText("identifier", " completed"));
      assert.strictEqual(error._tag, "InvalidValue");
    }),
  );
});

describe("parseLexical", () => {
  it.effect("refuses 1 and 6 as identifiers", () =>
    Effect.gen(function* digitsAreNotIdentifiers() {
      for (const lexical of ["1", "6"]) {
        const error = yield* Effect.flip(parseLexical("identifier", lexical));
        assert.strictEqual(error._tag, "InvalidValue");
        assert.strictEqual(error.baseType, "identifier");
        assert.strictEqual(error.lexical, lexical);
      }
    }),
  );

  it.effect("reads true and false and refuses 1 and 0 as booleans", () =>
    Effect.gen(function* booleanLexicalSpace() {
      assert.deepStrictEqual(yield* parseLexical("boolean", "true"), {
        baseType: "boolean",
        value: true,
      });
      assert.deepStrictEqual(yield* parseLexical("boolean", "false"), {
        baseType: "boolean",
        value: false,
      });
      for (const lexical of ["1", "0", "TRUE"]) {
        const error = yield* Effect.flip(parseLexical("boolean", lexical));
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
        ["integer", "1000000000000000000000"],
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
        const single = yield* parseLexical(baseType, lexical);
        const again = yield* parseLexical(baseType, format(single));
        assert.strictEqual(again.baseType, baseType);
        assert.isTrue(Object.is(single.value, again.value), `${baseType} ${lexical}`);
      }
      assert.deepStrictEqual(yield* parseLexical("float", "INF"), {
        baseType: "float",
        value: Number.POSITIVE_INFINITY,
      });
      assert.strictEqual(format({ baseType: "float", value: Number.NEGATIVE_INFINITY }), "-INF");
      assert.strictEqual(format({ baseType: "integer", value: 1e21 }), "1000000000000000000000");
    }),
  );

  it.effect("refuses abc as a float and 1.5 as an integer", () =>
    Effect.gen(function* numbersRefused() {
      const float = yield* Effect.flip(parseLexical("float", "abc"));
      assert.strictEqual(float._tag, "InvalidValue");
      assert.strictEqual(float.baseType, "float");

      const integer = yield* Effect.flip(parseLexical("integer", "1.5"));
      assert.strictEqual(integer._tag, "InvalidValue");
      assert.strictEqual(integer.baseType, "integer");
    }),
  );

  it.effect("reads a pair as written and refuses one with outer whitespace", () =>
    Effect.gen(function* pairsAsWritten() {
      const directed = yield* parseLexical("directedPair", "A B");
      assert.deepStrictEqual(directed, { baseType: "directedPair", value: ["A", "B"] });
      assert.strictEqual(format(directed), "A B");
      for (const lexical of [" A B", "A", "A B C", "A 1"]) {
        const error = yield* Effect.flip(parseLexical("pair", lexical));
        assert.strictEqual(error._tag, "InvalidValue");
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
  it("holds every base type but point, duration and file", () => {
    const modelled = [
      "identifier",
      "boolean",
      "integer",
      "float",
      "string",
      "pair",
      "directedPair",
      "uri",
    ];
    for (const baseType of modelled) {
      assert.isTrue(isModelled(baseType), baseType);
    }
    for (const baseType of ["point", "duration", "file", "record"]) {
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

  it("is false when either value is NULL", () => {
    const a = value("identifier", "single", identifiers("A"));
    assert.isFalse(match(nullOf("identifier", "single"), nullOf("identifier", "single")));
    assert.isFalse(match(a, nullOf("identifier", "single")));
    assert.isFalse(match(nullOf("identifier", "single"), a));
    assert.isTrue(isNull(nullOf("string", "multiple")));
    assert.isFalse(isNull(a));
  });

  it("compares numbers by value and strings by code point, within one base type", () => {
    const integer = (number: number): Value =>
      value("integer", "single", [{ baseType: "integer", value: number }]);
    const float = (number: number): Value =>
      value("float", "single", [{ baseType: "float", value: number }]);
    const string = (text: string): Value =>
      value("string", "single", [{ baseType: "string", value: text }]);
    assert.isTrue(match(integer(1), integer(1)));
    assert.isTrue(match(float(0), float(-0)));
    assert.isFalse(match(float(Number.NaN), float(Number.NaN)));
    assert.isFalse(match(integer(1), float(1)));
    assert.isFalse(match(string("a"), string("A")));
    assert.isFalse(
      match(
        value("identifier", "single", identifiers("A")),
        value("identifier", "multiple", identifiers("A")),
      ),
    );
  });
});

describe("Value", () => {
  it.effect("encodes and decodes through its Schema", () =>
    Effect.gen(function* valueRoundTrips() {
      const values: readonly Value[] = [
        value("identifier", "multiple", identifiers("A", "B", "B")),
        value("pair", "single", [{ baseType: "pair", value: ["A", "B"] }]),
        value("float", "ordered", [
          { baseType: "float", value: 2.5 },
          { baseType: "float", value: Number.POSITIVE_INFINITY },
        ]),
        value("integer", "single", [{ baseType: "integer", value: 1e21 }]),
        value("boolean", "single", [{ baseType: "boolean", value: true }]),
        value("string", "single", [{ baseType: "string", value: " a " }]),
        nullOf("uri", "single"),
      ];
      for (const original of values) {
        const encoded = yield* Schema.encodeEffect(Value)(original);
        const decoded = yield* Schema.decodeUnknownEffect(Value)(encoded);
        assert.deepStrictEqual(decoded, original);
      }
    }),
  );

  it("refuses a value of another base type, an invalid value and two values in a single", () => {
    const valid = Schema.is(Value);
    assert.isTrue(valid(singleInput("integer", [{ baseType: "integer", value: 1 }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "float", value: 1 }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: "1" }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: 1.5 }])));
    assert.isFalse(valid(singleInput("identifier", [{ baseType: "identifier", value: "1" }])));
    assert.isFalse(valid(singleInput("pair", [{ baseType: "pair", value: ["A", "1"] }])));
    assert.isFalse(valid(singleInput("string", [{ baseType: "string", value: "" }])));
    assert.isFalse(valid(singleInput("identifier", identifiers("A", "B"))));
    assert.isFalse(valid(singleInput("point", [])));
    assert.isFalse(valid({ baseType: "identifier", cardinality: "record", values: [] }));
  });
});
