import { assert, describe, it } from "@effect/vitest";
import { Duration, Effect, Option, Result } from "effect";
import { decode, encode, entryName, partition } from "#plate/form/encoding.ts";
import type { Binding, Entry, Malformed } from "#plate/form/encoding.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * The item instance the tests post for.
 */
const instance = "3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b";

/**
 * Another item instance's key.
 */
const otherInstance = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

/**
 * Construct the binding of the response `RESPONSE` for a test.
 *
 * @param baseType The response's base type.
 * @param cardinality The response's cardinality.
 * @returns The binding, named for {@link instance}.
 */
const binding = (
  baseType: Binding["baseType"],
  cardinality: Binding["cardinality"] = "single",
): Binding => ({ baseType, cardinality, name: entryName(instance, "RESPONSE") });

/**
 * Construct the entries a form posts for the response `RESPONSE`.
 *
 * @param values The posted values, in order.
 * @returns One entry for each value, named for {@link instance}.
 */
const posted = (...values: readonly (string | Blob)[]): readonly Entry[] =>
  values.map((value) => [entryName(instance, "RESPONSE"), value]);

/**
 * Construct a value for a test.
 *
 * @param bound The binding whose base type and cardinality the value takes.
 * @param values Its values.
 * @returns The value.
 */
const value = (bound: Binding, ...values: readonly Single[]): Value => ({
  baseType: bound.baseType,
  cardinality: bound.cardinality,
  values,
});

/**
 * Construct an identifier value.
 *
 * @param text The identifier.
 * @returns The value.
 */
const identifier = (text: string): Single => ({ baseType: "identifier", value: text });

/**
 * Encode a value under a binding and decode the entries back.
 *
 * @param bound The binding.
 * @param original The value to send through the form.
 * @returns The value the entries decode to.
 */
const roundTrip = (bound: Binding, original: Value): Effect.Effect<Value, Malformed> =>
  Effect.fromResult(decode(encode(original, bound), bound));

describe("entryName", () => {
  it("[Q-2] names an entry by the instance and the response", () => {
    assert.strictEqual(entryName(instance, "RESPONSE"), `${instance}.RESPONSE`);
  });
});

describe("encode and decode", () => {
  it("[Q-20] decode returns a Result: Malformed for a float that is not a number, 7n for an integer", () => {
    const refused = decode(posted("abc"), binding("float"));
    assert.isTrue(Result.isResult(refused));
    assert.deepStrictEqual(
      Option.map(Result.getFailure(refused), ({ _tag, reason }) => ({ _tag, reason })),
      Option.some({ _tag: "Malformed", reason: "number" }),
    );

    const integer = binding("integer");
    const seven = decode(posted("7"), integer);
    assert.isTrue(Result.isResult(seven));
    assert.deepStrictEqual(
      Result.getSuccess(seven),
      Option.some(value(integer, { baseType: "integer", value: 7n })),
    );
  });

  it.effect("[Q-2] round-trip an identifier single and multiple, in order", () =>
    Effect.gen(function* identifierRoundTrip() {
      const single = binding("identifier");
      const multiple = binding("identifier", "multiple");
      const chosen = value(multiple, identifier("choiceC"), identifier("choiceA"));

      assert.deepStrictEqual(encode(chosen, multiple), posted("choiceC", "choiceA"));
      assert.deepStrictEqual(yield* roundTrip(multiple, chosen), chosen);
      assert.deepStrictEqual(
        yield* roundTrip(single, value(single, identifier("choiceB"))),
        value(single, identifier("choiceB")),
      );
    }),
  );

  it.effect("[Q-20] round-trip a string, an integer and a float single", () =>
    Effect.gen(function* textRoundTrip() {
      const string = value(binding("string"), { baseType: "string", value: " a b " });
      const integer = value(binding("integer"), { baseType: "integer", value: -12n });
      const float = value(binding("float"), { baseType: "float", value: 2.5 });

      assert.deepStrictEqual(yield* roundTrip(binding("string"), string), string);
      assert.deepStrictEqual(yield* roundTrip(binding("integer"), integer), integer);
      assert.deepStrictEqual(yield* roundTrip(binding("float"), float), float);
    }),
  );

  it.effect("[Q-2] encodes NULL as no entries and decodes no entry, or one empty, as NULL", () =>
    Effect.gen(function* nullRoundTrip() {
      const multiple = binding("identifier", "multiple");

      assert.deepStrictEqual(encode(value(multiple), multiple), []);
      assert.deepStrictEqual(yield* Effect.fromResult(decode([], multiple)), value(multiple));
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted(""), binding("identifier"))),
        value(binding("identifier")),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted(""), binding("string"))),
        value(binding("string")),
      );
    }),
  );

  it.effect("[Q-20] refuses abc, INF, -INF and NaN as a float", () =>
    Effect.gen(function* floatRefusals() {
      for (const text of ["abc", "INF", "-INF", "NaN"]) {
        const error = yield* Effect.flip(Effect.fromResult(decode(posted(text), binding("float"))));
        assert.strictEqual(error._tag, "Malformed");
        assert.strictEqual(error.reason, "number");
      }
    }),
  );

  it.effect("[Q-20] reads a float beyond the largest double as the largest finite double", () =>
    Effect.gen(function* floatBeyondRange() {
      const float = binding("float");

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("1E999"), float)),
        value(float, { baseType: "float", value: Number.MAX_VALUE }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("-1E999"), float)),
        value(float, { baseType: "float", value: -Number.MAX_VALUE }),
      );
    }),
  );

  it.effect("[Q-20] trims a number, then reads an integer in its base", () =>
    Effect.gen(function* integerBase() {
      const integer = binding("integer");
      const float = binding("float");

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted(" 7 "), integer)),
        value(integer, { baseType: "integer", value: 7n }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted(" 1E3 "), float)),
        value(float, { baseType: "float", value: 1000 }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("101"), integer, { base: 2 })),
        value(integer, { baseType: "integer", value: 5n }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("-ff"), integer, { base: 16 })),
        value(integer, { baseType: "integer", value: -255n }),
      );

      const error = yield* Effect.flip(
        Effect.fromResult(decode(posted("102"), integer, { base: 2 })),
      );
      assert.strictEqual(error.reason, "number");
    }),
  );

  it.effect("[Q-20] reads a posted integer exactly, beyond the safe integers", () =>
    Effect.gen(function* exactIntegers() {
      const integer = binding("integer");
      const cases: readonly (readonly [string, bigint])[] = [
        ["9007199254740993", 2n ** 53n + 1n],
        [" 1000000000000000000000000000000 ", 10n ** 30n],
        ["-1000000000000000000000000000000", -(10n ** 30n)],
        ["+0009007199254740993", 2n ** 53n + 1n],
      ];

      for (const [text, exact] of cases) {
        assert.deepStrictEqual(
          yield* Effect.fromResult(decode(posted(text), integer)),
          value(integer, { baseType: "integer", value: exact }),
        );
      }
    }),
  );

  it.effect("[Q-20] reads a posted integer exactly in bases 16 and 7", () =>
    Effect.gen(function* exactInBase() {
      const integer = binding("integer");
      const exact = value(integer, { baseType: "integer", value: 2n ** 53n + 1n });

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("20000000000001"), integer, { base: 16 })),
        exact,
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(
          decode(posted((2n ** 53n + 1n).toString(7)), integer, { base: 7 }),
        ),
        exact,
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(
          decode(posted(`-${(10n ** 30n).toString(7)}`), integer, { base: 7 }),
        ),
        value(integer, { baseType: "integer", value: -(10n ** 30n) }),
      );
    }),
  );

  it.live("[Q-20] reads 100,000 base-36 digits exactly in under 200 ms", () =>
    Effect.gen(function* longBase36() {
      const integer = binding("integer");
      const exact = 17n * 36n ** 99_999n + 7n ** 90_000n;
      const spelling = exact.toString(36);
      assert.strictEqual(spelling.length, 100_000);

      const [elapsed, read] = yield* Effect.timed(
        Effect.suspend(() => Effect.fromResult(decode(posted(spelling), integer, { base: 36 }))),
      );
      assert.deepStrictEqual(read, value(integer, { baseType: "integer", value: exact }));
      assert.isBelow(Duration.toMillis(elapsed), 200, Duration.format(elapsed));
    }),
  );

  it.effect("[Q-20] refuses a decimal, INF, a bare sign and a base outside 2 to 36", () =>
    Effect.gen(function* integerRefusals() {
      const integer = binding("integer");
      const cases: readonly (readonly [string, number])[] = [
        ["1.5", 10],
        ["INF", 10],
        ["+", 10],
        ["-", 10],
        ["102", 2],
        ["1", 1],
        ["1", 2.5],
        ["1", 37],
      ];

      for (const [text, base] of cases) {
        const error = yield* Effect.flip(
          Effect.fromResult(decode(posted(text), integer, { base })),
        );
        assert.strictEqual(error._tag, "Malformed");
        assert.strictEqual(error.reason, "number", `${text} in base ${String(base)}`);
      }
    }),
  );

  it.effect("turns a posted CRLF and a lone CR into LF", () =>
    Effect.gen(function* lineFeeds() {
      const string = binding("string");

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("a\r\nb"), string)),
        value(string, { baseType: "string", value: "a\nb" }),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("a\rb\n"), string)),
        value(string, { baseType: "string", value: "a\nb\n" }),
      );
    }),
  );

  it.effect("[Q-2] refuses two entries for a single, a non-NCName and a file", () =>
    Effect.gen(function* refusals() {
      const single = binding("identifier");

      const many = yield* Effect.flip(
        Effect.fromResult(decode(posted("choiceA", "choiceB"), single)),
      );
      assert.strictEqual(many.reason, "single-many");

      const notNcName = yield* Effect.flip(Effect.fromResult(decode(posted("1st"), single)));
      assert.strictEqual(notNcName.reason, "identifier");

      const file = yield* Effect.flip(
        Effect.fromResult(decode(posted(new Blob(["x"])), binding("string"))),
      );
      assert.strictEqual(file.reason, "file");
    }),
  );

  it.effect("decodes only the entries its binding names", () =>
    Effect.gen(function* namedEntries() {
      const single = binding("identifier");
      const entries: readonly Entry[] = [
        [entryName(instance, "OTHER"), "choiceA"],
        [entryName(instance, "RESPONSE"), "choiceB"],
      ];

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(entries, single)),
        value(single, identifier("choiceB")),
      );
    }),
  );
});

describe("partition", () => {
  it("detects a foreign key and sets a host field apart", () => {
    const own: Entry = [entryName(instance, "RESPONSE"), "choiceA"];
    const foreign: Entry = [entryName(otherInstance, "RESPONSE"), "choiceB"];
    const host: Entry = ["csrf-token", "abc"];
    const dotted: Entry = ["section.RESPONSE", "x"];

    assert.deepStrictEqual(partition([host, own, foreign, dotted], instance), {
      foreign: [foreign],
      host: [host, dotted],
      own: [own],
    });
  });
});
