import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  checkInstance,
  decode,
  encode,
  entryName,
  isXmlText,
  partition,
} from "#plate/form/encoding.ts";
import type { Binding, Entry, Malformed } from "#plate/form/encoding.ts";
import { format } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";

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
 * Construct a string value.
 *
 * @param text The string.
 * @returns The value.
 */
const stringOf = (text: string): Single => ({ baseType: "string", value: text });

/**
 * Encode a value under a binding and decode the entries back.
 *
 * @param bound The binding.
 * @param original The value to send through the form.
 * @returns The value the entries decode to.
 */
const roundTrip = (bound: Binding, original: Value): Effect.Effect<Value, Malformed> =>
  Effect.fromResult(decode(encode(original, bound), bound));

/**
 * The digits the Q-20 growth check reads first, before it reads {@link growthFactor} times as many.
 */
const fewerDigits = 12_500;

/**
 * The quadratic control reads 100,000 digits three times, about 1.5 s alone; under load that nears
 * vitest's default of 5 s.
 */
const controlTimeoutMs = 60_000;

/**
 * Measure how a parse's CPU time grows with its digits, through {@link growthRatio}: on the first
 * {@link fewerDigits} digits and on {@link growthFactor} times as many.
 *
 * @param spelling The digits, at least `fewerDigits * growthFactor` of them.
 * @param parse The parse to time.
 * @returns How many times as long the parse took on the larger prefix as on the smaller.
 */
const digitGrowth = (spelling: string, parse: (digits: string) => void): Effect.Effect<number> => {
  const fewer = spelling.slice(0, fewerDigits);
  const more = spelling.slice(0, fewerDigits * growthFactor);

  return growthRatio(
    () => {
      parse(fewer);
    },
    () => {
      parse(more);
    },
  );
};

/**
 * The growth check's control, a deliberately quadratic parse: a per-digit `total * 36n + digit`
 * loop, which copies the whole bigint at every digit.
 *
 * @param digits Base-36 digits.
 * @returns The integer the digits name.
 */
const parseQuadratically = (digits: string): bigint => {
  let total = 0n;
  for (const digit of digits) {
    total = total * 36n + BigInt(Number.parseInt(digit, 36));
  }

  return total;
};

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

  it.effect(
    "[Q-20] reads 100,000 base-36 digits exactly, 8 times the digits in under 32 times the time",
    () =>
      Effect.gen(function* longBase36() {
        const integer = binding("integer");
        const exact = 17n * 36n ** 99_999n + 7n ** 90_000n;
        const spelling = exact.toString(36);
        assert.strictEqual(spelling.length, 100_000);

        const read = yield* Effect.fromResult(decode(posted(spelling), integer, { base: 36 }));
        assert.deepStrictEqual(read, value(integer, { baseType: "integer", value: exact }));

        const growth = yield* digitGrowth(spelling, (digits) => {
          decode(posted(digits), integer, { base: 36 });
        });
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the digits took ${growth.toFixed(1)} times as long`,
        );
      }),
  );

  it.effect(
    "[Q-20] control: a quadratic parse fails the growth check",
    () =>
      Effect.gen(function* quadraticControl() {
        const spelling = "z".repeat(fewerDigits * growthFactor);
        assert.strictEqual(parseQuadratically("zz"), 35n * 36n + 35n);

        const growth = yield* digitGrowth(spelling, (digits) => {
          parseQuadratically(digits);
        });
        assert.isAtLeast(
          growth,
          growthLimit,
          `8 times the digits took ${growth.toFixed(1)} times as long`,
        );
      }),
    controlTimeoutMs,
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

  it.effect("decodes an ordered container's filled Controls in the order they were posted", () =>
    Effect.gen(function* orderedContainer() {
      const ordered = binding("string", "ordered");

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("a", "", "b"), ordered)),
        value(ordered, stringOf("a"), stringOf("b")),
      );
      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("b", "", "a"), ordered)),
        value(ordered, stringOf("b"), stringOf("a")),
      );
    }),
  );

  it.effect("decodes a multiple container's filled Controls as their multiset", () =>
    Effect.gen(function* multipleContainer() {
      const multiple = binding("string", "multiple");
      const decoded = yield* Effect.fromResult(decode(posted("a", "", "b"), multiple));

      assert.strictEqual(decoded.baseType, "string");
      assert.strictEqual(decoded.cardinality, "multiple");
      assert.deepStrictEqual(
        decoded.values.map(format).toSorted((left, right) => left.localeCompare(right)),
        ["a", "b"],
      );
    }),
  );

  it.effect("decodes an ordered container whose Controls are all empty as NULL", () =>
    Effect.gen(function* emptyContainer() {
      const ordered = binding("string", "ordered");

      assert.deepStrictEqual(
        yield* Effect.fromResult(decode(posted("", "", ""), ordered)),
        value(ordered),
      );
    }),
  );
});

describe("isXmlText", () => {
  it("refuses a control character other than tab and the line breaks, U+FFFE, U+FFFF and a lone surrogate", () => {
    for (const text of [
      "a\u0000b",
      "a\u000Bb",
      "a\u001Fb",
      "a\uFFFEb",
      "a\uFFFFb",
      "a\uD800b",
      "\uDC00",
    ]) {
      assert.isFalse(isXmlText(text), JSON.stringify(text));
    }
  });

  it("admits tab, the line breaks, the empty text and an astral character", () => {
    for (const text of ["", "a\tb\nc\rd", "a\u{1F600}b", "\u{10FFFF}", "\uFFFD\uE000\uD7FF"]) {
      assert.isTrue(isXmlText(text), JSON.stringify(text));
    }
  });
});

describe("checkInstance", () => {
  it("refuses an empty token first", () => {
    assert.deepStrictEqual(checkInstance(""), Option.some("non-empty"));
  });

  it("refuses a character outside ASCII letters, digits, _, ., : and -", () => {
    for (const token of ["a b", "«r1»", "q1/2", "é"]) {
      assert.deepStrictEqual(checkInstance(token), Option.some("characters"), token);
    }
  });

  it("refuses a trailing - and a --, which would let a chrome id meet an authored id", () => {
    for (const token of ["ab-", "a--b", "-", "--"]) {
      assert.deepStrictEqual(checkInstance(token), Option.some("id-boundary"), token);
    }
  });

  it("admits React's useId forms, a lowercase UUID and a plain token", () => {
    for (const token of ["_r_1_", ":r1:", "q1", "a.b", instance, crypto.randomUUID()]) {
      assert.deepStrictEqual(checkInstance(token), Option.none(), token);
    }
  });
});

describe("partition", () => {
  it("takes an entry as this instance's for any valid token, by the <instance>. prefix", () => {
    const own: Entry = ["q1.RESPONSE", "A"];
    assert.deepStrictEqual(partition([own], "q1").own, [own]);

    const react: Entry = ["_r_1_.RESPONSE", "A"];
    assert.deepStrictEqual(partition([react], "_r_1_").own, [react]);
  });

  it("takes a longer token's entry as a host field, not as this instance's", () => {
    const longer: Entry = ["q10.RESPONSE", "A"];
    assert.deepStrictEqual(partition([longer], "q1"), { foreign: [], host: [longer], own: [] });
  });

  it("takes another UUID's entry as foreign, and a name with no dot as a host field", () => {
    const foreign: Entry = [entryName(otherInstance, "RESPONSE"), "B"];
    const bare: Entry = ["RESPONSE", "C"];
    assert.deepStrictEqual(partition([foreign, bare], "q1"), {
      foreign: [foreign],
      host: [bare],
      own: [],
    });
  });

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
