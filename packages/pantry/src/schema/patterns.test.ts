import { relation, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#pantry/schema/patterns.ts";

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
  ["base64", () => str.regex(patterns.base64)],
  ["hrefInPackage", () => str.regex(patterns.hrefInPackage)],
  ["anyUri", () => str.regex(patterns.anyUri)],
  ["xsLanguage", () => str.regex(patterns.xsLanguage)],
  ["xsLanguageOrEmpty", () => str.regex(patterns.xsLanguageOrEmpty)],
  ["mimeType", () => str.regex(patterns.mimeType)],
  ["lengthDType", () => str.regex(patterns.lengthDType)],
  ["resourceType", () => str.regex(patterns.resourceType)],
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
  ["ariaRelevantList", () => str.regex(patterns.ariaRelevantList)],
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
 * Every export of `patterns.ts`, sorted: the 53 open, 2 list and 11 media-extension patterns of the
 * closed-vocabulary classification, `nonCanonicalInteger`, and the `*Flags` constants. A pattern
 * that a roster replaced is not among them.
 */
const exportNames = [
  "anyUri",
  "ariaRelevantList",
  "base64",
  "bcp47",
  "boundedToken",
  "boundedTokenFlags",
  "classList",
  "coords",
  "coordsAny",
  "coordsCircle",
  "coordsEllipse",
  "coordsPoly",
  "coordsRect",
  "drdAccessMode",
  "drdAccessModeAdapted",
  "drdAdaptationDetail",
  "drdAdaptationMediaType",
  "drdAdaptationType",
  "drdApiInteroperable",
  "drdControlFlexibility",
  "drdDisplayTransformability",
  "drdEducationalComplexityOfAdaptation",
  "drdExt",
  "drdHazard",
  "encName",
  "floatOrVariableRef",
  "hrefInPackage",
  "identifierList",
  "intOrIdentifier",
  "integerList",
  "integerOrVariableRef",
  "integerOrVariableString",
  "lengthDType",
  "mimeType",
  "mimeTypeList",
  "ncName",
  "ncNameList",
  "ncNameListOrEmpty",
  "ncNameOrEmpty",
  "nonCanonicalInteger",
  "nonNegativeDouble",
  "nonWhitespaceText",
  "nonWhitespaceTextFlags",
  "pair",
  "point",
  "positiveDouble",
  "positiveInteger",
  "printfFormat",
  "qName",
  "resourceType",
  "toleranceList",
  "toolString",
  "toolStringFlags",
  "uncollapsed",
  "uncollapsedFlags",
  "usageDate",
  "useEnumExt",
  "viewList",
  "whitespaceOnly",
  "wildcard",
  "wildcardFlags",
  "xmlVersion",
  "xsDecimal",
  "xsDouble",
  "xsInt",
  "xsInteger",
  "xsLanguage",
  "xsLanguageOrEmpty",
  "xsNonNegativeInteger",
  "xsNormalizedString",
  "xsNormalizedStringFlags",
  "xsString",
  "xsStringFlags",
  "xsToken",
  "xsTokenFlags",
] as const;

describe("patterns", () => {
  it("exports exactly the open, list and media-extension patterns and their flags", () => {
    assert.deepStrictEqual(Object.keys(patterns).toSorted(), [...exportNames]);
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

  it("toolString", () => {
    const { toolString, toolStringFlags } = patterns;
    assert.isTrue(admits(toolString, toolStringFlags, "x".repeat(256)));
    assert.isFalse(admits(toolString, toolStringFlags, "x".repeat(257)));
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

  it("ariaRelevantList admits the empty list and refuses an unknown token", () => {
    const { ariaRelevantList } = patterns;
    for (const value of ["additions text", "", "all", "removals"]) {
      assert.isTrue(admits(ariaRelevantList, "u", value), JSON.stringify(value));
    }
    for (const value of ["extra", "additions extra", "additions  text", " text"]) {
      assert.isFalse(admits(ariaRelevantList, "u", value), JSON.stringify(value));
    }
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
});
