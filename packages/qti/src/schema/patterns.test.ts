import { relation, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * One builder per source, each constructing the text field its convention gives it: `"su"` where a
 * sibling `<name>Flags` constant exists, otherwise grizzle's default `"u"`. Each call stays apart
 * so the type-level regex check sees one literal source at a time.
 */
const fields = [
  ["ncName", () => str.regex(patterns.ncName)],
  ["ncNameOrEmpty", () => str.regex(patterns.ncNameOrEmpty)],
  ["qName", () => str.regex(patterns.qName)],
  ["encName", () => str.regex(patterns.encName)],
  ["xsBoolean", () => str.regex(patterns.xsBoolean)],
  ["xsNonNegativeInteger", () => str.regex(patterns.xsNonNegativeInteger)],
  ["xsInteger", () => str.regex(patterns.xsInteger)],
  ["xsDouble", () => str.regex(patterns.xsDouble)],
  ["xsString", () => str.regex(patterns.xsString, patterns.xsStringFlags)],
  [
    "xsNormalizedString",
    () => str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  ],
  ["xsToken", () => str.regex(patterns.xsToken, patterns.xsTokenFlags)],
  ["whitespaceOnly", () => str.regex(patterns.whitespaceOnly)],
  [
    "nonWhitespaceText",
    () => str.regex(patterns.nonWhitespaceText, patterns.nonWhitespaceTextFlags),
  ],
  ["uncollapsed", () => str.regex(patterns.uncollapsed, patterns.uncollapsedFlags)],
  ["wildcard", () => str.regex(patterns.wildcard, patterns.wildcardFlags)],
  ["xmlVersion", () => str.regex(patterns.xmlVersion)],
  ["yesNo", () => str.regex(patterns.yesNo)],
] as const;

/**
 * Whether the pattern admits the value, read through a regular expression of the same flags.
 */
const admits = (source: string, flags: string, value: string): boolean =>
  new RegExp(source, flags).test(value);

describe("patterns", () => {
  describe("grizzle builds a relation over each source", () => {
    for (const [name, field] of fields) {
      it.effect(name, () =>
        Effect.try(() => relation("P", { id: uuid, v: field() }, ["id"])).pipe(Effect.asVoid),
      );
    }
  });

  it("ncName", () => {
    const { ncName } = patterns;
    assert.isTrue(admits(ncName, "u", "choice"));
    assert.isTrue(admits(ncName, "u", "RESPONSE"));
    assert.isFalse(admits(ncName, "u", "1a"));
    assert.isFalse(admits(ncName, "u", "a:b"));
    assert.isFalse(admits(ncName, "u", ""));
  });

  it("qName", () => {
    assert.isTrue(admits(patterns.qName, "u", "imsmd:lom"));
    assert.isTrue(admits(patterns.qName, "u", "lom"));
    assert.isFalse(admits(patterns.qName, "u", "a:b:c"));
  });

  it("xsBoolean", () => {
    assert.isTrue(admits(patterns.xsBoolean, "u", "1"));
    assert.isFalse(admits(patterns.xsBoolean, "u", "yes"));
  });

  it("xsDouble", () => {
    for (const value of ["0", "0.0", "0e0", "-1.5E3", "INF"]) {
      assert.isTrue(admits(patterns.xsDouble, "u", value), value);
    }
    assert.isFalse(admits(patterns.xsDouble, "u", "1,5"));
  });

  it("xsToken", () => {
    const { xsToken, xsTokenFlags } = patterns;
    assert.isTrue(admits(xsToken, xsTokenFlags, "a b"));
    assert.isFalse(admits(xsToken, xsTokenFlags, " a"));
    assert.isFalse(admits(xsToken, xsTokenFlags, "a  b"));
  });

  it("whitespaceOnly", () => {
    assert.isTrue(admits(patterns.whitespaceOnly, "u", "\r\n  "));
    assert.isFalse(admits(patterns.whitespaceOnly, "u", "a"));
  });

  it("nonWhitespaceText", () => {
    const { nonWhitespaceText, nonWhitespaceTextFlags } = patterns;
    assert.isTrue(admits(nonWhitespaceText, nonWhitespaceTextFlags, " a "));
    assert.isFalse(admits(nonWhitespaceText, nonWhitespaceTextFlags, "   "));
  });

  it("uncollapsed", () => {
    const { uncollapsed, uncollapsedFlags } = patterns;
    for (const value of [" true", "a  b", "a\tb"]) {
      assert.isTrue(admits(uncollapsed, uncollapsedFlags, value), JSON.stringify(value));
    }
    for (const value of ["true", "a b", ""]) {
      assert.isFalse(admits(uncollapsed, uncollapsedFlags, value), JSON.stringify(value));
    }
  });

  it("xsString and xsNormalizedString admit every whitespace character and the empty string", () => {
    for (const value of ["a\tb", "a\nb", "a\rb", ""]) {
      assert.isTrue(admits(patterns.xsString, patterns.xsStringFlags, value));
      assert.isTrue(admits(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags, value));
    }
  });

  it("xmlVersion", () => {
    assert.isTrue(admits(patterns.xmlVersion, "u", "1.0"));
    assert.isFalse(admits(patterns.xmlVersion, "u", "2.0"));
  });

  it("yesNo", () => {
    assert.isFalse(admits(patterns.yesNo, "u", "true"));
    assert.isTrue(admits(patterns.yesNo, "u", "yes"));
  });
});
