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
  ["nonCanonicalInteger", () => str.regex(patterns.nonCanonicalInteger)],
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
  ["coordsRect", () => str.regex(patterns.coordsRect)],
  ["coordsEllipse", () => str.regex(patterns.coordsEllipse)],
  ["coordsCircle", () => str.regex(patterns.coordsCircle)],
  ["coordsPoly", () => str.regex(patterns.coordsPoly)],
  ["coordsAny", () => str.regex(patterns.coordsAny)],
  ["ariaRole", () => str.regex(patterns.ariaRole)],
  ["ariaAutocomplete", () => str.regex(patterns.ariaAutocomplete)],
  ["ariaChecked", () => str.regex(patterns.ariaChecked)],
  ["ariaCurrent", () => str.regex(patterns.ariaCurrent)],
  ["ariaExpanded", () => str.regex(patterns.ariaExpanded)],
  ["ariaInvalid", () => str.regex(patterns.ariaInvalid)],
  ["ariaLive", () => str.regex(patterns.ariaLive)],
  ["ariaOrientation", () => str.regex(patterns.ariaOrientation)],
  ["ariaPressed", () => str.regex(patterns.ariaPressed)],
  ["ariaSelected", () => str.regex(patterns.ariaSelected)],
  ["ariaSort", () => str.regex(patterns.ariaSort)],
  ["ariaRelevantList", () => str.regex(patterns.ariaRelevantList)],
  ["autoplayEnum", () => str.regex(patterns.autoplayEnum)],
  ["loopEnum", () => str.regex(patterns.loopEnum)],
  ["mutedEnum", () => str.regex(patterns.mutedEnum)],
  ["controlsEnum", () => str.regex(patterns.controlsEnum)],
  ["defaultEnum", () => str.regex(patterns.defaultEnum)],
  ["dirEnum", () => str.regex(patterns.dirEnum)],
  ["suppressTts", () => str.regex(patterns.suppressTts)],
  ["valuetype", () => str.regex(patterns.valuetype)],
  ["scope", () => str.regex(patterns.scope)],
  ["align", () => str.regex(patterns.align)],
  ["valign", () => str.regex(patterns.valign)],
  ["preload", () => str.regex(patterns.preload)],
  ["crossorigin", () => str.regex(patterns.crossorigin)],
  ["trackKind", () => str.regex(patterns.trackKind)],
  ["textFormat", () => str.regex(patterns.textFormat)],
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

/**
 * `n` copies of `part`, joined by `-`.
 */
const dashed = (n: number, part: string): string => Array.from({ length: n }, () => part).join("-");

/**
 * An `xs:language` tag of `subtags` subtags.
 */
const subtagTag = (subtags: number): string => `en-${dashed(subtags - 1, "a1")}`;

/**
 * The 74 values of `@role` in `imsqti_asiv3p0p1_v1p0.xsd` lines 24413 to 24486, in the XSD's order.
 */
const roles =
  "article columnheader definition document group heading img list listitem math note presentation region row rowgroup rowheader separator toolbar button checkbox gridcell link log option radio slider spinbutton status tab tabpanel textbox timer listbox radiogroup tablist complementary contentinfo alert alertdialog application banner combobox dialog form grid main marquee menu menubar menuitem menuitemcheckbox menuitemradio navigation progressbar scrollbar search tooltip tree treegrid treeitem searchbox switch term figure code time subscript superscript meter generic insertion deletion strong emphasis".split(
    " ",
  );

describe("patterns", () => {
  it("roles lists the 74 values", () => {
    assert.strictEqual(new Set(roles).size, 74);
  });

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

  it("nonCanonicalInteger", () => {
    for (const value of ["+5", "05", "-0", "-05"]) {
      assert.isTrue(admits(patterns.nonCanonicalInteger, "u", value), JSON.stringify(value));
    }
    for (const value of ["5", "0", "-5", ""]) {
      assert.isFalse(admits(patterns.nonCanonicalInteger, "u", value), JSON.stringify(value));
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

  it("xsLanguage bounds its subtags at 128", () => {
    assert.isTrue(admits(patterns.xsLanguage, "u", subtagTag(128)));
    assert.isFalse(admits(patterns.xsLanguage, "u", subtagTag(129)));
  });

  it("xsLanguageOrEmpty bounds its subtags at 128 and admits the empty string", () => {
    const { xsLanguageOrEmpty } = patterns;
    assert.isTrue(admits(xsLanguageOrEmpty, "u", subtagTag(128)));
    assert.isFalse(admits(xsLanguageOrEmpty, "u", subtagTag(129)));
    assert.isTrue(admits(xsLanguageOrEmpty, "u", ""));
  });

  it("bcp47 bounds variants, extensions and private-use subtags", () => {
    const { bcp47, xsLanguage } = patterns;
    const cases: readonly (readonly [string, (n: number) => string])[] = [
      ["variants", (n) => `en-${dashed(n, "abcde")}`],
      ["extensions", (n) => `en-${dashed(n, "a-bb")}`],
      ["extension subtags", (n) => `en-a-${dashed(n, "bb")}`],
      ["private-use subtags", (n) => `en-x-${dashed(n, "p")}`],
      ["whole private-use subtags", (n) => `x-${dashed(n, "p")}`],
    ];
    for (const [name, build] of cases) {
      assert.isTrue(admits(bcp47, "u", build(8)), `${name}: 8`);
      assert.isFalse(admits(bcp47, "u", build(9)), `${name}: 9`);
    }
    const widest = [
      "en",
      "aaa",
      "bbb",
      "ccc",
      "Latn",
      "US",
      dashed(8, "abcde"),
      dashed(8, `a-${dashed(8, "bb")}`),
      `x-${dashed(8, "p")}`,
    ].join("-");
    assert.isTrue(admits(bcp47, "u", widest));
    assert.isTrue(admits(xsLanguage, "u", widest));
    assert.isTrue(admits(patterns.xsLanguageOrEmpty, "u", widest));
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

  it("coords patterns judge the tokens of CoordsDType, a percent sign included", () => {
    const { coordsAny, coordsCircle, coordsEllipse, coordsPoly, coordsRect } = patterns;
    assert.isTrue(admits(coordsRect, "u", "1,2,3,4"));
    assert.isTrue(admits(coordsRect, "u", "1%,2,3%,4"));
    assert.isFalse(admits(coordsRect, "u", "1,2,3"));
    assert.isFalse(admits(coordsRect, "u", "1, 2,3,4"));
    assert.isTrue(admits(coordsEllipse, "u", "1,2,3,4"));
    assert.isFalse(admits(coordsEllipse, "u", "1,2,3,4,5"));
    assert.isTrue(admits(coordsCircle, "u", "1,2,3"));
    assert.isFalse(admits(coordsCircle, "u", "1,2,3,4"));
    assert.isFalse(admits(coordsPoly, "u", "1,2,3,4"));
    assert.isFalse(admits(coordsPoly, "u", "1,2,3,4,5,6,7"));
    assert.isTrue(admits(coordsPoly, "u", "1,2,3,4,5,6"));
    assert.isTrue(admits(coordsPoly, "u", "1%,2,3,4,5,6"));
    assert.isTrue(admits(coordsPoly, "u", "1,2,3,4,5,6,7,8"));
    for (const value of ["1,2,3", "1,2,3,4", "1,2,3,4,5,6", "1,2,3,4,5,6,7,8"]) {
      assert.isTrue(admits(coordsAny, "u", value), value);
    }
    for (const value of ["1,2", "1,2,3,4,5", "1,2,3,4,5,6,7", "", "a,b,c", "1,2,"]) {
      assert.isFalse(admits(coordsAny, "u", value), value);
    }
  });

  it("ariaRole", () => {
    assert.isTrue(admits(patterns.ariaRole, "u", "heading"));
    assert.isTrue(admits(patterns.ariaRole, "u", "tab"));
    assert.isFalse(admits(patterns.ariaRole, "u", "Heading"));
    assert.isFalse(admits(patterns.ariaRole, "u", "head"));
    assert.isFalse(admits(patterns.ariaRole, "u", "heading tab"));
    for (const role of roles) {
      assert.isTrue(admits(patterns.ariaRole, "u", role), role);
      assert.isFalse(admits(patterns.ariaRole, "u", `${role}x`), role);
    }
  });

  it("ariaRelevantList admits the empty list and refuses an unknown token", () => {
    const { ariaRelevantList } = patterns;
    for (const value of ["additions text", "", "all", "removals"]) {
      assert.isTrue(admits(ariaRelevantList, "u", value), JSON.stringify(value));
    }
    for (const value of ["extra", "additions extra", "additions  text", " text"]) {
      assert.isFalse(admits(ariaRelevantList, "u", value), JSON.stringify(value));
    }
  });

  it("the ARIA token enumerations", () => {
    assert.isTrue(admits(patterns.ariaLive, "u", "polite"));
    assert.isFalse(admits(patterns.ariaLive, "u", "loud"));
    assert.isTrue(admits(patterns.ariaOrientation, "u", "vertical"));
    assert.isTrue(admits(patterns.ariaAutocomplete, "u", "both"));
    assert.isTrue(admits(patterns.ariaChecked, "u", "mixed"));
    assert.isTrue(admits(patterns.ariaPressed, "u", "mixed"));
    assert.isFalse(admits(patterns.ariaExpanded, "u", "mixed"));
    assert.isFalse(admits(patterns.ariaSelected, "u", "mixed"));
    assert.isTrue(admits(patterns.ariaInvalid, "u", "spelling"));
    assert.isTrue(admits(patterns.ariaSort, "u", "other"));
    assert.isTrue(admits(patterns.ariaCurrent, "u", "location"));
    assert.isFalse(admits(patterns.ariaCurrent, "u", "mixed"));
  });

  it("the version booleans of 3.0.1 take the true, the false and the attribute name", () => {
    const cases = [
      [patterns.autoplayEnum, "autoplay"],
      [patterns.loopEnum, "loop"],
      [patterns.mutedEnum, "muted"],
      [patterns.controlsEnum, "controls"],
      [patterns.defaultEnum, "default"],
    ] as const;
    for (const [source, name] of cases) {
      for (const value of ["true", "false", name]) {
        assert.isTrue(admits(source, "u", value), value);
      }
      assert.isFalse(admits(source, "u", "yes"));
      assert.isFalse(admits(source, "u", "1"));
    }
  });

  it("the enumerations typed as text", () => {
    assert.isTrue(admits(patterns.dirEnum, "u", "rtl"));
    assert.isFalse(admits(patterns.dirEnum, "u", "LTR"));
    assert.isTrue(admits(patterns.suppressTts, "u", "screen-reader"));
    assert.isFalse(admits(patterns.suppressTts, "u", "none"));
    assert.isTrue(admits(patterns.valuetype, "u", "DATA"));
    assert.isFalse(admits(patterns.valuetype, "u", "data"));
    assert.isTrue(admits(patterns.scope, "u", "colgroup"));
    assert.isFalse(admits(patterns.scope, "u", "cell"));
    assert.isTrue(admits(patterns.align, "u", "justify"));
    assert.isFalse(admits(patterns.align, "u", "top"));
    assert.isTrue(admits(patterns.valign, "u", "baseline"));
    assert.isFalse(admits(patterns.valign, "u", "left"));
    assert.isTrue(admits(patterns.preload, "u", "metadata"));
    assert.isFalse(admits(patterns.preload, "u", "true"));
    assert.isTrue(admits(patterns.crossorigin, "u", "use-credentials"));
    assert.isFalse(admits(patterns.crossorigin, "u", ""));
    assert.isTrue(admits(patterns.trackKind, "u", "subtitles"));
    assert.isFalse(admits(patterns.trackKind, "u", "subtitle"));
    assert.isTrue(admits(patterns.textFormat, "u", "xhtml"));
    assert.isFalse(admits(patterns.textFormat, "u", "html"));
  });
});

/**
 * The phase-3 list and coordinate patterns are this phase's regex-budget experiment: each is built
 * into a one-field relation, because grizzle refuses a source that is too complex when `relation`
 * is called, never at `str.regex` or `tsc`. The engine exposes no field validator without a
 * database, so admit and refuse are asserted through `new RegExp(source, "u")` on the same source.
 */
describe("processing patterns", () => {
  const probes = [
    [
      "identifierList",
      () =>
        relation("PidentifierList", { id: uuid, v: str.regex(patterns.identifierList) }, ["id"]),
    ],
    [
      "toleranceList",
      () => relation("PtoleranceList", { id: uuid, v: str.regex(patterns.toleranceList) }, ["id"]),
    ],
    ["coords", () => relation("Pcoords", { id: uuid, v: str.regex(patterns.coords) }, ["id"])],
  ] as const;

  for (const [name, probe] of probes) {
    it.effect(`grizzle builds a relation over ${name}`, () =>
      Effect.try(() => probe()).pipe(Effect.asVoid),
    );
  }

  it("coords", () => {
    const { coords } = patterns;
    for (const value of ["0,0,10,10", "50%,50%,10"]) {
      assert.isTrue(admits(coords, "u", value), value);
    }
    for (const value of ["0,0", "0,0,10,10 ", "0, 0, 10, 10"]) {
      assert.isFalse(admits(coords, "u", value), value);
    }
  });

  it("identifierList", () => {
    const { identifierList } = patterns;
    for (const value of ["", "A", "A B"]) {
      assert.isTrue(admits(identifierList, "u", value), value);
    }
    for (const value of ["A,B", " A B", "A  B"]) {
      assert.isFalse(admits(identifierList, "u", value), value);
    }
  });

  it("toleranceList", () => {
    const { toleranceList } = patterns;
    for (const value of ["", "0.5", "0.5 1", "T"]) {
      assert.isTrue(admits(toleranceList, "u", value), value);
    }
    for (const value of ["0.5,1", "0.5 1 "]) {
      assert.isFalse(admits(toleranceList, "u", value), value);
    }
  });

  const referenceProbes = [
    [
      "integerOrVariableRef",
      () =>
        relation(
          "PintegerOrVariableRef",
          { id: uuid, v: str.regex(patterns.integerOrVariableRef) },
          ["id"],
        ),
    ],
    [
      "floatOrVariableRef",
      () =>
        relation("PfloatOrVariableRef", { id: uuid, v: str.regex(patterns.floatOrVariableRef) }, [
          "id",
        ]),
    ],
    [
      "intOrIdentifier",
      () =>
        relation("PintOrIdentifier", { id: uuid, v: str.regex(patterns.intOrIdentifier) }, ["id"]),
    ],
    [
      "baseType",
      () => relation("PbaseType", { id: uuid, v: str.regex(patterns.baseType) }, ["id"]),
    ],
    [
      "toleranceMode",
      () => relation("PtoleranceMode", { id: uuid, v: str.regex(patterns.toleranceMode) }, ["id"]),
    ],
    [
      "roundingMode",
      () => relation("ProundingMode", { id: uuid, v: str.regex(patterns.roundingMode) }, ["id"]),
    ],
    ["shape", () => relation("Pshape", { id: uuid, v: str.regex(patterns.shape) }, ["id"])],
    [
      "mathOperatorName",
      () =>
        relation("PmathOperatorName", { id: uuid, v: str.regex(patterns.mathOperatorName) }, [
          "id",
        ]),
    ],
    [
      "statsOperatorName",
      () =>
        relation("PstatsOperatorName", { id: uuid, v: str.regex(patterns.statsOperatorName) }, [
          "id",
        ]),
    ],
    [
      "mathConstantName",
      () =>
        relation("PmathConstantName", { id: uuid, v: str.regex(patterns.mathConstantName) }, [
          "id",
        ]),
    ],
    [
      "xincludeParse",
      () => relation("PxincludeParse", { id: uuid, v: str.regex(patterns.xincludeParse) }, ["id"]),
    ],
  ] as const;

  for (const [name, probe] of referenceProbes) {
    it.effect(`grizzle builds a relation over ${name}`, () =>
      Effect.try(() => probe()).pipe(Effect.asVoid),
    );
  }

  it("integerOrVariableRef", () => {
    const { integerOrVariableRef } = patterns;
    for (const value of ["3", "-3", "+3", "N"]) {
      assert.isTrue(admits(integerOrVariableRef, "u", value), value);
    }
    for (const value of [" N ", "3 N", "3.0"]) {
      assert.isFalse(admits(integerOrVariableRef, "u", value), value);
    }
  });

  it("floatOrVariableRef", () => {
    const { floatOrVariableRef } = patterns;
    for (const value of ["0.5", "1e3", "N"]) {
      assert.isTrue(admits(floatOrVariableRef, "u", value), value);
    }
    assert.isFalse(admits(floatOrVariableRef, "u", " 0.5"));
  });

  it("intOrIdentifier", () => {
    const { intOrIdentifier } = patterns;
    for (const value of ["1", "N"]) {
      assert.isTrue(admits(intOrIdentifier, "u", value), value);
    }
    assert.isFalse(admits(intOrIdentifier, "u", "1.5"));
  });

  /**
   * Each enumeration admits exactly the XSD values and refuses a padded, a re-cased and a
   * prefix-only form of the first.
   */
  const enumerations = [
    [
      "baseType",
      patterns.baseType,
      "boolean directedPair duration file float identifier integer pair point string uri",
    ],
    ["toleranceMode", patterns.toleranceMode, "absolute exact relative"],
    ["roundingMode", patterns.roundingMode, "decimalPlaces significantFigures"],
    ["shape", patterns.shape, "circle default ellipse poly rect"],
    [
      "mathOperatorName",
      patterns.mathOperatorName,
      "sin cos tan sec csc cot asin acos atan atan2 asec acsc acot sinh cosh tanh sech csch coth log ln exp abs signum floor ceil toDegrees toRadians",
    ],
    [
      "statsOperatorName",
      patterns.statsOperatorName,
      "mean sampleVariance sampleSD popVariance popSD",
    ],
    ["mathConstantName", patterns.mathConstantName, "pi e"],
    ["xincludeParse", patterns.xincludeParse, "xml text"],
  ] as const;

  for (const [name, source, values] of enumerations) {
    it(`${name} admits exactly its XSD values`, () => {
      const members = values.split(" ");
      for (const value of members) {
        assert.isTrue(admits(source, "u", value), value);
      }
      const [first = ""] = members;
      for (const value of [` ${first}`, `${first} `, `${first.toUpperCase()}x`, `${first}x`, ""]) {
        assert.isFalse(admits(source, "u", value), JSON.stringify(value));
      }
    });
  }

  it("toleranceMode refuses a padded or re-cased value", () => {
    assert.isFalse(admits(patterns.toleranceMode, "u", " exact"));
    assert.isFalse(admits(patterns.toleranceMode, "u", "Exact"));
  });

  it("shape refuses rectangle", () => {
    assert.isFalse(admits(patterns.shape, "u", "rectangle"));
  });

  it("mathOperatorName refuses sign", () => {
    assert.isTrue(admits(patterns.mathOperatorName, "u", "signum"));
    assert.isFalse(admits(patterns.mathOperatorName, "u", "sign"));
  });
});
