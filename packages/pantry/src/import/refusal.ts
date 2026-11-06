/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The names a refused import carries, and the maps from what refused it to one of them.
 *
 * What refuses a package is one of three things: a guard that judged the rows before any write, the
 * reader that could not read the input, or grizzle's `invariant-rejected` outcome naming the law of
 * the schema that the apply broke. {@link ruleOfError} maps the first two and {@link ruleOfLaw} the
 * third, so a caller and a test see one closed roster, {@link ImportRule}, whichever refused.
 */
import { Match, Schema } from "effect";
import type { ContentGuardRefusal } from "#pantry/import/guards/content.ts";
import type { ItemGuardRefusal } from "#pantry/import/guards/item.ts";
import type { ManifestGuardRefusal } from "#pantry/import/guards/manifest.ts";
import type { ProcessingGuardRefusal } from "#pantry/import/guards/processing.ts";
import type { ReferenceGuardRefusal } from "#pantry/import/guards/reference.ts";
import type { TestGuardRefusal } from "#pantry/import/guards/test.ts";
import type { GuardRefusal } from "#pantry/import/guards/tree.ts";
import type { UsageGuardRefusal } from "#pantry/import/guards/usage.ts";
import type { WildcardGuardRefusal } from "#pantry/import/guards/wildcard.ts";
import type { NotQti3 } from "#pantry/import/manifest.ts";
import type { ProcessingRefused } from "#pantry/import/processing.ts";
import type { ExternalRefusal } from "#pantry/import/record.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import type { ZipRefusal } from "#pantry/package/zip.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";

/**
 * Every name a refused import may carry: the rules the schema holds at commit, the guards that run
 * before the apply and the reader's refusals.
 *
 * The `P` names are the rule ids of the processing model's refusals (spec 4.10): bin 1 is the
 * schema's (`P1` to `P13`, `P17`, `P36`), `P5` the builder's, and `P20` to `P32` the checker's and
 * the guards'. `arm-expression`, `ref-exists`, `condition-edge` and `outcome-minmax-kind` name the
 * schema's structural laws of that model, which 4.10 lists as representatives without an id.
 */
export const ImportRule = Schema.Literals([
  "admission",
  "edge-parent",
  "schema-version",
  "resource-type",
  "resource-root",
  "manifest-identifier",
  "resource-identifier",
  "file-exists",
  "href-path",
  "dependency-target",
  "document-key",
  "root-identifier",
  "root-title",
  "declaration-key",
  "declaration-reserved",
  "value-base-type",
  "value-single",
  "value-present",
  "value-lexical",
  "value-set-role",
  "binding-key",
  "binding-declared",
  "binding-fit",
  "binding-max",
  "binding-exists",
  "choice-present",
  "choice-parent",
  "choice-bounds",
  "choice-key",
  "prompt-single",
  "body-single",
  "processing-single",
  "processing-item",
  "processing-root",
  "manifest-children",
  "schema-single",
  "resource-metadata-single",
  "resource-file-present",
  "lom-general-single",
  "lom-title-single",
  "lom-identifier",
  "lom-title",
  "qti-metadata-single",
  "qti-metadata-child-single",
  "tool-string-length",
  "uri-syntax",
  "attribute-lexical",
  "text-copy",
  "typed-copy",
  "template-derivation",
  "ordering",
  "reachability",
  "body-empty",
  "file-listed",
  "href-listed",
  "manifest-root",
  "manifest-id-space",
  "not-qti3",
  "unmodeled-vocabulary",
  "well-formedness",
  "reader-refusal",
  "union-count",
  "idref-copy",
  "varref-copy",
  "lang-set-copy",
  "owner-copy",
  "max-strings-required",
  "aria-value-range",
  "mastery-range",
  "string-identifier-distinct",
  "same-table-headers",
  "q-punctuation",
  "attribute-admission",
  "idref-target",
  "coords-owner",
  "ancestry-ban",
  "ancestry-step",
  "adaptive-feedback",
  "gap-multiple",
  "record-binding-fit",
  "order-choice-count",
  "template-ref",
  "feedback-ref",
  "printed-variable-ref",
  "string-binding",
  "match-sets",
  "details-summary",
  "picture-img",
  "picture-source",
  "table-parts",
  "source-srcset",
  "track-srclang",
  "colgroup-span",
  "bdo-dir",
  "aria-role",
  "modal-body",
  "context-id",
  "label-tool",
  "document-lang",
  "mapping-base-type",
  "area-mapping-point",
  "table-outcome",
  "map-key-lexical",
  "normal-maximum",
  "reserved-type",
  "hotspot-default",
  "required-attribute",
  "lom-capacity",
  "lom-learning-resource-type",
  "qti-metadata-host",
  "file-metadata-single",
  "file-lom-owner",
  "external-lom-owner",
  "variant-target",
  "variant-resource",
  "variant-key",
  "variant-metadata",
  "drd-value",
  "drd-single",
  "manifest-id-holder",
  "csm-capacity",
  "csm-single",
  "usage-root",
  "usage-statistic-kind",
  "usage-count",
  "usage-key",
  "usage-typed-value",
  "usage-lexical",
  "outcome-document",
  "calendar",
  "root-type-reverse",
  "record-unnamed",
  "entry-kind",
  "zip-format",
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
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
  "P12",
  "P13",
  "P17",
  "P20",
  "P21",
  "P22",
  "P23",
  "P24",
  "P25",
  "P26",
  "P27",
  "P28",
  "P29",
  "P30",
  "P31",
  "P32",
  "P36",
  "arm-expression",
  "ref-exists",
  "condition-edge",
  "outcome-minmax-kind",
  "wildcard-namespace",
  "wildcard-declared",
  "wildcard-attribute",
  "xsi-type",
  "xsi-nil",
]);

/**
 * One name of the roster.
 */
export type Rule = typeof ImportRule.Type;

/**
 * The package was refused under one rule of the roster.
 *
 * `detail` says what broke it. `law` is the schema's law as grizzle reported it, present when the
 * database refused the apply.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  law: Schema.optional(Schema.Unknown),
  rule: ImportRule,
}) {
  /**
   * What was refused and by which rule, in one sentence.
   */
  override get message(): string {
    return `The package was refused under the ${this.rule} rule: ${this.detail}`;
  }
}

/**
 * A value a law's selection holds: a handle, a number or one of the engine's value objects.
 */
type SelectedValue = bigint | boolean | number | object | string;

/**
 * One side of a containment, mirrors or capacity law: a relation, the fields it names and the
 * values the statement selects on it, as `Edge(parent)` selected on `childKind`. `selection` is
 * absent on a hand-written law and empty on a side that selects nothing.
 */
interface LawSide {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection?: readonly { readonly field: string; readonly value: SelectedValue }[];
}

/**
 * Whether a side selects `field` equal to `value`, or on any value when none is given.
 */
const selects = (side: LawSide, field: string, value?: string): boolean =>
  side.selection?.some(
    (pair) => pair.field === field && (value === undefined || pair.value === value),
  ) ?? false;

/**
 * Whether a side's fields are exactly `fields`, in order.
 */
const fieldsAre = (side: LawSide, ...fields: readonly string[]): boolean =>
  side.fields.join(",") === fields.join(",");

/**
 * A law as grizzle reports it in an `invariant-rejected` outcome (the engine's `Law`), the parts
 * this module reads. A `pattern` law carries the regex and no relation: grizzle reports one law for
 * every spelling of one language.
 */
export type ImportLaw =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly from: LawSide; readonly kind: "contained"; readonly to: LawSide }
  | { readonly from: LawSide; readonly kind: "mirrors"; readonly to: LawSide }
  | { readonly from: LawSide; readonly kind: "coverage"; readonly to: LawSide }
  | { readonly field: string; readonly kind: "alternatives"; readonly relation: string }
  | {
      readonly arm: string;
      readonly field: string;
      readonly handles: readonly [string, ...string[]];
      readonly kind: "alternativesArm";
      readonly relation: string;
    }
  | { readonly from: LawSide; readonly kind: "capacity"; readonly target: LawSide }
  | { readonly contract: string; readonly kind: "contract" }
  | { readonly field: string; readonly kind: "numericBound"; readonly relation: string }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string };

/**
 * The rule a law maps to, and whether the schema's statement was recognized.
 */
interface Mapped {
  readonly mapped: boolean;
  readonly rule: Rule;
}

const named = (rule: Rule): Mapped => ({ mapped: true, rule });

/**
 * The nearest rule for a law no row of the map names, by the kind of the law alone. It is a sort,
 * not a claim: the caller keeps the law verbatim in the refusal.
 */
const nearest = (law: ImportLaw): Mapped => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return { mapped: false, rule: "document-key" };
  }

  if (law.kind === "check" || law.kind === "numericBound" || law.kind === "capacity") {
    return { mapped: false, rule: "binding-max" };
  }

  if (law.kind === "pattern" || law.kind === "contract") {
    return { mapped: false, rule: "value-lexical" };
  }

  return { mapped: false, rule: "admission" };
};

/**
 * The rule of a key, by the relation and the fields it constrains.
 */
const keyRules = new Map<string, Rule>([
  ["Declaration.(document,identifier)", "declaration-key"],
  ["DocumentIdentifier.(package,resource)", "root-identifier"],
  ["DocumentTitle.(package,resource)", "root-title"],
  ["Edge.(child)", "edge-parent"],
  ["ForeignAttribute.(node,prefix,local)", "wildcard-attribute"],
  ["InteractionBinding.(document,responseIdentifier)", "binding-key"],
  ["ItemBody.(item)", "body-single"],
  ["ItemStimulusRef.(document,identifier)", "stimulus-ref-key"],
  ["LomGeneral.(lom)", "lom-general-single"],
  ["LomGeneralTitle.(lom)", "lom-title-single"],
  ["LomObjectIdentifier.(lom)", "lom-identifier"],
  ["LomObjectTitle.(lom)", "lom-title"],
  ["Manifest.(id)", "manifest-identifier"],
  ["ManifestMetadata.(manifest)", "manifest-children"],
  ["ManifestSchema.(metadata)", "schema-single"],
  ["ManifestSchemaVersion.(metadata)", "schema-single"],
  ["Organizations.(manifest)", "manifest-children"],
  ["OutcomeElseArm.(condition)", "P4"],
  ["OutcomeIfArm.(condition)", "P4"],
  ["Package.(id)", "manifest-identifier"],
  ["Prompt.(parent)", "prompt-single"],
  ["Resource.(package,identifier)", "resource-identifier"],
  ["ResourceMetadata.(resource)", "resource-metadata-single"],
  ["Resources.(manifest)", "manifest-children"],
  ["ResponseElseArm.(condition)", "P4"],
  ["ResponseIfArm.(condition)", "P4"],
  ["ResponseProcessingItem.(item)", "processing-single"],
  ["RuleOperand.(child)", "P3"],
  ["Selection.(section)", "structure-count"],
  ["SimpleChoice.(interaction,identifier)", "choice-key"],
  ["TemplateElseArm.(condition)", "P4"],
  ["TemplateIfArm.(condition)", "P4"],
  ["TemplateProcessing.(item)", "P17"],
  ["TestIdentifier.(scope,identifier)", "structure-identifier"],
  ["TestReach.(test,identifier)", "structure-identifier"],
  ["TypedDeclaration.(document,identifier)", "declaration-key"],
  ["StringBinding.(document,identifier)", "string-binding"],
  ["ResourceLomGeneral.(package,resource)", "document-lang"],
  ["ResourceLomLanguageSet.(package,resource,value)", "document-lang"],
  ["ValueSet.(declaration,role)", "value-set-role"],
  ["VariableMapping.(itemRef,target)", "variable-mapping-target"],
]);

const keyRule = (relation: string, fields: readonly string[]): Rule | undefined => {
  const rule = keyRules.get(`${relation}.(${fields.join(",")})`);
  if (rule !== undefined) {
    return rule;
  }

  if (relation === "AttributeLexical" || relation === "AttributeSpelling") {
    return "attribute-lexical";
  }

  if (relation === "Document") {
    return "document-key";
  }

  if (fields.join(",") === "interaction,identifier") {
    return "choice-key";
  }

  if (fields.join(",") === "document,id") {
    return "document-key";
  }

  return relation.startsWith("Qmd") && fields.length === 1
    ? "qti-metadata-child-single"
    : undefined;
};

/**
 * The rule of a row check, by its name in the schema.
 */
const checkRules = new Map<string, Rule>([
  ["AdaptiveFeedback", "adaptive-feedback"],
  ["AriaRoleH1", "aria-role"],
  ["AriaRoleNotSource", "aria-role"],
  ["AssociableHotspotBounds", "choice-bounds"],
  ["AssociateBounds", "choice-bounds"],
  ["AssessmentItemLabelRoot", "label-tool"],
  ["BdoDirNotAuto", "bdo-dir"],
  ["BindingMax", "binding-max"],
  ["BranchTargetKind", "branch-target"],
  ["BuiltInRefKind", "P9"],
  ["ChoiceBounds", "choice-bounds"],
  ["ChoiceTemplateRefType", "template-ref"],
  ["DeclarationNotReserved", "declaration-reserved"],
  ["DeclaredRefKind", "P8"],
  ["DependencyNotSelf", "dependency-target"],
  ["EqualRoundedFigures", "P10"],
  ["EqualRoundedFiguresRefZero", "P32"],
  ["FeedbackOutcomeRefType", "feedback-ref"],
  ["ForeignAttributePrefix", "wildcard-attribute"],
  ["ForeignUnqualifiedUnprefixed", "wildcard-attribute"],
  ["GapImgBounds", "choice-bounds"],
  ["GapMatchBounds", "choice-bounds"],
  ["GapTextBounds", "choice-bounds"],
  ["GraphicAssociateBounds", "choice-bounds"],
  ["GraphicGapMatchBounds", "choice-bounds"],
  ["GraphicOrderChoiceBounds", "choice-bounds"],
  ["GraphicOrderMinChoicesPositive", "attribute-lexical"],
  ["HotspotChoiceBounds", "choice-bounds"],
  ["HottextChoiceBounds", "choice-bounds"],
  ["IndexNRefZero", "P32"],
  ["IndexPositive", "P11"],
  ["ItemInstancePositive", "value-lexical"],
  ["ItemInstanceVariableRoot", "prefixed-root"],
  ["ItemRefLtiType", "item-ref-target"],
  ["ItemToolRoot", "attribute-admission"],
  ["ItemVariableRoot", "prefixed-root"],
  ["LomLearningResourceType", "lom-learning-resource-type"],
  ["MatchBounds", "choice-bounds"],
  ["MaxAttemptsInt", "attribute-lexical"],
  ["MediaPlays", "choice-bounds"],
  ["NoDefaultHotspotInGraphicGapMatch", "hotspot-default"],
  ["NodeLabelNotRoot", "attribute-admission"],
  ["OrderChoiceBounds", "choice-bounds"],
  ["OrderMinChoicesPositive", "attribute-lexical"],
  ["OutcomeMinMaxKind", "outcome-minmax-kind"],
  ["PositionObjectChoiceBounds", "choice-bounds"],
  ["PrefixedBuiltInName", "prefixed-ref"],
  ["PrefixedVariableSourceKind", "prefixed-ref"],
  ["PrintedVariableRefKind", "printed-variable-ref"],
  ["PrintedVariableVarRefType", "printed-variable-ref"],
  ["ProcessingRoot", "processing-root"],
  ["RepeatInt", "P6"],
  ["RepeatNumberRepeatsRefZero", "P32"],
  ["RequiredChildRequired", "selection-required"],
  ["ReservedOutcomeTypes", "reserved-type"],
  ["RoundToFigures", "P10"],
  ["RoundToFiguresRefZero", "P32"],
  ["SectionDurationRoot", "prefixed-root"],
  ["SectionDurationTargetHolder", "prefixed-ref"],
  ["SectionDurationTargetKind", "prefixed-ref"],
  ["SectionFeedbackOutcomeRefType", "feedback-ref"],
  ["SectionIdentifierTargetHolderKind", "section-identifier-target"],
  ["SectionPrintedVariableRefKind", "printed-variable-ref"],
  ["SectionPrintedVariableVarRefType", "printed-variable-ref"],
  ["SectionVariableDeclaredKind", "P8"],
  ["SectionVariableReferrer", "section-variable-ref"],
  ["SectionVariableRoot", "section-variable-ref"],
  ["SelectionBoundedWithoutReplacement", "selection-bounds"],
  ["SelectionSelectInt", "attribute-lexical"],
  ["RuleOperandKind", "P3"],
  ["SelectPointChoiceBounds", "choice-bounds"],
  ["SimpleAssociableChoiceBounds", "choice-bounds"],
  ["TemplateContentRefType", "template-ref"],
  ["TemplateParameterReferrer", "P13"],
  ["TemplateParameterRoot", "P13"],
  ["VariableWeightInTest", "P12"],
  ["VariantNotSelf", "variant-target"],
  ["XIncludeParseXml", "include-parse"],
  ["XsiNilUndeclared", "xsi-nil"],
  ["XsiTypeAttributePrefix", "xsi-type"],
]);

/**
 * The rule of a check whose name is a form, not a roster entry: `<Relation>Attribute` holds an
 * attribute relation's constant `attribute` column (the relation's own containment into
 * `AttributeAdmission` reads it), and `<Name>ByVersion` is a version-gated attribute value
 * (goal 3.9). `HeadersTarget`'s constant belongs to the `IDREFS` copy it is contained by.
 */
const checkRuleByForm = (relation: string, name: string): Rule | undefined => {
  if (name === `${relation}Attribute`) {
    return relation === "HeadersTarget" ? "idref-copy" : "attribute-admission";
  }

  return name.endsWith("ByVersion") ? "attribute-lexical" : undefined;
};

/**
 * The rule of a capacity, by the relation it bounds and the one that fills it, as
 * `bounded<filler>`.
 */
const capacityRules = new Map<string, Rule>([
  ["AreaMapEntry<Coords", "coords-owner"],
  ["AssessmentSection<StructureChild", "section-empty"],
  ["AssociableHotspot<Coords", "coords-owner"],
  ["ChoiceInteraction<SimpleChoice", "choice-present"],
  ["ColgroupSpan<Edge", "colgroup-span"],
  ["Details<Edge", "details-summary"],
  ["EqualRounded<EqualRoundedFiguresRef", "P32"],
  ["Document<DocumentIdentifier", "root-identifier"],
  ["Document<DocumentTitle", "root-title"],
  ["Expression<Operand", "P2"],
  ["ExpressionMax<Operand", "P2"],
  ["GapMatchBinding<Gap", "gap-multiple"],
  ["GraphicOrderInteraction<HotspotChoice", "order-choice-count"],
  ["HotspotChoice<Coords", "coords-owner"],
  ["Index<IndexNRef", "P32"],
  ["InlineChoiceInteraction<InlineChoice", "choice-present"],
  ["ManifestMetadata<ManifestSchema", "schema-single"],
  ["ManifestMetadata<ManifestSchemaVersion", "schema-single"],
  ["MatchInteraction<Edge", "match-sets"],
  ["ModalFeedback<Edge", "modal-body"],
  ["Node<NodeDir", "bdo-dir"],
  ["OrderInteraction<SimpleChoice", "order-choice-count"],
  ["Package<ManifestMetadata", "manifest-children"],
  ["Package<Organizations", "manifest-children"],
  ["Package<Resources", "manifest-children"],
  ["Repeat<RepeatNumberRepeatsRef", "P32"],
  ["Resource<File", "resource-file-present"],
  ["ResourceLomIdentified<LomIdentifier", "lom-identifier"],
  ["ResourceLomIdentified<LomObjectIdentifier", "lom-identifier"],
  ["ResourceLomTitled<LomGeneralTitle", "lom-title-single"],
  ["ResourceLomTitled<LomObjectTitle", "lom-title"],
  ["RoundTo<RoundToFiguresRef", "P32"],
  ["Selection<RequiredChild", "selection-required"],
  ["SelectionBounded<StructureChild", "selection-bounds"],
  ["Table<Edge", "table-parts"],
  ["TestPart<StructureChild", "structure-count"],
  ["TypedValueSet<DeclaredValue", "value-single"],
  ["ValueSet<DeclaredValue", "value-present"],
  ["XInclude<XIncludeXpointer", "include-xpointer"],
]);

/**
 * The rule of a capacity. A capacity is named by the relation it bounds and the one that fills it;
 * the two `Picture` capacities fill from the same `Edge` and differ by the child kind they select,
 * whether or not they also select the parent kind `picture`.
 */
const capacityRule = (target: LawSide, from: LawSide): Rule | undefined => {
  if (target.relation === "StimulusBody") {
    return "attribute-admission";
  }

  if (target.relation === "Picture" && from.relation === "Edge") {
    if (selects(from, "childKind", "img")) {
      return "picture-img";
    }

    return selects(from, "childKind", "source") ? "picture-source" : undefined;
  }

  return capacityRules.get(`${target.relation}<${from.relation}`);
};

/**
 * The containments of the phase-5 test layer, each rule beside the `from>to` pairs it names. A
 * statement the spec's 4.16 gives no name is filed under the closest (decision 177):
 *
 * - A holder's copy of its document into `Node`, and the containments between a holder and its
 *   `TestIdentifier`, are `structure-identifier`; a stimulus reference's own copy is
 *   `stimulus-ref-key`;
 * - `StructureChild` and the `Edge` rows it counts, and a `Selection`'s own, are `structure-count`;
 * - A branch rule's owner statements are `branch-target`, and a weight's link to its edge `P12`;
 * - A `TestDocument` row's containments are the reach, `reach-copy`;
 * - The root checks of the prefixed arms are `prefixed-root` and E18's `section-variable-ref`; an
 *   arm's containment into `VariableRef` keeps the `ref-exists` form every arm has.
 */
const testContainedEntries: readonly (readonly [Rule, readonly string[]])[] = [
  ["P12", ["Weight>Edge"]],
  ["P8", ["SectionVariableDeclared>Declaration", "SectionVariableDeclared>SectionVariableRef"]],
  ["attribute-admission", ["ItemTool>AssessmentItem", "ItemTool>Tree", "StimulusBody>Node"]],
  [
    "branch-target",
    [
      "BranchRule>AssessmentSection",
      "BranchRule>Edge",
      "BranchRule>ItemRef",
      "BranchRule>TestPart",
      "BranchRuleTarget>BranchRule",
      "BranchRuleTarget>TestIdentifier",
    ],
  ],
  [
    "item-ref-target",
    ["ItemRef>ItemRefResolution", "ItemRefDocument>Document", "ItemRefLti>Resource"],
  ],
  ["label-tool", ["AssessmentItemLabel>Tree"]],
  [
    "prefixed-ref",
    [
      "ItemInstanceVariableRef>PrefixedVariableSource",
      "ItemVariableRef>PrefixedVariableSource",
      "PrefixedBuiltIn>PrefixedVariableSource",
      "PrefixedDeclared>Declaration",
      "PrefixedDeclared>PrefixedVariableSource",
      "PrefixedMapped>PrefixedVariableSource",
      "PrefixedMapped>VariableMapping",
      "PrefixedVariableSource>ItemInstanceVariableRef",
      "PrefixedVariableSource>ItemRefDocument",
      "PrefixedVariableSource>ItemVariableRef",
      "PrefixedVariableSource>TestDocument",
      "PrefixedVariableSource>TestReach",
      "PrefixedVariableSource>VariableRef",
      "SectionDurationRef>SectionDurationTarget",
      "SectionDurationTarget>SectionDurationRef",
      "SectionDurationTarget>TestDocument",
      "SectionDurationTarget>TestReach",
      "SectionDurationTarget>VariableRef",
    ],
  ],
  [
    "prefixed-root",
    ["ItemInstanceVariableRef>Document", "ItemVariableRef>Document", "SectionDurationRef>Document"],
  ],
  ["reach-copy", ["TestDocument>Document"]],
  [
    "section-identifier-target",
    [
      "SectionIdentifierTarget>ExpressionSectionIdentifier",
      "SectionIdentifierTarget>Node",
      "SectionIdentifierTarget>TestDocument",
      "SectionIdentifierTarget>TestReach",
    ],
  ],
  ["section-ref-target", ["SectionRef>SectionRefResolution", "SectionRefResolution>Document"]],
  [
    "section-variable-ref",
    [
      "SectionVariableRef>Document",
      "SectionVariableRef>Node",
      "SectionVariableResolution>SectionVariableRef",
      "SectionVariableResolution>TestDocument",
    ],
  ],
  ["selection-bounds", ["Selection>SelectionBounded", "SelectionBounded>Selection"]],
  [
    "selection-required",
    ["AssessmentSection>RequiredChild", "ItemRef>RequiredChild", "RequiredChild>StructureChild"],
  ],
  ["stimulus-ref-key", ["ItemStimulusRef>Node"]],
  [
    "stimulus-ref-target",
    ["ItemStimulusRef>StimulusRefResolution", "StimulusRefResolution>Document"],
  ],
  [
    "structure-count",
    ["Edge>StructureChild", "Selection>AssessmentSection", "Selection>Edge", "StructureChild>Edge"],
  ],
  [
    "structure-identifier",
    [
      "AssessmentSection>Node",
      "AssessmentSection>TestIdentifier",
      "ItemRef>Node",
      "ItemRef>TestIdentifier",
      "SectionRef>Node",
      "SectionRef>TestIdentifier",
      "TestIdentifier>AssessmentSection",
      "TestIdentifier>ItemRef",
      "TestIdentifier>SectionRef",
      "TestIdentifier>TestPart",
      "TestPart>Node",
      "TestPart>TestIdentifier",
      "TestReach>TestIdentifier",
    ],
  ],
  [
    "template-default-target",
    ["TemplateDefault>Declaration", "TemplateDefault>Edge", "TemplateDefault>ItemRefDocument"],
  ],
  ["value-lexical", ["ItemInstanceSpelling>ItemInstanceVariableRef"]],
  [
    "variable-mapping-source",
    ["VariableMapping>Declaration", "VariableMapping>Edge", "VariableMapping>ItemRefDocument"],
  ],
];

/**
 * The relations of the test layer's optional attribute values and defaulted markers: a containment
 * that leaves one of them states that its host carries the attribute, `attribute-admission`.
 */
const attributeValueHosts: ReadonlySet<string> = new Set([
  "DeclaredAllowComment",
  "DeclaredAllowLateSubmission",
  "DeclaredAllowReview",
  "DeclaredAllowSkipping",
  "DeclaredOrderingShuffle",
  "DeclaredShowFeedback",
  "DeclaredShowSolution",
  "DeclaredValidateResponses",
  "DeclaredWithReplacement",
  "ItemRefCategory",
  "ItemSessionMaxAttempts",
  "ItemStimulusRefTitle",
  "TestFeedbackTitle",
  "TestPartTitle",
  "TestRubricBlockUse",
  "TimeLimitMax",
  "TimeLimitMin",
]);

/**
 * The rule of a containment, by the relation it leaves and the one it enters, as `from>to`.
 */
const containedRules = new Map<string, Rule>([
  ...testContainedEntries.flatMap(([rule, pairs]) =>
    pairs.map((pair): [string, Rule] => [pair, rule]),
  ),
  ["AssessmentItemLabel>ItemToolBoth", "label-tool"],
  ["AttributeIdref>DocumentId", "idref-target"],
  ["AttributeIdref>Node", "idref-target"],
  ["ContextDeclarationArm>ContextDeclarationId", "context-id"],
  ["ContextDeclarationId>Node", "document-key"],
  ["DeclaredValue>TypedValueSet", "value-base-type"],
  ["Dependency>Resource", "dependency-target"],
  ["Document>PackageEntry", "file-exists"],
  ["Edge>Admission", "admission"],
  ["Edge>AncestryStep", "ancestry-step"],
  ["File>PackageEntry", "file-exists"],
  ["FileContent>PackageEntry", "file-exists"],
  ["ForeignAttribute>AttributeWildcard", "wildcard-attribute"],
  ["HeadersTarget>AttributeIdref", "idref-copy"],
  ["HeadersTarget>HtmlId", "idref-target"],
  ["HtmlId>Node", "document-key"],
  ["InteractionBinding>AssessmentItem", "adaptive-feedback"],
  ["InteractionBinding>Declaration", "binding-declared"],
  ["ItemBodyId>Node", "document-key"],
  ["Mapping>MappableBaseType", "mapping-base-type"],
  ["Node>AncestryStep", "ancestry-ban"],
  ["PrintedVariableId>Node", "document-key"],
  ["RecordBinding>RecordBindingFit", "record-binding-fit"],
  ["ResponseProcessing>TreeRoot", "processing-root"],
  ["SimpleChoice>ChoiceInteraction", "choice-parent"],
  ["SimpleChoice>Edge", "choice-parent"],
  ["Source>SourceSrcset", "source-srcset"],
  ["Track>TrackSrclang", "track-srclang"],
  ["TypedBinding>BindingFit", "binding-fit"],
  ["XsiTypeAttribute>XsiType", "xsi-type"],
]);

/**
 * The rule of every containment that leaves one of these relations: each is a reference to a
 * declared variable, or the binding of a string to one, and all its containments state one law.
 */
const referenceRules = new Map<string, Rule>([
  ["ChoiceTemplateRef", "template-ref"],
  ["FeedbackOutcomeRef", "feedback-ref"],
  ["PrintedVariableRef", "printed-variable-ref"],
  ["PrintedVariableVarRef", "printed-variable-ref"],
  ["SectionFeedbackOutcomeRef", "feedback-ref"],
  ["SectionPrintedVariableRef", "printed-variable-ref"],
  ["SectionPrintedVariableVarRef", "printed-variable-ref"],
  ["StringBinding", "string-binding"],
  ["TemplateContentRef", "template-ref"],
]);

/**
 * The relations whose containments state one law, by the relation they leave: the copy of a count
 * attribute's typed value to its interaction's column is a typed copy, and a reference arm of a
 * processing attribute is held by the parent that selects it, `P32`.
 */
const copyLeaves = new Map<string, Rule>([
  ["EqualRoundedFiguresRef", "P32"],
  ["GraphicOrderMaxChoicesN", "typed-copy"],
  ["GraphicOrderMinChoicesN", "typed-copy"],
  ["IndexNRef", "P32"],
  ["OrderMaxChoicesN", "typed-copy"],
  ["OrderMinChoicesN", "typed-copy"],
  ["RepeatNumberRepeatsRef", "P32"],
  ["RoundToFiguresRef", "P32"],
]);

/**
 * The rule of the two containments that state a manifest's `cp:schemaversion` is its package's
 * `schemaversion`: both are a typed copy, though the second enters `Package.schemaversion`, which a
 * resource's own containment names `schema-version`.
 */
const schemaVersionCopyRule = (from: LawSide): Rule | undefined =>
  from.relation === "ManifestSchemaVersion" &&
  (fieldsAre(from, "metadata", "package") || fieldsAre(from, "package", "version"))
    ? "typed-copy"
    : undefined;

/**
 * The relations of the document and LOM language sets: a containment that leaves or enters one of
 * them is the rule that every `xml:lang` of a document is a `general.language` of its resource's
 * record (R26) or that the record's set is complete.
 */
const languageRelations = new Set(["DocumentLang", "ResourceLomGeneral", "ResourceLomLanguageSet"]);

/**
 * The tables whose variable is a single-cardinality outcome.
 */
const tableRelations = new Set(["InterpolationTable", "MatchTable"]);

/**
 * The relations the schema's `Literal` value arms are, `valueArms("Literal")`'s eleven.
 */
const literalArms: ReadonlySet<string> = new Set([
  "LiteralBoolean",
  "LiteralDirectedPair",
  "LiteralDuration",
  "LiteralFile",
  "LiteralFloat",
  "LiteralIdentifier",
  "LiteralInteger",
  "LiteralPair",
  "LiteralPoint",
  "LiteralString",
  "LiteralUri",
]);

/**
 * The relations that hold the arity seeds a processing expression is judged against.
 */
const arityRelations: ReadonlySet<string> = new Set([
  "OperatorArity",
  "OperatorArityMax",
  "OperatorArityUnbounded",
]);

/**
 * The relations of the six condition arms that bind their condition copy into `Edge`, and of the
 * operand rows that bind their position into it.
 */
const edgeBoundArms: ReadonlySet<string> = new Set([
  "Operand",
  "OutcomeElseArm",
  "OutcomeIfArm",
  "ResponseElseArm",
  "ResponseIfArm",
  "RuleOperand",
  "TemplateElseArm",
  "TemplateIfArm",
]);

/**
 * The rule of a containment of the processing model, by the relation it leaves and the one it
 * enters, as `from>to`.
 */
const processingContained = new Map<string, Rule>([
  ["BuiltInRef>Node", "P9"],
  ["DeclaredRef>Declaration", "P8"],
  ["DeclaredRef>Node", "P8"],
  ["Equal>EqualTolerance", "P36"],
  ["EqualTolerance>Equal", "P36"],
  ["Expression>ExpressionMax", "P2"],
  ["Expression>Node", "arm-expression"],
  ["ExpressionMax>Expression", "P2"],
  ["OutcomeMaximumArm>OutcomeMinMax", "outcome-minmax-kind"],
  ["OutcomeMinMax>Node", "outcome-minmax-kind"],
  ["OutcomeMinimumArm>OutcomeMinMax", "outcome-minmax-kind"],
  ["ResponseProcessing>Node", "processing-root"],
  ["ResponseProcessingItem>AssessmentItem", "processing-item"],
  ["ResponseProcessingItem>Edge", "processing-item"],
  ["RuleOperand>Node", "P3"],
  ["TemplateParameterRef>Node", "P13"],
  ["TemplateProcessing>AssessmentItem", "P17"],
  ["TemplateProcessing>Edge", "P17"],
  ["VariableRef>Node", "ref-exists"],
  ["VariableWeightIdentifier>Node", "P12"],
  ["VariableWeightIdentifier>Variable", "P12"],
]);

/**
 * The rule of a containment of the processing model, or nothing when it is not one: by the
 * relation it enters first (the arity seeds, `RuleOperand`, `VariableRef`, `Expression`, `Edge`),
 * then by the exact pair.
 */
const processingContainedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (arityRelations.has(to.relation)) {
    return "P2";
  }

  if (to.relation === "RuleOperand") {
    return "P3";
  }

  if (to.relation === "VariableRef") {
    return "ref-exists";
  }

  if (literalArms.has(from.relation)) {
    return "P7";
  }

  if (to.relation === "Edge" && edgeBoundArms.has(from.relation)) {
    return "condition-edge";
  }

  if (to.relation === "Expression") {
    return "arm-expression";
  }

  return processingContained.get(`${from.relation}>${to.relation}`);
};

const selectedContainedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (from.relation === "AreaMapping" && selects(to, "baseType", "point")) {
    return "area-mapping-point";
  }

  return tableRelations.has(from.relation) && (to.selection?.length ?? 0) > 0
    ? "table-outcome"
    : undefined;
};

/**
 * The rule of a containment by the relation it enters, or by the copy it binds to a node.
 */
const copyContainedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (to.relation === "AttributeAdmission") {
    return "attribute-admission";
  }

  if (to.relation === "ItemToolBoth") {
    return "label-tool";
  }

  if (languageRelations.has(to.relation) || languageRelations.has(from.relation)) {
    return "document-lang";
  }

  if (to.relation === "InteractionBinding") {
    return "binding-exists";
  }

  if (to.relation === "Node" && fieldsAre(to, "id", "kind")) {
    if (fieldsAre(from, "node", "ownerKind")) {
      return "coords-owner";
    }

    if (fieldsAre(from, "node", "kind")) {
      return "attribute-admission";
    }
  }

  if (to.relation === "Edge" && fieldsAre(from, "id", "interaction")) {
    return "choice-parent";
  }

  if (from.relation === "Coords" && from.selection !== undefined && from.selection.length > 0) {
    return "coords-owner";
  }

  return undefined;
};

/**
 * The rule of a containment of the package and resource tables, by the relation it enters.
 */
const entryContainedRule = (to: LawSide): Rule | undefined => {
  if (to.relation === "ResourceTypeOf") {
    return "resource-type";
  }

  if (to.relation === "RootOfType") {
    return "resource-root";
  }

  return to.relation === "Package" && to.fields.includes("schemaversion")
    ? "schema-version"
    : undefined;
};

/**
 * The rule of a containment that leaves `AttributeFileReference`: its path into the package's
 * entries, its document and its node's copy of that document state that an in-package reference
 * names a file the package holds (R6), `file-exists`, the form `Document>PackageEntry` has. Its
 * node and attribute containments are the attribute's own (`copyContainedRule`). That a described
 * file is a `File` is a guard, not a containment (`document-reference`).
 */
const fileReferenceRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (from.relation !== "AttributeFileReference") {
    return undefined;
  }

  return to.relation === "PackageEntry" ||
    to.relation === "Document" ||
    (to.relation === "Node" && fieldsAre(to, "id", "tree"))
    ? "file-exists"
    : undefined;
};

const containedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (from.relation === "LomObjectIdentifier") {
    return "lom-identifier";
  }

  if (from.relation === "LomObjectTitle") {
    return "lom-title";
  }

  const rule =
    copyLeaves.get(from.relation) ??
    schemaVersionCopyRule(from) ??
    fileReferenceRule(from, to) ??
    (attributeValueHosts.has(from.relation) ? "attribute-admission" : undefined) ??
    containedRules.get(`${from.relation}>${to.relation}`) ??
    referenceRules.get(from.relation) ??
    selectedContainedRule(from, to) ??
    processingContainedRule(from, to);
  if (rule !== undefined) {
    return rule;
  }

  return copyContainedRule(from, to) ?? entryContainedRule(to);
};

/**
 * The rule of a pattern, by its regex source. grizzle reports one pattern law for every column
 * that spells the same language, so a source names every column that uses it: `anyUri` is also the
 * `Uri` value arm's, the three DRD URIs', `CsmCaseItemUri.value`'s, `Statistic.context`'s and the
 * two glossaries' (every `anyUri` column of the usage and DRD relations is `uri-syntax` through
 * it); and `hrefInPackage` is the pattern of every path column. A closed vocabulary has no
 * row: its column is a roster handle, so no pattern law names it. The `Literal` value arms share
 * their sources with `DeclaredValue`'s, so a pattern law cannot tell `P7` from `value-lexical`: P7
 * is named by the other laws of the `Literal` arms (the pattern law carries no relation).
 *
 * A source shared with an earlier phase's columns keeps that phase's rule, since the law carries no
 * relation to tell the columns apart: `ncName`, `xsInteger`, `xsDouble`, `pair` and `point` name
 * `value-lexical`, never `drd-value`, `usage-lexical` or `usage-typed-value`. Only a source no
 * earlier column spells names the new rule: the nine DRD vocabularies and the usage date.
 */
const patternRules = new Map<string, Rule>([
  [patterns.anyUri, "uri-syntax"],
  [patterns.ariaRelevantList, "attribute-lexical"],
  [patterns.bcp47, "attribute-lexical"],
  [patterns.classList, "attribute-lexical"],
  [patterns.coords, "P6"],
  [patterns.coordsAny, "attribute-lexical"],
  [patterns.coordsCircle, "attribute-lexical"],
  [patterns.coordsEllipse, "attribute-lexical"],
  [patterns.coordsPoly, "attribute-lexical"],
  [patterns.coordsRect, "attribute-lexical"],
  [patterns.drdAccessMode, "drd-value"],
  [patterns.drdAdaptationDetail, "drd-value"],
  [patterns.drdAdaptationMediaType, "drd-value"],
  [patterns.drdAdaptationType, "drd-value"],
  [patterns.drdApiInteroperable, "drd-value"],
  [patterns.drdControlFlexibility, "drd-value"],
  [patterns.drdDisplayTransformability, "drd-value"],
  [patterns.drdEducationalComplexityOfAdaptation, "drd-value"],
  [patterns.drdHazard, "drd-value"],
  [patterns.floatOrVariableRef, "P6"],
  [patterns.hrefInPackage, "href-path"],
  [patterns.identifierList, "P6"],
  [patterns.integerList, "attribute-lexical"],
  [patterns.integerOrVariableRef, "P6"],
  [patterns.integerOrVariableString, "attribute-lexical"],
  [patterns.intOrIdentifier, "P6"],
  [patterns.lengthDType, "attribute-lexical"],
  [patterns.mimeTypeList, "attribute-lexical"],
  [patterns.ncName, "value-lexical"],
  [patterns.ncNameList, "attribute-lexical"],
  [patterns.ncNameListOrEmpty, "attribute-lexical"],
  [patterns.nonNegativeDouble, "attribute-lexical"],
  [patterns.pair, "value-lexical"],
  [patterns.point, "value-lexical"],
  [patterns.positiveDouble, "normal-maximum"],
  [patterns.positiveInteger, "attribute-lexical"],
  [patterns.printfFormat, "attribute-lexical"],
  [patterns.toleranceList, "P6"],
  [patterns.toolString, "tool-string-length"],
  [patterns.uncollapsed, "attribute-lexical"],
  [patterns.usageDate, "usage-lexical"],
  [patterns.useEnumExt, "attribute-lexical"],
  [patterns.viewList, "attribute-lexical"],
  [patterns.xsDecimal, "attribute-lexical"],
  [patterns.xsDouble, "value-lexical"],
  [patterns.xsInt, "attribute-lexical"],
  [patterns.xsInteger, "value-lexical"],
  [patterns.xsNonNegativeInteger, "attribute-lexical"],
]);

/**
 * The regex source of every pattern that has a row, in the map's order: a read-only view for the
 * test that each row names a pattern the schema still exports.
 */
export const patternRuleSources: readonly string[] = [...patternRules.keys()];

/**
 * Whether a relation is one of the usage-data module's: the data, its statistics, their target
 * objects, values and mappings.
 */
const isUsage = (relation: string): boolean =>
  relation.startsWith("Statistic") ||
  relation.startsWith("TargetObject") ||
  relation.startsWith("Usage") ||
  relation === "CategorizedStatisticArm" ||
  relation === "DeclaredDefaultValue" ||
  relation === "OrdinaryStatisticArm";

const isStatisticArm = (relation: string): boolean =>
  relation === "CategorizedStatisticArm" || relation === "OrdinaryStatisticArm";

const isVariantMetadata = (relation: string): boolean =>
  relation === "VariantMetadata" || relation === "AccessForAllResource";

/**
 * The rule of a key by the relation it constrains, for the relations this phase added. A key over
 * the fields a row names is the rule's; the primary key of a relation that carries a rule is that
 * rule's too, where the relation's rule is one of capacity or identity.
 */
const phaseKeyRule = (relation: string, fields: readonly string[]): Rule | undefined => {
  const key = fields.join(",");

  if (relation === "QtiMetadata") {
    return key === "package,resource" ? "qti-metadata-single" : undefined;
  }

  if (relation === "Variant") {
    return key === "package,identifier" ? "variant-key" : undefined;
  }

  if (relation === "FileMetadata") {
    return fields.includes("file") ? "file-metadata-single" : undefined;
  }

  if (relation.startsWith("Drd")) {
    return fields.includes("owner") ? "drd-single" : undefined;
  }

  if (relation === "ExternalLom") {
    return "external-lom-owner";
  }

  if (isVariantMetadata(relation)) {
    return "variant-metadata";
  }

  if (relation === "ManifestId") {
    return "manifest-id-holder";
  }

  if (relation.startsWith("Csm")) {
    return "csm-single";
  }

  if (relation === "UsageData") {
    return "usage-root";
  }

  if (relation === "OutcomeDocument") {
    return "outcome-document";
  }

  return isUsage(relation) ? "usage-key" : undefined;
};

/**
 * The rule of a capacity by the relation that fills it, for the relations this phase added: the
 * `Edge` rows of a LOM category selected on `parentKind` and `childKind` (R30), a CSM or usage
 * relation, a variant's metadata. An `Edge` capacity on a `Picture` is a content capacity
 * (`capacityRule`) even when it selects `parentKind` too, as does one selected on `childKind`
 * alone.
 */
const phaseCapacityRule = (target: LawSide, from: LawSide): Rule | undefined => {
  if (from.relation === "Edge") {
    return target.relation !== "Picture" &&
      selects(from, "childKind") &&
      selects(from, "parentKind")
      ? "lom-capacity"
      : undefined;
  }

  if (from.relation.startsWith("Csm")) {
    return "csm-capacity";
  }

  if (isVariantMetadata(from.relation)) {
    return "variant-metadata";
  }

  return isUsage(from.relation) ? "usage-count" : undefined;
};

/**
 * The rule of a containment or mirror by the relations on its sides, for the relations this phase
 * added. The side that leaves names the rule, except where a mirror enters a relation whose own
 * rule it is (a document root mirrored by the record or the data it holds, a statistic by its
 * kind's arm, a typed value by its base type).
 */
const packageSidesRule = (from: LawSide, to: LawSide): Rule | undefined => {
  const leaves = from.relation;
  const enters = to.relation;

  if (
    (leaves === "Node" && selects(from, "kind", "qmd:qtiMetadata")) ||
    (enters === "Node" && selects(to, "kind", "qmd:qtiMetadata")) ||
    leaves.startsWith("QtiMetadata")
  ) {
    return "qti-metadata-host";
  }

  if (leaves === "LomValue" && enters === "Edge") {
    return "lom-learning-resource-type";
  }

  if (leaves === "FileMetadata" || leaves === "FileLom") {
    return "file-lom-owner";
  }

  if (leaves === "ExternalLom" || enters === "ExternalLom") {
    return "external-lom-owner";
  }

  if (leaves === "Variant") {
    return enters === "Resource" && !to.fields.includes("id")
      ? "variant-target"
      : "variant-resource";
  }

  if (isVariantMetadata(leaves)) {
    return "variant-metadata";
  }

  if (leaves.startsWith("Drd")) {
    return "drd-single";
  }

  if (leaves.startsWith("ManifestId")) {
    return "manifest-id-holder";
  }

  return undefined;
};

/**
 * The rule of a containment or mirror on the sides of the CSM, usage-data and outcome modules.
 */
const moduleSidesRule = (from: LawSide, to: LawSide): Rule | undefined => {
  const leaves = from.relation;
  const enters = to.relation;

  if (leaves.startsWith("Csm")) {
    return "csm-single";
  }

  if (leaves.startsWith("UsageTypedValue") || enters.startsWith("UsageTypedValue")) {
    return "usage-typed-value";
  }

  if (isStatisticArm(leaves) || isStatisticArm(enters)) {
    return "usage-statistic-kind";
  }

  if (leaves === "UsageData" || enters === "UsageData") {
    return "usage-root";
  }

  if (leaves === "OutcomeDocument" || enters === "OutcomeDocument") {
    return "outcome-document";
  }

  return isUsage(leaves) ? "usage-key" : undefined;
};

/**
 * The rule of a containment or mirror on the relations this phase added.
 */
const phaseSidesRule = (from: LawSide, to: LawSide): Rule | undefined =>
  packageSidesRule(from, to) ?? moduleSidesRule(from, to);

/**
 * The sides an `alternativesArm` law stands for, the arm and the parent it is the payload of: the
 * arm leaves, and the parent is entered selecting its discriminator on the arm's handles. These
 * are the sides the arm-to-parent `mirrors` half named before grizzle reported one law per arm
 * relation, so the same breach keeps its rule.
 */
const armSides = (law: Extract<ImportLaw, { kind: "alternativesArm" }>): [LawSide, LawSide] => [
  { fields: [], relation: law.arm },
  {
    fields: [],
    relation: law.relation,
    selection: law.handles.map((handle) => ({ field: law.field, value: handle })),
  },
];

/**
 * The owners whose child counts the test layer bounds with a capacity filled from `Edge` rows
 * selected on a parent and a child kind (4.15 row 3). The same form bounds a LOM category
 * (`phaseCapacityRule`), told apart by the owner.
 */
const structureOwners: ReadonlySet<string> = new Set([
  "AdaptiveSelection",
  "AssessmentSection",
  "AssessmentStimulus",
  "AssessmentTest",
  "ItemRef",
  "TestFeedback",
  "TestPart",
  "TestRubricBlock",
]);

const structureCapacityRule = (target: LawSide, from: LawSide): Rule | undefined =>
  from.relation === "Edge" && structureOwners.has(target.relation) ? "structure-count" : undefined;

/**
 * The rule of each `alternatives` the test layer states, by the parent it discriminates: the
 * parent's own statement and one law per arm state the same rule.
 */
const testAlternativeRules = new Map<string, Rule>([
  ["BranchRule", "branch-target"],
  ["ItemRefResolution", "item-ref-target"],
  ["PrefixedVariableSource", "prefixed-ref"],
  ["SectionVariableResolution", "section-variable-ref"],
]);

/**
 * The rule of each arm the test layer adds to `VariableRef`. The other arms of that `alternatives`
 * are an earlier phase's.
 */
const variableRefArmRules = new Map<string, Rule>([
  ["ItemInstanceVariableRef", "prefixed-ref"],
  ["ItemVariableRef", "prefixed-ref"],
  ["SectionDurationRef", "prefixed-ref"],
  ["SectionVariableRef", "section-variable-ref"],
]);

/**
 * The thin arms of E18's `SectionVariableResolution`, each mirrored with the hub row it stands
 * for: that mirror is `section-variable-ref`, whichever half of it the engine reports.
 */
const sectionVariableThinArms: ReadonlySet<string> = new Set([
  "SectionVariableDuration",
  "SectionVariablePrefixed",
]);

const testArmRule = (law: Extract<ImportLaw, { kind: "alternativesArm" }>): Rule | undefined =>
  testAlternativeRules.get(law.relation) ??
  (law.relation === "VariableRef" ? variableRefArmRules.get(law.arm) : undefined);

/**
 * The rule of a law over the relations this phase added, or nothing when the law is an earlier
 * phase's (those rows follow). Every `Node` kind with an arm has its own `mirrors` law, so a
 * `qmd:qtiMetadata` that lacks its host arm breaks that handle's law, which the containments and
 * mirrors the expansion states name.
 */
const phaseRule = (law: ImportLaw): Rule | undefined => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return phaseKeyRule(law.relation, law.fields);
  }

  if (law.kind === "capacity") {
    return structureCapacityRule(law.target, law.from) ?? phaseCapacityRule(law.target, law.from);
  }

  if (law.kind === "contained" || law.kind === "mirrors") {
    return phaseSidesRule(law.from, law.to);
  }

  if (law.kind === "alternativesArm") {
    return testArmRule(law) ?? phaseSidesRule(...armSides(law));
  }

  if (law.kind === "alternatives") {
    const testRule = testAlternativeRules.get(law.relation);
    if (testRule !== undefined) {
      return testRule;
    }

    if (law.relation === "ManifestId") {
      return "manifest-id-holder";
    }

    if (law.relation === "QtiMetadata") {
      return "qti-metadata-host";
    }

    return law.relation === "UsageTypedValue" ? "usage-typed-value" : undefined;
  }

  return undefined;
};

/**
 * The three condition roots whose `mirrors` with their `if` arm state that a condition holds an
 * `if`.
 */
const conditionMirrors: ReadonlySet<string> = new Set([
  "OutcomeConditionArm",
  "ResponseConditionArm",
  "TemplateConditionArm",
]);

/**
 * The contracts of the schema that `valueContexts` does not mint, each rule beside the names it
 * judges. A contract is a branded domain, so two contracts of one language are told apart by name
 * here: `CategoryList` is `P6` and `MatchGroupList` `attribute-lexical`,
 * `ExpressionIntegerOrVariable` `P6` and `PrintedVariableIntegerOrVariable` `attribute-lexical`,
 * `ExpressionCoords` `P6` and `ShapeCoords` `attribute-lexical`, `ClassList` `attribute-lexical`
 * and `LomToken` `value-lexical`.
 */
const writtenContractRules: readonly (readonly [Rule, readonly string[]])[] = [
  [
    "attribute-lexical",
    [
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
      "SliderBound",
      "StringCount",
      "TableSpan",
      "TimeLimitSeconds",
      "TrackLanguage",
    ],
  ],
  ["drd-value", ["AccessMode", "AccessModeAdapted"]],
  ["href-path", ["PackagePath", "ResourceEntryHref"]],
  ["manifest-identifier", ["ManifestIdentifier"]],
  ["P6", ["CategoryList", "ExpressionCoords", "ExpressionIntegerOrVariable"]],
  ["tool-string-length", ["ToolName", "ToolVendor", "ToolVersion"]],
  [
    "uri-syntax",
    [
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
  ],
  [
    "usage-lexical",
    [
      "StatisticMeasure",
      "StatisticName",
      "UsageCaseCount",
      "UsageFieldIdentifier",
      "UsageMappingScore",
      "UsagePartIdentifier",
      "UsageValueToken",
    ],
  ],
  [
    "value-lexical",
    [
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
  ],
];

/**
 * The rule of each of the eight contexts of a typed value, for the eight arm contracts
 * `<Context><BaseType>Value` it mints. This repeats the `rule` of `valueContexts` in
 * `schema/value.ts`, which this module cannot import: that module imports this one's `Rule`.
 */
const armContextRules: readonly (readonly [string, Rule])[] = [
  ["Declared", "value-lexical"],
  ["InterpolationDefault", "attribute-lexical"],
  ["InterpolationTarget", "attribute-lexical"],
  ["Literal", "P7"],
  ["MapKey", "map-key-lexical"],
  ["MatchDefault", "attribute-lexical"],
  ["MatchTarget", "attribute-lexical"],
  ["Usage", "usage-typed-value"],
];

/**
 * The contexts whose Uri arm refuses by the anyUri pattern rather than its context's rule: the
 * merged tree refuses a bad URI in these columns under `uri-syntax`, and a moved refusal keeps its
 * rule (decision 150).
 */
const uriSyntaxContexts: ReadonlySet<string> = new Set([
  "Declared",
  "InterpolationDefault",
  "InterpolationTarget",
  "MatchDefault",
  "MatchTarget",
]);

const armBaseTypes = [
  "DirectedPair",
  "Duration",
  "Float",
  "Identifier",
  "Integer",
  "Pair",
  "Point",
  "Uri",
] as const;

/**
 * The rule each named contract of the schema maps to: the written-out contracts, then the 64 arms.
 * A contract no row names falls to {@link nearest}, `value-lexical`, unmapped.
 */
const contractRules: ReadonlyMap<string, Rule> = new Map([
  ...writtenContractRules.flatMap(([rule, names]) =>
    names.map((name): [string, Rule] => [name, rule]),
  ),
  ...armContextRules.flatMap(([context, rule]) =>
    armBaseTypes.map((base): [string, Rule] => [
      `${context}${base}Value`,
      base === "Uri" && uriSyntaxContexts.has(context) ? "uri-syntax" : rule,
    ]),
  ),
]);

const some = (rule: Rule | undefined): Mapped | undefined =>
  rule === undefined ? undefined : named(rule);

const recognized = (law: ImportLaw): Mapped | undefined => {
  const added = phaseRule(law);
  if (added !== undefined) {
    return named(added);
  }

  if (law.kind === "key" || law.kind === "primaryKey") {
    return some(keyRule(law.relation, law.fields));
  }

  if (law.kind === "check") {
    return some(checkRules.get(law.name) ?? checkRuleByForm(law.relation, law.name));
  }

  if (law.kind === "capacity") {
    return some(capacityRule(law.target, law.from));
  }

  if (law.kind === "contained") {
    return some(containedRule(law.from, law.to));
  }

  if (law.kind === "mirrors") {
    if (
      sectionVariableThinArms.has(law.from.relation) ||
      sectionVariableThinArms.has(law.to.relation)
    ) {
      return named("section-variable-ref");
    }

    const between = new Set([law.from.relation, law.to.relation]);

    if (conditionMirrors.has(law.from.relation) || conditionMirrors.has(law.to.relation)) {
      return named("P4");
    }

    return between.has("ResponseProcessing") && between.has("ResponseProcessingItem")
      ? named("processing-item")
      : undefined;
  }

  if (law.kind === "alternativesArm") {
    return conditionMirrors.has(law.arm) ? named("P4") : undefined;
  }

  if (law.kind === "pattern") {
    return some(patternRules.get(law.source)) ?? { mapped: false, rule: "value-lexical" };
  }

  if (law.kind === "contract") {
    return some(contractRules.get(law.contract));
  }

  return undefined;
};

const classify = (law: ImportLaw): Mapped => recognized(law) ?? nearest(law);

/**
 * The rule of the roster a schema law maps to.
 *
 * A law is matched by its kind and the relations and fields it names, against the statements `Qti`
 * declares. A law no row names falls to the nearest rule by kind; {@link refusalOfLaw} keeps such a
 * law verbatim in `detail`, and `isMappedLaw` tells the two apart.
 *
 * @param law - The `law` of an `invariant-rejected` outcome.
 * @returns The rule the law breaks.
 */
export const ruleOfLaw = (law: ImportLaw): Rule => classify(law).rule;

/**
 * Whether {@link ruleOfLaw} recognized the law, not merely sorted it.
 *
 * @param law - The `law` of an `invariant-rejected` outcome.
 * @returns False when the law fell to the nearest rule; a test reports it as a finding.
 */
export const isMappedLaw = (law: ImportLaw): boolean => classify(law).mapped;

const sideText = (side: LawSide): string => `${side.relation}(${side.fields.join(", ")})`;

const lawText = (law: ImportLaw): string => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return `${law.kind === "key" ? "key" : "primary key"} ${law.relation}.(${law.fields.join(", ")})`;
  }

  if (law.kind === "check") {
    return `check ${law.relation}.${law.name}`;
  }

  if (law.kind === "contained" || law.kind === "mirrors" || law.kind === "coverage") {
    return `${law.kind} ${sideText(law.from)} into ${sideText(law.to)}`;
  }

  if (law.kind === "capacity") {
    return `capacity of ${sideText(law.target)} by ${sideText(law.from)}`;
  }

  if (law.kind === "alternatives") {
    return `alternatives ${law.relation}.${law.field}`;
  }

  if (law.kind === "alternativesArm") {
    return `alternatives arm ${law.arm} of ${law.relation}.${law.field}`;
  }

  if (law.kind === "contract") {
    return `contract ${law.contract}`;
  }

  if (law.kind === "numericBound") {
    return `numeric bound ${law.relation}.${law.field}`;
  }

  return `pattern ${law.source} (flags ${law.flags})`;
};

/**
 * The witness of an `invariant-rejected` outcome, as grizzle's `Witness` states it.
 */
export type ImportWitness =
  | { readonly kind: "key"; readonly relation: string; readonly values: object }
  | { readonly kind: "unreported" | "withheld" };

const witnessText = (witness: ImportWitness): string =>
  witness.kind === "key"
    ? `, witness ${witness.relation} ${Object.entries(witness.values)
        .map(([field, value]) => `${field}=${String(value)}`)
        .join(" ")}`
    : "";

/**
 * The refusal of an `invariant-rejected` outcome.
 *
 * `detail` names the law as the schema states it, and the witness row's key when grizzle gives one;
 * a law no row of the map names says so, under the nearest rule. The law itself rides in `law`.
 *
 * @param law - The `law` of the outcome.
 * @param witness - The `witness` of the outcome, when the caller has it; only a key witness is
 *   named.
 * @returns The refusal naming the rule.
 */
export const refusalOfLaw = (law: ImportLaw, witness?: ImportWitness): ImportRefused => {
  const { mapped, rule } = classify(law);
  const unmapped = mapped ? "" : "no rule names this law, so it is filed under the nearest: ";

  return new ImportRefused({
    detail: `${unmapped}${lawText(law)}${witness === undefined ? "" : witnessText(witness)}`,
    law,
    rule,
  });
};

/**
 * Every error that refuses an import before the database does, an `ImportRefused` the importer
 * raised itself among them.
 */
export type ReadRefusal =
  | ExternalRefusal
  | GuardRefusal
  | ImportRefused
  | ItemGuardRefusal
  | ItemRefusal
  | ManifestGuardRefusal
  | NotQti3
  | PackageReadError
  | ProcessingGuardRefusal
  | ProcessingRefused
  | ReaderRefusal
  | ReferenceGuardRefusal
  | TestGuardRefusal
  | UnmodeledVocabulary
  | UsageGuardRefusal
  | WellFormednessError
  | WildcardGuardRefusal
  | ZipRefusal;

/**
 * The refusal of an error a guard or the reader raised.
 *
 * A guard's `rule` is the rule of the same name; `PackageReadError` maps by its own rule, a missing
 * manifest to `manifest-root` and an entry path outside the package to `href-path` (R8's pattern
 * law names the same cause); `ItemRefusal` names the importer rule it carries (`import/tree.ts`).
 * An `ImportRefused` is a refusal the importer raised itself before the write (`closedOf`,
 * `integerOf`, `spelledInteger`); it already names its rule and is its own answer.
 *
 * `ContentGuardRefusal` is accepted beside {@link ReadRefusal}, not inside it: `ReadRefusal` is the
 * error channel `import/package.ts` narrows to, and the content guards join that channel when
 * `guards.ts` composes them.
 *
 * @param e - The error raised.
 * @returns The refusal naming its rule.
 */
export const ruleOfError = (e: ContentGuardRefusal | ReadRefusal): ImportRefused =>
  Match.value(e).pipe(
    Match.tagsExhaustive({
      ContentGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ExternalRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      GuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ImportRefused: (g) => g,
      ItemGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ItemRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ManifestGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      NotQti3: (g) => new ImportRefused({ detail: g.detail, rule: "not-qti3" }),
      PackageReadError: (g) =>
        new ImportRefused({
          detail: g.message,
          rule: g.rule === "manifest-root" ? "manifest-root" : "href-path",
        }),
      ProcessingGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ProcessingRefused: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ReaderRefusal: (g) =>
        new ImportRefused({ detail: `${g.rule}: ${g.detail}`, rule: "reader-refusal" }),
      ReferenceGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      TestGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      UnmodeledVocabulary: (g) =>
        new ImportRefused({
          detail: `${g.kind} ${g.name}${g.parent._tag === "Some" ? ` in ${g.parent.value}` : ""} has no model yet`,
          rule: "unmodeled-vocabulary",
        }),
      UsageGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      WellFormednessError: (g) =>
        new ImportRefused({
          detail: `${g.message} at line ${g.line}, column ${g.column}`,
          rule: "well-formedness",
        }),
      WildcardGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ZipRefusal: (g) => new ImportRefused({ detail: `${g.entry}: ${g.feature}`, rule: g.rule }),
    }),
  );

if (import.meta.main) {
  process.stdout.write(`ImportRule: ${ImportRule.members.length} names\n`);
}
