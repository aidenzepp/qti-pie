import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import {
  ImportRefused,
  ImportRule,
  isMappedLaw,
  patternRuleSources,
  ruleOfError,
  ruleOfLaw,
} from "#pantry/import/refusal.ts";
import type { ImportLaw } from "#pantry/import/refusal.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import { families } from "#pantry/schema/mathml/values.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import * as valueContracts from "#pantry/schema/value-contracts.ts";
import { Qti } from "#pantry/schema/qti.ts";
import * as reference from "#pantry/schema/reference.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";
import * as testContent from "#pantry/schema/test/content.ts";
import * as testControl from "#pantry/schema/test/control.ts";
import * as testRules from "#pantry/schema/test/rules.ts";
import * as testStructure from "#pantry/schema/test/structure.ts";
import * as valueContexts from "#pantry/schema/value-contexts.ts";

const phase5Rules = [
  "structure-count",
  "section-empty",
  "structure-identifier",
  "reach-copy",
  "section-ref-cycle",
  "section-ref-target",
  "item-ref-target",
  "stimulus-ref-target",
  "stimulus-ref-key",
  "resolution-copy",
  "document-reference",
  "selection-bounds",
  "selection-required",
  "branch-target",
  "branch-forward",
  "variable-mapping-source",
  "variable-mapping-target",
  "template-default-target",
  "prefixed-ref",
  "prefixed-root",
  "prefixed-copy",
  "item-duration",
  "section-identifier-target",
  "section-root-copy",
  "include-xpointer",
  "include-parse",
  "section-variable-ref",
  "section-copy",
];

it("holds the 28 rule names of the phase-5 spec 4.16 in ImportRule", () => {
  const held = new Set<string>(ImportRule.members.map((member) => member.literal));

  assert.strictEqual(phase5Rules.length, 28);
  for (const rule of phase5Rules) {
    assert.isTrue(held.has(rule), rule);
  }
});

it("sends a contract no row names to value-lexical, unmapped", () => {
  const law: ImportLaw = { contract: "NoSuchContract", kind: "contract" };

  assert.strictEqual(ruleOfLaw(law), "value-lexical");
  assert.isFalse(isMappedLaw(law));
});

it("sends a numericBound law to the check nearest rule, unmapped", () => {
  const law: ImportLaw = { field: "position", kind: "numericBound", relation: "Edge" };

  assert.isFalse(isMappedLaw(law));
  assert.strictEqual(
    ruleOfLaw(law),
    ruleOfLaw({ kind: "check", name: "NoSuchCheck", relation: "Edge" }),
  );
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
  it("keys ForeignAttribute(node,prefix,local) wildcard-attribute", () => {
    assertMapped(
      { fields: ["node", "prefix", "local"], kind: "primaryKey", relation: "ForeignAttribute" },
      "wildcard-attribute",
    );
  });

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
    "SliderBound",
    "TimeLimitSeconds",
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
    "MathmlBaseValue",
    "MathmlCbytesValue",
    "MathmlCdValue",
    "MathmlIndexValue",
    "MathmlNameValue",
    "MathmlNargsValue",
    "MathmlPositionValue",
    "MathmlScriptlevelValue",
    "MathmlSelectionValue",
    "MathmlShiftValue",
    "MathmlSpanValue",
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
    "AdaptiveRefHref",
    "CaseItemUri",
    "CitationUri",
    "CustomOperatorDefinitionUri",
    "DrdAdaptationUri",
    "EmbedSourceUri",
    "GlossaryUri",
    "HyperlinkUri",
    "ItemRefHref",
    "LongDescriptionUri",
    "LongInterpretationUri",
    "MathmlCdgroupValue",
    "MathmlDefinitionUrlValue",
    "MathmlSrcValue",
    "NamespaceUri",
    "SectionRefHref",
    "StatisticContextUri",
    "StimulusRefHref",
    "StylesheetUri",
    "TemplateLocationUri",
    "TemplateUri",
    "XIncludeUri",
    "XlinkArcroleUri",
    "XlinkHrefUri",
    "XlinkRoleUri",
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
    "AdaptiveRefIdentifier",
    "ChoiceIdentifier",
    "CustomOperatorClassName",
    "FileMediaType",
    "LangStringLanguage",
    "LomToken",
    "LomVocabularySource",
    "LomVocabularyValue",
    "MappedVariableName",
    "NamespacePrefix",
    "OutcomeScaleValue",
    "PiTarget",
    "RecordFieldIdentifier",
    "StimulusRefIdentifier",
    "TemplateParameterName",
    "TestStructureIdentifier",
    "VariableReference",
    "WeightReference",
    "WeightValue",
    "XlinkLabelName",
    "XmlEntityName",
    "XmlLocalName",
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
  it("names 165 contracts, each in the expected table once", () => {
    const names = everyContract;

    assert.strictEqual(names.length, 165);
    assert.strictEqual(expectedRules.size, 165);
    assert.deepStrictEqual([...expectedRules.keys()].toSorted(), names.toSorted());
  });

  it("maps the 14 MathML contracts: three under uri-syntax, eleven under attribute-lexical", () => {
    const uri = ["MathmlCdgroupValue", "MathmlDefinitionUrlValue", "MathmlSrcValue"];
    const lexical = [
      "MathmlBaseValue",
      "MathmlCbytesValue",
      "MathmlCdValue",
      "MathmlIndexValue",
      "MathmlNameValue",
      "MathmlNargsValue",
      "MathmlPositionValue",
      "MathmlScriptlevelValue",
      "MathmlSelectionValue",
      "MathmlShiftValue",
      "MathmlSpanValue",
    ];

    for (const name of uri) {
      assert.isTrue(isMappedLaw(contractLaw(name)), name);
      assert.strictEqual(ruleOfLaw(contractLaw(name)), "uri-syntax", name);
    }
    for (const name of lexical) {
      assert.isTrue(isMappedLaw(contractLaw(name)), name);
      assert.strictEqual(ruleOfLaw(contractLaw(name)), "attribute-lexical", name);
    }
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

/**
 * The relations of the phase-5 test layer's six modules and the fifteen of its processing
 * headings, by name. A statement that names one of them is the phase's.
 */
const phaseRelations: ReadonlySet<string> = new Set([
  ...Object.keys(testStructure.relations),
  ...Object.keys(testControl.relations),
  ...Object.keys(testRules.relations),
  ...Object.keys(testContent.relations),
  ...Object.keys(stimulus.relations),
  ...Object.keys(reference.relations),
  "ItemInstanceSpelling",
  "ItemInstanceVariableRef",
  "ItemVariableRef",
  "PrefixedBuiltIn",
  "PrefixedDeclared",
  "PrefixedMapped",
  "PrefixedVariableSource",
  "SectionDurationRef",
  "SectionDurationTarget",
  "SectionIdentifierTarget",
  "SectionVariableDeclared",
  "SectionVariableDuration",
  "SectionVariablePrefixed",
  "SectionVariableRef",
  "SectionVariableResolution",
]);

type LawSideOf = Extract<ImportLaw, { readonly kind: "contained" }>["from"];

const RelationName = Schema.Struct({ name: Schema.String });

const Side = Schema.Struct({
  fields: Schema.Array(Schema.String),
  source: Schema.Union([
    Schema.Struct({
      bindings: Schema.Record(
        Schema.String,
        Schema.Union([Schema.String, Schema.Number, Schema.BigInt, Schema.Boolean]),
      ),
      relation: RelationName,
    }),
    RelationName,
  ]),
});

/**
 * The statements of `Qti` as this test reads them: the kind, the relations and the fields each
 * names, and a selection's bindings.
 */
const Statement = Schema.Union([
  Schema.Struct({
    fields: Schema.Array(Schema.String),
    kind: Schema.Literal("key"),
    relation: RelationName,
  }),
  Schema.Struct({ kind: Schema.Literal("check"), name: Schema.String, relation: RelationName }),
  Schema.Struct({ kind: Schema.Literal("contained"), left: Side, right: Side }),
  Schema.Struct({ kind: Schema.Literal("mirrors"), left: Side, right: Side }),
  Schema.Struct({ from: Side, kind: Schema.Literal("capacity"), target: Side }),
  Schema.Struct({
    arms: Schema.Record(Schema.String, RelationName),
    discriminator: Schema.String,
    kind: Schema.Literal("alternatives"),
    parent: RelationName,
  }),
]);

const readStatement = Schema.decodeUnknownSync(Statement);

/**
 * A containment, mirrors or capacity side as the engine reports it: the relation, the fields and
 * the values a selection binds.
 */
const sideOf = (side: typeof Side.Type): LawSideOf =>
  "bindings" in side.source
    ? {
        fields: [...side.fields],
        relation: side.source.relation.name,
        selection: Object.entries(side.source.bindings).map(([field, value]) => ({ field, value })),
      }
    : { fields: [...side.fields], relation: side.source.name, selection: [] };

const sideText = (side: typeof Side.Type): string =>
  "bindings" in side.source
    ? `${side.source.relation.name}(${side.fields.join(",")})[${Object.entries(side.source.bindings)
        .map(([field, value]) => `${field}=${String(value)}`)
        .join(",")}]`
    : `${side.source.name}(${side.fields.join(",")})`;

/**
 * One law of the composed schema's statements, with its signature (the kind, then each side as
 * `Relation(fields)[selection]`, a capacity as `target < filler`) and the relations it names.
 */
interface Signed {
  readonly law: ImportLaw;
  readonly relations: readonly string[];
  readonly signature: string;
}

/**
 * The laws one statement of `Qti` states. An `alternatives` states itself and one arm law per arm.
 */
const lawsOfStatement = (statement: (typeof Qti.statements)[number]): readonly Signed[] => {
  const read = readStatement(statement);

  if (read.kind === "key") {
    return [
      {
        law: { fields: read.fields, kind: "key", relation: read.relation.name },
        relations: [read.relation.name],
        signature: `key ${read.relation.name}(${read.fields.join(",")})`,
      },
    ];
  }

  if (read.kind === "check") {
    return [
      {
        law: { kind: "check", name: read.name, relation: read.relation.name },
        relations: [read.relation.name],
        signature: `check ${read.relation.name}.${read.name}`,
      },
    ];
  }

  if (read.kind === "contained" || read.kind === "mirrors") {
    const from = sideOf(read.left);
    const to = sideOf(read.right);

    return [
      {
        law: { from, kind: read.kind, to },
        relations: [from.relation, to.relation],
        signature: `${read.kind} ${sideText(read.left)} > ${sideText(read.right)}`,
      },
    ];
  }

  if (read.kind === "capacity") {
    const from = sideOf(read.from);
    const target = sideOf(read.target);

    return [
      {
        law: { from, kind: "capacity", target },
        relations: [target.relation, from.relation],
        signature: `capacity ${sideText(read.target)} < ${sideText(read.from)}`,
      },
    ];
  }

  const relation = read.parent.name;
  const field = read.discriminator;
  const arms: readonly Signed[] = Object.entries(read.arms).map(([handle, arm]) => ({
    law: { arm: arm.name, field, handles: [handle], kind: "alternativesArm", relation },
    relations: [arm.name, relation],
    signature: `altArm ${arm.name} of ${relation} ${handle}`,
  }));

  return [
    {
      law: { field, kind: "alternatives", relation },
      relations: [relation],
      signature: `alt ${relation}.${field}`,
    },
    ...arms,
  ];
};

/**
 * A `Node` selection's `mirrors` into its arm: the `Node` law, one per `NodeKind` handle, which no
 * phase maps (the first kind's is unmapped too), so it is not among the phase's statements.
 */
const isNodeLaw = (signature: string): boolean => signature.startsWith("mirrors Node(id)[kind=");

/**
 * The capacities the 3.0.0 stimulus body's shared attributes fill collapse to one signature.
 */
const collapse = (signature: string): string =>
  signature.startsWith("capacity StimulusBody(id)[version=3.0.0] < ")
    ? "capacity StimulusBody(id)[version=3.0.0] < *"
    : signature;

const composed: readonly Signed[] = Qti.statements.flatMap(lawsOfStatement);

/**
 * The statements the phase added or edited, each with the name of its 4.16 rule. A statement the
 * brief names by a relation's family is one row per statement, so that a new statement has to be
 * added here and mapped.
 */
const phaseRules: readonly (readonly [string, readonly string[]])[] = [
  ["P12", ["contained Weight(id,itemRef) > Edge(child,parent)"]],
  [
    "P3",
    [
      "contained BranchRule(id) > RuleOperand(rule)",
      "contained PreCondition(id) > RuleOperand(rule)",
      "contained TemplateDefault(id) > RuleOperand(rule)",
    ],
  ],
  [
    "P8",
    [
      "check SectionVariableDeclared.SectionVariableDeclaredKind",
      "contained SectionVariableDeclared(ref,identifier,referrerKind) > SectionVariableRef(id,identifier,referrerKind)",
      "contained SectionVariableDeclared(test,identifier,declarationKind) > Declaration(document,identifier,kind)",
    ],
  ],
  [
    "attribute-admission",
    [
      "capacity StimulusBody(id)[version=3.0.0] < *",
      "check ItemTool.ItemToolRoot",
      "contained AttributeFileReference(kind,attribute) > AttributeAdmission(kind,attribute)",
      "contained AttributeFileReference(node,kind) > Node(id,kind)",
      "contained DeclaredAllowComment(node) > ItemSessionControl(id)",
      "contained DeclaredAllowLateSubmission(node) > TimeLimits(id)",
      "contained DeclaredAllowReview(node) > ItemSessionControl(id)",
      "contained DeclaredAllowSkipping(node) > ItemSessionControl(id)",
      "contained DeclaredOrderingShuffle(node) > Ordering(id)",
      "contained DeclaredShowFeedback(node) > ItemSessionControl(id)",
      "contained DeclaredShowSolution(node) > ItemSessionControl(id)",
      "contained DeclaredValidateResponses(node) > ItemSessionControl(id)",
      "contained DeclaredWithReplacement(node) > Selection(id)",
      "contained ItemRefCategory(node) > ItemRef(id)",
      "contained ItemSessionMaxAttempts(node) > ItemSessionControl(id)",
      "contained ItemStimulusRefTitle(node) > ItemStimulusRef(id)",
      "contained ItemTool(tree)[root=item] > AssessmentItem(tree)",
      "contained ItemTool(tree,root) > Tree(id,root)",
      "contained StimulusBody(id,version) > Node(id,version)",
      "contained TestFeedbackTitle(node) > TestFeedback(id)",
      "contained TestPartTitle(node) > TestPart(id)",
      "contained TestRubricBlockUse(node) > TestRubricBlock(id)",
      "contained TimeLimitMax(node) > TimeLimits(id)",
      "contained TimeLimitMin(node) > TimeLimits(id)",
    ],
  ],
  [
    "attribute-lexical",
    ["check ItemSessionMaxAttempts.MaxAttemptsInt", "check Selection.SelectionSelectInt"],
  ],
  [
    "branch-target",
    [
      "alt BranchRule.targetKind",
      "altArm BranchRuleExit of BranchRule exit",
      "altArm BranchRuleTarget of BranchRule ref",
      "check BranchRuleTarget.BranchTargetKind",
      "contained BranchRule(id,owner) > Edge(child,parent)",
      "contained BranchRule(owner)[ownerKind=itemRef] > ItemRef(id)",
      "contained BranchRule(owner)[ownerKind=part] > TestPart(id)",
      "contained BranchRule(owner)[ownerKind=section] > AssessmentSection(id)",
      "contained BranchRuleTarget(rule,ownerKind) > BranchRule(id,ownerKind)",
      "contained BranchRuleTarget(rule,scope) > BranchRule(id,document)",
      "contained BranchRuleTarget(scope,identifier,holderKind) > TestIdentifier(scope,identifier,holderKind)",
    ],
  ],
  [
    "document-lang",
    ["contained NodeXmlLang(tree,value)[rootKind=test] > DocumentLang(document,value)"],
  ],
  [
    "feedback-ref",
    [
      "check SectionFeedbackOutcomeRef.SectionFeedbackOutcomeRefType",
      "contained SectionFeedbackOutcomeRef(node,document) > Node(id,tree)",
      "contained SectionFeedbackOutcomeRef(test,document) > TestDocument(test,document)",
      "contained SectionFeedbackOutcomeRef(test,identifier) > Declaration(document,identifier)[kind=outcome]",
      "contained SectionFeedbackOutcomeRef(test,identifier,baseType,cardinality) > TypedDeclaration(document,identifier,baseType,cardinality)",
    ],
  ],
  [
    "file-exists",
    [
      "contained AttributeFileReference(document,package) > Document(id,package)",
      "contained AttributeFileReference(node,document) > Node(id,tree)",
      "contained AttributeFileReference(package,path) > PackageEntry(package,path)",
    ],
  ],
  ["include-parse", ["check XIncludeParse.XIncludeParseXml"]],
  ["include-xpointer", ["capacity XInclude(id) < XIncludeXpointer(node)"]],
  [
    "item-ref-target",
    [
      "alt ItemRefResolution.targetKind",
      "altArm ItemRefDocument of ItemRefResolution item",
      "altArm ItemRefLti of ItemRefResolution lti",
      "check ItemRefLti.ItemRefLtiType",
      "contained ItemRef(id) > ItemRefResolution(itemRef)",
      "contained ItemRefDocument(package,path,document) > Document(package,path,id)[root=item]",
      "contained ItemRefLti(package,resource,type) > Resource(package,identifier,type)",
    ],
  ],
  [
    "label-tool",
    [
      "check AssessmentItemLabel.AssessmentItemLabelRoot",
      "contained AssessmentItemLabel(tree)[root=item,version=3.0.1] > ItemToolBoth(tree)",
      "contained AssessmentItemLabel(tree,root) > Tree(id,root)",
    ],
  ],
  [
    "lom-identifier",
    ["capacity ResourceLomIdentified(lom)[type=imsqti_test_xmlv3p0] < LomObjectIdentifier(lom)"],
  ],
  [
    "lom-title",
    ["capacity ResourceLomTitled(lom)[type=imsqti_test_xmlv3p0] < LomObjectTitle(lom)"],
  ],
  [
    "prefixed-ref",
    [
      "alt PrefixedVariableSource.source",
      "altArm ItemInstanceVariableRef of VariableRef itemInstanceVariable",
      "altArm ItemVariableRef of VariableRef itemVariable",
      "altArm PrefixedBuiltIn of PrefixedVariableSource builtIn",
      "altArm PrefixedDeclared of PrefixedVariableSource declared",
      "altArm PrefixedMapped of PrefixedVariableSource mapped",
      "altArm SectionDurationRef of VariableRef sectionDuration",
      "check PrefixedBuiltIn.PrefixedBuiltInName",
      "check PrefixedVariableSource.PrefixedVariableSourceKind",
      "check SectionDurationTarget.SectionDurationTargetHolder",
      "check SectionDurationTarget.SectionDurationTargetKind",
      "contained ItemInstanceVariableRef(id,document)[root=test] > PrefixedVariableSource(ref,test)",
      "contained ItemVariableRef(id,document)[root=test] > PrefixedVariableSource(ref,test)",
      "contained PrefixedBuiltIn(ref,test) > PrefixedVariableSource(ref,test)",
      "contained PrefixedDeclared(itemDocument,variable) > Declaration(document,identifier)",
      "contained PrefixedDeclared(ref,test,itemDocument) > PrefixedVariableSource(ref,test,itemDocument)",
      "contained PrefixedMapped(itemRef,variable) > VariableMapping(itemRef,target)",
      "contained PrefixedMapped(ref,test,itemRef) > PrefixedVariableSource(ref,test,itemRef)",
      "contained PrefixedVariableSource(itemRef,itemDocument) > ItemRefDocument(itemRef,document)",
      "contained PrefixedVariableSource(ref,document,refKind) > VariableRef(id,document,kind)",
      "contained PrefixedVariableSource(ref,prefix)[refKind=itemInstanceVariable] > ItemInstanceVariableRef(id,prefix)",
      "contained PrefixedVariableSource(ref,prefix)[refKind=itemVariable] > ItemVariableRef(id,prefix)",
      "contained PrefixedVariableSource(test,document) > TestDocument(test,document)",
      "contained PrefixedVariableSource(test,prefix,itemRef) > TestReach(test,identifier,holder)[holderKind=itemRef]",
      "contained SectionDurationRef(id,document)[root=test] > SectionDurationTarget(ref,test)",
      "contained SectionDurationTarget(ref,document,prefix)[refKind=sectionDuration] > SectionDurationRef(id,document,prefix)",
      "contained SectionDurationTarget(ref,document,refKind) > VariableRef(id,document,kind)",
      "contained SectionDurationTarget(test,document) > TestDocument(test,document)",
      "contained SectionDurationTarget(test,prefix,holder,holderKind) > TestReach(test,identifier,holder,holderKind)",
    ],
  ],
  [
    "prefixed-root",
    [
      "check ItemInstanceVariableRef.ItemInstanceVariableRoot",
      "check ItemVariableRef.ItemVariableRoot",
      "check SectionDurationRef.SectionDurationRoot",
      "contained ItemInstanceVariableRef(document,root) > Document(id,root)",
      "contained ItemVariableRef(document,root) > Document(id,root)",
      "contained SectionDurationRef(document,root) > Document(id,root)",
    ],
  ],
  [
    "printed-variable-ref",
    [
      "check SectionPrintedVariableRef.SectionPrintedVariableRefKind",
      "check SectionPrintedVariableVarRef.SectionPrintedVariableVarRefType",
      "contained SectionPrintedVariableRef(node) > PrintedVariable(id)",
      "contained SectionPrintedVariableRef(node,document) > Node(id,tree)",
      "contained SectionPrintedVariableRef(test,document) > TestDocument(test,document)",
      "contained SectionPrintedVariableRef(test,identifier,kind) > Declaration(document,identifier,kind)",
      "contained SectionPrintedVariableVarRef(node) > PrintedVariable(id)",
      "contained SectionPrintedVariableVarRef(node,document) > Node(id,tree)",
      "contained SectionPrintedVariableVarRef(test,document) > TestDocument(test,document)",
      "contained SectionPrintedVariableVarRef(test,identifier,baseType,cardinality) > TypedDeclaration(document,identifier,baseType,cardinality)",
      "contained SectionPrintedVariableVarRef(test,identifier,kind) > Declaration(document,identifier,kind)",
    ],
  ],
  [
    "reach-copy",
    [
      "contained TestDocument(document) > Document(id)",
      "contained TestDocument(test) > Document(id)[root=test]",
    ],
  ],
  [
    "ref-exists",
    [
      "contained ItemInstanceVariableRef(id,document) > VariableRef(id,document)",
      "contained ItemVariableRef(id,document) > VariableRef(id,document)",
      "contained SectionDurationRef(id,document) > VariableRef(id,document)",
      "contained SectionVariableRef(id,document) > VariableRef(id,document)",
    ],
  ],
  ["section-empty", ["capacity AssessmentSection(id) < StructureChild(parent)"]],
  [
    "section-identifier-target",
    [
      "check SectionIdentifierTarget.SectionIdentifierTargetHolderKind",
      "contained SectionIdentifierTarget(node,identifier) > ExpressionSectionIdentifier(node,value)",
      "contained SectionIdentifierTarget(node,document) > Node(id,tree)",
      "contained SectionIdentifierTarget(test,document) > TestDocument(test,document)",
      "contained SectionIdentifierTarget(test,identifier,holderKind) > TestReach(test,identifier,holderKind)",
    ],
  ],
  [
    "section-ref-target",
    [
      "contained SectionRef(id) > SectionRefResolution(sectionRef)",
      "contained SectionRefResolution(package,path,document) > Document(package,path,id)[root=section]",
    ],
  ],
  [
    "section-variable-ref",
    [
      "alt SectionVariableResolution.target",
      "altArm SectionVariableDeclared of SectionVariableResolution declared",
      "altArm SectionVariableDuration of SectionVariableResolution duration",
      "altArm SectionVariablePrefixed of SectionVariableResolution prefixed",
      "altArm SectionVariableRef of VariableRef sectionVariable",
      "check SectionVariableRef.SectionVariableReferrer",
      "check SectionVariableRef.SectionVariableRoot",
      "contained SectionVariableRef(document,root) > Document(id,root)",
      "contained SectionVariableRef(id,referrerKind) > Node(id,kind)",
      "contained SectionVariableResolution(ref,document) > SectionVariableRef(id,document)",
      "contained SectionVariableResolution(test,document) > TestDocument(test,document)",
      "mirrors SectionVariableDuration(ref,test) > SectionDurationTarget(ref,test)[refKind=sectionVariable]",
      "mirrors SectionVariablePrefixed(ref,test) > PrefixedVariableSource(ref,test)[refKind=sectionVariable]",
    ],
  ],
  [
    "selection-bounds",
    [
      "capacity SelectionBounded(section) < StructureChild(parent)",
      "check SelectionBounded.SelectionBoundedWithoutReplacement",
      "contained Selection(section)[withReplacement=0] > SelectionBounded(section)",
      "contained Selection(section)[withReplacement=false] > SelectionBounded(section)",
      "contained SelectionBounded(section,select,withReplacement) > Selection(section,select,withReplacement)",
    ],
  ],
  [
    "selection-required",
    [
      "capacity Selection(section) < RequiredChild(parent)",
      "check RequiredChild.RequiredChildRequired",
      "contained AssessmentSection(id)[required=1] > RequiredChild(child)",
      "contained AssessmentSection(id)[required=true] > RequiredChild(child)",
      "contained ItemRef(id)[required=1] > RequiredChild(child)",
      "contained ItemRef(id)[required=true] > RequiredChild(child)",
      "contained RequiredChild(child,parent) > StructureChild(child,parent)",
    ],
  ],
  [
    "stimulus-ref-key",
    [
      "contained ItemStimulusRef(id,document) > Node(id,tree)",
      "key ItemStimulusRef(document,identifier)",
    ],
  ],
  [
    "stimulus-ref-target",
    [
      "contained ItemStimulusRef(id) > StimulusRefResolution(stimulusRef)",
      "contained StimulusRefResolution(package,path,document) > Document(package,path,id)[root=stimulus]",
    ],
  ],
  [
    "structure-count",
    [
      "capacity AdaptiveSelection(id) < Edge(parent)[childKind=qti-adaptive-engine-ref,parentKind=qti-adaptive-selection]",
      "capacity AdaptiveSelection(id) < Edge(parent)[childKind=qti-adaptive-settings-ref,parentKind=qti-adaptive-selection]",
      "capacity AdaptiveSelection(id) < Edge(parent)[childKind=qti-metadata-ref,parentKind=qti-adaptive-selection]",
      "capacity AdaptiveSelection(id) < Edge(parent)[childKind=qti-usagedata-ref,parentKind=qti-adaptive-selection]",
      "capacity AssessmentSection(id) < Edge(parent)[childKind=qti-adaptive-selection,parentKind=qti-assessment-section]",
      "capacity AssessmentSection(id) < Edge(parent)[childKind=qti-item-session-control,parentKind=qti-assessment-section]",
      "capacity AssessmentSection(id) < Edge(parent)[childKind=qti-ordering,parentKind=qti-assessment-section]",
      "capacity AssessmentSection(id) < Edge(parent)[childKind=qti-selection,parentKind=qti-assessment-section]",
      "capacity AssessmentSection(id) < Edge(parent)[childKind=qti-time-limits,parentKind=qti-assessment-section]",
      "capacity AssessmentStimulus(id) < Edge(parent)[childKind=qti-stimulus-body,parentKind=qti-assessment-stimulus]",
      "capacity AssessmentTest(id) < Edge(parent)[childKind=qti-outcome-processing,parentKind=qti-assessment-test]",
      "capacity AssessmentTest(id) < Edge(parent)[childKind=qti-test-part,parentKind=qti-assessment-test]",
      "capacity AssessmentTest(id) < Edge(parent)[childKind=qti-time-limits,parentKind=qti-assessment-test]",
      "capacity ItemRef(id) < Edge(parent)[childKind=qti-item-session-control,parentKind=qti-assessment-item-ref]",
      "capacity ItemRef(id) < Edge(parent)[childKind=qti-time-limits,parentKind=qti-assessment-item-ref]",
      "capacity TestFeedback(id) < Edge(parent)[childKind=qti-content-body.testFeedback,parentKind=qti-test-feedback]",
      "capacity TestPart(id) < Edge(parent)[childKind=qti-item-session-control,parentKind=qti-test-part]",
      "capacity TestPart(id) < Edge(parent)[childKind=qti-time-limits,parentKind=qti-test-part]",
      "capacity TestPart(id) < StructureChild(parent)",
      "capacity TestRubricBlock(id) < Edge(parent)[childKind=qti-content-body.testRubric,parentKind=qti-rubric-block.test]",
      "contained Edge(child,parent)[childKind=qti-assessment-item-ref,parentKind=qti-assessment-section] > StructureChild(child,parent)",
      "contained Edge(child,parent)[childKind=qti-assessment-section,parentKind=qti-assessment-section] > StructureChild(child,parent)",
      "contained Edge(child,parent)[childKind=qti-assessment-section,parentKind=qti-test-part] > StructureChild(child,parent)",
      "contained Edge(child,parent)[childKind=qti-assessment-section-ref,parentKind=qti-assessment-section] > StructureChild(child,parent)",
      "contained Edge(child,parent)[childKind=qti-assessment-section-ref,parentKind=qti-test-part] > StructureChild(child,parent)",
      "contained Edge(child,parent)[childKind=xi:include,parentKind=qti-assessment-section] > StructureChild(child,parent)",
      "contained Selection(id,section) > Edge(child,parent)",
      "contained Selection(section) > AssessmentSection(id)",
      "contained StructureChild(child,parent) > Edge(child,parent)",
      "key Selection(section)",
    ],
  ],
  [
    "structure-identifier",
    [
      "contained AssessmentSection(id,document) > Node(id,tree)",
      "contained AssessmentSection(id,document,identifier) > TestIdentifier(holder,scope,identifier)[holderKind=section]",
      "contained ItemRef(id,document) > Node(id,tree)",
      "contained ItemRef(id,document,identifier) > TestIdentifier(holder,scope,identifier)[holderKind=itemRef]",
      "contained SectionRef(id,document) > Node(id,tree)",
      "contained SectionRef(id,document,identifier) > TestIdentifier(holder,scope,identifier)[holderKind=sectionRef]",
      "contained TestIdentifier(holder)[holderKind=itemRef] > ItemRef(id)",
      "contained TestIdentifier(holder)[holderKind=part] > TestPart(id)",
      "contained TestIdentifier(holder)[holderKind=sectionRef] > SectionRef(id)",
      "contained TestIdentifier(holder)[holderKind=section] > AssessmentSection(id)",
      "contained TestPart(id,document) > Node(id,tree)",
      "contained TestPart(id,document,identifier) > TestIdentifier(holder,scope,identifier)[holderKind=part]",
      "contained TestReach(holder,identifier,holderKind) > TestIdentifier(holder,identifier,holderKind)",
      "key TestIdentifier(scope,identifier)",
      "key TestReach(test,identifier)",
    ],
  ],
  [
    "template-default-target",
    [
      "contained TemplateDefault(id,itemRef) > Edge(child,parent)",
      "contained TemplateDefault(itemDocument,templateIdentifier) > Declaration(document,identifier)[kind=template]",
      "contained TemplateDefault(itemRef,itemDocument) > ItemRefDocument(itemRef,document)",
    ],
  ],
  [
    "value-lexical",
    [
      "check ItemInstanceVariableRef.ItemInstancePositive",
      "contained ItemInstanceSpelling(ref) > ItemInstanceVariableRef(id)",
    ],
  ],
  [
    "variable-mapping-source",
    [
      "contained VariableMapping(id,itemRef) > Edge(child,parent)",
      "contained VariableMapping(itemDocument,source) > Declaration(document,identifier)[kind=outcome]",
      "contained VariableMapping(itemRef,itemDocument) > ItemRefDocument(itemRef,document)",
    ],
  ],
  ["variable-mapping-target", ["key VariableMapping(itemRef,target)"]],
];

/**
 * A side of the thin arms' mirrors: `ref` and `test` of one relation, selected or not.
 */
const lawSide = (relation: string, selection: LawSideOf["selection"] = []): LawSideOf => ({
  fields: ["ref", "test"],
  relation,
  selection,
});

describe("the rules of the phase-5 statements", () => {
  for (const [rule, signatures] of phaseRules) {
    it(`maps ${signatures.length} statement(s) to ${rule}, none to the fallback`, () => {
      for (const signature of signatures) {
        const found = composed.filter((signed) => collapse(signed.signature) === signature);

        assert.isAbove(found.length, 0, `${signature} is a statement of Qti`);
        for (const { law } of found) {
          assert.strictEqual(ruleOfLaw(law), rule, signature);
          assert.isTrue(isMappedLaw(law), signature);
        }
      }
    });
  }

  it("lists every statement that names a relation of the phase's modules", () => {
    const listed = new Set(phaseRules.flatMap(([, signatures]) => signatures));
    const missing = composed
      .filter(
        (signed) =>
          !isNodeLaw(signed.signature) &&
          signed.relations.some((name) => phaseRelations.has(name)) &&
          !listed.has(collapse(signed.signature)),
      )
      .map((signed) => signed.signature);

    assert.deepStrictEqual([...new Set(missing)], []);
  });

  it("maps both halves of the two thin arms' mirrors to section-variable-ref", () => {
    const pairs = [
      [
        lawSide("SectionVariablePrefixed"),
        lawSide("PrefixedVariableSource", [{ field: "refKind", value: "sectionVariable" }]),
      ],
      [
        lawSide("SectionVariableDuration"),
        lawSide("SectionDurationTarget", [{ field: "refKind", value: "sectionVariable" }]),
      ],
    ] as const;

    for (const [thin, hub] of pairs) {
      assertMapped({ from: thin, kind: "mirrors", to: hub }, "section-variable-ref");
      assertMapped({ from: hub, kind: "mirrors", to: thin }, "section-variable-ref");
    }
  });

  it("holds each listed signature once", () => {
    const signatures = phaseRules.flatMap(([, listed]) => listed);

    assert.strictEqual(new Set(signatures).size, signatures.length);
  });
});

/**
 * The composed laws whose signature is exactly `signature`.
 */
const lawsOf = (signature: string): readonly ImportLaw[] =>
  composed.filter((signed) => signed.signature === signature).map((signed) => signed.law);

/**
 * Assert the composed schema states `signature` once and that its law maps to `rule`.
 */
const assertStated = (signature: string, rule: string): void => {
  const found = lawsOf(signature);

  assert.strictEqual(found.length, 1, signature);
  for (const law of found) {
    assertMapped(law, rule);
  }
};

describe("the rules of the MathML laws (spec 4.13)", () => {
  const mathmlPatterns = Object.entries(patterns).filter(([name]) => name.startsWith("mathml"));

  it("names the 28 MathML pattern sources, each its own source", () => {
    assert.strictEqual(mathmlPatterns.length, 28);
    assert.strictEqual(new Set(mathmlPatterns.map(([, source]) => source)).size, 28);
  });

  it("maps each MathML pattern source to attribute-lexical", () => {
    for (const [name, source] of mathmlPatterns) {
      assert.isTrue(patternRuleSources.includes(source), name);
      assertMapped(pattern(source), "attribute-lexical");
    }
  });

  it("maps each family's containment into the matrix to attribute-admission", () => {
    assert.strictEqual(families.length, 67);
    for (const family of families) {
      assertStated(
        `contained ${family.relation}(kind,attribute) > MathmlAttributeType(kind,attribute)[type=${family.handle}]`,
        "attribute-admission",
      );
    }
  });

  it("maps each family's containment into Node to attribute-admission", () => {
    for (const family of families) {
      assertStated(
        `contained ${family.relation}(node,kind) > Node(id,kind)`,
        "attribute-admission",
      );
    }
  });

  it("maps the matrix's containment into AttributeAdmission to attribute-admission", () => {
    assertStated(
      "contained MathmlAttributeType(kind,attribute) > AttributeAdmission(kind,attribute)",
      "attribute-admission",
    );
  });

  it("maps the class and dir exclusions to attribute-admission", () => {
    assertStated("check NodeClass.NodeClassNotMathml", "attribute-admission");
    assertStated("check NodeDir.NodeDirNotMathml", "attribute-admission");
  });

  it("maps the three capacities to union-count", () => {
    assertStated(
      "capacity MathmlMmultiscripts(id) < Edge(parent)[childKind=m:mprescripts]",
      "union-count",
    );
    assertStated("capacity MathmlBvar(id) < Edge(parent)[childKind=m:degree]", "union-count");
    assertStated(
      "capacity MathmlPiecewise(id) < Edge(parent)[childKind=m:otherwise]",
      "union-count",
    );
  });
});
