/**
 * `fetched.ts`'s free tests: every element kind and attribute name its lists name is one the
 * composed grammar declares, each list holds rows, and no row repeats.
 */
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * The composed grammar whose `NodeKind` and `AttributeName` rosters the tests read.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The values a list holds more than once.
 *
 * @param values - The list's values.
 * @returns Each repeated value once, in first-repeat order.
 */
const repeatsOf = (values: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      repeated.add(value);
    }

    seen.add(value);
  }

  return [...repeated];
};

describe("fetched", () => {
  it("holds rows in each list", () => {
    assert.isAbove(fetchedAttributes.length, 0);
    assert.isAbove(fetchedTexts.length, 0);
    assert.isAbove(addressLists.length, 0);
  });

  it("names only kinds the composed grammar declares", () => {
    const kinds: readonly string[] = [
      ...fetchedAttributes.map(({ kind }) => kind),
      ...fetchedTexts,
    ];
    assert.deepStrictEqual(
      kinds.filter((kind) => !grammar.kinds.nodeKind.has(kind)),
      [],
    );
  });

  it("names only attribute names the composed grammar declares", () => {
    const names: readonly string[] = [
      ...fetchedAttributes.map(({ name }) => name),
      ...addressLists,
    ];
    assert.deepStrictEqual(
      names.filter((name) => !grammar.kinds.attributeName.has(name)),
      [],
    );
  });

  it("repeats no (kind, name, form), text kind or address list", () => {
    assert.deepStrictEqual(
      repeatsOf(
        fetchedAttributes.map(({ form, kind, name }) => `${kind}\u0000${name}\u0000${form}`),
      ),
      [],
    );
    assert.deepStrictEqual(repeatsOf(fetchedTexts), []);
    assert.deepStrictEqual(repeatsOf(addressLists), []);
  });
});
