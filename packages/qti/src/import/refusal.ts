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
import type { ContentGuardRefusal } from "#qti/import/guards/content.ts";
import type { GuardRefusal } from "#qti/import/guards/tree.ts";
import type { ItemGuardRefusal } from "#qti/import/guards/item.ts";
import type { ManifestGuardRefusal } from "#qti/import/guards/manifest.ts";
import type { NotQti3 } from "#qti/import/manifest.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { PackageReadError } from "#qti/package/read.ts";
import * as patterns from "#qti/schema/patterns.ts";
import type { ReaderRefusal, WellFormednessError } from "#qti/xml/errors.ts";

/**
 * Every name a refused import may carry: the rules the schema holds at commit, the guards that run
 * before the apply and the reader's refusals.
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
  "bcp47-syntax",
  "attribute-admission",
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
 * values the statement selects on it. `selection` is absent on a hand-written law and empty on a
 * side that selects nothing.
 */
interface LawSide {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection?: readonly { readonly field: string; readonly value: SelectedValue }[];
}

/**
 * Whether a side selects `field` equal to `value`.
 */
const selects = (side: LawSide, field: string, value: string): boolean =>
  side.selection?.some((pair) => pair.field === field && pair.value === value) ?? false;

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
  | { readonly from: LawSide; readonly kind: "capacity"; readonly target: LawSide }
  | { readonly contract: string; readonly kind: "contract" }
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

  if (law.kind === "check" || law.kind === "capacity") {
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
  ["InteractionBinding.(document,responseIdentifier)", "binding-key"],
  ["ItemBody.(item)", "body-single"],
  ["LomGeneral.(lom)", "lom-general-single"],
  ["LomGeneralTitle.(lom)", "lom-title-single"],
  ["LomObjectIdentifier.(lom)", "lom-identifier"],
  ["LomObjectTitle.(lom)", "lom-title"],
  ["Manifest.(id)", "manifest-identifier"],
  ["ManifestMetadata.(manifest)", "manifest-children"],
  ["ManifestSchema.(metadata)", "schema-single"],
  ["ManifestSchemaVersion.(metadata)", "schema-single"],
  ["Organizations.(manifest)", "manifest-children"],
  ["Package.(id)", "manifest-identifier"],
  ["Prompt.(parent)", "prompt-single"],
  ["QtiMetadata.(resource)", "qti-metadata-single"],
  ["Resource.(package,identifier)", "resource-identifier"],
  ["ResourceMetadata.(resource)", "resource-metadata-single"],
  ["Resources.(manifest)", "manifest-children"],
  ["ResponseProcessingItem.(item)", "processing-single"],
  ["SimpleChoice.(interaction,identifier)", "choice-key"],
  ["TypedDeclaration.(document,identifier)", "declaration-key"],
  ["StringBinding.(document,identifier)", "string-binding"],
  ["ResourceLomGeneral.(package,resource)", "document-lang"],
  ["ResourceLomLanguageSet.(package,resource,value)", "document-lang"],
  ["ValueSet.(declaration,role)", "value-set-role"],
]);

const keyRule = (relation: string, fields: readonly string[]): Rule | undefined => {
  const rule = keyRules.get(`${relation}.(${fields.join(",")})`);
  if (rule !== undefined) {
    return rule;
  }

  if (relation === "AttributeLexical") {
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
  ["BdoDirNotAuto", "bdo-dir"],
  ["BindingMax", "binding-max"],
  ["ChoiceBounds", "choice-bounds"],
  ["ChoiceTemplateRefType", "template-ref"],
  ["DeclarationNotReserved", "declaration-reserved"],
  ["DependencyNotSelf", "dependency-target"],
  ["FeedbackOutcomeRefType", "feedback-ref"],
  ["GapImgBounds", "choice-bounds"],
  ["GapMatchBounds", "choice-bounds"],
  ["GapTextBounds", "choice-bounds"],
  ["GraphicAssociateBounds", "choice-bounds"],
  ["GraphicGapMatchBounds", "choice-bounds"],
  ["GraphicOrderChoiceBounds", "choice-bounds"],
  ["HottextChoiceBounds", "choice-bounds"],
  ["HotspotChoiceBounds", "choice-bounds"],
  ["MatchBounds", "choice-bounds"],
  ["MediaPlays", "choice-bounds"],
  ["NoDefaultHotspotInGraphicGapMatch", "hotspot-default"],
  ["NodeLabelNotRoot", "attribute-admission"],
  ["OrderChoiceBounds", "choice-bounds"],
  ["PositionObjectChoiceBounds", "choice-bounds"],
  ["PrintedVariableRefKind", "printed-variable-ref"],
  ["PrintedVariableVarRefType", "printed-variable-ref"],
  ["ProcessingRoot", "processing-root"],
  ["ReservedOutcomeTypes", "reserved-type"],
  ["SelectPointChoiceBounds", "choice-bounds"],
  ["SimpleAssociableChoiceBounds", "choice-bounds"],
  ["TemplateContentRefType", "template-ref"],
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
  ["AssociableHotspot<Coords", "coords-owner"],
  ["ChoiceInteraction<SimpleChoice", "choice-present"],
  ["ColgroupSpan<Edge", "colgroup-span"],
  ["Details<Edge", "details-summary"],
  ["Document<DocumentIdentifier", "root-identifier"],
  ["Document<DocumentTitle", "root-title"],
  ["GapMatchBinding<Gap", "gap-multiple"],
  ["GraphicOrderInteraction<HotspotChoice", "order-choice-count"],
  ["HotspotChoice<Coords", "coords-owner"],
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
  ["Resource<File", "resource-file-present"],
  ["ResourceLomIdentified<LomIdentifier", "lom-identifier"],
  ["ResourceLomIdentified<LomObjectIdentifier", "lom-identifier"],
  ["ResourceLomTitled<LomGeneralTitle", "lom-title-single"],
  ["ResourceLomTitled<LomObjectTitle", "lom-title"],
  ["Table<Edge", "table-parts"],
  ["TypedValueSet<DeclaredValue", "value-single"],
  ["ValueSet<DeclaredValue", "value-present"],
]);

/**
 * The rule of a capacity. A capacity is named by the relation it bounds and the one that fills it;
 * the two `Picture` capacities fill from the same `Edge` and differ by the child kind they select.
 */
const capacityRule = (target: LawSide, from: LawSide): Rule | undefined => {
  if (target.relation === "Picture" && from.relation === "Edge") {
    if (selects(from, "childKind", "img")) {
      return "picture-img";
    }

    return selects(from, "childKind", "source") ? "picture-source" : undefined;
  }

  return capacityRules.get(`${target.relation}<${from.relation}`);
};

/**
 * The rule of a containment, by the relation it leaves and the one it enters, as `from>to`.
 */
const containedRules = new Map<string, Rule>([
  ["AssessmentItemLabel>ItemToolBoth", "label-tool"],
  ["ContextDeclarationArm>ContextDeclarationId", "context-id"],
  ["DeclaredValue>TypedValueSet", "value-base-type"],
  ["Dependency>Resource", "dependency-target"],
  ["Document>PackageEntry", "file-exists"],
  ["Edge>Admission", "admission"],
  ["Edge>AncestryStep", "ancestry-step"],
  ["File>PackageEntry", "file-exists"],
  ["FileContent>PackageEntry", "file-exists"],
  ["HeadersTarget>AttributeIdref", "idref-copy"],
  ["InteractionBinding>AssessmentItem", "adaptive-feedback"],
  ["InteractionBinding>Declaration", "binding-declared"],
  ["Mapping>MappableBaseType", "mapping-base-type"],
  ["Node>AncestryStep", "ancestry-ban"],
  ["RecordBinding>RecordBindingFit", "record-binding-fit"],
  ["ResponseProcessing>TreeRoot", "processing-root"],
  ["SimpleChoice>ChoiceInteraction", "choice-parent"],
  ["SimpleChoice>Edge", "choice-parent"],
  ["Source>SourceSrcset", "source-srcset"],
  ["Track>TrackSrclang", "track-srclang"],
  ["TypedBinding>BindingFit", "binding-fit"],
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
  ["StringBinding", "string-binding"],
  ["TemplateContentRef", "template-ref"],
]);

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

const containedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (from.relation === "LomObjectIdentifier") {
    return "lom-identifier";
  }

  if (from.relation === "LomObjectTitle") {
    return "lom-title";
  }

  const rule =
    containedRules.get(`${from.relation}>${to.relation}`) ??
    referenceRules.get(from.relation) ??
    selectedContainedRule(from, to);
  if (rule !== undefined) {
    return rule;
  }

  return copyContainedRule(from, to) ?? entryContainedRule(to);
};

/**
 * The rule of a pattern, by its regex source. grizzle reports one pattern law for every column
 * that spells the same language, so a source names every column that uses it: `anyUri` is also the
 * `Uri` value arm's, and `hrefInPackage` is the pattern of every path column.
 */
const patternRules = new Map<string, Rule>([
  [patterns.align, "attribute-lexical"],
  [patterns.anyUri, "uri-syntax"],
  [patterns.ariaAutocomplete, "attribute-lexical"],
  [patterns.ariaChecked, "attribute-lexical"],
  [patterns.ariaCurrent, "attribute-lexical"],
  [patterns.ariaExpanded, "attribute-lexical"],
  [patterns.ariaInvalid, "attribute-lexical"],
  [patterns.ariaLive, "attribute-lexical"],
  [patterns.ariaRelevantList, "attribute-lexical"],
  [patterns.ariaRole, "attribute-lexical"],
  [patterns.ariaSort, "attribute-lexical"],
  [patterns.bcp47, "attribute-lexical"],
  [patterns.booleanLiteral, "value-lexical"],
  [patterns.classList, "attribute-lexical"],
  [patterns.coordsAny, "attribute-lexical"],
  [patterns.coordsCircle, "attribute-lexical"],
  [patterns.coordsEllipse, "attribute-lexical"],
  [patterns.coordsPoly, "attribute-lexical"],
  [patterns.coordsRect, "attribute-lexical"],
  [patterns.crossorigin, "attribute-lexical"],
  [patterns.dirEnum, "attribute-lexical"],
  [patterns.hrefInPackage, "href-path"],
  [patterns.integerList, "attribute-lexical"],
  [patterns.integerOrVariableString, "attribute-lexical"],
  [patterns.lengthDType, "attribute-lexical"],
  [patterns.mimeTypeList, "attribute-lexical"],
  [patterns.ncName, "value-lexical"],
  [patterns.ncNameList, "attribute-lexical"],
  [patterns.ncNameListOrEmpty, "attribute-lexical"],
  [patterns.nonNegativeDouble, "attribute-lexical"],
  [patterns.orientation, "attribute-lexical"],
  [patterns.pair, "value-lexical"],
  [patterns.point, "value-lexical"],
  [patterns.positiveDouble, "normal-maximum"],
  [patterns.positiveInteger, "attribute-lexical"],
  [patterns.preload, "attribute-lexical"],
  [patterns.printfFormat, "attribute-lexical"],
  [patterns.scope, "attribute-lexical"],
  [patterns.showHide, "attribute-lexical"],
  [patterns.suppressTts, "attribute-lexical"],
  [patterns.textFormat, "attribute-lexical"],
  [patterns.toolString, "tool-string-length"],
  [patterns.trackKind, "attribute-lexical"],
  [patterns.uncollapsed, "attribute-lexical"],
  [patterns.useEnumExt, "attribute-lexical"],
  [patterns.valign, "attribute-lexical"],
  [patterns.valuetype, "attribute-lexical"],
  [patterns.viewList, "attribute-lexical"],
  [patterns.xsBoolean, "attribute-lexical"],
  [patterns.xsDecimal, "attribute-lexical"],
  [patterns.xsDouble, "value-lexical"],
  [patterns.xsInt, "attribute-lexical"],
  [patterns.xsInteger, "value-lexical"],
  [patterns.xsNonNegativeInteger, "attribute-lexical"],
]);

const some = (rule: Rule | undefined): Mapped | undefined =>
  rule === undefined ? undefined : named(rule);

const recognized = (law: ImportLaw): Mapped | undefined => {
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
    const between = new Set([law.from.relation, law.to.relation]);

    return between.has("ResponseProcessing") && between.has("ResponseProcessingItem")
      ? named("processing-item")
      : undefined;
  }

  if (law.kind === "pattern") {
    return some(patternRules.get(law.source)) ?? { mapped: false, rule: "value-lexical" };
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

  if (law.kind === "contract") {
    return `contract ${law.contract}`;
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
 * Every error that refuses an import before the database does.
 */
export type ReadRefusal =
  | GuardRefusal
  | ItemGuardRefusal
  | ItemRefusal
  | ManifestGuardRefusal
  | NotQti3
  | PackageReadError
  | ReaderRefusal
  | UnmodeledVocabulary
  | WellFormednessError;

/**
 * The refusal of an error a guard or the reader raised.
 *
 * A guard's `rule` is the rule of the same name; `PackageReadError` maps by its own rule, a missing
 * manifest to `manifest-root` and an entry path outside the package to `href-path` (R8's pattern
 * law names the same cause); `ItemRefusal` is `binding-declared` or `typed-copy`.
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
      GuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ItemGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ItemRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ManifestGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      NotQti3: (g) => new ImportRefused({ detail: g.detail, rule: "not-qti3" }),
      PackageReadError: (g) =>
        new ImportRefused({
          detail: g.message,
          rule: g.rule === "manifest-root" ? "manifest-root" : "href-path",
        }),
      ReaderRefusal: (g) =>
        new ImportRefused({ detail: `${g.rule}: ${g.detail}`, rule: "reader-refusal" }),
      UnmodeledVocabulary: (g) =>
        new ImportRefused({
          detail: `${g.kind} ${g.name}${g.parent._tag === "Some" ? ` in ${g.parent.value}` : ""} has no model yet`,
          rule: "unmodeled-vocabulary",
        }),
      WellFormednessError: (g) =>
        new ImportRefused({
          detail: `${g.message} at line ${g.line}, column ${g.column}`,
          rule: "well-formedness",
        }),
    }),
  );

if (import.meta.main) {
  process.stdout.write(`ImportRule: ${ImportRule.members.length} names\n`);
}
