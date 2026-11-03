import { str } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as contracts from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { Qti } from "#qti/schema/qti.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The 136 contracts of the schema tightening, from the dry run `p13-d1` (its list (c)): the 254
 * contracts the contracts document lists as present after the canonical wave, less none, over 264
 * columns. Sorted.
 */
const derived = [
  "AccessMode",
  "AccessModeAdapted",
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
  "SectionReference",
  "ShapeCoords",
  "ShowHideIdentifier",
  "StatisticContextUri",
  "StatisticMeasure",
  "StatisticName",
  "StringCount",
  "StylesheetUri",
  "TableSpan",
  "TemplateLocationUri",
  "TemplateParameterName",
  "TemplateUri",
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
  "XIncludeUri",
  "XmlBaseUri",
  "XmlEntityName",
];

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
 * The names of every contract the module makes: the written-out ones and the 64 minted arms.
 */
const everyName = () => {
  const { valueArmContracts, ...written } = contracts;
  const minted: Readonly<Record<string, Readonly<Record<string, Named>>>> = valueArmContracts();

  return {
    arms: Object.values(minted).flatMap(armNames),
    written: Object.values<Named>(written).map((made) => made.name),
  };
};

describe("schema/contracts", () => {
  it("makes exactly the 136 contracts the dry run derived", () => {
    const { arms, written } = everyName();

    assert.strictEqual(written.length, 72);
    assert.strictEqual(arms.length, 64);
    assert.deepStrictEqual([...written, ...arms].toSorted(), derived);
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

  it("mints the arms for every context of the value table, one for each of eight base types", () => {
    const minted = contracts.valueArmContracts();
    assert.deepStrictEqual(
      Object.keys(minted).toSorted(),
      value.valueContexts.map(({ context }) => context).toSorted(),
    );
    for (const [context, byBase] of Object.entries<Readonly<Record<string, Named>>>(minted)) {
      assert.deepStrictEqual(armNames(byBase).toSorted(), [
        `${context}DirectedPairValue`,
        `${context}DurationValue`,
        `${context}FloatValue`,
        `${context}IdentifierValue`,
        `${context}IntegerValue`,
        `${context}PairValue`,
        `${context}PointValue`,
        `${context}UriValue`,
      ]);
    }
  });

  it("gives each arm the language of its context's lexical form", () => {
    const minted = contracts.valueArmContracts();
    for (const { context } of value.valueContexts) {
      const lexical = value.lexicalOf(context);
      const arms = minted[context];
      assert.strictEqual(arms.integer.base.pattern.source, lexical.integer.pattern.source);
      assert.strictEqual(arms.float.base.pattern.source, lexical.float.pattern.source);
      assert.strictEqual(arms.duration.base.pattern.source, lexical.duration.pattern.source);
      assert.strictEqual(arms.pair.base.pattern.source, lexical.pair.pattern.source);
      assert.strictEqual(
        arms.directedPair.base.pattern.source,
        lexical.directedPair.pattern.source,
      );
      assert.strictEqual(arms.point.base.pattern.source, lexical.point.pattern.source);
      assert.strictEqual(arms.uri.base.pattern.source, lexical.uri.pattern.source);
      assert.strictEqual(arms.identifier.base.pattern.source, lexical.identifier.pattern.source);
    }
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
});
