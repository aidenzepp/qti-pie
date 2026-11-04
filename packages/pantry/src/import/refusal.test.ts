import { assert, describe, it } from "@effect/vitest";
import {
  ImportRefused,
  isMappedLaw,
  patternRuleSources,
  ruleOfError,
  ruleOfLaw,
} from "#pantry/import/refusal.ts";
import type { ImportLaw } from "#pantry/import/refusal.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import * as valueContracts from "#pantry/schema/value-contracts.ts";
import * as valueContexts from "#pantry/schema/value-contexts.ts";

it("sends a contract no row names to value-lexical, unmapped", () => {
  const law: ImportLaw = { contract: "NoSuchContract", kind: "contract" };

  assert.strictEqual(ruleOfLaw(law), "value-lexical");
  assert.isFalse(isMappedLaw(law));
});

it("passes an ImportRefused through ruleOfError as itself", () => {
  const refused = new ImportRefused({
    detail: "the max-choices attribute of qti-choice-interaction is not a non-negative integer",
    rule: "attribute-lexical",
  });

  assert.strictEqual(ruleOfError(refused), refused);
});

/**
 * A synthetic containment law between two sides, by relation and fields.
 */
const contained = (
  from: string,
  fromFields: readonly string[],
  to: string,
  toFields: readonly string[],
  selection: readonly { readonly field: string; readonly value: string }[] = [],
): ImportLaw => ({
  from: { fields: fromFields, relation: from, selection: [] },
  kind: "contained",
  to: { fields: toFields, relation: to, selection },
});

/**
 * A synthetic capacity law of `target` by `from`, the target selected on `selection`.
 */
const capacity = (
  target: string,
  targetFields: readonly string[],
  from: string,
  fromFields: readonly string[],
  selection: readonly { readonly field: string; readonly value: string }[] = [],
): ImportLaw => ({
  from: { fields: fromFields, relation: from, selection: [] },
  kind: "capacity",
  target: { fields: targetFields, relation: target, selection },
});

const check = (relation: string, name: string): ImportLaw => ({ kind: "check", name, relation });

/**
 * Assert a law is recognized and refused under `rule`.
 */
const assertMapped = (law: ImportLaw, rule: string): void => {
  assert.strictEqual(ruleOfLaw(law), rule);
  assert.isTrue(isMappedLaw(law));
};

describe("the rules of the canonical wave's new laws", () => {
  it("keys AttributeSpelling attribute-lexical, as AttributeLexical is", () => {
    const spelling: ImportLaw = {
      fields: ["node", "attribute"],
      kind: "key",
      relation: "AttributeSpelling",
    };

    assertMapped(spelling, "attribute-lexical");
    assert.strictEqual(
      ruleOfLaw(spelling),
      ruleOfLaw({ ...spelling, relation: "AttributeLexical" }),
    );
  });

  it("gives AttributeSpelling's containments the rules AttributeLexical's get", () => {
    const pairs = [
      [["node", "kind"], "Node", ["id", "kind"]],
      [["kind", "attribute"], "AttributeAdmission", ["kind", "attribute"]],
    ] as const;

    for (const [fields, to, toFields] of pairs) {
      const lexical = contained("AttributeLexical", fields, to, toFields);
      const spelling = contained("AttributeSpelling", fields, to, toFields);

      assertMapped(spelling, ruleOfLaw(lexical));
      assert.isTrue(isMappedLaw(lexical));
      assert.strictEqual(ruleOfLaw(spelling), "attribute-admission");
    }
  });

  it("names the four Order*ChoicesN containments typed-copy", () => {
    const pairs = [
      ["OrderMinChoicesN", "OrderInteraction", "minChoicesN"],
      ["OrderMaxChoicesN", "OrderInteraction", "maxChoicesN"],
      ["GraphicOrderMinChoicesN", "GraphicOrderInteraction", "minChoicesN"],
      ["GraphicOrderMaxChoicesN", "GraphicOrderInteraction", "maxChoicesN"],
    ] as const;

    for (const [from, to, column] of pairs) {
      assertMapped(contained(from, ["node", "value"], to, ["id", column]), "typed-copy");
    }
  });

  it("names the two minimum-choices checks attribute-lexical", () => {
    assertMapped(check("OrderMinChoicesN", "OrderMinChoicesPositive"), "attribute-lexical");
    assertMapped(
      check("GraphicOrderMinChoicesN", "GraphicOrderMinChoicesPositive"),
      "attribute-lexical",
    );
  });

  const arms = [
    ["EqualRoundedFiguresRef", "EqualRounded", "figuresKind"],
    ["RoundToFiguresRef", "RoundTo", "figuresKind"],
    ["IndexNRef", "Index", "nKind"],
    ["RepeatNumberRepeatsRef", "Repeat", "numberRepeatsKind"],
  ] as const;

  it("names each *Ref arm's containment P32", () => {
    for (const [arm, parent, kind] of arms) {
      assertMapped(
        contained(arm, ["node"], parent, ["id"], [{ field: kind, value: "ref" }]),
        "P32",
      );
    }
  });

  it("names each *Ref arm's capacity P32", () => {
    for (const [arm, parent, kind] of arms) {
      assertMapped(capacity(parent, ["id"], arm, ["node"], [{ field: kind, value: "ref" }]), "P32");
    }
  });

  it("names each *RefZero check P32", () => {
    assertMapped(check("EqualRounded", "EqualRoundedFiguresRefZero"), "P32");
    assertMapped(check("RoundTo", "RoundToFiguresRefZero"), "P32");
    assertMapped(check("Index", "IndexNRefZero"), "P32");
    assertMapped(check("Repeat", "RepeatNumberRepeatsRefZero"), "P32");
  });

  it("names ManifestSchemaVersion's two new containments typed-copy", () => {
    assertMapped(
      contained("ManifestSchemaVersion", ["metadata", "package"], "ManifestMetadata", [
        "id",
        "manifest",
      ]),
      "typed-copy",
    );
    assertMapped(
      contained("ManifestSchemaVersion", ["package", "version"], "Package", [
        "id",
        "schemaversion",
      ]),
      "typed-copy",
    );
  });

  it("keeps a resource's own schemaversion containment schema-version", () => {
    assertMapped(
      contained("Resource", ["package", "schemaversion"], "Package", ["id", "schemaversion"]),
      "schema-version",
    );
  });
});

/**
 * A synthetic pattern law over one regex source.
 */
const pattern = (source: string): ImportLaw => ({ flags: "u", kind: "pattern", source });

describe("the rules of a pattern", () => {
  const sources = new Set<string>(
    Object.entries(patterns)
      .filter(([name]) => !name.endsWith("Flags"))
      .map(([, source]) => source),
  );

  it("keeps a row only for a source the schema still exports", () => {
    assert.isAbove(patternRuleSources.length, 0);
    for (const source of patternRuleSources) {
      assert.isTrue(sources.has(source), source);
    }
  });

  it("keeps the DRD and rubric-use rows", () => {
    const drd = [
      patterns.drdAccessMode,
      patterns.drdAdaptationDetail,
      patterns.drdAdaptationMediaType,
      patterns.drdAdaptationType,
      patterns.drdApiInteroperable,
      patterns.drdControlFlexibility,
      patterns.drdDisplayTransformability,
      patterns.drdEducationalComplexityOfAdaptation,
      patterns.drdHazard,
    ];

    for (const source of drd) {
      assertMapped(pattern(source), "drd-value");
    }
    assertMapped(pattern(patterns.useEnumExt), "attribute-lexical");
    assertMapped(pattern(patterns.viewList), "attribute-lexical");
    assertMapped(pattern(patterns.ariaRelevantList), "attribute-lexical");
  });
});

/**
 * A synthetic contract law.
 */
const contractLaw = (name: string): ImportLaw => ({ contract: name, kind: "contract" });

/**
 * The rule of each written-out contract, from the contracts document's per-contract sections. The
 * four pairs of one language told apart by contract are `CategoryList` and `MatchGroupList`,
 * `ExpressionIntegerOrVariable` and `PrintedVariableIntegerOrVariable`, `ExpressionCoords` and
 * `ShapeCoords`, and `ClassList` and `LomToken`.
 */
const writtenRules = {
  P6: ["CategoryList", "ExpressionCoords", "ExpressionIntegerOrVariable"],
  "attribute-lexical": [
    "AriaInteger",
    "AriaPositiveInteger",
    "ChoiceCount",
    "ClassList",
    "ContainerWidth",
    "ContentLanguage",
    "ContentMediaType",
    "ExpectedLength",
    "ExpectedLines",
    "IdReference",
    "InterpolationSourceValue",
    "MappingScore",
    "MatchGroupList",
    "MatchSourceValue",
    "MediaRectCoords",
    "PrintedVariableIntegerOrVariable",
    "RectCoords",
    "ShapeCoords",
    "ShowHideIdentifier",
    "StringCount",
    "TableSpan",
    "TrackLanguage",
  ],
  "drd-value": ["AccessMode", "AccessModeAdapted"],
  "href-path": ["PackagePath", "ResourceEntryHref"],
  "manifest-identifier": ["ManifestIdentifier"],
  "tool-string-length": ["ToolName", "ToolVendor", "ToolVersion"],
  "uri-syntax": [
    "CaseItemUri",
    "CitationUri",
    "CustomOperatorDefinitionUri",
    "DrdAdaptationUri",
    "EmbedSourceUri",
    "GlossaryUri",
    "HyperlinkUri",
    "LongDescriptionUri",
    "LongInterpretationUri",
    "NamespaceUri",
    "StatisticContextUri",
    "StylesheetUri",
    "TemplateLocationUri",
    "TemplateUri",
    "XIncludeUri",
    "XmlBaseUri",
  ],
  "usage-lexical": [
    "StatisticMeasure",
    "StatisticName",
    "UsageCaseCount",
    "UsageFieldIdentifier",
    "UsageMappingScore",
    "UsagePartIdentifier",
    "UsageValueToken",
  ],
  "value-lexical": [
    "ChoiceIdentifier",
    "CustomOperatorClassName",
    "FileMediaType",
    "LangStringLanguage",
    "LomToken",
    "LomVocabularySource",
    "LomVocabularyValue",
    "NamespacePrefix",
    "OutcomeScaleValue",
    "PiTarget",
    "RecordFieldIdentifier",
    "SectionReference",
    "TemplateParameterName",
    "VariableReference",
    "WeightReference",
    "XmlEntityName",
  ],
} satisfies Record<string, readonly string[]>;

/**
 * The five contexts whose Uri arm refuses under `uri-syntax` (decision 150).
 */
const uriContexts: ReadonlySet<string> = new Set([
  "Declared",
  "InterpolationDefault",
  "InterpolationTarget",
  "MatchDefault",
  "MatchTarget",
]);

/**
 * The value-arm contracts, built once: `valueArmContracts()` makes all 64 on each call.
 */
const armContracts = valueContracts.valueArmContracts();

/**
 * Every contract name of the schema with the rule it maps to: the written-out contracts, then the
 * arms, each of which takes its context's rule from `valueContexts`.
 */
const makeExpectedRules = (): ReadonlyMap<string, string> => {
  const expected = new Map<string, string>();

  for (const [rule, names] of Object.entries(writtenRules)) {
    for (const name of names) {
      expected.set(name, rule);
    }
  }
  for (const { context, rule } of valueContexts.valueContexts) {
    for (const arm of Object.values<Named>(armContracts[context])) {
      expected.set(
        arm.name,
        uriContexts.has(context) && arm.name.endsWith("UriValue") ? "uri-syntax" : rule,
      );
    }
  }

  return expected;
};

/**
 * The table of {@link makeExpectedRules}, built once.
 */
const expectedRules: ReadonlyMap<string, string> = makeExpectedRules();

/**
 * A contract as the tests read it: its name.
 */
interface Named {
  readonly name: string;
}

/**
 * The name of every contract the schema makes.
 */
const makeEveryContract = (): readonly string[] => {
  const arms = Object.values(armContracts).flatMap((byBase) =>
    Object.values<Named>(byBase).map((made) => made.name),
  );

  return [...Object.values<Named>(contracts).map((made) => made.name), ...arms];
};

/**
 * The names of {@link makeEveryContract}, built once.
 */
const everyContract: readonly string[] = makeEveryContract();

describe("the rules of a contract", () => {
  it("names 136 contracts, each in the expected table once", () => {
    const names = everyContract;

    assert.strictEqual(names.length, 136);
    assert.strictEqual(expectedRules.size, 136);
    assert.deepStrictEqual([...expectedRules.keys()].toSorted(), names.toSorted());
  });

  it("maps every contract of the schema to its rule, mapped", () => {
    const expected = expectedRules;

    for (const name of everyContract) {
      const law = contractLaw(name);

      assert.isTrue(isMappedLaw(law), `${name} has no entry`);
      assert.strictEqual(ruleOfLaw(law), expected.get(name), name);
    }
  });

  it("makes the Literal arms P7, the usage arms usage-typed-value and the MapKey arms map-key-lexical", () => {
    assertMapped(contractLaw("LiteralIdentifierValue"), "P7");
    assertMapped(contractLaw("LiteralUriValue"), "P7");
    assertMapped(contractLaw("UsageIntegerValue"), "usage-typed-value");
    assertMapped(contractLaw("UsageUriValue"), "usage-typed-value");
    assertMapped(contractLaw("MapKeyFloatValue"), "map-key-lexical");
    assertMapped(contractLaw("StatisticName"), "usage-lexical");
  });

  it("sends the Uri arm of the five URI value contexts to uri-syntax, the others to their context's rule", () => {
    for (const name of [
      "DeclaredUriValue",
      "MatchDefaultUriValue",
      "MatchTargetUriValue",
      "InterpolationDefaultUriValue",
      "InterpolationTargetUriValue",
    ]) {
      assertMapped(contractLaw(name), "uri-syntax");
    }
    assertMapped(contractLaw("DeclaredIntegerValue"), "value-lexical");
    assertMapped(contractLaw("MatchTargetIdentifierValue"), "attribute-lexical");
    assertMapped(contractLaw("MapKeyUriValue"), "map-key-lexical");
  });

  it("tells apart the four languages two contracts share", () => {
    assertMapped(contractLaw("CategoryList"), "P6");
    assertMapped(contractLaw("MatchGroupList"), "attribute-lexical");
    assertMapped(contractLaw("ExpressionIntegerOrVariable"), "P6");
    assertMapped(contractLaw("PrintedVariableIntegerOrVariable"), "attribute-lexical");
    assertMapped(contractLaw("ExpressionCoords"), "P6");
    assertMapped(contractLaw("ShapeCoords"), "attribute-lexical");
    assertMapped(contractLaw("ClassList"), "attribute-lexical");
    assertMapped(contractLaw("LomToken"), "value-lexical");
  });
});
