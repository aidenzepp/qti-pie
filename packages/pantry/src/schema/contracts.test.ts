import { readFileSync } from "node:fs";
import { str } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as contracts from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { Qti } from "#pantry/schema/qti.ts";
import * as valueContracts from "#pantry/schema/value-contracts.ts";

/**
 * The 146 contracts of the schema tightening (the 136 of the dry run `p13-d1` and the eleven of
 * phase 5, less `SectionReference`, which phase 5 retyped away), from the dry run `p13-d1` (its
 * list (c)): the 254 contracts the contracts document lists as present after the canonical wave,
 * less none, over 264 columns. Sorted.
 */
const derived = [
  "AccessMode",
  "AccessModeAdapted",
  "AdaptiveRefHref",
  "AdaptiveRefIdentifier",
  "AriaInteger",
  "AriaPositiveInteger",
  "CaseItemUri",
  "CategoryList",
  "ChoiceCount",
  "ChoiceIdentifier",
  "CitationUri",
  "ClassList",
  "ContainerWidth",
  "ContentLanguage",
  "ContentMediaType",
  "CustomOperatorClassName",
  "CustomOperatorDefinitionUri",
  "DeclaredDirectedPairValue",
  "DeclaredDurationValue",
  "DeclaredFloatValue",
  "DeclaredIdentifierValue",
  "DeclaredIntegerValue",
  "DeclaredPairValue",
  "DeclaredPointValue",
  "DeclaredUriValue",
  "DrdAdaptationUri",
  "EmbedSourceUri",
  "ExpectedLength",
  "ExpectedLines",
  "ExpressionCoords",
  "ExpressionIntegerOrVariable",
  "FileMediaType",
  "GlossaryUri",
  "HyperlinkUri",
  "IdReference",
  "InterpolationDefaultDirectedPairValue",
  "InterpolationDefaultDurationValue",
  "InterpolationDefaultFloatValue",
  "InterpolationDefaultIdentifierValue",
  "InterpolationDefaultIntegerValue",
  "InterpolationDefaultPairValue",
  "InterpolationDefaultPointValue",
  "InterpolationDefaultUriValue",
  "InterpolationSourceValue",
  "InterpolationTargetDirectedPairValue",
  "InterpolationTargetDurationValue",
  "InterpolationTargetFloatValue",
  "InterpolationTargetIdentifierValue",
  "InterpolationTargetIntegerValue",
  "InterpolationTargetPairValue",
  "InterpolationTargetPointValue",
  "InterpolationTargetUriValue",
  "ItemRefHref",
  "LangStringLanguage",
  "LiteralDirectedPairValue",
  "LiteralDurationValue",
  "LiteralFloatValue",
  "LiteralIdentifierValue",
  "LiteralIntegerValue",
  "LiteralPairValue",
  "LiteralPointValue",
  "LiteralUriValue",
  "LomToken",
  "LomVocabularySource",
  "LomVocabularyValue",
  "LongDescriptionUri",
  "LongInterpretationUri",
  "ManifestIdentifier",
  "MapKeyDirectedPairValue",
  "MapKeyDurationValue",
  "MapKeyFloatValue",
  "MapKeyIdentifierValue",
  "MapKeyIntegerValue",
  "MapKeyPairValue",
  "MapKeyPointValue",
  "MapKeyUriValue",
  "MappedVariableName",
  "MappingScore",
  "MatchDefaultDirectedPairValue",
  "MatchDefaultDurationValue",
  "MatchDefaultFloatValue",
  "MatchDefaultIdentifierValue",
  "MatchDefaultIntegerValue",
  "MatchDefaultPairValue",
  "MatchDefaultPointValue",
  "MatchDefaultUriValue",
  "MatchGroupList",
  "MatchSourceValue",
  "MatchTargetDirectedPairValue",
  "MatchTargetDurationValue",
  "MatchTargetFloatValue",
  "MatchTargetIdentifierValue",
  "MatchTargetIntegerValue",
  "MatchTargetPairValue",
  "MatchTargetPointValue",
  "MatchTargetUriValue",
  "MathmlBaseValue",
  "MathmlCbytesValue",
  "MathmlCdValue",
  "MathmlCdgroupValue",
  "MathmlDefinitionUrlValue",
  "MathmlIndexValue",
  "MathmlNameValue",
  "MathmlNargsValue",
  "MathmlPositionValue",
  "MathmlScriptlevelValue",
  "MathmlSelectionValue",
  "MathmlShiftValue",
  "MathmlSpanValue",
  "MathmlSrcValue",
  "MediaRectCoords",
  "NamespacePrefix",
  "NamespaceUri",
  "OutcomeScaleValue",
  "PackagePath",
  "PiTarget",
  "PrintedVariableIntegerOrVariable",
  "RecordFieldIdentifier",
  "RectCoords",
  "ResourceEntryHref",
  "SectionRefHref",
  "ShapeCoords",
  "ShowHideIdentifier",
  "SliderBound",
  "StatisticContextUri",
  "StatisticMeasure",
  "StatisticName",
  "StimulusRefHref",
  "StimulusRefIdentifier",
  "StringCount",
  "StylesheetUri",
  "TableSpan",
  "TemplateLocationUri",
  "TemplateParameterName",
  "TemplateUri",
  "TestStructureIdentifier",
  "TimeLimitSeconds",
  "ToolName",
  "ToolVendor",
  "ToolVersion",
  "TrackLanguage",
  "UsageCaseCount",
  "UsageDirectedPairValue",
  "UsageDurationValue",
  "UsageFieldIdentifier",
  "UsageFloatValue",
  "UsageIdentifierValue",
  "UsageIntegerValue",
  "UsageMappingScore",
  "UsagePairValue",
  "UsagePartIdentifier",
  "UsagePointValue",
  "UsageUriValue",
  "UsageValueToken",
  "VariableReference",
  "WeightReference",
  "WeightValue",
  "XIncludeUri",
  "XmlBaseUri",
  "XmlEntityName",
];

/**
 * The five contracts the wildcard phase writes out beside the 146 above (the foreign element's
 * local name and the four `xlink:` names). Sorted.
 */
const wildcard = [
  "XlinkArcroleUri",
  "XlinkHrefUri",
  "XlinkLabelName",
  "XlinkRoleUri",
  "XmlLocalName",
] as const;

/**
 * A contract as the tests read it: its name.
 */
interface Named {
  readonly name: string;
}

/**
 * The names of the contracts of one context's arms.
 */
const armNames = (byBase: Readonly<Record<string, Named>>): readonly string[] =>
  Object.values(byBase).map((made) => made.name);

/**
 * The names of every contract the two modules make: the written-out ones and the 64 minted arms.
 */
const everyName = () => {
  const minted: Readonly<Record<string, Readonly<Record<string, Named>>>> =
    valueContracts.valueArmContracts();

  return {
    arms: Object.values(minted).flatMap(armNames),
    written: Object.values<Named>(contracts).map((made) => made.name),
  };
};

/**
 * The module specifiers a source file imports, read from its `import ... from "..."` lines.
 */
const importsOf = (path: URL): readonly string[] =>
  [...readFileSync(path, "utf-8").matchAll(/^import\b[^;]*?from\s+"(?<specifier>[^"]+)";/gmsu)].map(
    (found) => found.groups?.["specifier"] ?? "",
  );

describe("schema/contracts", () => {
  it("imports only the patterns module, so it cannot sit on a cycle through value.ts", () => {
    assert.deepStrictEqual(
      importsOf(new URL("contracts.ts", import.meta.url)).filter(
        (specifier) => !specifier.startsWith("@") && specifier !== "#pantry/schema/patterns.ts",
      ),
      [],
    );
  });

  it("makes the 165 contracts the dry run and phases 5 and 6 derived (160) and the wildcard phase adds (five)", () => {
    const { arms, written } = everyName();

    assert.strictEqual(written.length, 101);
    assert.strictEqual(arms.length, 64);
    assert.deepStrictEqual([...written, ...arms].toSorted(), [...derived, ...wildcard].toSorted());
  });

  it("makes the eleven contracts of phase 5 over their base patterns", () => {
    const eleven: readonly (readonly [
      { readonly base: { readonly pattern: { readonly source: string } }; readonly name: string },
      string,
      string,
    ])[] = [
      [contracts.TestStructureIdentifier, "TestStructureIdentifier", patterns.ncName],
      [contracts.StimulusRefIdentifier, "StimulusRefIdentifier", patterns.ncName],
      [contracts.AdaptiveRefIdentifier, "AdaptiveRefIdentifier", patterns.ncName],
      [contracts.MappedVariableName, "MappedVariableName", patterns.ncName],
      [contracts.ItemRefHref, "ItemRefHref", patterns.anyUri],
      [contracts.SectionRefHref, "SectionRefHref", patterns.anyUri],
      [contracts.StimulusRefHref, "StimulusRefHref", patterns.anyUri],
      [contracts.AdaptiveRefHref, "AdaptiveRefHref", patterns.anyUri],
      [contracts.WeightValue, "WeightValue", patterns.xsDouble],
      [contracts.TimeLimitSeconds, "TimeLimitSeconds", patterns.nonNegativeDouble],
      [contracts.SliderBound, "SliderBound", patterns.nonNegativeDouble],
    ];

    for (const [made, name, base] of eleven) {
      assert.strictEqual(made.name, name);
      assert.strictEqual(made.base.pattern.source, base, name);
    }
  });

  it("names no contract twice", () => {
    const { arms, written } = everyName();

    const names = [...written, ...arms];
    assert.strictEqual(new Set(names).size, names.length);
  });

  it("names no contract after a relation of Qti", () => {
    const { arms, written } = everyName();

    const relations = new Set(Object.keys(Qti.relations));
    assert.deepStrictEqual(
      [...written, ...arms].filter((name) => relations.has(name)),
      [],
    );
  });

  it("keeps each written-out contract's base pattern and flags", () => {
    assert.strictEqual(
      contracts.ManifestIdentifier.base.pattern.source,
      str.regex(patterns.ncName).pattern.source,
    );
    assert.strictEqual(
      contracts.NamespaceUri.base.pattern.source,
      str.regex(patterns.anyUri).pattern.source,
    );
    assert.strictEqual(contracts.LomToken.base.pattern.flags, "su");
    assert.strictEqual(contracts.ToolName.base.pattern.flags, "su");
    assert.strictEqual(contracts.ClassList.base.pattern.flags, "u");
  });

  it("builds each of the 14 MathML contracts over its base pattern once", () => {
    const bases = [
      [contracts.MathmlBaseValue, str.regex(patterns.mathmlPositiveInteger)],
      [contracts.MathmlCbytesValue, str.regex(patterns.base64)],
      [contracts.MathmlCdgroupValue, str.regex(patterns.anyUri)],
      [contracts.MathmlCdValue, str.regex(patterns.ncName)],
      [contracts.MathmlDefinitionUrlValue, str.regex(patterns.anyUri)],
      [contracts.MathmlIndexValue, str.regex(patterns.mathmlInteger)],
      [contracts.MathmlNameValue, str.regex(patterns.ncName)],
      [contracts.MathmlNargsValue, str.regex(patterns.xsNonNegativeInteger)],
      [contracts.MathmlPositionValue, str.regex(patterns.mathmlInteger)],
      [contracts.MathmlScriptlevelValue, str.regex(patterns.xsInteger)],
      [contracts.MathmlSelectionValue, str.regex(patterns.mathmlPositiveInteger)],
      [contracts.MathmlShiftValue, str.regex(patterns.mathmlInteger)],
      [contracts.MathmlSpanValue, str.regex(patterns.mathmlPositiveInteger)],
      [contracts.MathmlSrcValue, str.regex(patterns.anyUri)],
    ] as const;

    assert.strictEqual(bases.length, 14);
    for (const [made, base] of bases) {
      assert.strictEqual(made.base.pattern.source, base.pattern.source, made.name);
    }
    assert.strictEqual(
      contracts.MathmlCbytesValue.base.pattern.source,
      str.regex(patterns.base64).pattern.source,
    );
    assert.notStrictEqual(contracts.MathmlSpanValue.name, contracts.TableSpan.name);
  });
});
