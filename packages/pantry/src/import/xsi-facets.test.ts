/**
 * The facets of `xsi-facets.ts` that no type of the tables of `seed/xsi.ts` states: `totalDigits`,
 * `fractionDigits`, `length`, `minExclusive` and `maxExclusive`. Each case restricts the judge of a
 * built-in datatype with a synthetic facet row and judges values with it, so what the tables state
 * moves no case.
 */
import { assert, describe, it } from "@effect/vitest";
import { restrictedJudge } from "#pantry/import/xsi-facets.ts";
import { builtinJudge, judged } from "#pantry/import/xsi-judges.ts";
import type { Judge } from "#pantry/import/xsi-judges.ts";
import type { FacetName, SimpleFacetRow } from "#pantry/schema/seed/xsi.ts";
import { typeNamespaces } from "#pantry/schema/seed/xsi.ts";

const context = { ids: new Set<string>(), unique: false };

/**
 * A synthetic facet row of a type no table holds.
 */
const facet = (name: FacetName, value: string): SimpleFacetRow => ({
  facet: name,
  set: "asi",
  type: { local: "synthetic", namespace: typeNamespaces.xs },
  value,
  version: "3.0.1",
});

/**
 * The judge of the built-in datatype `base` restricted by one synthetic facet, `undefined` when the
 * facet is not applied to that datatype.
 */
const restricted = (base: string, name: FacetName, value: string): Judge | undefined => {
  const judge = builtinJudge(base);

  return judge === undefined ? undefined : restrictedJudge(judge, [facet(name, value)]);
};

/**
 * Whether `value` is valid for the datatype `base` restricted by one synthetic facet.
 */
const holds = (base: string, name: FacetName, bound: string, value: string): boolean => {
  const judge = restricted(base, name, bound);

  assert.isDefined(judge, `${name} applies to ${base}`);

  return judged(judge, value, context) === null;
};

describe("totalDigits and fractionDigits", () => {
  it("count the significant digits of a decimal", () => {
    assert.isTrue(holds("decimal", "totalDigits", "3", "123"));
    assert.isTrue(holds("decimal", "totalDigits", "3", "-0.123"));
    assert.isTrue(holds("decimal", "totalDigits", "3", "1.20"));
    assert.isTrue(holds("decimal", "totalDigits", "3", "00012.300"));
    assert.isFalse(holds("decimal", "totalDigits", "3", "1234"));
    assert.isFalse(holds("decimal", "totalDigits", "3", "12.34"));
    assert.isFalse(holds("decimal", "fractionDigits", "2", "1.255"));
    assert.isTrue(holds("decimal", "fractionDigits", "2", "1.25"));
    assert.isTrue(holds("decimal", "fractionDigits", "2", "1.250"));
    assert.isTrue(holds("decimal", "fractionDigits", "0", "12"));
    assert.isFalse(holds("decimal", "fractionDigits", "0", "12.5"));
  });

  it("count the digits of an integer, which has no fraction", () => {
    assert.isTrue(holds("integer", "totalDigits", "3", "-123"));
    assert.isFalse(holds("integer", "totalDigits", "3", "1234"));
    assert.isTrue(holds("integer", "totalDigits", "1", "0"));
    assert.isTrue(holds("integer", "fractionDigits", "0", "42"));
  });

  it("are not applied to a family that is not a decimal or an integer, or with a bound that is no number", () => {
    assert.isUndefined(restricted("string", "totalDigits", "3"));
    assert.isUndefined(restricted("double", "fractionDigits", "2"));
    assert.isUndefined(restricted("decimal", "totalDigits", "many"));
  });
});

describe("length", () => {
  it("counts the characters of a string, a code point as one", () => {
    assert.isTrue(holds("string", "length", "3", "abc"));
    assert.isTrue(holds("string", "length", "3", "a\u{1F600}c"));
    assert.isFalse(holds("string", "length", "3", "ab"));
    assert.isFalse(holds("string", "length", "3", "abcd"));
  });

  it("counts the items of a list, the octets of hexBinary and of base64Binary", () => {
    assert.isTrue(holds("NMTOKENS", "length", "2", "a b"));
    assert.isFalse(holds("NMTOKENS", "length", "2", "a b c"));
    assert.isTrue(holds("hexBinary", "length", "2", "0A0B"));
    assert.isFalse(holds("hexBinary", "length", "2", "0A"));
    assert.isTrue(holds("base64Binary", "length", "3", "QUJD"));
    assert.isTrue(holds("base64Binary", "length", "2", "QUI="));
    assert.isFalse(holds("base64Binary", "length", "3", "QUI="));
  });

  it("is not applied to a number, and a bound that is no number leaves the type unjudged", () => {
    assert.isUndefined(restricted("integer", "length", "3"));
    assert.isUndefined(restricted("string", "length", "three"));
  });
});

describe("minExclusive and maxExclusive", () => {
  it("exclude the bound of an integer", () => {
    assert.isTrue(holds("integer", "minExclusive", "5", "6"));
    assert.isFalse(holds("integer", "minExclusive", "5", "5"));
    assert.isFalse(holds("integer", "minExclusive", "5", "4"));
    assert.isTrue(holds("integer", "maxExclusive", "10", "9"));
    assert.isFalse(holds("integer", "maxExclusive", "10", "10"));
    assert.isFalse(holds("integer", "maxExclusive", "10", "11"));
    assert.isTrue(holds("integer", "minExclusive", "-5", "-4"));
    assert.isFalse(holds("integer", "minExclusive", "-5", "-5"));
  });

  it("compare an integer by value, beyond the range of a double", () => {
    assert.isFalse(holds("integer", "maxExclusive", "9007199254740993", "9007199254740993"));
    assert.isTrue(holds("integer", "maxExclusive", "9007199254740993", "9007199254740992"));
  });

  it("exclude the bound of a decimal", () => {
    assert.isTrue(holds("decimal", "minExclusive", "1.5", "1.6"));
    assert.isFalse(holds("decimal", "minExclusive", "1.5", "1.5"));
    assert.isTrue(holds("decimal", "maxExclusive", "1.5", "1.4"));
    assert.isFalse(holds("decimal", "maxExclusive", "1.5", "1.5"));
  });

  it("exclude the bound of a double, with INF and NaN", () => {
    assert.isTrue(holds("double", "minExclusive", "0", "INF"));
    assert.isFalse(holds("double", "minExclusive", "0", "NaN"));
    assert.isFalse(holds("double", "maxExclusive", "INF", "INF"));
    assert.isTrue(holds("double", "maxExclusive", "INF", "1e300"));
    assert.isFalse(holds("double", "maxExclusive", "2.5", "NaN"));
  });

  it("are not applied to a string, nor with an integer bound that is no integer", () => {
    assert.isUndefined(restricted("string", "minExclusive", "a"));
    assert.isUndefined(restricted("integer", "maxExclusive", "1.5"));
  });
});
