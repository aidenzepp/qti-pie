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
  ["boundedToken", () => str.regex(patterns.boundedToken, patterns.boundedTokenFlags)],
  ["whitespaceOnly", () => str.regex(patterns.whitespaceOnly)],
  [
    "nonWhitespaceText",
    () => str.regex(patterns.nonWhitespaceText, patterns.nonWhitespaceTextFlags),
  ],
  ["uncollapsed", () => str.regex(patterns.uncollapsed, patterns.uncollapsedFlags)],
  ["wildcard", () => str.regex(patterns.wildcard, patterns.wildcardFlags)],
  ["xmlVersion", () => str.regex(patterns.xmlVersion)],
  ["yesNo", () => str.regex(patterns.yesNo)],
  ["base64", () => str.regex(patterns.base64)],
  ["hrefInPackage", () => str.regex(patterns.hrefInPackage)],
  ["anyUri", () => str.regex(patterns.anyUri)],
  ["xsLanguage", () => str.regex(patterns.xsLanguage)],
  ["xsLanguageOrEmpty", () => str.regex(patterns.xsLanguageOrEmpty)],
  ["mimeType", () => str.regex(patterns.mimeType)],
  ["lengthDType", () => str.regex(patterns.lengthDType)],
  ["resourceType", () => str.regex(patterns.resourceType)],
  ["cpSchema", () => str.regex(patterns.cpSchema)],
  ["schemaVersion", () => str.regex(patterns.schemaVersion)],
  ["qmdInteractionType", () => str.regex(patterns.qmdInteractionType)],
  ["qmdFeedbackType", () => str.regex(patterns.qmdFeedbackType)],
  ["qmdScoringMode", () => str.regex(patterns.qmdScoringMode)],
  ["booleanLiteral", () => str.regex(patterns.booleanLiteral)],
  ["externalScored", () => str.regex(patterns.externalScored)],
  ["orientation", () => str.regex(patterns.orientation)],
  ["showHide", () => str.regex(patterns.showHide)],
  ["point", () => str.regex(patterns.point)],
  ["pair", () => str.regex(patterns.pair)],
  ["toolString", () => str.regex(patterns.toolString, patterns.toolStringFlags)],
  ["bcp47", () => str.regex(patterns.bcp47)],
  ["positiveInteger", () => str.regex(patterns.positiveInteger)],
  ["positiveDouble", () => str.regex(patterns.positiveDouble)],
  ["nonNegativeDouble", () => str.regex(patterns.nonNegativeDouble)],
  ["xsDecimal", () => str.regex(patterns.xsDecimal)],
  ["xsInt", () => str.regex(patterns.xsInt)],
  ["integerList", () => str.regex(patterns.integerList)],
  ["integerOrVariableString", () => str.regex(patterns.integerOrVariableString)],
  ["ncNameList", () => str.regex(patterns.ncNameList)],
  ["ncNameListOrEmpty", () => str.regex(patterns.ncNameListOrEmpty)],
  ["viewList", () => str.regex(patterns.viewList)],
  ["useEnumExt", () => str.regex(patterns.useEnumExt)],
  ["mimeTypeList", () => str.regex(patterns.mimeTypeList)],
  ["printfFormat", () => str.regex(patterns.printfFormat)],
  ["classList", () => str.regex(patterns.classList)],
] as const;

/**
 * Whether the pattern admits the value, read through a regular expression of the same flags.
 */
const admits = (source: string, flags: string, value: string): boolean =>
  new RegExp(source, flags).test(value);

/**
 * `count` segments of `length` `a`, joined by `/`.
 */
const segments = (count: number, length: number): string =>
  Array.from({ length: count }, () => "a".repeat(length)).join("/");

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
    for (const value of ["0", "0.0", "0e0", "-1.5E3", "INF", "-INF", "NaN"]) {
      assert.isTrue(admits(patterns.xsDouble, "u", value), value);
    }
    assert.isFalse(admits(patterns.xsDouble, "u", "1,5"));
    assert.isFalse(admits(patterns.xsDouble, "u", "+INF"));
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

  it("hrefInPackage", () => {
    const { hrefInPackage } = patterns;
    for (const value of [
      "images/sign.png",
      "choice.xml",
      "https://x/y.png",
      "Example03-feedbackBlock-solution/Example03-feedbackBlock-solution.xml",
      "items/i15211323542233760/style/custom/tao-user-styles.css",
      "testitems/metadata_747eee11-848c-597a-8c9c-a71c5399798d.xml",
      "\u00EFtem160.xml",
      "http://www.flickr.com/photos/87012937@N00/3590186482/",
      segments(8, 80),
      `${"a".repeat(32)}://x`,
      `http:${"x".repeat(255)}`,
    ]) {
      assert.isTrue(admits(hrefInPackage, "u", value), value);
    }
    for (const value of [
      "../x",
      "a/../b",
      "/x",
      segments(9, 1),
      "a".repeat(81),
      `${"a".repeat(33)}://x`,
      `http:${"x".repeat(256)}`,
    ]) {
      assert.isFalse(admits(hrefInPackage, "u", value), value);
    }
  });

  it("boundedToken", () => {
    const { boundedToken, boundedTokenFlags } = patterns;
    const spaced = Array.from({ length: 256 }, () => "a").join(" ");
    for (const value of [
      "",
      "a b",
      "a".repeat(256),
      spaced,
      "Example Contentpackage with QTI v3.0 items (qti-assessment-item) and a test (qti-assessment-test)",
    ]) {
      assert.isTrue(admits(boundedToken, boundedTokenFlags, value), value);
    }
    for (const value of [" a", "a ", "a  b", "a\tb", "a".repeat(257)]) {
      assert.isFalse(admits(boundedToken, boundedTokenFlags, value), value);
    }
  });

  it("base64", () => {
    assert.isTrue(admits(patterns.base64, "u", "AQID"));
    assert.isTrue(admits(patterns.base64, "u", "AQ=="));
    assert.isFalse(admits(patterns.base64, "u", "A"));
  });

  it("anyUri", () => {
    const { anyUri } = patterns;
    for (const value of [
      "not a uri",
      "ok/path?q#f",
      "https://x/y.png",
      "images/sign.png",
      "a#[x]",
    ]) {
      assert.isTrue(admits(anyUri, "u", value), value);
    }
    for (const value of ["a%zz", "http://[::1", "1a:b", "a?[", " a:b"]) {
      assert.isFalse(admits(anyUri, "u", value), value);
    }
  });

  it("xsLanguageOrEmpty", () => {
    const { xsLanguageOrEmpty } = patterns;
    for (const value of ["en", "de", "en-US", ""]) {
      assert.isTrue(admits(xsLanguageOrEmpty, "u", value), value);
    }
    for (const value of [" en ", "1a", "en-"]) {
      assert.isFalse(admits(xsLanguageOrEmpty, "u", value), value);
    }
    assert.isFalse(admits(patterns.xsLanguage, "u", ""));
  });

  it("cpSchema", () => {
    assert.isTrue(admits(patterns.cpSchema, "u", "QTI Package"));
    assert.isFalse(admits(patterns.cpSchema, "u", "QTI Packages"));
  });

  it("schemaVersion", () => {
    assert.isTrue(admits(patterns.schemaVersion, "u", "3.0.0"));
    assert.isTrue(admits(patterns.schemaVersion, "u", "3.0.1"));
    assert.isFalse(admits(patterns.schemaVersion, "u", "3.0.2"));
  });

  it("the qmd vocabularies", () => {
    assert.isTrue(admits(patterns.qmdInteractionType, "u", "choiceInteraction"));
    assert.isTrue(admits(patterns.qmdFeedbackType, "u", "none"));
    assert.isTrue(admits(patterns.qmdScoringMode, "u", "externalmachine"));
    assert.isFalse(admits(patterns.qmdFeedbackType, "u", "nonadaptiv"));
  });

  it("toolString", () => {
    const { toolString, toolStringFlags } = patterns;
    assert.isTrue(admits(toolString, toolStringFlags, "x".repeat(256)));
    assert.isFalse(admits(toolString, toolStringFlags, "x".repeat(257)));
  });

  it("booleanLiteral", () => {
    assert.isTrue(admits(patterns.booleanLiteral, "u", "true"));
    assert.isFalse(admits(patterns.booleanLiteral, "u", "1"));
  });

  it("pair", () => {
    assert.isTrue(admits(patterns.pair, "u", "A B"));
    assert.isFalse(admits(patterns.pair, "u", "A"));
    assert.isFalse(admits(patterns.pair, "u", "A  B"));
  });

  it("point", () => {
    assert.isTrue(admits(patterns.point, "u", "-1 2"));
    assert.isFalse(admits(patterns.point, "u", "1,2"));
  });

  it("bcp47", () => {
    for (const ok of ["en", "zh-Hant-TW", "x-none", ""]) {
      assert.isTrue(admits(patterns.bcp47, "u", ok), ok);
    }
    for (const bad of ["en--x", "1a"]) {
      assert.isFalse(admits(patterns.bcp47, "u", bad), bad);
    }
  });

  it("positiveInteger", () => {
    assert.isTrue(admits(patterns.positiveInteger, "u", "1"));
    assert.isFalse(admits(patterns.positiveInteger, "u", "0"));
  });

  it("positiveDouble", () => {
    const { positiveDouble } = patterns;
    for (const ok of ["0.5", "1E2"]) {
      assert.isTrue(admits(positiveDouble, "u", ok), ok);
    }
    for (const bad of ["0", "0.0", "0e3", "-1", "INF", "NaN"]) {
      assert.isFalse(admits(positiveDouble, "u", bad), bad);
    }
  });

  it("nonNegativeDouble", () => {
    assert.isTrue(admits(patterns.nonNegativeDouble, "u", "0.0"));
    assert.isFalse(admits(patterns.nonNegativeDouble, "u", "-1"));
  });

  it("xsDecimal and xsInt", () => {
    assert.isTrue(admits(patterns.xsDecimal, "u", "-.5"));
    assert.isFalse(admits(patterns.xsDecimal, "u", "1e3"));
    assert.isTrue(admits(patterns.xsInt, "u", "-42"));
    assert.isFalse(admits(patterns.xsInt, "u", "1.5"));
  });

  it("integerList", () => {
    const { integerList } = patterns;
    for (const ok of ["10 20", "-3", ""]) {
      assert.isTrue(admits(integerList, "u", ok), ok);
    }
    for (const bad of ["1,2", "a"]) {
      assert.isFalse(admits(integerList, "u", bad), bad);
    }
  });

  it("integerOrVariableString", () => {
    const { integerOrVariableString } = patterns;
    assert.isTrue(admits(integerOrVariableString, "u", "16"));
    assert.isTrue(admits(integerOrVariableString, "u", "VAR"));
    assert.isFalse(admits(integerOrVariableString, "u", "1.5"));
  });

  it("ncNameList and ncNameListOrEmpty", () => {
    assert.isTrue(admits(patterns.ncNameListOrEmpty, "u", "A B"));
    assert.isTrue(admits(patterns.ncNameListOrEmpty, "u", ""));
    assert.isFalse(admits(patterns.ncNameListOrEmpty, "u", " A"));
    assert.isTrue(admits(patterns.ncNameList, "u", "A B"));
    assert.isFalse(admits(patterns.ncNameList, "u", ""));
  });

  it("classList", () => {
    const { classList } = patterns;
    for (const ok of ["a", "a b", ""]) {
      assert.isTrue(admits(classList, "u", ok), ok);
    }
    for (const bad of [" a", "a  b"]) {
      assert.isFalse(admits(classList, "u", bad), bad);
    }
  });

  it("viewList", () => {
    assert.isTrue(admits(patterns.viewList, "u", "candidate scorer"));
    assert.isFalse(admits(patterns.viewList, "u", ""));
    assert.isFalse(admits(patterns.viewList, "u", "Candidate"));
  });

  it("useEnumExt", () => {
    assert.isTrue(admits(patterns.useEnumExt, "u", "scoring"));
    assert.isTrue(admits(patterns.useEnumExt, "u", "ext:foo.bar"));
    assert.isFalse(admits(patterns.useEnumExt, "u", "Scoring"));
    assert.isFalse(admits(patterns.useEnumExt, "u", "ext:"));
  });

  it("mimeTypeList", () => {
    const { mimeTypeList } = patterns;
    for (const ok of ["image/png", "image/png text/css", ""]) {
      assert.isTrue(admits(mimeTypeList, "u", ok), ok);
    }
    assert.isFalse(admits(mimeTypeList, "u", "png"));
  });

  it("printfFormat", () => {
    assert.isTrue(admits(patterns.printfFormat, "u", "%.2f"));
    assert.isTrue(admits(patterns.printfFormat, "u", "%i"));
    assert.isFalse(admits(patterns.printfFormat, "u", "%q"));
    assert.isFalse(admits(patterns.printfFormat, "u", "2f"));
  });
});
