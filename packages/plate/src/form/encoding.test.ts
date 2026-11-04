import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
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
  decode(encode(original, bound), bound);

describe("entryName", () => {
  it("[Q-2] names an entry by the instance and the response", () => {
    assert.strictEqual(entryName(instance, "RESPONSE"), `${instance}.RESPONSE`);
  });
});

describe("encode and decode", () => {
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
      const integer = value(binding("integer"), { baseType: "integer", value: -12 });
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
      assert.deepStrictEqual(yield* decode([], multiple), value(multiple));
      assert.deepStrictEqual(
        yield* decode(posted(""), binding("identifier")),
        value(binding("identifier")),
      );
      assert.deepStrictEqual(
        yield* decode(posted(""), binding("string")),
        value(binding("string")),
      );
    }),
  );

  it.effect("[Q-20] refuses abc, INF, NaN and an overflow as a float", () =>
    Effect.gen(function* floatRefusals() {
      for (const text of ["abc", "INF", "-INF", "NaN", "1E999"]) {
        const error = yield* Effect.flip(decode(posted(text), binding("float")));
        assert.strictEqual(error._tag, "Malformed");
        assert.strictEqual(error.reason, "number");
      }
    }),
  );

  it.effect("[Q-20] trims a number, then reads an integer in its base", () =>
    Effect.gen(function* integerBase() {
      const integer = binding("integer");
      const float = binding("float");

      assert.deepStrictEqual(
        yield* decode(posted(" 7 "), integer),
        value(integer, { baseType: "integer", value: 7 }),
      );
      assert.deepStrictEqual(
        yield* decode(posted(" 1E3 "), float),
        value(float, { baseType: "float", value: 1000 }),
      );
      assert.deepStrictEqual(
        yield* decode(posted("101"), integer, { base: 2 }),
        value(integer, { baseType: "integer", value: 5 }),
      );
      assert.deepStrictEqual(
        yield* decode(posted("-ff"), integer, { base: 16 }),
        value(integer, { baseType: "integer", value: -255 }),
      );

      const error = yield* Effect.flip(decode(posted("102"), integer, { base: 2 }));
      assert.strictEqual(error.reason, "number");
    }),
  );

  it.effect("turns a posted CRLF and a lone CR into LF", () =>
    Effect.gen(function* lineFeeds() {
      const string = binding("string");

      assert.deepStrictEqual(
        yield* decode(posted("a\r\nb"), string),
        value(string, { baseType: "string", value: "a\nb" }),
      );
      assert.deepStrictEqual(
        yield* decode(posted("a\rb\n"), string),
        value(string, { baseType: "string", value: "a\nb\n" }),
      );
    }),
  );

  it.effect("[Q-2] refuses two entries for a single, a non-NCName and a file", () =>
    Effect.gen(function* refusals() {
      const single = binding("identifier");

      const many = yield* Effect.flip(decode(posted("choiceA", "choiceB"), single));
      assert.strictEqual(many.reason, "single-many");

      const notNcName = yield* Effect.flip(decode(posted("1st"), single));
      assert.strictEqual(notNcName.reason, "identifier");

      const file = yield* Effect.flip(decode(posted(new Blob(["x"])), binding("string")));
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

      assert.deepStrictEqual(yield* decode(entries, single), value(single, identifier("choiceB")));
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
